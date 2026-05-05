/**
 * HomeScreenV2 — Variant A "Bright & Airy" reference implementation.
 *
 * Locked by /design-shotgun on 2026-05-05.
 * Source of truth: DESIGN.md
 *
 * This is a REFERENCE component demonstrating the locked Variant A
 * tokens applied to a real screen. Two ways to use it:
 *
 *   1. Replace the existing app/[locale]/(tabs)/index.tsx contents
 *      with this layout once you wire it to your zustand stores.
 *   2. Use it as visual reference and migrate the existing HomeScreen
 *      to match (pattern by pattern).
 *
 * Mock data inline so the component renders standalone for QA.
 * Replace MOCK_* constants with live store reads.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Spacing, Radii, TouchTarget } from '../constants/tokens';
import { TextStyles, TextStylesAr } from '../constants/typography';

// ── Mock data ──────────────────────────────────────────────────────
// Replace with: useUserDb, useOrdersStore, etc.
const MOCK_USER = { firstName: 'Abeer', firstNameAr: 'عبير' };
const MOCK_ACTIVE_ORDER = {
  status: 'out_for_delivery' as const,
  etaWindow: { start: '8 AM', end: '5 PM', day: 'today' },
  etaWindowAr: { start: '٨ ص', end: '٥ م', day: 'اليوم' },
};
const MOCK_REORDER = [
  { id: '1', code: 'Rx', name: 'Concor 5 mg', nameAr: 'كونكور ٥ ملغ', lastOrdered: 'Apr 6', lastOrderedAr: '٦ أبريل' },
  { id: '2', code: 'D3', name: 'Vitamin D3 1000', nameAr: 'فيتامين د٣ ١٠٠٠', lastOrdered: 'Apr 12', lastOrderedAr: '١٢ أبريل' },
];
const MOCK_LIFE_STAGES = [
  { id: 'youngGirls', en: 'Young girls', ar: 'الفتيات', count: 124 },
  { id: 'ladies',     en: 'Ladies',      ar: 'السيدات',  count: 218 },
  { id: 'mothers',    en: 'Mothers',     ar: 'الأمهات',  count: 147 },
  { id: 'goldenYears',en: 'Golden years',ar: 'السنوات الذهبية', count: 89 },
];

interface Props {
  locale?: 'en' | 'ar';
  onReorder?: (id: string) => void;
  onLifeStagePress?: (id: string) => void;
  onSearch?: () => void;
  onNotifications?: () => void;
}

export default function HomeScreenV2({
  locale = 'ar',
  onReorder,
  onLifeStagePress,
  onSearch,
  onNotifications,
}: Props) {
  const isAr = locale === 'ar';
  const t = isAr ? TextStylesAr : TextStyles;
  // RTL is handled app-wide via I18nManager.forceRTL(true) in the
  // root layout. We don't need per-component writingDirection.
  // The reference to I18nManager keeps the dependency tracked.
  void I18nManager;

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={[styles.wordmark, isAr ? styles.wordmarkAr : styles.wordmarkEn]}>
          {isAr ? 'إستروجين' : 'estrogen'}
        </Text>
        <View style={styles.topIcons}>
          <Pressable hitSlop={8} onPress={onSearch} style={styles.iconButton}>
            <Ionicons name="search-outline" size={24} color={Colors.purple} />
          </Pressable>
          <Pressable hitSlop={8} onPress={onNotifications} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.purple} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingBlock}>
          <Text style={[t.label, styles.label]}>
            {isAr ? 'أهلًا بعودتك' : 'Welcome back'}
          </Text>
          <Text style={[t.greeting, styles.greeting]}>
            {isAr ? 'صباح الخير، ' : 'Good morning, '}
            <Text style={styles.greetingAccent}>
              {isAr ? MOCK_USER.firstNameAr : MOCK_USER.firstName}
            </Text>
          </Text>
        </View>

        {/* Status card (the surprise feature — half the value of the app) */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusIconBox}>
              <Ionicons name="bicycle-outline" size={20} color={Colors.magenta} />
            </View>
            <View style={styles.statusText}>
              <Text style={[t.bodyBold, { color: Colors.text }]}>
                {isAr ? 'طلبك في الطريق إليك' : 'Out for delivery'}
              </Text>
              <Text style={[t.caption, { color: Colors.textSecondary, marginTop: 2 }]}>
                {isAr
                  ? `يصل ${MOCK_ACTIVE_ORDER.etaWindowAr.day} بين ${MOCK_ACTIVE_ORDER.etaWindowAr.start} و${MOCK_ACTIVE_ORDER.etaWindowAr.end}`
                  : `Arrives ${MOCK_ACTIVE_ORDER.etaWindow.day} between ${MOCK_ACTIVE_ORDER.etaWindow.start} and ${MOCK_ACTIVE_ORDER.etaWindow.end}`}
              </Text>
            </View>
          </View>
          <View style={styles.progress}>
            <View style={[styles.progressStep, styles.progressDone]} />
            <View style={[styles.progressStep, styles.progressDone]} />
            <View style={[styles.progressStep, styles.progressCurrent]} />
            <View style={styles.progressStep} />
          </View>
        </View>

        {/* Reorder section — the dominant flow for chronic customers */}
        <View>
          <Text style={[t.label, styles.label]}>
            {isAr ? 'إعادة الطلب' : 'Reorder'}
          </Text>
          <View style={styles.reorderList}>
            {MOCK_REORDER.map((item) => (
              <View key={item.id} style={styles.reorderCard}>
                <View style={styles.reorderIcon}>
                  <Text style={styles.reorderIconText}>{item.code}</Text>
                </View>
                <View style={styles.reorderTextBlock}>
                  <Text style={[t.bodyBold, { color: Colors.text }]}>
                    {isAr ? item.nameAr : item.name}
                  </Text>
                  <Text style={[t.caption, { color: Colors.textSecondary, marginTop: 2 }]}>
                    {isAr
                      ? `آخر طلب ${item.lastOrderedAr}`
                      : `Last ordered ${item.lastOrdered}`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => onReorder?.(item.id)}
                  hitSlop={6}
                >
                  <Text style={[t.pill, styles.reorderButtonText]}>
                    {isAr ? 'إعادة الطلب' : 'Reorder'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Browse by life stage — the secondary flow */}
        <View>
          <Text style={[t.label, styles.label]}>
            {isAr ? 'تصفحي حسب المرحلة العمرية' : 'Browse by life stage'}
          </Text>
          <View style={styles.stagesGrid}>
            {MOCK_LIFE_STAGES.map((stage) => (
              <TouchableOpacity
                key={stage.id}
                style={styles.stageChip}
                onPress={() => onLifeStagePress?.(stage.id)}
                hitSlop={4}
              >
                <Text style={[t.bodyBold, { color: Colors.purple }]}>
                  {isAr ? stage.ar : stage.en}
                </Text>
                <Text style={[t.caption, { color: Colors.textSecondary, marginTop: 2 }]}>
                  {isAr ? `${stage.count} منتج` : `${stage.count} items`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background, // PURE WHITE
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  wordmark: {
    color: Colors.purple,
    fontSize: 22,
  },
  wordmarkEn: {
    fontFamily: 'DMSans_700Bold',
    letterSpacing: -0.5,
  },
  wordmarkAr: {
    fontFamily: 'Cairo_700Bold',
  },
  topIcons: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  iconButton: {
    minWidth: TouchTarget.min - 16,
    minHeight: TouchTarget.min - 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    gap: Spacing['2xl'],
  },

  greetingBlock: {
    paddingTop: Spacing.sm,
  },
  label: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  greeting: {
    color: Colors.text,
  },
  greetingAccent: {
    color: Colors.magenta,
  },

  // ── Status card (the surprise feature) ──
  statusCard: {
    backgroundColor: Colors.background,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.pink,
    padding: Spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.pinkSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    flex: 1,
  },
  progress: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: Radii.full,
    backgroundColor: Colors.hairlinePink,
  },
  progressDone: {
    backgroundColor: Colors.magenta,
  },
  progressCurrent: {
    backgroundColor: Colors.magenta,
  },

  // ── Reorder card ──
  reorderList: {
    gap: Spacing.sm,
  },
  reorderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.pinkMist,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.hairlinePink,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: TouchTarget.comfortable,
  },
  reorderIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.sm,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.hairlinePink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderIconText: {
    color: Colors.magenta,
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
  },
  reorderTextBlock: {
    flex: 1,
  },
  reorderButton: {
    backgroundColor: Colors.magenta,
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtonText: {
    color: Colors.white,
  },

  // ── Life-stage chips (2x2 grid for Variant A) ──
  stagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  stageChip: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.hairlinePink,
    padding: Spacing.md,
    minHeight: TouchTarget.min,
  },
});
