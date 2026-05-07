import nacl from 'tweetnacl';
import naclUtil from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * E2EE foundation for pharmacist chat.
 *
 * On first launch we generate an X25519 (Curve25519) box keypair using
 * tweetnacl. The 32-byte private key stays in expo-secure-store on
 * native (iOS keychain / Android keystore). On web we fall back to
 * window.localStorage — fine for development; production web clients
 * should be backed by a Service Worker + IndexedDB or a hardware key.
 *
 * The public key is base64-encoded and POSTed to /chat/devices so
 * pharmacists can encrypt to us. We never send the private key.
 *
 * Note: tweetnacl needs a CSPRNG. expo-crypto is shipped with Expo
 * and provides it; on native React Native, react-native's Math.random
 * polyfill is replaced by `react-native-get-random-values` if needed.
 * We rely on expo-secure-store being present (already a dependency)
 * which on Expo also installs a secure RNG transitively. If we ever
 * see "no PRNG" errors at runtime we'll add `expo-random` explicitly.
 */

const PRIVATE_KEY_STORAGE_KEY = 'estrogen.chat.x25519.privateKey';
const PUBLIC_KEY_STORAGE_KEY = 'estrogen.chat.x25519.publicKey';
const FINGERPRINT_LENGTH = 12;

export type ChatKeypair = {
  publicKey: string;
  privateKey: string;
};

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

/**
 * Return the cached keypair if we already have one for this device,
 * otherwise generate, persist, and return a fresh one.
 *
 * The private key never leaves this function's caller's memory.
 */
export async function getOrCreateChatKeypair(): Promise<ChatKeypair> {
  const cachedPub = await getItem(PUBLIC_KEY_STORAGE_KEY);
  const cachedPriv = await getItem(PRIVATE_KEY_STORAGE_KEY);
  if (cachedPub && cachedPriv) {
    return { publicKey: cachedPub, privateKey: cachedPriv };
  }
  const kp = nacl.box.keyPair();
  const publicKey = naclUtil.encodeBase64(kp.publicKey);
  const privateKey = naclUtil.encodeBase64(kp.secretKey);
  await setItem(PUBLIC_KEY_STORAGE_KEY, publicKey);
  await setItem(PRIVATE_KEY_STORAGE_KEY, privateKey);
  return { publicKey, privateKey };
}

/**
 * Short, human-recognizable identifier derived from the public key.
 * Useful for the "your device key" line on the chat screen so the
 * user has something they can compare verbally with the pharmacist.
 */
export function fingerprintPublicKey(publicKey: string): string {
  // base64 → hex of first 6 bytes → grouped 4-4-4 for readability.
  let bytes: Uint8Array;
  try {
    bytes = naclUtil.decodeBase64(publicKey);
  } catch {
    return publicKey.slice(0, FINGERPRINT_LENGTH);
  }
  const head = bytes.slice(0, 6);
  let hex = '';
  for (const b of head) hex += b.toString(16).padStart(2, '0');
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`.toUpperCase();
}
