# Estrogen Pharmacy

Two surfaces, one repo:
- **`mobile/`** — Expo SDK 56 customer app. Shipped, on GitHub.
- **`backend/`** — Hono + Drizzle (SQLite dev / Postgres prod). Ships behind both surfaces.
- **`admin/`** — Operator's Cockpit web app (Vite + React). Designed; build pending.

## Design system

**Always read [DESIGN.md](DESIGN.md) before making any visual or UI decision.** All font choices, colors, spacing, radius, and aesthetic direction are defined there. Do not deviate without explicit user approval. In QA mode, flag any code that doesn't match DESIGN.md.

Tokens live in [mobile/constants/theme.ts](mobile/constants/theme.ts) — admin will mirror the same tokens in `admin/src/styles/theme.ts`.

## Brand

Colors come straight from the logo:

- Primary magenta `#B02080`
- Deep purple `#702070`
- Blush pink `#D080A0`

Estrogen is a NEW brand from Al-Mishari Hospital. Never use "since 1986" / "40-year heritage" framing for Estrogen itself — that history belongs to the parent hospital.

## Run

```bash
cd mobile
npm install
npm run web    # browser preview
npm run ios    # iOS simulator
npm run android # Android emulator
```

`npm run tsc` for the type check.

## gstack

Use the `/browse` skill from gstack for all web browsing. Never use `mcp__claude-in-chrome__*` tools.

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
