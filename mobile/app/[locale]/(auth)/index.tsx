import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { Logo } from '../../../components/brand/Logo';
import { useTranslation } from '../../../i18n/useTranslation';
import { useLocale } from '../../../hooks/useLocale';
import { useAuthStore } from '../../../store';

interface FeatureCardProps {
  icon: IconName;
  iconBg: string;
  title: string;
  description: string;
  isRTL: boolean;
  flexDir: 'row' | 'row-reverse';
  align: 'left' | 'right';
}

function FeatureCard({ icon, iconBg, title, description, isRTL, flexDir, align }: FeatureCardProps) {
  return (
    <View style={[styles.featureCard, { flexDirection: flexDir }]}>
      <View style={[styles.featureIconCircle, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={24} color={Colors.primary} />
      </View>
      <View style={styles.featureTextContainer}>
        <Text style={[styles.featureTitle, { textAlign: align }]}>{title}</Text>
        <Text style={[styles.featureDesc, { textAlign: align }]}>{description}</Text>
      </View>
    </View>
  );
}

interface CategoryPillProps {
  icon: IconName;
  label: string;
  bgColor: string;
  iconColor: string;
}

function CategoryPill({ icon, label, bgColor, iconColor }: CategoryPillProps) {
  return (
    <View style={[styles.categoryPill, { backgroundColor: bgColor }]}>
      <Icon name={icon} size={16} color={iconColor} />
      <Text style={[styles.categoryPillText, { color: iconColor }]}>{label}</Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const { t, isRTL, flexDir, align } = useTranslation();
  const locale = useLocale();
  const setHasSeenWelcome = useAuthStore((s) => s.setHasSeenWelcome);

  const features: { icon: IconName; iconBg: string; titleKey: string; descKey: string }[] = [
    { icon: 'lock', iconBg: Colors.primarySoft, titleKey: 'featurePrivacy', descKey: 'featurePrivacyDesc' },
    { icon: 'pharmacist', iconBg: Colors.accentLight, titleKey: 'featurePharmacist', descKey: 'featurePharmacistDesc' },
    { icon: 'truck', iconBg: Colors.successLight, titleKey: 'featureDelivery', descKey: 'featureDeliveryDesc' },
  ];

  const categories: { icon: IconName; labelKey: string; bg: string; color: string }[] = [
    { icon: 'pregnancy', labelKey: 'catPregnancy', bg: Colors.catPregnancy, color: '#BE185D' },
    { icon: 'pill', labelKey: 'catVitamins', bg: Colors.catVitamins, color: '#059669' },
    { icon: 'skincare', labelKey: 'catSkincare', bg: Colors.catSkincare, color: '#D97706' },
    { icon: 'medicalBag', labelKey: 'catChronic', bg: Colors.catChronic, color: '#2563EB' },
  ];

  return (
    <LinearGradient
      colors={['#FAFAFA', Colors.primarySoft]}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <Logo size="lg" />
            <Text style={[styles.tagline, { textAlign: 'center' }]}>{t('tagline')}</Text>
          </View>

          {/* Category Pills */}
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <CategoryPill
                key={cat.labelKey}
                icon={cat.icon}
                label={t(cat.labelKey as any)}
                bgColor={cat.bg}
                iconColor={cat.color}
              />
            ))}
          </View>

          {/* Feature Cards */}
          <View style={styles.featuresSection}>
            {features.map((feature) => (
              <FeatureCard
                key={feature.titleKey}
                icon={feature.icon}
                iconBg={feature.iconBg}
                title={t(feature.titleKey as any)}
                description={t(feature.descKey as any)}
                isRTL={isRTL}
                flexDir={flexDir}
                align={align}
              />
            ))}
          </View>

          {/* CTA Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push(`/${locale}/(auth)/signup`)}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>{t('signup')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineButton}
              activeOpacity={0.8}
              onPress={() => router.push(`/${locale}/(auth)/login`)}
            >
              <Text style={styles.outlineButtonText}>{t('login')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setHasSeenWelcome();
                router.replace(`/${locale}/(tabs)`);
              }}
              style={styles.guestLink}
              activeOpacity={0.7}
            >
              <Text style={styles.guestText}>{t('continueAsGuest')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },

  // ── Logo ──────────────────────────────────────────
  logoArea: {
    alignItems: 'center',
    paddingTop: 48,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 8,
  },

  // ── Category Pills ────────────────────────────────
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 28,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Feature Cards ─────────────────────────────────
  featuresSection: {
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  featureIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // ── CTA Buttons ───────────────────────────────────
  actions: {
    marginTop: 'auto' as any,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  outlineButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  outlineButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
  },
  guestLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  guestText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
