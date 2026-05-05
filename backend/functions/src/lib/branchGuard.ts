/**
 * Branch-aware guards.
 *
 * Locked by /plan-eng-review on 2026-05-05.
 *
 * Every operational document (orders, products, prescriptions, subscriptions,
 * consultations, inventory) MUST carry a `branchId` field. v1 ships with a
 * single branch ('main'). v2 multi-store rollout flips branchIds on the
 * existing schema without a data migration.
 *
 * Use these guards in every Cloud Function that reads or writes operational
 * collections. They throw clear errors so missing-branchId bugs fail loudly
 * in tests rather than silently in production.
 */

import * as functions from 'firebase-functions';

export const DEFAULT_BRANCH_ID = 'main';

/**
 * Allowed branch IDs. v1 = ['main']. v2 expands.
 */
export const KNOWN_BRANCH_IDS = ['main'];

/**
 * Throw if `data` doesn't include a valid `branchId`.
 * Use in callable functions before any Firestore write.
 */
export function requireBranchId(
  data: Record<string, unknown> | null | undefined,
  context: string = 'document'
): string {
  const id = (data as Record<string, unknown> | null)?.branchId;
  if (typeof id !== 'string' || id.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `${context} is missing branchId. Every operational document must carry a branch.`
    );
  }
  if (!KNOWN_BRANCH_IDS.includes(id)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `${context} has unknown branchId '${id}'. Known branches: ${KNOWN_BRANCH_IDS.join(', ')}`
    );
  }
  return id;
}

/**
 * Inject branchId into a document payload before write.
 * Defaults to DEFAULT_BRANCH_ID if not present.
 */
export function withBranch<T extends Record<string, unknown>>(
  data: T,
  branchId: string = DEFAULT_BRANCH_ID
): T & { branchId: string } {
  return { ...data, branchId };
}

/**
 * Wrap a Firestore Query to enforce branchId presence.
 * Usage:
 *   const q = scopedTo(db.collection('orders').where('userId', '==', uid), branchId);
 */
export function scopedTo<T extends FirebaseFirestore.Query>(
  query: T,
  branchId: string = DEFAULT_BRANCH_ID
): T {
  return query.where('branchId', '==', branchId) as T;
}

/**
 * Throw if a callable's caller tries to operate on a branch they don't belong to.
 * Used by pharmacist/staff-callable functions in v2 multi-store ops.
 */
export function requireUserBranch(
  callerBranchId: string | undefined,
  targetBranchId: string
): void {
  if (!callerBranchId) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Caller has no branchId. Cannot operate on a branch.'
    );
  }
  if (callerBranchId !== targetBranchId) {
    throw new functions.https.HttpsError(
      'permission-denied',
      `Caller belongs to branch '${callerBranchId}' but tried to operate on '${targetBranchId}'.`
    );
  }
}
