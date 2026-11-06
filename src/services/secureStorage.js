// Small cross-platform wrapper: expo-secure-store on Android/iOS,
// localStorage on the web (expo-secure-store has no web implementation).
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const WEB_PREFIX = '@muamalaty_secure:';

const webStore = {
  getItemAsync: async (key) => {
    try { return globalThis.localStorage?.getItem(WEB_PREFIX + key) ?? null; } catch { return null; }
  },
  setItemAsync: async (key, value) => {
    try { globalThis.localStorage?.setItem(WEB_PREFIX + key, value); } catch {}
  },
  deleteItemAsync: async (key) => {
    try { globalThis.localStorage?.removeItem(WEB_PREFIX + key); } catch {}
  },
};

export const secureStore = Platform.OS === 'web' ? webStore : SecureStore;
