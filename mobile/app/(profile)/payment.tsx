import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Pill } from '@/components/Pill';
import { localStore } from '@/lib/local-store';
import { colors, font, radius, space } from '@/constants/theme';

const KEY = 'estrogen.payment.methods';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Method = {
  id: string;
  label: string;
  detail: string;
  icon: IoniconName;
  isDefault: boolean;
};

const SEED: Method[] = [
  {
    id: 'mada',
    label: 'Mada · Visa · Mastercard',
    detail: '•••• 4218',
    icon: 'card-outline',
    isDefault: true,
  },
  {
    id: 'stcpay',
    label: 'STC Pay',
    detail: '+966 50 ••• ••42',
    icon: 'phone-portrait-outline',
    isDefault: false,
  },
  {
    id: 'applepay',
    label: 'Apple Pay',
    detail: 'One-tap with Face ID',
    icon: 'logo-apple',
    isDefault: false,
  },
];

export default function PaymentMethodsScreen() {
  const insets = useSafeAreaInsets();
  const [methods, setMethods] = useState<Method[]>([]);

  const load = useCallback(async () => {
    const stored = await localStore.get<Method[]>(KEY);
    setMethods(stored ?? SEED);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const setDefault = async (id: string) => {
    const next = methods.map((m) => ({ ...m, isDefault: m.id === id }));
    setMethods(next);
    await localStore.set(KEY, next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Payment methods" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        {methods.map((m) => (
          <Pressable
            key={m.id}
            onPress={() => setDefault(m.id)}
            style={[styles.card, m.isDefault && styles.cardActive]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={m.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                <Text style={styles.label}>{m.label}</Text>
                {m.isDefault ? <Pill label="Default" tone="info" /> : null}
              </View>
              <Text style={styles.detail}>{m.detail}</Text>
            </View>
            <View style={[styles.radio, m.isDefault && styles.radioActive]}>
              {m.isDefault ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        ))}

        <Pressable style={styles.addCard}>
          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
          <Text style={styles.addText}>Add a card</Text>
        </Pressable>

        <View style={styles.note}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
          <Text style={styles.noteText}>
            Card details are tokenized through Moyasar; we never store the raw
            number on our servers.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.lg },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: space.sm,
  },
  cardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  detail: {
    fontSize: font.size.xs,
    color: colors.textSoft,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginTop: space.sm,
  },
  addText: {
    fontSize: font.size.sm,
    color: colors.primary,
    fontWeight: font.weight.semi,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: space.lg,
    paddingHorizontal: space.sm,
  },
  noteText: {
    flex: 1,
    fontSize: font.size.xs,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
