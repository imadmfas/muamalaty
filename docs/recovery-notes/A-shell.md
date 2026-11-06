# Group A-shell — notes

## 0. Summary of App shell behaviour (requested up-front)

### Tab switch (App.renderScreen, decompiled.js ~232300–232400)
State `activeTab` (default `'home'`). `handleSearchSubmit(q)` and `handleQuickSelect(q)` are identical: `setSearchQuery(q); setActiveTab('chat')`.
- `'home'` / default -> `<HomeScreen onSearchSubmit={handleSearchSubmit} onQuickSelect={handleQuickSelect} />`
- `'transactions'` -> `<TransactionsScreen onAskAI={handleSearchSubmit} />`
- `'services'` -> `<ServicesHubScreen onAskAI={handleSearchSubmit} />`
- `'chat'` -> `<ChatScreen initialQuery={searchQuery} clearInitialQuery={() => setSearchQuery('')} />`
- `'profile'` -> `<ProfileScreen onOpenAdmin={() => setShowAdmin(true)} onAskAI={handleSearchSubmit} />`
- When `showAdmin` is true, the screen area shows `<AdminScreen onClose={() => setShowAdmin(false)} />` instead of the tab, and the nav bar is hidden.
- FamilyScreen, SavedScreen, SettingsScreen are NOT imported by App (they are presumably opened from ProfileScreen or elsewhere).

### PIN / lock flow
- Store fields: `isLocked`, `unlockApp`, `pinLockEnabled`, `biometricLockEnabled`, `loadPersistedData`.
- Mount effect: `loadPersistedData()`, then `setupDefaultPINForTest()` = `if (!(await securityService.hasPIN())) await securityService.savePIN('1234')`.
- Effect `[isLocked, biometricLockEnabled]`: if both true -> `handleBiometricUnlock()` (= `authenticateBiometric()`; on success `unlockApp(); setPinInput(''); setPinError(false)`).
- Lock screen is rendered when `isLocked && (pinLockEnabled || biometricLockEnabled)`.
- Lock UI: View(bg) > expo StatusBar, (dark only) two radial-ish LinearGradient glows, GlassCard(glow) with Feather lock icon, title «تطبيق معاملاتي مؤمن», subtitle «يرجى إلغاء القفل بالبصمة أو إدخال رمز الـ PIN (الافتراضي: 1234)», 4 dots (filled = primaryBrand when `pinInput.length > i`; all red `danger` when pinError), keypad rows 1-2-3 / 4-5-6 / 7-8-9 / «البصمة 👁️»-0-⌫.
- Digit key: `setPinError(false)`; if `pinInput.length < 4` append; when length hits 4 -> `handlePinSubmit(newPin)` -> `securityService.verifyPIN(pin)`; ok -> unlockApp + reset; fail -> `setPinError(true)`, clear input, `Alert.alert('رمز خاطئ', 'رمز الـ PIN الذي أدخلته غير صحيح. يرجى المحاولة مرة ثانية (الافتراضي: 1234)')`.
- ⌫ -> `setPinInput(p => p.slice(0,-1))`. Bio key: disabled + opacity 0.3 when biometric not enabled; otherwise handleBiometricUnlock (else-branch alert «تنبيه / البصمة غير مفعلة بعد، يرجى تفعيلها من الإعدادات.» is unreachable because the key is disabled).

### Keyboard animation
`keyboardHeight = React.useRef(new Animated.Value(0)).current`. `keyboardDidShow` -> `Animated.timing(keyboardHeight,{toValue: e.endCoordinates.height, duration:250, useNativeDriver:true})`; `keyboardDidHide` -> toValue 0. Listeners removed on unmount. The nav bar uses `translateY: keyboardHeight.interpolate({inputRange:[0,1000], outputRange:[0,0]})` — i.e. always 0, so the animation has no visible effect (the nav bar does not move/hide with the keyboard).

### Nav bar design
Absolute wrapper (bottom 20, left/right 12, zIndex 100, centered) > LinearGradient `[backgroundSecondary, backgroundSecondary]` (solid), start {0,0} end {1,1}, style floatingNavBar (row, space-between, width 100%, paddingV 10, paddingH 6, radius 24, borderWidth 1) + borderColor theme.border, shadow '#101828' opacity 0.08 radius 24 elevation 4 in light mode (transparent/0/0 in dark). Tabs in visual order left->right: حسابي(user), المساعد(message-circle), الخدمات(grid), المعاملات(clipboard), الرئيسية(home) — Feather size 20 (RTL-style: home on the right). Each tab: TouchableOpacity flex 1, active scale 1.05; icon cloned with color primaryBrand (active) / textMuted; iconWrapper marginBottom 4 (+elevation 1), active gets shadowColor primaryBrand; label fontSize 9 bold; active shows a 6x6 dot (radius 3, bottom -6) in primaryBrand.

## (a) Files written
- /home/claude/muamalaty/App.js (module 562)
- /home/claude/muamalaty/src/theme/ThemeContext.js (module 717)
- /home/claude/muamalaty/src/components/GlassCard.js (module 719)
- /home/claude/muamalaty/src/components/SkeletonLoader.js (module 724)
All four pass `esbuild --loader:.js=jsx`.

## (b) Exports / imports
- App.js: `export default App`. Imports react (useState, useEffect, default React for useRef/cloneElement), react-native (View, Text, TouchableOpacity, SafeAreaView, StyleSheet, StatusBar as RNStatusBar [currentHeight], Animated, Keyboard, Alert), expo-status-bar `StatusBar`, @expo/vector-icons `Feather`, expo-linear-gradient `LinearGradient`, `useAppStore`, `useTheme`, `HomeScreen`, `ChatScreen`, `TransactionsScreen`, `ServicesHubScreen`, `ProfileScreen`, `AdminScreen`, `GlassCard`, `* as securityService` (uses hasPIN, savePIN, verifyPIN, authenticateBiometric — all confirmed named exports of module 649).
- ThemeContext.js: named `lightTheme`, `darkTheme`, `themeConfig`, `useTheme`. Imports `useAppStore` (641). NOTE: no React Context exists despite the filename; `useTheme` just reads the store.
- GlassCard.js: named `GlassCard`. Imports react, react-native (View, StyleSheet), LinearGradient, useTheme.
- SkeletonLoader.js: named `SkeletonLoader`. Imports react (useRef, useEffect), react-native (View, Animated, StyleSheet), useTheme, GlassCard.

## (c) Props
- App: none.
- GlassCard: `{ children, style, borderColor, glow = false }`.
- SkeletonLoader: none.
- useTheme() returns `{ theme, isDarkMode, toggleDarkMode, themeConfig }`.

## (d) Store fields/actions used
- ThemeContext/useTheme: `isDarkMode`, `toggleDarkMode`.
- App: `isLocked`, `unlockApp`, `pinLockEnabled`, `biometricLockEnabled`, `loadPersistedData`.
- All via `useAppStore()` with NO selector (whole-store subscription -> every store change re-renders App, every GlassCard, etc.).

## (e) Bugs / suspicious behaviour
1. SECURITY (App ~231960–232060 `setupDefaultPINForTest`): on every launch, if no PIN exists, PIN '1234' is silently saved. Test code shipped in production.
2. SECURITY: the default PIN «1234» is printed on the lock screen subtitle (~232745) and in the wrong-PIN alert (~232212). Anyone holding the phone is told the PIN.
3. SECURITY: no attempt limit / lockout / delay on wrong PIN; brute force of 4 digits is trivial.
4. Lock screen only shown if `pinLockEnabled || biometricLockEnabled`; if the store has isLocked true but both flags false the app is open — fine — but if biometric only is enabled and authentication fails/cancels, the user can still unlock with the PIN (default 1234), so biometric-only lock is effectively PIN 1234.
5. Keyboard animation is dead: interpolate outputRange [0,0] (~232420) makes translateY constantly 0; the keyboard listeners and Animated.timing do nothing visible. Also `useNativeDriver: true` on a value used only for transform is ok, but the whole thing is dead code.
6. `handleKeyPress` and `handleBackspace` are empty function bodies in the bundle (~232168, ~232290); their logic was inlined into the keypad onPress. Reconstructed as normal helpers (behaviour identical).
7. Stale closure / race: `handleKeyPress` reads `pinInput` from render closure; fast taps before re-render can drop digits. `handlePinSubmit` is fired with newPin directly (ok).
8. Unreachable alert: bio key is `disabled` when biometric is off, so the «البصمة غير مفعلة بعد...» Alert branch can never run.
9. `themeConfig` destructured from useTheme in App but unused. `handleQuickSelect` is a duplicate of `handleSearchSubmit`.
10. Mount effect has `[]` deps but calls `loadPersistedData` / `setupDefaultPINForTest` (fine at runtime, lint warning). The second effect calls handleBiometricUnlock which is recreated per render (not in deps).
11. Lock screen does not wait for `loadPersistedData` to finish: if `isLocked`/lock flags are restored asynchronously, there may be a flash of unlocked content (depends on store, check module 641).
12. Tab ids include the switch default -> HomeScreen; unknown ids silently show Home.
13. Nav bar `bottom:20` absolute over screens: screens must add bottom padding themselves or content is hidden behind the bar.
14. SafeAreaView from react-native only works on iOS; paddingTop uses `StatusBar.currentHeight || 24` (Android) – on iOS this adds 24 on top of SafeAreaView inset (double padding).
15. GlassCard: `glow && isDarkMode && {borderColor: theme.border}` just re-sets the same border as default (no visual effect unless a custom borderColor was passed, in which case glow overrides it).
16. GlassCard: LinearGradient with two identical colors `[cardMain, cardMain]` — gradient is a no-op (solid). Same for nav bar `[backgroundSecondary, backgroundSecondary]`.
17. SkeletonLoader: `Animated.loop(...).start()` has no cleanup — the loop keeps running after unmount (minor leak / warnings). No deps, fine otherwise.
18. App lock-screen dots: `borderColor: 'rgba(255,255,255,0.05)'` hard-coded (invisible in light mode) — cosmetic.

## (f) Unsure
- floatingNavBar and iconWrapper styles contain `copyDataProperties` (object spread). For floatingNavBar the source register is explicitly `undefined` (no-op spread, maybe a constant-folded `Platform.select`/conditional); I omitted it. For iconWrapper the source looks like `{elevation: 1}`; I included `...{ elevation: 1 }`. Register order of copyDataProperties args was inferred from GlassCard (target, then source in the next lower register), which matches.
- `keyboardDidHide` callback takes an (unused) event param in the bundle — kept.
- Lock screen root is a plain `View` (not SafeAreaView) — as in the bundle.
