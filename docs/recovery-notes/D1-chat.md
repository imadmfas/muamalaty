# D1-chat — module 720 → src/screens/ChatScreen.js

Source range: /home/claude/work/decompiled.js lines 270514–274608 (module 720, deps [81,45,565,639,641,717,721,723,719,724,725,728,730,256]).

## (a) Files written
- /home/claude/muamalaty/src/screens/ChatScreen.js (parses with esbuild; formatted with prettier → double quotes)

## (b) Exports / imports
Exports: `ChatScreen` (named only; module defines no `default`).
Imports:
- react: useState, useRef, useEffect, useCallback
- react-native: View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Animated, Keyboard, Linking, Alert, Share
- @expo/vector-icons: Feather, Ionicons
- expo-linear-gradient: LinearGradient
- ../store/useAppStore: useAppStore
- ../theme/ThemeContext: useTheme
- ../services/aiEngine (721): detectIntent   (721 exports: normalizeArabic, detectIntent, getGovernoratesList — it is an intent detector/NLU, name "aiEngine" is fine)
- ../services/verificationService (723): verifyServiceDetails, getConfidenceColor, getConfidenceText
  (723 exports: checkInternetConnection, getCachedService, saveCachedService, getUpdateLogs, addUpdateLog, calculateFreshnessScore, resolveConflict, verifyServiceDetails, getConfidenceColor, getConfidenceText)
- ../components/GlassCard: GlassCard ; ../components/SkeletonLoader: SkeletonLoader
- ../engine/index (725): StoreAdapter (uses StoreAdapter.buildGraphFromStore(store)); 725 also exports mapStoreStateToInput
- ../engine/solver (728): PathFinder (generatePaths), ConstraintSolver (solveConstraints)
- ../engine/simulator (730): PathSimulator (simulateAndRank, calculateConfidence)

## (c) Props
`ChatScreen({ initialQuery, clearInitialQuery })` — initialQuery: string auto-submitted on change; clearInitialQuery: optional callback called right after.

## (d) Store / theme usage
useAppStore() (whole store object, also passed to StoreAdapter.buildGraphFromStore): addFavorite, favorites (array of service_id), removeFavorite, addRecentSearch.
useTheme(): theme, isDarkMode, toggleDarkMode, themeConfig (destructured, unused).
theme keys: textPrimary, textSecondary, textMuted, background, backgroundSecondary, cardMain, border, danger, warning, success, primaryBrand, secondaryAccent.

## Message object shape
```
{
  id: string,                 // '1' for welcome, else Math.random().toString()
  sender: 'assistant' | 'user',
  text: string,               // may contain **bold** markdown (rendered raw, not parsed)
  timestamp: string,          // new Date().toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit'})
  isFollowUp?: true,
  followUpType?: 'governorate' | 'details',
  suggestedOptions?: string[],
  serviceResult?: Service & { governorate, office_address, google_maps_link },
  confidenceScore?: number,
  sourceType?: string,        // from verifyServiceDetails, or 'local_database'
  isOffline?: boolean,
  completedWizardSteps?: number[]   // indexes of ticked wizard steps
}
```
Service fields read: service_id, service_name_ar, ministry_name, department_name, category, required_documents[], estimated_fees_iqd, payment_method, office_name, working_days[], working_hours, citizen_notes, last_source_check, last_verified_date, online_service_link, booking_required, expected_processing_time.
verifyServiceDetails(service, isOnline) result shape read: { service, confidenceScore, sourceType, isOffline }.
detectIntent(text) result read: { needsDetails, matchedService }.

## Conversation flow
1. Mount: if no messages → welcome message (id '1'); checkActiveNetwork(); keyboardDidShow listener scrolls to end after 100 ms.
2. handleUserSubmit(text) (send button, onSubmitEditing, or initialQuery effect): ignore blank; clear input; add user msg; addRecentSearch(text); setIsTyping(true); then try { detectIntent(text) }:
   - needsDetails && matchedService → setSelectedService; assistant follow-up `followUpType:'details'`, options: service_id includes 'passport' → ['إصدار جواز سفر لأول مرة','تجديد جواز سفر منتهي']; includes 'nid' → ['إصدار البطاقة لأول مرة','تحديث بيانات البطاقة','إصدار بدل ضائع للموحدة']; else ['معاملة جديدة','تجديد معاملة سابقة'].
   - matchedService only → setSelectedService; follow-up `followUpType:'governorate'` with 7 governorates (بغداد، الأنبار، نينوى، البصرة، بابل، النجف الأشرف، كربلاء المقدسة).
   - none → "not found" msg with suggestedOptions ['إصدار جواز','بطاقة وطنية','إجازة سوق','تجديد سنوية','إضافة مولود للتموينية'] (NO followUpType → chip tap goes through 'details' path).
   - catch → network-error message.
3. Chip tap → handleFollowUpSelect(option, msg.followUpType || 'details'): adds user msg, setIsTyping(true);
   - 'details': detectIntent(option).matchedService || selectedService → setSelectedService, ask governorate (same 7 options). None → confusion message.
   - 'governorate': setSelectedGovernorate(option); requires selectedService else error msg; → executeVerificationPipeline(selectedService, option).
4. executeVerificationPipeline(service, governorate): staged loadingStatus texts with sleeps 600 → HEAD fetch → online: 800, 800, 600 / offline: 1000 → verifyServiceDetails(service, online) → builds serviceResult (adds governorate, office_address "دائرة {category} في مركز محافظة {gov}، العراق", google_maps_link) → result message with completedWizardSteps: [] (+ offline note line if isOffline) → resets selectedService/selectedGovernorate. catch → fallback msg with raw service, confidenceScore 65, sourceType 'local_database', isOffline true.
5. Result card: confidence badge (engine confidence || msg.confidenceScore || 50; ≥75 check icon), offline badge, engine rejection-reason banner, low-confidence banner (<50), docs, fees, office + Google Maps button, citizen notes, source/date box (+ online portal button), wizard (getEngineWizardSteps: engine path steps or 4 hard-coded fallback steps) with tick-toggle (toggleWizardStep(msg.id, index)), Share and Favorite buttons.

## Network calls
- `fetch('https://eservice.ur.gov.iq', { method: 'HEAD' })` — in checkActiveNetwork (mount) and in executeVerificationPipeline. Used only as connectivity probe. No API keys in this module.
- Linking.openURL(serviceResult.google_maps_link) → `https://www.google.com/maps/search/?api=1&query=دائرة+{category}+{governorate}`; Linking.openURL(serviceResult.online_service_link).
- Share.share({message, title}).

## (e) Bugs / suspicious behaviour (decompiled line refs)
1. `isOnline` state (useState(true), ~271075) is set but never read; the offline banner is driven only by networkAnim. Also the banner is only updated in checkActiveNetwork, NOT in executeVerificationPipeline (which calls setIsOnline but never animates) — banner goes stale.
2. `selectedGovernorate` state (~271160) set but never read.
3. Wizard step style (~273795–273830): `[wizardStepCard, isDone && {backgroundColor, borderColor: success+'33'}, {borderColor: theme.border}]` — the trailing borderColor always overrides the "done" border colour.
4. Engine is recomputed 3× per result message per render (getEngineConfidence, getEngineRejectionReason, getEngineWizardSteps each rebuild graph + paths + solve + simulate, ~270660–270960) — heavy; useCallback deps [store] (whole store object) defeats memoization.
5. getEngineWizardSteps fallback: `ranked.find(isValid) || ranked[0]` — invalid paths' steps still shown as the wizard. If `ranked` is empty, `best.path` guarded by `best &&` OK.
6. `{msg.confidenceScore && msg.confidenceScore < 50 && …}` (~273090): if confidenceScore is 0 → renders raw `0` inside a View → RN "Text strings must be rendered within <Text>" crash. Same risk for `{rejectionReason && …}` if reason is '' (renders '' – harmless on newer RN but fragile).
7. handleShare (~272465–272530): message is built OUTSIDE try (only Share.share is inside) → `estimated_fees_iqd.toLocaleString()` / `required_documents.map` throw unhandled if missing.
8. Fees in card: `estimated_fees_iqd > 0 ? toLocaleString()` OK, but required_documents.map / working_days.join in render crash if a service lacks these arrays (e.g. catch-path fallback uses raw service; fine only if data is complete).
9. handleUserSubmit: the async function has no awaits; addMessage/setInputText/setIsTyping run before try. detectIntent is the only guarded call; error text says "خلل بالشبكة" though nothing network-related happens.
10. handleFollowUpSelect uses `selectedService` from closure — chips from older messages keep working on whatever service is currently selected; after a completed pipeline selectedService is null, so tapping an old governorate chip yields "صار خلل بتحديد المعاملة". Chip from "not found" message has no followUpType → treated as 'details' (intentional fallback, but means the user re-detect).
11. initialQuery effect deps [initialQuery] only, calls handleUserSubmit from a stale closure (fine in practice). Effect runs before the welcome message is set → welcome may be appended after/before the query depending on batching; actually welcome uses setMessages([welcome]) (replace, not append) and runs in the mount effect which is declared BEFORE the initialQuery effect, but addMessage uses functional update so order: welcome replace then user msg append — OK; but if messages state were non-empty the welcome is skipped.
12. Typo in user-facing string: 'لقيتلك كافة المتمتلكات' (should be المستمسكات) — kept verbatim.
13. Hard-coded fallback date '2026-05-20' for last_verified_date and default source 'بوابة أور الحكومية - الأمانة العامة لمجلس الوزراء' shown as if verified (misleading provenance).
14. "Verification" is simulated: loading texts claim pulling data from official portals ("جاري سحب البيانات من البوابات الرسمية") but only a HEAD request is made; artificial delays 600–1000 ms.
15. Text with `**bold**` markdown is rendered as raw text (asterisks visible).
16. `styles.cardDisclaimer` defined but unused; `themeConfig`, theme.cardMain/theme.border reads at render top (~272560) unused.
17. HEAD fetch has no timeout → on hanging network the pipeline can stall indefinitely with isTyping=true and input disabled.
18. Message ids via Math.random().toString() — collision unlikely but not guaranteed; used as React keys and for toggleWizardStep.
19. In toggleWizardStep the decompiler shows an empty function (~272418) because its body was inlined into the step onPress (~273840–273890); reconstructed as a normal function with that inlined body.

## (f) Uncertainties
- KeyboardAvoidingView `behavior={undefined}` and `keyboardVerticalOffset={0}`: Metro inlined Platform.OS for the Android build; original was probably `Platform.OS === 'ios' ? 'padding' : undefined` (and maybe an iOS offset). Kept Android values.
- avatar `elevation: 3` and bubble `elevation: 2` were merged via copyDataProperties after the literal — original likely `...Platform.select({ ios: {shadow…}, android: { elevation: N } })` or a shared shadow object; iOS shadow values (if any) are lost.
- In generator bodies the decompiler's closure slot names are off by a level (e.g. `_closure1_slot7.detectIntent`, `_closure1_slot8.verifyServiceDetails`); resolved to module deps 721.detectIntent and 723.verifyServiceDetails by the property names.
- Placement of try/catch boundaries derived from the generator "in-try" flag slots: handleUserSubmit try starts after setIsTyping(true); executeVerificationPipeline try wraps everything; handleShare try wraps only Share.share.
- checkActiveNetwork returns nothing (undefined), confirmed.
