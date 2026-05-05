# Sprint 1 — Foundation integration

Generated 2026-05-05 by Claude during the implementation kickoff. Three lanes ran in parallel git worktrees, all merged into `main`.

---

## Outcome

All three lanes shipped. Backend Cloud Functions compile clean (0 errors). Admin dashboard compiles clean (0 errors, improved from 9 pre-existing). Mobile app holds at the 32-error pre-existing baseline (no regressions).

```
main commit graph
─────────────────
eddbdcc  Merge Lane A: Unifonic OTP + branchGuard + state machine
941d648  Merge Lane C: admin OrderQueueExample reference component
ed9d97b  Merge Lane B: daily catalog sync function
abbc765  Fix: include admin/src/lib/ source files
fcce199  Fix: include backend/functions/src/lib/ source files
2b08da7  (lane-a) Sprint 1 Lane A: integrate Unifonic OTP + branchGuard + state machine
aa9f909  (lane-c) Sprint 1 Lane C: branchId-aware orders queue + state machine UI
c54a314  (lane-b) Sprint 1 Lane B: add daily catalog sync scheduled function
7ff4aae  Initial commit: Sprint 0 foundation + existing app scaffold
```

---

## What landed per lane

### Lane A — Unifonic OTP + branchGuard + state machine

- `backend/functions/src/api/orders.ts` — `placeOrder` now wraps every order document with `withBranch(...)` so `branchId: 'main'` is enforced on every write.
- `backend/functions/src/api/admin.ts` — `updateOrderStatus` now reads the current status, calls `assertTransition(currentStatus, newStatus)` before writing, returns early on `isNoOp`. The set of legal status values is now aligned to the canonical `OrderStatus` union from `lib/orderStatus.ts`. Two non-canonical statuses (`'approved'`, `'packing'`) were removed — if the admin UI was sending those strings, it must align to the canonical set.
- `mobile/config/firebase.ts` — exports `functions` (region `me-central1`) so callable invocations work.
- `mobile/app/[locale]/(auth)/login.tsx` and `otp.tsx` — dual-path auth: when `EXPO_PUBLIC_USE_REAL_AUTH === 'true'`, calls `httpsCallable(functions, 'sendOtp' | 'verifyOtp')` and signs in with `signInWithCustomToken(token)`. The default mocked flow is preserved for dev.

### Lane B — Daily catalog sync

- `backend/functions/src/scheduled/catalogSync.ts` (new, ~232 LOC) — Cloud Scheduler-triggered function running every day at 04:00 Asia/Riyadh. Fetches the existing online catalog via `functions.config().catalog.api_url`, normalizes the payload, and upserts each product to Firestore in batches of 500. Every write goes through `withBranch(productData, DEFAULT_BRANCH_ID)` so `branchId` is enforced. Errors per-product or per-batch are caught and logged; the cron never crashes.
- `backend/functions/src/index.ts` — adds the `catalogSync` export alphabetically among scheduled jobs.

### Lane C — Admin OrderQueueExample reference component

- `admin/src/components/OrderQueueExample.tsx` (new, ~454 LOC) — reference component showing the locked pattern: branchId-filtered Firestore live query, 4-step state machine progression UI in locked Variant A colors (magenta `#B8267E` for current step, success green for completed, hairline-pink for pending), action buttons gated to only legal forward transitions, and `updateOrderStatus` callable invocation (no direct `updateDoc` on `status`).

---

## Side effects from the merge

### Two follow-up commits had to land on `main` to unblock the lanes

The Sprint 0 `.gitignore` had `**/lib/` to exclude TypeScript build output. That rule also matched the SOURCE library directories `backend/functions/src/lib/` AND `admin/src/lib/`, silently excluding several already-existing files plus the new Sprint 0 helpers. Both Lane B and Lane C reported this independently from their typecheck failures.

Fixed in two commits:

- `fcce199` — replaced `**/lib/` with explicit `backend/functions/lib/` + `backend/lib/`. Added the four backend lib source files: `admin.ts`, `customClaims.ts`, `branchGuard.ts`, `orderStatus.ts`.
- `abbc765` — added the three admin lib source files: `adminAuth.ts`, `firebase.ts`, `firestore.ts`.

### Conflict resolution during Lane A merge

Lane A independently caught the `.gitignore` bug and fixed it with a different approach (preserve `**/lib/`, add a negation `!backend/functions/src/lib/`). The merge into `main` (which had already fixed it with the explicit-path approach) produced one conflict in `.gitignore`. Resolved in favor of `main`'s explicit-path approach because it generalizes correctly to `admin/src/lib/` without needing additional negation patterns.

---

## Post-merge state

### Build

- `cd backend/functions && npx tsc --noEmit` → **0 errors**
- `cd admin && npx tsc --noEmit` → **0 errors** (improved from 9 pre-existing thanks to the lib-fix commits)
- `cd mobile && npx tsc --noEmit` → **32 errors**, all pre-existing baseline (zustand store types, Expo Router path types, untyped i18n keys). No regressions from Sprint 0 or Sprint 1.

### Worktrees

The three lane worktrees are still on disk:

- `/Users/mishari/estrogen-app-lane-a/` (branch `lane-a/auth-and-branchguard` — merged)
- `/Users/mishari/estrogen-app-lane-b/` (branch `lane-b/catalog-sync` — merged)
- `/Users/mishari/estrogen-app-lane-c/` (branch `lane-c/admin-branch-filter` — merged)

Safe to remove with `git worktree remove <path>` for each. The branches will remain in case they're needed for reference; delete with `git branch -d <name>` when no longer useful.

---

## Open follow-ups (carried forward from lane reports)

| Source | Item | Action |
|---|---|---|
| Lane A | `'approved'` and `'packing'` removed from `updateOrderStatus` valid statuses | If any admin UI button was sending those strings, align to canonical `OrderStatus`. Lane C's `OrderQueueExample` already uses canonical states. |
| Lane A | Push notifications: trigger `onOrderUpdated` already early-returns on no-op transitions, but doesn't gate by `shouldNotifyCustomer` | Optional follow-up: silence `placed`/`pending_review`/`pharmacist_review` push notifications since they aren't customer-visible per `orderStatus.ts:CUSTOMER_VISIBLE_TRANSITIONS`. |
| Lane B | `functions.config()` is deprecated in favor of params/secrets in firebase-functions v2 | Codebase is on v1 SDK with `posSync.ts` using the same pattern. Migrate when upgrading the whole codebase to v2. |
| Lane B | `catalogLastSyncedAt` rewrites every run including for unchanged products | Add hash-compare in `mapToProduct()` if change-detection becomes valuable. |
| Lane C | Admin scaffold lacks proper data layer wiring — the existing pages use placeholder mocks | Author the integration: refactor `app/orders/page.tsx` to render `<OrderQueueExample />` per status filter, retire `data/mock.ts` re-exports. |
| All lanes | Lib files now in repo, but the Sprint 0 commit (7ff4aae) still doesn't compile from a fresh clone | Not a problem in practice — the two follow-up commits are right after it on `main`. Anyone cloning lands on tip of `main`. |

---

## Three commands the team still needs to run

```bash
# 1. Install fonts in mobile (DM Sans + IBM Plex Mono; Cairo already installed)
cd mobile && npx expo install @expo-google-fonts/dm-sans @expo-google-fonts/ibm-plex-mono

# 2. Configure Unifonic secrets for the auth function
firebase functions:config:set \
  unifonic.app_sid="YOUR_APP_SID" \
  unifonic.sender_id="Estrogen"

# 3. Configure catalog sync (skip if not yet pointed at the live catalog API)
firebase functions:config:set catalog.api_url="https://your-catalog-api/products"

# 4. Deploy rules + indexes + functions
firebase deploy --only firestore:rules,firestore:indexes,functions

# 5. Push everything to GitHub (from your terminal — auth not available in the Claude shell)
cd "/Users/mishari/Estrogen pharmacy app"
git push -u origin main
git push origin lane-a/auth-and-branchguard lane-b/catalog-sync lane-c/admin-branch-filter
```
