# Estrogen Pharmacy — Backend

A small **Hono + Bun-friendly Node** server backed by **SQLite + Drizzle ORM**, with **JWT auth** for the mobile app and **API-key auth** for external integrations (POS terminals, WMS, suppliers) that need to update stock.

## What it serves

| Route | Auth | Purpose |
| --- | --- | --- |
| `POST /auth/signup` | none | Create user + return JWT |
| `POST /auth/login` | none | Verify credentials + return JWT |
| `GET /auth/me` | JWT | Return current user |
| `GET /products` | none | List products. Query: `category`, `q`, `rx=true`, `inStock=true` |
| `GET /products/:id` | none | One product |
| `GET /orders` | JWT | Caller's orders + items |
| `GET /orders/:id` | JWT | One of caller's orders |
| `POST /orders` | JWT | Place an order, decrement stock atomically |
| `GET /api/stock` | `X-API-Key` (scope `stock:read`) | Stock by SKU |
| `POST /api/stock/update` | `X-API-Key` (scope `stock:update`) | Apply stock deltas / absolutes in a single transaction |

## Run it

```bash
cd backend
npm install
cp .env.example .env       # edit JWT_SECRET before exposing the server
npm run db:generate        # creates a migration in src/db/migrations
npm run db:migrate         # applies migrations to data.db
npm run db:seed            # inserts 9 sample products + a demo user
npm run dev                # listens on http://127.0.0.1:8787
```

Demo credentials: `demo@estrogen.sa` / `demo12345`. The seed is idempotent.

## API key system

Keys are sha-256 hashed at rest. The plaintext is shown **once** at creation time and can never be recovered after that.

```bash
npm run key:create -- --label="POS terminal #1" --scopes=stock:read,stock:update
# → estk_WbjicSraesaxnMcbS2wReMiZLllLqkTe
```

Use the key as `X-API-Key`:

```bash
KEY=estk_xxx
# List stock
curl http://127.0.0.1:8787/api/stock -H "X-API-Key: $KEY"

# Sell 3 units of a SKU (negative delta)
curl -X POST http://127.0.0.1:8787/api/stock/update \
  -H "X-API-Key: $KEY" \
  -H 'Content-Type: application/json' \
  -d '{"updates":[{"sku":"EST-FOL-5MG-60","delta":-3,"note":"sold via POS"}]}'

# Restock to an absolute count
curl -X POST http://127.0.0.1:8787/api/stock/update \
  -H "X-API-Key: $KEY" \
  -H 'Content-Type: application/json' \
  -d '{"updates":[{"sku":"EST-VITD3-5K-90","absolute":50,"note":"weekly restock"}]}'

# Batch up to 1000 lines per call
curl -X POST http://127.0.0.1:8787/api/stock/update \
  -H "X-API-Key: $KEY" -H 'Content-Type: application/json' \
  -d '{"updates":[
    {"sku":"EST-FOL-5MG-60","delta":-1},
    {"sku":"EST-PARA-500-24","delta":-12},
    {"productId":"<uuid>","absolute":0}
  ]}'
```

Every successful update writes a row to `stock_movements` with the delta, the resulting stock, the source (`api`), and the API key id — so you can audit any change. If any line in a batch fails (unknown product, would-go-negative, missing field) the whole batch rolls back.

### Auth flow

```bash
# Sign up
curl -X POST http://127.0.0.1:8787/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{"email":"sara@example.com","password":"hunter2hunter2","firstName":"Sara"}'
# → { "token": "eyJ...", "user": { ... } }

# Or log in
TOKEN=$(curl -s -X POST http://127.0.0.1:8787/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@estrogen.sa","password":"demo12345"}' \
  | jq -r .token)

# Place an order (decrements stock, computes VAT, records stock_movements)
curl -X POST http://127.0.0.1:8787/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "items":[{"productId":"<uuid>","quantity":2}],
    "address":"Building 12, Olaya Street, Riyadh",
    "deliveryOption":"standard",
    "paymentMethod":"mada"
  }'
```

## Schema

```
users           id, email, password_hash, first_name, last_name, phone, role, created_at, updated_at
products        id, sku, name, name_ar, brand, category, price, old_price, stock_count, in_stock,
                rx_required, pregnancy_safe, ratings, tags(json), description, pharmacist_note, …
orders          id, user_id, status (placed|preparing|out_for_delivery|delivered|cancelled),
                subtotal, delivery_fee, vat, total, address, delivery_option, payment_method, notes
order_items     id, order_id, product_id, quantity, price_at_order
api_keys        id, label, key_prefix, key_hash, scopes(json), last_used_at, revoked_at, created_at
stock_movements id, product_id, delta, after_stock, source (api|admin|order_placed|…), api_key_id, note
```

`stock_count` and `in_stock` are kept consistent: every write that changes stock writes one `stock_movements` row in the same transaction.

## Production notes

This is a foundation, not a hardened production server. Before exposing it:

- Move `JWT_SECRET` out of `.env` into a real secret manager.
- Switch from local SQLite to Postgres (Drizzle handles both). Run `drizzle-kit push --dialect=postgresql` against your Postgres URL.
- Put the server behind HTTPS and a reverse proxy (Caddy or fly-proxy).
- Add rate limiting on `/auth/login` and `/api/stock/update`.
- Add `revokedAt` UI in the admin (right now keys are revoked by setting that column directly via SQL).
- Add a structured request logger; replace Hono's default logger with pino or similar.
- For the Saudi market, swap email-password auth for phone-OTP via Unifonic.
