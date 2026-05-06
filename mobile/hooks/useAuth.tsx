import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError, type ApiUser } from '@/lib/api';
import { tokenStorage } from '@/lib/storage';

const TOKEN_KEY = 'estrogen.session.token';

type AuthState =
  | { status: 'loading'; user: null; token: null }
  | { status: 'signed-out'; user: null; token: null }
  | { status: 'signed-in'; user: ApiUser; token: string };

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    phone?: string;
  }) => Promise<void>;
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
        // Token invalid / expired / network down — drop it and start over.
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

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn: async (email, password) => {
        const { token, user } = await api.login({ email, password });
        await tokenStorage.set(TOKEN_KEY, token);
        setState({ status: 'signed-in', user, token });
      },
      signUp: async (input) => {
        const { token, user } = await api.signup(input);
        await tokenStorage.set(TOKEN_KEY, token);
        setState({ status: 'signed-in', user, token });
      },
      signOut: async () => {
        await tokenStorage.remove(TOKEN_KEY);
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
