/**
 * Auth trigger: when a user account is deleted from Firebase Auth,
 * archive their Firestore profile and detach personal data.
 *
 * We do NOT hard-delete order or prescription records — those are
 * required for SFDA / ZATCA recordkeeping. Instead we tombstone
 * the profile and strip personal fields.
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';

export const onUserDeleted = functions
  .region(REGION)
  .auth.user()
  .onDelete(async (user) => {
    const { uid } = user;

    const profileRef = db.doc(`users/${uid}`);
    const profileSnap = await profileRef.get();

    if (!profileSnap.exists) {
      functions.logger.info(`No profile to delete for ${uid}`);
      return;
    }

    await profileRef.set(
      {
        deleted: true,
        deletedAt: FieldValue.serverTimestamp(),
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        nationalId: '',
        dateOfBirth: '',
        fcmTokens: [],
      },
      { merge: true }
    );

    // Delete addresses subcollection
    const addressesSnap = await profileRef.collection('addresses').get();
    const batch = db.batch();
    addressesSnap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    functions.logger.info(`Tombstoned user ${uid}`);
  });
