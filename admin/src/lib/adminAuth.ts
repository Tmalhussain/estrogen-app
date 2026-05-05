// Admin authentication using localStorage
// Passwords are hashed with a simple but effective hash function

interface AdminUser {
  username: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'super_admin';
  createdAt: string;
}

const STORAGE_KEY = 'estrogen-admin-users';
const SESSION_KEY = 'estrogen-admin-session';

// Simple hash function for password storage (not crypto-grade, but fine for localStorage demo)
function hashPassword(password: string): string {
  let hash = 0;
  const str = `estrogen-salt-2026:${password}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Make it look more like a hash
  return `h${Math.abs(hash).toString(36)}${str.length.toString(36)}`;
}

function getAdmins(): AdminUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAdmins(admins: AdminUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(admins));
}

// Initialize default admin account if none exist
export function initAdminUsers() {
  const admins = getAdmins();
  if (admins.length === 0) {
    const defaultAdmin: AdminUser = {
      username: 'admin',
      name: 'Admin',
      passwordHash: hashPassword('admin'),
      role: 'super_admin',
      createdAt: new Date().toISOString(),
    };
    saveAdmins([defaultAdmin]);
  }
}

export function authenticate(username: string, password: string): AdminUser | null {
  initAdminUsers();
  const admins = getAdmins();
  const hash = hashPassword(password);
  const user = admins.find((a) => a.username === username && a.passwordHash === hash);
  if (user) {
    // Save session
    const session = { username: user.username, name: user.name, role: user.role };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return user;
  }
  return null;
}

export function getSession(): { username: string; name: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

export function createAdmin(
  username: string,
  password: string,
  name: string
): { success: boolean; error?: string } {
  initAdminUsers();
  const admins = getAdmins();
  if (admins.find((a) => a.username === username)) {
    return { success: false, error: 'usernameExists' };
  }
  const newAdmin: AdminUser = {
    username,
    name,
    passwordHash: hashPassword(password),
    role: 'admin',
    createdAt: new Date().toISOString(),
  };
  admins.push(newAdmin);
  saveAdmins(admins);
  return { success: true };
}

export function listAdmins(): { username: string; name: string; role: string; createdAt: string }[] {
  initAdminUsers();
  return getAdmins().map(({ username, name, role, createdAt }) => ({ username, name, role, createdAt }));
}
