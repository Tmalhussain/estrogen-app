import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { useTranslation } from '../../../i18n/useTranslation';
import { showAlert } from '../../../utils/alert';
import { useLocale } from '../../../hooks/useLocale';
import { useAuthStore, useCartStore } from '../../../store';
import { useNotificationsStore } from '../../../store/notificationsStore';

interface MenuItemProps {
  icon: IconName;
  label: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

function MenuItem({ icon, label, onPress, danger, badge }: MenuItemProps) {
  const { isRTL, flexDir } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.menuItem, { flexDirection: flexDir }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Icon name={icon} size={18} color={danger ? Colors.danger : Colors.primary} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.menuLabel, danger && styles.menuLabelDanger, { textAlign: isRTL ? 'right' : 'left' }]}
      >
        {label}
      </Text>
      {badge && (
        <View style={[styles.menuBadge, { flexShrink: 0 }]}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      <Icon
        name={isRTL ? 'chevronLeft' : 'chevronRight'}
        size={16}
        color={Colors.textTertiary}
      />
    </TouchableOpacity>
  );
}

export default function AccountScreen() {
  const locale = useLocale();
  const { user, isLoggedIn, logout, language, setLanguage } = useAuthStore();
  const clearCart = useCartStore((s) => s.clearCart);
  const unreadCount = useNotificationsStore((s) => s.notifications.filter(n => !n.read).length);
  const { t, isRTL, flexDir, align } = useTranslation();

  const doLogout = () => {
    logout();
    clearCart();
    router.replace(`/${locale}/(auth)` as any);
  };

  const handleLogout = () => {
    showAlert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: doLogout },
    ]);
  };

  // Guest state
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: align }]}>{t('myAccount')}</Text>
        </View>
        <View style={styles.guestBanner}>
          <View style={styles.guestIconWrap}>
            <Icon name="user" size={28} color={Colors.primary} />
          </View>
          <Text style={[styles.guestTitle, { textAlign: align }]}>{t('guestBanner')}</Text>
          <Text style={[styles.guestSubtext, { textAlign: 'center' }]}>{t('guestBannerDesc')}</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push(`/${locale}/(auth)/login`)}>
            <Text style={styles.loginBtnText}>{t('login')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/${locale}/(auth)/signup`)}>
            <Text style={styles.signupLink}>{t('signup')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: align }]}>{t('myAccount')}</Text>
        </View>

        {/* ── Profile Card ───────────────────────────── */}
        <View style={[styles.profileCard, { flexDirection: flexDir }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0) ?? '?'}
            </Text>
          </View>
          <View style={[styles.profileInfo, { alignItems: isRTL ? 'flex-start' : 'flex-start' }]}>
            <Text style={[styles.profileName, { textAlign: align }]}>
              {user?.name ?? t('helloGuest')}
            </Text>
            <Text style={[styles.profilePhone, { textAlign: align }]}>{user?.phone}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/${locale}/profile/personal`)}>
            <Icon name="edit" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── My Account Section ─────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('myAccount')}</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="user"
              label={t('personalInfo')}
              onPress={() => router.push(`/${locale}/profile/personal`)}
            />
            <MenuItem
              icon="heartPulse"
              label={t('medicalProfile')}
              onPress={() => router.push(`/${locale}/profile/medical`)}
              badge={t('medicalImportant')}
            />
            <MenuItem
              icon="mapPin"
              label={t('myAddresses')}
              onPress={() => router.push(`/${locale}/profile/addresses`)}
            />
            <MenuItem
              icon="creditCard"
              label={t('paymentMethods')}
              onPress={() => showAlert(t('paymentMethods'), t('comingSoon'), [{ text: t('ok') }])}
            />
          </View>
        </View>

        {/* ── Orders Section ─────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('ordersSection')}</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="bag"
              label={t('myOrdersMenu')}
              onPress={() => router.push(`/${locale}/(tabs)/orders`)}
            />
            <MenuItem
              icon="fileText"
              label={t('myPrescriptionsMenu')}
              onPress={() => router.push(`/${locale}/(tabs)/prescriptions`)}
            />
            <MenuItem
              icon="stethoscope"
              label={t('consultTitle')}
              onPress={() => router.push(`/${locale}/(tabs)/consult`)}
            />
            <MenuItem
              icon="refresh"
              label={t('returnsRefunds')}
              onPress={() => showAlert(t('returnsRefunds'), t('comingSoon'), [{ text: t('ok') }])}
            />
          </View>
        </View>

        {/* ── Settings Section ───────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('settingsSection')}</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="bell"
              label={t('notifications')}
              onPress={() => router.push(`/${locale}/notifications`)}
              badge={unreadCount > 0 ? String(unreadCount) : undefined}
            />
            <MenuItem
              icon="language"
              label={language === 'ar' ? t('languageArabic') : t('languageEnglish')}
              onPress={() => {
                const newLang = language === 'ar' ? 'en' : 'ar';
                setLanguage(newLang);
                router.replace(`/${newLang}/(tabs)/account`);
              }}
            />
            <MenuItem
              icon="lock"
              label={t('privacySecurity')}
              onPress={() => router.push(`/${locale}/privacy`)}
            />
          </View>
        </View>

        {/* ── Support Section ────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: align }]}>{t('supportSection')}</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon="helpCircle"
              label={t('helpCenter')}
              onPress={() => router.push(`/${locale}/help`)}
            />
            <MenuItem
              icon="messageCircle"
              label={t('contactUs')}
              onPress={() => router.push(`/${locale}/help`)}
            />
            <MenuItem
              icon="fileText"
              label={t('termsConditions')}
              onPress={() => router.push(`/${locale}/terms`)}
            />
            <MenuItem
              icon="shield"
              label={t('privacyPolicy')}
              onPress={() => router.push(`/${locale}/privacy`)}
            />
          </View>
        </View>

        {/* ── App Version ────────────────────────────── */}
        <Text style={styles.version}>
          {t('version')} 0.1.0
        </Text>

        {/* ── Logout ─────────────────────────────────── */}
        <View style={[styles.menuGroup, { marginHorizontal: 20, marginBottom: 16 }]}>
          <MenuItem
            icon="logout"
            label={t('logout')}
            onPress={handleLogout}
            danger
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  // Guest Banner
  guestBanner: {
    margin: 20,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  guestIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  guestSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  loginBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  signupLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  // Profile Card
  profileCard: {
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  profilePhone: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sections
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textTertiary,
    paddingHorizontal: 24,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Menu
  menuGroup: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  menuItem: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: Colors.dangerLight,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  menuLabelDanger: {
    color: Colors.danger,
  },
  menuBadge: {
    backgroundColor: Colors.accent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  menuBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  // Version
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
    paddingVertical: 14,
  },
});
