/**
 * Admin authentication via Firebase Auth + Firestore role check.
 *
 * Replaces the prior localStorage-only hash auth with real backend auth:
 *   - Sign in goes through Firebase Auth (signInWithEmailAndPassword)
 *   - Role is read from users/{uid}.role in Firestore
 *   - Only role IN ('admin', 'super_admin', 'pharmacist') is allowed in
 *   - Session is cached in localStorage so existing sync callers
 *     (Sidebar, DashboardLayout) keep working without becoming async
 *   - onAuthStateChanged keeps the cache in sync with the real Firebase
 *     Auth state across reloads and silent token refresh
 *
 * First-time bootstrap:
 *   If no admin exists in users/ at all, the special seed credentials
 *   ('admin' / 'admin') call the bootstrapFirstAdmin Cloud Function to
 *   create a super_admin under the email admin@estrogen.local. After that
 *   the bootstrap callable is permanently locked — subsequent admins are
 *   created via createStaffAccount (which itself requires an admin).
 *
 * Username convention:
 *   Firebase Auth uses email. We accept either:
 *     - A real email like "sarah@estrogen.com.sa"
 *     - A bare username like "admin", which we expand to admin@estrogen.local
 *
 * Security note:
 *   Once you have one real admin, run the production hardening checklist:
 *     1. Sign in to admin/ as that admin and create human accounts via
 *        the staff-management page (settings/admins).
 *     2. Change the seed password from 'admin' to something strong by
 *        signing in with admin@estrogen.local and updating the password
 *        in Firebase Auth Console (or via a callable we'll add later).
 *     3. Remove the bootstrapFirstAdmin export from
 *        backend/functions/src/index.ts and redeploy. After that, the
 *        one-shot guard is permanent — no callable surface at all.
 */

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { db } from './firebase';

const SESSION_KEY = 'estrogen-admin-session';
const SEED_USERNAME = 'admin';
const SEED_PASSWORD = 'admin';
const SEED_EMAIL = 'admin@estrogen.local';
const SEED_NAME = 'Default Admin';

export type AdminRole = 'admin' | 'super_admin' | 'pharmacist';

export interface AdminSession {
  uid: string;
  email: string;
  name: string;
  username: string;
  role: AdminRole;
}

// ── Username → email expansion ────────────────────────────────────
function toEmail(usernameOrEmail: string): string {
  const v = usernameOrEmail.trim();
  return v.includes('@') ? v.toLowerCase() : `${v.toLowerCase()}@estrogen.local`;
}

function emailToUsername(email: string): string {
  // For display: strip @estrogen.local for seed-style emails so the UI
  // shows "admin" rather than "admin@estrogen.local". Real emails stay as-is.
  if (email.endsWith('@estrogen.local')) {
    return email.slice(0, email.length - '@estrogen.local'.length);
  }
  return email;
}

// ── Session cache helpers ────────────────────────────────────────
function saveSession(s: AdminSession) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    /* quota / storage disabled, fall back to in-memory only */
  }
}

function loadSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AdminSession) : null;
  } catch {
    return null;
  }
}

function dropSession() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

// ── Firestore role lookup ────────────────────────────────────────
async function fetchRole(user: User): Promise<{
  role: AdminRole | null;
  name: string;
}> {
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) return { role: null, name: '' };
    const data = snap.data() as { role?: string; name?: string };
    const role =
      data.role === 'admin' || data.role === 'super_admin' || data.role === 'pharmacist'
        ? (data.role as AdminRole)
        : null;
    return { role, name: data.name || '' };
  } catch (err) {
    // Firestore offline / rules deny — treat as unauthorized.
    return { role: null, name: '' };
  }
}

// ── Bootstrap path (only runs when no admin exists yet) ──────────
async function tryFirstAdminBootstrap(): Promise<boolean> {
  try {
    const fns = getFunctions(undefined, 'me-central1');
    const bootstrap = httpsCallable<
      { email: string; password: string; name: string },
      { ok: true; uid: string }
    >(fns, 'bootstrapFirstAdmin');
    await bootstrap({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      name: SEED_NAME,
    });
    return true;
  } catch {
    return false;
  }
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Sign in with username/email + password.
 * Returns { success: true } on success, { success: false, error } on failure.
 */
export async function authenticate(
  usernameOrEmail: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const auth = getAuth();
  const email = toEmail(usernameOrEmail);

  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const { role, name } = await fetchRole(cred.user);
    if (!role) {
      // Authenticated but no admin role — refuse and sign out.
      await signOut(auth);
      dropSession();
      return { success: false, error: 'notAuthorized' };
    }
    const session: AdminSession = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      name: name || (cred.user.displayName ?? 'Admin'),
      username: emailToUsername(cred.user.email || email),
      role,
    };
    saveSession(session);
    return { success: true };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';

    // First-time bootstrap: if seed creds were used and no admin exists,
    // call the one-shot bootstrap callable then retry sign-in.
    if (
      usernameOrEmail.trim().toLowerCase() === SEED_USERNAME &&
      password === SEED_PASSWORD &&
      (code === 'auth/user-not-found' ||
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password')
    ) {
      const bootstrapped = await tryFirstAdminBootstrap();
      if (bootstrapped) {
        // Retry once with the now-existing seed admin.
        try {
          const cred = await signInWithEmailAndPassword(
            auth,
            SEED_EMAIL,
            SEED_PASSWORD
          );
          const { role, name } = await fetchRole(cred.user);
          if (!role) {
            await signOut(auth);
            return { success: false, error: 'bootstrapMissingRole' };
          }
          const session: AdminSession = {
            uid: cred.user.uid,
            email: cred.user.email || SEED_EMAIL,
            name: name || SEED_NAME,
            username: SEED_USERNAME,
            role,
          };
          saveSession(session);
          return { success: true };
        } catch (retryErr: unknown) {
          return {
            success: false,
            error:
              (retryErr as { code?: string })?.code || 'bootstrapSignInFailed',
          };
        }
      }
    }

    return { success: false, error: code || 'invalidCredentials' };
  }
}

/**
 * Sync getter — returns the cached session.
 *
 * The cache is kept fresh by `subscribeToAuthState()` (called from
 * <DashboardLayout> on mount), which mirrors Firebase Auth state into
 * localStorage. On a fresh page load before the listener fires, this
 * returns the last-known good session, which is fine for the gate logic.
 */
export function getSession(): AdminSession | null {
  return loadSession();
}

/**
 * Sync gate. Returns true if a cached session exists. On the first render
 * after a hard reload this may be optimistic (cache says yes, Firebase
 * hasn't yet rehydrated the user); the auth-state subscription fixes that
 * within milliseconds. Worst case the user briefly sees a screen they're
 * not allowed to see, then gets bounced.
 */
export function isLoggedIn(): boolean {
  return loadSession() !== null;
}

export async function clearSession(): Promise<void> {
  const auth = getAuth();
  try {
    await signOut(auth);
  } catch {
    /* swallow — local sign-out is what matters */
  }
  dropSession();
}

/**
 * Hook this into <DashboardLayout> on mount. Mirrors Firebase Auth state
 * into the localStorage cache so sync getters (`getSession`, `isLoggedIn`)
 * stay accurate across reloads, token refresh, and explicit sign-out.
 *
 * Returns the unsubscribe function; call it on unmount.
 */
export function subscribeToAuthState(
  onChange?: (session: AdminSession | null) => void
): () => void {
  const auth = getAuth();
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      dropSession();
      onChange?.(null);
      return;
    }
    const { role, name } = await fetchRole(user);
    if (!role) {
      // Authenticated user but no admin role — drop them.
      await signOut(auth);
      dropSession();
      onChange?.(null);
      return;
    }
    const session: AdminSession = {
      uid: user.uid,
      email: user.email || '',
      name: name || (user.displayName ?? 'Admin'),
      username: emailToUsername(user.email || ''),
      role,
    };
    saveSession(session);
    onChange?.(session);
  });
}

// ── Back-compat shims ────────────────────────────────────────────
// The previous adminAuth.ts exported these and the settings page uses
// them. Re-export safe equivalents so we don't break that page.

export function listAdmins(): {
  username: string;
  name: string;
  role: string;
  createdAt: string;
}[] {
  // In Firebase-Auth-backed mode we can't synchronously enumerate all
  // admin users from the client (would require an admin SDK callable).
  // Return the current session as the only known entry. The settings
  // page will need an async fetch via a Cloud Function for the real list;
  // for now this keeps the UI from crashing.
  const s = loadSession();
  if (!s) return [];
  return [
    {
      username: s.username,
      name: s.name,
      role: s.role,
      createdAt: '',
    },
  ];
}

/**
 * Old `createAdmin` was localStorage-only. The real path now is the
 * `createStaffAccount` callable in backend/functions/src/api/staff.ts,
 * which is gated by isAdmin() on the backend. This shim invokes that
 * callable so the settings page keeps working unchanged.
 */
export async function createAdmin(
  username: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  // The createStaffAccount Cloud Function expects firstName/lastName as
  // separate fields; the legacy admin form passes a single 'name'. Split
  // on the first whitespace and keep the remainder as lastName.
  const trimmed = name.trim();
  const spaceAt = trimmed.indexOf(' ');
  const firstName = spaceAt === -1 ? trimmed : trimmed.slice(0, spaceAt);
  const lastName = spaceAt === -1 ? '' : trimmed.slice(spaceAt + 1).trim();

  try {
    const fns = getFunctions(undefined, 'me-central1');
    const fn = httpsCallable<
      {
        email: string;
        password: string;
        firstName: string;
        lastName?: string;
        role: string;
      },
      { ok: true; uid: string }
    >(fns, 'createStaffAccount');
    await fn({
      email: toEmail(username),
      password,
      firstName,
      lastName,
      role: 'admin',
    });
    return { success: true };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || 'createAdminFailed';
    return { success: false, error: code };
  }
}

/**
 * Legacy seed initializer. Kept as a no-op: real bootstrap happens via
 * the bootstrapFirstAdmin Cloud Function when seed creds are entered on
 * the login form. Existing callers can keep invoking this safely.
 */
export function initAdminUsers(): void {
  /* no-op in Firebase-Auth-backed mode */
}
