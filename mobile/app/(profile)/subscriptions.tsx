import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { colors, font, space } from '@/constants/theme';

export default function SubscriptionsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Subscriptions" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        <View style={styles.empty}>
          <View style={styles.iconBlock}>
            <Ionicons name="repeat" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>No auto-refills set up yet</Text>
          <Text style={styles.description}>
            Save 10% on monthly refills of your regular medications. We
            schedule the order, charge your default payment method, and
            deliver before you run out.
          </Text>
          <View style={styles.bullets}>
            <Bullet text="Pause or cancel any time." />
            <Bullet text="Skip a delivery from the order page." />
            <Bullet text="Pharmacist double-checks every refill." />
          </View>
          <Button
            label="Browse subscribable products"
            onPress={() => {
              /* TODO link to a /shop?subscribable filter when filter is wired */
            }}
            size="lg"
            style={{ marginTop: space.xl, alignSelf: 'stretch' }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.lg },
  empty: {
    paddingVertical: space.xxl,
    alignItems: 'center',
  },
  iconBlock: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.lg,
  },
  title: {
    fontSize: font.size.xl,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  description: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    textAlign: 'center',
    paddingHorizontal: space.md,
    marginTop: space.sm,
    lineHeight: 22,
  },
  bullets: {
    marginTop: space.xl,
    gap: space.sm,
    alignSelf: 'stretch',
    paddingHorizontal: space.lg,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.text,
  },
});
