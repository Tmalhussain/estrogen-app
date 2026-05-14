import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Plain key-value store for non-secret local UI state (addresses,
 * notification prefs, language, medical profile). On native we still
 * use SecureStore because it's already wired and the data is tied to
 * the user's session anyway. On web we fall back to localStorage.
 *
 * Use tokenStorage from ./storage for actual secrets (JWTs).
 */
export const localStore = {
  async get<T>(key: string): Promise<T | null> {
    let raw: string | null = null;
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      raw = window.localStorage.getItem(key);
    } else {
      raw = await SecureStore.getItemAsync(key);
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  async set<T>(key: string, value: T): Promise<void> {
    const raw = JSON.stringify(value);
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, raw);
      return;
    }
    await SecureStore.setItemAsync(key, raw);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
