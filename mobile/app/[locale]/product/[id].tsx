import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useLocale } from '../../../hooks/useLocale';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { Button } from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/useTranslation';
import { useProduct } from '../../../hooks/useProducts';
import { useCartStore } from '../../../store';
import { showAlert } from '../../../utils/alert';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const locale = useLocale();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { product, loading } = useProduct(id ?? null);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'usage' | 'warnings'>('description');
  const addItem = useCartStore((s) => s.addItem);
  const { t, localize, isRTL, flexDir, align } = useTranslation();

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Icon name="alertCircle" size={48} color={Colors.textTertiary} />
          <Text style={[styles.notFoundText, { textAlign: align }]}>
            {t('noResults')}
          </Text>
          <Button title={t('back')} onPress={() => router.back()} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  const displayPrice = product.salePrice ?? product.price;
  const savings = product.salePrice ? product.price - product.salePrice : 0;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      price: displayPrice,
      quantity: 1,
      requiresPrescription: product.requiresPrescription,
      image: product.images[0],
    }, qty);
    // Toast confirmation handles feedback — no navigation needed
  };

  const tabs = [
    { key: 'description' as const, label: t('description') },
    { key: 'usage' as const, label: t('usage') },
    { key: 'warnings' as const, label: t('warnings') },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero Image Section */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: product.images[0] }} style={styles.heroImage} resizeMode="cover" />
          <View style={[styles.heroOverlay, { flexDirection: flexDir }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.heroBtn}>
              <Icon name="back" size={22} color={Colors.primaryDark} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push(`/${locale}/cart`)} style={styles.heroBtn}>
              <Icon name="cart" size={22} color={Colors.primaryDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Brand + Name */}
          <Text style={[styles.brand, { textAlign: align }]}>{product.brand}</Text>
          <Text style={[styles.name, { textAlign: align }]}>
            {localize(product.nameAr, product.nameEn)}
          </Text>

          {/* Price Section */}
          <View style={[styles.priceSection, { flexDirection: flexDir }]}>
            <View>
              <Text style={[styles.price, { textAlign: align }]}>
                {displayPrice.toFixed(2)} {t('sar')}
              </Text>
              {product.salePrice && (
                <Text style={[styles.oldPrice, { textAlign: align }]}>
                  {product.price.toFixed(2)} {t('sar')}
                </Text>
              )}
            </View>
            {product.salePrice && (
              <View style={styles.saveBadge}>
                <Icon name="tag" size={14} color={Colors.accent} />
                <Text style={styles.saveBadgeText}>
                  {t('save_amount')} {savings.toFixed(0)} {t('sar')}
                </Text>
              </View>
            )}
          </View>

          {/* Badges Row */}
          <View style={[styles.badgesRow, { flexDirection: flexDir }]}>
            {product.requiresPrescription && (
              <View style={[styles.badge, styles.badgeWarning]}>
                <Icon name="lock" size={14} color={Colors.warning} />
                <Text style={styles.badgeWarningText}>{t('requiresPrescription')}</Text>
              </View>
            )}
            {product.pregnancySafe && (
              <View style={[styles.badge, styles.badgeSuccess]}>
                <Icon name="pregnancy" size={14} color={Colors.success} />
                <Text style={styles.badgeSuccessText}>{t('pregnancySafe')}</Text>
              </View>
            )}
            {!product.inStock && (
              <View style={[styles.badge, styles.badgeDanger]}>
                <Icon name="alertCircle" size={14} color={Colors.danger} />
                <Text style={styles.badgeDangerText}>{t('outOfStock')}</Text>
              </View>
            )}
            {product.inStock && product.stockCount > 0 && product.stockCount <= 10 && (
              <View style={[styles.badge, styles.badgeWarning]}>
                <Icon name="alertTriangle" size={14} color={Colors.warning} />
                <Text style={styles.badgeWarningText}>
                  {t('lowStock')}: {product.stockCount} {t('onlyLeft')}
                </Text>
              </View>
            )}
          </View>

          {/* Pharmacist Note */}
          {(product.pharmacistNoteAr || product.pharmacistNoteEn) && (
            <View style={styles.pharmacistCard}>
              <View style={[styles.pharmacistHeader, { flexDirection: flexDir }]}>
                <Icon name="stethoscope" size={18} color={Colors.primary} />
                <Text style={styles.pharmacistTitle}>{t('pharmacistNote')}</Text>
              </View>
              <Text style={[styles.pharmacistText, { textAlign: align }]}>
                {localize(product.pharmacistNoteAr ?? '', product.pharmacistNoteEn ?? '')}
              </Text>
            </View>
          )}

          {/* Tab Switcher */}
          <View style={[styles.tabBar, { flexDirection: flexDir }]}>
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.tabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === 'description' && (
              <Text style={[styles.bodyText, { textAlign: align }]}>
                {localize(product.descriptionAr, product.descriptionEn)}
              </Text>
            )}
            {activeTab === 'usage' && (
              <View>
                <Text style={[styles.bodyText, { textAlign: align }]}>
                  {localize(product.usageAr, product.usageEn)}
                </Text>
                <View style={[styles.storageCard, { flexDirection: flexDir }]}>
                  <Icon name="info" size={16} color={Colors.primary} />
                  <Text style={[styles.storageText, { textAlign: align }]}>
                    {localize(product.storageAr, product.storageEn)}
                  </Text>
                </View>
              </View>
            )}
            {activeTab === 'warnings' && (
              <View style={[styles.warningCard, { flexDirection: flexDir }]}>
                <Icon name="alertTriangle" size={18} color={Colors.warning} />
                <Text style={[styles.warningText, { textAlign: align }]}>
                  {localize(product.warningsAr, product.warningsEn)}
                </Text>
              </View>
            )}
          </View>

          {/* Quantity Selector */}
          {product.inStock && (
            <View style={[styles.qtySection, { flexDirection: flexDir }]}>
              <Text style={styles.qtyLabel}>{t('quantity')}</Text>
              <View style={[styles.qtyControls, { flexDirection: flexDir }]}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Icon name="minus" size={18} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty((q) => q + 1)}
                >
                  <Icon name="plus" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        {!product.inStock ? (
          <View style={[styles.bottomInner, { flexDirection: flexDir }]}>
            <Button
              title={t('notifyWhenAvailable')}
              onPress={() => showAlert(t('notifyWhenAvailable'), t('notifyRequested'), [{ text: t('ok') }])}
              variant="outline"
              size="lg"
              style={{ flex: 1 }}
            />
          </View>
        ) : product.requiresPrescription ? (
          <View style={[styles.bottomInner, { flexDirection: flexDir }]}>
            <View style={styles.bottomPriceWrap}>
              <Text style={styles.bottomTotal}>
                {(displayPrice * qty).toFixed(2)} {t('sar')}
              </Text>
            </View>
            <Button
              title={t('addToCartRx')}
              onPress={handleAddToCart}
              size="lg"
              style={{ flex: 1 }}
            />
          </View>
        ) : (
          <View style={[styles.bottomInner, { flexDirection: flexDir }]}>
            <View style={styles.bottomPriceWrap}>
              <Text style={styles.bottomTotal}>
                {(displayPrice * qty).toFixed(2)} {t('sar')}
              </Text>
            </View>
            <Button
              title={t('addToCart')}
              onPress={handleAddToCart}
              size="lg"
              style={{ flex: 1 }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 8,
  },

  // Hero
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    width,
    height: 300,
    backgroundColor: Colors.surfaceSecondary,
  },
  heroOverlay: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Content
  content: {
    padding: 20,
  },
  brand: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 32,
    marginBottom: 16,
  },

  // Price
  priceSection: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.primary,
  },
  oldPrice: {
    fontSize: 15,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  saveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.accentLight,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  saveBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
  },

  // Badges
  badgesRow: {
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  badgeWarning: {
    backgroundColor: Colors.warningLight,
  },
  badgeWarningText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
  },
  badgeSuccess: {
    backgroundColor: Colors.successLight,
  },
  badgeSuccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  badgeDanger: {
    backgroundColor: Colors.dangerLight,
  },
  badgeDangerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
  },

  // Pharmacist Note
  pharmacistCard: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  pharmacistHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pharmacistTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  pharmacistText: {
    fontSize: 14,
    color: Colors.primaryDark,
    lineHeight: 22,
  },

  // Tabs
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2.5,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  tabTextActive: {
    color: Colors.primary,
  },

  // Tab Content
  tabContent: {
    marginBottom: 20,
    minHeight: 80,
  },
  bodyText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
  storageCard: {
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    backgroundColor: Colors.surfaceSecondary,
    padding: 12,
    borderRadius: 12,
  },
  storageText: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  warningCard: {
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.warningLight,
    padding: 14,
    borderRadius: 16,
  },
  warningText: {
    fontSize: 14,
    color: Colors.warning,
    flex: 1,
    lineHeight: 22,
  },

  // Quantity
  qtySection: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  qtyLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  qtyControls: {
    alignItems: 'center',
    gap: 16,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  qtyValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    minWidth: 28,
    textAlign: 'center',
  },

  // Bottom Bar
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
  bottomInner: {
    alignItems: 'center',
    gap: 14,
  },
  bottomPriceWrap: {
    alignItems: 'center',
  },
  bottomTotal: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
});
