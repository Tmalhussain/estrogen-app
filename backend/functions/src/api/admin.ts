/**
 * HTTPS Callable Functions for admin operations.
 *
 * These are called from the admin dashboard for operations
 * that require server-side validation or complex logic.
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';
import {
  assertTransition,
  shouldNotifyCustomer,
  type OrderStatus,
} from '../lib/orderStatus';

/**
 * Search products with full-text matching.
 * Called from admin dashboard for product management.
 */
export const searchProducts = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const { query, categoryId, requiresRx, inStockOnly, limit: resultLimit = 20 } = data;

    let ref: FirebaseFirestore.Query = db.collection('products');

    if (categoryId) ref = ref.where('categoryId', '==', categoryId);
    if (typeof requiresRx === 'boolean') ref = ref.where('requiresPrescription', '==', requiresRx);
    if (inStockOnly) ref = ref.where('inStock', '==', true);

    ref = ref.limit(resultLimit);
    const snapshot = await ref.get();

    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (query) {
      const q = query.toLowerCase();
      products = products.filter(
        (p: any) =>
          p.nameAr?.includes(q) ||
          p.nameEn?.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q)
      );
    }

    return { products };
  });

/**
 * Update order status with validation.
 * Only admins and pharmacists can use this.
 */
export const updateOrderStatus = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    const callerDoc = await db.doc(`users/${context.auth.uid}`).get();
    const callerRole = callerDoc.data()?.role;

    if (!callerRole || !['admin', 'pharmacist'].includes(callerRole)) {
      throw new functions.https.HttpsError('permission-denied', 'Only staff can update order status');
    }

    const { orderId, newStatus, notes } = data as {
      orderId?: string;
      newStatus?: OrderStatus;
      notes?: string;
    };

    if (!orderId || !newStatus) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId and newStatus required');
    }

    // Canonical state machine — must match orderStatus.OrderStatus exactly.
    const validStatuses: OrderStatus[] = [
      'placed',
      'pending_review',
      'pharmacist_review',
      'preparing',
      'out_for_delivery',
      'delivered',
      'cancelled',
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new functions.https.HttpsError('invalid-argument', `Invalid status: ${newStatus}`);
    }

    const orderRef = db.doc(`orders/${orderId}`);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', `Order ${orderId} not found`);
    }

    // Forward-only state machine guard. Throws on illegal transitions
    // (e.g. delivered → preparing). Same-state writes return isNoOp = true
    // so we can short-circuit and stay idempotent — no extra write, no
    // duplicate downstream notification fan-out.
    //
    // Legacy aliases: orders created before the canonical state machine
    // landed may carry deprecated statuses ('approved', 'packing') that
    // are not in OrderStatus. Translate them into their canonical
    // equivalent so those orders can still flow through updates instead
    // of getting permanently locked out by assertTransition.
    const LEGACY_STATUS_ALIASES: Record<string, OrderStatus> = {
      approved: 'preparing',
      packing: 'preparing',
    };
    const rawCurrent = (orderDoc.data()?.status ?? 'placed') as string;
    const currentStatus: OrderStatus =
      (LEGACY_STATUS_ALIASES[rawCurrent] ?? rawCurrent) as OrderStatus;
    const { isNoOp } = assertTransition(currentStatus, newStatus);

    if (isNoOp) {
      functions.logger.info(
        `Order ${orderId} status unchanged at ${newStatus} (no-op) by ${context.auth.uid}`
      );
      return { success: true, orderId, newStatus, noOp: true };
    }

    const updateData: Record<string, any> = {
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid,
    };

    if (notes) updateData.staffNotes = notes;

    await orderRef.update(updateData);

    // Push fan-out is handled by onOrderUpdated → onNotificationCreated.
    // shouldNotifyCustomer here is informational so callers/tests can see
    // whether this transition is one the customer is told about.
    const notify = shouldNotifyCustomer(newStatus);

    functions.logger.info(
      `Order ${orderId} ${currentStatus} → ${newStatus} by ${context.auth.uid} (notify=${notify})`
    );
    return { success: true, orderId, newStatus, notify };
  });

/**
 * Register an FCM token on the caller's user profile so push
 * notifications can be delivered. Called from the mobile app
 * after permission is granted.
 */
export const registerFcmToken = functions
  .region(REGION)
  .https.onCall(async (data: { token: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    if (!data.token) {
      throw new functions.https.HttpsError('invalid-argument', 'token required');
    }

    await db.doc(`users/${context.auth.uid}`).update({
      fcmTokens: FieldValue.arrayUnion(data.token),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  });

export const unregisterFcmToken = functions
  .region(REGION)
  .https.onCall(async (data: { token: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    if (!data.token) {
      throw new functions.https.HttpsError('invalid-argument', 'token required');
    }

    await db.doc(`users/${context.auth.uid}`).update({
      fcmTokens: FieldValue.arrayRemove(data.token),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  });
