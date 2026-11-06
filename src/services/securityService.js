// Reconstructed from Hermes bundle — module 649 (security service)
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MASTER_KEY_NAME = 'muamalaty_master_sec_key';
const PIN_KEY = 'muamalaty_pin_hash';
const BIOMETRIC_KEY = 'muamalaty_biometric_enabled';

// Not exported in the original module.
const getOrCreateMasterKey = async () => {
  try {
    let key = await SecureStore.getItemAsync(MASTER_KEY_NAME);
    if (!key) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
      key = '';
      for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      await SecureStore.setItemAsync(MASTER_KEY_NAME, key);
    }
    return key;
  } catch (error) {
    return 'Professor_Imad_Farhan_Secure_Muamalaty_Master_Key_2026';
  }
};

// RC4 stream cipher, output as hex (2 hex digits per char code — see notes: breaks for char codes > 255).
export const encryptString = async (text) => {
  const key = await getOrCreateMasterKey();
  const S = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + key.charCodeAt(i % key.length)) % 256;
    const tmp = S[i];
    S[i] = S[j];
    S[j] = tmp;
  }
  let i = 0;
  j = 0;
  let result = '';
  for (let n = 0; n < text.length; n++) {
    i = (i + 1) % 256;
    j = (j + S[i]) % 256;
    const tmp = S[i];
    S[i] = S[j];
    S[j] = tmp;
    const k = S[(S[i] + S[j]) % 256];
    const c = text.charCodeAt(n) ^ k;
    result += c.toString(16).padStart(2, '0');
  }
  return result;
};

export const decryptString = async (hex) => {
  if (!hex) return '';
  try {
    const key = await getOrCreateMasterKey();
    const S = Array.from({ length: 256 }, (_, i) => i);
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + S[i] + key.charCodeAt(i % key.length)) % 256;
      const tmp = S[i];
      S[i] = S[j];
      S[j] = tmp;
    }
    let i = 0;
    j = 0;
    let result = '';
    for (let n = 0; n < hex.length; n += 2) {
      const byteHex = hex.substring(n, n + 2);
      const byte = parseInt(byteHex, 16);
      i = (i + 1) % 256;
      j = (j + S[i]) % 256;
      const tmp = S[i];
      S[i] = S[j];
      S[j] = tmp;
      const k = S[(S[i] + S[j]) % 256];
      const c = byte ^ k;
      result += String.fromCharCode(c);
    }
    return result;
  } catch (error) {
    console.error('Hardware decryption failed:', error);
    return '';
  }
};

// "Secure" items: RC4-encrypted JSON stored in AsyncStorage (key lives in SecureStore).
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
    return JSON.parse(decrypted);
  } catch (error) {
    return null;
  }
};

// NOTE: stores the raw PIN (no hashing) despite the key name.
export const savePIN = async (pin) => {
  await SecureStore.setItemAsync(PIN_KEY, pin);
};

export const verifyPIN = async (pin) => {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  if (!stored) return false;
  return stored === pin;
};

export const hasPIN = async () => {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return !!stored;
};

export const deletePIN = async () => {
  await SecureStore.deleteItemAsync(PIN_KEY);
};

export const setBiometricEnabled = async (enabled) => {
  await AsyncStorage.setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
};

export const isBiometricEnabled = async () => {
  const value = await AsyncStorage.getItem(BIOMETRIC_KEY);
  return value === 'true';
};

export const authenticateBiometric = async () => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'يرجى تأكيد هويتك لفتح مستمسكاتك الآمنة 🔒',
      cancelLabel: 'إلغاء',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

export const exportDataBackup = async (data) => {
  const payload = JSON.stringify({
    app: 'Muamalaty',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    developer: 'البروفيسور عماد محمد فرحان',
    data,
  });
  return await encryptString(payload);
};

export const importDataBackup = async (encrypted) => {
  try {
    const decrypted = await decryptString(encrypted);
    const parsed = JSON.parse(decrypted);
    if (!parsed || parsed.app !== 'Muamalaty') return null;
    return parsed.data;
  } catch (error) {
    return null;
  }
};
