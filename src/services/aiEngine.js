// Reconstructed from Hermes module 721 (decompiled.js lines 274608–275316).
// Local (offline) keyword/intent matcher over the services catalogue — not an AI model.
import { getFullInitialServices } from '../data/servicesData';

const SYNONYMS = {
  'سنوية': ['سنوية', 'تسجيل مركبة', 'نقل ملكية', 'مركبة', 'سيارة'],
  'سنويه': ['سنوية', 'تسجيل مركبة', 'نقل ملكية', 'مركبة', 'سيارة'],
  'إجازة': ['إجازة سوق', 'إجازة بناء', 'رخصة', 'سياقة'],
  'اجازة': ['إجازة سوق', 'إجازة بناء', 'رخصة', 'سياقة'],
  'اجازه': ['إجازة سوق', 'إجازة بناء', 'رخصة', 'سياقة'],
  'تموينية': ['تموينية', 'بطاقة تموينية', 'إضافة مولود', 'طحين', 'غذاء'],
  'تموينيه': ['تموينية', 'بطاقة تموينية', 'إضافة مولود', 'طحين', 'غذاء'],
  'طابو': ['عقار', 'ملك ملكية عقار', 'بيان ملكية', 'بيت', 'أرض'],
  'هوية': ['بطاقة وطنية', 'جنسية', 'موحدة', 'الأحوال المدنية'],
  'هويه': ['بطاقة وطنية', 'جنسية', 'موحدة', 'الأحوال المدنية'],
  'جواز': ['جواز سفر', 'جوازات', 'تجديد جواز'],
  'سوق': ['إجازة سوق', 'سياقة', 'رخصة سياقة'],
  'سيارة': ['سيارة', 'مركبة', 'تسجيل مركبة', 'تحويل سيارة', 'لوحات'],
  'بناء': ['إجازة بناء', 'بلدية', 'ترخيص بناء'],
  'طفل': ['ولادة', 'إضافة مولود', 'لقاحات', 'تسجيل أول ابتدائي'],
  'ضائع': ['بدل ضائع', 'فقدت', 'ضاعت', 'شهادة', 'بطاقة'],
  'وفاة': ['وفاة', 'مات', 'توفي', 'حجة وفاة'],
  'ولادة': ['ولادة', 'بيان ولادة', 'حجة ولادة'],
};

export const normalizeArabic = (text) => {
  if (!text) return '';
  return text
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّ]/g, '')
    .trim()
    .toLowerCase();
};

export const detectIntent = (query) => {
  const services = getFullInitialServices();
  const normalizedQuery = normalizeArabic(query);

  if (!normalizedQuery) {
    return {
      matchedService: null,
      confidenceScore: 0,
      needsGovernorate: false,
      needsDetails: false,
      suggestedServices: [],
      intentType: 'empty',
    };
  }

  const queryWords = normalizedQuery
    .split(/\s+/)
    .map(normalizeArabic)
    .filter((w) => w.length > 0);

  const expandedTerms = [];
  queryWords.forEach((word) => {
    Object.keys(SYNONYMS).forEach((key) => {
      if (normalizeArabic(key) === word || word.includes(normalizeArabic(key))) {
        expandedTerms.push(...SYNONYMS[key]);
      }
    });
    expandedTerms.push(word);
  });
  const uniqueTerms = Array.from(new Set(expandedTerms));

  const scored = services.map((service) => {
    const normalizedName = normalizeArabic(service.service_name_ar);
    let score = 0;
    if (normalizedQuery.includes(normalizedName) || normalizedName.includes(normalizedQuery)) {
      score = 40;
    }

    const nameWords = normalizedName.split(/\s+/);
    let wordMatches = 0;
    queryWords.forEach((qw) => {
      if (nameWords.some((nw) => nw === qw || nw.includes(qw))) {
        wordMatches++;
      }
    });
    const wordRatio = wordMatches / Math.max(1, nameWords.length);

    let keywordMatches = 0;
    const keywords = [...(service.ai_keywords || []), ...(service.search_aliases || [])].map(normalizeArabic);
    score = score + wordRatio * 30;

    uniqueTerms.forEach((term) => {
      const normalizedTerm = normalizeArabic(term);
      if (keywords.some((k) => k === normalizedTerm || k.includes(normalizedTerm) || normalizedTerm.includes(k))) {
        keywordMatches++;
      }
    });

    const total = score + Math.min(30, keywordMatches * 10);
    return { service, score: Math.min(100, Math.round(total)) };
  });

  scored.sort((a, b) => b.score - a.score);

  const bestMatch = scored[0]?.score > 30 ? scored[0] : null;

  const suggestedServices = scored
    .filter((s) => s.score > 20 && s.service.service_id !== bestMatch?.service.service_id)
    .slice(0, 4)
    .map((s) => s.service);

  let needsDetails = false;
  if (bestMatch && queryWords.length <= 2) {
    const id = bestMatch.service.service_id;
    const passportAmbiguous =
      id.includes('passport') &&
      !queryWords.some((w) => w.includes('جدد') || w.includes('تجديد') || w.includes('اول'));
    needsDetails =
      passportAmbiguous ||
      (id.includes('nid') && !queryWords.some((w) => w.includes('اول') || w.includes('تحديث') || w.includes('ضائع')));
  }

  // Computed in the original but never used (dead code).
  // eslint-disable-next-line no-unused-vars
  const isAmbiguous = bestMatch && bestMatch.score < 60 && suggestedServices.length > 0;

  return {
    matchedService: bestMatch ? bestMatch.service : null,
    confidenceScore: bestMatch ? bestMatch.score : 0,
    needsGovernorate: false,
    needsDetails,
    suggestedServices,
    intentType: bestMatch ? (bestMatch.score > 70 ? 'high_match' : 'partial_match') : 'no_match',
  };
};

export const getGovernoratesList = () => [
  'بغداد',
  'الأنبار',
  'نينوى',
  'البصرة',
  'كربلاء المقدسة',
  'النجف الأشرف',
  'بابل',
  'ديالى',
  'كركوك',
  'واسط',
  'ذي قار',
  'المثنى',
  'ميسان',
  'القادسية',
  'صلاح الدين',
  'أربيل',
  'السليمانية',
  'دهوك',
  'حلبجة',
];
