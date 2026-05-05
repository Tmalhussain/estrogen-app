/**
 * Firestore triggers for order lifecycle events.
 *
 * - onOrderCreated: sends notification when a new order is placed
 * - onOrderUpdated: sends notification when order status changes
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';

const statusLabels: Record<string, { ar: string; en: string }> = {
  placed: { ar: 'تم استلام طلبكِ', en: 'Order Received' },
  pending_review: { ar: 'طلبكِ قيد المراجعة', en: 'Order Under Review' },
  pharmacist_review: { ar: 'الصيدلانية تراجع وصفتكِ', en: 'Pharmacist Reviewing Prescription' },
  approved: { ar: 'تمت الموافقة على طلبكِ', en: 'Order Approved' },
  packing: { ar: 'جاري تجهيز طلبكِ', en: 'Packing Your Order' },
  out_for_delivery: { ar: 'طلبكِ في الطريق', en: 'Order on the Way' },
  delivered: { ar: 'تم توصيل طلبكِ', en: 'Order Delivered' },
  cancelled: { ar: 'تم إلغاء الطلب', en: 'Order Cancelled' },
};

export const onOrderCreated = functions
  .region(REGION)
  .firestore.document('orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    const orderId = context.params.orderId;

    await db.collection('notifications').add({
      userId: order.userId,
      type: 'order',
      titleAr: 'تم استلام طلبكِ بنجاح',
      titleEn: 'Order Placed Successfully',
      bodyAr: `طلبكِ رقم ${orderId} تم استلامه. ${order.requiresPrescription ? 'سيتم مراجعة الوصفة الطبية.' : 'جاري تجهيز طلبكِ.'}`,
      bodyEn: `Order ${orderId} received. ${order.requiresPrescription ? 'Your prescription will be reviewed.' : 'We are preparing your order.'}`,
      read: false,
      linkedOrderId: orderId,
      timestamp: FieldValue.serverTimestamp(),
    });

    await updateStats('ordersToday', 1);
    await updateStats('revenueToday', order.total ?? 0);

    functions.logger.info(`Order ${orderId} created for user ${order.userId}`);
  });

export const onOrderUpdated = functions
  .region(REGION)
  .firestore.document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const orderId = context.params.orderId;

    if (before.status === after.status) return;

    const label = statusLabels[after.status] || { ar: 'تحديث الطلب', en: 'Order Update' };

    await db.collection('notifications').add({
      userId: after.userId,
      type: 'order',
      titleAr: label.ar,
      titleEn: label.en,
      bodyAr: `طلبكِ رقم ${orderId} — ${label.ar}`,
      bodyEn: `Order ${orderId} — ${label.en}`,
      read: false,
      linkedOrderId: orderId,
      timestamp: FieldValue.serverTimestamp(),
    });

    if (after.status === 'delivered') {
      await updateStats('deliveredToday', 1);
    }
    if (after.status === 'cancelled' && before.status !== 'cancelled') {
      await updateStats('cancelledToday', 1);
      await restoreStock(after);
    }

    functions.logger.info(`Order ${orderId} status: ${before.status} → ${after.status}`);
  });

async function updateStats(field: string, increment: number) {
  const today = new Date().toISOString().split('T')[0];
  const statsRef = db.doc(`stats/${today}`);

  await statsRef.set(
    {
      [field]: FieldValue.increment(increment),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function restoreStock(order: FirebaseFirestore.DocumentData) {
  const items: Array<{ productId: string; quantity: number }> = order.items ?? [];
  if (!items.length) return;

  await db.runTransaction(async (tx) => {
    for (const item of items) {
      const ref = db.doc(`products/${item.productId}`);
      const snap = await tx.get(ref);
      if (!snap.exists) continue;
      tx.update(ref, {
        stockCount: FieldValue.increment(item.quantity),
        inStock: true,
      });
    }
  });
}
