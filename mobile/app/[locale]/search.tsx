import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useLocale } from '../../hooks/useLocale';
import { Colors } from '../../constants/colors';
import { Icon, type IconName } from '../../components/ui/Icon';
import { useTranslation } from '../../i18n/useTranslation';
import { ProductCard } from '../../components/product/ProductCard';
import { products, categories } from '../../constants/mockData';

interface PopularSearch {
  id: string;
  termKey: string;
  icon: IconName;
}

const popularSearchItems: PopularSearch[] = [
  { id: '1', termKey: 'popularPregnancyVitamins', icon: 'pregnancy' },
  { id: '2', termKey: 'popularPainRelief', icon: 'pill' },
  { id: '3', termKey: 'popularSkincare', icon: 'skincare' },
  { id: '4', termKey: 'popularThyroid', icon: 'stethoscope' },
];

export default function SearchScreen() {
  const locale = useLocale();
  const { t, localize, flexDir, align, isRTL } = useTranslation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Recent searches stored as translation-friendly keys
  const recentSearchTerms = [
    { ar: 'حمض الفوليك', en: 'Folic Acid' },
    { ar: 'فيتامين د', en: 'Vitamin D' },
    { ar: 'كريم ترطيب', en: 'Moisturizer' },
    { ar: 'حديد', en: 'Iron' },
  ];

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, []);

  const results =
    query.length >= 2
      ? products.filter(
          (p) =>
            p.nameAr.includes(query) ||
            p.nameEn.toLowerCase().includes(query.toLowerCase()) ||
            p.brand.toLowerCase().includes(query.toLowerCase())
        )
      : [];

  const hasResults = query.length >= 2 && results.length > 0;
  const noResults = query.length >= 2 && results.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search Bar */}
      <View style={[styles.searchRow, { flexDirection: flexDir }]}>
        <View style={[styles.searchBar, { flexDirection: flexDir }]}>
          <Icon name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, { textAlign: align }]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={Colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="xCircle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </View>

      {!query ? (
        /* Empty state - show suggestions */
        <FlatList
          data={[]}
          renderItem={() => null}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.suggestionsContainer}>
              {/* Recent Searches */}
              <Text style={[styles.sectionTitle, { textAlign: align }]}>
                {t('recentSearches')}
              </Text>
              <View style={[styles.recentList, { flexDirection: flexDir }]}>
                {recentSearchTerms.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.recentChip, { flexDirection: flexDir }]}
                    onPress={() => setQuery(localize(s.ar, s.en))}
                    activeOpacity={0.7}
                  >
                    <Icon name="clock" size={14} color={Colors.textSecondary} />
                    <Text style={styles.recentText}>{localize(s.ar, s.en)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Popular Searches */}
              <Text style={[styles.sectionTitle, { textAlign: align, marginTop: 28 }]}>
                {t('popularSearches')}
              </Text>
              {popularSearchItems.map((ps) => (
                <TouchableOpacity
                  key={ps.id}
                  style={[styles.popularRow, { flexDirection: flexDir }]}
                  onPress={() => setQuery(t(ps.termKey as any))}
                  activeOpacity={0.7}
                >
                  <View style={styles.popularIconWrap}>
                    <Icon name={ps.icon} size={18} color={Colors.primary} />
                  </View>
                  <Text style={[styles.popularText, { textAlign: align }]}>
                    {t(ps.termKey as any)}
                  </Text>
                  <Icon name="arrowUpRight" size={16} color={Colors.textTertiary} />
                </TouchableOpacity>
              ))}

              {/* Browse by Category */}
              <Text style={[styles.sectionTitle, { textAlign: align, marginTop: 28 }]}>
                {t('browseByCategory')}
              </Text>
              <View style={[styles.catGrid, { flexDirection: flexDir }]}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catCard, { backgroundColor: cat.color }]}
                    onPress={() => router.push(`/${locale}/(tabs)/shop`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.catIconWrap}>
                      <Icon name={cat.icon} size={22} color={cat.iconColor} />
                    </View>
                    <Text style={styles.catName} numberOfLines={2}>
                      {localize(cat.nameAr, cat.nameEn)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          }
        />
      ) : hasResults ? (
        /* Show results */
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
          columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 12 }}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { textAlign: align }]}>
              {results.length} {t('resultsCount')}
            </Text>
          }
          renderItem={({ item }) => <ProductCard product={item} grid />}
        />
      ) : noResults ? (
        /* No results */
        <View style={styles.noResults}>
          <View style={styles.noResultsIconWrap}>
            <Icon name="search" size={36} color={Colors.primarySoft} />
          </View>
          <Text style={styles.noResultsTitle}>
            {t('noSearchResults')} "{query}"
          </Text>
          <Text style={styles.noResultsSubtext}>{t('tryDifferent')}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchRow: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 0,
  },
  cancelBtn: {
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  suggestionsContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  recentList: {
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recentText: {
    fontSize: 13,
    color: Colors.text,
  },
  popularRow: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  popularIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  catGrid: {
    flexWrap: 'wrap',
    gap: 10,
  },
  catCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 0,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'center',
  },
  resultCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  noResults: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  noResultsIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noResultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
