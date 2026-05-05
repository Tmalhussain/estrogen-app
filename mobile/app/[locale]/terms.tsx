import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Icon } from '../../components/ui/Icon';
import { useTranslation } from '../../i18n/useTranslation';
import { useAuthStore } from '../../store';

interface TermsSection {
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
}

const TERMS_SECTIONS: TermsSection[] = [
  {
    titleAr: 'المقدمة',
    titleEn: 'Introduction',
    bodyAr:
      'مرحباً بكِ في صيدلية إستروجين. باستخدامكِ لهذا التطبيق، فإنكِ توافقين على الالتزام بهذه الشروط والأحكام. يرجى قراءتها بعناية قبل استخدام خدماتنا.',
    bodyEn:
      'Welcome to Estrogen Pharmacy. By using this application, you agree to be bound by these Terms and Conditions. Please read them carefully before using our services.',
  },
  {
    titleAr: 'وصف الخدمة',
    titleEn: 'Service Description',
    bodyAr:
      'صيدلية إستروجين هي منصة صيدلانية إلكترونية مرخصة من الهيئة العامة للغذاء والدواء (SFDA) في المملكة العربية السعودية. نقدم خدمات بيع الأدوية والمنتجات الصحية مع التركيز على صحة المرأة.',
    bodyEn:
      'Estrogen Pharmacy is an electronic pharmacy platform licensed by the Saudi Food and Drug Authority (SFDA) in Saudi Arabia. We provide pharmaceutical products and health services with a focus on women\'s health.',
  },
  {
    titleAr: 'أهلية الاستخدام',
    titleEn: 'User Eligibility',
    bodyAr:
      'يجب أن يكون عمركِ ١٨ عاماً أو أكثر لاستخدام خدماتنا. بتسجيلكِ في التطبيق، تؤكدين أنكِ تستوفين هذا الشرط وأن المعلومات المقدمة صحيحة.',
    bodyEn:
      'You must be 18 years or older to use our services. By registering, you confirm that you meet this requirement and that the information provided is accurate.',
  },
  {
    titleAr: 'الأدوية الموصوفة',
    titleEn: 'Prescription Medications',
    bodyAr:
      'الأدوية التي تتطلب وصفة طبية لن يتم صرفها إلا بعد تقديم وصفة طبية سارية ومراجعتها من قبل الصيدلانية المختصة. نحتفظ بالحق في رفض صرف أي وصفة غير مستوفية للشروط.',
    bodyEn:
      'Prescription medications will only be dispensed after a valid prescription is provided and reviewed by our qualified pharmacist. We reserve the right to reject any prescription that does not meet requirements.',
  },
  {
    titleAr: 'الطلبات والمدفوعات',
    titleEn: 'Orders and Payments',
    bodyAr:
      'جميع الأسعار بالريال السعودي وتشمل ضريبة القيمة المضافة (١٥٪). نقبل الدفع عبر STC Pay ومدى وفيزا/ماستركارد وApple Pay. يحق لنا تعديل الأسعار في أي وقت دون إشعار مسبق.',
    bodyEn:
      'All prices are in Saudi Riyals and include VAT (15%). We accept payment via STC Pay, Mada, Visa/Mastercard, and Apple Pay. We reserve the right to modify prices at any time without prior notice.',
  },
  {
    titleAr: 'التوصيل',
    titleEn: 'Delivery',
    bodyAr:
      'نسعى لتوصيل الطلبات في الأوقات المحددة. التوصيل العادي خلال ٢-٤ ساعات والسريع خلال ٦٠ دقيقة. قد تتأخر بعض الطلبات بسبب ظروف خارجة عن إرادتنا.',
    bodyEn:
      'We strive to deliver orders within specified timeframes. Standard delivery is 2-4 hours, express is within 60 minutes. Some orders may be delayed due to circumstances beyond our control.',
  },
  {
    titleAr: 'الإرجاع والاسترداد',
    titleEn: 'Returns and Refunds',
    bodyAr:
      'يمكن إرجاع المنتجات غير الدوائية خلال ٧ أيام بحالتها الأصلية. لا يمكن إرجاع الأدوية بعد استلامها وفقاً لأنظمة هيئة الغذاء والدواء.',
    bodyEn:
      'Non-pharmaceutical products can be returned within 7 days in their original condition. Medications cannot be returned after receipt per SFDA regulations.',
  },
  {
    titleAr: 'حدود المسؤولية',
    titleEn: 'Limitation of Liability',
    bodyAr:
      'لا تتحمل صيدلية إستروجين المسؤولية عن أي أضرار ناتجة عن سوء استخدام الأدوية أو عدم اتباع التعليمات الطبية. يجب استشارة الطبيب قبل استخدام أي دواء.',
    bodyEn:
      'Estrogen Pharmacy is not liable for any damages resulting from medication misuse or failure to follow medical instructions. Always consult your doctor before using any medication.',
  },
  {
    titleAr: 'القانون المعمول به',
    titleEn: 'Governing Law',
    bodyAr:
      'تخضع هذه الشروط لأنظمة المملكة العربية السعودية. أي نزاع ينشأ عن استخدام التطبيق يخضع للاختصاص القضائي في المملكة العربية السعودية.',
    bodyEn:
      'These terms are governed by the laws of Saudi Arabia. Any disputes arising from use of this application are subject to the jurisdiction of Saudi Arabian courts.',
  },
  {
    titleAr: 'التواصل',
    titleEn: 'Contact',
    bodyAr:
      'لأي استفسارات حول هذه الشروط، تواصلي معنا عبر: support@estrogen.sa أو الاتصال على ٩٢٠٠XXXXX.',
    bodyEn:
      'For any questions about these terms, contact us at: support@estrogen.sa or call 9200XXXXX.',
  },
];

export default function TermsScreen() {
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
        <Text style={styles.topBarTitle}>{t('termsTitle')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated */}
        <Text style={[styles.lastUpdated, { textAlign: align }]}>
          {t('termsLastUpdated')}
        </Text>

        {/* Sections */}
        {TERMS_SECTIONS.map((section, index) => (
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
          <Icon name="shieldCheck" size={18} color={Colors.primary} />
          <Text style={[styles.footerNoteText, { textAlign: align }]}>
            {isAr
              ? 'صيدلية إستروجين مرخصة من الهيئة العامة للغذاء والدواء (SFDA)'
              : 'Estrogen Pharmacy is licensed by the Saudi Food and Drug Authority (SFDA)'}
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
    marginBottom: 28,
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
