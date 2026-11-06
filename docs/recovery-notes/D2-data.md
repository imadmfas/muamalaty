# D2-data — modules 721, 722, 723

## (a) Files written
- /home/claude/muamalaty/src/services/aiEngine.js            (module 721, lines 274608–275316)
- /home/claude/muamalaty/src/data/servicesData.js            (module 722, lines 275316–275865)
- /home/claude/muamalaty/src/services/verificationService.js (module 723, lines 275865–277519)

All three parse with `npx esbuild@0.24 --loader:.js=jsx`.

How servicesData.js was produced: the data literals are too big to copy by hand safely, so a script
(/home/claude/tools/extract722.js + gen722.js) took the decompiled lines, swapped every positional
`rX[n] = rY` for the n-th key of that register's last object literal, ran the code, and printed it
back out as JS. Checks done: every line in the data range matched one of the expected patterns
(nothing skipped); no field is left `null`; all 16 services share the same 53 keys in the same order
(the order of the first literal); a round-trip deep-equal of `INITIAL_SERVICES` against the
extracted data passed; `getFullInitialServices()` returns 59 services with unique ids. The strings
are byte-for-byte from the bytecode literals. Extracted JSON: /home/claude/tools/data722.json.

Naming: module 721 is a rule-based keyword/synonym scorer, not AI. The file name `aiEngine.js` was
kept because the brief names it so and other modules import it by that path.

## (b) Exports / imports
- aiEngine.js
  - exports: `normalizeArabic(text)`, `detectIntent(query)`, `getGovernoratesList()`
  - imports: `{ getFullInitialServices }` from '../data/servicesData' (dep 722)
- servicesData.js
  - exports: `INITIAL_SERVICES` (16 services), `getFullInitialServices()` (returns a new array:
    the 16 plus 43 generated services = 59)
  - imports: none
- verificationService.js
  - exports: `checkInternetConnection`, `getCachedService`, `saveCachedService`, `getUpdateLogs`,
    `addUpdateLog`, `calculateFreshnessScore`, `resolveConflict`, `verifyServiceDetails`,
    `getConfidenceColor`, `getConfidenceText`
  - imports: default `AsyncStorage` from '@react-native-async-storage/async-storage' (dep 645,
    with interop `__esModule ? m : {default: m}`)

## (c) Props — n/a (no components)

## (d) Store — none used (no zustand access in these modules)

## Service object shape (exactly 53 keys, in this order)
service_id:string, service_name_ar:string, service_name_en:string, category:string,
ministry_name:string, department_name:string, provider_name:string, governorate:string,
district:string, office_name:string, office_address:string, latitude:number, longitude:number,
google_maps_link:string, phone_number:string, email:string, official_website:string,
online_service_link:string, booking_required:boolean, application_form:string,
required_documents:string[], optional_documents:string[], eligibility_conditions:string[],
estimated_fees_iqd:number, payment_method:string, expected_processing_time:string,
working_days:string[], working_hours:string, citizen_notes:string, ai_keywords:string[],
search_aliases:string[], verification_status:'official'|'portal'|'verified_web'|'local',
verification_score:number, last_verified_date:'YYYY-MM-DD', last_source_check:'YYYY-MM-DD',
internet_required:boolean, fallback_allowed:boolean,
source_priority:'official_sources'|'government_portals'|'verified_web'(?)|'local_database',
service_status:string, legal_reference:string, required_photos:number, appointment_needed:boolean,
estimated_wait_days:number, digital_available:boolean, qr_link:string (may be ''), source_url:string,
office_type:string, citizen_category:string, gender_restrictions:string, age_requirements:string,
priority_level:string, created_at:string, updated_at:string
(There is NO `steps` field. "Steps" have to come from other modules, e.g. the engine 725–730.)

In the source the key order differs between literals (for example `required_photos` sits at index
43 in the first service and index 21 in the others). The output uses each literal's own order.

The 16 static services: moi_issue_passport, moi_renew_passport, moi_issue_nid, moi_update_nid,
moi_transfer_records, moi_residency_permit, moi_issue_driving_license, moi_renew_driving_license,
moi_register_vehicle, moi_transfer_vehicle_ownership, moi_renew_vehicle_registration,
moh_birth_certificate, moh_death_certificate, mot_ration_card_add_child, moe_new_subscription,
mun_building_permit.
The 43 generated ones come from `{id, ar, cat, alias, fee}` items placed into a fixed template
(verification_status 'local', score 74, source_priority 'local_database', internet_required false,
generic documents and conditions, `service_name_en = id.replace(/_/g,' ')`,
`office_name = 'دائرة ' + dep + ' الفرعية'`, `ai_keywords = alias`, `search_aliases = [ar]`).
The ministry and department are looked up in a 15-entry `{cat,min,dep}` table, falling back to
'الجهة الرسمية المختصة' / 'الدائرة المختصة'.

## detectIntent return shape
`{ matchedService: service|null, confidenceScore: 0..100, needsGovernorate: false (always),
   needsDetails: boolean, suggestedServices: service[] (≤4), intentType: 'empty'|'no_match'|'partial_match'|'high_match' }`

## verifyServiceDetails(service, isOnline) return shape
`{ service, sourceType: 'cached_verified'|'local_database'|'official_sources'|'government_portals'|'verified_web',
   confidenceScore, isFresh, isOffline, lastChecked, freshnessScore }`
Update-log entry (AsyncStorage '@muamalaty_update_logs', newest first, at most 100):
`{ timestamp: ISO, serviceId, sourceType: 'official'|'portal'|'web', resolvedConflicts: string[], freshnessScore: 100 }`

## Network endpoints / storage keys
- `fetch('https://eservice.ur.gov.iq', {method:'HEAD', headers:{'Cache-Control':'no-cache'}})`, 2000 ms abort
- fallback `fetch('https://www.google.com', {method:'HEAD'})`, 1500 ms abort
- No other network calls. verifyServiceDetails does NOT fetch anything (see bugs).
- AsyncStorage keys: `@muamalaty_cache_<service_id>`, `@muamalaty_update_logs`
- URLs inside the data only (not fetched): eservice.ur.gov.iq (+ /index/service-details/10012, 10041,
  10043, 10048, 10052), ter.moi.gov.iq, http://nid-moi.gov.iq (plain http), epp.iq,
  maps.google.com/?q=lat,lng; emails *@moi.gov.iq, info@ur.gov.iq.

## (e) Bugs / suspicious behaviour
1. verificationService `verifyServiceDetails` (decompiled ~276930–277380): the "online
   verification" is fake. It waits 1500 ms and then applies hard-coded updates, yet it labels the
   result 'official_sources' / 'government_portals' with confidence 98/92/80 and logs it as a real
   update. Users are shown "verified" data that was never checked.
2. Same function: it checks the id `'mot_ration_add_child'`, but the real service id is
   `'mot_ration_card_add_child'`. That branch never runs, so the ration service falls into the
   generic 'web' branch.
3. The 'web' branch gives every other service the working hours 'من الساعة 8:00 صباحاً وحتى 2:30 ظهراً
   (توقيت صيفي معتمد)'. For services whose current status is official or portal, resolveConflict
   ignores that field because priority 1 is lower. Even so, verifyServiceDetails then sets
   `verification_status = 'verified_web'` and score 80, which downgrades official records, and
   saves the result to the cache. After one online view, an "official" service (score 98)
   permanently shows as 80 / verified_web.
4. resolveConflict: the priority map uses the key 'web' while statuses use 'verified_web'. A
   sourceType of 'verified_web' would get priority `undefined`, and `undefined >= x` is always
   false, so every update would be ignored. The current callers pass only 'official' / 'portal' /
   'web', so this mismatch is latent.
5. resolveConflict passes `cached || service` as the current data. Once a service is cached, later
   changes to the static data (a new app version) are never picked up, because the cache always
   wins and is only refreshed from itself.
6. Online, a cache hit for "today" returns `isFresh: true` and skips the update. The day comes
   from `toISOString()`, which is UTC, so around midnight in Iraq (UTC+3) the "today" check is off
   by one day.
7. Offline confidence is clamped to `Math.max(50, Math.min(74, score))`, so even official data
   shows ≤74 when offline. This may be intended.
8. calculateFreshnessScore: the penalty is 0.1 per day, capped at 50. Dates are mostly from 2026-05,
   so the score barely moves (about 0.1/day), and `isFresh = freshness > 85` stays true for about
   150 days. If `last_verified_date` is invalid, the result is NaN.
9. checkInternetConnection: when fetch throws, the timeouts are never cleared (a minor leak, since
   the abort fires later on a finished request). The probe treats any status below 500 (for
   example 403/404) as online. The fallback to google.com does not work in regions where Google
   is blocked.
10. detectIntent: `getFullInitialServices()` rebuilds 59 objects on every call (wasted work). The
    value `bestMatch && bestMatch.score < 60 && suggestedServices.length > 0` is computed and never
    used (dead code, kept as `isAmbiguous`). `needsGovernorate` is always false (an unfinished
    feature?). The synonym loop normalizes keys again for every word.
11. The SYNONYMS entry for 'طابو' contains the odd phrase 'ملك ملكية عقار' (copied as-is). Keys
    'سنويه', 'تموينيه', 'هويه' and 'اجازه'/'اجازة' collapse into the same key after normalizing.
    That is harmless but means the same synonyms get pushed twice (Set de-dups them).
12. servicesData: placeholder contact data everywhere: phone '07700000000' / '07800000000' (and '444'
    for traffic), the same Baghdad coordinates 33.3152,44.3661 for all 43 generated services,
    `governorate: 'كل المحافظات'`. These are hard-coded test values shown to users as real
    office data.
13. servicesData: 31 of the 43 generated services use categories that are not in the 15-entry
    category table (e.g. 'تقرير طبي', 'لقاحات', 'هيئة التقاعد'), so they show the generic ministry
    'الجهة الرسمية المختصة'. The table has 'هيئات مستقلة' while the items use 'هيئة التقاعد',
    'هيئة النزاهة' and so on. The table's 'تعليم', 'تعليم عالي', 'رعاية', 'بلدية', 'أمانة بغداد' entries
    are never matched (dead data).
14. servicesData: `mun_building_permit` has category 'عقار', so it gets classified with real estate
    rather than 'بلدية'. `http://nid-moi.gov.iq` uses plain http (mixed content and cleartext
    traffic, which Android may block).
15. The verification dates in the data are all in the future relative to the app's build era
    (2026-05-xx). That is fine today, but freshness is computed with Math.abs, so a future date
    also counts as "stale".

## (f) Uncertainties
- detectIntent: the decompiler printed `scored[r0]` where r0 was last set to 30 (not 0). I
  interpreted this as `scored[0]` (the best match): a constant-zero load was probably elided by
  hermes-dec, since the first read of `r10[r0]` happens before any r0 assignment. The same applies
  to `.split('T')[r0]` → `[0]` in resolveConflict and verifyServiceDetails, and to
  `suggested.length > r0` → `> 0`.
- detectIntent keyword loop: the scope labels (`_closure1_slot3`) are ambiguous about which array is
  iterated and which is searched. I reconstructed it as `uniqueTerms.forEach(term => keywords.some(...))`,
  by analogy with the name-word loop `queryWords.forEach(qw => nameWords.some(...))`. If it is the
  other way round, only the count of keyword matches changes (capped at 3×10).
- The word ratio is divided by `nameWords.length` (service-name words), not by query words; that is
  what the registers show.
- getCachedService / getUpdateLogs swallow errors silently (no console). saveCachedService and
  addUpdateLog log with console.error. Matches the bytecode.
