/**
 * Firebase configuration for the Admin Dashboard.
 *
 * Client-side Firebase SDK for auth state and real-time listeners.
 * For server-side operations (API routes), use firebase-admin.
 *
 * ⚠️  Replace the placeholder values with your actual Firebase config.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
export default app;
