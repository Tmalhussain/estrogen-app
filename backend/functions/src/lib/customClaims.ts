/**
 * Helper to sync a user's role from their Firestore profile
 * into Firebase Auth custom claims, so security rules and
 * client SDKs can check role via the ID token without an
 * extra Firestore read.
 */

import { auth, Role } from './admin';

export async function setUserRoleClaim(uid: string, role: Role): Promise<void> {
  await auth.setCustomUserClaims(uid, { role });
}

export async function clearUserClaims(uid: string): Promise<void> {
  await auth.setCustomUserClaims(uid, null);
}
