import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLocale } from '../../../hooks/useLocale';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { useTranslation } from '../../../i18n/useTranslation';
import { Logo } from '../../../components/brand/Logo';
import { BannerCarousel } from '../../../components/home/BannerCarousel';
import { ProductCard } from '../../../components/product/ProductCard';
import { useAuthStore, useCartStore } from '../../../store';
import { useCategories, useHealthTips } from '../../../hooks/useCategories';
import { useProducts } from '../../../hooks/useProducts';

export default function HomeScreen() {
  const locale = useLocale();
  const user = useAuthStore(s => s.user);
  const cartCount = useCartStore(s => s.itemCount());
  const { t, localize, isRTL, flexDir, align } = useTranslation();

  // Firestore data
  const { categories } = useCategories();
  const { products } = useProducts();
  const { tips: healthTips } = useHealthTips();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('greetingMorning') : hour < 17 ? t('greetingAfternoon') : t('greetingEvening');

  const tip = useMemo(
    () => healthTips.length > 0 ? healthTips[Math.floor(Math.random() * healthTips.length)] : null,
    [healthTips],
  );

  const bestSellers = useMemo(
    () => products.filter(p => p.inStock).slice(0, 6),
    [products],
  );

  const pregnancyProducts = useMemo(
    () => products.filter(p => p.pregnancySafe && p.inStock).slice(0, 4),
    [products],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* ── Header ─────────────────────────────────── */}
        <View style={[styles.header, { flexDirection: flexDir }]}>
          <Logo size="sm" variant="icon" />
          <View style={[styles.headerTextArea, { alignItems: 'flex-start' }]}>
            <Text style={[styles.greeting, { textAlign: align }]} numberOfLines={1}>{greeting}</Text>
            <Text style={[styles.name, { textAlign: align }]} numberOfLines={1}>{user?.name ?? t('helloGuest')}</Text>
          </View>
          <TouchableOpacity
            style={styles.cartBtn}
            onPress={() => router.push(`/${locale}/cart`)}
            activeOpacity={0.7}
          >
            <Icon name="cart" size={22} color={Colors.primaryDark} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.searchBar, { flexDirection: flexDir }]}
          onPress={() => router.push(`/${locale}/search`)}
          activeOpacity={0.7}
        >
          <Icon name="search" size={18} color={Colors.textTertiary} />
          <Text
            numberOfLines={1}
            style={[styles.searchPlaceholder, { textAlign: align }]}
          >
            {t('searchPlaceholder')}
          </Text>
        </TouchableOpacity>

        {/* ── Banners ────────────────────────────────── */}
        <BannerCarousel />

        {/* ── Health Tip ─────────────────────────────── */}
        {tip && (
          <View style={[styles.tipCard, { borderRightWidth: isRTL ? 4 : 0, borderLeftWidth: isRTL ? 0 : 4, borderRightColor: Colors.primary, borderLeftColor: Colors.primary }]}>
            <View style={[styles.tipHeader, { flexDirection: flexDir }]}>
              <Icon name="heartPulse" size={18} color={Colors.primary} />
              <Text style={[styles.tipTitle, { textAlign: align }]}>{t('healthTip')}</Text>
            </View>
            <Text style={[styles.tipText, { textAlign: align }]}>
              {localize(tip.textAr, tip.textEn)}
            </Text>
          </View>
        )}

        {/* ── Categories ─────────────────────────────── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
            <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('categories')}</Text>
            <TouchableOpacity onPress={() => router.push(`/${locale}/(tabs)/shop`)}>
              <Text style={styles.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catScroll}
          >
            {(isRTL ? [...categories].reverse() : categories).map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catCard, { backgroundColor: cat.color }]}
                onPress={() => router.push(`/${locale}/(tabs)/shop`)}
                activeOpacity={0.8}
              >
                <View style={[styles.catIconWrap, { backgroundColor: cat.color }]}>
                  <Icon name={cat.icon} size={24} color={cat.iconColor} />
                </View>
                <Text style={[styles.catName, { textAlign: 'center' }]} numberOfLines={2}>
                  {localize(cat.nameAr, cat.nameEn)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Best Sellers ───────────────────────────── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
            <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('bestSellers')}</Text>
            <TouchableOpacity onPress={() => router.push(`/${locale}/(tabs)/shop`)}>
              <Text style={styles.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScroll}
          >
            {(isRTL ? [...bestSellers].reverse() : bestSellers).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ScrollView>
        </View>

        {/* ── Pregnancy Products ─────────────────────── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
            <View style={[styles.sectionTitleRow, { flexDirection: flexDir }]}>
              <Icon name="pregnancy" size={20} color={Colors.accent} />
              <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('pregnancyProducts')}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push(`/${locale}/(tabs)/shop`)}>
              <Text style={styles.seeAll}>{t('seeAll')}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScroll}
          >
            {(isRTL ? [...pregnancyProducts].reverse() : pregnancyProducts).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ScrollView>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTextArea: {
    flex: 1,
    paddingHorizontal: 14,
  },
  greeting: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginTop: 2,
  },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  // Search
  searchBar: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Colors.textTertiary,
    flex: 1,
  },
  // Health Tip
  tipCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  tipHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  tipText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  // Sections
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionTitleRow: {
    alignItems: 'center',
    gap: 6,
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Categories
  catScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  catCard: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 96,
    maxWidth: 116,
  },
  catIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catName: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 15,
  },
  // Product Scroll
  productScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
