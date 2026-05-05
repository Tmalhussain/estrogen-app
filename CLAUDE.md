# gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

## Design System

Always read `DESIGN.md` before making any visual or UI decisions. All font choices, colors, spacing, RTL/LTR rules, motion, and aesthetic direction are defined there. Do not deviate without explicit user approval. In QA mode, flag any code that doesn't match `DESIGN.md`.

## Implementation Anti-Patterns (locked by /plan-eng-review on 2026-05-05)

When writing or editing code in this repo, NEVER do these things without explicit user approval:

1. **Never query Firestore without `branch_id` filter.** Every collection scoped to a branch (orders, products, inventory, pharmacists, drivers, consult_slots, subscriptions) requires `where('branch_id', '==', currentBranch)` on every read AND every write. ESLint rule plus a Cloud Function pre-write hook enforce this. Bypassing breaks v2 multi-store rollout.

2. **Never query Firestore without composite indexes declared in `firestore.indexes.json`.** Firestore falls back to in-memory filtering without indexes; works in dev, breaks in prod at scale. Add the composite index BEFORE writing the query.

3. **Never log raw Mada card numbers, CVVs, or Moyasar tokens.** PCI scope expansion. Use Moyasar's tokenization end-to-end; tokens may appear in audit logs but never raw card data.

4. **Never bypass the `consent_grants` check in caregiver-mode code (v2+).** PDPL compliance requires explicit consent records. Patient health data is access-gated even from family members.

5. **Never skip Arabic search test fixtures.** `tests/fixtures/arabic-search.json` must contain ≥30 Saudi spelling variations of top-10 medications. Search accuracy <90% on this fixture is a ship-blocker.

6. **Never use serif display fonts.** DESIGN.md locks DM Sans (English) + Tajawal (Arabic). Reintroducing Instrument Serif or any serif undoes the design lock-in from /design-shotgun.

7. **Never reintroduce "since 1986" or 40-year-heritage framing for the Estrogen brand.** Estrogen is a NEW brand from Al-Mishari Hospital. The 40 years belongs to the parent hospital, not Estrogen itself.

## Test Strategy (locked by /plan-eng-review on 2026-05-05)

Test plan: `~/.gstack/projects/Estrogenpharmacyapp/mishari-main-eng-review-test-plan-20260505-132917.md`

Ship-blocker tests for v1:
- Status state machine forward-only invariant
- Status transition idempotency
- branch_id presence on every order/product/inventory write
- Mada decline UX with cart preservation
- Arabic fuzzy search ≥90% accuracy on fixture
- OTP brute-force protection
- Firestore security rules deny cross-user data access
- Push notification arrives within 30 sec of state change

Build tests alongside code, not as a follow-up sprint.

## Available skills

- /office-hours
- /plan-ceo-review
- /plan-eng-review
- /plan-design-review
- /design-consultation
- /design-shotgun
- /design-html
- /review
- /ship
- /land-and-deploy
- /canary
- /benchmark
- /browse
- /connect-chrome
- /qa
- /qa-only
- /design-review
- /setup-browser-cookies
- /setup-deploy
- /setup-gbrain
- /retro
- /investigate
- /document-release
- /codex
- /cso
- /autoplan
- /plan-devex-review
- /devex-review
- /careful
- /freeze
- /guard
- /unfreeze
- /gstack-upgrade
- /learn
