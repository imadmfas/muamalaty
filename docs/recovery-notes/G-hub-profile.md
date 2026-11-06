# G-hub-profile notes

## (a) Files written
- /home/claude/muamalaty/src/screens/ServicesHubScreen.js  (module 733, decompiled.js 285219–287181)
- /home/claude/muamalaty/src/screens/ProfileScreen.js      (module 734, decompiled.js 287181–287758)
Both parse with esbuild (jsx loader).

## (b) Exports / imports
### ServicesHubScreen.js
- Exports: named `ServicesHubScreen` only (no default; no other exports). `formatMedTime` is NOT exported — it is a local closure inside the component.
- Imports: react (useState); react-native (View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert);
  @expo/vector-icons (Feather, Ionicons, MaterialCommunityIcons); expo-linear-gradient (LinearGradient);
  ../store/useAppStore (useAppStore); ../theme/ThemeContext (useTheme); ../components/GlassCard (GlassCard).
  Deps array: [81, 45, 565, 639, 641, 717, 719, 256].

### ProfileScreen.js
- Exports: named `ProfileScreen` only.
- Imports: react (useState); react-native (View, Text, TouchableOpacity, StyleSheet); @expo/vector-icons (Feather);
  ../theme/ThemeContext (useTheme); ./FamilyScreen (FamilyScreen); ./SavedScreen (SavedScreen); ./SettingsScreen (SettingsScreen).
  Deps array: [81, 45, 565, 717, 735, 737, 738, 256].

## (c) Props
- ServicesHubScreen({ onAskAI }) — onAskAI destructured but never used.
- ProfileScreen({ onOpenAdmin, onAskAI }) — onAskAI never used.
- **Props ProfileScreen passes to sub-screens (exact):**
  - `<FamilyScreen />` — NO props (rendered for tab 'docs' and as fallback).
  - `<SavedScreen />` — NO props.
  - `<SettingsScreen onOpenAdmin={onOpenAdmin} />` — only `onOpenAdmin`.
- GlassCard is called with props `borderColor`, `style`, `children`.
- useTheme fields: theme, isDarkMode, toggleDarkMode, themeConfig (Profile uses themeConfig.shadowLight.shadowColor;
  ServicesHub reads themeConfig but never uses it).
- theme keys used: textPrimary, textSecondary, textMuted, background, backgroundSecondary, cardMain, cardElevated (Profile),
  border, primaryBrand, secondaryAccent, warning, success, danger.

## (d) Store fields/actions (ServicesHubScreen only; ProfileScreen uses no store)
- `chronicMedications` (array of {id, medName, diseaseName, time "HH:MM"})
- `removeChronicMedication(id)`
- `childVaccines` (array of {id, name, gender, scheduledDates: [{date, label, vaccine}]})
- `removeChildVaccine` — destructured, never used.

## Behaviour summary
- ServicesHub: state `expandedChildId` (null) and `activeFilter` ('all'|'smart'|'finance'|'health').
  Sections: weather+dollar indicators and gold card show for all|finance; medications and vaccines for all|health;
  "أهم الخدمات" mock list for all|smart. Pills rendered in order ذكية, مالية, صحة, الكل (row-reverse).
  Vaccine status: date < now → success colour + 'مكتمل'; else warning + 'قادم'; badge bg = colour + '14'.
  formatMedTime: '' if falsy; split(':'), parseInt(hour), suffix hour>=12 'مساءً' else 'صباحاً', 12-hour (0/12 → 12), "h:mm suffix".
- Profile: state activeTab default 'docs'. Tabs (left→right): الضبط والأمان (settings), محفوظاتي (saved), مستمسكاتي (docs).
  Active tab: bg primaryBrand; icon/text colour isDarkMode ? theme.background : theme.cardElevated.

## (e) Bugs / suspicious
1. ServicesHub (285230–285300 area, map ~286200): weather "بغداد • مشمس 41°م", dollar "1,312 د.ع +0.48%", gold "485,000" and
   "آخر تحديث: مباشر من أسواق العراق المحلية" / "قبل دقائق" are hard-coded static values presented as live data (misleading).
2. "أهم الخدمات" items (صرف الراتب / معاملة جواز سفر / تجديد البطاقة الوطنية) and their statuses are hard-coded mock data (style names literally `mockService*`).
3. Medication trash button (~286320) calls removeChronicMedication and shows "تم الحذف" alert with no confirmation; no notification cancellation happens here (only if the store action does it).
4. formatMedTime: parseInt without radix; malformed time (no ':') gives "h:undefined"; NaN hour gives "NaN:..".
5. Vaccine status (~286560): `new Date(item.date)` — if date is not ISO (e.g. dd/mm/yyyy) it is Invalid Date → comparison false → always 'قادم'. Past date treated as 'مكتمل' (completed) automatically even if the vaccine was never given — misleading health status. Compares timestamps, so a vaccine due today (midnight UTC) already counts as past.
6. `child.scheduledDates.map` crashes if a child entry lacks scheduledDates.
7. Vaccine rows use array index as key.
8. Dead code: onAskAI (both screens), removeChildVaccine, themeConfig (ServicesHub), theme.cardMain/theme.border read into unused locals (both screens).
9. Empty-state texts direct users to page "حسابي" to add meds/children; ProfileScreen has no medication UI itself (it lives in FamilyScreen presumably) — verify.
10. ServicesHub glow: gradient colours `primaryBrand + '05'` / `secondaryAccent + '03'` append to a hex string — breaks if theme colours are rgba() or 8-digit hex. Glow only in dark mode. Style named glowBlue is placed bottom/right, glowPurple top/left (naming fine, just note).
11. Profile: tab key 'docs' labelled "مستمسكاتي" (documents) renders FamilyScreen — naming mismatch, and the final fallback also renders FamilyScreen (unreachable).
12. Profile tab-bar `shadowColor: themeConfig.shadowLight.shadowColor` crashes if themeConfig/shadowLight undefined.
13. Text grammar: "لا يوجد أدوية مضاف حالياً" (should be مضافة) — copied verbatim, not fixed.

## (f) Uncertain
- The decompiled map callback contained `typeof formatMedTime !== 'object'` → throwTypeError check; treated as the compiler's call guard (normal call).
- Order of the two LinearGradient glows reproduced as in bytecode (glowBlue first, then glowPurple).
