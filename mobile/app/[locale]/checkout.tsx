import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLocale } from '../../hooks/useLocale';
import { Colors } from '../../constants/colors';
import { Icon, type IconName } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { useTranslation } from '../../i18n/useTranslation';
import { useCartStore } from '../../store';
import { useOrdersStore } from '../../store/ordersStore';
import { useNotificationsStore } from '../../store/notificationsStore';
import { useAddressesStore } from '../../store/addressesStore';

interface PaymentMethod {
  id: string;
  labelKey: string;
  icon: IconName;
}

const paymentMethods: PaymentMethod[] = [
  { id: 'stc', labelKey: 'stcPay', icon: 'smartphone' },
  { id: 'card', labelKey: 'cardPayment', icon: 'creditCard' },
  { id: 'apple', labelKey: 'applePay', icon: 'appleLogo' },
];

export default function CheckoutScreen() {
  const locale = useLocale();
  const { items, total, clearCart, discount, promoCode } = useCartStore();
  const addOrder = useOrdersStore((s) => s.addOrder);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const { addresses, initialized: addrInit, initSeedData: initAddresses } = useAddressesStore();

  React.useEffect(() => {
    if (!addrInit) initAddresses();
  }, [addrInit]);

  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [selectedAddr, setSelectedAddr] = useState(defaultAddr?.id ?? '');
  const [selectedPayment, setSelectedPayment] = useState('stc');
  const [deliveryType, setDeliveryType] = useState<'standard' | 'express'>('standard');
  const [discreet, setDiscreet] = useState(true);
  const [loading, setLoading] = useState(false);
  const { t, localize, isRTL, flexDir, align } = useTranslation();

  // Guard: redirect if cart is empty
  if (items.length === 0) {
    router.replace(`/${locale}/(tabs)/cart` as any);
    return null;
  }

  const subtotal = total();
  const deliveryFee = subtotal >= 150 ? 0 : deliveryType === 'express' ? 45 : 25;
  const afterDiscount = subtotal - discount;
  const vat = afterDiscount * 0.15;
  const grandTotal = afterDiscount + deliveryFee + vat;
  const hasPrescription = items.some((i) => i.requiresPrescription);

  // Build bilingual delivery address strings
  const selectedAddress = addresses.find((a) => a.id === selectedAddr) ?? addresses[0];
  const addressStrAr = selectedAddress
    ? `${selectedAddress.district}، ${selectedAddress.street}`
    : '';
  const addressStrEn = selectedAddress
    ? `${selectedAddress.districtEn || selectedAddress.district}, ${selectedAddress.streetEn || selectedAddress.street}`
    : '';

  const handleOrder = () => {
    setLoading(true);
    setTimeout(() => {
      // Create a real order in the orders store
      const order = addOrder({
        total: grandTotal,
        items: items.map((i) => ({
          productId: i.productId,
          nameAr: i.nameAr,
          nameEn: i.nameEn,
          quantity: i.quantity,
          price: i.price,
        })),
        requiresPrescription: hasPrescription,
        deliveryAddressAr: addressStrAr,
        deliveryAddressEn: addressStrEn,
        estimatedDelivery: deliveryType === 'express'
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        paymentMethod: selectedPayment,
        deliveryType,
        discreetPackaging: discreet,
      });

      // Push a notification for the new order
      addNotification({
        type: 'order',
        titleAr: 'تم استلام طلبكِ',
        titleEn: 'Order Received',
        bodyAr: `تم تأكيد طلبكِ ${order.id} بنجاح. سيتم تجهيزه قريباً.`,
        bodyEn: `Your order ${order.id} has been confirmed. It will be prepared shortly.`,
      });

      clearCart();
      setLoading(false);
      router.replace({
        pathname: `/${locale}/order/[id]`,
        params: { id: order.id, isNew: 'true' },
      });
    }, 1800);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: flexDir }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Icon name={isRTL ? 'chevronRight' : 'chevronLeft'} size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('checkout')}</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Prescription Warning */}
        {hasPrescription && (
          <View style={[styles.rxWarningCard, { flexDirection: flexDir }]}>
            <View style={styles.rxWarningIconWrap}>
              <Icon name="alertTriangle" size={20} color={Colors.warning} />
            </View>
            <Text style={[styles.rxWarningText, { textAlign: align }]}>
              {t('rxWarning')}
            </Text>
          </View>
        )}

        {/* Address Section */}
        <SectionHeader title={t('deliveryAddress')} icon="mapPin" flexDir={flexDir} />
        {addresses.map((addr) => (
          <TouchableOpacity
            key={addr.id}
            style={[styles.optionCard, selectedAddr === addr.id && styles.optionCardActive]}
            onPress={() => setSelectedAddr(addr.id)}
          >
            <View style={[styles.optionInner, { flexDirection: flexDir }]}>
              <RadioCircle selected={selectedAddr === addr.id} />
              <View style={styles.optionBody}>
                <Text style={[styles.optionLabel, { textAlign: align }]}>{addr.label}</Text>
                <Text style={[styles.optionDetail, { textAlign: align }]}>
                  {t(addr.city as any)}, {addr.district}
                </Text>
                <Text style={[styles.optionDetail, { textAlign: align }]}>{addr.street}</Text>
              </View>
              <Icon name="mapPin" size={18} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.addNewBtn, { flexDirection: flexDir }]}
          onPress={() => router.push(`/${locale}/profile/addresses` as any)}
        >
          <Icon name="plus" size={16} color={Colors.primary} />
          <Text style={styles.addNewText}>{t('addNewAddress')}</Text>
        </TouchableOpacity>

        {/* Delivery Type */}
        <SectionHeader title={t('deliveryType')} icon="truck" flexDir={flexDir} />
        <TouchableOpacity
          style={[styles.optionCard, deliveryType === 'standard' && styles.optionCardActive]}
          onPress={() => setDeliveryType('standard')}
        >
          <View style={[styles.optionInner, { flexDirection: flexDir }]}>
            <RadioCircle selected={deliveryType === 'standard'} />
            <View style={styles.optionBody}>
              <View style={[styles.optionLabelRow, { flexDirection: flexDir }]}>
                <Icon name="truck" size={16} color={Colors.textSecondary} />
                <Text style={styles.optionLabel}>{t('standardDelivery')}</Text>
              </View>
              <Text style={[styles.optionDetail, { textAlign: align }]}>
                {t('standardDeliveryTime')}
              </Text>
            </View>
            <Text style={styles.feeText}>
              {subtotal >= 150 ? t('deliveryFree') : `25 ${t('sar')}`}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.optionCard, deliveryType === 'express' && styles.optionCardActive]}
          onPress={() => setDeliveryType('express')}
        >
          <View style={[styles.optionInner, { flexDirection: flexDir }]}>
            <RadioCircle selected={deliveryType === 'express'} />
            <View style={styles.optionBody}>
              <View style={[styles.optionLabelRow, { flexDirection: flexDir }]}>
                <Icon name="flash" size={16} color={Colors.accent} />
                <Text style={styles.optionLabel}>{t('expressDelivery')}</Text>
              </View>
              <Text style={[styles.optionDetail, { textAlign: align }]}>
                {t('expressDeliveryTime')}
              </Text>
            </View>
            <Text style={styles.feeText}>45 {t('sar')}</Text>
          </View>
        </TouchableOpacity>

        {/* Discreet Packaging */}
        <SectionHeader title={t('packagingOptions')} icon="package" flexDir={flexDir} />
        <View style={[styles.optionCard, discreet && styles.optionCardActive]}>
          <View style={[styles.optionInner, { flexDirection: flexDir }]}>
            <Switch
              value={discreet}
              onValueChange={setDiscreet}
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={discreet ? Colors.primary : Colors.surfaceSecondary}
            />
            <View style={styles.optionBody}>
              <View style={[styles.optionLabelRow, { flexDirection: flexDir }]}>
                <Icon name="lock" size={16} color={Colors.primary} />
                <Text style={styles.optionLabel}>{t('discreetPackaging')}</Text>
              </View>
              <Text style={[styles.optionDetail, { textAlign: align }]}>
                {t('discreetPackagingDesc')}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <SectionHeader title={t('paymentMethod')} icon="creditCard" flexDir={flexDir} />
        {paymentMethods.map((pm) => (
          <TouchableOpacity
            key={pm.id}
            style={[styles.optionCard, selectedPayment === pm.id && styles.optionCardActive]}
            onPress={() => setSelectedPayment(pm.id)}
          >
            <View style={[styles.optionInner, { flexDirection: flexDir }]}>
              <RadioCircle selected={selectedPayment === pm.id} />
              <View style={styles.payIconWrap}>
                <Icon name={pm.icon} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.optionLabel}>{t(pm.labelKey as any)}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Order Summary */}
        <SectionHeader title={t('orderSummary')} icon="clipboard" flexDir={flexDir} />
        <View style={styles.summaryCard}>
          <SummaryRow label={t('subtotal')} value={`${subtotal.toFixed(2)} ${t('sar')}`} flexDir={flexDir} />
          {discount > 0 && (
            <SummaryRow
              label={`${t('discount')}${promoCode ? ` (${promoCode})` : ''}`}
              value={`-${discount.toFixed(2)} ${t('sar')}`}
              highlight
              flexDir={flexDir}
            />
          )}
          <SummaryRow
            label={t('delivery')}
            value={deliveryFee === 0 ? t('deliveryFree') : `${deliveryFee.toFixed(2)} ${t('sar')}`}
            highlight={deliveryFee === 0}
            flexDir={flexDir}
          />
          <SummaryRow label={t('vat')} value={`${vat.toFixed(2)} ${t('sar')}`} flexDir={flexDir} />
          <View style={styles.divider} />
          <SummaryRow label={t('total')} value={`${grandTotal.toFixed(2)} ${t('sar')}`} bold flexDir={flexDir} />
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Button
          title={
            loading
              ? t('confirming')
              : `${t('confirmOrder')} \u2014 ${grandTotal.toFixed(2)} ${t('sar')}`
          }
          onPress={handleOrder}
          loading={loading}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

/* ────────────── Sub-components ────────────── */

function SectionHeader({
  title,
  icon,
  flexDir,
}: {
  title: string;
  icon: IconName;
  flexDir: 'row' | 'row-reverse';
}) {
  return (
    <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
      <Icon name={icon} size={18} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function RadioCircle({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.radioOuter, selected && styles.radioOuterActive]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  highlight,
  flexDir,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  flexDir: 'row' | 'row-reverse';
}) {
  return (
    <View style={[styles.summaryRow, { flexDirection: flexDir }]}>
      <Text style={[styles.summaryLabel, bold && styles.summaryBold]}>{label}</Text>
      <Text
        style={[
          styles.summaryValue,
          bold && styles.summaryBold,
          highlight && styles.summaryHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/* ────────────── Styles ────────────── */

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

  // Prescription Warning
  rxWarningCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  rxWarningIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxWarningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.warning,
    fontWeight: '600',
    lineHeight: 22,
  },

  // Sections
  sectionHeader: {
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },

  // Option Card
  optionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  optionInner: {
    alignItems: 'center',
    gap: 12,
  },
  optionBody: {
    flex: 1,
  },
  optionLabelRow: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  optionDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 19,
  },
  feeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    flexShrink: 0,
    marginStart: 8,
  },

  // Radio
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: Colors.primary,
  },

  // Payment Icon
  payIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Add New Address
  addNewBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginBottom: 4,
  },
  addNewText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Summary
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryBold: {
    fontWeight: '800',
    fontSize: 17,
    color: Colors.primaryDark,
  },
  summaryHighlight: {
    color: Colors.success,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },

  // Bottom
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
});
