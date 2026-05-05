import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { banners } from '../../constants/mockData';
import { Icon } from '../ui/Icon';
import { useTranslation } from '../../i18n/useTranslation';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;
const BANNER_HEIGHT = 160;
const AUTO_SCROLL_INTERVAL = 4000;

export function BannerCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { localize, isRTL } = useTranslation();

  // Auto-scroll
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % banners.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setActiveIndex(nextIndex);
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(interval);
  }, [activeIndex]);

  const onScrollToIndexFailed = useCallback(
    (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: info.index,
          animated: true,
        });
      }, 200);
    },
    [],
  );

  const onMomentumScrollEnd = useCallback(
    (e: { nativeEvent: { contentOffset: { x: number } } }) => {
      const idx = Math.round(
        e.nativeEvent.contentOffset.x / BANNER_WIDTH,
      );
      setActiveIndex(Math.max(0, Math.min(idx, banners.length - 1)));
    },
    [],
  );

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={flatListRef}
        data={banners}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScrollToIndexFailed={onScrollToIndexFailed}
        onMomentumScrollEnd={onMomentumScrollEnd}
        snapToInterval={BANNER_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.95}
            style={styles.bannerTouchable}
          >
            <LinearGradient
              colors={item.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <View
                style={[
                  styles.bannerContent,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Icon
                    name={item.icon}
                    size={36}
                    color="rgba(255, 255, 255, 0.9)"
                  />
                </View>

                {/* Text */}
                <View style={styles.textContainer}>
                  <Text
                    style={[
                      styles.title,
                      { textAlign: isRTL ? 'right' : 'left' },
                    ]}
                    numberOfLines={2}
                  >
                    {localize(item.titleAr, item.titleEn)}
                  </Text>
                  <Text
                    style={[
                      styles.subtitle,
                      { textAlign: isRTL ? 'right' : 'left' },
                    ]}
                    numberOfLines={2}
                  >
                    {localize(item.subtitleAr, item.subtitleEn)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}
      />

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <View style={styles.dots}>
          {banners.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 0,
  },
  bannerTouchable: {
    width: BANNER_WIDTH,
  },
  banner: {
    borderRadius: 20,
    height: BANNER_HEIGHT,
    padding: 20,
    justifyContent: 'center',
  },
  bannerContent: {
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 18,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 20,
    backgroundColor: Colors.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: Colors.border,
  },
});
