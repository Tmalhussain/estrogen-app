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
import { register } from '../../../store/userDb';
import { checkPasswordStrength } from '../../../utils/password';
import { generateOtp } from '../../../utils/otp';
import { useAuthStore } from '../../../store';
import { showAlert } from '../../../utils/alert';

export default function SignupScreen() {
  const { t, isRTL, flexDir, align } = useTranslation();
  const locale = useLocale();
  const language = useAuthStore((s) => s.language);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof checkPasswordStrength> | null>(null);

  const canSubmit =
    form.firstName.length > 0 &&
    form.lastName.length > 0 &&
    form.phone.length >= 10 &&
    form.password.length >= 8 &&
    passwordStrength?.isAcceptable &&
    agreed;

  const updateField = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (value: string) => {
    setForm((prev) => ({ ...prev, password: value }));
    if (value.length > 0) {
      setPasswordStrength(checkPasswordStrength(value));
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSignup = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);

    const result = await register({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      email: form.email,
      password: form.password,
    });

    if (!result.success) {
      setLoading(false);
      const errorMsg = language === 'ar' ? result.errorAr : result.error;
      showAlert(t('error'), errorMsg, [{ text: t('ok') }]);
      return;
    }

    // Firebase Auth account created successfully
    // Navigate to OTP verification (or directly to tabs)
    const code = generateOtp(form.phone);
    showAlert(t('otpDemo'), code, [
      {
        text: t('ok'),
        onPress: () => {
          router.push({
            pathname: `/${locale}/(auth)/otp`,
            params: {
              phone: form.phone,
              mode: 'signup',
              name: `${form.firstName} ${form.lastName}`,
              email: form.email,
            },
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
            <Text style={[styles.title, { textAlign: align }]}>{t('signup')}</Text>
            <Text style={[styles.subtitle, { textAlign: align }]}>{t('signupSubtitle')}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Row - First Name + Last Name side by side */}
            <View style={[styles.nameRow, { flexDirection: flexDir }]}>
              <View style={styles.nameField}>
                <Text style={[styles.label, { textAlign: align }]}>{t('firstName')}</Text>
                <View style={[styles.inputRow, { flexDirection: flexDir }]}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="user" size={18} color={Colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.textInput, { textAlign: align }]}
                    value={form.firstName}
                    onChangeText={updateField('firstName')}
                    placeholder={t('firstNamePlaceholder')}
                    placeholderTextColor={Colors.textTertiary}
                    autoComplete="given-name"
                  />
                </View>
              </View>

              <View style={styles.nameGap} />

              <View style={styles.nameField}>
                <Text style={[styles.label, { textAlign: align }]}>{t('lastName')}</Text>
                <View style={[styles.inputRow, { flexDirection: flexDir }]}>
                  <View style={styles.inputIconContainer}>
                    <Icon name="user" size={18} color={Colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.textInput, { textAlign: align }]}
                    value={form.lastName}
                    onChangeText={updateField('lastName')}
                    placeholder={t('lastNamePlaceholder')}
                    placeholderTextColor={Colors.textTertiary}
                    autoComplete="family-name"
                  />
                </View>
              </View>
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { textAlign: align }]}>{t('phone')}</Text>
              <View style={[styles.inputRow, { flexDirection: flexDir }]}>
                <View style={styles.inputIconContainer}>
                  <Icon name="phone" size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={[styles.textInput, { textAlign: align }]}
                  value={form.phone}
                  onChangeText={updateField('phone')}
                  placeholder={t('phonePlaceholder')}
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                />
              </View>
            </View>

            {/* Email Input (optional) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { textAlign: align }]}>{t('email')}</Text>
              <View style={[styles.inputRow, { flexDirection: flexDir }]}>
                <View style={styles.inputIconContainer}>
                  <Icon name="mail" size={20} color={Colors.textSecondary} />
                </View>
                <TextInput
                  style={[styles.textInput, { textAlign: align }]}
                  value={form.email}
                  onChangeText={updateField('email')}
                  placeholder={t('emailPlaceholder')}
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoComplete="email"
                  autoCapitalize="none"
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
                  value={form.password}
                  onChangeText={handlePasswordChange}
                  placeholder={t('passwordHint')}
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
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
              {/* Password Strength Indicator */}
              {passwordStrength && form.password.length > 0 && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBarBg}>
                    <View
                      style={[
                        styles.strengthBarFill,
                        {
                          width: `${(passwordStrength.score / 4) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthLabel, { color: passwordStrength.color, textAlign: align }]}>
                    {passwordStrength.label[language]}
                  </Text>
                </View>
              )}
            </View>

            {/* Terms Checkbox */}
            <TouchableOpacity
              style={[styles.termsRow, { flexDirection: flexDir }]}
              onPress={() => setAgreed((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                {agreed && <Icon name="check" size={14} color={Colors.white} />}
              </View>
              <Text style={[styles.termsText, { textAlign: align }]}>{t('termsAgree')}</Text>
            </TouchableOpacity>

            {/* Signup Button */}
            <TouchableOpacity
              style={[styles.primaryButton, (!canSubmit || loading) && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={!canSubmit || loading}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>{t('signup')}</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={[styles.footer, { flexDirection: flexDir, gap: 4 }]}>
            <Text style={styles.footerText}>{t('alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => router.replace(`/${locale}/(auth)/login`)} activeOpacity={0.7}>
              <Text style={styles.footerLink}>{t('login')}</Text>
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
    marginBottom: 28,
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
  nameRow: {
    marginBottom: 20,
  },
  nameField: {
    flex: 1,
  },
  nameGap: {
    width: 12,
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
    width: 28,
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

  // ── Password Strength ──────────────────────────────
  strengthContainer: {
    marginTop: 8,
  },
  strengthBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Terms ─────────────────────────────────────────
  termsRow: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
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
  buttonDisabled: {
    opacity: 0.5,
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
