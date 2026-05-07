import { useCallback, useEffect, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { localStore } from '@/lib/local-store';
import { colors, font, radius, space } from '@/constants/theme';

const KEY = 'estrogen.addresses';

type Address = {
  id: string;
  label: string;
  city: string;
  district: string;
  street: string;
  building: string;
  floor?: string;
  notes?: string;
  isDefault: boolean;
};

function newId() {
  return Math.random().toString(36).slice(2, 11);
}

const SEED: Address[] = [
  {
    id: 'home',
    label: 'Home',
    city: 'Riyadh',
    district: 'Al Olaya',
    street: 'Olaya Street',
    building: '12',
    isDefault: true,
  },
  {
    id: 'work',
    label: 'Work',
    city: 'Riyadh',
    district: 'KAFD',
    street: 'King Fahd Road',
    building: 'Tower B',
    isDefault: false,
  },
];

export default function AddressesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editing, setEditing] = useState<Address | null>(null);

  const load = useCallback(async () => {
    const stored = await localStore.get<Address[]>(KEY);
    setAddresses(stored ?? SEED);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Re-load when the user comes back from a deep link or another screen
  // mutates storage.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const persist = async (next: Address[]) => {
    setAddresses(next);
    await localStore.set(KEY, next);
  };

  const setDefault = (id: string) =>
    persist(addresses.map((a) => ({ ...a, isDefault: a.id === id })));

  const remove = (id: string) => {
    const next = addresses.filter((a) => a.id !== id);
    if (!next.some((a) => a.isDefault) && next.length > 0) next[0].isDefault = true;
    void persist(next);
  };

  const startNew = () =>
    setEditing({
      id: newId(),
      label: '',
      city: '',
      district: '',
      street: '',
      building: '',
      isDefault: addresses.length === 0,
    });

  const save = async (a: Address) => {
    const exists = addresses.some((x) => x.id === a.id);
    let next: Address[];
    if (a.isDefault) {
      // Single default invariant.
      next = exists
        ? addresses.map((x) => ({ ...x, isDefault: x.id === a.id }))
        : [...addresses.map((x) => ({ ...x, isDefault: false })), a];
    } else {
      next = exists ? addresses.map((x) => (x.id === a.id ? a : x)) : [...addresses, a];
      if (!next.some((x) => x.isDefault)) next[0].isDefault = true;
    }
    setEditing(null);
    await persist(next);
  };

  if (editing) {
    return (
      <AddressForm
        initial={editing}
        onCancel={() => setEditing(null)}
        onSave={save}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Addresses"
        right={
          <Pressable onPress={startNew} hitSlop={8}>
            <Ionicons name="add" size={26} color={colors.primary} />
          </Pressable>
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No saved addresses</Text>
            <Text style={styles.emptyBody}>
              Add a home or work address so checkout is one tap.
            </Text>
            <Button
              label="Add address"
              onPress={startNew}
              size="lg"
              style={{ marginTop: space.lg }}
            />
          </View>
        ) : (
          addresses.map((a) => (
            <View key={a.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardIconWrap}>
                  <Ionicons
                    name={a.label.toLowerCase() === 'work' ? 'business-outline' : 'home-outline'}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Text style={styles.cardLabel}>{a.label}</Text>
                    {a.isDefault ? <Pill label="Default" tone="info" /> : null}
                  </View>
                  <Text style={styles.cardLine}>
                    {a.building}, {a.street}, {a.district}, {a.city}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={() => setEditing(a)}
                  style={styles.linkBtn}
                  hitSlop={6}
                >
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={styles.linkText}>Edit</Text>
                </Pressable>
                {!a.isDefault ? (
                  <Pressable
                    onPress={() => setDefault(a.id)}
                    style={styles.linkBtn}
                    hitSlop={6}
                  >
                    <Ionicons name="star-outline" size={16} color={colors.primary} />
                    <Text style={styles.linkText}>Make default</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => remove(a.id)}
                  style={styles.linkBtn}
                  hitSlop={6}
                >
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={[styles.linkText, { color: colors.danger }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function AddressForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: Address;
  onCancel: () => void;
  onSave: (a: Address) => void;
}) {
  const insets = useSafeAreaInsets();
  const [a, setA] = useState<Address>(initial);
  const valid =
    a.label.trim() && a.city.trim() && a.district.trim() && a.street.trim() && a.building.trim();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top + space.sm, paddingHorizontal: space.lg, paddingBottom: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bg, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <Pressable onPress={onCancel} style={styles.iconBtnSmall} hitSlop={8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={{ fontSize: font.size.lg, color: colors.text, fontFamily: font.family.bold, fontWeight: font.weight.bold }}>
          {initial.label ? 'Edit address' : 'New address'}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: space.lg, paddingBottom: insets.bottom + space.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          <Field
            label="Address name"
            placeholder="Home, Work, Mom's..."
            value={a.label}
            onChangeText={(v) => setA({ ...a, label: v })}
          />
          <Field
            label="City"
            value={a.city}
            onChangeText={(v) => setA({ ...a, city: v })}
            placeholder="Riyadh"
          />
          <Field
            label="District"
            value={a.district}
            onChangeText={(v) => setA({ ...a, district: v })}
            placeholder="Al Olaya"
          />
          <Field
            label="Street"
            value={a.street}
            onChangeText={(v) => setA({ ...a, street: v })}
            placeholder="Olaya Street"
          />
          <Field
            label="Building"
            value={a.building}
            onChangeText={(v) => setA({ ...a, building: v })}
            placeholder="12"
          />
          <Field
            label="Floor (optional)"
            value={a.floor ?? ''}
            onChangeText={(v) => setA({ ...a, floor: v })}
          />
          <Field
            label="Notes for the driver (optional)"
            value={a.notes ?? ''}
            onChangeText={(v) => setA({ ...a, notes: v })}
            placeholder="Gate code, neighbor contact, etc."
            multiline
          />

          <Pressable
            onPress={() => setA({ ...a, isDefault: !a.isDefault })}
            style={styles.toggleRow}
          >
            <View style={[styles.toggleBox, a.isDefault && styles.toggleBoxOn]}>
              {a.isDefault ? (
                <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
              ) : null}
            </View>
            <Text style={styles.toggleText}>Make this my default delivery address</Text>
          </Pressable>

          <Button
            label="Save address"
            onPress={() => valid && onSave(a)}
            disabled={!valid}
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
  ...input
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={[styles.label, { marginBottom: space.xs, marginLeft: space.sm }]}>{label}</Text>
      <View style={[styles.inputWrap, input.multiline && { height: 88, alignItems: 'flex-start', paddingTop: space.md }]}>
        <TextInput
          {...input}
          placeholderTextColor={colors.textMuted}
          style={[styles.input, input.multiline && { paddingTop: 0 }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.lg },
  empty: {
    alignItems: 'center',
    paddingVertical: space.xxxl * 2,
    gap: space.sm,
  },
  emptyTitle: {
    fontSize: font.size.lg,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  emptyBody: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: space.xl,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: space.lg,
    marginBottom: space.md,
    backgroundColor: colors.card,
  },
  cardTop: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'flex-start',
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  cardLine: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: space.lg,
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkText: {
    fontSize: font.size.sm,
    color: colors.primary,
    fontWeight: font.weight.semi,
  },
  iconBtnSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.lg,
  },
  toggleBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBoxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
  },
});
