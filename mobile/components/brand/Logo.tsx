/**
 * Estrogen brand logo.
 *
 * Renders the actual logo asset from `mobile/assets/images/logo.jpeg`,
 * which contains:
 *   - 8-pointed Islamic geometric star
 *   - Two women silhouettes (one with flowing hair, one with hijab)
 *   - "إستروجين" Arabic wordmark
 *   - "estrogen" English wordmark
 *
 * The previous version of this file was a hand-built SVG that drew a
 * fictional house-shape with a different female silhouette and a
 * generic pharmacy cross — wrong logo. Replaced with the real asset.
 *
 * Variants:
 *   - 'full' (default): full logo lockup (symbol + Arabic + English wordmark
 *     baked into the image). `showText` is ignored because the image
 *     already contains the wordmark.
 *   - 'icon': renders the same image at a smaller square. Until we have
 *     an icon-only crop of the symbol, the lockup is shown smaller.
 *   - 'text': renders only the Arabic + English wordmarks as live text,
 *     no image. Useful where the symbol would be redundant (e.g. inside
 *     a screen header that already shows the icon).
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../../constants/colors';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'full' | 'icon' | 'text';
  color?: string;
}

const SIZES = { sm: 64, md: 96, lg: 144, xl: 192 };
const TEXT_AR_SIZES = { sm: 14, md: 18, lg: 26, xl: 34 };
const TEXT_EN_SIZES = { sm: 8, md: 10, lg: 14, xl: 16 };

// Required statically so Metro bundles it.
const LOGO_SOURCE = require('../../assets/images/logo.jpeg');

export function Logo({
  size = 'md',
  showText: _showText = true,
  variant = 'full',
  color,
}: LogoProps) {
  const dim = SIZES[size];
  const brandColor = color || Colors.purple;

  if (variant === 'text') {
    return (
      <View style={styles.textContainer}>
        <Text style={[styles.nameAr, { fontSize: TEXT_AR_SIZES[size], color: brandColor }]}>
          إستروجين
        </Text>
        <Text style={[styles.nameEn, { fontSize: TEXT_EN_SIZES[size], color: brandColor }]}>
          estrogen
        </Text>
      </View>
    );
  }

  // 'full' and 'icon' both render the image. Icon is just smaller.
  // The image itself contains the wordmark, so `showText` is unused.
  return (
    <Image
      source={LOGO_SOURCE}
      style={{
        width: dim,
        height: dim,
        // Preserve aspect ratio of the source asset (1600×1534 ≈ 1.04).
      }}
      resizeMode="contain"
      accessibilityLabel="Estrogen Pharmacy"
      accessibilityRole="image"
    />
  );
}

const styles = StyleSheet.create({
  textContainer: {
    alignItems: 'center',
  },
  nameAr: {
    fontWeight: '700',
    letterSpacing: 1,
  },
  nameEn: {
    fontWeight: '500',
    textTransform: 'lowercase',
    letterSpacing: 2,
    opacity: 0.7,
    marginTop: 2,
  },
});

export default Logo;
