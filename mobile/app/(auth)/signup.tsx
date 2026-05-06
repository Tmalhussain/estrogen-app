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
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/lib/api';
import { colors, font, radius, space } from '@/constants/theme';

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    firstName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+$/.test(email.trim()) &&
    password.length >= 8;

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signUp({
        firstName: firstName.trim(),
        lastName: lastName.trim() || undefined,
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      router.replace('/(tabs)');
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
          { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandRow}>
          <Logo size={48} variant="mark" />
        </View>

        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          One account, every order, prescriptions kept private.
        </Text>

        <View style={{ flexDirection: 'row', gap: space.md, marginTop: space.lg }}>
          <Field
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            icon="person-outline"
            autoComplete="given-name"
            textContentType="givenName"
            containerStyle={{ flex: 1 }}
          />
          <Field
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            icon="person-outline"
            autoComplete="family-name"
            textContentType="familyName"
            containerStyle={{ flex: 1 }}
          />
        </View>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          icon="mail-outline"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />
        <Field
          label="Phone (optional)"
          value={phone}
          onChangeText={setPhone}
          icon="call-outline"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          placeholder="+966 5X XXX XXXX"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          icon="lock-closed-outline"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="At least 8 characters"
          rightAdornment={
            <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          }
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Create account"
          onPress={onSubmit}
          loading={submitting}
          disabled={!valid}
          size="lg"
          style={{ marginTop: space.xl }}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" replace asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.footerLink}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  icon,
  rightAdornment,
  containerStyle,
  ...input
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  rightAdornment?: React.ReactNode;
  containerStyle?: import('react-native').StyleProp<import('react-native').ViewStyle>;
} & Omit<React.ComponentProps<typeof TextInput>, 'style'>) {
  return (
    <View style={[{ marginTop: space.lg }, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />
        <TextInput
          {...input}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
        {rightAdornment}
      </View>
    </View>
  );
}

function translate(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'email_already_registered')
      return 'That email is already registered. Try signing in.';
    if (err.code === 'password_too_short')
      return 'Password must be at least 8 characters.';
    if (err.code === 'invalid_email') return 'Please enter a valid email.';
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
    marginBottom: space.xxl,
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
    gap: space.sm,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    height: 52,
  },
  input: {
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: space.xxl,
  },
  footerText: {
    fontSize: font.size.sm,
    color: colors.textSoft,
  },
  footerLink: {
    fontSize: font.size.sm,
    color: colors.primary,
    fontWeight: font.weight.bold,
  },
});
