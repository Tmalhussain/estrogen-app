/**
 * Client-side password hashing utilities.
 *
 * PRODUCTION NOTE: In production, password hashing MUST be done server-side
 * using bcrypt, argon2, or scrypt. This client-side implementation is for
 * MVP/demo purposes only to demonstrate secure password storage patterns.
 */

// ── Salt Generation ──────────────────────────────────────────

export function generateSalt(): string {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without Web Crypto
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ── FNV-1a Hash Core ─────────────────────────────────────────

function fnv1a(input: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return hash >>> 0;
}

// ── Password Hashing (multi-round FNV-1a) ────────────────────

const HASH_ROUNDS = 1000;

export function hashPassword(password: string, salt: string): string {
  const data = salt + ':' + password;
  let h1 = fnv1a(data);
  let h2 = fnv1a(data + ':r2');
  let h3 = fnv1a(':' + data + ':r3');
  let h4 = fnv1a(data + ':r4:' + data);

  for (let i = 0; i < HASH_ROUNDS; i++) {
    h1 = fnv1a(h1.toString(36) + ':' + data + ':' + h2.toString(36));
    h2 = fnv1a(h2.toString(36) + ':' + data + ':' + h3.toString(36));
    h3 = fnv1a(h3.toString(36) + ':' + data + ':' + h4.toString(36));
    h4 = fnv1a(h4.toString(36) + ':' + data + ':' + h1.toString(36));
  }

  return [h1, h2, h3, h4].map((h) => h.toString(16).padStart(8, '0')).join('');
}

// ── Password Verification ────────────────────────────────────

export function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): boolean {
  return hashPassword(password, salt) === storedHash;
}

// ── Generate Unique ID ───────────────────────────────────────

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}
