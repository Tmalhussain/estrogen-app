# Design System — Estrogen Pharmacy

This file is the source of truth for visual decisions across **mobile** (Expo SPA) and **admin** (Operator's Cockpit web app). Always read this before making any visual or UI decision. Don't deviate without explicit user approval.

## Product Context

- **What:** Estrogen Pharmacy is a women's health delivery pharmacy in Riyadh, Saudi Arabia, operated by Al-Mishari Hospital. Two surfaces:
  - **Mobile app** — customers place orders, track delivery, chat with pharmacists, browse the catalog by life stage and type.
  - **Operator's Cockpit** — staff web app for adding catalog data, watching live orders, looking up customers, approving prescriptions, and reviewing the audit log.
- **Who it's for:** Saudi women across four life stages (babies / young girls / ladies / golden ages) and the small operator team that runs the pharmacy. Bilingual EN/AR.
- **Space:** regulated retail pharmacy. Design must convey trust, calm, and clinical care — not playful e-commerce.

## Memorable Thing

**"Calm pharmacy, not warehouse panel."** Every visual decision serves this. Operators see lots of data at once, but the product never *feels* like a logistics dashboard. Customers see clinical care, not consumer flash.

## Aesthetic Direction

- **Direction:** Editorial-Operational. Linear / Vercel / Stripe Dashboard family, warmed with the brand palette.
- **Decoration level:** Minimal. Hairlines, real typography, restrained color. No gradients, no icon-in-circles, no decorative blobs.
- **Mood:** Careful, dense, trustworthy. The visual language of a serious pharmacy that respects its customers' privacy.
- **Reference DNA:** Linear (density + restraint), Vercel Dashboard (typography), Stripe Dashboard (data legibility), Estrogen's existing **estrogenpharmacy.com** customer site (purple-on-white, monochromatic, big-bold-Arabic-H2 sections). The mobile customer app should *feel like a sibling* of estrogenpharmacy.com when held side by side; the admin keeps the same palette in a denser, table-first layout.

## Typography

- **Display / Section headings (H2 in marketing surfaces):** **DM Sans 800** (latin) + **Tajawal 800** (arabic). Big and confident — section titles on Home and Shop are 32–40px and weight 800. `letter-spacing: normal` (NOT negative — matches estrogenpharmacy.com).
- **H1 / page title:** **DM Sans 700** + **Tajawal 700**. 24–30px.
- **H3 / subsection:** **DM Sans 600** / 17px.
- **Body:** **DM Sans 400/500** (latin) + **Tajawal 400/500** (arabic). 13px in admin (dense), 15px in mobile (touch — matches estrogenpharmacy.com body 15px).
- **UI labels / eyebrows:** **DM Sans 600**, 11px, uppercase, `letter-spacing: 0.5px`. The marketing-style "EYEBROW" small text above big H2s on Home / Shop.
- **Data / numerics / IDs / SKUs:** **Geist Mono 400/500/600** with `font-variant-numeric: tabular-nums`. Required for: order IDs, SAR prices, phone numbers, dates, SKU codes, audit timestamps.
- **Code (admin debug surfaces):** Geist Mono.

PingARLT (used on estrogenpharmacy.com) is a paid Adobe Arabic typeface and is not licensed for our use. Tajawal 400/500/700/800 is the closest free equivalent and what we ship. If the brand later licenses PingARLT, swap `Tajawal_*` → `PingARLT` in `mobile/constants/theme.ts` and `admin/src/styles/theme.ts` — that's the only change required.

- **Loading:** Google Fonts `<link>`:
  ```
  https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&family=Geist+Mono:wght@400;500;600&display=swap
  ```

### Type scale

| Role | Size / Line | Weight | Notes |
| --- | --- | --- | --- |
| Display H2 | 32 / 38 mobile · 40 / 48 web | 800 | Section titles on Home and Shop. Letter-spacing **normal**. |
| H1 | 24 / 30 | 700 | Page title. Letter-spacing -0.2 OK on Latin, normal on Arabic. |
| H2 (admin / dense) | 20 / 26 | 700 | Section title in admin pages. Smaller than marketing H2. |
| H3 | 17 / 22 | 600 | Subsection / drawer title |
| Body lg | 15 / 22 | 400 | Mobile body — matches inspo's 15px body |
| Body | 13 / 20 | 400 | Admin body, dense tables |
| Body sm | 12 / 18 | 400 | Captions, helper text |
| Eyebrow | 11 / 14 | 600 | Above big H2s on Home/Shop. Uppercase, +0.5 tracking. |
| Mono | 12 / 16 | 500 | All numerics in tables and badges |

## Color

- **Approach:** **Monochromatic deep purple on white.** estrogenpharmacy.com uses one purple (#752A79) across 397 distinct elements and one accidental other color. Their brand discipline IS the brand. We mirror it: one primary, one ink, one set of neutrals, semantic colors only on status pills.

### Tokens

| Token | Hex | Use |
| --- | --- | --- |
| `--brand` | `#752A79` | Primary text, brand wordmark, CTA button background, active nav, focus rings, eyebrows. **The single brand color.** |
| `--brand-dark` | `#5A1F5E` | Hover / pressed state for CTA buttons. |
| `--brand-soft` | `#F3E5F5` | Active nav background, primary chip background, subtle brand-tint blocks. |
| `--brand-on` | `#FFF6FF` | Foreground on brand background (CTA button text). Tinted near-white from estrogenpharmacy.com. |
| `--white` | `#FFFFFF` | **Page background everywhere.** Mobile and admin both. Replaces the previous cream. |
| `--surface` | `#FAF7FA` | Hover row, very subtle alt-band. Used sparingly. |
| `--hairline` | `#ECE5EC` | All borders. **Always 1px.** |
| `--ink` | `#1A0F1A` | Primary text where brand-purple would be too loud. |
| `--ink-soft` | `#4A3A4A` | Secondary text, body in dense surfaces. |
| `--ink-muted` | `#8A7A8A` | Tertiary text, captions, table headers. |
| `--success` | `#1F8F5F` | Delivered, approved, in-stock |
| `--success-soft` | `#DDF1E7` | Pill background |
| `--warning` | `#C77B0A` | Awaiting review, low-stock, off-shift |
| `--warning-soft` | `#FBEDD3` | Pill background |
| `--danger` | `#C8253A` | Stuck, cancelled, rejected |
| `--danger-soft` | `#FBE0E4` | Pill background |
| `--info` | `#2563A8` | On-the-way, dispatched, neutral status |
| `--info-soft` | `#DDE9F5` | Pill background |

### Color rules

- **`--brand` is the ONLY accent.** No magenta. No pink. No blue CTA buttons, no green confirmation buttons. Status colors (success/warning/danger/info) appear only on pills, alerts, and metric deltas — never on primary buttons.
- **Page background is white**, period. estrogenpharmacy.com uses pure `#FFFFFF` and so do we — replaces the previous cream tone. Any non-white surface beyond cards is a deliberate exception (warning banner, brand-soft hero block).
- **No gradients.** Anywhere. Solid colors only.
- **Dark mode:** out of scope for v1.

### Migration note (May 2026)

Earlier the system used three brand colors (`#B02080` magenta, `#702070` plum, `#D080A0` blush) on a cream `#FBF7FA` background. After comparing against the user's existing customer site at estrogenpharmacy.com — which is monochromatic deep purple on pure white — the system was simplified to match. The single `--brand: #752A79` replaces all three. Any code still hard-coding `#B02080`, `#702070`, `#D080A0`, or `#FBF7FA` needs updating; see the Decisions Log.

## Spacing

- **Base unit:** 4px.
- **Density:** Comfortable-dense. Admin row padding 12–16px, mobile content padding 16–20px.
- **Scale:** `2(xxs) · 4(xs) · 8(sm) · 12(md) · 16(lg) · 20(xl) · 28(xxl) · 40(xxxl) · 64`. Don't invent in-between values; pick the nearest token.

## Layout

- **Approach:** Grid-disciplined hybrid. App surfaces use strict grids; the customer mobile home / shop screens have looser editorial sections (banner carousels, life-stage tile grid).

### Admin (Operator's Cockpit)
- **Skeleton:** 220px fixed sidebar (white, hairline border-right) · scrollable main panel (cream) · slide-in 480px drawer for detail views.
- **Max content width:** 1280px (admin is laptop-first, not 4K-wide).
- **Density:** 12px row padding in tables, 16px section padding, 24px section gaps.

### Mobile
- **Skeleton:** bottom tab bar · safe-area-aware screen padding (16px horizontal, 20px vertical).
- **Touch targets:** minimum 44×44pt; primary CTAs 48–52pt.

### Border radius
- `sm: 4px` — small chips
- `md: 8px` — inputs, secondary buttons, list rows
- `lg: 12px` — cards, drawers
- `xl: 16px` — hero sections, major panels
- `cta: 24px` — primary CTA buttons. Matches estrogenpharmacy.com pill-ish CTA radius.
- `pill: 9999px` — status pills, search bars, avatars.
- **Never:** uniform mega-radius on everything (the AI-slop bubbliness signal).

### Hairlines and shadows
- 1px hairlines (`--hairline` `#EDE6EC`) do all the structural work in admin.
- Shadows reserved for drawers / modals only — `0 8px 24px rgba(42,10,31,0.08)`. No card shadows; cards are bordered.

## Motion

- **Approach:** Minimal-functional. No decorative animation. Motion is for state changes, not delight.
- **Easing:**
  - enter: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out)
  - exit: `cubic-bezier(0.7, 0, 0.84, 0)` (ease-in)
  - move: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)
- **Duration:**
  - micro (focus ring, button press): 80ms
  - short (color/opacity transitions): 150ms
  - medium (drawer slide, modal): 250ms
  - long: avoid above 400ms.
- **No:** scroll-driven animation, parallax, spring physics, page transitions beyond crossfade.

## Anti-Slop Locked Rules

These mistakes break the system. Don't ship them.

- **No purple/violet *gradient* anywhere.** Solid `--plum` is fine; gradients are not.
- **No 3-column "feature grid with icons in colored circles"** on marketing or empty states. Use real content or a single illustrative element.
- **No `system-ui` / `-apple-system` for primary display or body.** That's the "I gave up on typography" signal. Always load DM Sans + Tajawal explicitly.
- **No centered-everything pages.** Left-align body content; reserve centering for genuine modal/empty-state moments.
- **No bubble-radius on every element.** Use the radius scale; pick the right level for the element.
- **No "since 1986" / "40 years of heritage" copy** on Estrogen surfaces. The brand is *new* (Al-Mishari Hospital is 40 years old; Estrogen is the spinoff).
- **No discreet-packaging copy.** Use "simple packaging" instead. Discretion is implicit, not advertised.
- **No emoji-as-icon in nav or product UI.** Use Ionicons (mobile) / lucide-react (admin web).

## Components — required patterns

- **Status pills.** 3px-9px padding, 11px font, weight 600, leading dot in same color. One per row max. Soft-color variants for background only — never solid status colors as background.
- **Tables.** Hairline row separator, `--cream` row hover, mono numerics with tabular-nums, label-style column headers (uppercase, 11px, +0.5px tracking).
- **Buttons.**
  - Primary: solid magenta, white text, 8/14 padding, 8px radius.
  - Secondary: white background, hairline border, ink text.
  - Ghost: transparent background, magenta text — for cancel/dismiss.
  - **Never:** gradient, drop-shadow, outlined-magenta.
- **Inputs.** Cream background, hairline border, 9/12 padding. Focus: 2px magenta outline, white background, magenta border.
- **Sidebar nav (admin).** Item: 9/10 padding, 8px radius. Active: `--magenta-soft` bg, `--magenta-dark` text, leading 6px magenta dot. Hover: `--surface` bg.
- **Audit log row.** Three columns: mono timestamp · `<actor>` · `<action>` + entity. Append-only feel; no row controls.

## Surfaces parity

The mobile app and admin web app must feel like the **same company**:
- Same fonts (DM Sans, Tajawal).
- Same magenta as primary accent.
- Same cream page background.
- Different *density* — mobile breathes (touch), admin compresses (data).

If you can't draw a clear line between a mobile and admin surface and say "these are siblings," go back and fix it.

## Bilingual (EN / AR)

- **Tajawal** for any visible Arabic text (drug names, medical profile, error strings the customer sees).
- **DM Sans** for everything English.
- RTL support: layout mirrors when locale=ar; use logical properties (`margin-inline-start`, `padding-inline-end`) where supported, fall back to `I18nManager.isRTL` flips on RN.
- Currency display: always "SAR ##,###.##" with **mono numerics** so columns align.

## Architecture lockdowns

These rules are enforced at code-review time. Anything that violates one is a P0 finding regardless of how reasonable the change otherwise looks. Keep this section short and load-bearing.

### Customer endpoints are search-only

There is **no list-all-customers endpoint**, even paginated, even staff-gated, even read-only. Looking up a customer requires knowing something specific about them: phone, email, or order ID.

- **Why:** PDPL says minimize customer-data access. Product trust says nobody on the operator team should be able to scroll through Estrogen's customer list. The medical inferences from a women's-health pharmacy are unusually sensitive.
- **Where this is enforced:** [backend/src/routes/staff.ts](backend/src/routes/staff.ts) — `GET /staff/customers` requires at least one search parameter; only ever returns 0 or 1 customer.
- **If you need bulk:** write a one-shot CLI script with the business rationale logged to `audit_log` as `customer.bulk_op` and an explicit reviewer.

### Mutations write audit rows in the same transaction as the data write

Every staff mutation route MUST call `audit(tx, ...)` inside its own `db.transaction`. The audit row commits with the data; if either fails, both roll back. The skeleton:

```ts
await db.transaction(async (tx) => {
  const [before] = await tx.select()...where(...).limit(1);
  const [after] = await tx.update()...returning();
  await audit(tx, actor, { action: 'thing.update', entityType: 'thing', entityId: id, before, after });
});
```

Customer-data reads (search hit, profile open, medical-profile view) call the fire-and-forget `auditRead(actor, ...)` instead. Read failures must not fail the response.

### Direct table reads bypass `liveX()` only with a comment block

Any `db.select().from(schema.users | schema.products | schema.orders)` must compose `liveUsers()` / `liveProducts()` / `liveOrders()` into the WHERE clause. Soft-deleted rows MUST NOT leak into a public response. Audit-only paths that need to see deleted rows must include the comment `// intentionally bypasses liveX()` on the query.

### No purple/violet gradients, no 3-icon-circles, no system-ui

These three are the AI-slop tells. They never ship on this product.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-07 | Initial DESIGN.md created | Generated by /design-consultation following the May-7 office-hours design doc for the Operator's Cockpit. Tokens lifted from `mobile/constants/theme.ts`; admin-specific additions: Geist Mono for numerics, denser type scale, audit log + status pill components. |
| 2026-05-07 | Realigned palette + type to estrogenpharmacy.com | Three brand colors collapsed to one (`#752A79` deep purple). Cream background replaced with pure white. Section H2 bumped from 20/700 to 32–40/800 to match the inspo's confident marketing-style headings. Pill CTAs now 24px radius. Tajawal kept as PingARLT proxy until the brand licenses PingARLT. |
