import { scryptSync, randomBytes, timingSafeEqual } from 'node:crypto';

const KEYLEN = 64;
const COST = 16384;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, KEYLEN, { N: COST });
  return `scrypt:${COST}:${salt}:${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, costStr, salt, hex] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hex) return false;
  const cost = Number.parseInt(costStr, 10);
  const expected = Buffer.from(hex, 'hex');
  const candidate = scryptSync(password, salt, expected.length, { N: cost });
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
