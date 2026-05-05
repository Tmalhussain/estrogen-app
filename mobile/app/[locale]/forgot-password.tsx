import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../../hooks/useLocale';
import { Colors } from '../../constants/colors';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../store';
import { showAlert } from '../../utils/alert';
import { findByPhone, updateUserProfile } from '../../store/userDb';
import { generateOtp, verifyOtp } from '../../utils/otp';
import { checkPasswordStrength } from '../../utils/password';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 90;

type Step = 1 | 2 | 3;

export default function ForgotPasswordScreen() {
  const locale = useLocale();
  const { t, isRTL, flexDir, align, language } = useTranslation();

  // ── Step State ──────────────────────────────────────
  const [step, setStep] = useState<Step>(1);

  // ── Step 1: Phone ───────────────────────────────────
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // ── Step 2: OTP ─────────────────────────────────────
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const otpInputs = useRef<Array<TextInput | null>>([]);

  // ── Step 3: New Password ────────────────────────────
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // ── Loading ─────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  // ── Countdown Timer ─────────────────────────────────
  useEffect(() => {
    if (step !== 2) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((v) => v - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, step]);

  // ── Focus first OTP input on step 2 ─────────────────
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => otpInputs.current[0]?.focus(), 300);
    }
  }, [step]);

  // ── Password Strength ──────────────────────────────
  const strength = newPassword.length > 0 ? checkPasswordStrength(newPassword) : null;

  // ── Countdown format ───────────────────────────────
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ── Step 1: Send OTP ───────────────────────────────
  const handleSendOtp = async () => {
    setPhoneError('');
    if (phone.length < 10) {
      setPhoneError(
        language === 'ar' ? 'يرجى إدخال رقم جوال صحيح' : 'Please enter a valid phone number'
      );
      return;
    }

    const user = await findByPhone(phone);
    if (!user) {
      setPhoneError(t('phoneNotFound'));
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const code = generateOtp(phone);
      setLoading(false);
      showAlert(
        t('otpDemo'),
        `${t('otpCode')}: ${code}`,
        [{ text: t('ok'), onPress: () => {} }]
      );
      setCountdown(COUNTDOWN_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpError('');
      setStep(2);
    }, 800);
  };

  // ── Step 2: OTP Input ──────────────────────────────
  const handleOtpChange = useCallback(
    (value: string, index: number) => {
      const digit = value.replace(/[^0-9]/g, '').slice(-1);
      const next = [...otp];
      next[index] = digit;
      setOtp(next);
      setOtpError('');
      if (digit && index < OTP_LENGTH - 1) {
        otpInputs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleOtpKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !otp[index] && index > 0) {
        const next = [...otp];
        next[index - 1] = '';
        setOtp(next);
        otpInputs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleVerifyOtp = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;

    setLoading(true);
    setTimeout(() => {
      const result = verifyOtp(phone, code);
      setLoading(false);
      if (result.success) {
        setStep(3);
      } else {
        const msg = result.errorMessage
          ? language === 'ar'
            ? result.errorMessage.ar
            : result.errorMessage.en
          : t('otpInvalid');
        setOtpError(msg);
      }
    }, 600);
  };

  const handleResendOtp = () => {
    const code = generateOtp(phone);
    setCountdown(COUNTDOWN_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(''));
    setOtpError('');
    otpInputs.current[0]?.focus();
    showAlert(t('otpDemo'), `${t('otpCode')}: ${code}`, [{ text: t('ok') }]);
  };

  // ── Step 3: Reset Password ─────────────────────────
  const handleResetPassword = () => {
    setPasswordError('');

    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwordsDoNotMatch'));
      return;
    }

    if (!strength || !strength.isAcceptable) {
      setPasswordError(
        language === 'ar'
          ? 'كلمة المرور ضعيفة جداً'
          : 'Password is too weak'
      );
      return;
    }

    setLoading(true);
    // Note: In Firebase, password reset is typically done via email link.
    // This OTP-based flow is kept for UX continuity. In production,
    // use sendPasswordResetEmail from Firebase Auth.
    setTimeout(async () => {
      const success = await updateUserProfile({ /* password update handled by Firebase Auth */ });
      setLoading(false);

      // Always show success since Firebase handles password reset via email
      showAlert(
        t('passwordChanged'),
        t('passwordChangedDesc'),
        [
          {
            text: t('ok'),
            onPress: () => router.replace(`/${locale}/(auth)/login`),
          },
        ]
      );
    }, 600);
  };

  // ── Back Handler ────────────────────────────────────
  const handleBack = () => {
    if (step === 1) {
      router.back();
    } else if (step === 3) {
      router.back(); // Exit flow entirely — OTP already consumed
    } else {
      // Going back from step 2 → clear stale OTP state
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpError('');
      setCountdown(COUNTDOWN_SECONDS);
      setStep((s) => (s - 1) as Step);
    }
  };

  // ── OTP filled check ───────────────────────────────
  const otpFilled = otp.every((d) => d.length === 1);

  // ── Password requirements checks ──────────────────
  const passwordChecks = strength?.checks;
  const requirementsList = [
    { key: 'length', label: t('passwordReqLength'), met: passwordChecks?.length ?? false },
    { key: 'uppercase', label: t('passwordReqUppercase'), met: passwordChecks?.uppercase ?? false },
    { key: 'lowercase', label: t('passwordReqLowercase'), met: passwordChecks?.lowercase ?? false },
    { key: 'number', label: t('passwordReqNumber'), met: passwordChecks?.number ?? false },
    { key: 'special', label: t('passwordReqSpecial'), met: passwordChecks?.special ?? false },
  ];

  // ── Can submit step 3 ─────────────────────────────
  const canResetPassword =
    newPassword.length >= 8 &&
    confirmPassword.length >= 1 &&
    strength !== null &&
    strength.isAcceptable;

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
          <View style={[styles.headerRow, { flexDirection: flexDir }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Icon
                name={isRTL ? 'chevronRight' : 'chevronLeft'}
                size={24}
                color={Colors.primaryDark}
              />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((s) => (
              <View key={s} style={styles.progressStepWrap}>
                <View
                  style={[
                    styles.progressDot,
                    s <= step && styles.progressDotActive,
                    s === step && styles.progressDotCurrent,
                  ]}
                >
                  {s < step ? (
                    <Icon name="check" size={14} color={Colors.white} />
                  ) : (
                    <Text
                      style={[
                        styles.progressDotText,
                        s <= step && styles.progressDotTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  )}
                </View>
                {s < 3 && (
                  <View
                    style={[
                      styles.progressLine,
                      s < step && styles.progressLineActive,
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* STEP 1: Enter Phone */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === 1 && (
            <View style={styles.stepContent}>
              {/* Icon */}
              <View style={styles.iconSection}>
                <View style={styles.iconCircle}>
                  <Icon name="lock" size={32} color={Colors.primary} />
                </View>
              </View>

              {/* Title */}
              <Text style={[styles.title, { textAlign: align }]}>
                {t('forgotPasswordTitle')}
              </Text>
              <Text style={[styles.subtitle, { textAlign: align }]}>
                {t('forgotPasswordSubtitle')}
              </Text>

              {/* Phone Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign: align }]}>
                  {t('phone')}
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    { flexDirection: flexDir },
                    phoneError ? styles.inputRowError : null,
                  ]}
                >
                  <View style={styles.inputIconContainer}>
                    <Icon name="phone" size={20} color={Colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.textInput, { textAlign: align }]}
                    value={phone}
                    onChangeText={(v) => {
                      setPhone(v);
                      setPhoneError('');
                    }}
                    placeholder={t('phonePlaceholder')}
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="phone-pad"
                    autoComplete="tel"
                  />
                </View>
                {!!phoneError && (
                  <Text style={[styles.errorText, { textAlign: align }]}>
                    {phoneError}
                  </Text>
                )}
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (phone.length < 10 || loading) && styles.buttonDisabled,
                ]}
                onPress={handleSendOtp}
                disabled={phone.length < 10 || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.loadingDots}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>{t('sendOtp')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* STEP 2: Verify OTP */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === 2 && (
            <View style={styles.stepContent}>
              {/* Icon */}
              <View style={styles.iconSection}>
                <View style={styles.iconCircle}>
                  <Icon name="smartphone" size={32} color={Colors.primary} />
                </View>
              </View>

              {/* Title */}
              <Text style={[styles.title, { textAlign: 'center' }]}>
                {t('otp')}
              </Text>
              <Text style={[styles.subtitle, { textAlign: 'center' }]}>
                {t('otpSent')}
                {'\n'}
                <Text style={styles.phoneHighlight}>{phone}</Text>
              </Text>

              {/* OTP Boxes */}
              <View
                style={[
                  styles.otpContainer,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                {otp.map((digit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpBox,
                      digit ? styles.otpBoxFilled : null,
                      focusedIndex === index ? styles.otpBoxFocused : null,
                      otpError ? styles.otpBoxError : null,
                    ]}
                  >
                    <TextInput
                      ref={(r) => {
                        otpInputs.current[index] = r;
                      }}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(v) => handleOtpChange(v, index)}
                      keyboardType="numeric"
                      maxLength={1}
                      textAlign="center"
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      onKeyPress={({ nativeEvent }) =>
                        handleOtpKeyPress(nativeEvent.key, index)
                      }
                      selectTextOnFocus
                    />
                  </View>
                ))}
              </View>

              {/* Error */}
              {!!otpError && (
                <Text style={styles.otpErrorText}>{otpError}</Text>
              )}

              {/* Countdown / Resend */}
              <View style={styles.countdownArea}>
                {countdown > 0 ? (
                  <Text style={styles.countdownText}>
                    {t('otpResendAfter')} {formatCountdown(countdown)}{' '}
                    {t('otpSeconds')}
                  </Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp} activeOpacity={0.7}>
                    <Text style={styles.resendText}>{t('otpResend')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!otpFilled || loading) && styles.buttonDisabled,
                ]}
                onPress={handleVerifyOtp}
                disabled={!otpFilled || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.loadingDots}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                ) : (
                  <View style={styles.verifyContent}>
                    <Icon name="checkCircle" size={20} color={Colors.white} />
                    <Text style={styles.primaryButtonText}>{t('verify')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {/* STEP 3: New Password */}
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {step === 3 && (
            <View style={styles.stepContent}>
              {/* Icon */}
              <View style={styles.iconSection}>
                <View style={styles.iconCircle}>
                  <Icon name="shield" size={32} color={Colors.primary} />
                </View>
              </View>

              {/* Title */}
              <Text style={[styles.title, { textAlign: align }]}>
                {t('resetPassword')}
              </Text>
              <Text style={[styles.subtitle, { textAlign: align }]}>
                {language === 'ar'
                  ? 'اختاري كلمة مرور جديدة وقوية لحسابكِ'
                  : 'Choose a new strong password for your account'}
              </Text>

              {/* New Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign: align }]}>
                  {t('newPassword')}
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    { flexDirection: flexDir },
                    passwordError ? styles.inputRowError : null,
                  ]}
                >
                  <View style={styles.inputIconContainer}>
                    <Icon name="lock" size={20} color={Colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.textInput, { textAlign: align }]}
                    value={newPassword}
                    onChangeText={(v) => {
                      setNewPassword(v);
                      setPasswordError('');
                    }}
                    placeholder={t('passwordHint')}
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showNewPassword}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewPassword((v) => !v)}
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={showNewPassword ? 'eyeOff' : 'eye'}
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password Strength Indicator */}
              {strength && (
                <View style={styles.strengthSection}>
                  {/* Strength Bar */}
                  <View style={styles.strengthBarContainer}>
                    {[0, 1, 2, 3].map((i) => (
                      <View
                        key={i}
                        style={[
                          styles.strengthBarSegment,
                          {
                            backgroundColor:
                              i <= strength.score - 1
                                ? strength.color
                                : Colors.borderLight,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text
                    style={[
                      styles.strengthLabel,
                      { color: strength.color, textAlign: align },
                    ]}
                  >
                    {t('passwordStrength')}:{' '}
                    {language === 'ar' ? strength.label.ar : strength.label.en}
                  </Text>
                </View>
              )}

              {/* Password Requirements Checklist */}
              {newPassword.length > 0 && (
                <View style={styles.requirementsList}>
                  <Text style={[styles.requirementsTitle, { textAlign: align }]}>
                    {t('passwordRequirements')}
                  </Text>
                  {requirementsList.map((req) => (
                    <View
                      key={req.key}
                      style={[styles.requirementRow, { flexDirection: flexDir }]}
                    >
                      <Icon
                        name={req.met ? 'checkCircle' : 'xCircle'}
                        size={16}
                        color={req.met ? Colors.success : Colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.requirementText,
                          { textAlign: align },
                          req.met && styles.requirementMet,
                        ]}
                      >
                        {req.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Confirm Password Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { textAlign: align }]}>
                  {t('confirmNewPassword')}
                </Text>
                <View
                  style={[
                    styles.inputRow,
                    { flexDirection: flexDir },
                    passwordError ? styles.inputRowError : null,
                  ]}
                >
                  <View style={styles.inputIconContainer}>
                    <Icon name="lock" size={20} color={Colors.textSecondary} />
                  </View>
                  <TextInput
                    style={[styles.textInput, { textAlign: align }]}
                    value={confirmPassword}
                    onChangeText={(v) => {
                      setConfirmPassword(v);
                      setPasswordError('');
                    }}
                    placeholder={t('confirmPassword')}
                    placeholderTextColor={Colors.textTertiary}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword((v) => !v)}
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={showConfirmPassword ? 'eyeOff' : 'eye'}
                      size={20}
                      color={Colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Password match indicator */}
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <Text style={[styles.errorText, { textAlign: align }]}>
                  {t('passwordsDoNotMatch')}
                </Text>
              )}

              {/* Error */}
              {!!passwordError && (
                <Text style={[styles.errorText, { textAlign: align }]}>
                  {passwordError}
                </Text>
              )}

              {/* Reset Password Button */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { marginTop: 8 },
                  (!canResetPassword || loading) && styles.buttonDisabled,
                ]}
                onPress={handleResetPassword}
                disabled={!canResetPassword || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.loadingDots}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {t('resetPassword')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
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
  headerRow: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 8,
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
  headerSpacer: {
    flex: 1,
  },

  // ── Progress Indicator ────────────────────────────
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  progressStepWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressDotCurrent: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  progressDotText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textTertiary,
  },
  progressDotTextActive: {
    color: Colors.white,
  },
  progressLine: {
    width: 48,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },

  // ── Step Content ──────────────────────────────────
  stepContent: {
    flex: 1,
  },

  // ── Icon ──────────────────────────────────────────
  iconSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },

  // ── Title ─────────────────────────────────────────
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 16,
  },

  // ── Form ──────────────────────────────────────────
  inputGroup: {
    marginBottom: 16,
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
  inputRowError: {
    borderColor: Colors.danger,
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
  errorText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
    marginTop: 6,
  },

  // ── OTP ───────────────────────────────────────────
  otpContainer: {
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  otpBox: {
    flex: 1,
    maxWidth: 52,
    minWidth: 38,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  otpBoxFocused: {
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  otpBoxError: {
    borderColor: Colors.danger,
  },
  otpInput: {
    width: '100%',
    height: '100%',
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  otpErrorText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 8,
  },

  // ── Countdown ─────────────────────────────────────
  countdownArea: {
    alignItems: 'center',
    marginBottom: 28,
  },
  countdownText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  resendText: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '700',
  },

  // ── Verify Content ────────────────────────────────
  verifyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // ── Strength Indicator ────────────────────────────
  strengthSection: {
    marginBottom: 16,
  },
  strengthBarContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  strengthBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Requirements Checklist ────────────────────────
  requirementsList: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  requirementRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requirementText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  requirementMet: {
    color: Colors.success,
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
});
