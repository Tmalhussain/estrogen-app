/**
 * Scheduled function: aggregate yesterday's stats into a snapshot
 * document used by the admin dashboard.
 *
 * Runs daily at 00:30 Riyadh time. The trigger-based counters in
 * stats/{YYYY-MM-DD} (incremented by onOrderCreated/Updated) give
 * a live view; this function fills in derived fields like AOV and
 * top categories from the orders themselves.
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';

export const aggregateDailyStats = functions
  .region(REGION)
  .pubsub.schedule('30 0 * * *')
  .timeZone('Asia/Riyadh')
  .onRun(async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const start = new Date(yesterday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(yesterday);
    end.setHours(23, 59, 59, 999);
    const dateKey = start.toISOString().split('T')[0];

    const ordersSnap = await db
      .collection('orders')
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();

    let totalOrders = 0;
    let revenue = 0;
    let cancelled = 0;
    let delivered = 0;
    const categoryRevenue: Record<string, number> = {};
    const productRevenue: Record<string, { count: number; revenue: number; nameEn: string }> = {};

    ordersSnap.forEach((doc) => {
      const order = doc.data();
      totalOrders += 1;
      if (order.status === 'cancelled') cancelled += 1;
      else if (order.status === 'delivered') delivered += 1;
      if (order.paymentStatus === 'paid' || order.paymentMethod === 'cod') {
        revenue += order.total ?? 0;
      }

      const items: any[] = order.items ?? [];
      items.forEach((item) => {
        const key = item.productId;
        if (!productRevenue[key]) {
          productRevenue[key] = { count: 0, revenue: 0, nameEn: item.nameEn ?? key };
        }
        productRevenue[key].count += item.quantity;
        productRevenue[key].revenue += item.lineTotal ?? 0;
      });
    });

    // Resolve category revenue via product lookup (1 batch read)
    const productIds = Object.keys(productRevenue);
    if (productIds.length) {
      const refs = productIds.map((id) => db.doc(`products/${id}`));
      const snaps = await db.getAll(...refs);
      snaps.forEach((snap) => {
        if (!snap.exists) return;
        const cat = snap.data()!.categoryId;
        if (!cat) return;
        categoryRevenue[cat] = (categoryRevenue[cat] ?? 0) + productRevenue[snap.id].revenue;
      });
    }

    const aov = totalOrders > 0 ? +(revenue / totalOrders).toFixed(2) : 0;

    const topProducts = Object.entries(productRevenue)
      .sort(([, a], [, b]) => b.revenue - a.revenue)
      .slice(0, 10)
      .map(([id, v]) => ({ productId: id, ...v }));

    await db.doc(`stats/${dateKey}`).set(
      {
        date: dateKey,
        totalOrders,
        revenue: +revenue.toFixed(2),
        deliveredToday: delivered,
        cancelledToday: cancelled,
        aov,
        categoryRevenue,
        topProducts,
        finalizedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    functions.logger.info(`Aggregated stats for ${dateKey}: ${totalOrders} orders, ${revenue} SAR`);
    return null;
  });
