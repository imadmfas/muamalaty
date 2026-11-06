// Reconstructed from Hermes bundle — module 655 (notification service)
import * as Notifications from 'expo-notifications';
import 'react-native'; // required by the original module but no export is used

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === 'granted';
};

// Fires 30 days before `expiryDateStr` (same time-of-day as the parsed date).
// If that moment already passed but the expiry is still in the future -> fires in 1 minute.
// If the expiry itself already passed -> nothing is scheduled.
export const scheduleExpiryNotification = async (id, title, body, expiryDateStr) => {
  try {
    const expiryDate = new Date(expiryDateStr);
    const now = new Date();
    const triggerDate = new Date(expiryDate.getTime());
    triggerDate.setDate(triggerDate.getDate() - 30);

    if (triggerDate.getTime() <= now.getTime()) {
      if (!(expiryDate.getTime() > now.getTime())) return null;
      triggerDate.setTime(now.getTime() + 60000);
    }

    await cancelNotification(id);

    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { reminderId: id },
      },
      trigger: triggerDate,
    });
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
};

// Fires 3 months before the child's 6th birthday. If that moment has passed and the
// child is between 5.5 and 6.5 years old -> fires in 1 minute; otherwise nothing.
export const scheduleSchoolAgeNotification = async (childId, childName, birthDateStr) => {
  try {
    const birthDate = new Date(birthDateStr);
    const now = new Date();
    const sixthBirthday = new Date(birthDate.getFullYear() + 6, birthDate.getMonth(), birthDate.getDate());
    const triggerDate = new Date(sixthBirthday.getTime());
    triggerDate.setMonth(triggerDate.getMonth() - 3);

    if (triggerDate.getTime() <= now.getTime()) {
      const ageInYears = (now.getTime() - birthDate.getTime()) / 31557600000;
      if (!(5.5 <= ageInYears) || !(ageInYears < 6.5)) return null;
      triggerDate.setTime(now.getTime() + 60000);
    }

    const reminderId = 'school_' + childId;
    await cancelNotification(reminderId);

    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    const title = '🎒 تسجيل المدرسة للطفل ' + childName;
    const body =
      'ابنك البطل ' +
      childName +
      ' قارب عمره الـ 6 سنوات! حان الوقت للتحضير لتسجيل الأول الابتدائي. يرجى تهيئة: البطاقة الوطنية، صور شخصية، وفحص اللياقة الطبي، والتوجه لأقرب مدرسة ابتدائية بمحلتك.';

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { reminderId },
      },
      trigger: triggerDate,
    });
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule school notification:', error);
    return null;
  }
};

// Cancels every scheduled notification whose content.data.reminderId === id.
export const cancelNotification = async (id) => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const data = notification.content.data;
      if (data && data.reminderId === id) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel all notifications:', error);
  }
};

// One-shot notification at `triggerDate` (a Date). Past dates -> fires in 1 minute.
export const scheduleCustomNotification = async (id, title, body, triggerDate) => {
  try {
    let finalTrigger = triggerDate;
    const now = new Date();
    if (triggerDate.getTime() <= now.getTime()) {
      finalTrigger = new Date(now.getTime() + 60000);
    }

    await cancelNotification(id);

    const granted = await requestNotificationPermissions();
    if (!granted) return null;

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: { reminderId: id },
      },
      trigger: finalTrigger,
    });
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule custom notification:', error);
    return null;
  }
};
