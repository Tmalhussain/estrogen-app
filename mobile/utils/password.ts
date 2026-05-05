/**
 * Password strength validation.
 * Enforces secure passwords and prevents common/weak choices.
 */

// ── Common weak passwords blocklist ──────────────────────────

const COMMON_PASSWORDS = new Set([
  'password', '12345678', '123456789', '1234567890', 'qwerty123',
  'password1', 'iloveyou', 'sunshine1', 'princess1', 'welcome1',
  'abc12345', 'monkey123', 'dragon123', 'master123', 'letmein1',
  'football1', 'shadow12', 'michael1', 'jennifer', 'trustno1',
  'baseball1', 'superman1', 'whatever1', 'jordan123', 'harley123',
  'ranger123', 'batman123', 'andrew123', 'charlie1', 'thomas123',
  'robert123', 'daniel123', 'william1', 'samsung1', 'killer123',
  'passw0rd', 'p@ssword', 'p@ssw0rd', 'admin123', 'user1234',
  '11111111', '22222222', '12341234', 'abcd1234', 'qwer1234',
  'asdf1234', 'zxcv1234', '00000000', '99999999', 'test1234',
]);

// ── Repetition / Sequential checks ──────────────────────────

function hasExcessiveRepetition(password: string): boolean {
  // Check for 3+ consecutive identical characters
  for (let i = 0; i < password.length - 2; i++) {
    if (password[i] === password[i + 1] && password[i + 1] === password[i + 2]) {
      return true;
    }
  }
  return false;
}

function hasSequentialChars(password: string): boolean {
  const sequences = [
    '0123456789', '9876543210',
    'abcdefghijklmnopqrstuvwxyz', 'zyxwvutsrqponmlkjihgfedcba',
    'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
  ];
  const lower = password.toLowerCase();
  for (const seq of sequences) {
    for (let i = 0; i <= seq.length - 4; i++) {
      if (lower.includes(seq.substring(i, i + 4))) {
        return true;
      }
    }
  }
  return false;
}

// ── Strength Assessment ──────────────────────────────────────

export interface PasswordChecks {
  length: boolean;       // >= 8 characters
  uppercase: boolean;    // at least 1 uppercase letter
  lowercase: boolean;    // at least 1 lowercase letter
  number: boolean;       // at least 1 digit
  special: boolean;      // at least 1 special character
  notCommon: boolean;    // not in common passwords list
  noRepetition: boolean; // no 3+ identical consecutive chars
  noSequence: boolean;   // no 4+ sequential chars
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: { ar: string; en: string };
  color: string;
  checks: PasswordChecks;
  isAcceptable: boolean; // score >= 2 required to proceed
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const checks: PasswordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    notCommon: !COMMON_PASSWORDS.has(password.toLowerCase()),
    noRepetition: !hasExcessiveRepetition(password),
    noSequence: !hasSequentialChars(password),
  };

  // Calculate score
  let score = 0;
  const basicChecks = [checks.length, checks.uppercase, checks.lowercase, checks.number];
  const advancedChecks = [checks.special, checks.notCommon, checks.noRepetition, checks.noSequence];

  const basicPassed = basicChecks.filter(Boolean).length;
  const advancedPassed = advancedChecks.filter(Boolean).length;

  if (basicPassed <= 1) score = 0;
  else if (basicPassed === 2) score = 1;
  else if (basicPassed === 3 && advancedPassed < 3) score = 2;
  else if (basicPassed >= 3 && advancedPassed >= 3) score = 3;
  if (basicPassed === 4 && advancedPassed === 4 && password.length >= 12) score = 4;

  // If password is common, cap at 1
  if (!checks.notCommon) score = Math.min(score, 1) as 0 | 1;

  const labels: Record<number, { ar: string; en: string }> = {
    0: { ar: 'ضعيفة جداً', en: 'Very Weak' },
    1: { ar: 'ضعيفة', en: 'Weak' },
    2: { ar: 'مقبولة', en: 'Fair' },
    3: { ar: 'قوية', en: 'Strong' },
    4: { ar: 'قوية جداً', en: 'Very Strong' },
  };

  const colors: Record<number, string> = {
    0: '#DC2626', // red
    1: '#F97316', // orange
    2: '#EAB308', // yellow
    3: '#22C55E', // green
    4: '#059669', // emerald
  };

  return {
    score: score as 0 | 1 | 2 | 3 | 4,
    label: labels[score],
    color: colors[score],
    checks,
    isAcceptable: score >= 2,
  };
}

// ── Validation messages ──────────────────────────────────────

export function getPasswordErrors(password: string, language: 'ar' | 'en'): string[] {
  const { checks } = checkPasswordStrength(password);
  const errors: string[] = [];

  if (!checks.length) {
    errors.push(language === 'ar' ? '٨ أحرف على الأقل' : 'At least 8 characters');
  }
  if (!checks.uppercase) {
    errors.push(language === 'ar' ? 'حرف كبير واحد على الأقل' : 'At least 1 uppercase letter');
  }
  if (!checks.lowercase) {
    errors.push(language === 'ar' ? 'حرف صغير واحد على الأقل' : 'At least 1 lowercase letter');
  }
  if (!checks.number) {
    errors.push(language === 'ar' ? 'رقم واحد على الأقل' : 'At least 1 number');
  }
  if (!checks.notCommon) {
    errors.push(language === 'ar' ? 'كلمة المرور شائعة جداً' : 'Password is too common');
  }

  return errors;
}
