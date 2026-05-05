/**
 * Order placement and cancellation callables.
 *
 * `placeOrder` does the entire checkout in a single Firestore
 * transaction:
 *   1. read every product, validate stock + price
 *   2. apply promo code (if any)
 *   3. compute totals server-side (never trust the client)
 *   4. decrement stock
 *   5. create the order document
 *   6. create a prescription doc + link, if any item requires Rx
 *
 * `cancelOrder` lets a customer cancel their own order while
 * it is still in an early state. Stock is restored by the
 * onOrderUpdated trigger.
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';

interface CartItem {
  productId: string;
  quantity: number;
}

interface PlaceOrderInput {
  items: CartItem[];
  addressId: string;
  paymentMethod: 'card' | 'mada' | 'apple_pay' | 'stc_pay' | 'cod';
  promoCode?: string;
  prescriptionFile?: { storageUrl: string; fileName: string };
  notes?: string;
  discreetPackaging?: boolean;
}

const CANCELLABLE_STATUSES = ['placed', 'pending_review', 'pharmacist_review'];
const VAT_RATE = 0.15;
const DELIVERY_FEE = 15;
const FREE_DELIVERY_THRESHOLD = 200;

export const placeOrder = functions
  .region(REGION)
  .https.onCall(async (data: PlaceOrderInput, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    const uid = context.auth.uid;

    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Cart is empty');
    }
    if (!data.addressId) {
      throw new functions.https.HttpsError('invalid-argument', 'Address required');
    }
    if (!data.paymentMethod) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment method required');
    }

    // Validate address belongs to user
    const addressSnap = await db.doc(`users/${uid}/addresses/${data.addressId}`).get();
    if (!addressSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Address not found');
    }

    // Resolve promo code outside the txn (read-only lookup)
    let promo: { code: string; discountType: 'fixed' | 'percent'; value: number } | null = null;
    if (data.promoCode) {
      const promoSnap = await db.doc(`promoCodes/${data.promoCode.toUpperCase()}`).get();
      if (!promoSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Invalid promo code');
      }
      const p = promoSnap.data()!;
      if (p.active === false) {
        throw new functions.https.HttpsError('failed-precondition', 'Promo code expired');
      }
      if (p.expiresAt && p.expiresAt.toMillis && p.expiresAt.toMillis() < Date.now()) {
        throw new functions.https.HttpsError('failed-precondition', 'Promo code expired');
      }
      promo = {
        code: data.promoCode.toUpperCase(),
        discountType: p.discountType,
        value: p.value,
      };
    }

    const orderRef = db.collection('orders').doc();
    const prescriptionRef = db.collection('prescriptions').doc();

    const result = await db.runTransaction(async (tx) => {
      const productRefs = data.items.map((i) => db.doc(`products/${i.productId}`));
      const productSnaps = await tx.getAll(...productRefs);

      let subtotal = 0;
      let requiresPrescription = false;
      const orderItems: Array<{
        productId: string;
        nameAr: string;
        nameEn: string;
        quantity: number;
        unitPrice: number;
        lineTotal: number;
        requiresPrescription: boolean;
      }> = [];

      for (let i = 0; i < productSnaps.length; i++) {
        const snap = productSnaps[i];
        const reqItem = data.items[i];

        if (!snap.exists) {
          throw new functions.https.HttpsError('not-found', `Product ${reqItem.productId} not found`);
        }
        const product = snap.data()!;

        if (!product.inStock || (product.stockCount ?? 0) < reqItem.quantity) {
          throw new functions.https.HttpsError(
            'failed-precondition',
            `${product.nameEn || reqItem.productId} is out of stock`
          );
        }
        if (reqItem.quantity <= 0 || !Number.isInteger(reqItem.quantity)) {
          throw new functions.https.HttpsError('invalid-argument', 'Invalid quantity');
        }

        const unitPrice: number = product.salePrice ?? product.price;
        const lineTotal = unitPrice * reqItem.quantity;
        subtotal += lineTotal;

        if (product.requiresPrescription) requiresPrescription = true;

        orderItems.push({
          productId: reqItem.productId,
          nameAr: product.nameAr ?? '',
          nameEn: product.nameEn ?? '',
          quantity: reqItem.quantity,
          unitPrice,
          lineTotal,
          requiresPrescription: !!product.requiresPrescription,
        });
      }

      // Discount
      let discount = 0;
      if (promo) {
        discount =
          promo.discountType === 'percent'
            ? +(subtotal * (promo.value / 100)).toFixed(2)
            : Math.min(promo.value, subtotal);
      }

      const subtotalAfterDiscount = subtotal - discount;
      const deliveryFee = subtotalAfterDiscount >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      const vat = +((subtotalAfterDiscount + deliveryFee) * VAT_RATE).toFixed(2);
      const total = +(subtotalAfterDiscount + deliveryFee + vat).toFixed(2);

      if (requiresPrescription && !data.prescriptionFile) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Prescription required for one or more items'
        );
      }

      // Decrement stock
      for (let i = 0; i < productSnaps.length; i++) {
        const snap = productSnaps[i];
        const reqItem = data.items[i];
        const newStock = (snap.data()!.stockCount ?? 0) - reqItem.quantity;
        tx.update(snap.ref, {
          stockCount: FieldValue.increment(-reqItem.quantity),
          inStock: newStock > 0,
        });
      }

      // Create order
      const initialStatus = requiresPrescription ? 'pharmacist_review' : 'placed';
      const orderDoc = {
        userId: uid,
        items: orderItems,
        subtotal: +subtotal.toFixed(2),
        discount,
        deliveryFee,
        vat,
        total,
        promoCode: promo?.code ?? null,
        addressId: data.addressId,
        deliveryAddress: addressSnap.data(),
        paymentMethod: data.paymentMethod,
        paymentStatus: data.paymentMethod === 'cod' ? 'cod_pending' : 'pending',
        requiresPrescription,
        prescriptionId: requiresPrescription ? prescriptionRef.id : null,
        status: initialStatus,
        notes: data.notes ?? '',
        discreetPackaging: data.discreetPackaging ?? true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      tx.set(orderRef, orderDoc);

      // Create prescription if needed
      if (requiresPrescription && data.prescriptionFile) {
        tx.set(prescriptionRef, {
          userId: uid,
          linkedOrderId: orderRef.id,
          fileName: data.prescriptionFile.fileName,
          storageUrl: data.prescriptionFile.storageUrl,
          status: 'pending_review',
          pharmacistId: null,
          pharmacistNotes: '',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return { orderId: orderRef.id, total, status: initialStatus };
    });

    functions.logger.info(`Order ${result.orderId} placed by ${uid} for ${result.total} SAR`);
    return result;
  });

export const cancelOrder = functions
  .region(REGION)
  .https.onCall(async (data: { orderId: string; reason?: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    const uid = context.auth.uid;

    if (!data.orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId required');
    }

    const orderRef = db.doc(`orders/${data.orderId}`);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }
    const order = orderSnap.data()!;

    if (order.userId !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not your order');
    }
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Cannot cancel order in status ${order.status}`
      );
    }

    await orderRef.update({
      status: 'cancelled',
      cancellationReason: data.reason ?? 'user_cancelled',
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  });
