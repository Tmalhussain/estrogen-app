/**
 * Auth callables — phone OTP via Unifonic.
 *
 * Locked by /plan-eng-review ARCH-1.1 on 2026-05-05.
 *
 * Why Unifonic and not Firebase native phone auth:
 *   - Saudi-standard, CITC-licensed, sender ID shows your brand
 *   - <5 second delivery vs Firebase native's 30-60 sec in KSA
 *   - ~$0.02/SMS vs ~$0.05 with Firebase native
 *   - Full delivery visibility for debugging "where's my OTP" issues
 *
 * Flow:
 *   1) Client calls `sendOtp({ phoneNumber })` with E.164 +966...
 *   2) We rate-limit (max 5 / 15 min / phone), generate a 6-digit code,
 *      hash it with bcrypt, store the hash + TTL in `otp_attempts/{phone+timestamp}`,
 *      then call Unifonic's REST API to send the SMS.
 *   3) Client calls `verifyOtp({ phoneNumber, code })` with the code.
 *   4) We look up the most recent unverified attempt within TTL, bcrypt-compare,
 *      mint a Firebase custom token via admin SDK, return it.
 *   5) Client signs in with `signInWithCustomToken(token)`.
 *
 * Production secrets required (via firebase functions:config:set):
 *   unifonic.app_sid     — Unifonic application SID
 *   unifonic.sender_id   — Approved sender ID (per CITC rules)
 *   unifonic.api_url     — Default https://api.unifonic.com/rest/SMS/messages
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db, REGION } from '../lib/admin';

// ── Config ────────────────────────────────────────────────────────
const OTP_LENGTH = 6;
const OTP_TTL_SEC = 5 * 60;             // OTP valid for 5 minutes
const MAX_ATTEMPTS_PER_WINDOW = 5;       // 5 sends per phone per 15 min
const ATTEMPT_WINDOW_SEC = 15 * 60;     // brute-force window
const MAX_VERIFY_ATTEMPTS = 3;          // 3 wrong codes per attempt

// ── Helpers ───────────────────────────────────────────────────────
function generateOtp(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
}

function normalizePhone(phone: string): string {
  // E.164 +966 5XX XXX XXXX
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('966')) return '+' + cleaned;
  if (cleaned.startsWith('05')) return '+966' + cleaned.slice(1);
  if (cleaned.startsWith('5')) return '+966' + cleaned;
  return cleaned;
}

function isValidSaudiPhone(phone: string): boolean {
  // +966 5XX XXX XXXX  — Saudi mobile only (no landlines).
  return /^\+9665\d{8}$/.test(phone);
}

async function hashCode(code: string): Promise<string> {
  // Use Node's built-in crypto.scrypt to avoid pulling bcrypt as a dep.
  // For production, replace with bcrypt or argon2id.
  const crypto = await import('crypto');
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(code, salt, 32, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function verifyHash(code: string, hash: string): Promise<boolean> {
  const crypto = await import('crypto');
  const [salt, key] = hash.split(':');
  return new Promise((resolve, reject) => {
    crypto.scrypt(code, salt, 32, (err, derivedKey) => {
      if (err) return reject(err);
      // Use timingSafeEqual to prevent timing attacks
      try {
        const same = crypto.timingSafeEqual(
          Buffer.from(key, 'hex'),
          derivedKey
        );
        resolve(same);
      } catch {
        resolve(false);
      }
    });
  });
}

async function callUnifonic(phone: string, body: string): Promise<void> {
  const cfg = functions.config().unifonic || {};
  const appSid = cfg.app_sid;
  const senderId = cfg.sender_id || 'Estrogen';
  const apiUrl = cfg.api_url || 'https://api.unifonic.com/rest/SMS/messages';

  if (!appSid) {
    // Allow emulator dev without secrets — log and return.
    if (process.env.FUNCTIONS_EMULATOR === 'true') {
      // eslint-disable-next-line no-console
      console.log(`[DEV] Unifonic stub: would send to ${phone}: ${body}`);
      return;
    }
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Unifonic not configured. Run: firebase functions:config:set unifonic.app_sid=...'
    );
  }

  const params = new URLSearchParams({
    AppSid: appSid,
    Recipient: phone.replace('+', ''),
    Body: body,
    SenderID: senderId,
    async: 'false',
  });

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    // Don't leak the full Unifonic response to the client; log internally.
    functions.logger.error('Unifonic send failed', {
      phone: phone.slice(0, 7) + '****', // partial mask for log privacy
      status: res.status,
      body: text,
    });
    throw new functions.https.HttpsError(
      'internal',
      'Could not send OTP. Please try again.'
    );
  }
}

// ── sendOtp ────────────────────────────────────────────────────────
export const sendOtp = functions
  .region(REGION)
  .https.onCall(async (data: { phoneNumber: string }, _context) => {
    const phone = normalizePhone(data?.phoneNumber || '');

    if (!isValidSaudiPhone(phone)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Please enter a valid Saudi mobile number (+966 5XX XXX XXXX).'
      );
    }

    // Rate-limit: count send-attempts in the last 15 minutes for this phone.
    const windowStart = admin.firestore.Timestamp.fromMillis(
      Date.now() - ATTEMPT_WINDOW_SEC * 1000
    );
    const recentSnap = await db
      .collection('otp_attempts')
      .where('phoneNumber', '==', phone)
      .where('createdAt', '>=', windowStart)
      .get();

    if (recentSnap.size >= MAX_ATTEMPTS_PER_WINDOW) {
      throw new functions.https.HttpsError(
        'resource-exhausted',
        'Too many attempts. Please try again in 15 minutes.'
      );
    }

    const code = generateOtp();
    const codeHash = await hashCode(code);
    const expiresAt = admin.firestore.Timestamp.fromMillis(
      Date.now() + OTP_TTL_SEC * 1000
    );

    await db.collection('otp_attempts').add({
      phoneNumber: phone,
      codeHash,
      verified: false,
      verifyAttempts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
    });

    // Send via Unifonic. SMS body: short, branded, bilingual.
    const body = `Estrogen Pharmacy: ${code} | إستروجين: رمز التحقق ${code}`;
    await callUnifonic(phone, body);

    return { ok: true, expiresIn: OTP_TTL_SEC };
  });

// ── verifyOtp ──────────────────────────────────────────────────────
export const verifyOtp = functions
  .region(REGION)
  .https.onCall(
    async (data: { phoneNumber: string; code: string }, _context) => {
      const phone = normalizePhone(data?.phoneNumber || '');
      const code = (data?.code || '').replace(/\s/g, '');

      if (!isValidSaudiPhone(phone)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid phone number.'
        );
      }
      if (!/^\d{6}$/.test(code)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'OTP must be 6 digits.'
        );
      }

      // Find the latest unverified attempt within TTL.
      const now = admin.firestore.Timestamp.now();
      const snap = await db
        .collection('otp_attempts')
        .where('phoneNumber', '==', phone)
        .where('verified', '==', false)
        .where('expiresAt', '>=', now)
        .orderBy('expiresAt', 'desc')
        .limit(1)
        .get();

      if (snap.empty) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'No active OTP. Please request a new code.'
        );
      }

      const doc = snap.docs[0];
      const attempt = doc.data();

      if ((attempt.verifyAttempts || 0) >= MAX_VERIFY_ATTEMPTS) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Too many wrong codes. Request a new OTP.'
        );
      }

      const matches = await verifyHash(code, attempt.codeHash);

      if (!matches) {
        await doc.ref.update({
          verifyAttempts: admin.firestore.FieldValue.increment(1),
        });
        throw new functions.https.HttpsError(
          'permission-denied',
          'Wrong code. Please try again.'
        );
      }

      // Mark verified.
      await doc.ref.update({
        verified: true,
        verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Find or create the user record. Use phone as the unique key
      // and provision a Firebase Auth user on first verify.
      let firebaseUser: admin.auth.UserRecord;
      try {
        firebaseUser = await admin.auth().getUserByPhoneNumber(phone);
      } catch {
        firebaseUser = await admin.auth().createUser({
          phoneNumber: phone,
          disabled: false,
        });
        // Seed a users/{uid} document on first sign-in.
        await db.collection('users').doc(firebaseUser.uid).set(
          {
            phoneNumber: phone,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            role: 'customer',
            // Default profile is the user themselves; v2 caregiver mode adds more.
            // (the actual document is in family/{profileId} subcollection)
          },
          { merge: true }
        );
        // Default family/self profile
        await db
          .collection('users')
          .doc(firebaseUser.uid)
          .collection('family')
          .doc('self')
          .set({
            relationship: 'self',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
      }

      // Mint custom token. Client signs in with signInWithCustomToken.
      const customToken = await admin
        .auth()
        .createCustomToken(firebaseUser.uid, {
          phone,
          authMethod: 'unifonic_otp',
        });

      return {
        ok: true,
        token: customToken,
        uid: firebaseUser.uid,
      };
    }
  );
