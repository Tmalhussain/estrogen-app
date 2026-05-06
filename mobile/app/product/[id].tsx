import { useState } from 'react';
import {
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
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { QuantityStepper } from '@/components/QuantityStepper';
import { findProduct } from '@/data/products';
import { useCart } from '@/hooks/useCart';
import { colors, font, radius, shadow, space } from '@/constants/theme';

export default function ProductScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cart = useCart();
  const product = findProduct(id);
  const [quantity, setQuantity] = useState(1);
  const [favorited, setFavorited] = useState(false);

  if (!product) {
    return (
      <View style={styles.notFound}>
        <Ionicons name="search" size={48} color={colors.textMuted} />
        <Text style={styles.notFoundTitle}>Product not found</Text>
        <Button label="Back to shop" onPress={() => router.replace('/shop')} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 160 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageSection}>
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            contentFit="cover"
          />
          <View style={[styles.imageOverlay, { paddingTop: insets.top + space.sm }]}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.back()}
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => setFavorited((v) => !v)}
              accessibilityLabel={favorited ? 'Unfavorite' : 'Favorite'}
            >
              <Ionicons
                name={favorited ? 'heart' : 'heart-outline'}
                size={22}
                color={favorited ? colors.danger : colors.text}
              />
            </Pressable>
          </View>
          {product.oldPrice ? (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round((1 - product.price / product.oldPrice) * 100)}% off
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>{product.brand}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color={colors.warning} />
              <Text style={styles.ratingText}>
                {product.rating.toFixed(1)} ({product.reviews})
              </Text>
            </View>
          </View>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.nameAr}>{product.nameAr}</Text>
          <Text style={styles.unit}>{product.unit}</Text>

          <View style={styles.tagRow}>
            {product.pregnancySafe ? (
              <Pill label="Pregnancy-safe" tone="success" />
            ) : null}
            {product.rxRequired ? <Pill label="Rx required" tone="accent" /> : null}
            {product.inStock ? (
              <Pill
                label={product.stockCount < 10 ? `Only ${product.stockCount} left` : 'In stock'}
                tone={product.stockCount < 10 ? 'warning' : 'info'}
              />
            ) : (
              <Pill label="Out of stock" tone="danger" />
            )}
          </View>

          <View style={styles.priceCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.priceLabel}>Price</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={styles.price}>{product.price}</Text>
                <Text style={styles.priceCurrency}>SAR</Text>
                {product.oldPrice ? (
                  <Text style={styles.priceOld}>{product.oldPrice} SAR</Text>
                ) : null}
              </View>
            </View>
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </View>

          <Section title="About this product">
            <Text style={styles.bodyText}>{product.description}</Text>
          </Section>

          {product.pharmacistNote ? (
            <View style={styles.noteCard}>
              <View style={styles.noteIcon}>
                <Ionicons name="medical" size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.noteTitle}>Pharmacist note</Text>
                <Text style={styles.noteText}>{product.pharmacistNote}</Text>
              </View>
            </View>
          ) : null}

          <Section title="Delivery">
            <View style={styles.deliveryRow}>
              <Ionicons name="bicycle" size={18} color={colors.primary} />
              <Text style={styles.bodyText}>Same-day delivery in Riyadh</Text>
            </View>
            <View style={styles.deliveryRow}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
              <Text style={styles.bodyText}>Standard packaging, kept private</Text>
            </View>
            <View style={styles.deliveryRow}>
              <Ionicons name="repeat" size={18} color={colors.primary} />
              <Text style={styles.bodyText}>Subscribe & save 10% on monthly refills</Text>
            </View>
          </Section>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.footerSummary}>
          <Text style={styles.footerLabel}>Subtotal</Text>
          <Text style={styles.footerTotal}>{product.price * quantity} SAR</Text>
        </View>
        <Button
          label={product.inStock ? 'Add to cart' : 'Out of stock'}
          disabled={!product.inStock}
          onPress={() => {
            cart.add(product, quantity);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            router.push('/cart');
          }}
          size="lg"
          leadingIcon={
            <Ionicons name="bag-add" size={18} color={colors.onPrimary} />
          }
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ gap: space.sm }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageSection: {
    height: 360,
    backgroundColor: colors.bgAlt,
    position: 'relative',
  },
  image: { flex: 1 },
  imageOverlay: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    alignItems: 'flex-start',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  discountBadge: {
    position: 'absolute',
    bottom: space.lg,
    left: space.lg,
    backgroundColor: colors.danger,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  discountText: {
    color: colors.onPrimary,
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    letterSpacing: 0.3,
  },
  body: {
    paddingHorizontal: space.lg,
    paddingTop: space.xl,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xs,
  },
  brand: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: font.size.xs,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
  },
  name: {
    fontSize: font.size.xxl,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  nameAr: {
    fontSize: font.size.lg,
    color: colors.accent,
    marginTop: 4,
    fontFamily: font.family.arBold,
    fontWeight: font.weight.bold,
    writingDirection: 'rtl',
  },
  unit: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    marginTop: space.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginTop: space.md,
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgAlt,
    marginTop: space.lg,
  },
  priceLabel: {
    fontSize: font.size.xxs,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  price: {
    fontSize: font.size.display,
    color: colors.text,
    fontWeight: font.weight.bold,
    letterSpacing: -0.6,
  },
  priceCurrency: {
    fontSize: font.size.md,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
  },
  priceOld: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  section: {
    marginTop: space.xxl,
  },
  sectionTitle: {
    fontSize: font.size.lg,
    color: colors.text,
    fontWeight: font.weight.bold,
    marginBottom: space.sm,
  },
  bodyText: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    lineHeight: 22,
  },
  noteCard: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.accentSoft,
    marginTop: space.lg,
  },
  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitle: {
    fontSize: font.size.sm,
    color: colors.accent,
    fontWeight: font.weight.bold,
  },
  noteText: {
    fontSize: font.size.xs,
    color: colors.accent,
    marginTop: 4,
    lineHeight: 18,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: 28,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow.floating,
  },
  footerSummary: {
    minWidth: 92,
  },
  footerLabel: {
    fontSize: font.size.xs,
    color: colors.textMuted,
  },
  footerTotal: {
    fontSize: font.size.xl,
    color: colors.text,
    fontWeight: font.weight.bold,
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
