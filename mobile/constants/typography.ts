/**
 * Estrogen Pharmacy — Typography System
 * LOCKED via /design-consultation + /design-shotgun on 2026-05-05.
 * Source of truth: DESIGN.md
 *
 * NOTE on fonts: the team has @expo-google-fonts/cairo installed.
 * Cairo is a humanist Arabic sans similar in feel to Tajawal (the
 * original DESIGN.md pick). Both are valid Saudi-friendly choices.
 * We use Cairo here pragmatically; Tajawal can be swapped in later
 * if desired by replacing the family name strings.
 */

export const FontFamily = {
  // Latin (English) — DM Sans is the locked English family.
  // Until @expo-google-fonts/dm-sans is installed, fall back to system.
  // Run: npx expo install @expo-google-fonts/dm-sans
  enRegular: 'DMSans_400Regular',
  enMedium:  'DMSans_500Medium',
  enBold:    'DMSans_700Bold',

  // Arabic — Cairo (already installed). Tajawal is the future option.
  arRegular: 'Cairo_400Regular',
  arMedium:  'Cairo_500Medium',
  arBold:    'Cairo_700Bold',

  // Mono — IBM Plex Mono for receipts and order codes.
  monoRegular: 'IBMPlexMono_400Regular',
  monoMedium:  'IBMPlexMono_500Medium',
} as const;

/**
 * Modular type scale.
 * Body floor at 17px (not 16) for elderly accessibility.
 */
export const FontSize = {
  '2xs': 11,
  xs:    13,
  sm:    15, // mobile body floor
  md:    17, // DEFAULT body
  lg:    20,
  xl:    24,
  '2xl': 32,
  '3xl': 44,
  '4xl': 60, // web hero only
} as const;

export const LineHeight = {
  tight: 1.1,
  snug:  1.2,
  base:  1.5,
  loose: 1.65, // Arabic prefers slightly looser line height
} as const;

export const LetterSpacing = {
  tight:   -0.025,
  snug:    -0.015,
  normal:   0,
  wide:     0.04,
  wider:    0.12,
  widest:   0.18,
} as const;

/**
 * Pre-built text styles for common roles.
 * Use in StyleSheet:
 *   const styles = StyleSheet.create({ heading: TextStyles.h1 });
 */
export const TextStyles = {
  h1: {
    fontFamily: FontFamily.enBold,
    fontSize: FontSize['3xl'],
    lineHeight: FontSize['3xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
  },
  h2: {
    fontFamily: FontFamily.enBold,
    fontSize: FontSize['2xl'],
    lineHeight: FontSize['2xl'] * LineHeight.snug,
    letterSpacing: LetterSpacing.snug,
  },
  h3: {
    fontFamily: FontFamily.enBold,
    fontSize: FontSize.xl,
    lineHeight: FontSize.xl * LineHeight.snug,
  },
  greeting: {
    fontFamily: FontFamily.enBold,
    fontSize: 26,
    lineHeight: 26 * LineHeight.tight,
    letterSpacing: LetterSpacing.snug,
  },
  body: {
    fontFamily: FontFamily.enRegular,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.base,
  },
  bodyBold: {
    fontFamily: FontFamily.enBold,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.base,
  },
  bodySm: {
    fontFamily: FontFamily.enRegular,
    fontSize: FontSize.sm,
    lineHeight: FontSize.sm * LineHeight.base,
  },
  caption: {
    fontFamily: FontFamily.enRegular,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.base,
  },
  label: {
    fontFamily: FontFamily.enMedium,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.base,
    letterSpacing: LetterSpacing.widest,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: FontFamily.enMedium,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.snug,
  },
  pill: {
    fontFamily: FontFamily.enMedium,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.snug,
  },
  mono: {
    fontFamily: FontFamily.monoRegular,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.base,
  },
} as const;

/**
 * Arabic variants. Use these when isRTL or locale === 'ar'.
 * Arabic prefers slightly larger sizes and looser line height
 * for the same visual weight.
 */
export const TextStylesAr = {
  h1: {
    fontFamily: FontFamily.arBold,
    fontSize: FontSize['3xl'] - 6, // Arabic visually larger at same px
    lineHeight: (FontSize['3xl'] - 6) * LineHeight.loose,
  },
  h2: {
    fontFamily: FontFamily.arBold,
    fontSize: FontSize['2xl'] - 4,
    lineHeight: (FontSize['2xl'] - 4) * LineHeight.loose,
  },
  h3: {
    fontFamily: FontFamily.arBold,
    fontSize: FontSize.xl - 2,
    lineHeight: (FontSize.xl - 2) * LineHeight.loose,
  },
  greeting: {
    fontFamily: FontFamily.arBold,
    fontSize: 22,
    lineHeight: 22 * LineHeight.loose,
  },
  body: {
    fontFamily: FontFamily.arRegular,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.loose,
  },
  bodyBold: {
    fontFamily: FontFamily.arBold,
    fontSize: FontSize.md,
    lineHeight: FontSize.md * LineHeight.loose,
  },
  caption: {
    fontFamily: FontFamily.arRegular,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.loose,
  },
  label: {
    fontFamily: FontFamily.arBold, // Arabic doesn't uppercase, use bold instead
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.loose,
  },
  pill: {
    fontFamily: FontFamily.arBold,
    fontSize: FontSize.xs,
    lineHeight: FontSize.xs * LineHeight.snug,
  },
} as const;

export default { FontFamily, FontSize, LineHeight, LetterSpacing, TextStyles, TextStylesAr };
