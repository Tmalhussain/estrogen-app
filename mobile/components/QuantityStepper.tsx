import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, radius, space } from '@/constants/theme';

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <View style={styles.row}>
      <StepperButton icon="remove" onPress={dec} disabled={value <= min} />
      <Text style={styles.value}>{value}</Text>
      <StepperButton icon="add" onPress={inc} disabled={value >= max} />
    </View>
  );
}

function StepperButton({
  icon,
  onPress,
  disabled,
}: {
  icon: 'add' | 'remove';
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={10}
      style={({ pressed }) => [
        styles.btn,
        pressed && !disabled && { backgroundColor: colors.primaryDim },
        disabled && { opacity: 0.4 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={icon === 'add' ? 'Increase quantity' : 'Decrease quantity'}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgAlt,
    borderRadius: radius.pill,
    paddingHorizontal: space.xs,
    height: 44,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: font.size.md,
    fontWeight: font.weight.semi,
    color: colors.text,
  },
});
