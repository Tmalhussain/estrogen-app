import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Encrypted-at-rest token storage. iOS keychain, Android keystore. On web
 * SecureStore isn't available — fall back to localStorage. Still HTTPS-only
 * in production, but tokens are no longer encrypted at rest in the browser.
 */
export const tokenStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
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
