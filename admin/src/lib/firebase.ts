/**
 * Firebase configuration for the Admin Dashboard.
 *
 * Client-side Firebase SDK for auth state and real-time listeners.
 * For server-side operations (API routes), use firebase-admin.
 *
 * Local development: when running at localhost, the SDK auto-connects to
 * the Firebase Emulator Suite started via `firebase emulators:start`.
 * Production builds skip the connection and hit the real Firebase project.
 *
 * Replace the placeholder API key with your real project's web config
 * before shipping to production:
 *     Firebase Console → Project Settings → General → Your apps → Web
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

// ── Firebase Config ──────────────────────────────────────────
// Production: replace with your real project config
//   (Firebase Console → Project Settings → Your apps → Web).
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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
// Region must match backend/functions/src/lib/admin.ts REGION ('me-central1').
const functions = getFunctions(app, 'me-central1');

// ── Emulator wiring (dev only) ───────────────────────────────
// When the admin runs at localhost (next dev), connect to the local
// Firebase Emulator Suite so signup/login/queries work without a
// configured Firebase project. Production builds skip this.
const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1');

if (isLocalhost) {
  // Guard against double-connection on Next.js fast-refresh:
  // tag the auth instance the first time we connect.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taggedAuth = auth as any;
  if (!taggedAuth.__emulatorConnected) {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectFunctionsEmulator(functions, 'localhost', 5001);
      connectStorageEmulator(storage, 'localhost', 9199);
      taggedAuth.__emulatorConnected = true;
      // eslint-disable-next-line no-console
      console.log('[Firebase] Admin connected to local emulators (auth/firestore/functions/storage)');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[Firebase] Admin emulator connect failed (likely already connected):', err);
    }
  }
}

export { app, auth, db, storage, functions };
export default app;
