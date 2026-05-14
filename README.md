# Estrogen Pharmacy

A women's pharmacy delivery platform for Saudi Arabia. Two pieces, one repo.

- **`mobile/`** — React Native + Expo SDK 56 app: phone-OTP signup, browse products, cart, checkout, order tracking, profile.
- **`backend/`** — Hono on Node, SQL via Drizzle ORM (SQLite for dev, **Postgres / Cloud SQL** in prod), optional **Firebase Admin** for custom tokens, and an API-key-protected `/api/stock/*` surface for POS / WMS / supplier integrations. The same Hono app runs unchanged inside a Firebase Cloud Function.

## Run the whole stack locally

```bash
# Terminal 1 — backend
cd backend
npm install
cp .env.example .env        # edit JWT_SECRET, leave SMS_PROVIDER=console for dev
npm run db:migrate
npm run db:seed             # 9 products + admin@estrogen.sa + a demo phone user
npm run dev                 # http://127.0.0.1:8787

# Terminal 2 — mobile
cd mobile
npm install
npm run web                 # http://127.0.0.1:8081
# or: npm run ios / npm run android
```

For physical devices, set `EXPO_PUBLIC_API_URL=http://<your-lan-ip>:8787` in `mobile/.env.local`. Neither `localhost` nor `10.0.2.2` reaches your laptop from a real phone.

## SMS OTP signup

The customer-facing flow:

1. **`/(auth)/phone`** — user enters `+966 5X XXX XXXX` (or `05…`, the backend normalizes both).
2. **Backend** generates a 6-digit code, stores its sha-256 hash, sends an SMS via Unifonic in production or logs to the server log in dev (`SMS_PROVIDER=console`).
3. **`/(auth)/verify`** — user enters the 6 digits. New users get a single "First name" prompt; returning users skip straight through. Auto-submits as soon as the 6th digit lands.
4. **Backend** finds-or-creates the user, marks them phone-verified, returns our JWT and (when Firebase Admin is configured) a Firebase custom token.
5. **Mobile** stores the JWT in iOS keychain / Android keystore and (if Firebase is wired) signs into Firebase Auth so the same UID flows into FCM, Cloud Storage, etc.

Rate limits live in the backend: 5 sends per phone per 15 minutes; 5 wrong guesses per OTP.

## Architecture at a glance

```
┌──────────── mobile/ (Expo SDK 56) ────────────┐
│                                                │
│  (auth)/phone  →  POST /auth/send-otp          │
│  (auth)/verify →  POST /auth/verify-otp        │
│                       ↓                        │
│   AuthContext stores OUR JWT + signs into      │
│   Firebase Auth with the custom token          │
│                                                │
└──────────────────────┬─────────────────────────┘
                       │  Bearer JWT
                       ▼
┌─── backend/ Hono server (or Cloud Function) ──┐
│                                                │
│   /auth/* /products /orders /api/stock/*       │
│              ↓                                 │
│   Drizzle ORM ─────────────────┐               │
│              ↓                 │               │
│   SQLite (dev) | Postgres (prod, Cloud SQL)    │
│                                                │
│   firebase-admin (optional) ──→ Firebase Auth  │
│   smsProvider (console | unifonic) ──→ SMS     │
│                                                │
└────────────────────────────────────────────────┘
```

## Quick test of the stock API

`npm run db:seed` pre-creates a deterministic test API key so you can curl right away:

```bash
KEY=estk_test_local_dev_only_DO_NOT_USE_IN_PROD

curl http://127.0.0.1:8787/api/stock -H "X-API-Key: $KEY"

curl -X POST http://127.0.0.1:8787/api/stock/update \
  -H "X-API-Key: $KEY" -H 'Content-Type: application/json' \
  -d '{"updates":[{"sku":"EST-FOL-5MG-60","delta":-3,"note":"sold via POS"}]}'
```

To mint a real key (for staging or sharing with a partner):

```bash
cd backend
npm run key:create -- --label="POS terminal #1" --scopes=stock:read,stock:update
```

Full curl cookbook + Cloud SQL setup + Cloud Functions deploy in [backend/README.md](backend/README.md).

## Local-dev placeholders (tap-tap login)

For fast iteration, three placeholders are pre-baked. **All gated to local dev** — production with Unifonic + Cloud SQL ignores them entirely.

- **Dev OTP code `000000`** verifies any Saudi phone when `SMS_PROVIDER=console`
- **Test API key** `estk_test_local_dev_only_DO_NOT_USE_IN_PROD` (seeded with `stock:read` + `stock:update`)
- **Demo accounts**: `admin@estrogen.sa` / `admin12345` (email login) and `+966500000000` (phone OTP)

The mobile app pre-fills the phone field with `0500000000` and the verify code with `000000` in `__DEV__`, so opening the app on `npm run web` and tapping through both screens lands you on Home. A subtle warning banner makes the bypass visible.

## Brand

The visual system is sampled directly from [logo.jpeg](logo.jpeg):

- **Primary magenta** `#B02080` — geometric frame
- **Deep purple** `#702070` — wordmark
- **Blush pink** `#D080A0` — silhouette accents

App icon, adaptive icon, splash screen, and favicon are all generated from that source file into [mobile/assets/images/](mobile/assets/images/).

## Mobile — what's there

- **(auth)/phone + (auth)/verify** — phone-OTP signup/login, JWT stored in iOS keychain / Android keystore, optional Firebase Auth bridge
- **(tabs)** — Home, Shop, Cart, Orders, Profile, gated behind auth
- **product/[id]** — gallery, ratings, pregnancy-safe / Rx tags, pharmacist note, quantity stepper at 44px touch targets
- **checkout** — address picker, delivery options, four payment methods, order summary
- **order/[id]** — live tracking timeline, driver card, full receipt

DM Sans + Tajawal across body and headings. Tabular-nums on every money/phone field.

## Backend — what's there

- **Schema:** `users` (phone-first identity), `otp_attempts`, `products`, `orders`, `order_items`, `api_keys`, `stock_movements`
- **OTP flow:** sha-256 hashed codes, 5-min TTL, 5-send rate limit per phone per 15 min, 5 wrong guesses lock out
- **Order placement** decrements stock and writes a `stock_movements` row in the same Drizzle transaction
- **API keys** are sha-256 hashed, scoped (`stock:read`, `stock:update`), revocable; every request touches `last_used_at`
- **Same code, two runtimes:** plain Node server (`npm run dev`) for local dev, Cloud Function (`firebase deploy --only functions`) for production
- **Same code, two databases:** SQLite for local dev, Postgres for production via env (`DATABASE_URL=postgres://…`)

## Project layout

```
.
├── README.md
├── logo.jpeg                  # brand source
├── logo.png                   # background-removed PNG (used in-app)
├── mobile/                    # Expo SDK 56 app
│   ├── app/
│   │   ├── (auth)/            # phone.tsx, verify.tsx
│   │   ├── (tabs)/            # index, shop, cart, orders, profile
│   │   ├── product/[id].tsx
│   │   ├── order/[id].tsx
│   │   ├── checkout.tsx
│   │   └── _layout.tsx        # auth-gated stack
│   ├── components/            # Logo, Button, ProductCard, QuantityStepper, …
│   ├── constants/theme.ts     # tokens (palette, spacing, type, shadow)
│   ├── data/                  # placeholder products + orders (until mobile reads from backend)
│   ├── hooks/
│   │   ├── useAuth.tsx        # auth context: sendOtp, verifyOtp, signOut
│   │   └── useCart.tsx
│   └── lib/
│       ├── api.ts             # backend HTTP client
│       ├── firebase.ts        # optional Firebase JS SDK init + signInWithCustomToken
│       └── storage.ts         # SecureStore wrapper for the session token
└── backend/
    ├── src/
    │   ├── app.ts             # Hono app (route mounting)
    │   ├── server.ts          # local Node server entry
    │   ├── cloudFunction.ts   # Cloud Functions for Firebase entry
    │   ├── db/
    │   │   ├── schema.ts      # Drizzle schema (SQLite + Postgres)
    │   │   ├── index.ts       # driver selection by DATABASE_URL
    │   │   └── migrations/    # Drizzle-generated SQL
    │   ├── lib/               # passwords, jwt, api-key, sms, firebase-admin, otp, phone
    │   ├── middleware/        # requireAuth, requireApiKey
    │   └── routes/            # auth, otp, products, orders, stock
    ├── scripts/               # migrate.ts, seed.ts, create-api-key.ts
    ├── firebase.json
    ├── .firebaserc.example
    └── README.md              # full curl cookbook + deploy paths
```

## Type check

```bash
( cd mobile && npm run tsc )
( cd backend && npm run tsc )
```
