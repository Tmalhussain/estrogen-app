import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Icon } from './Icon';
import { useCartToastStore, useAuthStore } from '../../store';
import { useTranslation } from '../../i18n/useTranslation';

const TOAST_DURATION = 3000;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CartToast() {
  const { visible, productNameAr, productNameEn, productImage, cartItemCount, dismiss } =
    useCartToastStore();
  const { localize, t, isRTL, flexDir } = useTranslation();
  const language = useAuthStore((s) => s.language);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const translateY = useRef(new Animated.Value(160)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (timerRef.current) clearTimeout(timerRef.current);

      // Reset animations
      translateY.setValue(160);
      opacity.setValue(0);
      scaleAnim.setValue(0.8);
      checkScale.setValue(0);

      // Slide up from bottom
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
      ]).start(() => {
        // Pop the checkmark after slide
        Animated.spring(checkScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 6,
        }).start();
      });

      // Auto-dismiss
      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 160,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => dismiss());
      }, TOAST_DURATION);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, productNameAr, productNameEn]);

  if (!visible) return null;

  const productName = localize(productNameAr, productNameEn);

  const handleViewCart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dismiss();
    router.push(`/${language}/(tabs)/cart`);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 90,
          transform: [{ translateY }, { scale: scaleAnim }],
          opacity,
        },
      ]}
    >
      <View style={styles.toast}>
        {/* Left section: Product image + check badge */}
        <View style={styles.imageWrap}>
          {productImage ? (
            <Image source={{ uri: productImage }} style={styles.productImage} />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Icon name="package" size={20} color={Colors.textTertiary} />
            </View>
          )}
          <Animated.View
            style={[styles.checkBadge, { transform: [{ scale: checkScale }] }]}
          >
            <Icon name="check" size={10} color={Colors.white} />
          </Animated.View>
        </View>

        {/* Middle: Text content */}
        <View style={styles.textWrap}>
          <View style={[styles.addedRow, { flexDirection: flexDir }]}>
            <Icon name="checkCircle" size={14} color={Colors.success} />
            <Text style={styles.addedLabel}>{t('addedToCart')}</Text>
          </View>
          <Text style={[styles.productName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {productName}
          </Text>
          <Text style={styles.cartCount}>
            {cartItemCount} {t('itemsInCart')}
          </Text>
        </View>

        {/* Right: View Cart button */}
        <TouchableOpacity style={styles.viewCartBtn} onPress={handleViewCart} activeOpacity={0.85}>
          <Text style={styles.viewCartText}>{t('viewCart')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignSelf: 'stretch',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // Product Image
  imageWrap: {
    position: 'relative',
  },
  productImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  // Text
  textWrap: {
    flex: 1,
  },
  addedRow: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 1,
  },
  addedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 1,
  },
  cartCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  // View Cart Button
  viewCartBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  viewCartText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
