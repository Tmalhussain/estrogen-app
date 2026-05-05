/**
 * Staff management callables (admin-only).
 *
 * - createStaffAccount: admin creates a pharmacist or admin user
 * - assignPrescription: pharmacist takes ownership of a prescription
 *   from the review queue, so two pharmacists don't review the same one
 * - reviewPrescription: pharmacist approves / rejects / holds a Rx
 */

import * as functions from 'firebase-functions';
import { db, auth, FieldValue, REGION, Role } from '../lib/admin';

async function requireRole(uid: string, allowed: Role[]): Promise<Role> {
  const userSnap = await db.doc(`users/${uid}`).get();
  const role = userSnap.data()?.role as Role | undefined;
  if (!role || !allowed.includes(role)) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient role');
  }
  return role;
}

interface CreateStaffInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'pharmacist' | 'admin';
  licenseNumber?: string;
}

export const createStaffAccount = functions
  .region(REGION)
  .https.onCall(async (data: CreateStaffInput, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    await requireRole(context.auth.uid, ['admin']);

    if (!data.email || !data.password || !data.firstName) {
      throw new functions.https.HttpsError('invalid-argument', 'email, password, firstName required');
    }
    if (!['pharmacist', 'admin'].includes(data.role)) {
      throw new functions.https.HttpsError('invalid-argument', 'role must be pharmacist or admin');
    }
    if (data.role === 'pharmacist' && !data.licenseNumber) {
      throw new functions.https.HttpsError('invalid-argument', 'licenseNumber required for pharmacists');
    }

    const userRecord = await auth.createUser({
      email: data.email,
      password: data.password,
      displayName: `${data.firstName} ${data.lastName}`.trim(),
      phoneNumber: data.phone,
      emailVerified: true,
    });

    await db.doc(`users/${userRecord.uid}`).set({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone ?? '',
      role: data.role,
      licenseNumber: data.licenseNumber ?? null,
      createdBy: context.auth.uid,
      preferences: {
        language: 'ar',
        notificationsEnabled: true,
      },
      fcmTokens: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // onUserRoleChanged trigger will sync the custom claim,
    // but set it here too so the new account is usable immediately.
    await auth.setCustomUserClaims(userRecord.uid, { role: data.role });

    functions.logger.info(`Admin ${context.auth.uid} created ${data.role} ${userRecord.uid}`);
    return { uid: userRecord.uid, email: data.email, role: data.role };
  });

export const assignPrescription = functions
  .region(REGION)
  .https.onCall(async (data: { prescriptionId: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    await requireRole(context.auth.uid, ['pharmacist', 'admin']);

    if (!data.prescriptionId) {
      throw new functions.https.HttpsError('invalid-argument', 'prescriptionId required');
    }

    const ref = db.doc(`prescriptions/${data.prescriptionId}`);

    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new functions.https.HttpsError('not-found', 'Prescription not found');
      }
      const rx = snap.data()!;
      if (rx.pharmacistId && rx.pharmacistId !== context.auth!.uid) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Already assigned to another pharmacist'
        );
      }
      tx.update(ref, {
        pharmacistId: context.auth!.uid,
        status: 'in_review',
        assignedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { success: true, prescriptionId: data.prescriptionId };
    });
  });

interface ReviewInput {
  prescriptionId: string;
  decision: 'approved' | 'rejected' | 'hold';
  notes?: string;
}

export const reviewPrescription = functions
  .region(REGION)
  .https.onCall(async (data: ReviewInput, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    await requireRole(context.auth.uid, ['pharmacist', 'admin']);

    if (!data.prescriptionId || !data.decision) {
      throw new functions.https.HttpsError('invalid-argument', 'prescriptionId and decision required');
    }
    if (!['approved', 'rejected', 'hold'].includes(data.decision)) {
      throw new functions.https.HttpsError('invalid-argument', 'invalid decision');
    }
    if (data.decision === 'rejected' && !data.notes) {
      throw new functions.https.HttpsError('invalid-argument', 'rejection requires notes');
    }

    const ref = db.doc(`prescriptions/${data.prescriptionId}`);
    const snap = await ref.get();
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'Prescription not found');
    }
    const rx = snap.data()!;
    if (rx.pharmacistId && rx.pharmacistId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Prescription assigned to another pharmacist'
      );
    }

    await ref.update({
      status: data.decision,
      pharmacistId: context.auth.uid,
      pharmacistNotes: data.notes ?? '',
      reviewedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true, decision: data.decision };
  });
