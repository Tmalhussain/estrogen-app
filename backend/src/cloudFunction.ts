/**
 * Cloud Functions for Firebase entry point.
 *
 * Wraps the same Hono app the local server runs and exposes it as one
 * HTTPS-callable function `api`. To deploy:
 *
 *   1. cd backend
 *   2. cp .firebaserc.example .firebaserc and edit the project id
 *   3. firebase login
 *   4. firebase deploy --only functions
 *
 * Set runtime env via:
 *   firebase functions:secrets:set JWT_SECRET
 *   firebase functions:secrets:set UNIFONIC_APP_SID
 *   firebase functions:secrets:set DATABASE_URL    # postgres://...
 *
 * The function is region-pinned to the closest GCP region for KSA users.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { app } from './app.ts';

export const api = onRequest(
  {
    region: 'me-central2',
    memory: '512MiB',
    cpu: 1,
    minInstances: 0,
    maxInstances: 50,
    secrets: ['JWT_SECRET', 'UNIFONIC_APP_SID', 'UNIFONIC_SENDER_ID', 'DATABASE_URL'],
  },
  // Hono's app.fetch is a standard (req, res) → Response handler that
  // works with onRequest's Express-compatible signature via toNodeListener.
  async (req, res) => {
    const fetchRequest = new Request(
      `https://${req.headers.host}${req.originalUrl ?? req.url}`,
      {
        method: req.method,
        headers: req.headers as Record<string, string>,
        body:
          req.method === 'GET' || req.method === 'HEAD'
            ? undefined
            : JSON.stringify(req.body ?? {}),
      }
    );
    const response = await app.fetch(fetchRequest);
    res.status(response.status);
    response.headers.forEach((v, k) => res.setHeader(k, v));
    const body = await response.text();
    res.send(body);
  }
);
