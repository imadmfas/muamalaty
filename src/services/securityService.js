// Security service (module 649) — rewritten in v1.1.0.
//
// What changed from v1.0.0 and why:
// - v1.0.0 used a home-made RC4 cipher that wrote each char as 2 hex digits. Arabic
//   characters (char codes > 255) produced 3 hex digits, so every record holding an
//   Arabic name came back as garbage/null on the next launch. Data is now encoded as
//   UTF-8 and encrypted with AES-256-GCM (audited @noble/ciphers), random 96-bit IV.
// - The key came from Math.random() and fell back to a key hard-coded in the APK.
//   It now comes from a cryptographically secure RNG and there is no fallback key.
// - The PIN was stored in plain text. It is now stored as salted SHA-256, and wrong
//   attempts are rate-limited (see getPinLockout / registerFailedPinAttempt).
// - Old v1.0.0 data and PINs are still readable and are upgraded on first use.
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';
import { secureStore } from './secureStorage';

const MASTER_KEY_NAME = 'muamalaty_master_sec_key';
const MASTER_KEY_V2_NAME = 'muamalaty_master_key_v2';
const PIN_KEY = 'muamalaty_pin_hash';
const BIOMETRIC_KEY = 'muamalaty_biometric_enabled';
const PIN_ATTEMPTS_KEY = '@muamalaty_pin_attempts';
const V2_PREFIX = 'v2:';

const textDecoder = new TextDecoder();
const randomBytes = (n) => Crypto.getRandomBytes(n);

// ---------- keys ----------
let cachedKey = null;
const getOrCreateMasterKey = async () => {
  if (cachedKey) return cachedKey;
  let hex = await secureStore.getItemAsync(MASTER_KEY_V2_NAME);
  if (!hex) {
    hex = bytesToHex(randomBytes(32));
    await secureStore.setItemAsync(MASTER_KEY_V2_NAME, hex);
  }
  cachedKey = hexToBytes(hex);
  return cachedKey;
};

// ---------- AES-256-GCM ----------
const toB64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return globalThis.btoa(s);
};
const fromB64 = (b64) => {
  const s = globalThis.atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
};

export const encryptString = async (text) => {
  const key = await getOrCreateMasterKey();
  const iv = randomBytes(12);
  const ct = gcm(key, iv).encrypt(utf8ToBytes(String(text)));
  return `${V2_PREFIX}${toB64(iv)}:${toB64(ct)}`;
};

// v1.0.0 RC4 decoder, kept only to migrate old data (works for records that held
// no character above U+00FF; Arabic records from v1.0.0 were already unrecoverable).
const legacyDecrypt = async (hex) => {
  const key = await secureStore.getItemAsync(MASTER_KEY_NAME);
  if (!key || hex.length % 2 !== 0 || !/^[0-9a-f]*$/i.test(hex)) return '';
  const S = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key.charCodeAt(i % key.length)) % 256;
    [S[i], S[j]] = [S[j], S[i]];
  }
  let i = 0;
  j = 0;
  let result = '';
  for (let n = 0; n < hex.length; n += 2) {
    i = (i + 1) % 256;
    j = (j + S[i]) % 256;
    [S[i], S[j]] = [S[j], S[i]];
    result += String.fromCharCode(parseInt(hex.substring(n, n + 2), 16) ^ S[(S[i] + S[j]) % 256]);
  }
  return result;
};

export const decryptString = async (payload) => {
  if (!payload) return '';
  try {
    if (!payload.startsWith(V2_PREFIX)) return await legacyDecrypt(payload);
    const [ivB64, ctB64] = payload.slice(V2_PREFIX.length).split(':');
    const key = await getOrCreateMasterKey();
    return textDecoder.decode(gcm(key, fromB64(ivB64)).decrypt(fromB64(ctB64)));
  } catch (error) {
    console.warn('Decryption failed:', error?.message);
    return '';
  }
};

// Encrypted JSON stored in AsyncStorage (key lives in secure storage).
export const setSecureItem = async (key, value) => {
  const encrypted = await encryptString(JSON.stringify(value));
  await AsyncStorage.setItem(key, encrypted);
};

export const getSecureItem = async (key) => {
  const encrypted = await AsyncStorage.getItem(key);
  if (!encrypted) return null;
  const decrypted = await decryptString(encrypted);
  if (!decrypted) return null;
  try {
    const value = JSON.parse(decrypted);
    // Upgrade legacy RC4 records to AES-GCM transparently.
    if (!encrypted.startsWith(V2_PREFIX)) await setSecureItem(key, value);
    return value;
  } catch (error) {
    return null;
  }
};

// ---------- PIN ----------
const hashPin = (pin, saltHex) => bytesToHex(sha256(utf8ToBytes(`${saltHex}:${pin}`)));

export const savePIN = async (pin) => {
  const salt = bytesToHex(randomBytes(16));
  await secureStore.setItemAsync(PIN_KEY, `sha256:${salt}:${hashPin(pin, salt)}`);
  await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
};

export const verifyPIN = async (pin) => {
  const stored = await secureStore.getItemAsync(PIN_KEY);
  if (!stored) return false;
  if (stored.startsWith('sha256:')) {
    const [, salt, hash] = stored.split(':');
    return hashPin(pin, salt) === hash;
  }
  // Legacy plain-text PIN from v1.0.0 — verify, then upgrade to a salted hash.
  if (stored === pin) {
    await savePIN(pin);
    return true;
  }
  return false;
};

export const hasPIN = async () => !!(await secureStore.getItemAsync(PIN_KEY));

export const deletePIN = async () => {
  await secureStore.deleteItemAsync(PIN_KEY);
  await AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);
};

// Brute-force protection: after 5 wrong PINs, wait 30 s, then doubling per further miss (max 1 h).
const FREE_ATTEMPTS = 5;
export const getPinLockout = async () => {
  try {
    const raw = await AsyncStorage.getItem(PIN_ATTEMPTS_KEY);
    const { count = 0, until = 0 } = raw ? JSON.parse(raw) : {};
    return { count, lockedUntil: until > Date.now() ? until : 0 };
  } catch {
    return { count: 0, lockedUntil: 0 };
  }
};

export const registerFailedPinAttempt = async () => {
  const { count } = await getPinLockout();
  const next = count + 1;
  const extra = next - FREE_ATTEMPTS;
  const until = extra >= 0 ? Date.now() + Math.min(30000 * 2 ** extra, 3600000) : 0;
  await AsyncStorage.setItem(PIN_ATTEMPTS_KEY, JSON.stringify({ count: next, until }));
  return { count: next, lockedUntil: until, remaining: Math.max(FREE_ATTEMPTS - next, 0) };
};

export const resetPinAttempts = async () => AsyncStorage.removeItem(PIN_ATTEMPTS_KEY);

// ---------- biometrics ----------
export const setBiometricEnabled = async (enabled) => {
  await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
};

export const isBiometricEnabled = async () => (await AsyncStorage.getItem(BIOMETRIC_KEY)) === 'true';

export const isBiometricAvailable = async () => {
  if (Platform.OS === 'web') return false;
  try {
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
  } catch {
    return false;
  }
};

export const authenticateBiometric = async () => {
  try {
    if (!(await isBiometricAvailable())) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'يرجى تأكيد هويتك لفتح مستمسكاتك الآمنة 🔒',
      cancelLabel: 'إلغاء',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    console.warn('Biometric authentication error:', error);
    return false;
  }
};

// ---------- backups ----------
export const exportDataBackup = async (data) => {
  const payload = JSON.stringify({
    app: 'Muamalaty',
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    developer: 'البروفيسور عماد محمد فرحان',
    data,
  });
  return await encryptString(payload);
};

export const importDataBackup = async (encrypted) => {
  try {
    const parsed = JSON.parse(await decryptString(encrypted));
    if (!parsed || parsed.app !== 'Muamalaty') return null;
    return parsed.data;
  } catch (error) {
    return null;
  }
};

// Wipes every secret this service owns (used by "reset all data").
export const wipeSecrets = async () => {
  cachedKey = null;
  await Promise.all([
    secureStore.deleteItemAsync(PIN_KEY),
    secureStore.deleteItemAsync(MASTER_KEY_V2_NAME),
    secureStore.deleteItemAsync(MASTER_KEY_NAME),
    AsyncStorage.removeItem(PIN_ATTEMPTS_KEY),
    AsyncStorage.removeItem(BIOMETRIC_KEY),
  ]);
};
