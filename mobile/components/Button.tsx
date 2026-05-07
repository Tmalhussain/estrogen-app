import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, font, layout, radius, space } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  leadingIcon,
  trailingIcon,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = stylesForVariant(variant);
  const dims = stylesForSize(size);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg, borderColor: palette.border },
        dims.container,
        pressed && !isDisabled && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.row}>
          {leadingIcon}
          <Text
            style={[
              styles.label,
              { color: palette.fg, fontSize: dims.label },
              leadingIcon ? { marginLeft: space.sm } : null,
              trailingIcon ? { marginRight: space.sm } : null,
            ]}
          >
            {label}
          </Text>
          {trailingIcon}
        </View>
      )}
    </Pressable>
  );
}

function stylesForVariant(variant: Variant) {
  switch (variant) {
    case 'primary':
      return { bg: colors.primary, fg: colors.onPrimary, border: colors.primary };
    case 'secondary':
      return { bg: colors.primaryDim, fg: colors.primary, border: colors.primaryDim };
    case 'danger':
      return { bg: colors.danger, fg: colors.onPrimary, border: colors.danger };
    case 'ghost':
    default:
      return { bg: 'transparent', fg: colors.text, border: colors.border };
  }
}

function stylesForSize(size: Size) {
  switch (size) {
    case 'sm':
      return {
        container: { height: 40, paddingHorizontal: space.lg } as ViewStyle,
        label: font.size.sm,
      };
    case 'lg':
      return {
        container: { height: 56, paddingHorizontal: space.xxl } as ViewStyle,
        label: font.size.lg,
      };
    case 'md':
    default:
      return {
        container: { height: layout.minTouch, paddingHorizontal: space.xl } as ViewStyle,
        label: font.size.md,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: font.weight.semi,
  },
});
