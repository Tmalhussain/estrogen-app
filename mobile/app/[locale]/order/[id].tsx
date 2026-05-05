import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useLocale } from '../../../hooks/useLocale';
import { Colors } from '../../../constants/colors';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { Button } from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/useTranslation';
import { useOrdersStore } from '../../../store/ordersStore';

interface StatusConfig {
  icon: IconName;
  color: string;
  bgColor: string;
}

const statusIcons: Record<string, StatusConfig> = {
  placed:           { icon: 'checkCircle',    color: Colors.primary, bgColor: Colors.primarySoft },
  pending_review:   { icon: 'clock',          color: Colors.warning, bgColor: Colors.warningLight },
  approved:         { icon: 'check',          color: Colors.success, bgColor: Colors.successLight },
  packing:          { icon: 'package',        color: Colors.primary, bgColor: Colors.primarySoft },
  out_for_delivery: { icon: 'truck',          color: Colors.accent,  bgColor: Colors.accentLight },
  delivered:        { icon: 'checkCircle',     color: Colors.success, bgColor: Colors.successLight },
  cancelled:        { icon: 'xCircle',        color: Colors.danger,  bgColor: Colors.dangerLight },
};

const timelineStepKeys = ['placed', 'pending_review', 'approved', 'packing', 'out_for_delivery', 'delivered'];

const timelineIcons: Record<string, IconName> = {
  placed: 'checkCircle',
  pending_review: 'clock',
  approved: 'check',
  packing: 'package',
  out_for_delivery: 'truck',
  delivered: 'celebration',
};

export default function OrderDetailScreen() {
  const locale = useLocale();
  const { id, isNew } = useLocalSearchParams<{ id: string; isNew?: string }>();
  const { t, tn, localize, isRTL, flexDir, align } = useTranslation();

  const getOrder = useOrdersStore((s) => s.getOrder);
  const order = getOrder(id ?? '');

  // Order not found
  if (!order) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={[styles.header, { flexDirection: flexDir }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
            <Icon name={isRTL ? 'chevronRight' : 'chevronLeft'} size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('orderDetails')}</Text>
          <View style={styles.headerBtn} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Icon name="package" size={48} color={Colors.textTertiary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, textAlign: 'center' }}>
            {t('orderNotFound')}
          </Text>
          <Button
            title={t('continueShopping')}
            onPress={() => router.replace(`/${locale}/(tabs)`)}
            variant="outline"
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const statusCfg = statusIcons[order.status] ?? statusIcons['placed'];
  const currentStep = timelineStepKeys.indexOf(order.status);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: flexDir }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Icon name="back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orderDetails')}</Text>
        <TouchableOpacity onPress={() => router.replace(`/${locale}/(tabs)`)} style={styles.headerBtn}>
          <Icon name="home" size={22} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Banner */}
        {isNew === 'true' && (
          <View style={[styles.successBanner, { flexDirection: flexDir }]}>
            <View style={styles.successIconWrap}>
              <Icon name="celebration" size={28} color={Colors.success} />
            </View>
            <View style={styles.successTextWrap}>
              <Text style={[styles.successTitle, { textAlign: align }]}>
                {t('orderSuccess')}
              </Text>
              <Text style={[styles.successSubtitle, { textAlign: align }]}>
                {t('orderSuccessDesc')}
              </Text>
            </View>
          </View>
        )}

        {/* Order ID & Status */}
        <View style={styles.card}>
          <View style={[styles.orderIdRow, { flexDirection: flexDir }]}>
            <Text style={styles.orderIdLabel}>{t('orderNumber')}</Text>
            <Text style={styles.orderId}>{order.id}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusCfg.bgColor, flexDirection: flexDir },
            ]}
          >
            <Icon name={statusCfg.icon} size={18} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>
              {tn('orderStatus', order.status)}
            </Text>
          </View>
        </View>

        {/* Delivery Timeline */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: align }]}>{t('trackOrder')}</Text>
          <View style={styles.timeline}>
            {timelineStepKeys.map((step, idx) => {
              const done = idx <= currentStep;
              const isCurrent = idx === currentStep;
              const stepIcon = timelineIcons[step];
              return (
                <View key={step} style={[styles.timelineItem, { flexDirection: flexDir }]}>
                  <View style={styles.timelineTrack}>
                    <View
                      style={[
                        styles.timelineDot,
                        done && styles.timelineDotDone,
                        isCurrent && styles.timelineDotCurrent,
                      ]}
                    >
                      {done ? (
                        <Icon
                          name={isCurrent ? stepIcon : 'check'}
                          size={isCurrent ? 14 : 10}
                          color={Colors.white}
                        />
                      ) : null}
                    </View>
                    {idx < timelineStepKeys.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          done && idx < currentStep && styles.timelineLineDone,
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.timelineLabel,
                      { textAlign: align },
                      done && styles.timelineLabelDone,
                      isCurrent && styles.timelineLabelCurrent,
                    ]}
                  >
                    {tn('orderStatus', step)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Products List */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: align }]}>
            {t('products')} ({order.items.length})
          </Text>
          {order.items.map((item, i) => (
            <View
              key={i}
              style={[
                styles.productRow,
                { flexDirection: flexDir },
                i < order.items.length - 1 && styles.productRowBorder,
              ]}
            >
              <View style={[styles.productQtyBadge, { flexDirection: flexDir }]}>
                <Text style={styles.productQtyText}>{item.quantity}x</Text>
              </View>
              <Text style={[styles.productName, { textAlign: align }]}>
                {localize(item.nameAr, item.nameEn)}
              </Text>
              <Text style={styles.productPrice}>
                {(item.price * item.quantity).toFixed(2)} {t('sar')}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={[styles.totalRow, { flexDirection: flexDir }]}>
            <Text style={styles.totalLabel}>{t('total')}</Text>
            <Text style={styles.totalValue}>
              {order.total.toFixed(2)} {t('sar')}
            </Text>
          </View>
        </View>

        {/* Delivery Address */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { textAlign: align }]}>
            {t('deliveryAddress')}
          </Text>
          <View style={[styles.addressRow, { flexDirection: flexDir }]}>
            <View style={styles.addressIconWrap}>
              <Icon name="mapPin" size={18} color={Colors.primary} />
            </View>
            <Text style={[styles.addressText, { textAlign: align }]}>
              {localize(order.deliveryAddressAr, order.deliveryAddressEn)}
            </Text>
          </View>
        </View>

        {/* Prescription Notice */}
        {order.requiresPrescription && (
          <View style={[styles.rxCard, { flexDirection: flexDir }]}>
            <View style={styles.rxIconWrap}>
              <Icon name="info" size={18} color={Colors.primary} />
            </View>
            <Text style={[styles.rxCardText, { textAlign: align }]}>
              {t('rxOrderNote')}
            </Text>
          </View>
        )}

        {/* Continue Shopping */}
        <Button
          title={t('continueShopping')}
          onPress={() => router.replace(`/${locale}/(tabs)`)}
          variant="outline"
          size="lg"
          style={{ marginTop: 12 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },

  // Success Banner
  successBanner: {
    backgroundColor: Colors.successLight,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  successIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTextWrap: {
    flex: 1,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.success,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: Colors.success,
    lineHeight: 19,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
  },

  // Order ID
  orderIdRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderIdLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.3,
  },
  statusBadge: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Timeline
  timeline: {
    gap: 0,
  },
  timelineItem: {
    alignItems: 'flex-start',
    gap: 12,
  },
  timelineTrack: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  timelineDotDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timelineDotCurrent: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: Colors.border,
    marginTop: 2,
  },
  timelineLineDone: {
    backgroundColor: Colors.primary,
  },
  timelineLabel: {
    fontSize: 14,
    color: Colors.textTertiary,
    paddingTop: 4,
    flex: 1,
  },
  timelineLabelDone: {
    color: Colors.text,
    fontWeight: '600',
  },
  timelineLabelCurrent: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // Products
  productRow: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  productRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  productQtyBadge: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  productQtyText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    flexShrink: 0,
    marginStart: 8,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  totalRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primaryDark,
  },

  // Address
  addressRow: {
    alignItems: 'center',
    gap: 10,
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
    lineHeight: 21,
  },

  // Prescription Notice
  rxCard: {
    backgroundColor: Colors.infoLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rxIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxCardText: {
    flex: 1,
    fontSize: 14,
    color: Colors.info,
    fontWeight: '500',
    lineHeight: 22,
  },
});
