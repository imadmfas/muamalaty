// Notification service (module 655) — fixed in v1.1.0.
//
// Changes from v1.0.0:
// - Triggers use the typed form `{ type: 'date' | 'daily', ... }` required by current
//   expo-notifications (bare Date triggers are rejected), and an Android channel is created.
// - Empty / invalid dates are ignored instead of throwing.
// - New scheduleDailyNotification() for repeating medication reminders.
// - School reminder wording follows the child's gender.
// - Web: expo-notifications cannot schedule on the web, so reminders are kept in
//   localStorage and shown with the browser Notification API while the app is open
//   (checked on launch and every minute).
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const isWeb = Platform.OS === 'web';
const ANDROID_CHANNEL = 'muamalaty-reminders';

if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'تذكيرات معاملاتي',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    }).catch(() => {});
  }
}

// ---------------- web fallback ----------------
const WEB_KEY = '@muamalaty_web_reminders';
const readWeb = () => {
  try { return JSON.parse(globalThis.localStorage?.getItem(WEB_KEY) || '[]'); } catch { return []; }
};
const writeWeb = (list) => {
  try { globalThis.localStorage?.setItem(WEB_KEY, JSON.stringify(list)); } catch {}
};
const webNotify = (title, body) => {
  try {
    if (globalThis.Notification?.permission === 'granted') {
      new globalThis.Notification(title, { body, icon: '/muamalaty/icon-192.png', lang: 'ar', dir: 'rtl' });
    }
  } catch {}
};
const checkWebReminders = () => {
  const now = Date.now();
  const list = readWeb();
  let changed = false;
  for (const r of list) {
    if (r.at <= now) {
      webNotify(r.title, r.body);
      changed = true;
      if (r.daily) {
        while (r.at <= now) r.at += 86400000;
      } else {
        r.done = true;
      }
    }
  }
  if (changed) writeWeb(list.filter((r) => !r.done));
};
if (isWeb && typeof window !== 'undefined') {
  setTimeout(checkWebReminders, 3000);
  setInterval(checkWebReminders, 60000);
}

// ---------------- shared helpers ----------------
const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

export const requestNotificationPermissions = async () => {
  if (isWeb) {
    const N = globalThis.Notification;
    if (!N) return true; // still keep the reminder in the in-app list
    if (N.permission === 'default') {
      try { await N.requestPermission(); } catch {}
    }
    return true;
  }
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
};

const schedule = async (id, title, body, trigger) => {
  await cancelNotification(id);
  const granted = await requestNotificationPermissions();
  if (!granted) return null;
  if (isWeb) {
    const at = trigger.type === 'daily'
      ? (() => {
          const d = new Date();
          d.setHours(trigger.hour, trigger.minute, 0, 0);
          if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
          return d.getTime();
        })()
      : trigger.date.getTime();
    writeWeb([...readWeb(), { id, title, body, at, daily: trigger.type === 'daily' }]);
    return id;
  }
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data: { reminderId: id } },
    trigger: Platform.OS === 'android' ? { ...trigger, channelId: ANDROID_CHANNEL } : trigger,
  });
};

const dateTrigger = (date) => ({ type: Notifications.SchedulableTriggerInputTypes?.DATE ?? 'date', date });

// Fires 30 days before `expiryDateStr`. If that moment already passed but the
// expiry is still in the future -> fires in 1 minute. Past expiry -> nothing.
export const scheduleExpiryNotification = async (id, title, body, expiryDateStr) => {
  try {
    if (!expiryDateStr) return null;
    const expiryDate = new Date(expiryDateStr);
    if (!isValidDate(expiryDate)) return null;
    const now = new Date();
    const triggerDate = new Date(expiryDate.getTime());
    triggerDate.setDate(triggerDate.getDate() - 30);

    if (triggerDate.getTime() <= now.getTime()) {
      if (!(expiryDate.getTime() > now.getTime())) return null;
      triggerDate.setTime(now.getTime() + 60000);
    }
    return await schedule(id, title, body, dateTrigger(triggerDate));
  } catch (error) {
    console.warn('Failed to schedule notification:', error);
    return null;
  }
};

// Fires 3 months before the child's 6th birthday. If that moment has passed and the
// child is between 5.5 and 6.5 years old -> fires in 1 minute; otherwise nothing.
export const scheduleSchoolAgeNotification = async (childId, childName, birthDateStr, relationship) => {
  try {
    const birthDate = new Date(birthDateStr);
    if (!isValidDate(birthDate)) return null;
    const now = new Date();
    const sixthBirthday = new Date(birthDate.getFullYear() + 6, birthDate.getMonth(), birthDate.getDate());
    const triggerDate = new Date(sixthBirthday.getTime());
    triggerDate.setMonth(triggerDate.getMonth() - 3);

    if (triggerDate.getTime() <= now.getTime()) {
      const ageInYears = (now.getTime() - birthDate.getTime()) / 31557600000;
      if (!(5.5 <= ageInYears) || !(ageInYears < 6.5)) return null;
      triggerDate.setTime(now.getTime() + 60000);
    }

    const isGirl = relationship === 'بنت';
    const title = (isGirl ? '🎒 تسجيل المدرسة للطفلة ' : '🎒 تسجيل المدرسة للطفل ') + childName;
    const body =
      (isGirl ? 'ابنتك البطلة ' : 'ابنك البطل ') +
      childName +
      (isGirl ? ' قارب عمرها' : ' قارب عمره') +
      ' الـ 6 سنوات! حان الوقت للتحضير لتسجيل الأول الابتدائي. يرجى تهيئة: البطاقة الوطنية، صور شخصية، وفحص اللياقة الطبي، والتوجه لأقرب مدرسة ابتدائية بمحلتك.';

    return await schedule('school_' + childId, title, body, dateTrigger(triggerDate));
  } catch (error) {
    console.warn('Failed to schedule school notification:', error);
    return null;
  }
};

// Cancels every scheduled notification whose content.data.reminderId === id.
export const cancelNotification = async (id) => {
  try {
    if (isWeb) {
      writeWeb(readWeb().filter((r) => r.id !== id));
      return;
    }
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const data = notification.content.data;
      if (data && data.reminderId === id) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.warn('Failed to cancel notification:', error);
  }
};

export const cancelAllNotifications = async () => {
  try {
    if (isWeb) return writeWeb([]);
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Failed to cancel all notifications:', error);
  }
};

// One-shot notification at `triggerDate` (a Date). Past dates -> fires in 1 minute.
export const scheduleCustomNotification = async (id, title, body, triggerDate) => {
  try {
    if (!isValidDate(triggerDate)) return null;
    const now = new Date();
    const finalTrigger = triggerDate.getTime() <= now.getTime() ? new Date(now.getTime() + 60000) : triggerDate;
    return await schedule(id, title, body, dateTrigger(finalTrigger));
  } catch (error) {
    console.warn('Failed to schedule custom notification:', error);
    return null;
  }
};

// Repeats every day at hour:minute (medication reminders).
export const scheduleDailyNotification = async (id, title, body, hour, minute) => {
  try {
    const trigger = { type: Notifications.SchedulableTriggerInputTypes?.DAILY ?? 'daily', hour, minute };
    return await schedule(id, title, body, trigger);
  } catch (error) {
    console.warn('Failed to schedule daily notification:', error);
    return null;
  }
};
