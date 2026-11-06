// Reconstructed from Hermes module 723 (decompiled.js lines 275865–277519).
// "Verification" layer: connectivity probe, AsyncStorage cache, update log, conflict resolution
// and a SIMULATED online verification (hard-coded updates after a 1.5 s delay).
import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkInternetConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
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
      const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), 1500);
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
  const now = new Date();
  const diffDays = Math.ceil(Math.abs(now.getTime() - verified.getTime()) / 86400000);
  const penalty = Math.min(50, diffDays * 0.1);
  return Math.round(100 - penalty);
};

export const resolveConflict = (currentData, incomingData, sourceType) => {
  const resolvedConflicts = [];
  const merged = { ...currentData };

  const incomingPriority = { official: 3, portal: 2, web: 1, local: 0 }[sourceType];
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

export const verifyServiceDetails = async (service, isOnline) => {
  const today = new Date().toISOString().split('T')[0];
  const cached = await getCachedService(service.service_id);

  if (!isOnline) {
    const data = cached || service;
    const freshnessScore = calculateFreshnessScore(data.last_verified_date);
    const confidenceScore = Math.max(50, Math.min(74, data.verification_score));
    return {
      service: data,
      sourceType: cached ? 'cached_verified' : 'local_database',
      confidenceScore,
      isFresh: freshnessScore > 85,
      isOffline: true,
      lastChecked: data.last_verified_date,
      freshnessScore,
    };
  }

  if (cached && cached.last_verified_date === today) {
    const freshnessScore = calculateFreshnessScore(cached.last_verified_date);
    return {
      service: cached,
      sourceType: 'cached_verified',
      confidenceScore: cached.verification_score,
      isFresh: true,
      isOffline: false,
      lastChecked: cached.last_verified_date,
      freshnessScore,
    };
  }

  // Simulated network latency (no real request is made).
  await new Promise((resolve) => setTimeout(resolve, 1500));

  let updates = {};
  let sourceType = 'portal';
  if (service.service_id === 'moi_issue_passport') {
    updates = {
      estimated_fees_iqd: 25000,
      online_service_link: 'https://eservice.ur.gov.iq/index/service-details/10043',
      expected_processing_time: 'من 2 إلى 5 أيام عمل (محدثة إلكترونياً)',
    };
    sourceType = 'official';
  } else if (service.service_id === 'mot_ration_add_child') {
    updates = {
      online_service_link: 'https://eservice.ur.gov.iq/index/service-details/10048',
      expected_processing_time: 'من 2 إلى 4 أيام عمل عبر تطبيق تمويني الذكي',
    };
    sourceType = 'portal';
  } else {
    updates = { working_hours: 'من الساعة 8:00 صباحاً وحتى 2:30 ظهراً (توقيت صيفي معتمد)' };
    sourceType = 'web';
  }

  const { merged, resolvedConflicts } = resolveConflict(cached || service, updates, sourceType);
  merged.last_verified_date = today;
  merged.last_source_check = today;

  let confidenceScore = 74;
  if (sourceType === 'official') {
    confidenceScore = 98;
    merged.verification_status = 'official';
  } else if (sourceType === 'portal') {
    confidenceScore = 92;
    merged.verification_status = 'portal';
  } else {
    confidenceScore = 80;
    merged.verification_status = 'verified_web';
  }
  merged.verification_score = confidenceScore;

  await saveCachedService(merged);

  await addUpdateLog({
    timestamp: new Date().toISOString(),
    serviceId: service.service_id,
    sourceType,
    resolvedConflicts:
      resolvedConflicts.length > 0 ? resolvedConflicts : ['لا يوجد تعارض، البيانات متطابقة'],
    freshnessScore: 100,
  });

  return {
    service: merged,
    sourceType:
      sourceType === 'official' ? 'official_sources' : sourceType === 'portal' ? 'government_portals' : 'verified_web',
    confidenceScore,
    isFresh: true,
    isOffline: false,
    lastChecked: today,
    freshnessScore: 100,
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
