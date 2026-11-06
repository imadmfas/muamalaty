# B-store — notes

## (a) Files written
- /home/claude/muamalaty/src/store/useAppStore.js        (module 641, lines 241326–245760)
- /home/claude/muamalaty/src/services/securityService.js (module 649, lines 248782–251151)
- /home/claude/muamalaty/src/services/notificationService.js (module 655, lines 253040–254560)
All three parse with esbuild 0.24.

## (b) Exports / imports

### src/store/useAppStore.js
- export `useAppStore` (zustand `create((set, get) => ({...}))`). The module has no default export.
- imports: `{ create }` from 'zustand' (642, no interop, reads `.create`); `AsyncStorage` default from
  '@react-native-async-storage/async-storage' (645); `* as SecurityService` (649: uses setSecureItem, getSecureItem);
  `* as NotificationService` (655: uses scheduleExpiryNotification, scheduleSchoolAgeNotification,
  scheduleCustomNotification, cancelNotification).

### src/services/securityService.js
- exports (named only): encryptString, decryptString, setSecureItem, getSecureItem, savePIN, verifyPIN, hasPIN,
  deletePIN, setBiometricEnabled, isBiometricEnabled, authenticateBiometric, exportDataBackup, importDataBackup.
- `getOrCreateMasterKey` exists but is NOT exported (module-private).
- imports: `* as SecureStore` from 'expo-secure-store' (650); `* as LocalAuthentication` from
  'expo-local-authentication' (652); `AsyncStorage` default (645).

### src/services/notificationService.js
- exports (named only): requestNotificationPermissions, scheduleExpiryNotification, scheduleSchoolAgeNotification,
  cancelNotification, cancelAllNotifications, scheduleCustomNotification.
- Side effect at load: `Notifications.setNotificationHandler({ handleNotification })` →
  `{shouldShowAlert:true, shouldPlaySound:true, shouldSetBadge:false, shouldShowBanner:true, shouldShowList:true}`.
- imports: `* as Notifications` from 'expo-notifications' (656); 'react-native' (45) is required, but no property
  of it is ever read (written as a bare `import 'react-native'`).

Function signatures:
- scheduleExpiryNotification(id, title, body, expiryDateStr)
- scheduleSchoolAgeNotification(childId, childName, birthDateStr)
- scheduleCustomNotification(id, title, body, triggerDate: Date)
- cancelNotification(reminderId); cancelAllNotifications(); requestNotificationPermissions() → boolean
- setSecureItem(key, value) / getSecureItem(key) → parsed value | null
- savePIN(pin) / verifyPIN(pin) → bool / hasPIN() → bool / deletePIN()
- setBiometricEnabled(bool) / isBiometricEnabled() → bool / authenticateBiometric() → bool
- exportDataBackup(data) → hex string ; importDataBackup(hex) → data | null

## (c) Component props
None (these are non-UI modules).

## (d) Store shape (initial state, exact defaults)
```
isDarkMode: false
favorites: []
recentSearches: []
familyHead: null
familyMembers: []
drivingLicenseExpiry: null
vehicleAnnualExpiry: null
rationCardUpdate: null
notificationsEnabled: true
pinLockEnabled: true          <-- true by default
biometricLockEnabled: false
isLocked: true                <-- app starts locked
currentUser: null
childVaccines: []
chronicMedications: []
selectedGovernorate: 'بغداد'
selectedDistrict: 'الرصافة'
```
Actions (with params): toggleDarkMode(), setSelectedLocation(gov, dist), addFavorite(serviceId),
removeFavorite(serviceId), addRecentSearch(query), clearRecentSearches(), saveFamilyHead(head),
addFamilyMember(member), removeFamilyMember(memberId), saveExpiries(driving, vehicle, ration),
setNotificationsEnabled(enabled), setSecurityEnabled(pinEnabled, bioEnabled), unlockApp(), lockApp(),
registerUser(phone, governorate, district), logoutUser(), addChildVaccine(childName, gender, birthDateStr, existingId?),
removeChildVaccine(childId), addChronicMedication(medName, diseaseName, time 'HH:MM'),
removeChronicMedication(medId), loadPersistedData(), clearAllData(). All async except unlockApp/lockApp.
(`getMedDate(timeStr, minutesBefore)` is a local helper inside addChronicMedication, not a store field.)

Object shapes the store reads:
- familyHead: { name, nidExpiryDate, passportExpiryDate, housingExpiryDate, ... }
- member: { id, name, relationship ('ابن' | 'بنت' | ...), birthDate, nidExpiryDate, passportExpiryDate, ... }
- childVaccines item: { id, name, gender ('ذكر'|'أنثى'), birthDate, scheduledDates: [{label, date 'YYYY-MM-DD', vaccine}] }
- chronicMedications item: { id, medName, diseaseName, time }
- currentUser: { phone, governorate, district }

### Persistence map
Plain JSON in AsyncStorage:
- '@muamalaty_prefs' → {isDarkMode, notificationsEnabled, pinLockEnabled, biometricLockEnabled}
  (written by toggleDarkMode / setNotificationsEnabled / setSecurityEnabled)
- '@muamalaty_favorites' → string[]
- '@muamalaty_searches' → string[] (max 10, newest first, deduped)
- '@muamalaty_expiries' → {driving, vehicle, ration}
- '@muamalaty_location' → {gov, dist} (string literal inlined in the code, not a module constant)
- 'muamalaty_biometric_enabled' → 'true'/'false' (securityService.setBiometricEnabled; the store does not use it)

Via SecurityService.setSecureItem, which means RC4-encrypted hex **still stored in AsyncStorage**, not in SecureStore:
- '@muamalaty_sec_head' (familyHead), '@muamalaty_sec_members' (familyMembers), '@muamalaty_sec_user' (currentUser),
  '@muamalaty_sec_vaccines' (childVaccines), '@muamalaty_sec_medications' (chronicMedications)

In expo-secure-store (real Keychain/Keystore):
- 'muamalaty_master_sec_key' (32-char random RC4 key), 'muamalaty_pin_hash' (raw PIN in plain text)

loadPersistedData order: prefs → favorites → searches → expiries → sec_head → sec_members → sec_user →
sec_vaccines → sec_medications → location. Each one is set only when truthy. On prefs:
isLocked = !!pinLockEnabled || !!biometricLockEnabled; notificationsEnabled defaults to true when undefined.
Everything is in one try/catch: console.error('Failed to load persisted app data', e).

### Notification scheduling (exact)
Every scheduleNotificationAsync call uses `{content:{title, body, sound:true, data:{reminderId:id}}, trigger: <Date object>}`,
which is a bare Date trigger: one-shot, with no `type`, no `repeats` and no Android `channelId`. Each scheduler first calls
cancelNotification(id), which loops over getAllScheduledNotificationsAsync() and cancels every item whose
content.data.reminderId === id. It then calls requestNotificationPermissions(), which returns null if permission is not granted.
- scheduleExpiryNotification: trigger = expiry − 30 days (setDate(getDate()−30), same clock time as the parsed date).
  If trigger ≤ now: if expiry > now, trigger = now + 60 000 ms; otherwise it returns null without scheduling.
- scheduleSchoolAgeNotification: trigger = new Date(birthY+6, birthM, birthD) then setMonth(−3), i.e. 3 months before
  the 6th birthday at 00:00 local. If trigger ≤ now: age = (now−birth)/31557600000 (365.25 days); if 5.5 ≤ age < 6.5,
  trigger = now+60 s; otherwise it returns null. reminderId = 'school_'+childId.
- scheduleCustomNotification: date ≤ now → now + 60 s.
Store-side ids and offsets:
- head: 'head_nid', 'head_passport', 'head_housing' (expiry −30 d). Scheduled only if notificationsEnabled.
- member: 'member_nid_'+id, 'member_passport_'+id (expiry −30 d), then the school-age reminder ('school_'+id).
  Scheduled only if notificationsEnabled. If relationship is 'ابن' or 'بنت' and age < 6, addChildVaccine runs first
  (gender = 'ابن' ? 'ذكر' : 'أنثى'). This happens regardless of notificationsEnabled.
- expiries: 'user_driving', 'user_vehicle', 'user_ration' (−30 d), each only if its value is truthy and notificationsEnabled.
- vaccines: 8-dose Iraqi schedule with offsetDays 3, 60, 120, 180, 270, 365, 540, 1640 from birth. For each dose i:
  'vaccine_<id>_<i>_2d' (−2 d at 09:00), '_1d' (−1 d at 09:00), '_same' (same day at 08:30). Each is scheduled only if it is in
  the future (strictly > now).
- medications: 'med_<id>_10' (time − 10 min) and 'med_<id>_0' (exact time). Next occurrence today, or tomorrow if passed.

## (e) Bugs / suspicious behaviour
securityService.js
1. **Weak crypto (RC4).** encryptString/decryptString are hand-rolled RC4 with a static per-device key. There is no IV/nonce,
   so the same key stream is reused for every value (two ciphertexts XOR to the XOR of their plaintexts). There is no
   authentication/MAC and no KDF. RC4 is broken and deprecated.
2. **Data corruption for non-Latin-1 text (critical).** encryptString writes `(charCode ^ k).toString(16).padStart(2,'0')`.
   For Arabic chars (U+0600–U+06FF) this gives 3 hex digits, but decryptString reads fixed 2-digit chunks. Any Arabic name
   stored via setSecureItem (head/members/vaccines/meds) therefore decrypts to garbage, JSON.parse fails, and getSecureItem
   returns null. Persisted family/vaccine/medication data that contains Arabic text is silently lost on the next launch.
3. Hard-coded fallback master key 'Professor_Imad_Farhan_Secure_Muamalaty_Master_Key_2026', returned if SecureStore
   throws (getOrCreateMasterKey catch). The key also ships inside the APK. Data encrypted under it cannot be decrypted once
   SecureStore works again, and the reverse is also true.
4. The master key is generated with Math.random(), which is not a CSPRNG.
5. savePIN stores the raw PIN under 'muamalaty_pin_hash'. No hashing, despite the name. verifyPIN is a plain `===`
   comparison with no attempt limit or lockout.
6. The "secure" items are RC4 hex in AsyncStorage, not in SecureStore. Only the key and the PIN are in SecureStore.
7. exportDataBackup encrypts with the device-local master key, so a backup cannot be imported on another device or after
   reinstall (the key is lost). importDataBackup then just returns null. The backup format has no versioning check beyond
   app === 'Muamalaty'.
8. Biometric enabled flag lives in plain AsyncStorage ('muamalaty_biometric_enabled'), so it can be tampered with.
   The store tracks biometricLockEnabled separately in prefs, which gives two sources of truth.
9. getSecureItem: AsyncStorage.getItem is outside the try, so only JSON.parse is guarded.

notificationService.js
10. Triggers are passed as bare `Date` objects. Newer expo-notifications versions (SDK 52+) expect
    `{ type: SchedulableTriggerInputTypes.DATE, date }`. Depending on the SDK, this may be deprecated or rejected.
11. No Android notification channel is created (setNotificationChannelAsync is never called), and 'react-native' is
    imported but unused. That import was probably meant for a Platform.OS === 'android' channel setup.
12. scheduleExpiryNotification with an empty/undefined date: new Date(undefined) is Invalid Date, all comparisons are
    false, and scheduleNotificationAsync is called with an Invalid Date. It throws and is caught/logged. The store calls it
    unconditionally for head_nid/head_passport/head_housing and the member nid/passport, even if the field is empty.
13. 'YYYY-MM-DD' strings parse as UTC midnight. The −30 d trigger fires at 03:00 Iraq time (UTC+3), and the "same day"
    vaccine time is computed from a UTC-parsed date, then setHours in local time.
14. The school-age body always says 'ابنك' (son) even for daughters ('بنت').
15. Every schedule call re-requests permission. cancelNotification fetches all scheduled notifications each time
    (O(n²) over the vaccine loop).

useAppStore.js
16. Default `pinLockEnabled: true` and `isLocked: true` with no PIN set. On first launch (no prefs saved) the app stays
    locked with PIN lock "enabled", but hasPIN() is false. Whether this deadlocks depends on the lock screen (out of scope).
17. clearAllData resets to `pinLockEnabled: false, isLocked: false`, which differs from the initial state (true/true).
    It only calls AsyncStorage.clear(). It does NOT delete the PIN or the master key in SecureStore, does NOT cancel
    scheduled notifications, and does NOT clear 'muamalaty_biometric_enabled' (that one is in AsyncStorage, so it is cleared).
18. setNotificationsEnabled(false) only persists the flag. Already-scheduled notifications are NOT cancelled.
    Turning it back on does not reschedule anything.
19. Chronic medication reminders are one-shot (Date trigger), not daily. They fire once and are never rescheduled.
20. removeChildVaccine cancels indices 0..9 although the schedule has 8 doses (harmless over-cancel).
21. addChildVaccine / addChronicMedication use Math.random().toString() as IDs (collision-prone, contain '0.').
22. setSecurityEnabled does not touch isLocked. lockApp only locks when a lock is enabled. unlockApp has no check of its own;
    it relies on the UI having verified the PIN.
23. addFamilyMember schedules the school-age notification for EVERY member (including adults/spouses). It is harmless
    because the age window check returns null, but the extra call happens anyway. Vaccines are added for children < 6
    even if notifications are disabled (that is fine). Note that childVaccines rows created this way use member.id as id.
24. removeFamilyMember calls removeChildVaccine(memberId) even for non-children (no-op).
25. saveFamilyHead / addFamilyMember have no try/catch. A failed setSecureItem (or encrypt) rejects the promise after
    the state has already been updated.
26. Age < 6 check in addFamilyMember: an invalid birthDate gives NaN, the comparison is false, and no vaccines are added.

## (f) Uncertainties
- The decompiler's closure-slot naming was ambiguous inside the store (e.g. `_closure1_slot0` is used for both `set` and
  AsyncStorage). I resolved the storage-key constants by slot index: slot3..11 are prefs, favorites, searches, expiries,
  head, members, user, vaccines, medications. The loadPersistedData call sequence matches this mapping consistently.
- In addRecentSearch, the slice start register was not printed explicitly. I assumed `.slice(0, 10)`.
- Exact `new Date(y, m, d, h, min, 0)` in getMedDate: the seconds arg is 0, and ms is not passed (matches 6+1 args).
- Parameter names for actions are my choice; positions are exact.
- The store module had no default export and no other named exports. Only `useAppStore`.
