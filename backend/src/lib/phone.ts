/**
 * Saudi-first phone normalization. Accepts:
 *   "0501234567"         → "+966501234567"
 *   "501234567"          → "+966501234567"
 *   "+966 50 123 4567"   → "+966501234567"
 *   "00966501234567"     → "+966501234567"
 *
 * Returns null for anything we can't confidently turn into E.164. The
 * caller decides how to surface that to the user.
 */
export function normalizeSaudiPhone(input: string): string | null {
  if (!input) return null;
  const stripped = input.replace(/[^\d+]/g, '');
  let candidate = stripped;
  if (candidate.startsWith('00')) candidate = '+' + candidate.slice(2);
  if (!candidate.startsWith('+')) {
    if (candidate.startsWith('966')) candidate = '+' + candidate;
    else if (candidate.startsWith('05')) candidate = '+966' + candidate.slice(1);
    else if (candidate.startsWith('5')) candidate = '+966' + candidate;
    else return null;
  }
  return /^\+9665\d{8}$/.test(candidate) ? candidate : null;
}
