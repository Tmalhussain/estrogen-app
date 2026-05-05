/**
 * First-admin bootstrap callable.
 *
 * Solves the chicken-and-egg of "I just deployed, how do I make my first
 * admin?" Without this, the only ways are (a) manually create a user in
 * Firebase Auth Console + flip role in Firestore Console, or (b) seed via
 * a script the user has to install.
 *
 * Behavior:
 *   - If there is already at least one user with role 'admin' or
 *     'super_admin' in Firestore, this callable throws permission-denied.
 *     Subsequent calls cannot create extra admins this way; use the
 *     existing `createStaffAccount` callable instead (which is itself
 *     gated by isAdmin()).
 *   - Otherwise, creates a Firebase Auth user with the given email +
 *     password, writes users/{uid} with role 'super_admin', and returns
 *     { ok: true, uid }.
 *
 * Security:
 *   - Open to any caller because there's no admin yet to authenticate
 *     against. The check on the existing-admin count is the gate.
 *   - Once one admin exists, this becomes a permanent no-op for everyone.
 *   - In an emulator/dev environment, the test-credential path also works.
 *   - You should disable this callable post-launch to remove the attack
 *     surface, even though it's idempotent: redeploy without the export.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { db, REGION } from '../lib/admin';

interface BootstrapInput {
  email?: string;
  password?: string;
  name?: string;
}

interface BootstrapOutput {
  ok: true;
  uid: string;
}

export const bootstrapFirstAdmin = functions
  .region(REGION)
  .https.onCall(async (data: BootstrapInput, _context): Promise<BootstrapOutput> => {
    const email = (data?.email || '').trim().toLowerCase();
    const password = data?.password || '';
    const name = data?.name || 'Default Admin';

    if (!email || !password) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'email and password are required'
      );
    }
    if (password.length < 8) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'password must be at least 8 characters'
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'invalid email address'
      );
    }

    // Gate: one shot only. After the first admin exists, refuse.
    const existingAdmins = await db
      .collection('users')
      .where('role', 'in', ['admin', 'super_admin'])
      .limit(1)
      .get();

    if (!existingAdmins.empty) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'An admin already exists. Use the existing admin to create more via createStaffAccount.'
      );
    }

    // Try to create the Firebase Auth user. If the email already exists,
    // adopt that user (so re-running the bootstrap with the same email
    // doesn't fail, as long as no admin role is assigned yet).
    let userRecord: admin.auth.UserRecord;
    try {
      userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/email-already-exists') {
        userRecord = await admin.auth().getUserByEmail(email);
        // Reset password so the caller can sign in with what they sent.
        await admin.auth().updateUser(userRecord.uid, { password });
      } else {
        functions.logger.error('bootstrapFirstAdmin createUser failed', err);
        throw new functions.https.HttpsError(
          'internal',
          'Could not create admin account. See server logs.'
        );
      }
    }

    // Set custom claim so security rules can short-circuit on token claim
    // (faster than reading users/{uid}.role on every rule eval).
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'super_admin',
    });

    // Write the canonical users/{uid} record.
    await db.collection('users').doc(userRecord.uid).set(
      {
        email,
        name,
        role: 'super_admin',
        bootstrappedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    functions.logger.info(
      `bootstrapFirstAdmin: created super_admin uid=${userRecord.uid} email=${email}`
    );

    return { ok: true, uid: userRecord.uid };
  });
