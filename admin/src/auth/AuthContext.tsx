import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError, tokenStore, type ApiUser } from '@/lib/api';

type AuthState =
  | { status: 'loading'; user: null }
  | { status: 'signed-out'; user: null }
  | { status: 'signed-in'; user: ApiUser };

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = tokenStore.get();
      if (!token) {
        if (!cancelled) setState({ status: 'signed-out', user: null });
        return;
      }
      try {
        const { user } = await api.me();
        if (!cancelled) setState({ status: 'signed-in', user });
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear();
        }
        if (!cancelled) setState({ status: 'signed-out', user: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login({ email, password });
    if (user.role === 'customer') {
      // Defense in depth: refuse customer credentials at the admin entrance.
      // Backend recommendation 1A is the clean fix (a /staff/auth/login
      // endpoint that rejects role==='customer'); until then, gate at the
      // client. See TODOS.md.
      tokenStore.clear();
      throw new ApiError(403, 'staff_only', null);
    }
    tokenStore.set(token);
    setState({ status: 'signed-in', user });
  }, []);

  const signOut = useCallback(() => {
    tokenStore.clear();
    setState({ status: 'signed-out', user: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, signIn, signOut }),
    [state, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
