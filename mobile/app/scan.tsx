import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { api, ApiError, type ApiProduct } from '@/lib/api';
import { colors, font, radius, shadow, space } from '@/constants/theme';

type ScanResult =
  | { kind: 'idle' }
  | { kind: 'looking-up'; barcode: string }
  | {
      kind: 'found';
      product: ApiProduct;
      requiresPrescription: boolean;
      hasPrescription: boolean;
    }
  | { kind: 'rx-required'; productName: string; barcode: string }
  | { kind: 'not-in-catalog'; barcode: string }
  | { kind: 'error'; message: string };

const ALLOWED_TYPES = [
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'code128',
  'code39',
] as const;

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const cart = useCart();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<ScanResult>({ kind: 'idle' });
  // Web fallback — RN-Web's CameraView wraps getUserMedia which doesn't
  // expose a barcode scanner. Show a manual entry form instead so the
  // flow is still testable from the browser.
  const isWeb = Platform.OS === 'web';
  const [manualCode, setManualCode] = useState('');
  // Guard against multiple barcode events firing in a row before the
  // navigation away from the camera completes.
  const lookingUp = useRef(false);

  useEffect(() => {
    if (!permission || isWeb) return;
    if (!permission.granted) requestPermission();
  }, [permission, requestPermission, isWeb]);

  const lookup = async (code: string) => {
    if (lookingUp.current) return;
    lookingUp.current = true;
    setResult({ kind: 'looking-up', barcode: code });
    try {
      const r = await api.productByBarcode(code, token);
      setResult({
        kind: 'found',
        product: r.product,
        requiresPrescription: r.requiresPrescription,
        hasPrescription: r.hasPrescription,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 403 && err.code === 'prescription_required') {
          const details = err.details as { productName?: string };
          setResult({
            kind: 'rx-required',
            productName: details?.productName ?? 'this medication',
            barcode: code,
          });
        } else if (err.status === 404) {
          setResult({ kind: 'not-in-catalog', barcode: code });
        } else {
          setResult({
            kind: 'error',
            message:
              err.code === 'network_error'
                ? 'Could not reach the server. Check your connection.'
                : err.code.replace(/_/g, ' '),
          });
        }
      } else {
        setResult({ kind: 'error', message: 'Something went wrong.' });
      }
    } finally {
      lookingUp.current = false;
    }
  };

  const reset = () => {
    setResult({ kind: 'idle' });
    setManualCode('');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {!isWeb && permission?.granted && result.kind === 'idle' ? (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: [...ALLOWED_TYPES] }}
          onBarcodeScanned={({ data }) => {
            // Reject obviously bogus codes that aren't 6-14 digits — the
            // backend rejects them too but this avoids flashing the lookup
            // sheet for QR codes the user accidentally framed.
            if (/^\d{6,14}$/.test(data)) void lookup(data);
          }}
        />
      ) : null}

      {/* Top bar — close button always visible */}
      <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconBtn}
          accessibilityLabel="Close scanner"
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.topTitle}>Scan a barcode</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Idle / scanning UI on native — viewfinder hint */}
      {!isWeb && permission?.granted && result.kind === 'idle' ? (
        <View pointerEvents="none" style={styles.viewfinderWrap}>
          <View style={styles.viewfinder} />
          <Text style={styles.viewfinderHint}>
            Point your camera at the medication's barcode.
          </Text>
        </View>
      ) : null}

      {/* Web / no-permission fallback — manual barcode entry */}
      {(isWeb || (permission && !permission.granted)) && result.kind === 'idle' ? (
        <View style={[styles.fallback, { paddingTop: insets.top + 80 }]}>
          {!isWeb && permission && !permission.granted ? (
            <>
              <Text style={styles.fallbackTitle}>Camera permission needed</Text>
              <Text style={styles.fallbackBody}>
                We need access to your camera to scan barcodes. You can also
                type the barcode manually below.
              </Text>
              <Button
                label="Allow camera"
                onPress={() => requestPermission()}
                style={{ marginTop: space.lg }}
              />
            </>
          ) : (
            <>
              <Text style={styles.fallbackTitle}>Enter barcode</Text>
              <Text style={styles.fallbackBody}>
                Live camera scanning isn't available in this build. Type the
                barcode below to test the lookup.
              </Text>
            </>
          )}
          <View style={[styles.manualWrap, { marginTop: space.xl }]}>
            <Ionicons name="barcode-outline" size={20} color={colors.textMuted} />
            <TextInput
              value={manualCode}
              onChangeText={(v) => setManualCode(v.replace(/[^\d]/g, '').slice(0, 14))}
              placeholder="6 to 14 digits"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={styles.manualInput}
              autoFocus
            />
          </View>
          <Button
            label="Look up"
            onPress={() => manualCode && lookup(manualCode)}
            disabled={manualCode.length < 6}
            style={{ marginTop: space.lg }}
          />
          <Text style={styles.devHint}>
            Try 6281234500001 (Folic Acid) or 6281234500003 (Levothyroxine,
            requires prescription).
          </Text>
        </View>
      ) : null}

      {/* Lookup states render as a sheet overlaying the camera */}
      {result.kind !== 'idle' ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.xl }]}>
          {result.kind === 'looking-up' ? (
            <View style={styles.sheetCenter}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.sheetSubtitle}>Looking up {result.barcode}…</Text>
            </View>
          ) : null}

          {result.kind === 'found' ? (
            <FoundCard
              product={result.product}
              requiresPrescription={result.requiresPrescription}
              hasPrescription={result.hasPrescription}
              onAdd={() => {
                cart.add(
                  // The server returns ApiProduct; the cart context expects
                  // the legacy placeholder Product shape. Until the broader
                  // wire-up lands, project the relevant fields.
                  apiToCartProduct(result.product),
                  1
                );
                router.replace('/cart');
              }}
              onCancel={reset}
            />
          ) : null}

          {result.kind === 'rx-required' ? (
            <View style={styles.sheetBlock}>
              <View style={styles.sheetIconBlock}>
                <Ionicons name="medical" size={24} color={colors.accent} />
              </View>
              <Text style={styles.sheetTitle}>Prescription required</Text>
              <Text style={styles.sheetBody}>
                {result.productName} is a prescription medication. Upload your
                prescription and a pharmacist will review it before you can
                order.
              </Text>
              <Button
                label="Upload prescription"
                onPress={() => router.replace('/(tabs)/profile')}
                style={{ marginTop: space.lg, alignSelf: 'stretch' }}
              />
              <Pressable onPress={reset} style={{ marginTop: space.md }}>
                <Text style={styles.linkText}>Scan something else</Text>
              </Pressable>
            </View>
          ) : null}

          {result.kind === 'not-in-catalog' ? (
            <View style={styles.sheetBlock}>
              <View style={styles.sheetIconBlock}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.warning} />
              </View>
              <Text style={styles.sheetTitle}>We don't carry this</Text>
              <Text style={styles.sheetBody}>
                Barcode {result.barcode} isn't in our catalog. Try the search
                bar to find an alternative.
              </Text>
              <Button
                label="Search products"
                onPress={() => router.replace('/(tabs)/shop')}
                variant="secondary"
                style={{ marginTop: space.lg, alignSelf: 'stretch' }}
              />
              <Pressable onPress={reset} style={{ marginTop: space.md }}>
                <Text style={styles.linkText}>Scan again</Text>
              </Pressable>
            </View>
          ) : null}

          {result.kind === 'error' ? (
            <View style={styles.sheetBlock}>
              <View style={styles.sheetIconBlock}>
                <Ionicons name="cloud-offline-outline" size={24} color={colors.danger} />
              </View>
              <Text style={styles.sheetTitle}>Couldn't look that up</Text>
              <Text style={styles.sheetBody}>{result.message}</Text>
              <Button
                label="Try again"
                onPress={reset}
                style={{ marginTop: space.lg, alignSelf: 'stretch' }}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function FoundCard({
  product,
  requiresPrescription,
  hasPrescription,
  onAdd,
  onCancel,
}: {
  product: ApiProduct;
  requiresPrescription: boolean;
  hasPrescription: boolean;
  onAdd: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={styles.foundCard}>
      <Image source={{ uri: product.image }} style={styles.foundImage} contentFit="cover" />
      <View style={{ flex: 1 }}>
        <Text style={styles.foundBrand}>{product.brand}</Text>
        <Text style={styles.foundName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.foundUnit}>{product.unit}</Text>
        <View style={styles.tagRow}>
          {requiresPrescription && hasPrescription ? (
            <Pill label="Rx · prescription verified" tone="accent" />
          ) : (
            <Pill label="Over the counter" tone="success" />
          )}
          {product.pregnancySafe ? <Pill label="Pregnancy-safe" tone="info" /> : null}
        </View>
        <View style={styles.foundFooter}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={styles.foundPrice}>{product.price}</Text>
            <Text style={styles.foundCurrency}>SAR</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: space.sm }}>
            <Button label="Cancel" onPress={onCancel} variant="ghost" size="sm" />
            <Button
              label="Add to cart"
              onPress={onAdd}
              size="sm"
              leadingIcon={<Ionicons name="bag-add" size={16} color={colors.onPrimary} />}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function apiToCartProduct(p: ApiProduct): import('@/data/products').Product {
  return {
    id: p.id,
    name: p.name,
    nameAr: p.nameAr,
    brand: p.brand,
    category: (p.category as never) ?? 'vitamins',
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    unit: p.unit,
    image: p.image,
    rating: p.rating,
    reviews: p.reviews,
    inStock: p.inStock,
    stockCount: p.stockCount,
    rxRequired: p.rxRequired,
    pregnancySafe: p.pregnancySafe,
    description: p.description,
    pharmacistNote: p.pharmacistNote ?? undefined,
    tags: p.tags,
  };
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  topTitle: {
    fontSize: font.size.md,
    color: colors.bg,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
  },
  viewfinderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  viewfinder: {
    width: 280,
    height: 180,
    borderWidth: 3,
    borderColor: colors.bg,
    borderRadius: radius.lg,
  },
  viewfinderHint: {
    color: colors.bg,
    fontSize: font.size.sm,
    fontWeight: font.weight.semi,
    marginTop: space.xl,
    textAlign: 'center',
  },
  fallback: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space.lg,
  },
  fallbackTitle: {
    fontSize: font.size.xxl,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.4,
  },
  fallbackBody: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    marginTop: space.xs,
    lineHeight: 20,
  },
  manualWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    height: 52,
  },
  manualInput: {
    flex: 1,
    fontSize: font.size.lg,
    color: colors.text,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  devHint: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: space.lg,
    lineHeight: 18,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    ...shadow.floating,
  },
  sheetCenter: {
    alignItems: 'center',
    paddingVertical: space.xl,
    gap: space.sm,
  },
  sheetSubtitle: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    fontVariant: ['tabular-nums'],
  },
  sheetBlock: {
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  sheetIconBlock: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  sheetTitle: {
    fontSize: font.size.xl,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.3,
  },
  sheetBody: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    textAlign: 'center',
    marginTop: space.xs,
    paddingHorizontal: space.md,
    lineHeight: 22,
  },
  linkText: {
    fontSize: font.size.sm,
    color: colors.primary,
    fontWeight: font.weight.semi,
  },
  foundCard: {
    flexDirection: 'row',
    gap: space.md,
    paddingBottom: space.md,
  },
  foundImage: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.bgAlt,
  },
  foundBrand: {
    fontSize: font.size.xxs,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  foundName: {
    fontSize: font.size.md,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    marginTop: 2,
  },
  foundUnit: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginTop: space.sm,
  },
  foundFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
  },
  foundPrice: {
    fontSize: font.size.xl,
    color: colors.text,
    fontWeight: font.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  foundCurrency: {
    fontSize: font.size.xs,
    color: colors.textSoft,
    fontWeight: font.weight.semi,
  },
});
