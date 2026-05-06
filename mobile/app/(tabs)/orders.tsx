import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pill } from '@/components/Pill';
import { Order, OrderStatus, orders, statusMeta } from '@/data/orders';
import { colors, font, radius, space } from '@/constants/theme';

type Tab = 'active' | 'past';

const ACTIVE_STATUSES: OrderStatus[] = ['placed', 'preparing', 'out_for_delivery'];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // ?placed=1 is set by the checkout success path so we can show a brief
  // success banner. We strip it from the URL after a few seconds so back-
  // navigation into the tab from elsewhere doesn't keep showing it.
  const params = useLocalSearchParams<{ placed?: string }>();
  const [showPlaced, setShowPlaced] = useState(params.placed === '1');
  useEffect(() => {
    if (!showPlaced) return;
    const t = setTimeout(() => {
      setShowPlaced(false);
      router.setParams({ placed: undefined });
    }, 4000);
    return () => clearTimeout(t);
  }, [showPlaced, router]);
  const [tab, setTab] = useState<Tab>('active');

  const active = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(o.status)),
    []
  );
  const past = useMemo(
    () => orders.filter((o) => !ACTIVE_STATUSES.includes(o.status)),
    []
  );
  const data = tab === 'active' ? active : past;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>Your orders</Text>
        {showPlaced ? (
          <View style={styles.placedBanner}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.placedBannerText}>
              Order placed. Your pharmacist will review it shortly.
            </Text>
          </View>
        ) : null}
        <View style={styles.tabRow}>
          <TabBtn
            label={`Active · ${active.length}`}
            active={tab === 'active'}
            onPress={() => setTab('active')}
          />
          <TabBtn
            label={`Past · ${past.length}`}
            active={tab === 'past'}
            onPress={() => setTab('past')}
          />
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(o) => o.id}
        renderItem={({ item }) => <OrderRow order={item} />}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {tab === 'active' ? 'No active orders' : 'No past orders'}
            </Text>
            <Text style={styles.emptyText}>
              {tab === 'active'
                ? 'Place an order and track it here.'
                : 'Your delivered and cancelled orders will appear here.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

function TabBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabBtn, active && styles.tabBtnActive]}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function OrderRow({ order }: { order: Order }) {
  const meta = statusMeta[order.status];
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  const preview = order.items.slice(0, 3);
  return (
    <Link href={`/order/${order.id}`} asChild>
      <Pressable
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}
      >
        <View style={styles.cardTop}>
          <View>
            <Text style={styles.orderId}>{order.id}</Text>
            <Text style={styles.orderDate}>{order.placedAt}</Text>
          </View>
          <Pill label={meta.label} tone={meta.tone} />
        </View>

        <View style={styles.itemRow}>
          {preview.map((it, i) => (
            <Image
              key={it.product.id}
              source={{ uri: it.product.image }}
              style={[
                styles.thumb,
                {
                  marginLeft: i === 0 ? 0 : -10,
                  zIndex: preview.length - i,
                },
              ]}
              contentFit="cover"
            />
          ))}
          <View style={{ flex: 1, marginLeft: space.md }}>
            <Text style={styles.itemSummary} numberOfLines={1}>
              {order.items[0].product.name}
              {order.items.length > 1 ? ` + ${order.items.length - 1} more` : ''}
            </Text>
            <Text style={styles.itemMeta}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} · {order.total} SAR
            </Text>
          </View>
        </View>

        {order.status === 'out_for_delivery' && order.driverName ? (
          <View style={styles.driverRow}>
            <Ionicons name="bicycle" size={16} color={colors.primary} />
            <Text style={styles.driverText}>
              {order.driverName} · {order.estimatedDelivery}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </View>
        ) : (
          <Text style={styles.eta}>{order.estimatedDelivery}</Text>
        )}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: font.size.display,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.6,
    marginBottom: space.lg,
  },
  placedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.md,
  },
  placedBannerText: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.success,
    fontWeight: font.weight.semi,
    lineHeight: 18,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgAlt,
    borderRadius: radius.pill,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  tabBtnActive: {
    backgroundColor: colors.bg,
    ...{
      shadowColor: '#2A0A1F',
      shadowOpacity: 0.06,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  },
  tabText: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
  },
  tabTextActive: {
    color: colors.text,
  },
  list: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: space.xxxl,
  },
  card: {
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.md,
  },
  orderId: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  orderDate: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.bg,
    backgroundColor: colors.bgAlt,
  },
  itemSummary: {
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.semi,
  },
  itemMeta: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  eta: {
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    fontSize: font.size.xs,
    color: colors.textMuted,
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  driverText: {
    flex: 1,
    fontSize: font.size.xs,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
  },
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
  emptyText: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: space.xxl,
  },
});
