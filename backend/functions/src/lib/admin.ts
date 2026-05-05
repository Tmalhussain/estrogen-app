/**
 * Shared Firebase Admin SDK singleton.
 *
 * Every function file imports `db`, `auth`, `messaging`, and `storage`
 * from here so we never re-initialize the app or build duplicate clients.
 */

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const messaging = admin.messaging();
export const storage = admin.storage();

export const FieldValue = admin.firestore.FieldValue;
export const Timestamp = admin.firestore.Timestamp;

export const REGION = 'me-central1';

export type Role = 'user' | 'pharmacist' | 'admin';
