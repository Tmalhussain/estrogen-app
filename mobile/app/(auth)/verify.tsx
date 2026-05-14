import { useEffect, useRef, useState } from 'react';
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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';
import { colors, font, radius, space } from '@/constants/theme';

const RESEND_AFTER_SEC = 30;

/**
 * Step 2 of phone-OTP. Enter the 6-digit code, optionally a first name
 * if this is a brand new user. Calls /auth/verify-otp; success drops
 * the user into /(tabs).
 */
export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { phoneNumber } = useLocalSearchParams<{ phoneNumber: string }>();
  const { verifyOtp, sendOtp } = useAuth();

  // Pre-fill the dev bypass code in development so the flow auto-submits
  // and lands on the home tab without needing to look up the real OTP in
  // the server log. In a production build (__DEV__ is false) this is empty
  // and the user types their real code.
  const [code, setCode] = useState(__DEV__ ? '000000' : '');
  const [firstName, setFirstName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(RESEND_AFTER_SEC);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  // Ref guard so the auto-submit useEffect can't double-fire while the
  // first verify-otp request is still in flight. setSubmitting(true) is
  // batched by React; checking it inside the effect doesn't catch a
  // synchronous re-render race.
  const inFlight = useRef(false);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  const submit = async () => {
    if (code.length !== 6) return;
    if (needsName && !firstName.trim()) return;
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setSubmitting(true);
    try {
      const { isNewUser } = await verifyOtp({
        phoneNumber: String(phoneNumber),
        code,
        firstName: firstName.trim() || undefined,
      });
      router.replace('/(tabs)');
      void isNewUser;
    } catch (err) {
      setError(translate(err, code));
      if (err instanceof ApiError && err.code === 'first_name_required_for_signup') {
        setNeedsName(true);
      } else {
        setCode('');
        inputRef.current?.focus();
      }
    } finally {
      setSubmitting(false);
      inFlight.current = false;
    }
  };

  const onResend = async () => {
    setError(null);
    setResending(true);
    try {
      await sendOtp(String(phoneNumber));
      setResendCountdown(RESEND_AFTER_SEC);
      setCode('');
      inputRef.current?.focus();
    } catch (err) {
      setError(translate(err, code));
    } finally {
      setResending(false);
    }
  };

  // Auto-submit as soon as 6 digits are entered (and we don't need a name).
  useEffect(() => {
    if (code.length === 6 && !needsName && !submitting) {
      void submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, needsName]);

  const masked = formatPhone(String(phoneNumber));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.body,
          {
            paddingTop: insets.top + space.lg,
            paddingBottom: insets.bottom + space.xxl,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>

        <Text style={styles.title}>Enter the 6-digit code</Text>
        <Text style={styles.subtitle}>Sent to {masked}.</Text>

        <Pressable
          onPress={() => inputRef.current?.focus()}
          style={styles.codeRow}
          accessibilityRole="button"
          accessibilityLabel="Enter verification code"
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const ch = code[i] ?? '';
            const isActive = i === code.length;
            return (
              <View
                key={i}
                style={[styles.codeBox, isActive && styles.codeBoxActive]}
              >
                <Text style={styles.codeDigit}>{ch}</Text>
              </View>
            );
          })}
        </Pressable>
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoComplete="sms-otp"
          textContentType="oneTimeCode"
          autoFocus
          // Hidden input that drives the visual boxes above.
          style={styles.hiddenInput}
        />

        {needsName ? (
          <View style={{ marginTop: space.xl }}>
            <Text style={styles.label}>First name</Text>
            <View style={styles.nameWrap}>
              <Ionicons name="person-outline" size={18} color={colors.textMuted} />
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="What should we call you?"
                placeholderTextColor={colors.textMuted}
                autoComplete="given-name"
                textContentType="givenName"
                autoFocus
                style={styles.nameInput}
                onSubmitEditing={submit}
                returnKeyType="done"
              />
            </View>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {needsName ? (
          <Button
            label="Create account"
            onPress={submit}
            loading={submitting}
            disabled={code.length !== 6 || !firstName.trim()}
            size="lg"
            style={{ marginTop: space.xl }}
          />
        ) : null}

        <View style={styles.resendRow}>
          {resendCountdown > 0 ? (
            <Text style={styles.resendCountdown}>
              Resend in {resendCountdown}s
            </Text>
          ) : (
            <Pressable
              onPress={onResend}
              disabled={resending}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.resendLink}>
                {resending ? 'Sending…' : 'Resend code'}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function formatPhone(e164: string): string {
  // +9665XXXXXXXX → +966 5X XXX XX•• (mask last 2)
  if (!/^\+9665\d{8}$/.test(e164)) return e164;
  const local = e164.slice(4);
  return `+966 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)}••`;
}

function translate(err: unknown, code: string): string {
  if (err instanceof ApiError) {
    if (err.code === 'wrong_code') {
      const remaining = (err.details as { remaining?: number })?.remaining;
      return remaining !== undefined
        ? `Wrong code. ${remaining} ${remaining === 1 ? 'try' : 'tries'} left.`
        : 'Wrong code. Try again.';
    }
    if (err.code === 'too_many_verify_attempts')
      return 'Too many tries. Tap "Resend code" to start over.';
    if (err.code === 'no_active_otp')
      return 'That code expired. Tap "Resend code" for a new one.';
    if (err.code === 'invalid_code_format' && code.length === 6)
      return 'Invalid code. Please re-enter.';
    if (err.code === 'first_name_required_for_signup')
      return 'New user — please tell us your first name.';
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
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
    marginBottom: space.xxl,
  },
  codeRow: {
    flexDirection: 'row',
    gap: space.sm,
    justifyContent: 'space-between',
  },
  codeBox: {
    flex: 1,
    aspectRatio: 0.85,
    borderRadius: radius.lg,
    backgroundColor: colors.bgAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  codeDigit: {
    fontSize: font.size.display,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
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
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    height: 52,
  },
  nameInput: {
    flex: 1,
    fontSize: font.size.md,
    color: colors.text,
  },
  error: {
    color: colors.danger,
    fontSize: font.size.sm,
    fontWeight: font.weight.semi,
    marginTop: space.lg,
    marginLeft: space.sm,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: space.xxl,
  },
  resendCountdown: {
    fontSize: font.size.sm,
    color: colors.textMuted,
  },
  resendLink: {
    fontSize: font.size.sm,
    color: colors.primary,
    fontWeight: font.weight.bold,
  },
});
