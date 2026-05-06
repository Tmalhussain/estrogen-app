import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pill } from './Pill';
import { useCart } from '@/hooks/useCart';
import { Product } from '@/data/products';
import { colors, font, radius, shadow, space } from '@/constants/theme';

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  return (
    <Link href={`/product/${product.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" />
          {product.oldPrice ? (
            <View style={styles.discount}>
              <Text style={styles.discountText}>
                -{Math.round((1 - product.price / product.oldPrice) * 100)}%
              </Text>
            </View>
          ) : null}
          {product.rxRequired ? (
            <View style={styles.rxBadge}>
              <Text style={styles.rxText}>Rx</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.unit} numberOfLines={1}>
            {product.unit}
          </Text>

          <View style={styles.meta}>
            <Ionicons name="star" size={12} color={colors.warning} />
            <Text style={styles.metaText}>
              {product.rating.toFixed(1)} · {product.reviews}
            </Text>
          </View>

          {product.pregnancySafe ? (
            <Pill label="Pregnancy-safe" tone="success" style={{ marginTop: space.xs }} />
          ) : null}

          <View style={styles.priceRow}>
            <View style={styles.priceWrap}>
              <Text style={styles.price}>{product.price}</Text>
              <Text style={styles.currency}>SAR</Text>
              {product.oldPrice ? (
                <Text style={styles.oldPrice}>{product.oldPrice}</Text>
              ) : null}
            </View>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                add(product, 1);
              }}
              hitSlop={8}
              style={styles.addBtn}
              accessibilityLabel={`Add ${product.name} to cart`}
            >
              <Ionicons name="add" size={20} color={colors.onPrimary} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  imageWrap: {
    aspectRatio: 1.1,
    backgroundColor: colors.bgAlt,
    position: 'relative',
  },
  image: { flex: 1 },
  discount: {
    position: 'absolute',
    top: space.sm,
    left: space.sm,
    backgroundColor: colors.danger,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  discountText: {
    color: colors.onPrimary,
    fontSize: font.size.xxs,
    fontWeight: font.weight.bold,
    letterSpacing: 0.3,
  },
  rxBadge: {
    position: 'absolute',
    top: space.sm,
    right: space.sm,
    backgroundColor: colors.accent,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxText: {
    color: colors.onPrimary,
    fontSize: font.size.xxs,
    fontWeight: font.weight.bold,
  },
  body: {
    padding: space.md,
  },
  brand: {
    fontSize: font.size.xxs,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.semi,
    marginTop: 2,
    minHeight: font.size.md * 2 * 1.2,
  },
  unit: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: space.xs,
  },
  metaText: {
    fontSize: font.size.xs,
    color: colors.textSoft,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flexShrink: 1,
  },
  price: {
    fontSize: font.size.xl,
    color: colors.text,
    fontWeight: font.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  currency: {
    fontSize: font.size.xs,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
  },
  oldPrice: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginLeft: space.xs,
    textDecorationLine: 'line-through',
  },
  addBtn: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
