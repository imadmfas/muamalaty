// Live indicators for the Services hub (new in v1.1.0).
// v1.0.0 showed fixed numbers (41°م, 1,312 د.ع, 485,000) labelled "مباشر" / "قبل دقائق".
// These are now fetched from free public sources that need no API key; if a source is
// unreachable the card says so instead of showing an invented figure.
//   - Weather:  Open-Meteo (open-meteo.com), Baghdad 33.3152, 44.3661
//   - USD→IQD:  open.er-api.com (international reference rate; banks/street differ)
//   - Gold:     api.gold-api.com XAU/USD spot → 21-carat Iraqi mithqal (5 g) estimate
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@muamalaty_live_indicators';
const MAX_AGE = 30 * 60 * 1000;
const TROY_OUNCE_G = 31.1034768;
const MITHQAL_G = 5;

const withTimeout = (promise, ms = 6000) =>
  Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

const getJson = async (url) => {
  const res = await withTimeout(fetch(url));
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
};

const WEATHER_CODES = [
  [[0], 'صحو'],
  [[1, 2], 'غائم جزئياً'],
  [[3], 'غائم'],
  [[45, 48], 'ضباب'],
  [[51, 53, 55, 56, 57], 'رذاذ'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'ماطر'],
  [[71, 73, 75, 77, 85, 86], 'ثلوج'],
  [[95, 96, 99], 'عواصف رعدية'],
];
const describeWeather = (code) => (WEATHER_CODES.find(([codes]) => codes.includes(code)) || [null, ''])[1];

const fetchWeather = async () => {
  const d = await getJson(
    'https://api.open-meteo.com/v1/forecast?latitude=33.3152&longitude=44.3661&current=temperature_2m,weather_code&timezone=Asia%2FBaghdad'
  );
  return { temp: Math.round(d.current.temperature_2m), desc: describeWeather(d.current.weather_code) };
};

const fetchUsdIqd = async () => {
  const d = await getJson('https://open.er-api.com/v6/latest/USD');
  if (!d?.rates?.IQD) throw new Error('no IQD');
  return d.rates.IQD;
};

const fetchGoldUsdPerOunce = async () => {
  const d = await getJson('https://api.gold-api.com/price/XAU');
  if (!d?.price) throw new Error('no price');
  return d.price;
};

export const loadIndicators = async ({ force = false } = {}) => {
  let cached = null;
  try {
    cached = JSON.parse((await AsyncStorage.getItem(CACHE_KEY)) || 'null');
  } catch {}
  if (!force && cached && Date.now() - cached.at < MAX_AGE) return cached;

  const [weather, usd, gold] = await Promise.allSettled([fetchWeather(), fetchUsdIqd(), fetchGoldUsdPerOunce()]);
  const result = {
    at: Date.now(),
    weather: weather.status === 'fulfilled' ? weather.value : cached?.weather || null,
    usdIqd: usd.status === 'fulfilled' ? usd.value : cached?.usdIqd || null,
    goldOunceUsd: gold.status === 'fulfilled' ? gold.value : cached?.goldOunceUsd || null,
  };
  if (result.usdIqd && result.goldOunceUsd) {
    // 21 carat = 21/24 purity; Iraqi mithqal = 5 g. Spot estimate before workmanship (صياغة).
    result.gold21Mithqal = Math.round(((result.goldOunceUsd / TROY_OUNCE_G) * (21 / 24) * MITHQAL_G * result.usdIqd) / 250) * 250;
  }
  if (result.weather || result.usdIqd || result.goldOunceUsd) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch {}
  }
  return result;
};

export const formatUpdatedAt = (ts) => {
  if (!ts) return '';
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const d = new Date(ts);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};
