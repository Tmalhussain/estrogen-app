import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLocale } from '../../../hooks/useLocale';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { Button } from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/useTranslation';
import { useCartStore } from '../../../store';
import { showAlert } from '../../../utils/alert';

const VAT_RATE = 0.15;
const DELIVERY_FEE = 25;
const FREE_DELIVERY_THRESHOLD = 150;

export default function CartTabScreen() {
  const locale = useLocale();
  const { items, removeItem, updateQty, total, clearCart, applyPromo: storeApplyPromo, clearPromo, promoCode, discount } = useCartStore();
  const [promo, setPromo] = useState('');
  const promoApplied = !!promoCode;
  const { t, localize, isRTL, flexDir, align } = useTranslation();

  const subtotal = total();
  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const afterDiscount = subtotal - discount;
  const vat = afterDiscount * VAT_RATE;
  const grandTotal = afterDiscount + delivery + vat;

  const applyPromo = () => {
    if (!promo.trim()) return;
    const success = storeApplyPromo(promo, subtotal);
    if (!success) {
      clearPromo();
      setPromo('');
      showAlert(t('promoInvalid'), t('promoInvalidDesc'), [{ text: t('ok') }]);
    }
  };

  // Empty State
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { textAlign: align }]}>{t('cart')}</Text>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Icon name="cart" size={48} color={Colors.primaryLight} />
          </View>
          <Text style={[styles.emptyTitle, { textAlign: align }]}>{t('cartEmpty')}</Text>
          <Text style={[styles.emptySubtext, { textAlign: align }]}>{t('cartEmptyDesc')}</Text>
          <Button
            title={t('startShopping')}
            onPress={() => router.push(`/${locale}/(tabs)/shop`)}
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }: { item: typeof items[0] }) => (
    <View style={[styles.cartItem, { flexDirection: flexDir }]}>
      <View style={styles.itemImageWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
            <Icon name="pill" size={24} color={Colors.primaryLight} />
          </View>
        )}
      </View>
      <View style={styles.itemBody}>
        <Text style={[styles.itemName, { textAlign: align }]} numberOfLines={2}>
          {localize(item.nameAr, item.nameEn)}
        </Text>
        {item.requiresPrescription && (
          <View style={[styles.rxBadge, { flexDirection: flexDir }]}>
            <Icon name="lock" size={11} color={Colors.warning} />
            <Text style={styles.rxBadgeText}>{t('requiresPrescription')}</Text>
          </View>
        )}
        <Text style={[styles.itemPrice, { textAlign: align }]}>
          {(item.price * item.quantity).toFixed(2)} {t('sar')}
        </Text>
        <View style={[styles.qtyRow, { flexDirection: flexDir }]}>
          <TouchableOpacity
            onPress={() => updateQty(item.productId, item.quantity - 1)}
            style={[styles.qtyBtn, item.quantity === 1 && styles.qtyBtnDanger]}
          >
            {item.quantity === 1 ? (
              <Icon name="trash" size={14} color={Colors.danger} />
            ) : (
              <Icon name="minus" size={14} color={Colors.primary} />
            )}
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{item.quantity}</Text>
          <TouchableOpacity
            onPress={() => updateQty(item.productId, item.quantity + 1)}
            style={styles.qtyBtn}
          >
            <Icon name="plus" size={14} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { flexDirection: flexDir }]}>
        <View style={[styles.headerCenter, { flexDirection: flexDir }]}>
          <Text style={styles.headerTitle}>{t('cart')}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{items.length}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ padding: 16, paddingBottom: 16 }}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View>
            {/* Promo Code */}
            <View style={[styles.promoSection, { flexDirection: flexDir }]}>
              <TextInput
                style={[styles.promoInput, { textAlign: align }]}
                placeholder={t('promoCode')}
                placeholderTextColor={Colors.textTertiary}
                value={promo}
                onChangeText={setPromo}
                autoCapitalize="characters"
              />
              <Button title={t('apply')} onPress={applyPromo} size="sm" style={styles.promoBtn} />
            </View>
            {promoApplied && discount > 0 && (
              <View style={[styles.promoSuccess, { flexDirection: flexDir }]}>
                <Icon name="checkCircle" size={16} color={Colors.success} />
                <Text style={styles.promoSuccessText}>
                  {t('promoApplied')} {discount.toFixed(2)} {t('sar')}
                </Text>
              </View>
            )}

            {/* Free Delivery Tip */}
            {subtotal < FREE_DELIVERY_THRESHOLD && (
              <View style={[styles.freeDeliveryCard, { flexDirection: flexDir }]}>
                <Icon name="truck" size={18} color={Colors.success} />
                <Text style={[styles.freeDeliveryText, { textAlign: align }]}>
                  {t('freeDeliveryTip').replace(
                    '{{amount}}',
                    (FREE_DELIVERY_THRESHOLD - subtotal).toFixed(2)
                  )}
                </Text>
              </View>
            )}

            {/* Order Summary */}
            <View style={styles.summaryCard}>
              <Text style={[styles.summaryTitle, { textAlign: align }]}>
                {t('orderSummary')}
              </Text>
              <SummaryRow label={t('subtotal')} value={`${subtotal.toFixed(2)} ${t('sar')}`} flexDir={flexDir} />
              {discount > 0 && (
                <SummaryRow
                  label={t('discount')}
                  value={`-${discount.toFixed(2)} ${t('sar')}`}
                  highlight
                  flexDir={flexDir}
                />
              )}
              <SummaryRow
                label={t('delivery')}
                value={delivery === 0 ? t('deliveryFree') : `${delivery.toFixed(2)} ${t('sar')}`}
                highlight={delivery === 0}
                flexDir={flexDir}
              />
              <SummaryRow label={t('vat')} value={`${vat.toFixed(2)} ${t('sar')}`} flexDir={flexDir} />
              <View style={styles.divider} />
              <SummaryRow
                label={t('total')}
                value={`${grandTotal.toFixed(2)} ${t('sar')}`}
                bold
                flexDir={flexDir}
              />
            </View>
          </View>
        }
      />

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <Button
          title={`${t('proceedToCheckout')} \u2014 ${grandTotal.toFixed(2)} ${t('sar')}`}
          onPress={() => router.push(`/${locale}/checkout`)}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: Colors.textSecondary,
  },

  // Cart Item
  cartItem: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  itemImageWrap: {
    marginHorizontal: 4,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  itemImagePlaceholder: {
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    paddingHorizontal: 10,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 21,
    marginBottom: 4,
  },
  rxBadge: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  rxBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
  },
  itemPrice: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 8,
  },
  qtyRow: {
    alignItems: 'center',
    gap: 14,
    alignSelf: 'flex-start',
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  qtyBtnDanger: {
    borderColor: Colors.dangerLight,
    backgroundColor: Colors.dangerLight,
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 22,
    textAlign: 'center',
  },

  // Promo
  promoSection: {
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  promoInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  promoBtn: {
    minWidth: 80,
  },
  promoSuccess: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  promoSuccessText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },

  // Free Delivery
  freeDeliveryCard: {
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  freeDeliveryText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
    flex: 1,
    lineHeight: 20,
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
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 14,
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
    color: Colors.text,
    fontWeight: '600',
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
