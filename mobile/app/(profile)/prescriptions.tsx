import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { colors, font, radius, space } from '@/constants/theme';

type Rx = {
  id: string;
  productId: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'expired';
  prescribedBy: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  productName: string | null;
  productNameAr: string | null;
  productImage: string | null;
};

const STATUS_META: Record<
  Rx['status'],
  { label: string; tone: 'info' | 'success' | 'warning' | 'danger' }
> = {
  pending_review: { label: 'Under review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  expired: { label: 'Expired', tone: 'danger' },
};

export default function PrescriptionsScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [items, setItems] = useState<Rx[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const r = await api.myPrescriptions(token);
      setItems(r.prescriptions);
    } catch {
      setError('Could not load your prescriptions. Pull down to retry.');
      setItems([]);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Prescriptions" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        {items === null ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: space.xxxl }} />
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No prescriptions yet</Text>
            <Text style={styles.emptyBody}>
              Take a clear photo of your prescription. A pharmacist will
              review it within 30 minutes during working hours.
            </Text>
            <Button
              label="Upload prescription"
              onPress={() => {
                /* TODO image upload to storage in next pass */
              }}
              size="lg"
              leadingIcon={
                <Ionicons name="document-attach" size={18} color={colors.onPrimary} />
              }
              style={{ marginTop: space.lg }}
            />
            <Text style={styles.emptyHint}>
              Image upload to Cloud Storage is coming. For now, send your Rx
              via WhatsApp from the Help screen and we'll attach it for you.
            </Text>
          </View>
        ) : (
          <>
            {items.map((rx) => {
              const meta = STATUS_META[rx.status];
              const expires =
                rx.expiresAt && new Date(rx.expiresAt).toLocaleDateString();
              return (
                <View key={rx.id} style={styles.card}>
                  {rx.productImage ? (
                    <Image
                      source={{ uri: rx.productImage }}
                      style={styles.thumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.thumbFallback}>
                      <Ionicons name="medical" size={20} color={colors.accent} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardTop}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {rx.productName ?? 'Prescription'}
                      </Text>
                      <Pill label={meta.label} tone={meta.tone} />
                    </View>
                    {rx.prescribedBy ? (
                      <Text style={styles.metaLine}>{rx.prescribedBy}</Text>
                    ) : null}
                    {expires ? (
                      <Text style={styles.metaLine}>
                        {rx.status === 'expired' ? 'Expired' : 'Valid until'} {expires}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
            <Button
              label="Upload another prescription"
              onPress={() => {
                /* TODO image upload to storage */
              }}
              variant="secondary"
              style={{ marginTop: space.lg }}
              leadingIcon={
                <Ionicons name="document-attach" size={18} color={colors.primary} />
              }
            />
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.lg },
  empty: {
    alignItems: 'center',
    paddingTop: space.xxl,
  },
  emptyTitle: {
    fontSize: font.size.lg,
    color: colors.text,
    fontWeight: font.weight.bold,
    marginTop: space.sm,
  },
  emptyBody: {
    fontSize: font.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space.sm,
    paddingHorizontal: space.xl,
    lineHeight: 20,
  },
  emptyHint: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: space.lg,
    paddingHorizontal: space.xl,
    lineHeight: 18,
  },
  card: {
    flexDirection: 'row',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.sm,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
  },
  thumbFallback: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  productName: {
    flex: 1,
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  metaLine: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  error: {
    fontSize: font.size.sm,
    color: colors.danger,
    textAlign: 'center',
    marginTop: space.lg,
  },
});
