import { useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '@/components/Logo';
import { ProductCard } from '@/components/ProductCard';
import { CategoryTile } from '@/components/CategoryTile';
import { SectionHeader } from '@/components/SectionHeader';
import { categories, products } from '@/data/products';
import { colors, font, radius, shadow, space } from '@/constants/theme';

const HERO_BANNERS = [
  {
    id: 'b1',
    title: 'Pregnancy care, delivered',
    subtitle: 'Curated by women pharmacists',
    image:
      'https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'b2',
    title: 'Free delivery over 100 SAR',
    subtitle: 'Same-day in Riyadh',
    image:
      'https://images.unsplash.com/photo-1556228841-7c7137c2e9b6?auto=format&fit=crop&w=900&q=80',
  },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const featured = products.filter((p) => p.tags.includes('prenatal') || p.oldPrice).slice(0, 6);
  const bestSellers = [...products]
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 8);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: space.xxxl + space.xxl }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.headerRow}>
          <View style={styles.brandRow}>
            <Logo size={36} variant="mark" />
            <View style={{ marginLeft: space.sm }}>
              <Text style={styles.greeting}>{greeting()},</Text>
              <View style={styles.welcomeRow}>
                <Text style={styles.userName}>welcome</Text>
                <Ionicons
                  name="heart"
                  size={16}
                  color={colors.primary}
                  style={{ marginLeft: 6 }}
                />
              </View>
            </View>
          </View>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/profile')}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
            <View style={styles.iconDot} />
          </Pressable>
        </View>

        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/shop')}
        >
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Search medications, brands, vitamins..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => router.push('/shop')}
            returnKeyType="search"
          />
          <Ionicons name="options-outline" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bannerStrip}
        snapToInterval={300 + space.md}
        decelerationRate="fast"
      >
        {HERO_BANNERS.map((b) => (
          <View key={b.id} style={styles.banner}>
            <Image source={{ uri: b.image }} style={styles.bannerImage} contentFit="cover" />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerSubtitle}>{b.subtitle}</Text>
              <Text style={styles.bannerTitle}>{b.title}</Text>
              <View style={styles.bannerCta}>
                <Text style={styles.bannerCtaText}>Browse now</Text>
                <Ionicons name="arrow-forward" size={14} color={colors.onPrimary} />
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <SectionHeader title="Shop by category" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catRow}
        >
          {categories.map((c) => (
            <CategoryTile
              key={c.id}
              icon={c.icon}
              label={c.label}
              href={`/shop?category=${c.id}`}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Featured for you"
          subtitle="Pharmacist-picked, pregnancy-safe"
          actionLabel="See all"
          onAction={() => router.push('/shop')}
        />
        <FlatList
          horizontal
          data={featured}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => (
            <View style={{ width: 220, marginRight: space.md }}>
              <ProductCard product={item} />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: space.lg }}
        />
      </View>

      <View style={styles.section}>
        <Link href="/orders" asChild>
          <Pressable style={styles.deliveryCard}>
            <View style={styles.deliveryIcon}>
              <Ionicons name="bicycle" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryTitle}>Order EST-2046 is on the way</Text>
              <Text style={styles.deliverySubtitle}>
                Sara A. · arriving in ~28 minutes
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        </Link>
      </View>

      <View style={styles.section}>
        <SectionHeader
          title="Best sellers"
          actionLabel="See all"
          onAction={() => router.push('/shop')}
        />
        <View style={styles.grid}>
          {bestSellers.slice(0, 4).map((p) => (
            <View key={p.id} style={styles.gridItem}>
              <ProductCard product={p} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    backgroundColor: colors.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  greeting: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontWeight: font.weight.medium,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: font.size.lg,
    color: colors.text,
    fontWeight: font.weight.bold,
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.pill,
    paddingHorizontal: space.lg,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: font.size.md,
    color: colors.text,
  },
  bannerStrip: {
    paddingHorizontal: space.lg,
    gap: space.md,
    marginBottom: space.xl,
  },
  banner: {
    width: 300,
    height: 156,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.accent,
    ...shadow.card,
  },
  bannerImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.55,
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(112, 32, 112, 0.6)',
    padding: space.lg,
    justifyContent: 'flex-end',
  },
  bannerSubtitle: {
    fontSize: font.size.xs,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: font.size.xl,
    color: colors.onPrimary,
    fontWeight: font.weight.bold,
    marginTop: 4,
    letterSpacing: -0.4,
  },
  bannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: space.sm,
  },
  bannerCtaText: {
    fontSize: font.size.sm,
    color: colors.onPrimary,
    fontWeight: font.weight.semi,
  },
  section: {
    marginBottom: space.xxl,
  },
  catRow: {
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.primaryDim,
    marginHorizontal: space.lg,
    padding: space.lg,
    borderRadius: radius.xl,
  },
  deliveryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryTitle: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  deliverySubtitle: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    marginTop: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  gridItem: {
    width: '47.5%',
    flexGrow: 1,
  },
});
