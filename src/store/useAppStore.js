// Reconstructed from Hermes bundle — module 641 (zustand app store)
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecurityService from '../services/securityService';
import * as NotificationService from '../services/notificationService';

// AsyncStorage (plain JSON)
const PREFS_KEY = '@muamalaty_prefs';
const FAVORITES_KEY = '@muamalaty_favorites';
const SEARCHES_KEY = '@muamalaty_searches';
const EXPIRIES_KEY = '@muamalaty_expiries';
const LOCATION_KEY = '@muamalaty_location'; // inlined literal in the original
// SecurityService.setSecureItem (AES-256-GCM encrypted JSON in AsyncStorage since v1.1.0)
const SEC_HEAD_KEY = '@muamalaty_sec_head';
const SEC_MEMBERS_KEY = '@muamalaty_sec_members';
const SEC_USER_KEY = '@muamalaty_sec_user';
const SEC_VACCINES_KEY = '@muamalaty_sec_vaccines';
const SEC_MEDICATIONS_KEY = '@muamalaty_sec_medications';

export const useAppStore = create((set, get) => ({
  isDarkMode: false,
  favorites: [],
  recentSearches: [],
  familyHead: null,
  familyMembers: [],
  drivingLicenseExpiry: null,
  vehicleAnnualExpiry: null,
  rationCardUpdate: null,
  notificationsEnabled: true,
  // v1.1.0: no lock until the user actually creates a PIN (v1.0.0 started locked
  // with a hard-coded test PIN 1234 printed on the lock screen).
  pinLockEnabled: false,
  biometricLockEnabled: false,
  isLocked: false,
  isHydrated: false,
  currentUser: null,
  childVaccines: [],
  chronicMedications: [],
  selectedGovernorate: 'بغداد',
  selectedDistrict: 'الرصافة',

  toggleDarkMode: async () => {
    const newMode = !get().isDarkMode;
    set({ isDarkMode: newMode });
    await AsyncStorage.setItem(
      PREFS_KEY,
      JSON.stringify({
        isDarkMode: newMode,
        notificationsEnabled: get().notificationsEnabled,
        pinLockEnabled: get().pinLockEnabled,
        biometricLockEnabled: get().biometricLockEnabled,
      })
    );
  },

  setSelectedLocation: async (gov, dist) => {
    set({ selectedGovernorate: gov, selectedDistrict: dist });
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify({ gov, dist }));
  },

  addFavorite: async (serviceId) => {
    const updated = Array.from(new Set([...get().favorites, serviceId]));
    set({ favorites: updated });
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  },

  removeFavorite: async (serviceId) => {
    const updated = get().favorites.filter((id) => id !== serviceId);
    set({ favorites: updated });
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  },

  addRecentSearch: async (query) => {
    if (!query.trim()) return;
    const trimmed = query.trim();
    const updated = [trimmed, ...get().recentSearches.filter((s) => s !== trimmed)].slice(0, 10);
    set({ recentSearches: updated });
    await AsyncStorage.setItem(SEARCHES_KEY, JSON.stringify(updated));
  },

  clearRecentSearches: async () => {
    set({ recentSearches: [] });
    await AsyncStorage.removeItem(SEARCHES_KEY);
  },

  saveFamilyHead: async (head) => {
    set({ familyHead: head });
    await SecurityService.setSecureItem(SEC_HEAD_KEY, head);

    if (get().notificationsEnabled) {
      await NotificationService.scheduleExpiryNotification(
        'head_nid',
        '🪪 انتهاء البطاقة الوطنية لرب العائلة',
        'البطاقة الوطنية لرب العائلة ' + head.name + ' ستنتهي خلال 30 يوماً. يرجى حجز موعد للتجديد وتوفير بطاقة السكن وصورتك الشخصية.',
        head.nidExpiryDate
      );
      await NotificationService.scheduleExpiryNotification(
        'head_passport',
        '✈️ انتهاء جواز سفر رب العائلة',
        'جواز السفر لرب العائلة ' + head.name + ' سينتهي خلال 30 يوماً. يرجى حجز موعد وتجهيز البطاقة الوطنية الموحدة وبطاقة السكن ورسوم التجديد.',
        head.passportExpiryDate
      );
      await NotificationService.scheduleExpiryNotification(
        'head_housing',
        '🏠 انتهاء بطاقة السكن العائلية',
        'بطاقة السكن ستنتهي خلال 30 يوماً. يرجى مراجعة دائرة الجنسية أو المختار المعتمد لتحديث بطاقة السكن الخاصة بـ ' + head.name + '.',
        head.housingExpiryDate
      );
    }
  },

  addFamilyMember: async (member) => {
    const updated = [...get().familyMembers, member];
    set({ familyMembers: updated });
    await SecurityService.setSecureItem(SEC_MEMBERS_KEY, updated);

    const birthDate = new Date(member.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if ((member.relationship === 'ابن' || member.relationship === 'بنت') && age < 6) {
      await get().addChildVaccine(
        member.name,
        member.relationship === 'ابن' ? 'ذكر' : 'أنثى',
        member.birthDate,
        member.id
      );
    }

    if (get().notificationsEnabled) {
      await NotificationService.scheduleExpiryNotification(
        'member_nid_' + member.id,
        '🪪 انتهاء البطاقة الوطنية لـ ' + member.name,
        'البطاقة الوطنية للـ (' + member.relationship + ') البطل ' + member.name + ' ستنتهي قريباً. يرجى إعداد مستمسكات رب العائلة ومراجعة الأحوال المدنية.',
        member.nidExpiryDate
      );
      await NotificationService.scheduleExpiryNotification(
        'member_passport_' + member.id,
        '✈️ انتهاء جواز سفر ' + member.name,
        'جواز سفر الـ (' + member.relationship + ') البطل ' + member.name + ' سينتهي قريباً. يرجى تجهيز البطاقة الوطنية وحجز موعد تجديد الجواز.',
        member.passportExpiryDate
      );
      await NotificationService.scheduleSchoolAgeNotification(member.id, member.name, member.birthDate, member.relationship);
    }
  },

  removeFamilyMember: async (memberId) => {
    const updated = get().familyMembers.filter((m) => m.id !== memberId);
    set({ familyMembers: updated });
    await SecurityService.setSecureItem(SEC_MEMBERS_KEY, updated);
    await NotificationService.cancelNotification('member_nid_' + memberId);
    await NotificationService.cancelNotification('member_passport_' + memberId);
    await NotificationService.cancelNotification('school_' + memberId);
    await get().removeChildVaccine(memberId);
  },

  saveExpiries: async (driving, vehicle, ration) => {
    set({ drivingLicenseExpiry: driving, vehicleAnnualExpiry: vehicle, rationCardUpdate: ration });
    await AsyncStorage.setItem(EXPIRIES_KEY, JSON.stringify({ driving, vehicle, ration }));

    if (get().notificationsEnabled) {
      if (driving) {
        await NotificationService.scheduleExpiryNotification(
          'user_driving',
          '🚗 انتهاء إجازة السوق',
          'إجازة السوق الخاصة بك ستنتهي بعد شهر. يرجى إجراء فحص اللياقة والعيون وحجز موعد التجديد لتجنب الغرامة المرورية.',
          driving
        );
      }
      if (vehicle) {
        await NotificationService.scheduleExpiryNotification(
          'user_vehicle',
          '🚘 انتهاء سنوية السيارة',
          'سنوية تسجيل مركبتك ستنتهي خلال 30 يوماً. يرجى إجراء فحص الهزة الفني وسداد الغرامات والضرائب للحصول على سنوية جديدة.',
          vehicle
        );
      }
      if (ration) {
        await NotificationService.scheduleExpiryNotification(
          'user_ration',
          '🌾 تحديث البطاقة التموينية',
          'البطاقة التموينية الخاصة بالعائلة بحاجة لتحديث بياناتها. يرجى مراجعة وكيل المواد الغذائية أو الفرع التمويني القريب وتحديثها.',
          ration
        );
      }
    }
  },

  setNotificationsEnabled: async (enabled) => {
    set({ notificationsEnabled: enabled });
    // v1.1.0: switching reminders off now cancels the ones already scheduled.
    if (!enabled) await NotificationService.cancelAllNotifications();
    await AsyncStorage.setItem(
      PREFS_KEY,
      JSON.stringify({
        isDarkMode: get().isDarkMode,
        notificationsEnabled: enabled,
        pinLockEnabled: get().pinLockEnabled,
        biometricLockEnabled: get().biometricLockEnabled,
      })
    );
  },

  setSecurityEnabled: async (pinEnabled, bioEnabled) => {
    set({ pinLockEnabled: pinEnabled, biometricLockEnabled: bioEnabled });
    await AsyncStorage.setItem(
      PREFS_KEY,
      JSON.stringify({
        isDarkMode: get().isDarkMode,
        notificationsEnabled: get().notificationsEnabled,
        pinLockEnabled: pinEnabled,
        biometricLockEnabled: bioEnabled,
      })
    );
  },

  unlockApp: () => set({ isLocked: false }),

  lockApp: () => {
    if (get().pinLockEnabled || get().biometricLockEnabled) {
      set({ isLocked: true });
    }
  },

  registerUser: async (phone, governorate, district) => {
    const user = { phone, governorate, district };
    set({ currentUser: user });
    await SecurityService.setSecureItem(SEC_USER_KEY, user);
  },

  logoutUser: async () => {
    set({ currentUser: null });
    await AsyncStorage.removeItem(SEC_USER_KEY);
  },

  addChildVaccine: async (childName, gender, birthDateStr, existingId) => {
    const id = existingId || Math.random().toString();
    const birthDate = new Date(birthDateStr);

    const IRAQI_VACCINE_SCHEDULE = [
      { label: 'خلال الأسبوع الأول (الولادة)', offsetDays: 3, vaccine: 'شلل الأطفال الفموي OPV-0 + التهاب الكبد الفيروسي ب + بي سي جي (السل)' },
      { label: 'لقاح شهرين', offsetDays: 60, vaccine: 'شلل الأطفال OPV-1 + المكورات الرئوية PCV-1 + الروتا 1 + اللقاح الخماسي Penta-1' },
      { label: 'لقاح 4 أشهر', offsetDays: 120, vaccine: 'شلل الأطفال OPV-2 + المكورات الرئوية PCV-2 + الروتا 2 + اللقاح الخماسي Penta-2 + شلل الأطفال الزرقي IPV-1' },
      { label: 'لقاح 6 أشهر', offsetDays: 180, vaccine: 'شلل الأطفال OPV-3 + المكورات الرئوية PCV-3 + اللقاح الخماسي Penta-3 + شلل الأطفال الزرقي IPV-2' },
      { label: 'لقاح 9 أشهر', offsetDays: 270, vaccine: 'الحصبة المنفردة + فيتامين أ (100 ألف وحدة)' },
      { label: 'لقاح 12 شهراً (سنة)', offsetDays: 365, vaccine: 'الحصبة المختلطة الأولى MMR-1' },
      { label: 'لقاح 18 شهراً (سنة ونصف)', offsetDays: 540, vaccine: 'شلل الأطفال المنشط OPV-4 + الثلاثي المنشط DTP-1 + الحصبة المختلطة المنشطة MMR-2 + فيتامين أ (200 ألف وحدة)' },
      { label: 'لقاح 4 - 6 سنوات (دخول المدرسة)', offsetDays: 1640, vaccine: 'شلل الأطفال المنشط OPV-5 + الثلاثي المنشط DTP-2 + فيتامين أ (200 ألف وحدة)' },
    ];

    const scheduledDates = IRAQI_VACCINE_SCHEDULE.map((item) => {
      const date = new Date(birthDate.getTime());
      date.setDate(date.getDate() + item.offsetDays);
      return {
        label: item.label,
        date: date.toISOString().split('T')[0],
        vaccine: item.vaccine,
      };
    });

    const newChild = { id, name: childName, gender, birthDate: birthDateStr, scheduledDates };
    const updated = [...get().childVaccines.filter((c) => c.id !== id), newChild];
    set({ childVaccines: updated });
    await SecurityService.setSecureItem(SEC_VACCINES_KEY, updated);

    if (!get().notificationsEnabled) return;

    const now = new Date();
    for (let i = 0; i < scheduledDates.length; i++) {
      const v = scheduledDates[i];
      const vaccineDate = new Date(v.date);

      // 2 days before at 09:00
      const twoDaysBefore = new Date(vaccineDate.getTime());
      twoDaysBefore.setDate(twoDaysBefore.getDate() - 2);
      twoDaysBefore.setHours(9, 0, 0);
      if (twoDaysBefore.getTime() > now.getTime()) {
        await NotificationService.scheduleCustomNotification(
          'vaccine_' + id + '_' + i + '_2d',
          '👶 موعد لقاح للطفل ' + childName + ' بعد يومين!',
          'تذكير: بعد يومين هو موعد ' + v.label + ' (' + v.vaccine + ') لطفلك البطل ' + childName + '. يرجى تهيئة كارت التلقيحات.',
          twoDaysBefore
        );
      }

      // 1 day before at 09:00
      const oneDayBefore = new Date(vaccineDate.getTime());
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      oneDayBefore.setHours(9, 0, 0);
      if (oneDayBefore.getTime() > now.getTime()) {
        await NotificationService.scheduleCustomNotification(
          'vaccine_' + id + '_' + i + '_1d',
          '🎒 موعد لقاح للطفل ' + childName + ' غداً!',
          'تذكير: غداً هو موعد ' + v.label + ' (' + v.vaccine + ') لطفلك البطل ' + childName + '. يرجى المراجعة غداً صباحاً.',
          oneDayBefore
        );
      }

      // Same day at 08:30
      const sameDay = new Date(vaccineDate.getTime());
      sameDay.setHours(8, 30, 0);
      if (sameDay.getTime() > now.getTime()) {
        await NotificationService.scheduleCustomNotification(
          'vaccine_' + id + '_' + i + '_same',
          '💉 اليوم موعد تلقيح طفلك ' + childName + '!',
          'تنبيه عاجل: اليوم هو موعد ' + v.label + ' (' + v.vaccine + ') لطفلك البطل ' + childName + '. يرجى التوجه لمركز الرعاية الصحية الآن وبصحبتك كارت التلقاحات.',
          sameDay
        );
      }
    }
  },

  removeChildVaccine: async (childId) => {
    const updated = get().childVaccines.filter((c) => c.id !== childId);
    set({ childVaccines: updated });
    await SecurityService.setSecureItem(SEC_VACCINES_KEY, updated);
    for (let i = 0; i < 10; i++) {
      await NotificationService.cancelNotification('vaccine_' + childId + '_' + i + '_2d');
      await NotificationService.cancelNotification('vaccine_' + childId + '_' + i + '_1d');
      await NotificationService.cancelNotification('vaccine_' + childId + '_' + i + '_same');
    }
  },

  addChronicMedication: async (medName, diseaseName, time) => {
    const id = Math.random().toString();
    const med = { id, medName, diseaseName, time };
    const updated = [...get().chronicMedications, med];
    set({ chronicMedications: updated });
    await SecurityService.setSecureItem(SEC_MEDICATIONS_KEY, updated);

    const getMedDate = (timeStr, minutesBefore) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const now = new Date();
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
      date.setMinutes(date.getMinutes() - minutesBefore);
      if (date.getTime() <= now.getTime()) {
        date.setDate(date.getDate() + 1);
      }
      return date;
    };

    if (!get().notificationsEnabled) return;

    // v1.1.0: medication reminders repeat every day (v1.0.0 fired only once).
    const tenMinBefore = getMedDate(time, 10);
    await NotificationService.scheduleDailyNotification(
      'med_' + id + '_10',
      '🕒 تذكير بأخذ العلاج (متبقي 10 دقائق)',
      'عيني، حان وقت أخذ علاجك [' + medName + '] الخاص بـ [' + diseaseName + '] بعد 10 دقائق فدوة.',
      tenMinBefore.getHours(),
      tenMinBefore.getMinutes()
    );

    const exactTime = getMedDate(time, 0);
    await NotificationService.scheduleDailyNotification(
      'med_' + id + '_0',
      '💊 حان الآن موعد أخذ العلاج!',
      'عيني، حان الآن الوقت المحدد تماماً لأخذ علاجك [' + medName + '] لـ [' + diseaseName + ']. يرجى تناوله بالصحة والعافية فدوة.',
      exactTime.getHours(),
      exactTime.getMinutes()
    );
  },

  removeChronicMedication: async (medId) => {
    const updated = get().chronicMedications.filter((m) => m.id !== medId);
    set({ chronicMedications: updated });
    await SecurityService.setSecureItem(SEC_MEDICATIONS_KEY, updated);
    await NotificationService.cancelNotification('med_' + medId + '_10');
    await NotificationService.cancelNotification('med_' + medId + '_0');
  },

  loadPersistedData: async () => {
    try {
      const prefsStr = await AsyncStorage.getItem(PREFS_KEY);
      if (prefsStr) {
        const prefs = JSON.parse(prefsStr);
        // A lock is only honoured when a PIN really exists (it is also the biometric fallback).
        const pinExists = await SecurityService.hasPIN();
        const pinLock = !!prefs.pinLockEnabled && pinExists;
        const bioLock = !!prefs.biometricLockEnabled && pinExists;
        set({
          isDarkMode: !!prefs.isDarkMode,
          notificationsEnabled: prefs.notificationsEnabled !== undefined ? prefs.notificationsEnabled : true,
          pinLockEnabled: pinLock,
          biometricLockEnabled: bioLock,
          isLocked: pinLock || bioLock,
        });
      }

      const favoritesStr = await AsyncStorage.getItem(FAVORITES_KEY);
      if (favoritesStr) set({ favorites: JSON.parse(favoritesStr) });

      const searchesStr = await AsyncStorage.getItem(SEARCHES_KEY);
      if (searchesStr) set({ recentSearches: JSON.parse(searchesStr) });

      const expiriesStr = await AsyncStorage.getItem(EXPIRIES_KEY);
      if (expiriesStr) {
        const expiries = JSON.parse(expiriesStr);
        set({
          drivingLicenseExpiry: expiries.driving,
          vehicleAnnualExpiry: expiries.vehicle,
          rationCardUpdate: expiries.ration,
        });
      }

      const head = await SecurityService.getSecureItem(SEC_HEAD_KEY);
      if (head) set({ familyHead: head });

      const members = await SecurityService.getSecureItem(SEC_MEMBERS_KEY);
      if (members) set({ familyMembers: members });

      const user = await SecurityService.getSecureItem(SEC_USER_KEY);
      if (user) set({ currentUser: user });

      const vaccines = await SecurityService.getSecureItem(SEC_VACCINES_KEY);
      if (vaccines) set({ childVaccines: vaccines });

      const medications = await SecurityService.getSecureItem(SEC_MEDICATIONS_KEY);
      if (medications) set({ chronicMedications: medications });

      const locationStr = await AsyncStorage.getItem(LOCATION_KEY);
      if (locationStr) {
        const location = JSON.parse(locationStr);
        set({
          selectedGovernorate: location.gov || 'بغداد',
          selectedDistrict: location.dist || 'الرصافة',
        });
      }
    } catch (error) {
      console.error('Failed to load persisted app data', error);
    } finally {
      set({ isHydrated: true });
    }
  },

  clearAllData: async () => {
    // v1.1.0: also wipe the PIN, the encryption key and every scheduled reminder.
    await NotificationService.cancelAllNotifications();
    await SecurityService.wipeSecrets();
    await AsyncStorage.clear();
    set({
      isDarkMode: false,
      favorites: [],
      recentSearches: [],
      familyHead: null,
      familyMembers: [],
      drivingLicenseExpiry: null,
      vehicleAnnualExpiry: null,
      rationCardUpdate: null,
      notificationsEnabled: true,
      pinLockEnabled: false,
      biometricLockEnabled: false,
      isLocked: false,
      currentUser: null,
      childVaccines: [],
      chronicMedications: [],
      selectedGovernorate: 'بغداد',
      selectedDistrict: 'الرصافة',
      isHydrated: true,
    });
  },
}));
