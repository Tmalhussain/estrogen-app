import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLocale } from '../../../hooks/useLocale';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { useTranslation } from '../../../i18n/useTranslation';
import { Button } from '../../../components/ui/Button';
import { useOrdersStore } from '../../../store/ordersStore';

const statusColors: Record<string, string> = {
  placed: Colors.primary,
  pending_review: Colors.warning,
  pharmacist_review: Colors.warning,
  approved: Colors.success,
  packing: Colors.primary,
  out_for_delivery: Colors.accent,
  delivered: Colors.success,
  cancelled: Colors.danger,
};

export default function OrdersScreen() {
  const locale = useLocale();
  const { t, tn, localize, isRTL, flexDir, align } = useTranslation();
  const orders = useOrdersStore((s) => s.orders);

  if (orders.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: align }]}>{t('myOrders')}</Text>
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Icon name="package" size={40} color={Colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { textAlign: align }]}>{t('noOrders')}</Text>
          <Text style={[styles.emptySubtext, { textAlign: 'center' }]}>{t('noOrdersDesc')}</Text>
          <Button
            title={t('startShopping')}
            onPress={() => router.push(`/${locale}/(tabs)/shop`)}
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign: align }]}>{t('myOrders')}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: order }) => {
          const statusColor = statusColors[order.status] ?? Colors.primary;
          return (
            <TouchableOpacity
              style={styles.orderCard}
              onPress={() => router.push(`/${locale}/order/${order.id}`)}
              activeOpacity={0.85}
            >
              {/* Top: Order ID + Status Badge */}
              <View style={[styles.cardTop, { flexDirection: flexDir }]}>
                <Text
                  style={[styles.orderId, { textAlign: align, flex: 1 }]}
                  numberOfLines={1}
                >
                  {order.id}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor + '18', flexShrink: 0 },
                  ]}
                >
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {tn('orderStatus', order.status)}
                  </Text>
                </View>
              </View>

              {/* Items Preview */}
              <View style={styles.itemsPreview}>
                {order.items.slice(0, 2).map((item, i) => (
                  <Text key={i} style={[styles.itemPreviewText, { textAlign: align }]} numberOfLines={1}>
                    {localize(item.nameAr, item.nameEn)} x{item.quantity}
                  </Text>
                ))}
                {order.items.length > 2 && (
                  <Text style={[styles.moreItems, { textAlign: align }]}>
                    +{order.items.length - 2} {t('moreItems')}
                  </Text>
                )}
              </View>

              {/* Bottom: Date + Total + Actions */}
              <View style={[styles.cardBottom, { flexDirection: flexDir }]}>
                <View>
                  <Text style={[styles.date, { textAlign: align }]}>{order.date}</Text>
                  <Text style={[styles.total, { textAlign: align }]}>
                    {order.total.toFixed(2)} {t('sar')}
                  </Text>
                </View>
                <View style={[styles.cardActions, { flexDirection: flexDir }]}>
                  {order.status === 'delivered' && (
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => router.push(`/${locale}/(tabs)/shop`)}
                    >
                      <Icon name="refresh" size={14} color={Colors.primary} />
                      <Text style={styles.reorderText}>{t('reorder')}</Text>
                    </TouchableOpacity>
                  )}
                  <Icon
                    name={isRTL ? 'chevronLeft' : 'chevronRight'}
                    size={18}
                    color={Colors.textTertiary}
                  />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // Order Card
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statusBadge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Items
  itemsPreview: {
    marginBottom: 12,
    gap: 2,
  },
  itemPreviewText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
  },
  moreItems: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // Card Bottom
  cardBottom: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 12,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  total: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  cardActions: {
    alignItems: 'center',
    gap: 10,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.overlayLight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  reorderText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
});
