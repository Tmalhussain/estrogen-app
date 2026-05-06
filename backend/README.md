# Estrogen Pharmacy — Backend

A small **Hono** server backed by **SQL** (SQLite for local dev, Postgres for production via Cloud SQL / Neon / Supabase) and **Drizzle ORM**. Authenticates customers by **phone-OTP over SMS** and optionally mints **Firebase custom tokens** so the same uid carries across Firebase Auth, Cloud Storage, FCM, and RTDB. External integrations (POS terminals, WMS, suppliers) hit the stock API with **API keys**.

The same code runs locally as `node` server and in production as a single **Cloud Function for Firebase**.

## What it serves

| Route | Auth | Purpose |
| --- | --- | --- |
| `POST /auth/send-otp` | none | Send a 6-digit code to a Saudi mobile (`+9665XXXXXXXX`). Rate-limited 5 sends / 15 min / phone. |
| `POST /auth/verify-otp` | none | Verify the code, create-or-find the user, return a JWT (+ optional Firebase custom token). |
| `POST /auth/signup` | none | Email + password sign-up (admin/staff). |
| `POST /auth/login` | none | Email + password login (admin/staff). |
| `GET /auth/me` | JWT | Return the current user. |
| `GET /products` | none | List products. Query: `category`, `q`, `rx=true`, `inStock=true`. |
| `GET /products/:id` | none | One product. |
| `GET /orders` | JWT | Caller's orders + items. |
| `GET /orders/:id` | JWT | One of caller's orders. |
| `POST /orders` | JWT | Place an order; decrements stock atomically. |
| `GET /api/stock` | `X-API-Key` (scope `stock:read`) | Stock by SKU. |
| `POST /api/stock/update` | `X-API-Key` (scope `stock:update`) | Apply stock deltas / absolutes in a single transaction. |

## Run it locally

```bash
cd backend
npm install
cp .env.example .env       # edit JWT_SECRET; leave SMS_PROVIDER=console
npm run db:generate        # generate a migration in src/db/migrations
npm run db:migrate         # apply migrations to data.db
npm run db:seed            # 9 products + admin@estrogen.sa + demo phone user
npm run dev                # listens on http://127.0.0.1:8787
```

## Local-dev test placeholders

Three placeholders make local iteration tap-tap fast. **All three are gated to local dev** (SQLite + `SMS_PROVIDER=console`) and have no effect in production.

| Placeholder | Value | When it works | Why |
|---|---|---|---|
| Dev OTP code | `000000` | `/auth/verify-otp` accepts this for ANY Saudi phone when `SMS_PROVIDER=console` | Skip log-grepping for the real code during iteration |
| Test API key | `estk_test_local_dev_only_DO_NOT_USE_IN_PROD` | Pre-seeded by `npm run db:seed` with both `stock:read` + `stock:update` scopes | Curl examples work without `npm run key:create` |
| Demo accounts | `admin@estrogen.sa` / `admin12345` (admin) and `+966500000000` (phone-only customer) | Created by `npm run db:seed` | One-key login during dev |

Quick login bypass:

```bash
# No /send-otp needed; dev bypass goes straight to verify
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"+966500000000","code":"000000"}' \
  http://127.0.0.1:8787/auth/verify-otp
# → { "token": "eyJ…", "isNewUser": false, "user": { … } }
```

The mobile app's `(auth)/phone` and `(auth)/verify` screens pre-fill these values when `__DEV__` is true (`expo start`), so the customer flow is: open app → tap "Send code" → tap "Verify" → home. A small `Dev mode — code 000000 verifies any phone` banner makes the bypass visible.

The bypass branch is dead code in production — `devBypassEnabled()` returns `false` when `SMS_PROVIDER` is anything other than `console`.

## SMS OTP signup flow

Customer flow — backend never holds plaintext codes (sha-256 hashed at rest), rate-limits sends, locks out after 5 wrong guesses.

```bash
# 1. Send the code (server logs it in console mode)
curl -s -X POST http://127.0.0.1:8787/auth/send-otp \
  -H 'Content-Type: application/json' \
  -d '{"phoneNumber":"0501234567"}'
# → { "ok": true, "expiresInSec": 300 }
# server log:
#   [sms:console] → +966****67
#     Estrogen Pharmacy: 658463 | إستروجين: رمز التحقق 658463

# 2. Verify the code. New users must include firstName.
curl -s -X POST http://127.0.0.1:8787/auth/verify-otp \
  -H 'Content-Type: application/json' \
  -d '{
    "phoneNumber":"+966501234567",
    "code":"658463",
    "firstName":"Sara"
  }'
# → {
#   "token": "eyJ…",                  ← our JWT, used as Authorization: Bearer
#   "firebaseCustomToken": null,       ← present when Firebase Admin is wired
#   "isNewUser": true,
#   "user": { "id":"…", "phoneNumber":"+966501234567", "firstName":"Sara", … }
# }
```

The phone is normalized server-side, so any of `0501234567`, `501234567`, `+966 50 123 4567`, `00966501234567` end up as `+966501234567`.

### Switching to real SMS

Set in `.env`:

```bash
SMS_PROVIDER=unifonic
UNIFONIC_APP_SID=...
UNIFONIC_SENDER_ID=Estrogen     # CITC-approved sender ID
UNIFONIC_API_URL=https://api.unifonic.com/rest/SMS/messages
```

Unifonic is the proven KSA SMS provider (~5s delivery, branded sender). The provider abstraction in [src/lib/sms.ts](src/lib/sms.ts) makes adding Twilio / MessageBird / etc. a one-file change.

## Firebase Auth bridge (optional)

When the server-side Firebase Admin SDK is configured, `verify-otp` ALSO returns a Firebase custom token. The mobile client signs in with `signInWithCustomToken(...)` so:

- Our Postgres `users.id` UUID == Firebase Auth UID
- The same UID flows into FCM device tokens, Cloud Storage rules, RTDB, etc.
- The mobile app keeps using OUR JWT for our REST API; Firebase ID token is a *bonus* identity for the rest of the GCP surface

Setup:

1. Create a Firebase project, enable Authentication.
2. In Firebase Console → Project Settings → Service Accounts → Generate new private key. Save the JSON.
3. Set in `backend/.env`:
   ```
   FIREBASE_PROJECT_ID=estrogen-pharmacy-prod
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@estrogen-pharmacy-prod.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
4. On the mobile side, set the public Firebase config in `mobile/.env.local`:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=estrogen-pharmacy-prod.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=estrogen-pharmacy-prod
   EXPO_PUBLIC_FIREBASE_APP_ID=1:...:web:...
   ```

If the env vars aren't set, the rest of the app works fine — `firebaseCustomToken` comes back `null` and we just use our JWT.

## Postgres in production

The Drizzle schema is dialect-agnostic. To run on Postgres:

```bash
# Spin up Cloud SQL Postgres (or Neon, Supabase, Render…) and grab the URL.
DATABASE_URL=postgres://user:pass@host:5432/estrogen \
  npx drizzle-kit generate --dialect=postgresql

DATABASE_URL=postgres://... npm run db:migrate
DATABASE_URL=postgres://... npm run db:seed
```

`src/db/index.ts` switches drivers on the URL prefix automatically — no code changes.

For Cloud SQL specifically:

```bash
gcloud sql instances create estrogen-prod \
  --database-version=POSTGRES_16 --region=me-central2 --tier=db-g1-small
gcloud sql databases create estrogen --instance=estrogen-prod
gcloud sql users create estrogen --instance=estrogen-prod --password=...
# In Cloud Functions, mount the connector with --add-cloudsql-instances=...
```

## Deploy as a Cloud Function

The same Hono app runs unchanged inside a Cloud Function via [src/cloudFunction.ts](src/cloudFunction.ts).

```bash
cp .firebaserc.example .firebaserc          # edit project id
firebase login
firebase functions:secrets:set JWT_SECRET
firebase functions:secrets:set DATABASE_URL # postgres://...
firebase functions:secrets:set UNIFONIC_APP_SID
firebase deploy --only functions
```

Region defaults to `me-central2` (Doha) — closest GCP region to KSA. Adjust in `cloudFunction.ts` if you'd rather pin elsewhere.

## API key system

Keys are sha-256 hashed at rest. The plaintext is shown **once** at creation time and can never be recovered after that.

```bash
npm run key:create -- --label="POS terminal #1" --scopes=stock:read,stock:update
# → estk_WbjicSraesaxnMcbS2wReMiZLllLqkTe
```

```bash
KEY=estk_xxx

# List stock
curl http://127.0.0.1:8787/api/stock -H "X-API-Key: $KEY"

# Sell 3 units of a SKU
curl -X POST http://127.0.0.1:8787/api/stock/update \
  -H "X-API-Key: $KEY" \
  -H 'Content-Type: application/json' \
  -d '{"updates":[{"sku":"EST-FOL-5MG-60","delta":-3,"note":"sold via POS"}]}'

# Restock to an absolute count
curl -X POST http://127.0.0.1:8787/api/stock/update \
  -H "X-API-Key: $KEY" \
  -H 'Content-Type: application/json' \
  -d '{"updates":[{"sku":"EST-VITD3-5K-90","absolute":50,"note":"weekly restock"}]}'

# Batch up to 1000 lines per call. Whole batch rolls back on any failure.
curl -X POST http://127.0.0.1:8787/api/stock/update \
  -H "X-API-Key: $KEY" -H 'Content-Type: application/json' \
  -d '{"updates":[
    {"sku":"EST-FOL-5MG-60","delta":-1},
    {"sku":"EST-PARA-500-24","delta":-12},
    {"productId":"<uuid>","absolute":0}
  ]}'
```

Every successful update writes a row to `stock_movements` with the delta, the resulting stock, the source (`api`), and the API key id — so you can audit any change.

## Schema

```
users           id, phone_number?, phone_verified_at?, email?, password_hash?, first_name,
                last_name, role (customer|pharmacist|admin), firebase_uid?, created_at, updated_at
otp_attempts    id, phone_number, code_hash, verify_attempts, verified_at?, expires_at, ip?, created_at
products        id, sku?, name, name_ar, brand, category, price, old_price?, stock_count, in_stock,
                rx_required, pregnancy_safe, ratings, tags(json), description, pharmacist_note?, …
orders          id, user_id, status, subtotal, delivery_fee, vat, total, address, delivery_option,
                payment_method, notes?, placed_at, updated_at
order_items     id, order_id, product_id, quantity, price_at_order
api_keys        id, label, key_prefix, key_hash, scopes(json), last_used_at?, revoked_at?, created_at
stock_movements id, product_id, delta, after_stock, source (api|admin|order_placed|…),
                api_key_id?, note?, created_at
```

Every stock-mutating write inside `POST /orders` and `POST /api/stock/update` goes through a Drizzle transaction that updates `products.stock_count` and writes a matching `stock_movements` row in the same atomic step.

## Production checklist

This is a real foundation, not yet hardened. Before exposing it:

- Move every secret to Firebase secrets / Secret Manager.
- Switch from local SQLite to Cloud SQL Postgres (instructions above).
- Put real SMS via Unifonic and rotate the key on suspicion.
- Add a structured request logger (pino) and a Cloud Logging sink.
- Add rate limiting middleware in front of `/auth/*` and `/api/stock/update`. The OTP send-otp route already rate-limits per phone; consider an IP layer too.
- Add `revokedAt` UI in the admin (right now keys are revoked by setting that column directly via SQL).
- Run `firebase deploy --only functions` from CI on `main`.
- For the mobile app, set `EXPO_PUBLIC_API_URL=https://<your-cloud-fn-url>` so released builds talk to production.
