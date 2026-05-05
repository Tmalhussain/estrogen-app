/**
 * Validate a promo code without applying it.
 * The mobile app calls this from the cart screen to show the
 * estimated discount before checkout.
 */

import * as functions from 'firebase-functions';
import { db, REGION } from '../lib/admin';

interface ValidatePromoInput {
  code: string;
  subtotal: number;
}

export const validatePromoCode = functions
  .region(REGION)
  .https.onCall(async (data: ValidatePromoInput, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    if (!data.code) {
      throw new functions.https.HttpsError('invalid-argument', 'code required');
    }

    const code = data.code.toUpperCase().trim();
    const snap = await db.doc(`promoCodes/${code}`).get();

    if (!snap.exists) {
      return { valid: false, reason: 'not_found' };
    }
    const p = snap.data()!;
    if (p.active === false) {
      return { valid: false, reason: 'inactive' };
    }
    if (p.expiresAt?.toMillis && p.expiresAt.toMillis() < Date.now()) {
      return { valid: false, reason: 'expired' };
    }
    if (p.minSubtotal && data.subtotal < p.minSubtotal) {
      return {
        valid: false,
        reason: 'min_subtotal',
        minSubtotal: p.minSubtotal,
      };
    }
    if (p.maxUses && p.usedCount && p.usedCount >= p.maxUses) {
      return { valid: false, reason: 'max_uses_reached' };
    }

    const subtotal = data.subtotal ?? 0;
    const discount =
      p.discountType === 'percent'
        ? +(subtotal * (p.value / 100)).toFixed(2)
        : Math.min(p.value, subtotal);

    return {
      valid: true,
      code,
      discountType: p.discountType,
      value: p.value,
      discount,
      labelAr: p.labelAr ?? '',
      labelEn: p.labelEn ?? '',
    };
  });
