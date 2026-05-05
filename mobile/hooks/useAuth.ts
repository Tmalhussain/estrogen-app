/**
 * Firebase Authentication Hook
 *
 * Provides reactive auth state, login/signup/logout methods,
 * and user profile data from Firestore.
 *
 * Replaces the old client-side userDb.ts with real Firebase Auth.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  User as FirebaseUser,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuthStore } from '../store';

// ── Types ────────────────────────────────────────────────────

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  nationalId: string;
  dateOfBirth: string;
  role: 'user' | 'pharmacist' | 'admin';
  medical: {
    pregnancyStatus: string;
    bloodType: string | null;
    allergies: string[];
    conditions: string[];
  };
  preferences: {
    language: string;
    notificationsEnabled: boolean;
    discreetPackaging: boolean;
  };
  createdAt: any;
  updatedAt: any;
}

// ── Hook ─────────────────────────────────────────────────────

export function useAuth() {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authStore = useAuthStore();

  // ── Listen to auth state ─────────────────────────────────
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        // User is signed in — sync with Zustand store
        authStore.login({
          name: user.displayName || '',
          phone: user.phoneNumber || '',
          email: user.email || '',
        });

        // Listen to Firestore profile
        const profileRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          }
        });

        setLoading(false);
        return () => unsubProfile();
      } else {
        // User is signed out
        authStore.logout();
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // ── Sign up with email + password ────────────────────────
  const signUp = useCallback(async (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    nationalId?: string;
    dateOfBirth?: string;
  }) => {
    setError(null);
    setLoading(true);
    try {
      // Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // Set display name
      await updateProfile(credential.user, {
        displayName: `${data.firstName} ${data.lastName}`,
      });

      // Create Firestore profile (Cloud Function also does this,
      // but we write it here for immediate availability)
      const profileData: UserProfile = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
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
          language: authStore.language || 'ar',
          notificationsEnabled: true,
          discreetPackaging: true,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', credential.user.uid), profileData);
      setProfile(profileData);

      return { success: true as const, user: credential.user };
    } catch (err: any) {
      const errorMsg = mapFirebaseError(err.code);
      setError(errorMsg);
      setLoading(false);
      return { success: false as const, error: errorMsg, errorAr: mapFirebaseErrorAr(err.code) };
    }
  }, []);

  // ── Sign in with email + password ────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true as const, user: credential.user };
    } catch (err: any) {
      const errorMsg = mapFirebaseError(err.code);
      setError(errorMsg);
      setLoading(false);
      return { success: false as const, error: errorMsg, errorAr: mapFirebaseErrorAr(err.code) };
    }
  }, []);

  // ── Sign in with phone (OTP) ─────────────────────────────
  const signInWithPhone = useCallback(async (verificationId: string, code: string) => {
    setError(null);
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      const result = await signInWithCredential(auth, credential);
      return { success: true as const, user: result.user };
    } catch (err: any) {
      const errorMsg = mapFirebaseError(err.code);
      setError(errorMsg);
      setLoading(false);
      return { success: false as const, error: errorMsg };
    }
  }, []);

  // ── Password reset ───────────────────────────────────────
  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true as const };
    } catch (err: any) {
      const errorMsg = mapFirebaseError(err.code);
      setError(errorMsg);
      return { success: false as const, error: errorMsg, errorAr: mapFirebaseErrorAr(err.code) };
    }
  }, []);

  // ── Sign out ─────────────────────────────────────────────
  const logOut = useCallback(async () => {
    await signOut(auth);
    setProfile(null);
  }, []);

  // ── Update profile ───────────────────────────────────────
  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!firebaseUser) return;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err: any) {
      setError(err.message);
    }
  }, [firebaseUser]);

  return {
    user: firebaseUser,
    profile,
    loading,
    error,
    isLoggedIn: !!firebaseUser,
    uid: firebaseUser?.uid || null,
    signUp,
    signIn,
    signInWithPhone,
    resetPassword,
    logOut,
    updateUserProfile,
  };
}

// ── Error mapping ────────────────────────────────────────────

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'This email is already registered';
    case 'auth/invalid-email': return 'Invalid email address';
    case 'auth/weak-password': return 'Password must be at least 6 characters';
    case 'auth/user-not-found': return 'No account found with this email';
    case 'auth/wrong-password': return 'Incorrect password';
    case 'auth/too-many-requests': return 'Too many attempts. Please try later';
    case 'auth/invalid-verification-code': return 'Invalid verification code';
    case 'auth/invalid-credential': return 'Invalid email or password';
    default: return 'An error occurred. Please try again';
  }
}

function mapFirebaseErrorAr(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'البريد الإلكتروني مسجل بالفعل';
    case 'auth/invalid-email': return 'البريد الإلكتروني غير صالح';
    case 'auth/weak-password': return 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل';
    case 'auth/user-not-found': return 'لا يوجد حساب بهذا البريد';
    case 'auth/wrong-password': return 'كلمة المرور غير صحيحة';
    case 'auth/too-many-requests': return 'محاولات كثيرة. حاولي لاحقاً';
    case 'auth/invalid-verification-code': return 'رمز التحقق غير صالح';
    case 'auth/invalid-credential': return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
    default: return 'حدث خطأ. حاولي مرة أخرى';
  }
}
