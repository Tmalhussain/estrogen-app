import { useMemo, useState } from 'react';
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
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard } from '@/components/ProductCard';
import {
  Category,
  LifeStage,
  categories,
  lifeStages,
  products,
  searchProducts,
} from '@/data/products';
import { colors, font, radius, space } from '@/constants/theme';

type TypeFilter = Category | 'all';
type StageFilter = LifeStage | 'all';

export default function ShopScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string; stage?: string }>();
  const initialType = (params.category as TypeFilter | undefined) ?? 'all';
  const initialStage = (params.stage as StageFilter | undefined) ?? 'all';
  const [typeFilter, setTypeFilter] = useState<TypeFilter>(initialType);
  const [stageFilter, setStageFilter] = useState<StageFilter>(initialStage);
  const [query, setQuery] = useState('');
  const [showRxOnly, setShowRxOnly] = useState(false);
  const [showInStock, setShowInStock] = useState(false);

  const filtered = useMemo(() => {
    let list = query ? searchProducts(query) : products;
    if (stageFilter !== 'all') list = list.filter((p) => p.lifeStage === stageFilter);
    if (typeFilter !== 'all') list = list.filter((p) => p.category === typeFilter);
    if (showRxOnly) list = list.filter((p) => p.rxRequired);
    if (showInStock) list = list.filter((p) => p.inStock);
    return list;
  }, [query, typeFilter, stageFilter, showRxOnly, showInStock]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            placeholder="Find anything..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.stageRow}>
        <StageTab
          label="Everyone"
          active={stageFilter === 'all'}
          onPress={() => setStageFilter('all')}
        />
        {lifeStages.map((s) => (
          <StageTab
            key={s.id}
            label={s.label}
            icon={s.icon}
            active={stageFilter === s.id}
            onPress={() => setStageFilter(s.id)}
          />
        ))}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroller}
        contentContainerStyle={styles.chipRow}
      >
        <Chip
          label="All types"
          active={typeFilter === 'all'}
          onPress={() => setTypeFilter('all')}
        />
        {categories.map((c) => (
          <Chip
            key={c.id}
            label={c.label}
            icon={c.icon}
            active={typeFilter === c.id}
            onPress={() => setTypeFilter(c.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.toggleRow}>
        <Toggle
          label="Rx only"
          active={showRxOnly}
          onPress={() => setShowRxOnly((v) => !v)}
        />
        <Toggle
          label="In stock"
          active={showInStock}
          onPress={() => setShowInStock((v) => !v)}
        />
        <Text style={styles.count}>
          {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <ProductCard product={item} />
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>
              Try a different search or pick another category.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function Chip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={16}
          color={active ? colors.onPrimary : colors.textSoft}
          style={{ marginRight: 6 }}
        />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function StageTab({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.stageTab, active && styles.stageTabActive]}
      accessibilityLabel={`Filter for ${label}`}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={18}
          color={active ? colors.primary : colors.textSoft}
        />
      ) : null}
      <Text
        style={[styles.stageTabLabel, active && styles.stageTabLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Toggle({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggle, active && styles.toggleActive]}
    >
      <Ionicons
        name={active ? 'checkbox' : 'square-outline'}
        size={16}
        color={active ? colors.primary : colors.textMuted}
      />
      <Text
        style={[styles.toggleLabel, active && { color: colors.primary }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    backgroundColor: colors.bg,
  },
  title: {
    fontSize: font.size.display,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.6,
    marginBottom: space.md,
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
  stageRow: {
    flexDirection: 'row',
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    gap: space.xs,
  },
  stageTab: {
    flex: 1,
    minHeight: 56,
    paddingHorizontal: 4,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  stageTabActive: {
    backgroundColor: colors.primaryDim,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  stageTabLabel: {
    fontSize: font.size.xxs,
    color: colors.textSoft,
    fontFamily: font.family.semi,
    fontWeight: font.weight.semi,
    textAlign: 'center',
  },
  stageTabLabelActive: {
    color: colors.primary,
  },
  chipScroller: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    paddingHorizontal: space.lg,
    gap: space.sm,
    paddingVertical: space.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    paddingHorizontal: space.lg,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    gap: space.md,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleActive: {},
  toggleLabel: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
  },
  count: {
    marginLeft: 'auto',
    fontSize: font.size.xs,
    color: colors.textMuted,
  },
  list: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxxl,
    gap: space.md,
  },
  row: {
    gap: space.md,
  },
  gridItem: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: space.xxxl * 2,
    gap: space.sm,
  },
  emptyTitle: {
    fontSize: font.size.lg,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  emptyText: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: space.xl,
  },
});
