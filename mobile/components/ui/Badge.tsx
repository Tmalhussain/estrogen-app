import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { Icon, type IconName } from './Icon';
import { useTranslation } from '../../i18n/useTranslation';

type BadgeType = 'primary' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  label: string;
  type?: BadgeType;
  small?: boolean;
  icon?: IconName;
}

const TYPE_COLORS: Record<BadgeType, { bg: string; text: string }> = {
  primary: { bg: Colors.primarySoft, text: Colors.primary },
  success: { bg: Colors.successLight, text: Colors.success },
  warning: { bg: Colors.warningLight, text: Colors.warning },
  danger:  { bg: Colors.dangerLight, text: Colors.danger },
  info:    { bg: Colors.infoLight, text: Colors.info },
};

export function Badge({ label, type = 'primary', small = false, icon }: BadgeProps) {
  const colors = TYPE_COLORS[type];
  const iconSize = small ? 10 : 12;
  const fontSize = small ? 11 : 12;
  const borderRadius = small ? 6 : 8;
  const paddingVertical = small ? 2 : 4;
  const paddingHorizontal = small ? 8 : 10;
  const { isRTL, flexDir } = useTranslation();

  return (
    <View
      style={[
        styles.base,
        { flexDirection: flexDir },
        {
          backgroundColor: colors.bg,
          borderRadius,
          paddingVertical,
          paddingHorizontal,
        },
      ]}
    >
      {icon && (
        <Icon
          name={icon}
          size={iconSize}
          color={colors.text}
          style={isRTL ? { marginLeft: 4 } : { marginRight: 4 }}
        />
      )}
      <Text numberOfLines={1} style={[styles.text, { color: colors.text, fontSize }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: '600',
    flexShrink: 1,
  },
});
