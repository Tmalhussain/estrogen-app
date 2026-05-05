import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { useTranslation } from '../../../i18n/useTranslation';
import { useLocale } from '../../../hooks/useLocale';
import { useAuthStore } from '../../../store';
import { useUserDb } from '../../../store/userDb';
import { verifyOtp as verifyOtpCode, generateOtp, getCurrentOtpCode } from '../../../utils/otp';
import { showAlert } from '../../../utils/alert';
import { httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { auth, functions } from '../../../config/firebase';

// Feature flag — when 'true', the screen calls the real verifyOtp Cloud
// Function (Sprint 0 ARCH-1.1) and signs in via signInWithCustomToken.
// Default: keep the existing zustand-mocked flow so dev / demo work unchanged.
const USE_REAL_AUTH = process.env.EXPO_PUBLIC_USE_REAL_AUTH === 'true';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 90;

export default function OtpScreen() {
  const { t, isRTL, flexDir, align } = useTranslation();
  const locale = useLocale();
  const { phone, mode, name, email } = useLocalSearchParams<{
    phone: string;
    mode: string;
    name?: string;
    email?: string;
  }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(getCurrentOtpCode());
  const inputs = useRef<Array<TextInput | null>>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const login = useAuthStore((s) => s.login);
  const language = useAuthStore((s) => s.language);
  const findByPhone = useUserDb((s) => s.findByPhone);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((v) => v - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Pulse animation for the lock icon
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleChange = useCallback(
    (value: string, index: number) => {
      const digit = value.replace(/[^0-9]/g, '').slice(-1);
      const next = [...otp];
      next[index] = digit;
      setOtp(next);
      if (digit && index < OTP_LENGTH - 1) {
        inputs.current[index + 1]?.focus();
      }
    },
    [otp]
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === 'Backspace' && !otp[index] && index > 0) {
        const next = [...otp];
        next[index - 1] = '';
        setOtp(next);
        inputs.current[index - 1]?.focus();
      }
    },
    [otp]
  );

  const handleVerify = async () => {
    setLoading(true);

    if (USE_REAL_AUTH) {
      try {
        const verifyOtpFn = httpsCallable<
          { phoneNumber: string; code: string },
          { ok: boolean; token: string; uid: string }
        >(functions, 'verifyOtp');
        const res = await verifyOtpFn({
          phoneNumber: phone ?? '',
          code: otp.join(''),
        });
        const token = res.data?.token;
        if (!token) {
          showAlert(t('error'), t('otpInvalid'), [{ text: t('ok') }]);
          setLoading(false);
          return;
        }
        await signInWithCustomToken(auth, token);
        // Hydrate the local auth store so the rest of the app keeps working.
        const dbUser = await findByPhone(phone ?? '');
        if (dbUser) {
          login({
            name: `${dbUser.firstName} ${dbUser.lastName}`,
            phone: dbUser.phone,
            email: dbUser.email,
            dateOfBirth: dbUser.dateOfBirth,
            nationalId: dbUser.nationalId,
          });
        } else {
          login({ name: name ?? phone ?? '', phone: phone ?? '', email: email ?? '' });
        }
        setLoading(false);
        router.replace(`/${locale}/(tabs)`);
        return;
      } catch (err: unknown) {
        // Don't log the OTP code itself. The Cloud Function returns
        // bilingual HttpsError: details.messageAr is the Arabic
        // equivalent of err.message. Pick whichever matches user locale.
        const e = err as { message?: string; details?: { messageAr?: string } };
        const msg =
          language === 'ar' && e.details?.messageAr
            ? e.details.messageAr
            : e.message ?? t('otpInvalid');
        showAlert(t('error'), msg, [{ text: t('ok') }]);
        setLoading(false);
        return;
      }
    }

    // Mock path (default) — preserves existing demo flow.
    const result = verifyOtpCode(phone ?? '', otp.join(''));
    if (!result.success) {
      const msg = result.errorMessage?.[language] ?? t('otpInvalid');
      showAlert(t('error'), msg, [{ text: t('ok') }]);
      setLoading(false);
      return;
    }
    // Populate auth store with full user data from userDb
    const dbUser = await findByPhone(phone ?? '');
    if (dbUser) {
      login({
        name: `${dbUser.firstName} ${dbUser.lastName}`,
        phone: dbUser.phone,
        email: dbUser.email,
        dateOfBirth: dbUser.dateOfBirth,
        nationalId: dbUser.nationalId,
      });
    } else {
      login({ name: name ?? phone ?? '', phone: phone ?? '', email: email ?? '' });
    }
    setLoading(false);
    router.replace(`/${locale}/(tabs)`);
  };

  const handleResend = async () => {
    if (USE_REAL_AUTH) {
      try {
        const sendOtpFn = httpsCallable<
          { phoneNumber: string },
          { ok: boolean; expiresIn: number }
        >(functions, 'sendOtp');
        await sendOtpFn({ phoneNumber: phone ?? '' });
        setDemoCode(null);
        setCountdown(COUNTDOWN_SECONDS);
        setOtp(Array(OTP_LENGTH).fill(''));
        inputs.current[0]?.focus();
        return;
      } catch (err: unknown) {
        const e = err as { message?: string; details?: { messageAr?: string } };
        const msg =
          language === 'ar' && e.details?.messageAr
            ? e.details.messageAr
            : e.message ?? t('error');
        showAlert(t('error'), msg, [{ text: t('ok') }]);
        return;
      }
    }
    const code = generateOtp(phone ?? '');
    setDemoCode(code);
    showAlert(t('otpDemo'), code);
    setCountdown(COUNTDOWN_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputs.current[0]?.focus();
  };

  const filled = otp.every((d) => d.length === 1);

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header with back button */}
        <View style={[styles.headerRow, { flexDirection: flexDir }]}>
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
          <View style={styles.headerSpacer} />
        </View>

        {/* Lock Icon */}
        <View style={styles.iconSection}>
          <Animated.View
            style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}
          >
            <Icon name="lock" size={32} color={Colors.primary} />
          </Animated.View>
        </View>

        {/* Title + Subtitle */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>{t('otp')}</Text>
          <Text style={styles.subtitle}>
            {t('otpSent')}
            {'\n'}
            <Text style={styles.phoneNumber}>{phone}</Text>
          </Text>
        </View>

        {/* Demo OTP Code Banner */}
        {demoCode && (
          <View style={styles.demoBanner}>
            <Text style={styles.demoBannerLabel}>Demo code:</Text>
            <Text style={styles.demoBannerCode}>{demoCode}</Text>
          </View>
        )}

        {/* OTP Input Boxes */}
        <View style={[styles.otpContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {otp.map((digit, index) => (
            <View
              key={index}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                focusedIndex === index ? styles.otpBoxFocused : null,
              ]}
            >
              <TextInput
                ref={(r) => {
                  inputs.current[index] = r;
                }}
                style={styles.otpInput}
                value={digit}
                onChangeText={(v) => handleChange(v, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                onFocus={() => setFocusedIndex(index)}
                onBlur={() => setFocusedIndex(null)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                selectTextOnFocus
              />
            </View>
          ))}
        </View>

        {/* Countdown / Resend */}
        <View style={styles.countdownArea}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              {t('otpResendAfter')} {formatCountdown(countdown)} {t('otpSeconds')}
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <Text style={styles.resendText}>{t('otpResend')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, (!filled || loading) && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={!filled || loading}
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
              <Text style={styles.verifyButtonText}>{t('verify')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // ── Header ────────────────────────────────────────
  headerRow: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 16,
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

  // ── Icon ──────────────────────────────────────────
  iconSection: {
    alignItems: 'center',
    marginBottom: 24,
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
  titleArea: {
    alignItems: 'center',
    marginBottom: 36,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneNumber: {
    fontWeight: '700',
    color: Colors.primary,
    fontSize: 16,
  },

  // ── Demo Banner ─────────────────────────────────────
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  demoBannerLabel: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  demoBannerCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 4,
    fontVariant: ['tabular-nums'],
  },

  // ── OTP Boxes ─────────────────────────────────────
  otpContainer: {
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
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
  otpInput: {
    width: '100%',
    height: '100%',
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'center',
  },

  // ── Countdown ─────────────────────────────────────
  countdownArea: {
    alignItems: 'center',
    marginBottom: 32,
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

  // ── Verify Button ─────────────────────────────────
  verifyButton: {
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
  verifyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  verifyButtonText: {
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
