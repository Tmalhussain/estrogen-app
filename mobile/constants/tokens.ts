/**
 * Estrogen Pharmacy — Design Tokens
 * Spacing, radii, motion. LOCKED on 2026-05-05 (Variant A "Bright & Airy").
 * Source of truth: DESIGN.md
 */

/**
 * Spacing scale, base unit 4px.
 * Density: comfortable (not compact).
 */
export const Spacing = {
  '2xs':  2,
  xs:     4,
  sm:     8,
  md:    12,
  lg:    16,
  xl:    20, // Variant A page padding
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
  '5xl': 64,
  '6xl': 96,
  '7xl':128,
} as const;

/**
 * Border radius scale.
 * Cards use md (14px) for reorder, lg (18px) for status.
 * Pills use full (9999).
 */
export const Radii = {
  sm:    8,
  md:   14, // reorder cards, buttons
  lg:   18, // status card
  xl:   22, // sheets, modals (Variant C used this; Variant A capped at lg)
  full: 9999,
} as const;

/**
 * Touch target floors. 48px raised from iOS 44 floor for elderly accessibility.
 */
export const TouchTarget = {
  min:    48,
  comfortable: 56,
} as const;

/**
 * Motion. Intentional minimal — soft enough to feel trustworthy,
 * never delays the user.
 */
export const Motion = {
  duration: {
    micro:  120, // press feedback, instant transitions
    short:  220, // most animations
    medium: 360, // hero transitions, status state changes
  },
  easing: {
    enter: 'cubic-bezier(0.16, 1, 0.3, 1)', // gentle settle
    exit:  'cubic-bezier(0.4, 0, 1, 1)',     // ease-in
    move:  'cubic-bezier(0.4, 0, 0.2, 1)',   // ease-in-out
  },
} as const;

/**
 * Shadows. Variant A uses minimal shadows — most elevation is conveyed
 * via pink-tinted borders and surface differentiation, not drop shadows.
 */
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  // Subtle card shadow — used sparingly, never on Variant A reorder cards
  card: {
    shadowColor: '#5B1F65',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  // Floating button / sheet
  floating: {
    shadowColor: '#5B1F65',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

/**
 * Layout breakpoints (web/tablet only; mobile uses single-column).
 */
export const Breakpoints = {
  sm:  640,
  md:  768,
  lg: 1024,
  xl: 1280,
} as const;

/**
 * Z-index layers, named to prevent magic numbers.
 */
export const ZIndex = {
  base:        0,
  card:        1,
  header:     10,
  toast:      50,
  modal:     100,
  bottomSheet: 90,
} as const;

export default { Spacing, Radii, TouchTarget, Motion, Shadows, Breakpoints, ZIndex };
