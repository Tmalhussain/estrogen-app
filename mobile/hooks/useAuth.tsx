import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError, type ApiUser } from '@/lib/api';
import { firebase } from '@/lib/firebase';
import { tokenStorage } from '@/lib/storage';

const TOKEN_KEY = 'estrogen.session.token';

type AuthState =
  | { status: 'loading'; user: null; token: null }
  | { status: 'signed-out'; user: null; token: null }
  | { status: 'signed-in'; user: ApiUser; token: string };

type AuthContextValue = AuthState & {
  /** Step 1: Send a 6-digit code to the user's phone via SMS. */
  sendOtp: (phoneNumber: string) => Promise<{ expiresInSec: number }>;
  /** Step 2: Verify the code. New users must pass firstName. Returns whether the user is new. */
  verifyOtp: (input: {
    phoneNumber: string;
    code: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<{ isNewUser: boolean }>;
  /** Email/password — staff & admin only. */
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    token: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await tokenStorage.get(TOKEN_KEY);
        if (!token) {
          if (!cancelled) setState({ status: 'signed-out', user: null, token: null });
          return;
        }
        const { user } = await api.me(token);
        if (!cancelled) setState({ status: 'signed-in', user, token });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await tokenStorage.remove(TOKEN_KEY);
        }
        if (!cancelled) setState({ status: 'signed-out', user: null, token: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const adopt = async (token: string, user: ApiUser, firebaseCustomToken: string | null) => {
    await tokenStorage.set(TOKEN_KEY, token);
    // If Firebase is configured and the backend handed us a custom token,
    // sign into Firebase too — that's how the same UID propagates to FCM,
    // Cloud Storage, RTDB, etc. Failure here doesn't break the app.
    if (firebaseCustomToken && firebase.enabled()) {
      try {
        await firebase.signInWithCustomTokenIfPossible(firebaseCustomToken);
      } catch (err) {
        console.warn('[auth] firebase signInWithCustomToken failed', err);
      }
    }
    setState({ status: 'signed-in', user, token });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      sendOtp: async (phoneNumber) => {
        const { expiresInSec } = await api.sendOtp(phoneNumber);
        return { expiresInSec };
      },
      verifyOtp: async (input) => {
        const result = await api.verifyOtp(input);
        await adopt(result.token, result.user, result.firebaseCustomToken);
        return { isNewUser: result.isNewUser };
      },
      signInWithEmail: async (email, password) => {
        const { token, user } = await api.login({ email, password });
        await adopt(token, user, null);
      },
      signOut: async () => {
        await tokenStorage.remove(TOKEN_KEY);
        await firebase.signOutIfPossible();
        setState({ status: 'signed-out', user: null, token: null });
      },
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function useRequireUser(): ApiUser {
  const { user } = useAuth();
  if (!user) throw new Error('useRequireUser called while signed out');
  return user;
}
