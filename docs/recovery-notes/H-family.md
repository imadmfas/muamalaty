# H-family — modules 735 (FamilyScreen) and 736 (DatePicker)

## (a) Files written
- /home/claude/muamalaty/src/screens/FamilyScreen.js  (module 735, decompiled.js lines 287758–291958)
- /home/claude/muamalaty/src/components/DatePicker.js (module 736, decompiled.js lines 291958–293087)
Both parse with `esbuild --loader:.js=jsx`. StyleSheet keys match the bytecode exactly (81 and 20, same order).
Every non-ASCII string literal in both ranges (98 and 20) is in the output; I checked this with a script.

## (b) Exports / imports
### FamilyScreen.js
- export: `FamilyScreen` (named only; the module defines no default)
- imports: react (`useState`), react-native (View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, StyleSheet),
  `@expo/vector-icons` (Feather, Ionicons, MaterialCommunityIcons, FontAwesome5), `expo-linear-gradient` (LinearGradient),
  `../store/useAppStore` → `useAppStore` (also calls `useAppStore.getState()`),
  `../theme/ThemeContext` → `useTheme`,
  `../services/securityService` → `* as securityService` (uses `authenticateBiometric`, `setBiometricEnabled`; both are named exports of module 649),
  `../components/GlassCard` → `GlassCard`, `../components/DatePicker` → `DatePicker`.
### DatePicker.js
- export: `DatePicker` (named only)
- imports: react (`useState`, `useEffect`), react-native (View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Dimensions),
  `../theme/ThemeContext` → `useTheme`, `@expo/vector-icons` → `Ionicons`.

## (c) Props
- `FamilyScreen`: none.
- `DatePicker`: `{ value, onChange, placeholder = 'اختر التاريخ...', label, error }`. `value` is a 'YYYY-MM-DD' string.
  `onChange(dateString)` is called with 'YYYY-MM-DD' (month and day zero-padded).
- `GlassCard` (used here): `borderColor`, `style`, `children`.
- Theme fields read: background, textPrimary, textSecondary, textMuted, border, divider, cardMain, cardSoftTint,
  cardElevated, success, warning, danger, primaryBrand, secondaryAccent. `useTheme()` also returns `isDarkMode`.
  FamilyScreen also destructures `toggleDarkMode` and `themeConfig` but never uses them.

## (d) Store fields / actions used (useAppStore)
State: `familyHead`, `familyMembers`, `drivingLicenseExpiry`, `vehicleAnnualExpiry`, `rationCardUpdate`,
`biometricLockEnabled`, `chronicMedications`, and `pinLockEnabled` (read through `getState()`).
Actions:
- `saveFamilyHead(headObj)` (awaited). headObj = {name, birthDate, nidNumber, nidIssueDate, nidExpiryDate, passportNumber,
  passportIssueDate, passportExpiryDate, housingNumber, housingIssueDate, housingExpiryDate}
- `addFamilyMember({id, name, relationship, birthDate, nidExpiryDate, passportExpiryDate})` (awaited)
- `removeFamilyMember(id)`
- `saveExpiries(drivingLicenseExpiry|null, vehicleAnnualExpiry|null, rationCardUpdate|null)` (awaited)
- `setSecurityEnabled(pinLockEnabled, biometricEnabled)` (awaited)
- `addChronicMedication(medName, diseaseName, 'HH:MM' in 24h)` (awaited). List items read `id`, `medName`, `diseaseName`, `time`.
- `removeChronicMedication(id)`
Family member objects read: `id`, `name`, `relationship`, `birthDate`, `nidExpiryDate`, `passportExpiryDate`.

## (e) Bugs / suspicious behaviour (decompiled.js line refs)
1. **Hard-coded placeholder IDs saved as real data** (handleSaveHead, ~289560–289590): `nidNumber || '1234567890'`,
   `passportNumber || 'A00000000'`, `housingNumber || '12345'`. All three issue dates are fixed at `'2020-01-01'`.
2. **There is no input for passport number or housing-card number.** Their useState setters are discarded in the bytecode
   (~288020, ~288105), so the user cannot enter them. They always fall back to the hard-coded values above, or keep a value
   already stored in the head.
3. The family-head form state is initialised from `familyHead` only on the first render. If the store hydrates
   `familyHead` later (async persist), the form stays empty and `isEditingHead` stays `true` (`useState(!familyHead)`).
   The same applies to `drivingExpiry`, `vehicleExpiry` and `rationExpiry`.
4. Bio button style (~289035): `[bioBtn, enabled && {backgroundColor, borderColor: primaryBrand}, {borderColor: theme.border}]`.
   The last entry always overrides the active border colour, so the "active" border never shows.
5. No try/catch in any async handler. A rejection from saveFamilyHead, addFamilyMember, saveExpiries, addChronicMedication,
   authenticateBiometric or setSecurityEnabled becomes an unhandled promise rejection with no feedback to the user.
6. Biometric toggle: when disabling, `securityService.setBiometricEnabled(false)` runs without any biometric or PIN
   re-authentication. Anyone holding the unlocked phone can switch off the lock.
7. `removeFamilyMember(member.id)` has no confirmation dialog (~291094). It runs as soon as "🗑️ إزالة الفرد" is pressed.
   The medication delete is also unconfirmed.
8. `handleAddMember` resets name, birthDate and both expiries but not `memberRelationship`. It also does not reset the
   member form when the modal is cancelled.
9. Member id is `Math.random().toString()`, which can collide and is not a stable UUID.
10. Medication name field: the label is 'اسم العلاج:' but the placeholder is 'مثال: ضغط، قلب، سكر، إلخ' (disease names), so it
    reads like a copy-paste mistake. The success Alert promises two reminders (10 min before and on time). Scheduling happens
    in the store, if at all; this screen does not schedule anything.
11. `parseInt(medHour)` and `parseInt(h)` (inside formatMedTime) are called without a radix (minor).
12. Age text always says 'سنوات', including for age 0 or 1 (grammar). getAgeInYears returns 0 for a missing birthDate, so a
    'ابن'/'بنت' with no birthDate would be flagged as under 6. In practice birthDate is required on add.
13. The vaccine badge text says the vaccine schedule and alerts are "enabled automatically" (`مفعلة تلقائياً`). Module 735
    contains no vaccine schedule data and no vaccine logic. The badge is shown only from the age/relationship check. The real
    scheduling, if any, must live in the store or notificationService. The bundle has `?anon_0_removeChildVaccine` and
    `@muamalaty_sec_vaccines` strings elsewhere.
14. The shield banner claims "hardware encryption" (`تشفير عتادي`). Whether that is true depends on securityService/store.
    The bundle contains the string `Professor_Imad_Farhan_Secure_Muamalaty_Master_Key_...`, which suggests a hard-coded master
    key somewhere (outside my range; flag for the securityService group).
15. Unused styles: `bioBtnActiveDark`, `bioBtnActiveLight`, `chipActiveDark`, `chipActiveLight` (dead). `editText`,
    `bioBtnText`, `relSelectText` and `ampmText` have hard-coded colours ('blue'/'gray') that are partly overridden.
16. Modal sits inside the ScrollView (works in RN, but unusual).
17. timeScroll/ampmBtn use the hard-coded border `rgba(255,255,255,0.06)`, which is invisible in light mode.
### DatePicker
18. `getItemLayout` uses length 40, but `itemBtn` is height 40 + marginVertical 2×2 = 44 px per row. Offsets drift, so
    `initialScrollIndex` lands on the wrong item and scrollToIndex is inaccurate.
19. Year `initialScrollIndex`: `indexOf(year) > 0 ? indexOf(year) - 2 : 0`. When indexOf is 1, this gives -1, an invalid
    index (RN warning or crash risk). This happens for currentYear+9. Also, if the stored year is outside the 96-year window,
    indexOf is -1 and the code falls back to 0.
20. The first `useEffect` depends on `[value, isVisible]` and only syncs when `value` matches /^\d{4}-\d{2}-\d{2}$/. When
    `value` is cleared to '', the wheel keeps the last selection (minor).
21. The second effect's deps (`[year, month, daysInMonth]`) omit `selectedDay` (lint warning; behaviour is fine).
22. The year range is fixed: currentYear+10 down to currentYear−85. Birth dates older than 85 years cannot be picked.
23. `Dimensions.get('window').width` is computed at module load and never used (dead code).
24. The modalContent style sets `borderTopColor` but `borderWidth` (not `borderTopWidth`) = isDarkMode?1:0. In dark mode the
    side and bottom borders take the default colour (black).
25. The FlatList renderItem elements have no `key`. This is fine because keyExtractor is given.

## (f) Uncertain points
- **`formatMedTime` and `getAgeInYears` are 0-byte functions in the bundle** (hbc-disassembler: "of 0 bytes"). Hermes inlined
  each at its single call site and kept an empty stub. I rebuilt both bodies from the inlined code (~290580–290620 and
  ~291006–291050). The logic is exact: `hour % 12 || 12`, 'مساءً' when hour ≥ 12, and age decremented when
  `monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())`. The exact original formatting of the bodies is
  unknown.
- In async generators the decompiler mixes closure depths (e.g. `_closure1_slot6` meant securityService in one place and
  `setSecurityEnabled` in another). I resolved these by usage: `.setBiometricEnabled` / `.authenticateBiometric` belong to
  the security module, and a bare call with `(pinLockEnabled, bool)` is the store's `setSecurityEnabled`.
- I did not name the useState variables from the bytecode (names are not preserved). I chose them from usage:
  headName…, drivingExpiry, showAddModal, memberRelationship, isEditingHead, showMedForm, medDisease, medHour, medMinute,
  medAmPm. In DatePicker: isVisible, selectedYear, selectedMonth, selectedDay.
- I assumed the `handleToggleBiometrics` CatchBlockStart blocks only rethrow (the generator's own wrapper). No user catch
  exists, so none was added.
