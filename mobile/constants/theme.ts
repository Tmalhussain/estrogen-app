/**
 * Brand tokens derived directly from logo.png.
 * Sampling produced three dominant non-white colors:
 *   #702070  deep purple   (wordmark)
 *   #B02080  magenta       (geometric frame)
 *   #D080A0  blush pink    (silhouette accents)
 */

export const palette = {
  white: '#FFFFFF',
  cream: '#FBF7FA',
  ink: '#1A0F1A',
  inkSoft: '#4A3A4A',
  inkMuted: '#8A7A8A',
  hairline: '#EDE6EC',
  surface: '#F8F4F8',

  primary: '#B02080',
  primaryDark: '#8A1866',
  primarySoft: '#F3D9E9',

  plum: '#702070',
  plumDark: '#561856',
  plumSoft: '#E9D9E9',

  blush: '#D080A0',
  blushSoft: '#F8E8EF',

  success: '#1F8F5F',
  successSoft: '#DDF1E7',
  warning: '#C77B0A',
  warningSoft: '#FBEDD3',
  danger: '#C8253A',
  dangerSoft: '#FBE0E4',
} as const;

export const colors = {
  bg: palette.white,
  bgAlt: palette.cream,
  card: palette.white,
  text: palette.ink,
  textSoft: palette.inkSoft,
  textMuted: palette.inkMuted,
  border: palette.hairline,
  divider: palette.surface,

  primary: palette.primary,
  onPrimary: palette.white,
  primaryDim: palette.primarySoft,

  accent: palette.plum,
  accentSoft: palette.plumSoft,

  blush: palette.blush,
  blushSoft: palette.blushSoft,

  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
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
    arRegular: 'Tajawal_400Regular',
    arMedium: 'Tajawal_500Medium',
    arBold: 'Tajawal_700Bold',
  },
  size: {
    xxs: 11,
    xs: 12,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    display: 30,
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
    shadowOpacity: 0.06,
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
