import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/Button';
import { useCart } from '@/hooks/useCart';
import { colors, font, radius, shadow, space } from '@/constants/theme';

type DeliveryOption = 'standard' | 'express';
type PaymentOption = 'mada' | 'stcpay' | 'applepay' | 'cod';

const ADDRESSES = [
  {
    id: 'home',
    label: 'Home',
    line: 'Building 12, Olaya Street, Al Olaya, Riyadh',
    icon: 'home-outline' as const,
  },
  {
    id: 'work',
    label: 'Work',
    line: 'Tower B, KAFD, Riyadh',
    icon: 'business-outline' as const,
  },
];

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cart = useCart();
  const [addressId, setAddressId] = useState(ADDRESSES[0].id);
  const [delivery, setDelivery] = useState<DeliveryOption>('standard');
  const [payment, setPayment] = useState<PaymentOption>('mada');
  const [placing, setPlacing] = useState(false);

  const expressFee = delivery === 'express' ? 20 : 0;
  const total = cart.total + expressFee;

  const place = () => {
    setPlacing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setTimeout(() => {
      cart.clear();
      setPlacing(false);
      Alert.alert(
        'Order placed!',
        'Your pharmacist will review the order shortly. You can track delivery from the Orders tab.',
        [{ text: 'View orders', onPress: () => router.replace('/orders') }]
      );
    }, 700);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => router.back()}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: space.lg,
          paddingBottom: 140 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Delivery address">
          {ADDRESSES.map((a) => (
            <Option
              key={a.id}
              selected={addressId === a.id}
              onPress={() => setAddressId(a.id)}
              icon={a.icon}
              title={a.label}
              subtitle={a.line}
            />
          ))}
          <AddRow label="Add new address" />
        </Section>

        <Section title="Delivery option">
          <Option
            selected={delivery === 'standard'}
            onPress={() => setDelivery('standard')}
            icon="bicycle-outline"
            title="Standard · 2-4 hours"
            subtitle="Free over 100 SAR"
            trailing={cart.delivery === 0 ? 'Free' : `${cart.delivery} SAR`}
          />
          <Option
            selected={delivery === 'express'}
            onPress={() => setDelivery('express')}
            icon="flash-outline"
            title="Express · within 60 min"
            subtitle="Available in Riyadh"
            trailing={`+20 SAR`}
          />
        </Section>

        <Section title="Payment">
          <Option
            selected={payment === 'mada'}
            onPress={() => setPayment('mada')}
            icon="card-outline"
            title="Mada / Visa / Mastercard"
            subtitle="•••• 4218 — Default"
          />
          <Option
            selected={payment === 'stcpay'}
            onPress={() => setPayment('stcpay')}
            icon="phone-portrait-outline"
            title="STC Pay"
            subtitle="+966 50 ••• ••42"
          />
          <Option
            selected={payment === 'applepay'}
            onPress={() => setPayment('applepay')}
            icon="logo-apple"
            title="Apple Pay"
            subtitle="One-tap with Face ID"
          />
          <Option
            selected={payment === 'cod'}
            onPress={() => setPayment('cod')}
            icon="cash-outline"
            title="Cash on delivery"
            subtitle="Exact change preferred"
          />
        </Section>

        <Section title="Order summary">
          <View style={styles.summaryCard}>
            {cart.items.map((it) => (
              <View key={it.product.id} style={styles.summaryItemRow}>
                <Text style={styles.summaryItemName} numberOfLines={1}>
                  {it.quantity}× {it.product.name}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  {it.product.price * it.quantity} SAR
                </Text>
              </View>
            ))}
            <View style={styles.divider} />
            <SummaryRow label="Subtotal" value={`${cart.subtotal} SAR`} />
            <SummaryRow
              label="Delivery"
              value={cart.delivery + expressFee === 0 ? 'Free' : `${cart.delivery + expressFee} SAR`}
            />
            <SummaryRow label="VAT (15%)" value={`${cart.vat} SAR`} />
            <View style={styles.divider} />
            <SummaryRow label="Total" value={`${total} SAR`} bold />
          </View>
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Button
          label={`Place order · ${total} SAR`}
          onPress={place}
          loading={placing}
          size="lg"
          style={{ flex: 1 }}
          trailingIcon={
            <Ionicons name="lock-closed" size={16} color={colors.onPrimary} />
          }
        />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: space.sm }}>{children}</View>
    </View>
  );
}

function Option({
  icon,
  title,
  subtitle,
  trailing,
  selected,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  trailing?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <View style={[styles.optionIcon, selected && { backgroundColor: colors.bg }]}>
        <Ionicons
          name={icon}
          size={18}
          color={selected ? colors.primary : colors.textSoft}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.optionSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? (
        <Text style={[styles.optionTrailing, selected && { color: colors.primary }]}>
          {trailing}
        </Text>
      ) : null}
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function AddRow({ label }: { label: string }) {
  return (
    <Pressable style={styles.addRow}>
      <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
      <Text style={styles.addRowLabel}>{label}</Text>
    </Pressable>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text
        style={[
          styles.summaryLabel,
          bold && { fontWeight: font.weight.bold, color: colors.text },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.summaryValue,
          bold && { fontSize: font.size.xl, fontWeight: font.weight.bold },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgAlt,
  },
  headerTitle: {
    fontSize: font.size.lg,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  section: {
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
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDim,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.semi,
  },
  optionSubtitle: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  optionTrailing: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
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
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addRowLabel: {
    fontSize: font.size.sm,
    color: colors.primary,
    fontWeight: font.weight.semi,
  },
  summaryCard: {
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgAlt,
    gap: space.sm,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.md,
  },
  summaryItemName: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.textSoft,
  },
  summaryItemPrice: {
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.semi,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: font.size.sm,
    color: colors.textSoft,
  },
  summaryValue: {
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.semi,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.floating,
  },
});
