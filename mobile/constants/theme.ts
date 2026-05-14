/**
 * Brand tokens for Estrogen Pharmacy mobile.
 *
 * Aligned 2026-05-07 to match the existing customer site
 * estrogenpharmacy.com:
 *   - Monochromatic deep purple (#752A79) as the single brand accent
 *   - Pure white page background
 *   - Big bold H2 sections (32–40px / weight 800), letter-spacing normal
 *   - Pill-ish CTAs at 24px radius
 *
 * See DESIGN.md for the full system. This file mirrors the same
 * palette in admin/src/styles/theme.ts — keep them in sync.
 */

export const palette = {
  white: '#FFFFFF',

  // Single brand color, used 397x on estrogenpharmacy.com.
  brand: '#752A79',
  brandDark: '#5A1F5E',
  brandSoft: '#F3E5F5',
  brandOn: '#FFF6FF', // tinted near-white used as fg on brand bg

  // Neutrals (warm, purple-leaning gray family — pairs with brand)
  ink: '#1A0F1A',
  inkSoft: '#4A3A4A',
  inkMuted: '#8A7A8A',
  hairline: '#ECE5EC',
  surface: '#FAF7FA',

  // Semantic — only used on status pills, alerts, metric deltas
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
  bg: palette.white, // page background, EVERYWHERE
  bgAlt: palette.surface,
  card: palette.white,
  text: palette.ink,
  textSoft: palette.inkSoft,
  textMuted: palette.inkMuted,
  border: palette.hairline,
  divider: palette.hairline,

  primary: palette.brand,
  primaryDark: palette.brandDark,
  onPrimary: palette.brandOn,
  primaryDim: palette.brandSoft,

  // Legacy aliases — kept so existing components compile while we migrate.
  // These point at the same brand color; remove the references one by one
  // and then drop these aliases in a follow-up.
  accent: palette.brand,
  accentSoft: palette.brandSoft,
  blush: palette.brand,
  blushSoft: palette.brandSoft,

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
  cta: 24, // primary CTA pill — matches estrogenpharmacy.com
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
} as const;

export const font = {
  family: {
    regular: 'DMSans_400Regular',
    medium: 'DMSans_500Medium',
    semi: 'DMSans_600SemiBold',
    bold: 'DMSans_700Bold',
    black: 'DMSans_700Bold', // 800 falls back to 700 in current font config; bump file later
    arRegular: 'Tajawal_400Regular',
    arMedium: 'Tajawal_500Medium',
    arBold: 'Tajawal_700Bold',
  },
  size: {
    xxs: 11,
    xs: 12,
    sm: 13,
    md: 15, // matches estrogenpharmacy.com body 15px
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 30,
    sectionH2: 32, // big section heading on Home / Shop — inspo uses 40 on web, 32 reads well on mobile
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semi: '600' as const,
    bold: '700' as const,
    black: '800' as const,
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#2A0A1F',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  floating: {
    shadowColor: '#2A0A1F',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const layout = {
  minTouch: 48,
  screenPadding: space.lg,
  tabBarHeight: 64,
} as const;
