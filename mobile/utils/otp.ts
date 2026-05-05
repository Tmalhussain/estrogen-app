/**
 * OTP (One-Time Password) generation and verification.
 *
 * In production, OTP would be sent via SMS (Unifonic/Taqnyat)
 * and verified server-side. This is a client-side demo implementation.
 */

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

interface PendingOtp {
  phone: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

// In-memory OTP storage (not persisted — cleared on app restart)
let pendingOtp: PendingOtp | null = null;

// ── Generate OTP ─────────────────────────────────────────────

export function generateOtp(phone: string): string {
  // Generate a random 6-digit code
  let code = '';
  for (let i = 0; i < OTP_LENGTH; i++) {
    code += Math.floor(Math.random() * 10).toString();
  }

  pendingOtp = {
    phone: normalizePhone(phone),
    code,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
  };

  // In production: send via SMS API
  // For demo: we return the code to display it to the user
  console.log(`[OTP] Code for ${phone}: ${code}`);
  return code;
}

// ── Verify OTP ───────────────────────────────────────────────

export interface OtpResult {
  success: boolean;
  error?: 'expired' | 'invalid' | 'max_attempts' | 'no_pending';
  errorMessage?: { ar: string; en: string };
}

export function verifyOtp(phone: string, code: string): OtpResult {
  if (!pendingOtp) {
    return {
      success: false,
      error: 'no_pending',
      errorMessage: {
        ar: 'لا يوجد رمز تحقق معلق. يرجى طلب رمز جديد.',
        en: 'No pending verification code. Please request a new one.',
      },
    };
  }

  if (normalizePhone(pendingOtp.phone) !== normalizePhone(phone)) {
    return {
      success: false,
      error: 'no_pending',
      errorMessage: {
        ar: 'رقم الجوال لا يتطابق.',
        en: 'Phone number does not match.',
      },
    };
  }

  if (Date.now() > pendingOtp.expiresAt) {
    pendingOtp = null;
    return {
      success: false,
      error: 'expired',
      errorMessage: {
        ar: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.',
        en: 'Verification code has expired. Please request a new one.',
      },
    };
  }

  if (pendingOtp.attempts >= MAX_ATTEMPTS) {
    pendingOtp = null;
    return {
      success: false,
      error: 'max_attempts',
      errorMessage: {
        ar: 'تجاوزتِ عدد المحاولات المسموح. يرجى طلب رمز جديد.',
        en: 'Maximum attempts exceeded. Please request a new code.',
      },
    };
  }

  if (pendingOtp.code !== code) {
    pendingOtp.attempts += 1;
    return {
      success: false,
      error: 'invalid',
      errorMessage: {
        ar: `رمز التحقق غير صحيح. المحاولات المتبقية: ${MAX_ATTEMPTS - pendingOtp.attempts}`,
        en: `Invalid code. Remaining attempts: ${MAX_ATTEMPTS - pendingOtp.attempts}`,
      },
    };
  }

  // Success — clear the OTP
  pendingOtp = null;
  return { success: true };
}

// ── Clear OTP ────────────────────────────────────────────────

export function clearOtp(): void {
  pendingOtp = null;
}

// ── Get current OTP (for demo display) ───────────────────────

export function getCurrentOtpCode(): string | null {
  if (!pendingOtp || Date.now() > pendingOtp.expiresAt) return null;
  return pendingOtp.code;
}

// ── Helpers ──────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  // Remove spaces, dashes, and +966 prefix
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+966')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('966')) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}
