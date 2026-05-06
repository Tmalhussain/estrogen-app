import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, space } from '@/constants/theme';

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
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
  title: {
    fontSize: font.size.xl,
    color: colors.text,
    fontWeight: font.weight.bold,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  action: {
    fontSize: font.size.sm,
    color: colors.primary,
    fontWeight: font.weight.semi,
  },
});
