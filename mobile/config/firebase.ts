/**
 * Firebase configuration for the Estrogen Pharmacy mobile app.
 *
 * Uses the Firebase JS SDK (modular v10) which works with Expo
 * without requiring native modules or ejecting.
 *
 * ⚠️  Replace the placeholder values below with your actual
 *     Firebase project credentials from the Firebase Console:
 *     Project Settings → General → Your apps → Web app config
 */

import { Platform } from 'react-native';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  browserLocalPersistence,
  inMemoryPersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
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
// TODO: Replace with your actual Firebase project config
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

export { app, auth, db, storage, functions };
export default app;
