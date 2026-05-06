import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { QuantityStepper } from '@/components/QuantityStepper';
import { useCart } from '@/hooks/useCart';
import { colors, font, radius, shadow, space } from '@/constants/theme';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cart = useCart();
  const hasRx = cart.items.some((i) => i.product.rxRequired);

  if (cart.items.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top + space.xxxl }]}>
        <View style={styles.emptyIcon}>
          <Ionicons name="bag-handle-outline" size={56} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>
          Browse our pharmacy catalog and add what you need. Free delivery over 100 SAR.
        </Text>
        <Button
          label="Start shopping"
          onPress={() => router.push('/shop')}
          style={{ marginTop: space.xxl }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollBody,
          { paddingTop: insets.top + space.lg, paddingBottom: 260 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your cart</Text>
        <Text style={styles.subtitle}>
          {cart.count} {cart.count === 1 ? 'item' : 'items'}
        </Text>

        {hasRx ? (
          <View style={styles.rxBanner}>
            <Ionicons name="medical" size={18} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rxTitle}>Prescription required</Text>
              <Text style={styles.rxText}>
                Upload your prescription at checkout. A pharmacist will review before delivery.
              </Text>
            </View>
          </View>
        ) : null}

        <View style={{ gap: space.md, marginTop: space.lg }}>
          {cart.items.map((item) => (
            <View key={item.product.id} style={styles.itemCard}>
              <Image
                source={{ uri: item.product.image }}
                style={styles.itemImage}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemBrand}>{item.product.brand}</Text>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemUnit}>{item.product.unit}</Text>

                <View style={styles.itemRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                    <Text style={styles.itemPrice}>
                      {item.product.price * item.quantity}
                    </Text>
                    <Text style={styles.itemCurrency}>SAR</Text>
                  </View>
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(q) => cart.setQuantity(item.product.id, q)}
                    min={0}
                  />
                </View>

                {item.product.rxRequired ? (
                  <Pill
                    label="Rx required"
                    tone="accent"
                    style={{ marginTop: space.xs }}
                  />
                ) : null}
              </View>

              <Pressable
                style={styles.removeBtn}
                onPress={() => cart.remove(item.product.id)}
                hitSlop={8}
                accessibilityLabel={`Remove ${item.product.name}`}
              >
                <Ionicons name="close" size={16} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <SummaryRow label="Subtotal" value={`${cart.subtotal} SAR`} />
          <SummaryRow
            label="Delivery"
            value={cart.delivery === 0 ? 'Free' : `${cart.delivery} SAR`}
            valueTone={cart.delivery === 0 ? 'success' : undefined}
          />
          <SummaryRow label="VAT (15%)" value={`${cart.vat} SAR`} />
          <View style={styles.divider} />
          <SummaryRow label="Total" value={`${cart.total} SAR`} bold />

          {cart.subtotal < 100 ? (
            <View style={styles.deliveryHintRow}>
              <Ionicons name="bicycle" size={14} color={colors.primary} />
              <Text style={styles.deliveryHint}>
                Add {100 - cart.subtotal} SAR more for free delivery
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>{cart.total} SAR</Text>
        </View>
        <Button
          label="Checkout"
          onPress={() => router.push('/checkout')}
          size="lg"
          trailingIcon={
            <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
          }
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  valueTone,
}: {
  label: string;
  value: string;
  bold?: boolean;
  valueTone?: 'success';
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
          valueTone === 'success' && { color: colors.success },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollBody: {
    paddingHorizontal: space.lg,
  },
  title: {
    fontSize: font.size.display,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  rxBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    padding: space.md,
    marginTop: space.lg,
  },
  rxTitle: {
    fontSize: font.size.sm,
    color: colors.accent,
    fontWeight: font.weight.bold,
  },
  rxText: {
    fontSize: font.size.xs,
    color: colors.accent,
    marginTop: 2,
    lineHeight: 16,
  },
  itemCard: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemImage: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
  },
  itemBrand: {
    fontSize: font.size.xxs,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.semi,
    marginTop: 2,
  },
  itemUnit: {
    fontSize: font.size.xs,
    color: colors.textMuted,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.sm,
  },
  itemPrice: {
    fontSize: font.size.lg,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  itemCurrency: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  summaryCard: {
    marginTop: space.xl,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgAlt,
    gap: space.sm,
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
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.xs,
  },
  deliveryHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: space.sm,
  },
  deliveryHint: {
    fontSize: font.size.xs,
    color: colors.primary,
    fontWeight: font.weight.semi,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.floating,
  },
  footerSummary: {
    minWidth: 92,
  },
  footerLabel: {
    fontSize: font.size.xs,
    color: colors.textMuted,
  },
  footerTotal: {
    fontSize: font.size.xl,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: space.xxl,
    backgroundColor: colors.bg,
  },
  emptyIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xl,
  },
  emptyTitle: {
    fontSize: font.size.xl,
    color: colors.text,
    fontWeight: font.weight.bold,
    letterSpacing: -0.4,
  },
  emptyText: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    textAlign: 'center',
    marginTop: space.sm,
    lineHeight: 22,
  },
});
