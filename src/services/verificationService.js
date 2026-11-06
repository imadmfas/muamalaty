// Reconstructed from Hermes module 723 (decompiled.js lines 275865–277519).
// Verification layer: connectivity probe, AsyncStorage cache, update log, conflict resolution.
// v1.1.0: verifyServiceDetails no longer pretends to fetch from government portals — see below.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// v1.1.0: on the web a cross-origin HEAD request is blocked by CORS and always looked
// "offline"; the browser's own online flag is used there instead. Native keeps the probe.
export const checkInternetConnection = async () => {
  if (Platform.OS === 'web') return typeof navigator === 'undefined' ? true : navigator.onLine !== false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const response = await fetch('https://eservice.ur.gov.iq', {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' },
    });
    clearTimeout(timeoutId);
    return response.ok || response.status < 500;
  } catch (error) {
    try {
      const fallbackController = new AbortController();
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 2000);
      const fallbackResponse = await fetch('https://www.google.com', {
        method: 'HEAD',
        signal: fallbackController.signal,
      });
      clearTimeout(fallbackTimeoutId);
      return fallbackResponse.ok;
    } catch (fallbackError) {
      return false;
    }
  }
};

const CACHE_PREFIX = '@muamalaty_cache_';
const UPDATE_LOGS_KEY = '@muamalaty_update_logs';

export const getCachedService = async (serviceId) => {
  try {
    const data = await AsyncStorage.getItem(`${CACHE_PREFIX}${serviceId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const saveCachedService = async (service) => {
  try {
    await AsyncStorage.setItem(`${CACHE_PREFIX}${service.service_id}`, JSON.stringify(service));
  } catch (error) {
    console.error('Error caching service:', error);
  }
};

export const getUpdateLogs = async () => {
  try {
    const logs = await AsyncStorage.getItem(UPDATE_LOGS_KEY);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    return [];
  }
};

export const addUpdateLog = async (log) => {
  try {
    const logs = await getUpdateLogs();
    logs.unshift(log);
    await AsyncStorage.setItem(UPDATE_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (error) {
    console.error('Error adding update log:', error);
  }
};

export const calculateFreshnessScore = (lastVerifiedDate) => {
  const verified = new Date(lastVerifiedDate);
  if (Number.isNaN(verified.getTime())) return 50;
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now.getTime() - verified.getTime()) / 86400000);
  const penalty = Math.min(50, diffDays * 0.1);
  return Math.round(100 - penalty);
};

export const resolveConflict = (currentData, incomingData, sourceType) => {
  const resolvedConflicts = [];
  const merged = { ...currentData };

  const incomingPriority = { official: 3, portal: 2, web: 1, verified_web: 1, local: 0 }[sourceType] ?? 0;
  const currentPriority =
    currentData.verification_status === 'official'
      ? 3
      : currentData.verification_status === 'portal'
        ? 2
        : currentData.verification_status === 'verified_web'
          ? 1
          : 0;

  const fields = [
    'estimated_fees_iqd',
    'required_documents',
    'online_service_link',
    'expected_processing_time',
    'office_address',
    'working_hours',
  ];

  fields.forEach((field) => {
    if (
      incomingData[field] !== undefined &&
      JSON.stringify(currentData[field]) !== JSON.stringify(incomingData[field])
    ) {
      if (incomingPriority >= currentPriority) {
        merged[field] = incomingData[field];
        resolvedConflicts.push(`تحديث حقل [${field}] من القيمة القديمة إلى القيمة المحدثة من المصدر`);
      } else {
        resolvedConflicts.push(`تجاهل تحديث حقل [${field}] لأن المصدر الحالي ذو أولوية أقل`);
      }
    }
  });

  if (resolvedConflicts.length > 0) {
    merged.updated_at = new Date().toISOString().split('T')[0];
    merged.last_verified_date = new Date().toISOString().split('T')[0];
    merged.verification_status =
      sourceType === 'official' ? 'official' : sourceType === 'portal' ? 'portal' : 'verified_web';
  }

  return { merged, resolvedConflicts };
};

// Curated corrections maintained by the author (were hard-coded in v1.0.0 as a fake
// "online update"; the ration-card id was misspelled there so it never applied).
const CURATED_UPDATES = {
  moi_issue_passport: {
    estimated_fees_iqd: 25000,
    online_service_link: 'https://eservice.ur.gov.iq/index/service-details/10043',
    expected_processing_time: 'من 2 إلى 5 أيام عمل (محدثة إلكترونياً)',
  },
  mot_ration_card_add_child: {
    online_service_link: 'https://eservice.ur.gov.iq/index/service-details/10048',
    expected_processing_time: 'من 2 إلى 4 أيام عمل عبر تطبيق تمويني الذكي',
  },
};

const SOURCE_TYPE = {
  official: 'official_sources',
  portal: 'government_portals',
  verified_web: 'verified_web',
};

// v1.1.0 — honest verification. The app has no live government API, so v1.0.0's
// "pulling from official portals" step (a 1.5 s sleep, then every service relabelled
// "official"/"portal"/"verified_web" with 98/92/80 and cached forever) is gone. The
// result is now the built-in record plus the author's curated corrections, and the
// confidence is the record's own verification score, reduced as its check date ages.
export const verifyServiceDetails = async (service, isOnline) => {
  const data = { ...service, ...(CURATED_UPDATES[service.service_id] || {}) };
  const freshnessScore = calculateFreshnessScore(data.last_verified_date);
  const baseScore = typeof data.verification_score === 'number' ? data.verification_score : 60;
  const confidenceScore = Math.max(0, Math.min(baseScore, freshnessScore));

  await addUpdateLog({
    timestamp: new Date().toISOString(),
    serviceId: service.service_id,
    sourceType: data.verification_status || 'local',
    resolvedConflicts: CURATED_UPDATES[service.service_id]
      ? ['طُبّقت تصحيحات المؤلف المعتمدة على بيانات الخدمة']
      : ['لا توجد تصحيحات، البيانات كما في قاعدة التطبيق'],
    freshnessScore,
  });

  return {
    service: data,
    sourceType: SOURCE_TYPE[data.verification_status] || 'local_database',
    confidenceScore,
    isFresh: freshnessScore > 85,
    isOffline: !isOnline,
    lastChecked: data.last_verified_date,
    freshnessScore,
  };
};

export const getConfidenceColor = (score) => {
  if (score >= 95) return '#00E676';
  if (score >= 75) return '#2979FF';
  if (score >= 50) return '#FFD600';
  return '#FF1744';
};

export const getConfidenceText = (score) => {
  if (score >= 95) return 'موثق رسمي حكومي';
  if (score >= 75) return 'متحقق منه ومطابق';
  if (score >= 50) return 'قاعدة بيانات محلية محفوظة';
  return 'غير مؤكد وتحتاج مراجعة الدائرة';
};
