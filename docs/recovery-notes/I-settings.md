# Group I-settings — modules 737, 738, 739

## (a) Files written
- /home/claude/muamalaty/src/screens/SavedScreen.js    (module 737, decompiled.js 293087–294221)
- /home/claude/muamalaty/src/screens/SettingsScreen.js (module 738, 294221–295385)
- /home/claude/muamalaty/src/screens/AdminScreen.js    (module 739, 295385–296844)
All three parse with esbuild 0.24 (--loader:.js=jsx).

## (b) Exports / imports
### SavedScreen.js — export `SavedScreen` (named only, no default)
deps [81,45,641,717,722,719,723,256]
- react: useState
- react-native: View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Share
- ../store/useAppStore: useAppStore
- ../theme/ThemeContext: useTheme
- ../data/servicesData: getFullInitialServices
- ../components/GlassCard: GlassCard
- ../services/verificationService: getConfidenceText, getConfidenceColor

### SettingsScreen.js — export `SettingsScreen` (named only)
deps [81,45,639,641,717,649,719,256]
- react-native: View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, Linking
- expo-linear-gradient: LinearGradient
- ../store/useAppStore: useAppStore
- ../theme/ThemeContext: useTheme
- ../services/securityService: `import * as securityService` (module 649 exports individual functions:
  encryptString, decryptString, setSecureItem, getSecureItem, savePIN, verifyPIN, hasPIN, deletePIN,
  setBiometricEnabled, isBiometricEnabled, authenticateBiometric, exportDataBackup, importDataBackup;
  Settings only calls `authenticateBiometric`)
- ../components/GlassCard: GlassCard

### AdminScreen.js — export `AdminScreen` (named only)
deps [81,45,717,722,719,723,256] (no store!)
- react: useState, useEffect
- react-native: View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
- ../theme/ThemeContext: useTheme
- ../data/servicesData: getFullInitialServices
- ../components/GlassCard: GlassCard
- ../services/verificationService: getUpdateLogs, getConfidenceColor

## (c) Props
- SavedScreen: none
- SettingsScreen: `{ onOpenAdmin }` (called directly as onPress of the admin button)
- AdminScreen: `{ onClose }` (onPress of "❌ إغلاق اللوحة")
- GlassCard is used with props `borderColor`, `style`, `children`.

## (d) Store / theme fields used
- useTheme(): theme, isDarkMode, toggleDarkMode, themeConfig (themeConfig never used anywhere in the 3 files;
  toggleDarkMode/isDarkMode unused in Saved; toggleDarkMode unused in Admin).
  theme keys: background, backgroundSecondary, cardMain, cardElevated, border, divider, textPrimary,
  textSecondary, textMuted, primaryBrand, secondaryAccent, success, warning, danger.
- useAppStore (Saved): favorites (array of service_id), removeFavorite(serviceId)
- useAppStore (Settings): notificationsEnabled, setNotificationsEnabled(bool), pinLockEnabled,
  biometricLockEnabled, setSecurityEnabled(pinEnabled, biometricEnabled) (awaited), clearAllData() (awaited)
- verificationService: getConfidenceText(score), getConfidenceColor(score), getUpdateLogs() (awaited;
  log objects: timestamp, sourceType, serviceId, resolvedConflicts[])
- Service object fields read: service_id, service_name_ar, ministry_name, department_name, estimated_fees_iqd,
  required_documents[], verification_score, payment_method, office_name, office_address, working_days[],
  working_hours, citizen_notes.

## Admin screen protection (requested)
- **No protection at all.** No password, PIN, biometric or role check. SettingsScreen shows the
  "🛠️ لوحة التطوير والمحاكاة" card to every user, and the button
  "📂 الدخول إلى لوحة إدارة الخدمات (Admin Mode)" calls `onOpenAdmin` directly (Settings ~line 295142,
  `r15[1] = r21` where r21 = props.onOpenAdmin). Whatever App.js does with onOpenAdmin is the only gate
  (check group handling module 562).
- Mitigating fact: Admin changes live only in AdminScreen local state (`services` useState), are not written
  to the store, AsyncStorage or verificationService, and are lost when the panel closes. So the panel is
  effectively a demo/simulation, despite the button "💾 حفظ وإضافة لقاعدة البيانات" and the success alert
  "تمت إضافة الخدمة الحكومية الجديدة لقاعدة البيانات بنجاح!" claiming a DB save.

## Hard-coded emails / credentials / test values
- `info@drimad.net` — developer support email shown in Settings and `mailto:info@drimad.net?subject=تطبيق معاملاتي`
  (Settings ~295145); also used as `email` of every admin-created service (Admin ~296170).
- Developer name shown: 'البروفيسور عماد محمد فرحان'.
- Default PIN **1234** advertised in UI: 'استخدام كود حماية إضافي (الافتراضي: 1234)' and alert
  'تم تفعيل القفل برمز PIN الافتراضي: 1234...'. handlePinToggle never calls savePIN / asks the user for a PIN,
  so the lock relies on a default/hard-coded PIN (verify in securityService/App lock screen, other group).
- Admin-created service placeholders: phone '07700000000', lat/lng 33.3152/44.3661 (Baghdad),
  'https://maps.google.com/?q=33.3152,44.3661', 'https://eservice.ur.gov.iq' (official_website + online_service_link),
  verification_status 'official' + verification_score 95 for any user-typed service.
- Mark-outdated hard-codes last_verified_date '2020-01-01', score 35, status 'local'.

## (e) Bugs / suspicious behaviour (line refs = decompiled.js)
### SavedScreen
1. ~293170 handleShare: `service.estimated_fees_iqd.toLocaleString()` without null check → throws if field
   missing (caught → "فشل مشاركة البيانات"). Free services (0) share as "0 دينار عراقي" while the detail view says 'مجانية'.
2. Share message is a template literal with leading newline and trailing 4 spaces ('\n    ').
3. ~293260 savedServices built from `getFullInitialServices()` every render — favorites of services that
   only exist in cache / remote updates / admin-added services never appear; edits from verification are ignored.
4. Detail view renders `required_documents.map`, `working_days.join` without guards → crash if missing.
5. Remove button text uses `styles.actionBtnText` with no colour (default black on theme.danger) — inconsistent
   with share button; probably fine but noted.
6. `citizen_notes && (...)` — if citizen_notes were 0 it would render "0"; strings fine.
7. Remove button: removeFavorite not awaited; Alert 'تم' shown regardless of success.
8. Unused: isDarkMode, toggleDarkMode, themeConfig.
### SettingsScreen
9. handleBiometricToggle / handlePinToggle / reset onPress have no try/catch — rejection of
   authenticateBiometric / setSecurityEnabled / clearAllData is an unhandled promise rejection.
10. handlePinToggle enables PIN lock without asking for or saving a PIN (relies on default 1234) — security issue.
11. Enabling biometric does not check pinLockEnabled/hardware enrolment beyond authenticateBiometric's result.
12. mailto subject contains raw Arabic/space, not encodeURIComponent'd; Linking.openURL result not awaited/caught.
13. Admin entry visible to all users, unprotected (see above).
14. Privacy text claims all data is "مشفر بالكامل" and never sent to external servers — verify against
    aiEngine/verificationService (internet checks) — possibly misleading.
15. themeConfig unused.
### AdminScreen
16. `handleMarkOutdated` decompiles as an empty function (~296093) because Hermes inlined its body into the
    button's onPress (~296700, with a leftover "Trying to call a non-function" guard). I reconstructed the body
    into handleMarkOutdated(serviceId) — behaviour identical.
17. All admin edits are local state only (not persisted, not shared with other screens) — see protection section.
18. handleCreateService: `parseInt(newFees)` without radix; docs `split('،')` with no trim / no filtering of
    empty items; only the Arabic comma is supported (a Latin "," leaves one big document).
19. User-typed services get verification_status 'official' and score 95 → counted as "موثقة رسمياً".
20. Service id `Math.random().toString(36).substring(7)` — short, collision-prone, can even be empty-ish.
21. Logs keyed by index; `log.resolvedConflicts.join` crashes if a log lacks that array.
22. loadLogs has no try/catch; useEffect has [] deps and calls loadLogs declared after it (fine at runtime).
23. Unused: toggleDarkMode, themeConfig.

## (f) Uncertainties
- AdminScreen date fields: the decompiler shows `new Date().toISOString().split('T')[r0]` where the last visible
  assignment to r0 is 7 (from `.substring(7)`). That would be `[7]` → undefined. I believe a register-load of 0
  was lost and the original is `split('T')[0]` (YYYY-MM-DD); reconstructed as `[0]`. If it really was [7],
  last_verified_date/last_source_check/created_at/updated_at would be undefined.
- Admin useState order: first useState([]) = logs, second = services (determined by which value is rendered
  for stats and which setter the useEffect/handlers call). State variable names newName/newCategory/... are mine.
- Closure-slot numbering inside nested functions is unreliable in this decompile (e.g. `_closure1_slot0` used for
  both RN module and pinLockEnabled); I resolved by context.
- Exact grouping of text children in JSX (e.g. '🪙 ' + fee, 'درجة الثقة: ' + score + '%') preserved as adjacent
  text/expression children, matching jsxs arrays.
