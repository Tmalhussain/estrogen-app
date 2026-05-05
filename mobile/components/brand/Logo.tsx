import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors } from '../../constants/colors';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'full' | 'icon' | 'text';
  color?: string;
}

const SIZES = { sm: 32, md: 48, lg: 72, xl: 96 };
const FONT_SIZES = { sm: 14, md: 18, lg: 26, xl: 34 };
const SUB_SIZES = { sm: 8, md: 10, lg: 14, xl: 16 };

export function Logo({ size = 'md', showText = true, variant = 'full', color }: LogoProps) {
  const dim = SIZES[size];
  const brandColor = color || Colors.primary;
  const brandLight = Colors.primaryLight;

  const renderIcon = () => (
    <Svg width={dim} height={dim} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="brandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={brandColor} stopOpacity="1" />
          <Stop offset="100%" stopColor={brandLight} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      {/* Geometric house/pharmacy shape */}
      <Path
        d="M50 5 L85 25 L85 70 Q85 85 70 90 L50 95 L30 90 Q15 85 15 70 L15 25 Z"
        fill="url(#brandGrad)"
      />
      {/* Inner cutout - lighter area */}
      <Path
        d="M50 15 L75 30 L75 65 Q75 78 63 82 L50 85 L37 82 Q25 78 25 65 L25 30 Z"
        fill="#FFFFFF"
        opacity="0.2"
      />
      {/* Woman silhouette - profile facing right */}
      <G transform="translate(30, 22) scale(0.4)">
        <Path
          d="M60 10 Q75 5 80 20 Q85 35 78 48 L82 52 Q88 58 85 65 L80 70 Q78 72 75 72 L72 74 Q70 82 68 88 Q65 95 58 100 L55 102 Q52 100 50 95 Q48 88 46 82 L44 76 Q38 72 35 65 Q32 58 38 52 L42 48 Q35 35 40 20 Q45 5 60 10 Z"
          fill="#FFFFFF"
          opacity="0.9"
        />
        {/* Hair detail */}
        <Path
          d="M60 8 Q78 3 82 18 Q86 32 80 44 Q75 38 72 30 Q68 22 60 18 Q52 14 48 22 Q44 18 42 14 Q48 5 60 8 Z"
          fill={brandColor}
          opacity="0.3"
        />
      </G>
      {/* Pharmacy cross accent */}
      <G transform="translate(62, 60)">
        <Path
          d="M8 4 L12 4 L12 8 L16 8 L16 12 L12 12 L12 16 L8 16 L8 12 L4 12 L4 8 L8 8 Z"
          fill="#FFFFFF"
          opacity="0.8"
        />
      </G>
    </Svg>
  );

  if (variant === 'icon') {
    return renderIcon();
  }

  if (variant === 'text') {
    return (
      <View style={styles.textContainer}>
        <Text style={[styles.nameAr, { fontSize: FONT_SIZES[size], color: brandColor }]}>
          إستروجين
        </Text>
        <Text style={[styles.nameEn, { fontSize: SUB_SIZES[size], color: brandColor }]}>
          estrogen
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderIcon()}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.nameAr, { fontSize: FONT_SIZES[size], color: brandColor }]}>
            إستروجين
          </Text>
          <Text style={[styles.nameEn, { fontSize: SUB_SIZES[size], color: brandColor }]}>
            estrogen
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
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
