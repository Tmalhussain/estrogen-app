import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { OrderStatus, orders, statusMeta, trackingSteps } from '@/data/orders';
import { colors, font, radius, shadow, space } from '@/constants/theme';

const STEP_ORDER: OrderStatus[] = ['placed', 'preparing', 'out_for_delivery', 'delivered'];

export default function OrderDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundTitle}>Order not found</Text>
        <Button label="Back" onPress={() => router.back()} />
      </View>
    );
  }

  const meta = statusMeta[order.status];
  const currentIdx = STEP_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => router.back()}
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>{order.id}</Text>
          <Text style={styles.headerSubtitle}>{order.placedAt}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusHero}>
          <Pill label={meta.label} tone={meta.tone} />
          <Text style={styles.statusTitle}>
            {order.status === 'out_for_delivery'
              ? 'Your order is on the way'
              : order.status === 'preparing'
              ? "We're packing your order"
              : order.status === 'delivered'
              ? 'Delivered. Hope you feel great.'
              : order.status === 'cancelled'
              ? 'This order was cancelled'
              : 'Order received'}
          </Text>
          <Text style={styles.statusSubtitle}>{order.estimatedDelivery}</Text>
        </View>

        {!isCancelled ? (
          <View style={styles.tracker}>
            {trackingSteps.map((step, i) => {
              const reached = i <= currentIdx;
              const current = i === currentIdx;
              return (
                <View key={step.key} style={styles.step}>
                  <View style={styles.stepLeft}>
                    <View
                      style={[
                        styles.stepDot,
                        reached && styles.stepDotActive,
                        current && styles.stepDotCurrent,
                      ]}
                    >
                      {reached && !current ? (
                        <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                      ) : null}
                    </View>
                    {i < trackingSteps.length - 1 ? (
                      <View
                        style={[
                          styles.stepLine,
                          reached && i < currentIdx && styles.stepLineActive,
                        ]}
                      />
                    ) : null}
                  </View>
                  <View style={[styles.stepBody, current && styles.stepBodyCurrent]}>
                    <Text
                      style={[
                        styles.stepLabel,
                        reached && { color: colors.text },
                        current && { color: colors.primary },
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.stepDescription}>{step.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {order.driverName && order.status === 'out_for_delivery' ? (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{order.driverName}</Text>
              <Text style={styles.driverRole}>Delivery driver</Text>
            </View>
            <Pressable
              style={styles.callBtn}
              onPress={() =>
                order.driverPhone &&
                Linking.openURL(`tel:${order.driverPhone.replace(/\s|•/g, '')}`)
              }
            >
              <Ionicons name="call" size={18} color={colors.onPrimary} />
            </Pressable>
            <Pressable style={[styles.callBtn, { backgroundColor: colors.accent }]}>
              <Ionicons name="chatbubble" size={18} color={colors.onPrimary} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>
          <View style={styles.row}>
            <Ionicons name="location" size={18} color={colors.primary} />
            <Text style={styles.rowText}>{order.address}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.itemList}>
            {order.items.map((it, idx) => (
              <View
                key={it.product.id}
                style={[
                  styles.itemRow,
                  idx < order.items.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                  },
                ]}
              >
                <Image source={{ uri: it.product.image }} style={styles.itemImage} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {it.product.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {it.quantity} × {it.product.price} SAR
                  </Text>
                </View>
                <Text style={styles.itemTotal}>{it.quantity * it.product.price} SAR</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment</Text>
          <View style={styles.summaryCard}>
            <SummaryRow label="Subtotal" value={`${order.subtotal} SAR`} />
            <SummaryRow
              label="Delivery"
              value={order.delivery === 0 ? 'Free' : `${order.delivery} SAR`}
            />
            <SummaryRow label="VAT (15%)" value={`${order.vat} SAR`} />
            <View style={styles.divider} />
            <SummaryRow label="Total paid" value={`${order.total} SAR`} bold />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Button
          label={order.status === 'delivered' ? 'Reorder' : 'Need help?'}
          variant={order.status === 'delivered' ? 'primary' : 'secondary'}
          size="lg"
          onPress={() => router.push('/cart')}
          style={{ flex: 1 }}
          leadingIcon={
            order.status === 'delivered' ? (
              <Ionicons name="repeat" size={18} color={colors.onPrimary} />
            ) : (
              <Ionicons name="chatbubble-ellipses" size={18} color={colors.primary} />
            )
          }
        />
      </View>
    </View>
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
          bold && { color: colors.text, fontWeight: font.weight.bold },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.summaryValue,
          bold && { fontSize: font.size.lg, fontWeight: font.weight.bold },
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
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    backgroundColor: colors.bg,
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
  headerSubtitle: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  statusHero: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.lg,
    gap: space.sm,
  },
  statusTitle: {
    fontSize: font.size.xxl,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  statusSubtitle: {
    fontSize: font.size.sm,
    color: colors.textSoft,
  },
  tracker: {
    marginHorizontal: space.lg,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  step: {
    flexDirection: 'row',
    gap: space.md,
  },
  stepLeft: {
    width: 24,
    alignItems: 'center',
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.bgAlt,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotCurrent: {
    backgroundColor: colors.bg,
    borderColor: colors.primary,
    borderWidth: 4,
  },
  stepLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepBody: {
    flex: 1,
    paddingBottom: space.lg,
  },
  stepBodyCurrent: {},
  stepLabel: {
    fontSize: font.size.md,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
  },
  stepDescription: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 18,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.lg,
    marginTop: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDim,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  driverRole: {
    fontSize: font.size.xs,
    color: colors.textSoft,
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  row: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    padding: space.md,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
  },
  rowText: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.medium,
  },
  itemList: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
  },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
  },
  itemName: {
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.semi,
  },
  itemMeta: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  summaryCard: {
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
    fontVariant: ['tabular-nums'],
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: space.xs,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.floating,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.xl,
    gap: space.md,
    backgroundColor: colors.bg,
  },
  notFoundTitle: {
    fontSize: font.size.lg,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
});
