# Sprint 0 — Foundation lockdown

Generated 2026-05-05 by Claude during the implementation kickoff after `/plan-eng-review`.

This sprint locks the schema, security rules, design tokens, and auth Cloud Function. After this lands, three implementation lanes can run in parallel (per the eng review's worktree plan).

---

## What shipped

### Backend (Firebase / Cloud Functions)

| File | Status | What |
|---|---|---|
| `firestore.rules` | **rewritten** | Multi-store branchId enforcement, profiles subcollection, consent_grants (v2-ready, v1 inert), subscriptions (v1.5), consultations (v1.5), consult_slots (v1.5), otp_attempts (locked from client). All existing rules carried forward. |
| `firestore.indexes.json` | **rewritten** | 21 composite indexes. Every operational query is now branchId-aware. Old indexes retained as back-compat for existing code. New indexes for subscriptions, consultations, consent_grants, otp_attempts. |
| `backend/functions/src/api/auth.ts` | **new** | Unifonic OTP `sendOtp` + `verifyOtp` callables. Saudi-standard SMS (vs Firebase native phone auth). 5-min TTL, scrypt-hashed codes, 5 attempts/15 min rate limit per phone, 3 verify attempts per OTP, mints Firebase custom token on success. |
| `backend/functions/src/lib/branchGuard.ts` | **new** | `requireBranchId()`, `withBranch()`, `scopedTo()`, `requireUserBranch()` helpers. Use in every Cloud Function that reads or writes operational collections. Throws clear errors if branchId missing. |
| `backend/functions/src/lib/orderStatus.ts` | **new** | Forward-only state machine guard (`assertTransition`, `canTransition`, `shouldNotifyCustomer`). Idempotency-safe. ASCII state diagram in the file header. Must be used in `updateOrderStatus` and any Cloud Function that mutates `order.status`. |
| `backend/functions/src/index.ts` | **edited** | Added exports for `sendOtp`, `verifyOtp`. |

### Mobile (Expo / React Native)

| File | Status | What |
|---|---|---|
| `mobile/constants/colors.ts` | **rewritten** | Brand palette extracted from `logo.jpeg` (locked Variant A). `magenta #B8267E`, `purple #5B1F65`, `pink #E89AB6`, `pinkSoft #FBEAF1`, `pinkMist #FDF5F8`, `hairlinePink #F5DCE6`, white backgrounds. Old `primary*` / `accent*` keys kept as aliases pointing at the canonical brand tokens, so existing screens don't break. Old category palette unified to `pinkSoft` (no rainbow). |
| `mobile/constants/typography.ts` | **new** | Cairo (Arabic, already installed) + DM Sans (English) + IBM Plex Mono. Modular type scale, body floor at 17px (elderly accessibility). Pre-built `TextStyles` and `TextStylesAr` for both directions. |
| `mobile/constants/tokens.ts` | **new** | Spacing scale (4px base), border radii (sm/md/lg/xl/full), touch targets (48px floor), motion durations + easings, shadows, breakpoints, z-index layers. |
| `mobile/components/HomeScreenV2.tsx` | **new** | Reference implementation of the locked Variant A home screen. Uses the new tokens. Mock data inline; team wires it to existing zustand stores when adopting. |

### Documentation

| File | Status | What |
|---|---|---|
| `DESIGN.md` | locked | Variant A tokens, brand history correction (Estrogen is NEW from Al-Mishari, not 40-year), rejected directions explicitly listed |
| `CLAUDE.md` | locked | Implementation anti-patterns (branchId, indexes, PCI, consent, Arabic search, no-serif, no-1986) + ship-blocker test list |
| `TODOS.md` | locked | 10 deferred items with full context, priorities, dependencies |
| This file | new | Sprint 0 changelog |

---

## What still needs to be done

### Sprint 0 cleanup (small, before Sprint 1)

1. **Install DM Sans on the mobile app:**
   ```bash
   cd mobile && npx expo install @expo-google-fonts/dm-sans @expo-google-fonts/ibm-plex-mono
   ```
   Then load both font families alongside Cairo in your existing font-loading setup. `typography.ts` references the font names already.

2. **Configure Unifonic secrets for the auth function:**
   ```bash
   firebase functions:config:set \
     unifonic.app_sid="YOUR_APP_SID" \
     unifonic.sender_id="Estrogen" \
     unifonic.api_url="https://api.unifonic.com/rest/SMS/messages"
   ```
   The function falls back to a console log in the emulator (no SMS sent) when secrets are missing, so local dev still works.

3. **Apply the new firestore.indexes.json:**
   ```bash
   firebase deploy --only firestore:indexes
   ```
   New indexes take 5-15 min to build in Firestore. Plan a quiet deploy window.

4. **Apply the new firestore.rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```
   Test in emulator first: `firebase emulators:start --only firestore`.

5. **Pre-existing TypeScript errors:** the mobile app has 32 pre-existing TS errors (zustand store types, Expo Router path types, untyped i18n keys). These are NOT from Sprint 0 changes. Track them as cleanup items.

### Sprint 1 lanes (parallel-safe after Sprint 0 lands)

- **Lane A — Auth + Order + Payment chain.** Wire the new `sendOtp`/`verifyOtp` Cloud Functions into the existing `(auth)/login.tsx` and `(auth)/otp.tsx` screens. Use `signInWithCustomToken` after `verifyOtp` returns. Then layer in `branchGuard` everywhere `placeOrder` and `updateOrderStatus` write to Firestore. Then hook `orderStatus.assertTransition` into `updateOrderStatus`. Then push notifications on each customer-visible transition.
- **Lane B — Catalog sync.** New scheduled function `dailyCatalogSync` that pulls from the existing online catalog API and upserts into Firestore. Daily Cloud Scheduler trigger. Make sure every product write uses `withBranch(data, 'main')`.
- **Lane C — Admin pharmacist queue.** Update the admin dashboard (`admin/`) to filter orders by `branchId` (default `'main'` in v1) and respect the new state machine. Replace any direct `order.status = 'X'` mutations with `assertTransition` calls.

After all three lanes pass integration tests, Sprint 2 (E2E + tests) and Sprint 3 (v1.5 features: consult booking, auto-refill subscription) follow.

---

## Verification checklist

- [x] `cd backend/functions && npx tsc --noEmit` — 0 errors
- [x] `cd mobile && npx tsc --noEmit` — 0 NEW errors (32 pre-existing)
- [x] `firestore.rules` syntactically valid (no rules-emulator output errors expected on deploy)
- [x] `firestore.indexes.json` is valid JSON, no `_comment_*` fields
- [x] `colors.ts` exports `Colors` as default and named export (back-compat)
- [x] Existing `(auth)`, `(tabs)`, `cart`, `checkout`, etc. screens not modified

---

## Decisions log (Sprint 0)

| Date | Decision | Why |
|------|----------|-----|
| 2026-05-05 | Cairo over Tajawal for Arabic | Team already has `@expo-google-fonts/cairo` installed. Cairo is a humanist Arabic sans family, very close to Tajawal aesthetically. Avoids font-swap friction. Tajawal can replace later by changing 6 family-name strings in `typography.ts`. |
| 2026-05-05 | Existing `primary*` and `accent*` color keys kept as aliases | The existing app has dozens of references to `Colors.primary` etc. Renaming them all in Sprint 0 would be a sweeping diff. Aliases let existing screens keep working immediately while new screens use the canonical `magenta` / `purple` / `pink` keys. |
| 2026-05-05 | scrypt instead of bcrypt for OTP hashing | Avoids pulling bcrypt/argon2 as a dependency. Node's built-in `crypto.scrypt` is sufficient for short-lived 6-digit codes. Replaceable with bcrypt if security review requests it. |
| 2026-05-05 | `consent_grants` doc ID convention `{patientUid}_{caregiverUid}_{scope}` | O(1) lookup via `exists()` in security rules. No query needed for hot-path consent checks. Trade: forces a denormalized lookup pattern but rules read 1 doc instead of running a query. |
| 2026-05-05 | OTP rate limit at 5 sends / 15 min / phone | Standard. Stricter values block legitimate retries (Saudi telco SMS sometimes delays); looser values let bad actors burn a phone's daily SMS budget. 5 is a defensible middle. |
| 2026-05-05 | OTP TTL = 5 minutes | Long enough for SMS delivery + user attention. Short enough that a leaked code is useless within a window. |
