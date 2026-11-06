# F-transactions — modules 731, 732

## (a) Files written
- /home/claude/muamalaty/src/screens/TransactionsScreen.js   (module 731, decompiled.js 281188–282980)
- /home/claude/muamalaty/src/components/TransactionDetailModal.js (module 732, decompiled.js 282980–285219)
Both pass `esbuild --loader:.js=jsx`.

## (b) Exports / imports
### TransactionsScreen.js
- export `TransactionsScreen` (named only, no default)
- imports: react {useState, useMemo}; react-native {View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, FlatList};
  @expo/vector-icons {Feather, Ionicons, MaterialCommunityIcons, FontAwesome5}; expo-linear-gradient {LinearGradient};
  ../theme/ThemeContext {useTheme}; ../components/GlassCard {GlassCard}; ../data/servicesData {getFullInitialServices};
  ../components/TransactionDetailModal {TransactionDetailModal}
- deps array: [81,45,565,639,717,719,722,732,256]
### TransactionDetailModal.js
- export `TransactionDetailModal` (named only)
- imports: react default + {useState} (bundle uses interop-default React for useMemo -> `React.useMemo`);
  react-native {View, Text, StyleSheet, Modal, SafeAreaView, TouchableOpacity, ScrollView, Alert, Linking};
  @expo/vector-icons {Feather, Ionicons, MaterialCommunityIcons}; expo-linear-gradient {LinearGradient};
  ../store/useAppStore {useAppStore}; ../theme/ThemeContext {useTheme}; ./GlassCard {GlassCard};
  ../engine/index {StoreAdapter}; ../engine/solver {PathFinder, ConstraintSolver}; ../engine/simulator {PathSimulator}
- deps array: [81,45,565,639,641,717,719,725,728,730,256]
### Dep export names verified (top of modules)
- 722: INITIAL_SERVICES, getFullInitialServices
- 725: StoreAdapter (also a `mapStoreStateToInput` function defined; looked like a local, verify with engine group)
- 728: PathFinder, ConstraintSolver
- 730: PathSimulator
- 717: lightTheme, darkTheme, themeConfig, useTheme (ThemeProvider presumably too — not checked)
- 719: GlassCard
- 641: useAppStore

## (c) Props
- TransactionsScreen: `{ onAskAI }` (passed straight through to the modal)
- TransactionDetailModal: `{ service, visible, onClose, onAskAI }`
- GlassCard is used with `{ borderColor, style, children }`
- Engine API used: `StoreAdapter.buildGraphFromStore(store)`, `PathFinder.generatePaths(graph, 'service_'+id)`,
  `ConstraintSolver.solveConstraints(graph, paths, today)`, `PathSimulator.simulateAndRank(graph, solved, today)`,
  `PathSimulator.calculateConfidence(graph, best.path, best.isValid, today)`; result items have `isValid`, `path.steps[]`
  (step: `id, label, duration, requiredDocs[]`), `reason`.
- useTheme() returns `{ theme, isDarkMode, toggleDarkMode, themeConfig }`; theme keys used: primaryBrand, success, warning,
  danger, secondaryAccent, background, backgroundSecondary, cardMain, cardElevated, cardSoftTint, border, divider,
  textPrimary, textSecondary, textMuted; themeConfig.shadowLight.{shadowColor, shadowOpacity, shadowRadius, elevation}.
- Service object fields used: service_id, service_name_ar, ministry_name, department_name, category, verification_status
  ('portal' | 'verified_web' | other), expected_processing_time, estimated_fees_iqd, office_name, office_address,
  booking_required, payment_method, required_documents[], online_service_link, last_source_check, last_verified_date,
  citizen_notes.

## (d) Store fields/actions
- Modal: `favorites`, `addFavorite(id)`, `removeFavorite(id)`; and the WHOLE store via a second `useAppStore()` call.
- TransactionsScreen: no store usage.

## (e) Bugs / suspicious behaviour
TransactionsScreen.js
1. Tracking tab is entirely hard-coded demo data (4 fake transactions, refs 2024/5686–5689, "منذ 3 أيام" etc.), not
   linked to the store or any API (bundle ~281520).
2. `color` field on each tracked transaction is computed but never used (icon/badge colour comes from status instead).
3. `categoryKey` in guideCategories is never used; filtering is a hard-coded if/else chain on Arabic labels. Category
   `count` values (12,18,8,15,10,14) are hard-coded, not computed from data.
4. Category overlap: 'بلدية' matches both "السكن والعقارات" (exact array) and "البلديات والخدمات" (includes).
   Housing/health use exact `Array.includes(category)` while others use substring `category.includes(...)` — inconsistent.
5. Search compares against untrimmed `searchQuery` (only the emptiness check is trimmed): a query with leading/trailing
   spaces won't match. Also `service_name_ar.toLowerCase()` / `ministry_name` / `category` crash if any service lacks them.
6. When searching with no category, there is no back button; guide grid only returns when the text is cleared.
   Switching to 'track' tab doesn't clear searchQuery.
7. `selectedService` is never reset on close; modal stays mounted (Modal with visible=false) after first open, and its
   engine useMemo keeps re-running on every store change.
8. Dead reads `theme.cardMain` / `theme.border` at top level (kept as `cardBg`/`borderColor` unused locals, ~282098).
9. `guideCategories` array recreated every render (not memoized); guide cards keyed by index.
10. Glow styles: `glowBlue` gradient uses the style named glowBlue (bottom/right) and purple uses glowPurple(top/left)—fine,
   but glows only render in dark mode with near-invisible opacity (0.02 / 0.012).
11. `progress*100` used raw for width string (float like "60.00000000000001%" possible).

TransactionDetailModal.js
12. `useAppStore()` called twice; the second call selects the entire store with no selector → modal re-renders and the
    engine graph is rebuilt on every store update (perf). (~283180)
13. `todayStr` memoized with [] — stale if the modal stays mounted past midnight. Uses UTC date (toISOString), so in Iraq
    (UTC+3) between 00:00–03:00 the "today" is yesterday.
14. Stats fee: `estimated_fees_iqd !== 0 ? x.toLocaleString()` → crash if fee is undefined/null; step 3 uses `> 0` instead
    (inconsistent; negative/undefined show 'مجانية' there).
15. `{service.citizen_notes && (...)}` — if citizen_notes is '' this renders an empty string outside <Text> → RN
    "Text strings must be rendered within a <Text>" crash/warning risk. (~284880)
16. `onAskAI` not guarded — crashes (TypeError) if TransactionsScreen is rendered without `onAskAI`. `handleTriggerAI` also
    calls onClose() first.
17. `showAllSteps` toggle ("عرض الكل"/"طي الخطوات") has no effect when engineResult exists (all engine steps always
    shown); in fallback mode steps 2–4 also show whenever `booking_required` is true, so the toggle does nothing then.
18. Fallback steps are generic hard-coded text (e.g. "أخذ البصمات", "الصورة الحيوية") shown for every service.
19. Link button text hard-codes "(بوابة أور)" for every online link. Law notice text is about "التأخر في التجديد" for
    every service with citizen_notes.
20. Label "الجهة الرسمية المصدرة للخدمة" displays `last_source_check` (semantically a date/check field?), with a fallback
    hard-coded to the Interior Ministry passports directorate for all services. `last_verified_date` fallback is the
    hard-coded '2026-05-20'.
21. handleAddDocToReminders shows a "success" alert but saves nothing (no store write) — fake feature.
22. checkedDocs is local state keyed by document text: lost on close/reopen; duplicate doc names share state. Doc rows
    keyed by index.
23. Inline `{backgroundColor: theme.cardMain, borderColor}` is applied AFTER docItemRowActiveDark/Light in the style array,
    so the "active" green background/border styles are always overridden (dead styles).
24. `toggleDarkMode`, `themeConfig` destructured but unused in modal.
25. Engine errors are swallowed with console.error; confidence shown raw (`ثقة: X%`) without rounding.
26. Alert titles: 'تم الإزالة' (grammatically odd but copied verbatim).

## (f) Uncertainties
- `handleOpenDetail`, `handleToggleDoc`, `handleOpenLink`, `handleAddDocToReminders` appear with EMPTY bodies in the
  decompile; Hermes inlined them into their call sites (with a "Trying to call a non-function" guard). Bodies were
  reconstructed from the inlined code — semantics are faithful, original exact form may differ slightly.
- In the inlined add-reminder body the decompiler shows `_closure1_slot2.Alert` (slot2 at component depth = onAskAI);
  the function's environment is r28 (module scope) where slot2 = react-native, so it is `Alert` from RN — decompiler
  artifact, not a bug.
- handleToggleDoc's computed-key object `{...prev, [doc]: !prev[doc]}` is inferred from copyDataProperties + keyed write.
- Engine import path used `../engine/index` for module 725 (StoreAdapter); adjust if engine group re-exports elsewhere.
- Whether calculateConfidence returns a rounded number is up to the simulator module.
