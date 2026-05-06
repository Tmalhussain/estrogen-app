import { randomInt, scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

export const OTP_LENGTH = 6;
export const OTP_TTL_SEC = 5 * 60;
export const MAX_SENDS_PER_WINDOW = 5;
export const SEND_WINDOW_SEC = 15 * 60;
export const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Dev-only bypass code. When SMS_PROVIDER=console (the local-dev signal),
 * /auth/verify-otp will accept this code for ANY Saudi phone number, even
 * if no /send-otp was issued. This makes local testing fast — no need to
 * grep server logs for the real code.
 *
 * In production (SMS_PROVIDER=unifonic or any other real provider) the
 * bypass is OFF and only the real hashed code in otp_attempts is accepted.
 */
export const DEV_BYPASS_OTP_CODE = '000000';

export function devBypassEnabled(): boolean {
  const provider = (process.env.SMS_PROVIDER || 'console').toLowerCase();
  return provider === 'console';
}

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
