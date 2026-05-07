import { Text, View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, font, radius, space } from '@/constants/theme';

type Tone = 'info' | 'success' | 'warning' | 'danger' | 'neutral' | 'accent';

const TONE: Record<Tone, { bg: string; fg: string }> = {
  info: { bg: colors.primaryDim, fg: colors.primary },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  neutral: { bg: colors.bgAlt, fg: colors.textSoft },
  accent: { bg: colors.accentSoft, fg: colors.accent },
};

export function Pill({
  label,
  tone = 'info',
  style,
}: {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}) {
  const t = TONE[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }, style]}>
      <Text style={[styles.label, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: space.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: font.size.xxs,
    fontWeight: font.weight.semi,
    letterSpacing: 0.2,
  },
});
