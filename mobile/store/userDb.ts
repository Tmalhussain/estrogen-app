/**
 * Firebase-backed user authentication.
 *
 * This module replaces the old client-side user database.
 * Authentication is now handled by Firebase Auth, and user
 * profiles are stored in Firestore.
 *
 * This file provides a compatibility layer so existing code
 * that imports from userDb.ts continues to work during migration.
 */

import { auth, db } from '../config/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';

// ── Types (compatibility with old StoredUser) ────────────────

export interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationalId: string;
  dateOfBirth: string;
  createdAt: string;
}

// ── Auth operations (replacing Zustand store methods) ────────

/**
 * Register a new user with Firebase Auth + Firestore profile.
 */
export async function register(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  nationalId?: string;
  dateOfBirth?: string;
  password: string;
}): Promise<{ success: true; user: StoredUser } | { success: false; error: string; errorAr: string }> {
  try {
    // Use phone as email fallback for Firebase Auth
    const email = data.email || `${data.phone.replace(/\D/g, '')}@estrogen.app`;

    const credential = await createUserWithEmailAndPassword(auth, email, data.password);
    const uid = credential.user.uid;

    await updateProfile(credential.user, {
      displayName: `${data.firstName} ${data.lastName}`,
    });

    // Create Firestore profile
    const profileData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email || '',
      nationalId: data.nationalId || '',
      dateOfBirth: data.dateOfBirth || '',
      role: 'user',
      medical: {
        pregnancyStatus: 'not_pregnant',
        bloodType: null,
        allergies: [],
        conditions: [],
      },
      preferences: {
        language: 'ar',
        notificationsEnabled: true,
        discreetPackaging: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', uid), profileData);

    return {
      success: true,
      user: {
        id: uid,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email || '',
        nationalId: data.nationalId || '',
        dateOfBirth: data.dateOfBirth || '',
        createdAt: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: mapError(err.code),
      errorAr: mapErrorAr(err.code),
    };
  }
}

/**
 * Authenticate a user with email/phone + password.
 */
export async function authenticate(
  phoneOrEmail: string,
  password: string
): Promise<StoredUser | null> {
  try {
    // If it looks like a phone number, convert to email format
    const email = phoneOrEmail.includes('@')
      ? phoneOrEmail
      : `${phoneOrEmail.replace(/\D/g, '')}@estrogen.app`;

    const credential = await signInWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    // Fetch Firestore profile
    const profileDoc = await getDoc(doc(db, 'users', uid));
    if (!profileDoc.exists()) return null;

    const profile = profileDoc.data();
    return {
      id: uid,
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      phone: profile.phone || '',
      email: profile.email || '',
      nationalId: profile.nationalId || '',
      dateOfBirth: profile.dateOfBirth || '',
      createdAt: profile.createdAt?.toDate?.()?.toISOString?.() || '',
    };
  } catch {
    return null;
  }
}

/**
 * Find user by phone number (searches Firestore).
 */
export async function findByPhone(phone: string): Promise<StoredUser | undefined> {
  // This is a simplified lookup. In production, you'd query
  // Firestore: where('phone', '==', normalizedPhone)
  // For now, this relies on the auth user being already loaded.
  const user = auth.currentUser;
  if (!user) return undefined;

  const profileDoc = await getDoc(doc(db, 'users', user.uid));
  if (!profileDoc.exists()) return undefined;

  const profile = profileDoc.data();
  const normalizedInput = phone.replace(/[\s\-()]/g, '');
  const normalizedStored = (profile.phone || '').replace(/[\s\-()]/g, '');

  if (normalizedInput === normalizedStored) {
    return {
      id: user.uid,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      email: profile.email,
      nationalId: profile.nationalId,
      dateOfBirth: profile.dateOfBirth,
      createdAt: profile.createdAt?.toDate?.()?.toISOString?.() || '',
    };
  }

  return undefined;
}

/**
 * Update user profile in Firestore.
 */
export async function updateUserProfile(
  data: Partial<Pick<StoredUser, 'firstName' | 'lastName' | 'email' | 'nationalId' | 'dateOfBirth'>>
): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  await updateDoc(doc(db, 'users', user.uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  return true;
}

// ── Error mapping ────────────────────────────────────────────

function mapError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'Phone number already registered';
    case 'auth/invalid-email': return 'Invalid phone number format';
    case 'auth/weak-password': return 'Password is too weak. Use at least 6 characters.';
    case 'auth/user-not-found': return 'No account found';
    case 'auth/wrong-password': return 'Incorrect password';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait.';
    default: return 'An error occurred';
  }
}

function mapErrorAr(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'رقم الجوال مسجل بالفعل';
    case 'auth/invalid-email': return 'صيغة رقم الجوال غير صالحة';
    case 'auth/weak-password': return 'كلمة المرور ضعيفة جداً. استخدمي ٦ أحرف على الأقل.';
    case 'auth/user-not-found': return 'لا يوجد حساب بهذا الرقم';
    case 'auth/wrong-password': return 'كلمة المرور غير صحيحة';
    case 'auth/too-many-requests': return 'محاولات كثيرة. انتظري قليلاً.';
    default: return 'حدث خطأ';
  }
}

// ── Backward compatibility: no-op for Zustand store callers ──

export const useUserDb = {
  getState: () => ({
    users: [],
    initialized: true,
    initSeedData: () => {},
    register,
    findByPhone,
    authenticate,
    updatePassword: async () => false,
    updateProfile: async (_phone: string, data: any) => updateUserProfile(data),
  }),
};
