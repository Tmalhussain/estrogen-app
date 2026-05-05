/**
 * Scheduled POS sync — runs every 5 minutes to pull stock and
 * price updates from the in-store POS. The POS exposes a JSON
 * endpoint listing the SKUs that changed since the last sync;
 * we apply those deltas to Firestore in batched writes.
 *
 * The POS endpoint URL and bearer token are stored in functions
 * secrets:
 *   firebase functions:secrets:set POS_API_URL
 *   firebase functions:secrets:set POS_API_TOKEN
 *
 * If POS sync isn't ready yet, the function logs a warning and
 * exits gracefully.
 *
 * Last-sync watermark is kept at sync/posSync.lastSyncedAt.
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';

interface PosItem {
  sku: string;
  productId: string;
  stockCount: number;
  price?: number;
  salePrice?: number | null;
}

export const posSync = functions
  .region(REGION)
  .runWith({ secrets: ['POS_API_URL', 'POS_API_TOKEN'], timeoutSeconds: 240 })
  .pubsub.schedule('every 5 minutes')
  .onRun(async () => {
    const apiUrl = process.env.POS_API_URL;
    const token = process.env.POS_API_TOKEN;
    if (!apiUrl || !token) {
      functions.logger.warn('POS sync skipped: secrets not configured');
      return null;
    }

    const watermarkRef = db.doc('sync/posSync');
    const watermarkSnap = await watermarkRef.get();
    const since = watermarkSnap.data()?.lastSyncedAt?.toDate?.() ?? new Date(0);

    const url = `${apiUrl}/changes?since=${since.toISOString()}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!res.ok) {
      functions.logger.error(`POS sync failed: ${res.status} ${await res.text()}`);
      return null;
    }

    const payload = await res.json() as { items: PosItem[]; serverTime: string };
    const items = payload.items ?? [];

    if (items.length === 0) {
      await watermarkRef.set(
        { lastSyncedAt: FieldValue.serverTimestamp(), lastChangeCount: 0 },
        { merge: true }
      );
      return null;
    }

    // Firestore batch limit is 500; chunk if needed.
    const CHUNK = 400;
    for (let i = 0; i < items.length; i += CHUNK) {
      const batch = db.batch();
      const chunk = items.slice(i, i + CHUNK);
      for (const item of chunk) {
        const ref = db.doc(`products/${item.productId}`);
        const update: Record<string, unknown> = {
          stockCount: item.stockCount,
          inStock: item.stockCount > 0,
          posSku: item.sku,
          posLastSyncedAt: FieldValue.serverTimestamp(),
        };
        if (typeof item.price === 'number') update.price = item.price;
        if (item.salePrice !== undefined) update.salePrice = item.salePrice;
        batch.set(ref, update, { merge: true });
      }
      await batch.commit();
    }

    await watermarkRef.set(
      {
        lastSyncedAt: FieldValue.serverTimestamp(),
        lastChangeCount: items.length,
        serverTime: payload.serverTime ?? null,
      },
      { merge: true }
    );

    functions.logger.info(`POS sync applied ${items.length} updates`);
    return null;
  });
