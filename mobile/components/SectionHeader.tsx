import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '@/constants/theme';

/**
 * Big editorial section header — patterned on estrogenpharmacy.com.
 *
 * Layout:
 *   EYEBROW (small, uppercase, brand-colored)
 *   Section Title (large, bold-800, no negative tracking)
 *   Optional subtitle (muted, body-sized)
 *
 * The optional `actionLabel` ("See all", etc.) sits to the right.
 */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  eyebrow: {
    fontSize: font.size.xxs,
    color: colors.primary,
    fontFamily: font.family.semi,
    fontWeight: font.weight.semi,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: font.size.sectionH2,
    lineHeight: 38,
    color: colors.primary, // brand purple — matches estrogenpharmacy.com
    fontFamily: font.family.bold,
    fontWeight: font.weight.black, // 800
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: font.size.md,
    color: colors.textMuted,
    marginTop: 6,
  },
  action: {
    fontSize: font.size.sm,
    color: colors.primary,
    fontWeight: font.weight.semi,
  },
});
