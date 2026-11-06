# C-home — module 718 → src/screens/HomeScreen.js

Source range: decompiled.js lines 268037–270349 (module 718, deps [81, 45, 565, 639, 641, 717, 719, 256]).

## (a) Files written
- /home/claude/muamalaty/src/screens/HomeScreen.js (esbuild jsx parse: OK)

## (b) Exports / imports
- Exports: named `HomeScreen` only (Object.defineProperty getter). No default export.
- Imports:
  - react: `useState`
  - react-native: View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, StyleSheet
  - @expo/vector-icons: Feather, Ionicons, MaterialCommunityIcons, FontAwesome5
  - expo-linear-gradient: LinearGradient
  - ../store/useAppStore: `useAppStore`
  - ../theme/ThemeContext: `useTheme`
  - ../components/GlassCard: `GlassCard` (named)
- Module-level constant `GOVERNORATES_DISTRICTS` (18 governorates → districts), not exported.

## (c) Props
`HomeScreen({ onSearchSubmit, onQuickSelect, onSwitchTab })`
- `onSearchSubmit(query)` — called from search submit and when tapping a recent-search chip. Not null-checked.
- `onQuickSelect(query)` — quick-service chips (except "المزيد") and the "تحدث الآن" button (passes 'مرحباً'). Not null-checked.
- `onSwitchTab(tab)` — optional (null-checked): 'transactions' from "عرض الكل", 'services' from "المزيد" chip.

GlassCard is used with props: `borderColor`, `style`, `glow` (true on assistant card and modal; absent on privacy card), `children`.

## (d) Store / theme fields used
- useAppStore(): `recentSearches` (array of strings; `.length`, `.slice(0,6)`), `clearRecentSearches()`, `currentUser` (reads `.phone`), `registerUser(phone, governorate, district)`.
  Called as `useAppStore()` with no selector (subscribes to whole store).
- useTheme(): `theme`, `isDarkMode`, `toggleDarkMode`, `themeConfig` (read but unused).
- theme keys: background, backgroundSecondary, cardMain, cardSoftTint, cardElevated, border, divider,
  textPrimary, textSecondary, textMuted, primaryBrand, secondaryAccent, success, danger.
  `primaryBrand` must be a hex string (code appends alpha suffixes '26', '40', '10', '12').

## OTP flow — FAKE / SIMULATED
- `handleRequestOtp`: validates phone (`length === 9 && !isNaN(Number(phone))`) and that governorate + district are chosen, then
  generates the code locally: `Math.floor(1000 + Math.random()*9000).toString()`, stores it in state, sets otpSent, and
  **displays the code directly in an Alert** titled '💬 تفعيل حساب المواطن (WhatsApp)' ("...كود التفعيل الخاص بك هو: XXXX").
  No network call, no WhatsApp API — the "sent via WhatsApp" text is false.
- `handleVerifyOtp`: compares `otpInput !== generatedOtp` locally; on match calls `registerUser(phone, gov, district)`
  (not awaited), shows success Alert, resets all form state and closes modal.
- No hard-coded code; the code is random but shown to the user, so verification proves nothing. Not real authentication.

## (e) Bugs / suspicious behaviour (line refs = decompiled.js)
1. OTP is fully simulated, code revealed in Alert; UI copy claims WhatsApp delivery (≈269957–269985, 270020). Security/UX honesty issue.
2. Phone placeholder '7701234567' is 10 digits but maxLength is 9 and validation requires exactly 9 (≈269488). Misleading placeholder.
3. Phone validation `!isNaN(Number(x))` accepts non-digit strings such as '1.2345678', '1e1234567', ' 12345678' (≈269940–269950). Also does not check the operator prefix (e.g. 7[3-9]).
4. Welcome title shows `'07' + currentUser.phone` instead of a name; falls back to hard-coded name 'أحمد' when no user (≈268941–268960).
5. Header "maximize" icon button opens the login/activation modal — icon is unrelated to its function (≈268905). Modal can be reopened even when already registered (no currentUser check).
6. `onSearchSubmit` is passed the untrimmed query (trim used only for emptiness check) (≈268979–268994).
7. `onSearchSubmit` / `onQuickSelect` not null-guarded while `onSwitchTab` is — crash if parent omits them.
8. `themeConfig` destructured from useTheme but unused (dead read) (≈268145).
9. `registerUser(...)` result not awaited; success Alert shown regardless of whether registration (possibly async/secure-store) succeeds (≈270046).
10. Data: 'عمادية' (Amadiya) appears under both أربيل and دهوك (≈268100–268104); duplicate React keys not an issue (different lists) but data is inconsistent.
11. Governorate list omits Halabja governorate (Halabja listed as district of السليمانية) — data note, not a code bug.
12. Privacy card claims "تشفير عسكري" / hardware-protected keys and that the app works fully offline — marketing claim; verify against securityService (module 649).
13. `useAppStore()` with no selector → whole-store subscription, re-renders HomeScreen on any store change (perf).
14. Picker item selected text colour: `isDarkMode ? theme.background : 'white'` — intentional-looking but inverted vs. other screens? (kept as-is).
15. Error Alert title for wrong OTP is 'خطأ بتنسيق الكود' ("code format error") though the error is a mismatch.
16. Generated OTP and form state are not cleared when the modal is closed via X/back; reopening shows the OTP step again with the old code still valid.

## (f) Uncertainties
- State variable names are mine (decompiler lost them): searchQuery, showLoginModal, phoneNumber, selectedGovernorate,
  selectedDistrict, generatedOtp, otpInput, otpSent, showGovPicker, showDistrictPicker. Order of useState calls preserved.
- handleVerifyOtp success message decompiled as `r16[r8](...)` (decompiler glitch); reconstructed as HermesInternal.concat →
  template `أهلاً بك! تم تفعيل حسابك كمواطن من ${gov} - ${district}.` — high confidence.
- Welcome title `'07'.concat(currentUser.phone)` — reconstructed as template `07${currentUser.phone}`.
- Keys: quick chips and recent chips use array index; picker items use the governorate/district string.
- I added one explanatory comment above handleRequestOtp and an eslint-disable comment for the unused themeConfig; no logic changes.
