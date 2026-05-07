import { createHash, randomBytes } from 'node:crypto';

const PREFIX = 'estk';

/**
 * Generate a fresh API key. Returns the plaintext key the caller must show
 * to the user exactly once, plus the prefix and hash to store.
 *
 * Format: estk_<32 random chars>. The first 12 chars (estk_xxxxxxxx) are
 * stored as a non-secret prefix so admins can identify a key in lists
 * without seeing the secret part.
 */
export function generateApiKey(): {
  plaintext: string;
  prefix: string;
  hash: string;
} {
  const random = randomBytes(24).toString('base64url');
  const plaintext = `${PREFIX}_${random}`;
  const prefix = plaintext.slice(0, 12);
  const hash = hashApiKey(plaintext);
  return { plaintext, prefix, hash };
}

export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}
