/**
 * Scheduled function: hourly sweep of products with stock below
 * their reorder threshold. Writes a single notification per admin
 * with a digest of low-stock items.
 *
 * Threshold defaults to 10 if not set on the product.
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';

const DEFAULT_THRESHOLD = 10;

export const lowStockAlert = functions
  .region(REGION)
  .pubsub.schedule('every 60 minutes')
  .timeZone('Asia/Riyadh')
  .onRun(async () => {
    const productsSnap = await db
      .collection('products')
      .where('inStock', '==', true)
      .get();

    const lowStock: Array<{ id: string; nameEn: string; stockCount: number }> = [];

    productsSnap.forEach((doc) => {
      const p = doc.data();
      const threshold = p.reorderThreshold ?? DEFAULT_THRESHOLD;
      if ((p.stockCount ?? 0) <= threshold) {
        lowStock.push({
          id: doc.id,
          nameEn: p.nameEn ?? doc.id,
          stockCount: p.stockCount ?? 0,
        });
      }
    });

    if (lowStock.length === 0) {
      functions.logger.info('No low-stock items');
      return null;
    }

    const adminsSnap = await db.collection('users').where('role', '==', 'admin').get();
    if (adminsSnap.empty) return null;

    const summaryEn = lowStock
      .slice(0, 5)
      .map((p) => `${p.nameEn} (${p.stockCount})`)
      .join(', ');
    const titleEn = `${lowStock.length} item${lowStock.length === 1 ? '' : 's'} low on stock`;
    const titleAr = `${lowStock.length} منتج منخفض المخزون`;

    const batch = db.batch();
    adminsSnap.forEach((doc) => {
      const ref = db.collection('notifications').doc();
      batch.set(ref, {
        userId: doc.id,
        type: 'inventory',
        titleAr,
        titleEn,
        bodyAr: `يحتاج إعادة طلب: ${summaryEn}`,
        bodyEn: `Reorder needed: ${summaryEn}`,
        read: false,
        meta: { productIds: lowStock.map((p) => p.id) },
        timestamp: FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();

    functions.logger.info(`Low-stock alert: ${lowStock.length} items, ${adminsSnap.size} admins notified`);
    return null;
  });
