/**
 * Scheduled catalog sync — runs daily at 04:00 Asia/Riyadh and
 * pulls the existing online product catalog into Firestore. Each
 * product doc is upserted at `products/{id}` with `branchId: 'main'`
 * enforced via `withBranch()` so v2 multi-store rollout stays safe.
 *
 * The catalog API URL is read from runtime config:
 *   firebase functions:config:set catalog.api_url="https://..."
 *
 * If the URL isn't configured (and we're not running in the
 * emulator), the function logs a warning and exits — it does NOT
 * throw, so the cron stays healthy until the team wires the real
 * endpoint.
 *
 * Assumed catalog payload shape (top-level array of products):
 *   [
 *     {
 *       "id": "p_001",            // string, used as Firestore doc id
 *       "name": "Panadol 500mg",  // English name
 *       "nameAr": "بنادول ٥٠٠ ملغ",
 *       "price": 12.5,            // SAR, number
 *       "inStock": true,          // boolean
 *       "lifeStageTags": [        // optional, e.g. ["pregnancy"]
 *         "general"
 *       ]
 *     },
 *     ...
 *   ]
 *
 * If the existing online catalog uses a different shape (e.g.
 * snake_case fields, wrapped in `{ products: [...] }`, different
 * id key), the team adjusts the mapping inside `mapToProduct()`
 * — that is the single point of contact for the upstream contract.
 *
 * Last-sync watermark is kept at `sync/catalogSync` for diagnostics.
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';
import { withBranch, DEFAULT_BRANCH_ID } from '../lib/branchGuard';

interface CatalogItem {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  inStock: boolean;
  lifeStageTags?: string[];
}

interface MappedProduct {
  id: string;
  data: Record<string, unknown>;
}

const BATCH_SIZE = 500;

/**
 * Map a raw catalog entry into the Firestore product shape.
 * Returns null and logs a reason if the entry is malformed —
 * caller increments error count.
 */
function mapToProduct(raw: unknown): MappedProduct | { error: string } {
  if (!raw || typeof raw !== 'object') {
    return { error: 'entry is not an object' };
  }
  const item = raw as Partial<CatalogItem>;

  if (typeof item.id !== 'string' || item.id.length === 0) {
    return { error: 'missing or invalid id' };
  }
  if (typeof item.name !== 'string') {
    return { error: `product ${item.id}: missing name` };
  }
  if (typeof item.nameAr !== 'string') {
    return { error: `product ${item.id}: missing nameAr` };
  }
  if (typeof item.price !== 'number' || Number.isNaN(item.price)) {
    return { error: `product ${item.id}: invalid price` };
  }
  if (typeof item.inStock !== 'boolean') {
    return { error: `product ${item.id}: invalid inStock` };
  }

  const data: Record<string, unknown> = {
    name: item.name,
    nameAr: item.nameAr,
    price: item.price,
    inStock: item.inStock,
    catalogLastSyncedAt: FieldValue.serverTimestamp(),
  };

  if (Array.isArray(item.lifeStageTags)) {
    data.lifeStageTags = item.lifeStageTags.filter((t) => typeof t === 'string');
  }

  return { id: item.id, data };
}

export const catalogSync = functions
  .region(REGION)
  .runWith({ timeoutSeconds: 300 })
  .pubsub.schedule('0 4 * * *')
  .timeZone('Asia/Riyadh')
  .onRun(async () => {
    const apiUrl = functions.config().catalog?.api_url as string | undefined;
    const isEmulator = !!process.env.FUNCTIONS_EMULATOR;

    if (!apiUrl) {
      if (isEmulator) {
        functions.logger.info('catalogSync: no api_url configured (emulator), skipping');
      } else {
        functions.logger.warn(
          'catalogSync skipped: functions.config().catalog.api_url not set'
        );
      }
      return null;
    }

    let rawItems: unknown[] = [];
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) {
        functions.logger.error(
          `catalogSync fetch failed: ${res.status} ${res.statusText}`
        );
        return null;
      }
      const payload = (await res.json()) as unknown;
      if (Array.isArray(payload)) {
        rawItems = payload;
      } else if (
        payload &&
        typeof payload === 'object' &&
        Array.isArray((payload as { products?: unknown }).products)
      ) {
        // Tolerate `{ products: [...] }` envelope.
        rawItems = (payload as { products: unknown[] }).products;
      } else {
        functions.logger.error(
          'catalogSync: unexpected payload shape (expected array or { products: [...] })'
        );
        return null;
      }
    } catch (err) {
      functions.logger.error('catalogSync fetch error', err);
      return null;
    }

    const fetched = rawItems.length;
    let upserted = 0;
    let errored = 0;

    // Validate + map each item, bucketing into upsertable products.
    const products: MappedProduct[] = [];
    for (const raw of rawItems) {
      const result = mapToProduct(raw);
      if ('error' in result) {
        errored += 1;
        functions.logger.warn(`catalogSync skipped item: ${result.error}`);
        continue;
      }
      products.push(result);
    }

    // Pre-read existing docs in chunks so we only set createdAt for new docs.
    // Firestore getAll has no documented hard limit but we chunk at BATCH_SIZE
    // to keep memory bounded and stay symmetrical with the write batches.
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const chunk = products.slice(i, i + BATCH_SIZE);
      const refs = chunk.map((p) => db.doc(`products/${p.id}`));

      let existing: FirebaseFirestore.DocumentSnapshot[] = [];
      try {
        existing = await db.getAll(...refs);
      } catch (err) {
        // If the read fails, fall back to merge-only writes (no createdAt).
        functions.logger.warn(
          `catalogSync: pre-read failed for chunk starting at ${i}, continuing with merge-only writes`,
          err
        );
        existing = [];
      }
      const existsById = new Map<string, boolean>();
      existing.forEach((snap) => existsById.set(snap.id, snap.exists));

      const batch = db.batch();
      for (const p of chunk) {
        const docData: Record<string, unknown> = {
          ...p.data,
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (existsById.get(p.id) === false) {
          docData.createdAt = FieldValue.serverTimestamp();
        }
        // Enforce branchId via the shared guard helper.
        const scoped = withBranch(docData, DEFAULT_BRANCH_ID);
        batch.set(db.doc(`products/${p.id}`), scoped, { merge: true });
      }

      try {
        await batch.commit();
        upserted += chunk.length;
      } catch (err) {
        errored += chunk.length;
        functions.logger.error(
          `catalogSync batch commit failed (chunk starting at ${i}, ${chunk.length} items)`,
          err
        );
        // Continue with the next batch.
      }
    }

    try {
      await db.doc('sync/catalogSync').set(
        {
          lastSyncedAt: FieldValue.serverTimestamp(),
          fetched,
          upserted,
          errored,
        },
        { merge: true }
      );
    } catch (err) {
      functions.logger.warn('catalogSync: failed to write watermark', err);
    }

    functions.logger.info(
      `catalogSync run: fetched=${fetched} upserted=${upserted} errored=${errored}`
    );
    return null;
  });
