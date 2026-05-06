# Estrogen Pharmacy — Mobile App

A women's pharmacy delivery app for Saudi Arabia, built on **React Native + Expo SDK 56**. Frontend-only with placeholder data — no backend dependencies.

## Run it

```bash
cd mobile
npm install
npm run web        # browser preview
npm run ios        # iOS simulator (requires Xcode)
npm run android    # Android emulator (requires Android Studio)
```

That's it. No env vars, no Firebase, no backend.

## What's in the app

A complete frontend slice of the order flow:

- **Home** — greeting, search, hero banners, category tiles, featured + best-seller carousels, live delivery tracker
- **Shop** — full catalog with category chips, Rx-only / in-stock filters, search
- **Product detail** — gallery, ratings, pregnancy-safe / Rx tags, pharmacist note, quantity stepper, add-to-cart
- **Cart** — line-item editing, free-delivery threshold, VAT breakdown
- **Checkout** — address picker, delivery options, four payment methods, order summary
- **Orders** — active vs past tabs, status pills, item previews
- **Order detail** — live tracking timeline, driver card with call/chat, full receipt
- **Profile** — branded hero with stats, sectioned settings list

Cart state is held in a React context — no AsyncStorage, no API.

## Brand

The visual system is derived directly from `logo.jpeg` (kept at the repo root):

- **Primary magenta** `#B02080` — geometric frame
- **Deep purple** `#702070` — wordmark
- **Blush pink** `#D080A0` — silhouette accents

App icon, adaptive icon, splash screen, and favicon are all generated from the logo into [mobile/assets/images/](mobile/assets/images/).

## Project layout

```
mobile/
├── app/                   # expo-router file-based routes
│   ├── _layout.tsx        # root stack + providers
│   ├── (tabs)/            # bottom tab nav
│   ├── product/[id].tsx
│   ├── order/[id].tsx
│   └── checkout.tsx
├── components/            # Logo, Pill, Button, ProductCard, etc.
├── constants/theme.ts     # palette, spacing, radius, typography, shadow
├── data/                  # placeholder products + orders
├── hooks/useCart.tsx      # cart context
└── assets/images/         # logo, icon, splash, favicon
```

## Tech

- Expo SDK 56 (preview)
- React 19.2 / React Native 0.85
- TypeScript strict mode
- expo-router 56 (typed routes enabled)
- expo-image, expo-haptics, expo-splash-screen
- @expo/vector-icons (Ionicons)
- react-native-safe-area-context, react-native-gesture-handler

## Type check

```bash
cd mobile
npm run tsc
```
