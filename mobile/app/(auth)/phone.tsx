import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';
import { colors, font, radius, space } from '@/constants/theme';

/**
 * Step 1 of phone-OTP signup/login: enter Saudi mobile number.
 *
 * Backend normalizes any of "0501234567" / "+966 50 123 4567" / "501234567"
 * into E.164 +9665XXXXXXXX. The UI accepts both local (05…) and E.164.
 */
export default function PhoneScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { sendOtp } = useAuth();
  // In dev (expo start), pre-fill the demo phone so a tap-tap flow lands
  // the dev on the home tab. The matching backend bypass accepts the
  // dev-only code 000000 for any phone when SMS_PROVIDER=console.
  const [phone, setPhone] = useState(__DEV__ ? '0500000000' : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = looksLikeSaudi(phone);

  const onSubmit = async () => {
    if (!valid) return;
    setError(null);
    setSubmitting(true);
    try {
      const normalized = toE164(phone);
      await sendOtp(normalized);
      router.push({
        pathname: '/(auth)/verify',
        params: { phoneNumber: normalized },
      });
    } catch (err) {
      setError(translate(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.body,
          {
            paddingTop: insets.top + space.xxl,
            paddingBottom: insets.bottom + space.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <Logo size={56} variant="mark" />
          <Text style={styles.brandWord}>estrogen</Text>
        </View>

        <Text style={styles.title}>Sign in or sign up</Text>
        <Text style={styles.subtitle}>
          Enter your Saudi mobile number. We'll text you a 6-digit code.
        </Text>

        <Text style={styles.label}>Mobile number</Text>
        <View style={styles.inputWrap}>
          <Text style={styles.prefix}>+966</Text>
          <View style={styles.inputDivider} />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="5X XXX XXXX"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            autoFocus
            style={styles.input}
            onSubmitEditing={onSubmit}
            returnKeyType="next"
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Send code"
          onPress={onSubmit}
          loading={submitting}
          disabled={!valid}
          size="lg"
          style={{ marginTop: space.xl }}
          trailingIcon={
            <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
          }
        />

        <Text style={styles.disclaimer}>
          By continuing you agree to our terms of service and privacy policy.
          Standard SMS rates may apply.
        </Text>

        {__DEV__ ? (
          <View style={styles.devBanner}>
            <Ionicons name="construct-outline" size={14} color={colors.warning} />
            <Text style={styles.devBannerText}>
              Dev mode — any code 000000 verifies any phone. Real SMS only when
              SMS_PROVIDER=unifonic.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function looksLikeSaudi(input: string): boolean {
  const stripped = input.replace(/[^\d+]/g, '');
  if (/^\+9665\d{8}$/.test(stripped)) return true;
  if (/^9665\d{8}$/.test(stripped)) return true;
  if (/^05\d{8}$/.test(stripped)) return true;
  if (/^5\d{8}$/.test(stripped)) return true;
  return false;
}

function toE164(input: string): string {
  const stripped = input.replace(/[^\d+]/g, '');
  if (stripped.startsWith('+')) return stripped;
  if (stripped.startsWith('966')) return `+${stripped}`;
  if (stripped.startsWith('05')) return `+966${stripped.slice(1)}`;
  if (stripped.startsWith('5')) return `+966${stripped}`;
  return stripped;
}

function translate(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'invalid_phone_number')
      return 'Please enter a valid Saudi mobile number.';
    if (err.code === 'too_many_sends')
      return 'Too many requests. Please try again in 15 minutes.';
    if (err.code === 'sms_send_failed')
      return 'We couldn’t send the SMS. Please try again.';
    if (err.code === 'network_error')
      return 'Could not reach the server. Check your connection.';
    return err.code.replace(/_/g, ' ');
  }
  return 'Something went wrong. Please try again.';
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.lg,
    minHeight: '100%',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginBottom: space.xxl,
  },
  brandWord: {
    fontSize: font.size.xl,
    color: colors.accent,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.4,
  },
  title: {
    fontSize: font.size.display,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: font.size.md,
    color: colors.textSoft,
    marginTop: space.xs,
    marginBottom: space.xl,
    lineHeight: 22,
  },
  label: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: space.xs,
    marginLeft: space.sm,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgAlt,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    height: 56,
  },
  prefix: {
    fontSize: font.size.md,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
    fontVariant: ['tabular-nums'],
  },
  inputDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: space.md,
  },
  input: {
    flex: 1,
    fontSize: font.size.md,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  error: {
    color: colors.danger,
    fontSize: font.size.sm,
    fontWeight: font.weight.semi,
    marginTop: space.lg,
    marginLeft: space.sm,
  },
  disclaimer: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space.xxl,
    paddingHorizontal: space.md,
    lineHeight: 18,
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginTop: space.lg,
  },
  devBannerText: {
    flex: 1,
    fontSize: font.size.xxs,
    color: colors.warning,
    fontWeight: font.weight.semi,
    lineHeight: 16,
  },
});
