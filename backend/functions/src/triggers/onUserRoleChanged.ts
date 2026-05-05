/**
 * Firestore trigger: keep Firebase Auth custom claims in sync
 * with the `role` field on the user profile. This lets the
 * mobile app and dashboards check role via the ID token.
 *
 * Only fires when `role` actually changes, to avoid unnecessary
 * token refreshes for the user.
 */

import * as functions from 'firebase-functions';
import { REGION, Role } from '../lib/admin';
import { setUserRoleClaim } from '../lib/customClaims';

const VALID_ROLES: Role[] = ['user', 'pharmacist', 'admin'];

export const onUserRoleChanged = functions
  .region(REGION)
  .firestore.document('users/{userId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const before = change.before.exists ? change.before.data() : null;
    const after = change.after.exists ? change.after.data() : null;

    // Document deleted — claims will be cleared by onUserDeleted auth trigger
    if (!after) return;

    const beforeRole = before?.role as Role | undefined;
    const afterRole = after.role as Role | undefined;

    if (beforeRole === afterRole) return;
    if (!afterRole || !VALID_ROLES.includes(afterRole)) {
      functions.logger.warn(`Invalid role on ${userId}: ${afterRole}`);
      return;
    }

    await setUserRoleClaim(userId, afterRole);
    functions.logger.info(`Role claim updated for ${userId}: ${beforeRole ?? 'none'} → ${afterRole}`);
  });
