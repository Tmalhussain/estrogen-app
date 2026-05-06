# Estrogen Pharmacy

A women's pharmacy delivery platform for Saudi Arabia. Two pieces:

- **`mobile/`** — React Native + Expo SDK 56 app: signup, login, browse products, cart, checkout, order tracking, profile.
- **`backend/`** — Hono + SQLite + Drizzle backend: JWT auth, orders, and an API-key-protected `/api/stock/*` surface for POS / WMS / supplier integrations.

## Run the whole stack locally

In one terminal — start the backend:

```bash
cd backend
npm install
npm run db:migrate    # creates ./data.db and applies the schema
npm run db:seed       # 9 products + demo@estrogen.sa / demo12345
npm run dev           # → http://127.0.0.1:8787
```

In another — start the mobile app:

```bash
cd mobile
npm install
npm run web           # browser preview on http://127.0.0.1:8081
# or: npm run ios / npm run android
```

The mobile app talks to `http://127.0.0.1:8787` by default. For physical devices set `EXPO_PUBLIC_API_URL=http://<your-lan-ip>:8787` in `mobile/.env.local` — neither `localhost` nor `10.0.2.2` reaches your laptop from a real phone.

## Quick test of the stock API

```bash
cd backend
npm run key:create -- --label="POS terminal #1" --scopes=stock:read,stock:update
# → estk_xxx (save this — it's not stored in plaintext)

KEY=estk_xxx
curl http://127.0.0.1:8787/api/stock -H "X-API-Key: $KEY"

curl -X POST http://127.0.0.1:8787/api/stock/update \
  -H "X-API-Key: $KEY" -H 'Content-Type: application/json' \
  -d '{"updates":[{"sku":"EST-FOL-5MG-60","delta":-3,"note":"sold via POS"}]}'
```

Full curl cookbook lives in [backend/README.md](backend/README.md).

## Brand

The visual system is sampled directly from [logo.jpeg](logo.jpeg):

- **Primary magenta** `#B02080` — geometric frame
- **Deep purple** `#702070` — wordmark
- **Blush pink** `#D080A0` — silhouette accents

App icon, adaptive icon, splash screen, and favicon are all generated from that source file into [mobile/assets/images/](mobile/assets/images/).

## Mobile app — what's there

- **(auth)** — login + signup screens, JWT stored in iOS keychain / Android keystore (web localStorage)
- **(tabs)** — Home, Shop, Cart, Orders, Profile, gated behind auth
- **product/[id]** — gallery, ratings, pregnancy-safe / Rx tags, pharmacist note, quantity stepper
- **checkout** — address picker, delivery options, four payment methods, order summary
- **order/[id]** — live tracking timeline, driver card, full receipt

Body and display text use **DM Sans + Tajawal** (Arabic). Touch targets are 44px+ across interactive elements, prices and totals use tabular-nums.

## Backend — what's there

- `users`, `products`, `orders`, `order_items`, `api_keys`, `stock_movements`
- Order placement decrements stock and writes a `stock_movements` row in the same transaction
- API keys are sha-256 hashed at rest, scoped (`stock:read`, `stock:update`), revocable, and every authenticated call writes to `api_keys.last_used_at`
- Negative-stock attempts are 409 and roll the whole batch back

## Project layout

```
.
├── README.md                 # this file
├── logo.jpeg                 # brand source
├── logo.png                  # background-removed PNG (used in-app)
├── mobile/                   # Expo SDK 56 app
│   ├── app/                  # expo-router routes — (auth), (tabs), product, order, checkout
│   ├── components/           # Button, Pill, ProductCard, QuantityStepper, …
│   ├── constants/theme.ts    # palette + spacing + typography tokens
│   ├── data/                 # placeholder products + orders (still used until mobile reads from backend)
│   ├── hooks/useAuth.tsx     # auth context + token storage
│   ├── hooks/useCart.tsx     # cart context
│   ├── lib/api.ts            # backend HTTP client
│   └── lib/storage.ts        # SecureStore wrapper
└── backend/                  # Hono + SQLite + Drizzle
    ├── src/
    │   ├── server.ts         # Hono app + route mounting
    │   ├── db/schema.ts      # Drizzle schema
    │   ├── lib/              # passwords, jwt, api-key helpers
    │   ├── middleware/       # requireAuth, requireApiKey
    │   └── routes/           # auth, products, orders, stock
    ├── scripts/              # migrate.ts, seed.ts, create-api-key.ts
    └── README.md             # endpoint + curl cookbook
```

## Type check

```bash
( cd mobile && npm run tsc )
( cd backend && npm run tsc )
```
