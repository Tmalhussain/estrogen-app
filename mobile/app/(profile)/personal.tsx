import { useEffect, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';
import { localStore } from '@/lib/local-store';
import { colors, font, radius, space } from '@/constants/theme';

const KEY = 'estrogen.personal.profile';

type PersonalForm = {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  nationalId: string;
};

export default function PersonalInfoScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [form, setForm] = useState<PersonalForm>({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
    dateOfBirth: '',
    nationalId: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await localStore.get<PersonalForm>(KEY);
      if (stored) setForm((prev) => ({ ...prev, ...stored }));
    })();
  }, []);

  const onSave = async () => {
    await localStore.set(KEY, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Personal info" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: insets.bottom + space.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          {user?.phoneNumber ? (
            <View style={styles.lockedRow}>
              <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
              <Text style={styles.lockedRowText}>
                Phone {user.phoneNumber} is verified and can't be changed here.
              </Text>
            </View>
          ) : null}

          <Field
            label="First name"
            icon="person-outline"
            value={form.firstName}
            onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
            autoComplete="given-name"
            textContentType="givenName"
          />
          <Field
            label="Last name"
            icon="person-outline"
            value={form.lastName}
            onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
            autoComplete="family-name"
            textContentType="familyName"
          />
          <Field
            label="Email (optional)"
            icon="mail-outline"
            value={form.email}
            onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
          />
          <Field
            label="Date of birth (YYYY-MM-DD)"
            icon="calendar-outline"
            value={form.dateOfBirth}
            onChangeText={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))}
            placeholder="1990-05-15"
            autoCapitalize="none"
          />
          <Field
            label="National ID"
            icon="card-outline"
            value={form.nationalId}
            onChangeText={(v) => setForm((f) => ({ ...f, nationalId: v.replace(/\D/g, '').slice(0, 10) }))}
            placeholder="10XXXXXXXX"
            keyboardType="number-pad"
            maxLength={10}
          />

          <View style={styles.pdpl}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
            <Text style={styles.pdplText}>
              Your personal data is protected under the Saudi Personal Data
              Protection Law (PDPL) and never shared with third parties.
            </Text>
          </View>

          <Button
            label={saved ? 'Saved' : 'Save changes'}
            leadingIcon={
              saved ? (
                <Ionicons name="checkmark" size={18} color={colors.onPrimary} />
              ) : null
            }
            onPress={onSave}
            size="lg"
            style={{ marginTop: space.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  icon,
  ...input
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    backgroundColor: colors.bgAlt,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
  },
  lockedRowText: {
    flex: 1,
    fontSize: font.size.xs,
    color: colors.textSoft,
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
  pdpl: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: colors.primaryDim,
    padding: space.md,
    borderRadius: radius.lg,
    marginTop: space.xl,
  },
  pdplText: {
    flex: 1,
    fontSize: font.size.xs,
    color: colors.primary,
    fontWeight: font.weight.semi,
    lineHeight: 18,
  },
});
