import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { useTranslation } from '../../../i18n/useTranslation';
import { ProductCard } from '../../../components/product/ProductCard';
import { useCategories } from '../../../hooks/useCategories';
import { useProducts } from '../../../hooks/useProducts';
import { stripDiacritics } from '../../../utils/text';

export default function ShopScreen() {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [rxFilter, setRxFilter] = useState<'all' | 'otc' | 'rx'>('all');
  const { t, localize, isRTL, flexDir, align } = useTranslation();

  const { categories } = useCategories();
  const { products } = useProducts();

  const filtered = useMemo(() => {
    return products.filter(p => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        stripDiacritics(p.nameAr).includes(stripDiacritics(search)) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q);
      const matchCat = !selectedCat || p.categoryId === selectedCat;
      const matchRx =
        rxFilter === 'all' ||
        (rxFilter === 'otc' ? !p.requiresPrescription : p.requiresPrescription);
      return matchSearch && matchCat && matchRx;
    });
  }, [search, selectedCat, rxFilter, products]);

  const rxLabels = {
    all: t('all'),
    otc: t('otc'),
    rx: t('rxOnly'),
  } as const;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Search ──────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { flexDirection: flexDir }]}>
          <Icon name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { textAlign: align }]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Category Chips ──────────────────────────── */}
      {/*
        Horizontal ScrollView: do NOT override flexDirection on the
        contentContainer — ScrollView handles direction itself.
        Mirror RTL by reversing the array order instead, so chips
        keep their natural pill shape and don't stretch vertically.
      */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScrollOuter}
        contentContainerStyle={styles.catScroll}
      >
        <TouchableOpacity
          style={[styles.catChip, !selectedCat && styles.catChipActive]}
          onPress={() => setSelectedCat(null)}
          activeOpacity={0.8}
        >
          <Text
            numberOfLines={1}
            style={[styles.catChipText, !selectedCat && styles.catChipTextActive]}
          >
            {t('all')}
          </Text>
        </TouchableOpacity>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.catChip,
              { flexDirection: flexDir },
              selectedCat === cat.id && styles.catChipActive,
            ]}
            onPress={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
            activeOpacity={0.8}
          >
            <Icon
              name={cat.icon}
              size={14}
              color={selectedCat === cat.id ? Colors.white : cat.iconColor}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.catChipText,
                selectedCat === cat.id && styles.catChipTextActive,
              ]}
            >
              {localize(cat.nameAr, cat.nameEn)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Rx Filter ───────────────────────────────── */}
      <View style={[styles.rxRow, { flexDirection: flexDir }]}>
        {(['all', 'otc', 'rx'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.rxChip, rxFilter === f && styles.rxChipActive]}
            onPress={() => setRxFilter(f)}
          >
            <Text style={[styles.rxChipText, rxFilter === f && styles.rxChipTextActive]}>
              {rxLabels[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Results ─────────────────────────────────── */}
      <FlatList
        data={filtered}
        keyExtractor={p => p.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="search" size={40} color={Colors.textTertiary} />
            </View>
            <Text style={[styles.emptyText, { textAlign: align }]}>{t('noResults')}</Text>
            <Text style={[styles.emptySubtext, { textAlign: align }]}>{t('noResultsDesc')}</Text>
          </View>
        }
        renderItem={({ item }) => <ProductCard product={item} grid />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Search
  searchWrap: {
    padding: 20,
    paddingBottom: 8,
  },
  searchBar: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 0,
  },
  // Category Chips
  catScrollOuter: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 56,
  },
  catScroll: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    height: 36,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  catChipTextActive: {
    color: Colors.white,
  },
  // Rx Filter
  rxRow: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  rxChip: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary,
  },
  rxChipActive: {
    backgroundColor: Colors.primarySoft,
  },
  rxChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  rxChipTextActive: {
    color: Colors.primaryDark,
  },
  // Grid
  grid: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  // Empty
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
