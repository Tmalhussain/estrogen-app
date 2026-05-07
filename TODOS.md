# TODOs

Deferred work, captured here so it doesn't fall through. Each entry has enough context for a future session (or a future me) to pick up cold.

## Backend — Operator's Cockpit foundation

These all came out of the 2026-05-07 `/plan-eng-review` of the admin design doc (`~/.gstack/projects/Estrogenpharmacyapp/mishari-import-full-app-design-20260507-133809.md`). The admin web frontend has been scaffolded against the existing public endpoints; these backend additions are what unblock the rest of its functionality.

### Rec 1A — Add `POST /staff/auth/login` (defense in depth)

**What:** Mirror `/auth/login` but reject `role==='customer'`. Identical body; identical response. Different endpoint so the audit log can distinguish staff logins from customer logins by URL.

**Why:** Today the admin web reuses `/auth/login`. A client-side check rejects customer credentials, but that's not defense in depth — anyone can call `/auth/login` from a script and get a valid customer JWT, then use it against any staff endpoint we add.

**Acceptance:** New route in `backend/src/routes/auth.ts` (or the new `staff.ts`); customer login attempt returns 403 `staff_only`; admin/pharmacist/owner login works as before; admin web `lib/api.ts` switches `/auth/login` → `/staff/auth/login`; client-side gate in `AuthContext.tsx` removed.

### Rec 2A — Audit middleware + `audit()` and `auditRead()` helpers

**What:** Implement the audit log. New table `audit_log` in [backend/src/db/schema.ts](backend/src/db/schema.ts). New module `backend/src/lib/audit.ts` exporting:
- `audit(tx, { action, entityType, entityId, before, after })` — write inside a Drizzle txn. Mutations must call this.
- `auditRead(actorId, { action, entityType, entityId, scope })` — fire-and-forget for reads. Read failures don't fail the response.
- A Hono middleware `attachAuditActor` that captures the JWT claims onto context.

**Why:** PDPL needs every customer-data write logged in a way that can't drift from the data state. Every customer-data read also logged. Without this, the "checking on consumers" feature creates a compliance hole.

**Schema additions:**
```ts
export const auditLog = sqliteTable('audit_log', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  actorUserId: text('actor_user_id').references(() => users.id),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  beforeJson: text('before_json'),
  afterJson: text('after_json'),
  ipAddr: text('ip_addr'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});
// indexes on (actor_user_id, created_at) and (entity_type, entity_id, created_at)
```

**Acceptance:** every staff mutating endpoint writes one audit row in the same txn as the data write. Every staff read of customer data writes one fire-and-forget row. Drizzle migration generated and applied. Seed script unaffected.

### Rec 3A — Replace `isOwner` boolean with `'owner'` in role enum

**What:** Drop the future `isOwner` boolean column entirely. Extend `users.role` enum from `'customer' | 'pharmacist' | 'admin'` → `'customer' | 'pharmacist' | 'admin' | 'owner'`. JWT `SessionClaims` typing updated. Mishari's user row gets `role: 'owner'`.

**Why:** One source of truth for role. Cleaner future RBAC. DRY.

**Acceptance:** schema enum updated; migration generated; JWT type updated; `verifySession` and `signSession` accept new role value; admin sidebar's role label maps `'owner'` → "Owner".

### Rec 4A — Architecture lockdown: never list-all customers

**What:** Add a "## Architecture lockdowns" section to [DESIGN.md](DESIGN.md) with this rule. Add the same as a code comment at the top of the staff customers route handler when it's built (`backend/src/routes/staff.ts`).

**Why:** Without an explicit lockdown, "show me all customers" looks reasonable to add later. PDPL violation if implemented.

**Acceptance:** rule documented in two places; future `/plan-eng-review` of any list-all proposal flags it as a P0 violation.

### Rec 5A — Decide and document the backend production host

**What:** Pick where the Hono backend runs in production. Three real options: Cloud Run (Saudi region), Fly.io (UAE region — needs PDPL legal sign-off), Saudi VPS. Document the choice in README.md plus the deploy command path. Add backend GitHub Actions workflow for CI.

**Why:** The admin SPA at `admin.estrogen.sa` cannot launch until the backend has a public URL. This is a launch blocker for the entire admin product, not just one feature.

**Acceptance:** decision recorded in README.md; backend deploys to chosen target; admin `vite.config.ts` proxy points to the production URL via env var; CORS configured if cross-origin.

### Rec 6A — Staff customer endpoints + audit on reads

**What:** New endpoints under `/staff/customers`:
- `GET /staff/customers?phone=X` (or `?email=` or `?orderId=`) → returns 0 or 1 customer; writes `customer.search` audit row with redacted query.
- `GET /staff/customers/:id` → returns customer profile; writes `customer.view` audit row.
- `GET /staff/customers/:id/medical` → returns medical profile; writes `customer.medical_profile_view` audit row.

**Why:** This is what unblocks the `Customers` page in the admin. PDPL requires the audit on reads.

**Acceptance:** all three endpoints exist; each writes an audit row via `auditRead()`; admin Customers page resolves a search; medical-profile modal opens with audit visible in the audit_log table.

### Rec 7A — Soft-delete columns + live-row query helpers

**What:** Add `deletedAt: integer({ mode: 'timestamp' })` to `users`, `products`, `orders`. Add helpers `liveUsers()`, `liveProducts()`, `liveOrders()` that wrap the base query with `WHERE deleted_at IS NULL`. Document in DESIGN.md: "Never query users/products/orders directly without using the live-row helper."

**Why:** Soft delete prevents catastrophic clicks. Helper enforces the WHERE clause so a future PR doesn't see ghost rows.

**Acceptance:** schema updated; helpers exist and are used by every existing query; lockdown rule in DESIGN.md.

### Rec 8A — Clarify staff JWT TTL

**What:** Update the design doc's auth section: "Staff JWT TTL is 8h. Idle timeout enforced client-side at 30 minutes (admin web auto-redirects to /login after 30 min of no activity). No refresh tokens in v1." Drop the spurious "12h" figure. Implement the 30-minute idle redirect in admin's `AuthContext`.

**Why:** Honest about what's built. Client-side idle timeout is real defense; refresh tokens are real engineering; conflate them and you ship neither.

**Acceptance:** design doc updated; admin `AuthContext` has an activity listener that triggers `signOut()` after 30 min idle.

---

## Backend — admin-completing endpoints

These don't come from the eng review; they're what the scaffolded admin frontend needs to actually transact.

### Staff product CRUD

**What:** `POST /staff/products`, `PATCH /staff/products/:id`, `DELETE /staff/products/:id` (soft-delete via `deletedAt`). Auth-required. Audit-logged via Rec 2A.

**Why:** The admin Catalog page renders a table and an edit drawer but cannot save. Until these exist, "adding real medicines" requires a code edit + redeploy.

### SFDA bulk-import CLI script

**What:** `backend/scripts/import-sfda.ts` reads `sfda-medications.xlsx` from the repo root and upserts products into the catalog (keyed on a stable SFDA ID column). Idempotent — running twice produces the same DB state.

**Why:** The May-7 design accepted this as "CLI not UI" for v1 (`/plan-eng-review` scope reduction 2). Mishari's homework before this can run: download the SFDA medication-list Excel.

**Acceptance:** `npm run import:sfda` from `backend/` populates products; running it twice doesn't duplicate; idempotency keyed on `sfda_id`.

### Staff orders endpoint

**What:** `GET /staff/orders` returning all orders (paginated by date, default last 7 days), with customer name/phone joined. Optional `?status=...` filter.

**Why:** The admin Today page shows the live orders queue. Currently it falls back to `/orders` (which is user-scoped to the admin's own orders — empty in practice).

### Staff prescription queue + approve/reject

**What:**
- `GET /staff/prescriptions/pending` returns the unreviewed Rx queue with image URLs.
- `POST /staff/prescriptions/:id/approve` records `approvedBy = caller.userId`, `approvedAt = now()`. Unlocks the customer's order.
- `POST /staff/prescriptions/:id/reject` records `rejectedBy / rejectedAt`, sends a templated SMS via the existing SMS provider.

**Why:** Regulated flow. Backend-only feature; the admin has a placeholder page ready.

---

## Mobile — flagged earlier, not blocking admin

### Migrate Expo SDK 56-preview → SDK 55 stable, OR distribute via dev build

**What:** SDK 56 is in preview; the public Expo Go on the App Store / Play Store can't load it. Either downgrade everything to SDK 55, or build a custom dev client via EAS so Mishari can phone-test.

**Why:** "Web works, mobile doesn't" — Mishari can't open the customer app on his phone today. This is a launch blocker for the customer side.

**Decision pending:** option B (dev build via EAS) preserves SDK 56; option A (downgrade) is faster but loses what we picked SDK 56 for. Awaiting Mishari's call.

### Heritage framing audit

**What:** grep `since 1986|40 years|decades|heritage` across `mobile/` and `admin/` after each major change to make sure none has crept in. Estrogen is new; that history belongs to Al-Mishari Hospital.

**Acceptance:** clean grep before each `/ship`.
