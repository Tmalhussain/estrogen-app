/**
 * Firebase configuration for the Estrogen Pharmacy mobile app.
 *
 * Uses the Firebase JS SDK (modular v10) which works with Expo
 * without requiring native modules or ejecting.
 *
 * Local development: when __DEV__ is true (and we're on Expo Web running
 * in a localhost browser), the SDK auto-connects to the Firebase Emulator
 * Suite started via `firebase emulators:start`. Production builds skip
 * the connection and hit the real Firebase project.
 *
 * Replace the placeholder API key with your real project's web config
 * before shipping a production build:
 *     Firebase Console → Project Settings → General → Your apps → Web
 */

import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  browserLocalPersistence,
  inMemoryPersistence,
  connectAuthEmulator,
  type Auth,
} from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// `getReactNativePersistence` only exists on the React Native entry of
// firebase/auth — on web the symbol is not exported and importing it
// directly throws "is not a function" at runtime. Resolve it lazily and
// only on native platforms.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let rnPersistence: any = undefined;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getReactNativePersistence } = require('firebase/auth');
  if (typeof getReactNativePersistence === 'function') {
    rnPersistence = getReactNativePersistence(AsyncStorage);
  }
}

// ── Firebase Config ──────────────────────────────────────────
// Production: replace with your real project config
//   (Firebase Console → Project Settings → Your apps → Web)
// Development: emulators ignore the API key, so placeholders work.
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'estrogen-pharmacy.firebaseapp.com',
  projectId: 'estrogen-pharmacy',
  storageBucket: 'estrogen-pharmacy.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
  measurementId: 'YOUR_MEASUREMENT_ID',
};

// ── Initialize Firebase (singleton) ──────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ── Auth with platform-appropriate persistence ──────────────
// Native: AsyncStorage-backed RN persistence (users stay logged in).
// Web:    browserLocalPersistence (localStorage) keeps parity in browser.
const auth: Auth = initializeAuth(app, {
  persistence:
    Platform.OS === 'web'
      ? browserLocalPersistence
      : (rnPersistence ?? inMemoryPersistence),
});

// ── Firestore ────────────────────────────────────────────────
const db = getFirestore(app);

// ── Cloud Storage ────────────────────────────────────────────
const storage = getStorage(app);

// ── Cloud Functions ──────────────────────────────────────────
// Region must match backend/functions/src/lib/admin.ts REGION ('me-central1').
const functions = getFunctions(app, 'me-central1');

// ── Emulator wiring (dev only) ───────────────────────────────
// In Expo Web running on localhost, connect to the local Firebase Emulator
// Suite so signup/login/orders work without a configured Firebase project.
// The emulators are started by `firebase emulators:start` (configured in
// firebase.json: auth=9099, firestore=8080, functions=5001, storage=9199).
//
// For Expo Go on a physical device, replace 'localhost' with your Mac's
// LAN IP (e.g. EXPO_PUBLIC_EMULATOR_HOST=192.168.13.149) so the phone can
// reach the emulators over WiFi. Until that env var is set, native dev
// goes against production Firebase (which will fail loudly with the
// placeholder API key — that's the signal to set it up).
declare const __DEV__: boolean;

const isWebDev =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

const emulatorHost =
  process.env.EXPO_PUBLIC_EMULATOR_HOST ||
  (isWebDev ? 'localhost' : '');

const useEmulator =
  typeof __DEV__ !== 'undefined' && __DEV__ && emulatorHost.length > 0;

if (useEmulator) {
  // Each connect* must be called exactly once per process. The SDK
  // tolerates the calls being safe under React Native fast-refresh
  // because the connection state is on the singleton app/auth/db
  // instances, not module scope. (Initializing twice will throw —
  // the SDK guards against it on its own.)
  try {
    connectAuthEmulator(auth, `http://${emulatorHost}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, emulatorHost, 8080);
    connectFunctionsEmulator(functions, emulatorHost, 5001);
    connectStorageEmulator(storage, emulatorHost, 9199);
    // eslint-disable-next-line no-console
    console.log(`[Firebase] Connected to local emulators at ${emulatorHost} (auth/firestore/functions/storage)`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[Firebase] Could not connect to emulators (likely already connected on hot-reload):', err);
  }
}

export { app, auth, db, storage, functions };
export default app;
