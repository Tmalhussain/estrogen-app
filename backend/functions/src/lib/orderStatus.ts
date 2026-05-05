/**
 * Order status state machine.
 *
 * Locked by /plan-eng-review CRITICAL test requirement on 2026-05-05.
 *
 * Forward-only transitions, idempotency-safe, throws on illegal moves.
 * Use this in every Cloud Function that updates order.status.
 *
 * State diagram:
 *
 *    placed
 *      │
 *      ▼
 *    pending_review                      (any state) ─► cancelled
 *      │
 *      ▼
 *    pharmacist_review
 *      │
 *      ▼
 *    preparing
 *      │
 *      ▼
 *    out_for_delivery
 *      │
 *      ▼
 *    delivered  (terminal)
 */

import * as functions from 'firebase-functions';

export type OrderStatus =
  | 'placed'
  | 'pending_review'
  | 'pharmacist_review'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

/**
 * Allowed forward transitions. Cancellation can happen from any
 * non-terminal state via the separate `cancellable` array.
 */
const FORWARD_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed:            ['pending_review', 'pharmacist_review', 'preparing'],
  pending_review:    ['pharmacist_review', 'preparing'],
  pharmacist_review: ['preparing'],
  preparing:         ['out_for_delivery'],
  out_for_delivery:  ['delivered'],
  delivered:         [],   // terminal
  cancelled:         [],   // terminal
};

/**
 * States from which a customer or staff member can cancel.
 */
const CANCELLABLE_FROM: OrderStatus[] = [
  'placed',
  'pending_review',
  'pharmacist_review',
];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (to === 'cancelled') return CANCELLABLE_FROM.includes(from);
  return FORWARD_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Throw if transition is illegal. Idempotent: from === to is allowed
 * and is a no-op. Same-state writes do not fire push notifications.
 */
export function assertTransition(
  from: OrderStatus,
  to: OrderStatus
): { isNoOp: boolean } {
  if (from === to) {
    return { isNoOp: true };
  }
  if (!canTransition(from, to)) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      `Illegal status transition: '${from}' → '${to}'.`
    );
  }
  return { isNoOp: false };
}

export const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled'];
export const CUSTOMER_VISIBLE_TRANSITIONS: OrderStatus[] = [
  'preparing',
  'out_for_delivery',
  'delivered',
];

/**
 * Returns true if the transition should fire a push notification to the customer.
 * Status-anxiety calls (per /office-hours surprise finding) are deflected by
 * sending push on these specific transitions.
 */
export function shouldNotifyCustomer(to: OrderStatus): boolean {
  return CUSTOMER_VISIBLE_TRANSITIONS.includes(to);
}
