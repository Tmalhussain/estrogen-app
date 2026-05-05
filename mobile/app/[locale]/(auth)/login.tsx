import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { Logo } from '../../../components/brand/Logo';
import { useTranslation } from '../../../i18n/useTranslation';
import { useLocale } from '../../../hooks/useLocale';
import { useAuthStore } from '../../../store';
import { authenticate, findByPhone } from '../../../store/userDb';
import { generateOtp } from '../../../utils/otp';
import { showAlert } from '../../../utils/alert';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../config/firebase';

// Feature flag — when 'true', send OTP via Unifonic Cloud Function.
// Default: keep zustand-mocked OTP so existing dev / demo paths work.
const USE_REAL_AUTH = process.env.EXPO_PUBLIC_USE_REAL_AUTH === 'true';

export default function LoginScreen() {
  const { t, isRTL, flexDir, align } = useTranslation();
  const locale = useLocale();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const language = useAuthStore((s) => s.language);

  const canSubmit = phone.length >= 10 && password.length >= 1;

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const user = await authenticate(phone, password);
      if (!user) {
        showAlert(t('invalidCredentials'), '', [{ text: t('ok') }]);
        setLoading(false);
        return;
      }
      login({
        name: user.firstName + ' ' + user.lastName,
        phone: user.phone,
        email: user.email,
        dateOfBirth: user.dateOfBirth,
        nationalId: user.nationalId,
      });
      setLoading(false);
      router.replace(`/${locale}/(tabs)`);
    } catch {
      setLoading(false);
      showAlert(t('invalidCredentials'), '', [{ text: t('ok') }]);
    }
  };

  const handleOtpLogin = async () => {
    if (!phone || phone.length < 10) return;

    if (USE_REAL_AUTH) {
      // Real path: ask the backend to issue an OTP via Unifonic. We do NOT
      // pre-check that the phone is in our user db — the verifyOtp Cloud
      // Function provisions a Firebase Auth user on first verify.
      try {
        const sendOtpFn = httpsCallable<
          { phoneNumber: string },
          { ok: boolean; expiresIn: number }
        >(functions, 'sendOtp');
        await sendOtpFn({ phoneNumber: phone });
        router.push({
          pathname: `/${locale}/(auth)/otp` as any,
          params: { phone, mode: 'login' },
        });
        return;
      } catch (err: unknown) {
        const msg = (err as { message?: string })?.message ?? t('error');
        showAlert(t('error'), msg, [{ text: t('ok') }]);
        return;
      }
    }

    // Mock path (default) — verify phone exists in seeded user db,
    // generate a demo OTP, and navigate. Preserves existing demo behavior.
    const user = await findByPhone(phone);
    if (!user) {
      showAlert(t('error'), t('phoneNotRegistered'), [{ text: t('ok') }]);
      return;
    }
    const code = generateOtp(phone);
    showAlert(t('otpDemo'), code, [
      {
        text: t('ok'),
        onPress: () => {
          router.push({
            pathname: `/${locale}/(auth)/otp` as any,
            params: { phone, mode: 'login', name: `${user.firstName} ${user.lastName}` },
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={[styles.header, { flexDirection: flexDir }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Icon
                name={isRTL ? 'chevronRight' : 'chevronLeft'}
                size={24}
                color={Colors.primaryDark}
              />
            </TouchableOpacity>
            <Logo size="sm" variant="icon" />
          </View>

          {/* Title */}
          <View style={styles.titleArea}>
            <Text style={[styles.title, { textAlign: align }]}>{t('login')}</Text>
            <Text style={[styles.subtitle, { textAlign: align }]}>{t('loginSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { textAlign: align }]}>{t('phone')}</Text>
              <View style={[styles.inputRow, { flexDirection: flexDir }]}>
                <View style={styles.inputIconContainer}>
                  <Icon name="phone" size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={[styles.textInput, { textAlign: align }]}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('phonePlaceholder')}
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { textAlign: align }]}>{t('password')}</Text>
              <View style={[styles.inputRow, { flexDirection: flexDir }]}>
                <View style={styles.inputIconContainer}>
                  <Icon name="lock" size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={[styles.textInput, { textAlign: align }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t('passwordPlaceholder')}
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <Icon
                    name={showPassword ? 'eyeOff' : 'eye'}
                    size={20}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={[styles.forgotButton, { alignSelf: align === 'right' ? 'flex-start' : 'flex-end' }]}
              onPress={() => router.push(`/${locale}/forgot-password`)}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primaryButton, !canSubmit && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingDots}>
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View>
              ) : (
                <Text style={styles.primaryButtonText}>{t('login')}</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* OTP Login */}
            <TouchableOpacity
              style={[styles.outlineButton, (!phone || phone.length < 10) && styles.buttonDisabled]}
              onPress={handleOtpLogin}
              disabled={!phone || phone.length < 10}
              activeOpacity={0.8}
            >
              <Icon name="smartphone" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.outlineButtonText}>{t('loginWithOtp')}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { flexDirection: flexDir, gap: 4 }]}>
            <Text style={styles.footerText}>{t('dontHaveAccount')}</Text>
            <TouchableOpacity onPress={() => router.replace(`/${locale}/(auth)/signup`)} activeOpacity={0.7}>
              <Text style={styles.footerLink}>{t('signup')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  // ── Header ────────────────────────────────────────
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Title ─────────────────────────────────────────
  titleArea: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // ── Form ──────────────────────────────────────────
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputRow: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 16,
    backgroundColor: Colors.white,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIconContainer: {
    width: 32,
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 15,
    color: Colors.text,
  },
  eyeButton: {
    padding: 8,
  },

  // ── Forgot Password ───────────────────────────────
  forgotButton: {
    marginBottom: 24,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Buttons ───────────────────────────────────────
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  outlineButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // ── Loading Dots ──────────────────────────────────
  loadingDots: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.white,
    opacity: 0.7,
  },

  // ── Divider ───────────────────────────────────────
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // ── Footer ────────────────────────────────────────
  footer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
  },
});
