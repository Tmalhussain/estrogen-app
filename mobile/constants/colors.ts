/**
 * Estrogen Pharmacy — Brand Color System
 *
 * LOCKED: Variant A "Bright & Airy" via /design-shotgun on 2026-05-05.
 * Source of truth: /Users/mishari/Estrogen pharmacy app/DESIGN.md
 * Brand colors extracted directly from logo.jpeg.
 *
 * Do NOT modify these values without re-running /design-shotgun and
 * updating DESIGN.md. The "primary" / "primaryDark" / "primaryLight"
 * keys are kept as aliases pointing at the canonical brand tokens
 * (magenta / purple / pink) so existing screens keep working without
 * a sweeping rename.
 */
export const Colors = {
  // ── Brand (canonical names, extracted from logo) ───
  magenta:      '#B8267E', // primary CTA, brand wordmark, status accents
  magentaDeep:  '#9C1F6B', // hover/pressed magenta
  purple:       '#5B1F65', // headings, deep accent on light bg
  purpleDeep:   '#3D1245', // pressed purple, dark hero
  pink:         '#E89AB6', // soft accent, badges, illustrations
  pinkSoft:     '#FBEAF1', // reorder card backgrounds
  pinkMist:     '#FDF5F8', // even softer surface variant
  hairlinePink: '#F5DCE6', // pink-coded card borders, dividers

  // ── Aliases (back-compat with existing screens) ─────
  primary:      '#B8267E', // → magenta
  primaryDark:  '#5B1F65', // → purple
  primaryLight: '#E89AB6', // → pink
  primarySoft:  '#FBEAF1', // → pinkSoft
  primaryMuted: '#F5DCE6', // → hairlinePink

  // ── Accent (back-compat) ─────────────────────────────
  accent:       '#B8267E', // → magenta (same as primary; pink-as-accent retired)
  accentLight:  '#FBEAF1', // → pinkSoft

  // ── Semantic ─────────────────────────────────────────
  success:      '#1E9F6E',
  successLight: '#E8F8F2',
  warning:      '#C97A1A',
  warningLight: '#FDF4E8',
  danger:       '#D63B5A',
  dangerLight:  '#FCEBEF',
  info:         '#5B1F65', // info uses brand purple, not generic blue
  infoLight:    '#F4ECF6',

  // ── Typography ───────────────────────────────────────
  text:          '#1A0F1F', // purple-tinted ink, harmonizes with brand
  textSecondary: '#6B6373',
  textTertiary:  '#9E96A8',
  textInverse:   '#FFFFFF',
  textBrand:     '#5B1F65', // headings using brand purple
  textAccent:    '#B8267E', // emphasized words in headings

  // ── Surfaces ─────────────────────────────────────────
  background:       '#FFFFFF', // PURE WHITE per Variant A lock
  surface:          '#FFFFFF',
  surfaceHover:     '#FAFAFB',
  surfaceSecondary: '#FBEAF1', // card surfaces are pink-tinted, not gray

  // ── Borders ──────────────────────────────────────────
  border:      '#ECEAEF',
  borderLight: '#F5F3F8',
  borderFocus: '#B8267E',
  borderCard:  '#F5DCE6', // pink-tinted card borders (Variant A pattern)

  // ── Utility ──────────────────────────────────────────
  white:        '#FFFFFF',
  black:        '#000000',
  transparent:  'transparent',
  overlay:      'rgba(26, 15, 31, 0.5)',
  overlayLight: 'rgba(184, 38, 126, 0.06)',

  // ── Life-stage palette (Variant A: subtle pink-coded tints) ──
  // Replaces the rainbow category palette. All life stages share the
  // brand pink-soft surface; differentiation comes from icons + names.
  catYoungGirls: '#FBEAF1',
  catLadies:     '#FBEAF1',
  catMothers:    '#FBEAF1',
  catGoldenYears:'#FBEAF1',

  // ── Old category palette (back-compat alias) ───────────
  // Kept as aliases so old screens still build. New screens use
  // catYoungGirls / catLadies / catMothers / catGoldenYears or
  // pinkSoft directly.
  catPregnancy:  '#FBEAF1',
  catVitamins:   '#FBEAF1',
  catHormonal:   '#FBEAF1',
  catSkincare:   '#FBEAF1',
  catMenstrual:  '#FBEAF1',
  catChronic:    '#FBEAF1',
  catPostpartum: '#FBEAF1',
  catPain:       '#FBEAF1',
};

export default Colors;
