import { Hono } from 'hono';
import { and, desc, eq, gte } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';
import { signSession } from '../lib/jwt.ts';
import {
  OTP_TTL_SEC,
  MAX_SENDS_PER_WINDOW,
  SEND_WINDOW_SEC,
  MAX_VERIFY_ATTEMPTS,
  generateOtpCode,
  hashCode,
  verifyHashedCode,
} from '../lib/otp.ts';
import { smsProvider } from '../lib/sms.ts';
import { normalizeSaudiPhone } from '../lib/phone.ts';
import { firebaseAdmin } from '../lib/firebase-admin.ts';

export const otpRoutes = new Hono();

otpRoutes.post('/send-otp', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return c.json({ error: 'invalid_body' }, 400);

  const phone = normalizeSaudiPhone(String((body as Record<string, unknown>).phoneNumber ?? ''));
  if (!phone) return c.json({ error: 'invalid_phone_number' }, 400);

  const since = new Date(Date.now() - SEND_WINDOW_SEC * 1000);
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_SEC * 1000);
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    null;

  // Rate-limit check + insert in one transaction so two concurrent
  // /send-otp calls can't both pass the count and both insert.
  type Outcome = 'ok' | 'rate_limited';
  const outcome: Outcome = db.transaction((tx) => {
    const recent = tx
      .select({ id: schema.otpAttempts.id })
      .from(schema.otpAttempts)
      .where(
        and(
          eq(schema.otpAttempts.phoneNumber, phone),
          gte(schema.otpAttempts.createdAt, since)
        )
      )
      .all();
    if (recent.length >= MAX_SENDS_PER_WINDOW) return 'rate_limited';
    tx.insert(schema.otpAttempts)
      .values({
        phoneNumber: phone,
        codeHash: hashCode(code),
        expiresAt,
        ip,
      })
      .run();
    return 'ok';
  });

  if (outcome === 'rate_limited')
    return c.json({ error: 'too_many_sends', retryAfterSec: SEND_WINDOW_SEC }, 429);

  const sms = `Estrogen Pharmacy: ${code} | إستروجين: رمز التحقق ${code}`;
  try {
    await smsProvider().send(phone, sms);
  } catch (err) {
    console.error('[send-otp] SMS provider failed', err);
    return c.json({ error: 'sms_send_failed' }, 502);
  }

  return c.json({ ok: true, expiresInSec: OTP_TTL_SEC });
});

otpRoutes.post('/verify-otp', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return c.json({ error: 'invalid_body' }, 400);

  const raw = body as Record<string, unknown>;
  const phone = normalizeSaudiPhone(String(raw.phoneNumber ?? ''));
  const code = String(raw.code ?? '').replace(/\s/g, '');
  const firstName =
    typeof raw.firstName === 'string' && raw.firstName.trim()
      ? raw.firstName.trim()
      : null;
  const lastName = typeof raw.lastName === 'string' ? raw.lastName.trim() : '';

  if (!phone) return c.json({ error: 'invalid_phone_number' }, 400);
  if (!/^\d{6}$/.test(code))
    return c.json({ error: 'invalid_code_format' }, 400);

  const [attempt] = await db
    .select()
    .from(schema.otpAttempts)
    .where(
      and(
        eq(schema.otpAttempts.phoneNumber, phone),
        gte(schema.otpAttempts.expiresAt, new Date())
      )
    )
    .orderBy(desc(schema.otpAttempts.createdAt))
    .limit(1);

  if (!attempt || attempt.verifiedAt)
    return c.json({ error: 'no_active_otp' }, 410);
  if (attempt.verifyAttempts >= MAX_VERIFY_ATTEMPTS)
    return c.json({ error: 'too_many_verify_attempts' }, 429);

  const matches = verifyHashedCode(code, attempt.codeHash);
  if (!matches) {
    await db
      .update(schema.otpAttempts)
      .set({ verifyAttempts: attempt.verifyAttempts + 1 })
      .where(eq(schema.otpAttempts.id, attempt.id));
    const remaining = Math.max(0, MAX_VERIFY_ATTEMPTS - (attempt.verifyAttempts + 1));
    return c.json({ error: 'wrong_code', remaining }, 401);
  }

  await db
    .update(schema.otpAttempts)
    .set({ verifiedAt: new Date() })
    .where(eq(schema.otpAttempts.id, attempt.id));

  // Find or create the user. New customers complete a tiny profile during
  // signup (firstName); returning users skip that entirely.
  let [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.phoneNumber, phone))
    .limit(1);

  let isNewUser = false;
  if (!user) {
    if (!firstName)
      return c.json({ error: 'first_name_required_for_signup' }, 400);
    isNewUser = true;
    [user] = await db
      .insert(schema.users)
      .values({
        phoneNumber: phone,
        phoneVerifiedAt: new Date(),
        firstName,
        lastName,
        role: 'customer',
      })
      .returning();
  } else if (!user.phoneVerifiedAt) {
    [user] = await db
      .update(schema.users)
      .set({ phoneVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, user.id))
      .returning();
  }

  // Mint a Firebase custom token if Firebase Admin is configured. Mobile
  // signs in with signInWithCustomToken so Cloud Storage / FCM / etc. all
  // see the same UID. If Firebase isn't configured we still return our own
  // JWT so dev works without GCP.
  let firebaseCustomToken: string | null = null;
  if (await firebaseAdmin.enabled()) {
    try {
      await firebaseAdmin.ensureUser({
        uid: user.id,
        phoneNumber: phone,
        displayName: `${user.firstName} ${user.lastName}`.trim() || undefined,
      });
      firebaseCustomToken = await firebaseAdmin.mintCustomToken(user.id, {
        role: user.role,
      });
      if (firebaseCustomToken && !user.firebaseUid) {
        await db
          .update(schema.users)
          .set({ firebaseUid: user.id, updatedAt: new Date() })
          .where(eq(schema.users.id, user.id));
      }
    } catch (err) {
      console.error('[verify-otp] firebase mint failed', err);
    }
  }

  const token = await signSession({
    sub: user.id,
    email: user.email ?? `${phone}@phone.estrogen.sa`,
    role: user.role,
  });

  return c.json({
    token,
    firebaseCustomToken,
    isNewUser,
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phoneVerifiedAt: user.phoneVerifiedAt,
      createdAt: user.createdAt,
    },
  });
});
