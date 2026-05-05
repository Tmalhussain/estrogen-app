import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { useTranslation } from '../../i18n/useTranslation';
import { useCartStore } from '../../store';
import { useLocale } from '../../hooks/useLocale';
import { router } from 'expo-router';

const SCREEN_WIDTH = Dimensions.get('window').width;
// shop.tsx uses paddingHorizontal: 20 + space-between for the 2-col grid.
// 2 cards must fit within (SCREEN_WIDTH - 40) with a 12px visual gap.
const GRID_CARD_WIDTH = Math.floor((SCREEN_WIDTH - 52) / 2);
const SCROLL_CARD_WIDTH = Math.min(170, Math.floor((SCREEN_WIDTH - 64) / 2.2));

interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  brand: string;
  price: number;
  salePrice: number | null;
  requiresPrescription: boolean;
  inStock: boolean;
  pregnancySafe: boolean;
  images: string[];
}

interface ProductCardProps {
  product: Product;
  grid?: boolean;
}

export function ProductCard({ product, grid = false }: ProductCardProps) {
  const { t, localize, flexDir, align, isRTL } = useTranslation();
  const locale = useLocale();
  const addItem = useCartStore((s) => s.addItem);

  const cardWidth = grid ? GRID_CARD_WIDTH : SCROLL_CARD_WIDTH;
  const imageHeight = grid ? GRID_CARD_WIDTH * (4 / 3) : SCROLL_CARD_WIDTH * (4 / 3);

  const discountPercent =
    product.salePrice != null
      ? Math.round(
          ((product.price - product.salePrice) / product.price) * 100,
        )
      : 0;

  const displayPrice = product.salePrice ?? product.price;

  const handleAdd = () => {
    if (!product.inStock) return;
    addItem({
      productId: product.id,
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      price: displayPrice,
      quantity: 1,
      requiresPrescription: product.requiresPrescription,
      image: product.images[0],
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { width: cardWidth },
        !grid && styles.scrollMargin,
      ]}
      activeOpacity={0.9}
      onPress={() => router.push(`/${locale}/product/${product.id}`)}
    >
      {/* Image Section */}
      <View style={[styles.imageWrap, { height: imageHeight }]}>
        <Image
          source={{ uri: product.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />

        {/* Out of Stock Overlay */}
        {!product.inStock && (
          <View style={styles.oosOverlay}>
            <Text style={styles.oosText}>{t('outOfStock')}</Text>
          </View>
        )}

        {/* Top Badges Row */}
        <View style={[styles.topBadges, { flexDirection: flexDir }]}>
          {/* Discount Badge */}
          {product.salePrice != null && discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                {discountPercent}% {t('discount')}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Badges */}
        <View style={[styles.bottomBadges, isRTL ? styles.bottomBadgesRTL : styles.bottomBadgesLTR]}>
          {product.pregnancySafe && (
            <View style={styles.iconBadge}>
              <Icon name="pregnancy" size={14} color={Colors.success} />
            </View>
          )}
          {product.requiresPrescription && (
            <View style={styles.iconBadge}>
              <Icon name="lock" size={14} color={Colors.primary} />
            </View>
          )}
        </View>
      </View>

      {/* Body Section */}
      <View style={styles.body}>
        {/* Brand */}
        <Text style={[styles.brand, { textAlign: align }]} numberOfLines={1}>
          {product.brand}
        </Text>

        {/* Product Name */}
        <Text style={[styles.name, { textAlign: align }]} numberOfLines={2}>
          {localize(product.nameAr, product.nameEn)}
        </Text>

        {/* Price Row + Action */}
        <View style={[styles.priceRow, { flexDirection: flexDir }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.price, { textAlign: align }]}>
              {displayPrice.toFixed(0)} {t('sar')}
            </Text>
            {product.salePrice != null && (
              <Text style={[styles.originalPrice, { textAlign: align }]}>
                {product.price.toFixed(0)} {t('sar')}
              </Text>
            )}
          </View>

          {/* Add to Cart or Badges */}
          {product.requiresPrescription ? (
            <View style={[styles.rxBadgeRow, { flexDirection: flexDir }]}>
              <Icon name="lock" size={11} color={Colors.primary} />
              <Text
                style={styles.rxLabel}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {t('requiresPrescription')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                styles.addBtn,
                !product.inStock && styles.addBtnDisabled,
              ]}
              onPress={handleAdd}
              activeOpacity={0.8}
              disabled={!product.inStock}
            >
              <Icon
                name="plus"
                size={16}
                color={product.inStock ? Colors.white : Colors.textTertiary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Pregnancy Safe Label */}
        {product.pregnancySafe && (
          <View style={[styles.safeBadgeRow, { flexDirection: flexDir }]}>
            <Icon name="pregnancy" size={11} color={Colors.success} />
            <Text style={styles.safeLabel}>{t('pregnancySafe')}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  scrollMargin: {
    marginLeft: 12,
  },
  imageWrap: {
    width: '100%',
    backgroundColor: Colors.surfaceSecondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  oosText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  topBadges: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    alignItems: 'flex-start',
  },
  discountBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBadges: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    gap: 6,
  },
  bottomBadgesRTL: {
    right: 8,
  },
  bottomBadgesLTR: {
    left: 8,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  body: {
    padding: 10,
  },
  brand: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    lineHeight: 18,
  },
  priceRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: 11,
    color: Colors.textTertiary,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  rxBadgeRow: {
    alignItems: 'center',
    gap: 3,
    flexShrink: 1,
    maxWidth: '60%',
  },
  rxLabel: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '600',
    flexShrink: 1,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: Colors.surfaceSecondary,
  },
  safeBadgeRow: {
    alignItems: 'center',
    gap: 3,
    marginTop: 6,
  },
  safeLabel: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '600',
  },
});
