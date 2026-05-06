import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/Logo';
import { Pill } from '@/components/Pill';
import { colors, font, radius, space } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Row = {
  icon: IoniconName;
  label: string;
  value?: string;
  hint?: string;
  badge?: string;
  destructive?: boolean;
};

type Section = { title: string; rows: Row[] };

const sections: Section[] = [
  {
    title: 'Account',
    rows: [
      { icon: 'person-outline', label: 'Personal info', value: 'Mishari · +966 50 ••• ••42' },
      { icon: 'medkit-outline', label: 'Medical profile', hint: 'Allergies, conditions' },
      { icon: 'location-outline', label: 'Addresses', value: '2 saved' },
      { icon: 'card-outline', label: 'Payment methods', value: 'Mada · STC Pay' },
    ],
  },
  {
    title: 'Pharmacy',
    rows: [
      { icon: 'document-text-outline', label: 'Prescriptions', value: '3 active' },
      { icon: 'repeat-outline', label: 'Subscriptions', hint: 'Auto-refill' },
      { icon: 'chatbubbles-outline', label: 'Chat with a pharmacist', badge: 'New' },
    ],
  },
  {
    title: 'App',
    rows: [
      { icon: 'language-outline', label: 'Language', value: 'English' },
      { icon: 'notifications-outline', label: 'Notifications' },
      { icon: 'lock-closed-outline', label: 'Privacy & data' },
    ],
  },
  {
    title: 'Support',
    rows: [
      { icon: 'help-circle-outline', label: 'Help center' },
      { icon: 'logo-whatsapp', label: 'Chat on WhatsApp' },
      { icon: 'document-outline', label: 'Terms & privacy' },
      { icon: 'log-out-outline', label: 'Log out', destructive: true },
    ],
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: space.xxxl * 2 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.heroWrap, { paddingTop: insets.top + space.lg }]}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.avatar}>
              <Logo size={42} variant="mark" />
            </View>
            <Pressable style={styles.editBtn}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </Pressable>
          </View>
          <Text style={styles.userName}>Mishari Al-Husain</Text>
          <Text style={styles.userPhone}>+966 50 ••• ••42</Text>
          <View style={styles.statRow}>
            <Stat value="14" label="Orders" />
            <View style={styles.statDivider} />
            <Stat value="3" label="Active Rx" />
            <View style={styles.statDivider} />
            <Stat value="4.9" label="Loyalty" icon="star" />
          </View>
        </View>
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.card}>
            {section.rows.map((row, idx) => (
              <View key={row.label}>
                <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
                  <View
                    style={[
                      styles.rowIcon,
                      row.destructive && { backgroundColor: colors.dangerSoft },
                    ]}
                  >
                    <Ionicons
                      name={row.icon}
                      size={18}
                      color={row.destructive ? colors.danger : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.rowLabel,
                        row.destructive && { color: colors.danger },
                      ]}
                    >
                      {row.label}
                    </Text>
                    {row.hint ? <Text style={styles.rowHint}>{row.hint}</Text> : null}
                  </View>
                  {row.badge ? (
                    <Pill label={row.badge} tone="info" />
                  ) : row.value ? (
                    <Text style={styles.rowValue}>{row.value}</Text>
                  ) : null}
                  {!row.destructive ? (
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.textMuted}
                      style={{ marginLeft: space.sm }}
                    />
                  ) : null}
                </Pressable>
                {idx < section.rows.length - 1 ? (
                  <View style={styles.rowDivider} />
                ) : null}
              </View>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.footer}>Estrogen Pharmacy · v1.0.0</Text>
    </ScrollView>
  );
}

function Stat({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statLabelRow}>
        <Text style={styles.statLabel}>{label}</Text>
        {icon ? (
          <Ionicons
            name={icon}
            size={11}
            color="rgba(255,255,255,0.85)"
            style={{ marginLeft: 4 }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroWrap: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: space.xl,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: font.size.xxl,
    color: colors.onPrimary,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.4,
  },
  userPhone: {
    fontSize: font.size.sm,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.lg,
    paddingVertical: space.md,
    marginTop: space.lg,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: font.size.xl,
    color: colors.onPrimary,
    fontWeight: font.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statLabel: {
    fontSize: font.size.xxs,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignSelf: 'center',
  },
  section: {
    paddingHorizontal: space.lg,
    marginTop: space.xl,
  },
  sectionTitle: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: space.sm,
    marginLeft: space.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    minHeight: 56,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  rowLabel: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.semi,
  },
  rowHint: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  rowValue: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    fontWeight: font.weight.medium,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: space.lg + 36 + space.md,
  },
  footer: {
    textAlign: 'center',
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: space.xxl,
  },
});
