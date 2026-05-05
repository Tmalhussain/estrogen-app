/**
 * Payments — Moyasar integration.
 *
 * - initiatePayment (callable): server-side creates a Moyasar
 *   payment session for an existing order; returns the
 *   transaction URL the client redirects to.
 * - moyasarWebhook (HTTP): Moyasar POSTs payment events here;
 *   we verify the secret token, find the order, and update its
 *   payment status. Stock decrement already happened at order
 *   placement; this is purely the financial state.
 *
 * Set the secret keys via:
 *   firebase functions:secrets:set MOYASAR_SECRET_KEY
 *   firebase functions:secrets:set MOYASAR_WEBHOOK_TOKEN
 *
 * Both are read at runtime via process.env (declared with `secrets: [...]`).
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';

const MOYASAR_API = 'https://api.moyasar.com/v1/payments';

interface InitiatePaymentInput {
  orderId: string;
  source: {
    type: 'creditcard' | 'mada' | 'applepay' | 'stcpay';
    name?: string;
    number?: string;
    cvc?: string;
    month?: string;
    year?: string;
    token?: string;
  };
  callbackUrl: string;
}

export const initiatePayment = functions
  .region(REGION)
  .runWith({ secrets: ['MOYASAR_SECRET_KEY'] })
  .https.onCall(async (data: InitiatePaymentInput, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }
    if (!data.orderId || !data.source || !data.callbackUrl) {
      throw new functions.https.HttpsError('invalid-argument', 'orderId, source, callbackUrl required');
    }

    const orderRef = db.doc(`orders/${data.orderId}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }
    const order = orderSnap.data()!;
    if (order.userId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not your order');
    }
    if (order.paymentStatus === 'paid') {
      throw new functions.https.HttpsError('failed-precondition', 'Order already paid');
    }

    const secret = process.env.MOYASAR_SECRET_KEY;
    if (!secret) {
      throw new functions.https.HttpsError('failed-precondition', 'Payment provider not configured');
    }

    const amountHalalas = Math.round(order.total * 100);

    const body = {
      amount: amountHalalas,
      currency: 'SAR',
      description: `Order ${data.orderId}`,
      callback_url: data.callbackUrl,
      source: data.source,
      metadata: {
        orderId: data.orderId,
        userId: context.auth.uid,
      },
    };

    const res = await fetch(MOYASAR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${secret}:`).toString('base64')}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      functions.logger.error(`Moyasar error ${res.status}: ${errText}`);
      throw new functions.https.HttpsError('internal', 'Payment initiation failed');
    }

    const payment = await res.json() as { id: string; status: string; source?: { transaction_url?: string } };

    await orderRef.update({
      paymentId: payment.id,
      paymentStatus: payment.status,
      paymentInitiatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      paymentId: payment.id,
      status: payment.status,
      transactionUrl: payment.source?.transaction_url ?? null,
    };
  });

/**
 * HTTP webhook from Moyasar. Configure in Moyasar dashboard with
 * the URL: https://<region>-<project>.cloudfunctions.net/moyasarWebhook
 * and a secret token that we verify on every request.
 */
export const moyasarWebhook = functions
  .region(REGION)
  .runWith({ secrets: ['MOYASAR_WEBHOOK_TOKEN'] })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    const expected = process.env.MOYASAR_WEBHOOK_TOKEN;
    const provided = req.header('X-Moyasar-Token') || req.body?.secret_token;
    if (!expected || provided !== expected) {
      functions.logger.warn('Webhook rejected: bad token');
      res.status(401).send('Unauthorized');
      return;
    }

    const event = req.body;
    const payment = event?.data;
    const orderId = payment?.metadata?.orderId;

    if (!orderId) {
      functions.logger.warn('Webhook missing orderId metadata', { event });
      res.status(400).send('Missing orderId');
      return;
    }

    const orderRef = db.doc(`orders/${orderId}`);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      res.status(404).send('Order not found');
      return;
    }

    const updates: Record<string, unknown> = {
      paymentStatus: payment.status,
      paymentEvent: event.type,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (payment.status === 'paid') {
      updates.paidAt = FieldValue.serverTimestamp();
      // Move order from placed → pending_review (non-Rx) so packing can begin
      const order = orderSnap.data()!;
      if (order.status === 'placed') {
        updates.status = 'pending_review';
      }
    } else if (['failed', 'voided', 'refunded'].includes(payment.status)) {
      updates.status = 'cancelled';
      updates.cancellationReason = `payment_${payment.status}`;
    }

    await orderRef.update(updates);
    functions.logger.info(`Webhook applied to order ${orderId}: ${payment.status}`);
    res.status(200).send('OK');
  });
