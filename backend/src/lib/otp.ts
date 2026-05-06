import { randomInt, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

export const OTP_LENGTH = 6;
export const OTP_TTL_SEC = 5 * 60;
export const MAX_SENDS_PER_WINDOW = 5;
export const SEND_WINDOW_SEC = 15 * 60;
export const MAX_VERIFY_ATTEMPTS = 5;

export function generateOtpCode(): string {
  // crypto.randomInt is uniform; Math.random isn't. Predicting future codes
  // from prior ones would be a real attack vector even with rate limiting.
  const min = 10 ** (OTP_LENGTH - 1);
  const max = 10 ** OTP_LENGTH;
  return randomInt(min, max).toString().padStart(OTP_LENGTH, '0');
}

export function hashCode(code: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(code, salt, 32, { N: 16384 });
  return `${salt}:${derived.toString('hex')}`;
}

export function verifyHashedCode(code: string, stored: string): boolean {
  const [salt, hex] = stored.split(':');
  if (!salt || !hex) return false;
  const expected = Buffer.from(hex, 'hex');
  const candidate = scryptSync(code, salt, expected.length, { N: 16384 });
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
