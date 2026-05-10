/**
 * Design tokens — admin web side.
 *
 * Aligned 2026-05-07 to match the existing customer site
 * estrogenpharmacy.com (single deep-purple brand, pure white background).
 * Mirrors mobile/constants/theme.ts plus admin-specific additions
 * (Geist Mono for numerics, denser type scale).
 *
 * DO NOT diverge — keep this file in sync with mobile theme tokens. See DESIGN.md.
 */

export const palette = {
  white: '#FFFFFF',

  brand: '#752A79',
  brandDark: '#5A1F5E',
  brandSoft: '#F3E5F5',
  brandOn: '#FFF6FF',

  ink: '#1A0F1A',
  inkSoft: '#4A3A4A',
  inkMuted: '#8A7A8A',
  hairline: '#ECE5EC',
  surface: '#FAF7FA',

  success: '#1F8F5F',
  successSoft: '#DDF1E7',
  warning: '#C77B0A',
  warningSoft: '#FBEDD3',
  danger: '#C8253A',
  dangerSoft: '#FBE0E4',
  info: '#2563A8',
  infoSoft: '#DDE9F5',
} as const;

export const colors = {
  bg: palette.white,
  bgWhite: palette.white,
  card: palette.white,
  surface: palette.surface,
  text: palette.ink,
  textSoft: palette.inkSoft,
  textMuted: palette.inkMuted,
  border: palette.hairline,
  divider: palette.hairline,

  primary: palette.brand,
  primaryDark: palette.brandDark,
  onPrimary: palette.brandOn,
  primaryDim: palette.brandSoft,

  // Legacy aliases — same brand color, kept for compatibility while
  // the admin pages migrate off accent / accentSoft references.
  accent: palette.brand,
  accentSoft: palette.brandSoft,

  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  info: palette.info,
  infoSoft: palette.infoSoft,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  cta: 24,
  pill: 999,
} as const;

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
  jumbo: 64,
} as const;

export const font = {
  family: {
    sans: "'DM Sans', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
    ar: "'Tajawal', 'DM Sans', sans-serif",
    mono: "'Geist Mono', 'SF Mono', Menlo, monospace",
  },
  size: {
    xxs: 11,
    xs: 12,
    sm: 13,
    md: 14,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 30,
  },
  weight: {
    regular: 400 as const,
    medium: 500 as const,
    semi: 600 as const,
    bold: 700 as const,
    black: 800 as const,
  },
} as const;

export const shadow = {
  card: '0 0 0 1px rgba(42, 10, 31, 0.04)',
  drawer: '0 8px 24px rgba(42, 10, 31, 0.08)',
} as const;

export const layout = {
  sidebarWidth: 220,
  drawerWidth: 480,
  maxContentWidth: 1280,
  headerHeight: 64,
} as const;
