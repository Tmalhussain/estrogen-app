import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Icon, type IconName } from './Icon';
import { useTranslation } from '../../i18n/useTranslation';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { bg: string; activeBg: string; border?: string; textColor: string; spinnerColor: string }
> = {
  primary: {
    bg: Colors.primary,
    activeBg: Colors.primaryDark,
    textColor: Colors.white,
    spinnerColor: Colors.white,
  },
  outline: {
    bg: Colors.transparent,
    activeBg: Colors.primarySoft,
    border: Colors.primary,
    textColor: Colors.primary,
    spinnerColor: Colors.primary,
  },
  ghost: {
    bg: Colors.transparent,
    activeBg: Colors.primarySoft,
    textColor: Colors.primary,
    spinnerColor: Colors.primary,
  },
  danger: {
    bg: Colors.danger,
    activeBg: '#B91C1C',
    textColor: Colors.white,
    spinnerColor: Colors.white,
  },
};

const SIZE_STYLES: Record<ButtonSize, { paddingV: number; paddingH: number; fontSize: number; iconSize: number; radius: number }> = {
  sm: { paddingV: 8, paddingH: 16, fontSize: 13, iconSize: 16, radius: 10 },
  md: { paddingV: 14, paddingH: 24, fontSize: 15, iconSize: 18, radius: 12 },
  lg: { paddingV: 18, paddingH: 32, fontSize: 17, iconSize: 20, radius: 16 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];
  const { isRTL, flexDir } = useTranslation();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        { flexDirection: flexDir },
        {
          backgroundColor: v.bg,
          paddingVertical: s.paddingV,
          paddingHorizontal: s.paddingH,
          borderRadius: s.radius,
        },
        v.border ? { borderWidth: 1.5, borderColor: v.border } : undefined,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.spinnerColor} size="small" />
      ) : (
        <>
          {icon && (
            <Icon
              name={icon}
              size={s.iconSize}
              color={v.textColor}
              // Use logical margin so the icon sits next to the label
              // on the trailing side regardless of writing direction.
              style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }}
            />
          )}
          <Text
            numberOfLines={1}
            style={[
              styles.text,
              { color: v.textColor, fontSize: s.fontSize },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
    flexShrink: 1,
  },
});
