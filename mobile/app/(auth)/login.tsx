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

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('demo@estrogen.sa');
  const [password, setPassword] = useState('demo12345');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
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
          <Logo size={56} variant="mark" />
          <Text style={styles.brandWord}>estrogen</Text>
        </View>

        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to your pharmacy account.</Text>

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
          label="Password"
          value={password}
          onChangeText={setPassword}
          icon="lock-closed-outline"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
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
          label="Sign in"
          onPress={onSubmit}
          loading={submitting}
          size="lg"
          style={{ marginTop: space.xl }}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to Estrogen? </Text>
          <Link href="/(auth)/signup" replace asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.footerLink}>Create an account</Text>
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
  ...input
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  rightAdornment?: React.ReactNode;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginTop: space.lg }}>
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
    if (err.code === 'invalid_credentials')
      return 'Wrong email or password. Try again.';
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
    marginBottom: space.lg,
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
