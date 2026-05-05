import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../store';

interface PrivacySection {
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    titleAr: 'المقدمة',
    titleEn: 'Introduction',
    bodyAr:
      'نحن في صيدلية إستروجين نلتزم بحماية خصوصيتكِ وبياناتكِ الشخصية وفقاً لنظام حماية البيانات الشخصية السعودي (PDPL). توضح هذه السياسة كيفية جمع واستخدام وحماية بياناتكِ.',
    bodyEn:
      'At Estrogen Pharmacy, we are committed to protecting your privacy and personal data in accordance with the Saudi Personal Data Protection Law (PDPL). This policy explains how we collect, use, and protect your data.',
  },
  {
    titleAr: 'البيانات التي نجمعها',
    titleEn: 'Data We Collect',
    bodyAr:
      'نجمع: الاسم ورقم الجوال والبريد الإلكتروني ورقم الهوية الوطنية وتاريخ الميلاد وعناوين التوصيل والمعلومات الصحية (بموافقتكِ) وسجل الطلبات والوصفات الطبية.',
    bodyEn:
      'We collect: name, phone number, email, national ID, date of birth, delivery addresses, health information (with your consent), order history, and prescriptions.',
  },
  {
    titleAr: 'كيف نستخدم بياناتكِ',
    titleEn: 'How We Use Your Data',
    bodyAr:
      'نستخدم بياناتكِ لمعالجة الطلبات والتحقق من الوصفات الطبية وتحسين خدماتنا وإرسال الإشعارات والعروض (بموافقتكِ) والامتثال للمتطلبات التنظيمية.',
    bodyEn:
      'We use your data to process orders, verify prescriptions, improve our services, send notifications and offers (with your consent), and comply with regulatory requirements.',
  },
  {
    titleAr: 'أمان البيانات',
    titleEn: 'Data Security',
    bodyAr:
      'نحمي بياناتكِ باستخدام التشفير المتقدم (AES-256) وبروتوكولات الأمان SSL/TLS. كلمات المرور مشفرة بتقنية التجزئة ولا يمكن قراءتها. نخزن البيانات في مراكز بيانات معتمدة في المملكة العربية السعودية (منطقة البحرين AWS me-south-1).',
    bodyEn:
      'We protect your data using advanced encryption (AES-256) and SSL/TLS security protocols. Passwords are hashed and cannot be read. Data is stored in certified data centers in Saudi Arabia (AWS Bahrain region me-south-1).',
  },
  {
    titleAr: 'البيانات الطبية',
    titleEn: 'Medical Data',
    bodyAr:
      'بياناتكِ الصحية والطبية محمية بشكل خاص ولا تُشارك مع أي طرف ثالث إلا بموافقتكِ الصريحة أو حسب متطلبات الجهات الرقابية. الصيدلانيات المعتمدات فقط يمكنهن الاطلاع على الوصفات الطبية.',
    bodyEn:
      'Your health and medical data is specially protected and not shared with any third party without your explicit consent or as required by regulatory authorities. Only licensed pharmacists can access prescriptions.',
  },
  {
    titleAr: 'مشاركة البيانات',
    titleEn: 'Data Sharing',
    bodyAr:
      'لا نبيع بياناتكِ أبداً. قد نشاركها فقط مع: شركات التوصيل (العنوان فقط)، بوابات الدفع (لمعالجة المدفوعات)، والجهات الرقابية (عند الطلب القانوني).',
    bodyEn:
      'We never sell your data. We may share it only with: delivery partners (address only), payment gateways (for payment processing), and regulatory authorities (upon legal request).',
  },
  {
    titleAr: 'حقوقكِ',
    titleEn: 'Your Rights',
    bodyAr:
      'يحق لكِ: طلب الاطلاع على بياناتكِ، تصحيح أي معلومات غير دقيقة، طلب حذف بياناتكِ، سحب موافقتكِ في أي وقت، وتقديم شكوى للجهة المختصة.',
    bodyEn:
      'You have the right to: access your data, correct any inaccurate information, request data deletion, withdraw consent at any time, and file a complaint with the relevant authority.',
  },
  {
    titleAr: 'ملفات تعريف الارتباط',
    titleEn: 'Cookies and Tracking',
    bodyAr:
      'نستخدم ملفات تعريف الارتباط لتحسين تجربتكِ وتحليل استخدام التطبيق. يمكنكِ إدارة إعدادات ملفات تعريف الارتباط من إعدادات المتصفح.',
    bodyEn:
      'We use cookies to improve your experience and analyze app usage. You can manage cookie settings from your browser settings.',
  },
  {
    titleAr: 'الاحتفاظ بالبيانات',
    titleEn: 'Data Retention',
    bodyAr:
      'نحتفظ ببياناتكِ طوال فترة حسابكِ النشط وفترة إضافية حسب المتطلبات القانونية. بعد إغلاق حسابكِ، نحذف بياناتكِ الشخصية خلال ٩٠ يوماً باستثناء ما يتطلبه القانون.',
    bodyEn:
      'We retain your data for the duration of your active account plus an additional period as required by law. After account closure, personal data is deleted within 90 days except as legally required.',
  },
  {
    titleAr: 'التواصل',
    titleEn: 'Contact',
    bodyAr:
      'لأي استفسارات حول سياسة الخصوصية، تواصلي مع مسؤول حماية البيانات: privacy@estrogen.sa',
    bodyEn:
      'For privacy policy inquiries, contact our Data Protection Officer: privacy@estrogen.sa',
  },
];

export default function PrivacyScreen() {
  const { locale } = useLocalSearchParams<{ locale: string }>();
  const { t, isRTL, flexDir, align } = useTranslation();
  const language = useAuthStore((s) => s.language);
  const isAr = language === 'ar';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.topBar, { flexDirection: flexDir }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Icon
            name={isRTL ? 'chevronRight' : 'chevronLeft'}
            size={24}
            color={Colors.primaryDark}
          />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t('privacyTitle')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated */}
        <Text style={[styles.lastUpdated, { textAlign: align }]}>
          {t('privacyLastUpdated')}
        </Text>

        {/* PDPL Badge */}
        <View style={[styles.pdplBadge, { flexDirection: flexDir }]}>
          <View style={styles.pdplIconWrap}>
            <Icon name="shield" size={20} color={Colors.primary} />
          </View>
          <Text style={[styles.pdplText, { textAlign: align }]}>
            {isAr
              ? 'متوافقة مع نظام حماية البيانات الشخصية السعودي (PDPL)'
              : 'Compliant with the Saudi Personal Data Protection Law (PDPL)'}
          </Text>
        </View>

        {/* Sections */}
        {PRIVACY_SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionNumber, { textAlign: align }]}>
              {isAr
                ? `${(index + 1).toLocaleString('ar-SA')}.`
                : `${index + 1}.`}
            </Text>
            <Text style={[styles.sectionTitle, { textAlign: align }]}>
              {isAr ? section.titleAr : section.titleEn}
            </Text>
            <Text style={[styles.sectionBody, { textAlign: align }]}>
              {isAr ? section.bodyAr : section.bodyEn}
            </Text>
          </View>
        ))}

        {/* Footer note */}
        <View style={styles.footerNote}>
          <Icon name="lock" size={18} color={Colors.primary} />
          <Text style={[styles.footerNoteText, { textAlign: align }]}>
            {isAr
              ? 'بياناتكِ محمية بأعلى معايير الأمان والتشفير'
              : 'Your data is protected with the highest security and encryption standards'}
          </Text>
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

  // ── Header ────────────────────────────────────────
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
    textAlign: 'center',
  },

  // ── Content ───────────────────────────────────────
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  lastUpdated: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontWeight: '500',
    marginBottom: 20,
  },

  // ── PDPL Badge ────────────────────────────────────
  pdplBadge: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
  },
  pdplIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pdplText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    lineHeight: 22,
  },

  // ── Sections ──────────────────────────────────────
  section: {
    marginBottom: 28,
  },
  sectionNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primaryDark,
    marginBottom: 10,
    lineHeight: 26,
  },
  sectionBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  // ── Footer Note ───────────────────────────────────
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryDark,
    fontWeight: '600',
    lineHeight: 20,
  },
});
