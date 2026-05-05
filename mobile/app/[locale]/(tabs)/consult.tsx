import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocale } from '../../../hooks/useLocale';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { Badge } from '../../../components/ui/Badge';
import { useTranslation } from '../../../i18n/useTranslation';

// ── Mock Doctor Data ───────────────────────────────────────
type DoctorStatus = 'available' | 'busy' | 'offline';

interface Doctor {
  id: string;
  nameAr: string;
  nameEn: string;
  specialtyKey: string;
  yearsExperience: number;
  rating: number;
  status: DoctorStatus;
}

const DOCTORS: Doctor[] = [
  {
    id: 'dr-1',
    nameAr: 'د. سارة القحطاني',
    nameEn: 'Dr. Sarah Al-Qahtani',
    specialtyKey: 'drObGyn',
    yearsExperience: 12,
    rating: 4.9,
    status: 'available',
  },
  {
    id: 'dr-2',
    nameAr: 'د. نورة الراشدي',
    nameEn: 'Dr. Noura Al-Rashidi',
    specialtyKey: 'drDermatology',
    yearsExperience: 8,
    rating: 4.8,
    status: 'available',
  },
  {
    id: 'dr-3',
    nameAr: 'د. حنان الدوسري',
    nameEn: 'Dr. Hanan Al-Dosari',
    specialtyKey: 'drEndocrinology',
    yearsExperience: 15,
    rating: 4.7,
    status: 'busy',
  },
  {
    id: 'dr-4',
    nameAr: 'د. لمى الحربي',
    nameEn: 'Dr. Lama Al-Harbi',
    specialtyKey: 'drGeneralPractice',
    yearsExperience: 6,
    rating: 4.6,
    status: 'offline',
  },
];

// ── Status Config ──────────────────────────────────────────
const STATUS_CONFIG: Record<DoctorStatus, { badgeType: 'success' | 'warning' | 'danger'; key: string }> = {
  available: { badgeType: 'success', key: 'consultAvailable' },
  busy:      { badgeType: 'warning', key: 'consultBusy' },
  offline:   { badgeType: 'danger',  key: 'consultOffline' },
};

// ── Component ──────────────────────────────────────────────
export default function ConsultScreen() {
  const locale = useLocale();
  const { t, localize, isRTL, flexDir, align } = useTranslation();

  const openChat = () => Linking.openURL('https://wa.me/966920012345');
  const openVideo = () => Linking.openURL('https://doxy.me/estrogen-pharmacy');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ──────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={[styles.title, { textAlign: align }]}>
            {t('consultTitle')}
          </Text>
          <Text style={[styles.subtitle, { textAlign: align }]}>
            {t('consultSubtitle')}
          </Text>
        </View>

        {/* ── Disclaimer Banner ───────────────────────── */}
        <View style={[styles.disclaimerCard, { flexDirection: flexDir }]}>
          <View style={styles.disclaimerIconWrap}>
            <Icon name="info" size={18} color={Colors.info} />
          </View>
          <Text style={[styles.disclaimerText, { textAlign: align, flex: 1 }]}>
            {t('consultDisclaimer')}
          </Text>
        </View>

        {/* ── Action Cards (Chat + Video) ─────────────── */}
        <View style={[styles.actionRow, { flexDirection: flexDir }]}>
          {/* Chat Card */}
          <View style={styles.actionCard}>
            <View style={[styles.actionIconWrap, { backgroundColor: Colors.successLight }]}>
              <Icon name="messageCircle" size={28} color={Colors.success} />
            </View>
            <Text style={[styles.actionTitle, { textAlign: align }]}>
              {t('consultChat')}
            </Text>
            <Text style={[styles.actionDesc, { textAlign: align }]}>
              {t('consultChatDesc')}
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={openChat}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>{t('consultStartChat')}</Text>
            </TouchableOpacity>
          </View>

          {/* Video Card */}
          <View style={styles.actionCard}>
            <View style={[styles.actionIconWrap, { backgroundColor: Colors.primarySoft }]}>
              <Icon name="video" size={28} color={Colors.primary} />
            </View>
            <Text style={[styles.actionTitle, { textAlign: align }]}>
              {t('consultVideo')}
            </Text>
            <Text style={[styles.actionDesc, { textAlign: align }]}>
              {t('consultVideoDesc')}
            </Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={openVideo}
              activeOpacity={0.85}
            >
              <Text style={styles.actionButtonText}>{t('consultStartVideo')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Available Doctors ────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { textAlign: align }]}>
            {t('consultDoctors')}
          </Text>
        </View>

        {DOCTORS.map((doctor) => {
          const statusCfg = STATUS_CONFIG[doctor.status];
          const isAvailable = doctor.status === 'available';

          return (
            <View key={doctor.id} style={styles.doctorCard}>
              <View style={[styles.doctorRow, { flexDirection: flexDir }]}>
                {/* Avatar */}
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {localize(doctor.nameAr, doctor.nameEn).replace(/^(د\.\s*|Dr\.\s*)/i, '').charAt(0)}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.doctorInfo}>
                  <Text
                    numberOfLines={1}
                    style={[styles.doctorName, { textAlign: align }]}
                  >
                    {localize(doctor.nameAr, doctor.nameEn)}
                  </Text>

                  <Text
                    numberOfLines={1}
                    style={[styles.doctorSpecialty, { textAlign: align }]}
                  >
                    {t(doctor.specialtyKey as any)}
                  </Text>

                  <View style={[styles.doctorMeta, { flexDirection: flexDir }]}>
                    {/* Experience */}
                    <View style={[styles.metaItem, { flexDirection: flexDir }]}>
                      <Icon name="clock" size={12} color={Colors.textTertiary} />
                      <Text style={styles.metaText}>
                        {doctor.yearsExperience} {t('consultExperience')}
                      </Text>
                    </View>

                    {/* Rating */}
                    <View style={[styles.metaItem, { flexDirection: flexDir }]}>
                      <Icon name="star" size={12} color={Colors.warning} />
                      <Text style={styles.metaText}>{doctor.rating}</Text>
                    </View>
                  </View>
                </View>

                {/* Status + Book */}
                <View style={styles.doctorActions}>
                  <Badge
                    label={t(statusCfg.key as any)}
                    type={statusCfg.badgeType}
                    small
                  />
                  <TouchableOpacity
                    style={[
                      styles.bookButton,
                      !isAvailable && styles.bookButtonDisabled,
                    ]}
                    disabled={!isAvailable}
                    onPress={openChat}
                    activeOpacity={0.85}
                  >
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                      style={[
                        styles.bookButtonText,
                        !isAvailable && styles.bookButtonTextDisabled,
                      ]}
                    >
                      {t('consultBookAppointment')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {/* ── Consultation Fee Info ────────────────────── */}
        <View style={[styles.feeRow, { flexDirection: flexDir }]}>
          <Icon name="tag" size={14} color={Colors.success} />
          <Text style={styles.feeText}>
            {t('consultFee')}: {t('consultFree')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingBottom: 32,
  },

  // Header
  header: {
    padding: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },

  // Disclaimer
  disclaimerCard: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 20,
    backgroundColor: Colors.infoLight,
    borderRadius: 12,
    padding: 14,
    alignItems: 'flex-start',
    gap: 10,
  },
  disclaimerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerText: {
    fontSize: 13,
    color: Colors.info,
    lineHeight: 20,
  },

  // Action Cards Row
  actionRow: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  actionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 14,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },

  // Section
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },

  // Doctor Card
  doctorCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  doctorRow: {
    alignItems: 'flex-start',
    gap: 12,
  },

  // Avatar
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Doctor Info
  doctorInfo: {
    flex: 1,
    minWidth: 0, // allow children to shrink in flex row
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: 6,
  },
  doctorMeta: {
    alignItems: 'center',
    gap: 14,
  },
  metaItem: {
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Doctor Actions
  doctorActions: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
    maxWidth: 130,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bookButtonDisabled: {
    backgroundColor: Colors.surfaceSecondary,
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  bookButtonTextDisabled: {
    color: Colors.textTertiary,
  },

  // Fee
  feeRow: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  feeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
  },
});
