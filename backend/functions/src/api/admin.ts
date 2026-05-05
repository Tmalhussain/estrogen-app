/**
 * HTTPS Callable Functions for admin operations.
 *
 * These are called from the admin dashboard for operations
 * that require server-side validation or complex logic.
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';

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

    const { orderId, newStatus, notes } = data;

    if (!orderId || !newStatus) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId and newStatus required');
    }

    const validStatuses = [
      'placed', 'pending_review', 'pharmacist_review',
      'approved', 'packing', 'out_for_delivery',
      'delivered', 'cancelled',
    ];

    if (!validStatuses.includes(newStatus)) {
      throw new functions.https.HttpsError('invalid-argument', `Invalid status: ${newStatus}`);
    }

    const orderRef = db.doc(`orders/${orderId}`);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', `Order ${orderId} not found`);
    }

    const updateData: Record<string, any> = {
      status: newStatus,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid,
    };

    if (notes) updateData.staffNotes = notes;

    await orderRef.update(updateData);

    functions.logger.info(`Order ${orderId} updated to ${newStatus} by ${context.auth.uid}`);
    return { success: true, orderId, newStatus };
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
