import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Icon } from './Icon';
import { useTranslation } from '../../i18n/useTranslation';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  suffix?: React.ReactNode;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  suffix,
  isPassword,
  style,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const { isRTL, align, flexDir } = useTranslation();

  const borderColor = error
    ? Colors.danger
    : isFocused
      ? Colors.borderFocus
      : Colors.border;

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { textAlign: align }]}>{label}</Text>}
      <View style={[styles.row, { borderColor, flexDirection: flexDir }]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          textAlign={align as 'left' | 'right'}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={[styles.iconButton, isRTL ? { marginLeft: 8 } : { marginRight: 8 }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Icon
              name={showPassword ? 'eyeOff' : 'eye'}
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
        {suffix && (
          <View style={[styles.iconButton, isRTL ? { marginLeft: 8 } : { marginRight: 8 }]}>
            {suffix}
          </View>
        )}
      </View>
      {error && <Text style={[styles.error, { textAlign: align }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
  },
  row: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.text,
  },
  iconButton: {
    padding: 4,
  },
  error: {
    fontSize: 12,
    color: Colors.danger,
    marginTop: 4,
  },
});
