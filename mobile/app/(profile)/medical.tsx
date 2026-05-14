import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { localStore } from '@/lib/local-store';
import { colors, font, radius, space } from '@/constants/theme';

const KEY = 'estrogen.medical.profile';

const PREGNANCY_OPTIONS = [
  'Not pregnant',
  'Pregnant',
  'Breastfeeding',
  'Planning pregnancy',
] as const;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const ALLERGY_OPTIONS = [
  'Penicillin',
  'Sulfa',
  'Aspirin',
  'Ibuprofen',
  'Codeine',
  'NSAIDs',
  'Amoxicillin',
  'Other',
];

const CONDITION_OPTIONS = [
  'Thyroid',
  'Hypertension',
  'Diabetes',
  'Asthma',
  'Anemia',
  'PCOS',
  'Endometriosis',
  'Other',
];

type MedicalForm = {
  pregnancy: string;
  bloodType: string | null;
  allergies: string[];
  conditions: string[];
};

const EMPTY: MedicalForm = {
  pregnancy: 'Not pregnant',
  bloodType: null,
  allergies: [],
  conditions: [],
};

export default function MedicalProfileScreen() {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<MedicalForm>(EMPTY);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const stored = await localStore.get<MedicalForm>(KEY);
      if (stored) setForm({ ...EMPTY, ...stored });
    })();
  }, []);

  const toggle = (list: 'allergies' | 'conditions', v: string) =>
    setForm((f) => ({
      ...f,
      [list]: f[list].includes(v) ? f[list].filter((x) => x !== v) : [...f[list], v],
    }));

  const onSave = async () => {
    await localStore.set(KEY, form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Medical profile" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        <View style={styles.privacyRow}>
          <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          <Text style={styles.privacyText}>
            This information helps our pharmacists flag interactions and
            advise on safe alternatives. It is never shared.
          </Text>
        </View>

        <Section title="Pregnancy status">
          <View style={styles.chipRow}>
            {PREGNANCY_OPTIONS.map((opt) => (
              <Chip
                key={opt}
                label={opt}
                active={form.pregnancy === opt}
                onPress={() => setForm((f) => ({ ...f, pregnancy: opt }))}
              />
            ))}
          </View>
        </Section>

        <Section title="Blood type">
          <View style={styles.chipRow}>
            {BLOOD_TYPES.map((bt) => (
              <Chip
                key={bt}
                label={bt}
                active={form.bloodType === bt}
                onPress={() =>
                  setForm((f) => ({
                    ...f,
                    bloodType: f.bloodType === bt ? null : bt,
                  }))
                }
              />
            ))}
          </View>
        </Section>

        <Section title="Drug allergies">
          <View style={styles.chipRow}>
            {ALLERGY_OPTIONS.map((a) => (
              <Chip
                key={a}
                label={a}
                active={form.allergies.includes(a)}
                tone="danger"
                onPress={() => toggle('allergies', a)}
              />
            ))}
          </View>
        </Section>

        <Section title="Chronic conditions">
          <View style={styles.chipRow}>
            {CONDITION_OPTIONS.map((c) => (
              <Chip
                key={c}
                label={c}
                active={form.conditions.includes(c)}
                tone="warning"
                onPress={() => toggle('conditions', c)}
              />
            ))}
          </View>
        </Section>

        <Button
          label={saved ? 'Saved' : 'Save medical profile'}
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
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: space.xl }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
  tone = 'primary',
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tone?: 'primary' | 'danger' | 'warning';
}) {
  const palette =
    tone === 'danger'
      ? { activeBg: colors.dangerSoft, activeFg: colors.danger }
      : tone === 'warning'
      ? { activeBg: colors.warningSoft, activeFg: colors.warning }
      : { activeBg: colors.primaryDim, activeFg: colors.primary };
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && { backgroundColor: palette.activeBg, borderColor: palette.activeFg },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          active && { color: palette.activeFg, fontWeight: font.weight.bold },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: colors.primaryDim,
    padding: space.md,
    borderRadius: radius.lg,
  },
  privacyText: {
    flex: 1,
    fontSize: font.size.xs,
    color: colors.primary,
    fontWeight: font.weight.semi,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.bold,
    marginBottom: space.sm,
    marginLeft: space.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    paddingHorizontal: space.lg,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.bgAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
  },
});
