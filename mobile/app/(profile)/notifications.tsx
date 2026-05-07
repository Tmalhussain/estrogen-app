import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { localStore } from '@/lib/local-store';
import { colors, font, radius, space } from '@/constants/theme';

const KEY = 'estrogen.notification.prefs';

type Prefs = {
  orders: boolean;
  prescriptionUpdates: boolean;
  promotions: boolean;
  refillReminders: boolean;
  pharmacistMessages: boolean;
};

const DEFAULTS: Prefs = {
  orders: true,
  prescriptionUpdates: true,
  promotions: false,
  refillReminders: true,
  pharmacistMessages: true,
};

const ROWS: { key: keyof Prefs; title: string; subtitle: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'orders', title: 'Order updates', subtitle: 'Pharmacist review, packing, on-the-way, delivered.', icon: 'bag-handle-outline' },
  { key: 'prescriptionUpdates', title: 'Prescription updates', subtitle: 'When a pharmacist approves or has questions.', icon: 'document-text-outline' },
  { key: 'pharmacistMessages', title: 'Pharmacist chat messages', subtitle: 'Replies in your conversation thread.', icon: 'chatbubble-ellipses-outline' },
  { key: 'refillReminders', title: 'Refill reminders', subtitle: 'A nudge a few days before your script runs out.', icon: 'repeat-outline' },
  { key: 'promotions', title: 'Offers and tips', subtitle: 'Occasional health tips and discounts. Off by default.', icon: 'pricetags-outline' },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    void (async () => {
      const stored = await localStore.get<Prefs>(KEY);
      if (stored) setPrefs({ ...DEFAULTS, ...stored });
    })();
  }, []);

  const update = async (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    await localStore.set(KEY, next);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Notifications" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        {ROWS.map((row, idx) => (
          <View
            key={row.key}
            style={[
              styles.row,
              idx === 0 && styles.firstRow,
              idx === ROWS.length - 1 && styles.lastRow,
              idx !== ROWS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider },
            ]}
          >
            <View style={styles.iconWrap}>
              <Ionicons name={row.icon} size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{row.title}</Text>
              <Text style={styles.subtitle}>{row.subtitle}</Text>
            </View>
            <Switch
              value={prefs[row.key]}
              onValueChange={(v) => update(row.key, v)}
              trackColor={{ false: colors.bgAlt, true: colors.primary }}
              thumbColor={colors.bg}
            />
          </View>
        ))}

        <Text style={styles.note}>
          You can also manage push permissions in your phone's settings.
          Critical order alerts (e.g. "your driver couldn't find you") will
          still notify even if "Order updates" is off.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 72,
  },
  firstRow: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  lastRow: {
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    marginBottom: space.lg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  subtitle: {
    fontSize: font.size.xs,
    color: colors.textSoft,
    marginTop: 2,
    lineHeight: 16,
  },
  note: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: space.lg,
    paddingHorizontal: space.sm,
    lineHeight: 18,
  },
});
