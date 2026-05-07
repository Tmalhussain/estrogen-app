import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signOut as fbSignOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';

/**
 * Firebase JS SDK init.
 *
 * If the EXPO_PUBLIC_FIREBASE_* env vars are present we initialize the app
 * and expose a real Auth instance. Otherwise every helper becomes a no-op
 * so the rest of the app works against the local backend without a
 * Firebase project.
 *
 * The mobile app calls our backend's /auth/verify-otp, gets back a
 * firebaseCustomToken (when Firebase is configured server-side too), and
 * passes it to signInWithFirebaseToken below. That hands the user a real
 * Firebase Auth session — Cloud Storage, FCM, RTDB, etc. all see the same
 * uid as our Postgres `users.id`.
 */

type Config = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
};

function readConfig(): Config | null {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

let cached: { app: FirebaseApp; auth: Auth } | null = null;

function getFirebase(): { app: FirebaseApp; auth: Auth } | null {
  if (cached) return cached;
  const config = readConfig();
  if (!config) return null;
  const app = getApps()[0] ?? initializeApp(config);
  cached = { app, auth: getAuth(app) };
  return cached;
}

export const firebase = {
  enabled: () => readConfig() !== null,

  signInWithCustomTokenIfPossible: async (
    customToken: string | null
  ): Promise<FirebaseUser | null> => {
    if (!customToken) return null;
    const fb = getFirebase();
    if (!fb) return null;
    const cred = await signInWithCustomToken(fb.auth, customToken);
    return cred.user;
  },

  signOutIfPossible: async (): Promise<void> => {
    const fb = getFirebase();
    if (fb) await fbSignOut(fb.auth);
  },

  onAuthStateChanged: (cb: (user: FirebaseUser | null) => void) => {
    const fb = getFirebase();
    if (!fb) return () => {};
    return onAuthStateChanged(fb.auth, cb);
  },

  getIdToken: async (): Promise<string | null> => {
    const fb = getFirebase();
    if (!fb || !fb.auth.currentUser) return null;
    return fb.auth.currentUser.getIdToken();
  },
};
