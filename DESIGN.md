# Design System — Estrogen Pharmacy

## Product Context

- **What this is:** A bilingual (Arabic-primary, English-secondary) mobile app + customer-facing website for Estrogen, a NEW women-only pharmacy brand in Riyadh, Saudi Arabia. Estrogen branched off from **Al-Mishari Hospital** (the parent group's 40+ years of medical heritage backs the brand, but Estrogen itself is new).
- **Who it's for:** Saudi women across life stages (young girls, ladies, mothers, golden years), with the launch beachhead being car-less women on chronic medication (archetype: Abeer). Caregivers (adult daughters managing aging parents) are a v2-ready cohort.
- **Space/industry:** Women's specialized pharmacy retail in KSA. Adjacent to Saudi e-commerce (Jahez, Noon, Ninja) and chain pharmacies (Nahdi, Whites, Al-Dawaa, Boots KSA), but positioned as a modern pharmaceutical brand for women, backed by the Al-Mishari Hospital trust.
- **Project type:** Mobile app (React Native + Expo) + customer-facing marketing/ordering website.
- **Memorable thing:** "The women's pharmacy that comes to you, backed by Al-Mishari." Modern + trustworthy + pharmaceutical, not vintage apothecary.

## Aesthetic Direction

**LOCKED: Bright & Airy (Variant A from /design-shotgun on 2026-05-05).**

- **Direction:** Bright & Airy. White backgrounds everywhere. Magenta and purple from the logo as the brand color signature. Soft pink (#FBEAF1, #FDF5F8) as subtle card surfaces. Reads as a modern, friendly Saudi pharmacy for women — backed by Al-Mishari Hospital trust without leaning on heritage signaling.
- **Decoration level:** Restrained. Lots of whitespace. No serifs. No gradients. No texture. The 8-pointed Islamic star from the logo may appear as a small decorative element, never as a heavy background pattern.
- **Mood:** A new women's pharmaceutical brand that is clean, accessible, and trustworthy. References: Hims, Maven Clinic, modern Saudi clinic apps, Tabeby. NOT vintage apothecary, NOT bold-confident-pharma, NOT soft-clinical-wellness.

**Rejected directions (do not revive without explicit user approval):**
- Boutique-apothecary / cream + serif / 40-year heritage framing
- Bold-purple-hero with magenta status card (too heavy, too "confident pharma")
- Soft-clinical with pale-pink everywhere (too gentle, too wellness-coded)

## Typography

| Role | Arabic | English |
|---|---|---|
| Display / Hero | **Tajawal Bold** (700) | **DM Sans Bold** (700) |
| Body | **Tajawal Regular** (400) | **DM Sans Regular** (400) |
| UI / Labels | Tajawal Medium (500) | DM Sans Medium (500) |
| Numbers / Receipts | Tajawal with tabular-nums | DM Sans with tabular-nums |
| Order codes / Mono | IBM Plex Mono (400) | IBM Plex Mono (400) |

**Rationale:**
- **Tajawal** is Saudi-made (Boutros foundry), free, screen-optimized for Arabic, and widely used by Saudi premium brands. It works for both display and body.
- **DM Sans** is a contemporary geometric sans by Colophon Foundry (free, open-source). Pharmaceutical-clean. Pairs visually with Tajawal because both are humanist sans-serifs with similar x-height proportions. NO serifs in the system — serifs would re-introduce the rejected heritage aesthetic.
- **IBM Plex Mono** for receipts and order codes, where visual distinction from prose matters.

**Explicitly rejected fonts** (do not introduce without explicit user approval):
- Instrument Serif, Fraunces, any serif display
- Inter, Roboto, system-ui as primary
- Space Grotesk, Poppins, Montserrat (overused convergence-trap fonts)
- Cairo (works but Tajawal is the locked Saudi pick)

**Loading strategy:** Google Fonts via `<link>` for web; bundled via `expo-google-fonts` in React Native.

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Tajawal:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**Modular type scale:**

| Token | px | Use |
|---|---|---|
| `2xs` | 11 | Microcopy, legal |
| `xs` | 13 | Captions, labels |
| `sm` | 15 | Mobile body floor |
| `md` | 17 | **Default body** (raised from 16 for elderly accessibility) |
| `lg` | 20 | Lede, large body |
| `xl` | 24 | Subheadings |
| `2xl` | 32 | Section headings |
| `3xl` | 44 | Hero (mobile) |
| `4xl` | 60–88 | Hero (desktop), wordmark |

**Numeral convention:** Latin numerals (1, 2, 3) in both English and Arabic text. This matches Saudi commerce convention. Arabic-Indic numerals (١, ٢, ٣) only appear in religious/classical contexts and are not used in this product.

**Date convention:** Gregorian primary in both languages. Hijri may appear as a secondary line in Arabic mode only, never as the primary date.

## Color

**Approach:** brand-led. Magenta and deep purple are pulled directly from the Estrogen logo and are the brand's primary visual signature. Pink is the secondary accent. White is the canonical background. Neutrals are cool grays. Semantic colors used only for status.

**Brand palette extracted from logo:**

| Token | Hex | Role |
|---|---|---|
| `--magenta` | `#B8267E` | Primary brand color, primary CTA, the logo's star outline |
| `--purple` | `#5B1F65` | Wordmark, deep accent, headings on light backgrounds |
| `--pink` | `#E89AB6` | Secondary accent, soft surfaces, badges |
| `--pink-soft` | `#FBEAF1` | Subtle pink-tinted surface, hover states |

**Light-mode neutrals (pharmaceutical-clean):**

| Token | Hex | Role |
|---|---|---|
| `--white` | `#FFFFFF` | Primary page background |
| `--paper` | `#FAFAFB` | Surface, subtle elevation |
| `--ink` | `#1A0F1F` | Primary text (purple-tinted near-black so it harmonizes with the brand) |
| `--muted` | `#6B6373` | Secondary text |
| `--hairline` | `#ECEAEF` | Borders, dividers |

**Semantic:**

| Token | Hex | Role |
|---|---|---|
| `--success` | `#1E9F6E` | "Out for delivery," confirmation |
| `--warning` | `#C97A1A` | "Awaiting pharmacist review" |
| `--error` | `#D63B5A` | Payment decline, hard error |

**Card-surface tints (used in Variant A):**

| Token | Hex | Role |
|---|---|---|
| `--pink-soft` | `#FBEAF1` | Reorder card backgrounds, subtle elevation |
| `--pink-mist` | `#FDF5F8` | Even softer surface variant |
| `--hairline-pink` | `#F5DCE6` | Card borders, dividers (when pink-coded) |

**Dark mode:**

| Token | Hex |
|---|---|
| `--white` (dark) | `#15101A` |
| `--paper` (dark) | `#1C1626` |
| `--ink` (dark) | `#F5EFF7` |
| `--muted` (dark) | `#9E96A8` |
| `--magenta` (dark) | `#D24FA0` (lifted, more luminous on dark) |
| `--purple` (dark) | `#A06FB0` |
| `--hairline` (dark) | `#2A2333` |
| `--pink-soft` (dark) | `#2A1C26` |

**Dark mode:**

| Token | Hex |
|---|---|
| `--cream` (dark) | `#1A1614` |
| `--sand` (dark) | `#211D1A` |
| `--ink` (dark) | `#F5EFE6` |
| `--muted` (dark) | `#9E928A` |
| `--mulberry` (dark) | `#C99FAB` (lifted, more luminous) |
| `--mulberry-soft` (dark) | `#6E2A3C` |
| `--hairline` (dark) | `#2A2521` |

**Why this palette:**
- **Pulled from the logo, not invented.** Magenta `#B8267E`, purple `#5B1F65`, and pink `#E89AB6` are the actual brand colors. The earlier mulberry+cream proposal ignored the logo and was wrong.
- **Pink IS in the brand**, but anchored by deep purple and balanced by clean white space. Without the purple anchor, pink would read as candy. With it, pink reads as confident pharmaceutical brand.
- **White backgrounds** because Estrogen is a new pharmaceutical brand, not a vintage apothecary. White reads as clean, modern, hospital-trustworthy.
- **No purple GRADIENTS.** Solid magenta and purple only. No gradient AI-slop.

**Accessibility:** all body-text combinations must hit WCAG AA contrast (4.5:1 minimum). `--muted` on `--cream` is the tightest pair; verify before shipping. Aim for AAA on primary body text.

## Spacing

- **Base unit:** 4px
- **Density:** comfortable. Not compact. Touch targets minimum 48×48 (raised from iOS 44 floor for elderly users).
- **Scale:** `2(2px) 4(4px) 8 12 16 24 32 48 64 96 128`

## Layout

- **Approach:** grid-disciplined throughout. The bright-and-airy direction lives or dies on whitespace and alignment, not on editorial asymmetry. Save asymmetric moments for the marketing site hero only.
- **Mobile grid:** 4 columns, 16px gutter, 20px page padding (Variant A uses 20px page padding for breathing room).
- **Tablet grid:** 8 columns, 24px gutter.
- **Desktop grid:** 12 columns, 32px gutter, max content width 1200px.
- **Border radius scale:** `sm: 8px` (inputs, small badges) · `md: 14px` (reorder cards, buttons) · `lg: 18px` (status card, larger cards) · `xl: 24px` (sheets, modals) · `full: 9999px` (pills, avatars, reorder buttons).
- **Card pattern (Variant A):** white background with `1.5px solid var(--pink)` border for status card; `var(--pink-mist)` background with `1px solid var(--hairline-pink)` for reorder cards. White cards on white background never appear without a border — the border + soft pink fill is the visual hierarchy.

## RTL / LTR Strategy (load-bearing)

This system supports Arabic-primary RTL and English-secondary LTR. The implementation rule is: **CSS logical properties everywhere**.

```css
/* DO */
margin-inline-start: 16px;
padding-block-end: 24px;
border-inline-end: 1px solid var(--hairline);
inset-inline-start: 0;

/* DO NOT */
margin-left: 16px;
padding-bottom: 24px;
border-right: 1px solid var(--hairline);
left: 0;
```

Direction is set on `<html dir="rtl">` (or `dir="ltr"`). The entire layout mirrors automatically when logical properties are used throughout.

**React Native:** use `I18nManager.forceRTL(true)` for Arabic users and `I18nManager.allowRTL(true)`. Style props in RN already mirror automatically when RTL is forced; verify on device.

### Icon mirroring rules

- **Mirror in RTL** (apply `transform: scaleX(-1)` or use direction-aware variants): chevron, arrow, back, forward, send, list-arrow.
- **Do NOT mirror in RTL**: heart, search (magnifier), profile/avatar, star, bell, gear, brand wordmark, photo content.

### Wordmark

- English: "Estrogen" set in Instrument Serif italic, mulberry color.
- Arabic: "إستروجين" set in Tajawal Bold, mulberry color.
- The wordmark never flips, never mirrors, never inverts.

## Motion

- **Approach:** intentional minimal. Soft enough to feel trustworthy. Restrained enough to never delay the user.
- **Easing:** enter `cubic-bezier(0.16, 1, 0.3, 1)` (gentle settle), exit `ease-in`, move `ease-in-out`.
- **Duration:** micro 120ms, short 220ms, medium 360ms.
- **Hero motion:** the order-status state machine transition (Received → Preparing → Out for delivery → Delivered) is the most important animated moment in the app. Animate state changes with a 360ms ease-out; let the icon and progress bar feel deliberate, not flashy.
- **No expressive choreography.** No parallax. No scroll-driven animation on the website hero. No spring-physics bouncing.

## Voice & Copy

- **Arabic primary, English secondary** in every customer-facing surface.
- **Copy avoids "discreet."** Calling out discretion explicitly recreates the awkwardness it claims to solve. The opaque packaging speaks for itself; the marketing copy does not.
- **Address customers in second-person feminine** in Arabic (تي endings) by default, since the product is for women. Caregiver mode (v2) uses neutral phrasing because the recipient may differ from the account holder.
- **No marketing-copy clichés:** "Built for X," "Designed for Y," "Empower," "Seamless," "Simply," "Effortlessly." Estrogen speaks like a senior pharmacist talking to a long-time customer, not like a SaaS landing page.

## Anti-slop Commitments

The following are explicitly forbidden in any Estrogen surface:
- Purple/violet gradients
- 3-column feature grids with icons in colored circles
- Centered-everything layouts with uniform padding
- Bubble-radius (24px+) on small elements
- Gradient buttons as primary CTAs
- Generic stock-photo hero sections
- system-ui or -apple-system as primary display or body font
- Pink as the brand or primary accent
- Medical teal or generic mint as primary or secondary

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-05-05 | Initial design system drafted (REVISED) | /design-consultation produced a heritage-apothecary direction that was rejected by the founder. |
| 2026-05-05 | Brand history corrected | Estrogen is a NEW brand from Al-Mishari Hospital group. The 40+ years belongs to the parent hospital, not Estrogen itself. Removed all "since 1986" and heritage framing. |
| 2026-05-05 | Palette extracted from logo | Logo colors (magenta #B8267E, purple #5B1F65, pink #E89AB6) replaced the rejected mulberry+cream palette. White backgrounds replaced cream. |
| 2026-05-05 | Aesthetic LOCKED to Variant A (Bright & Airy) | /design-shotgun produced 3 variants. Founder picked A. Documented in `~/.gstack/projects/Estrogenpharmacyapp/designs/home-screen-20260505-130853/approved.json`. |
| 2026-05-05 | DM Sans + Tajawal locked | Instrument Serif rejected as it re-introduces heritage feel. DM Sans is the modern-pharmaceutical-clean choice that pairs visually with Tajawal. |
| 2026-05-05 | Body floor at 17px (not 16) | App must work for elderly women with declining vision. Carries forward from earlier draft. |
| 2026-05-05 | Latin numerals in both languages | Matches Saudi commerce convention. Carries forward. |
| 2026-05-05 | "Discreet" removed from marketing copy | Calling out discretion recreates the awkwardness it claims to solve. Carries forward. |
