import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Icon, type IconName } from '../../components/ui/Icon';
import { useTranslation } from '../../i18n/useTranslation';
import { showAlert } from '../../utils/alert';

interface FAQ {
  id: string;
  questionKey: string;
  answerKey: string;
}

const faqs: FAQ[] = [
  { id: '1', questionKey: 'faqPrescriptionQ', answerKey: 'faqPrescriptionA' },
  { id: '2', questionKey: 'faqDeliveryQ', answerKey: 'faqDeliveryA' },
  { id: '3', questionKey: 'faqPackagingQ', answerKey: 'faqPackagingA' },
  { id: '4', questionKey: 'faqReturnQ', answerKey: 'faqReturnA' },
  { id: '5', questionKey: 'faqPregnancyQ', answerKey: 'faqPregnancyA' },
  { id: '6', questionKey: 'faqPaymentQ', answerKey: 'faqPaymentA' },
  { id: '7', questionKey: 'faqTrackQ', answerKey: 'faqTrackA' },
];

interface ContactOption {
  id: string;
  icon: IconName;
  labelKey: string;
  subtitleKey: string;
  color: string;
  action: () => void;
}

export default function HelpScreen() {
  const { t, flexDir, align, isRTL } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const contactOptions: ContactOption[] = [
    {
      id: 'whatsapp',
      icon: 'whatsapp',
      labelKey: 'whatsapp',
      subtitleKey: 'whatsappNumber',
      color: '#25D366',
      action: () => showAlert(t('whatsapp'), t('comingSoon')),
    },
    {
      id: 'call',
      icon: 'phone',
      labelKey: 'callUs',
      subtitleKey: 'callNumber',
      color: Colors.primary,
      action: () => showAlert(t('callUs'), t('comingSoon')),
    },
    {
      id: 'email',
      icon: 'mail',
      labelKey: 'emailUs',
      subtitleKey: 'supportEmail',
      color: Colors.primaryDark,
      action: () => Linking.openURL('mailto:support@estrogen.sa'),
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.topBar, { flexDirection: flexDir }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Icon name={isRTL ? 'forward' : 'back'} size={22} color={Colors.primaryDark} />
        </TouchableOpacity>
        <Text style={[styles.title, { textAlign: align }]}>{t('helpCenterTitle')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Contact Cards */}
        <Text style={[styles.sectionTitle, { textAlign: align }]}>
          {t('contactUsTitle')}
        </Text>
        <View style={[styles.contactGrid, { flexDirection: flexDir }]}>
          {contactOptions.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              style={styles.contactCard}
              activeOpacity={0.7}
              onPress={opt.action}
            >
              <View
                style={[styles.contactIconWrap, { backgroundColor: opt.color + '14' }]}
              >
                <Icon name={opt.icon} size={24} color={opt.color} />
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={styles.contactLabel}
              >
                {t(opt.labelKey as any)}
              </Text>
              <Text numberOfLines={1} style={styles.contactSubtitle}>
                {t(opt.subtitleKey as any)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Working Hours */}
        <View style={[styles.hoursCard, { flexDirection: flexDir }]}>
          <View style={styles.hoursIconWrap}>
            <Icon name="clock" size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.hoursTitle, { textAlign: align }]}>
              {t('workingHours')}
            </Text>
            <Text style={[styles.hoursDetail, { textAlign: align }]}>
              {t('workingHoursWeekday')}
            </Text>
            <Text style={[styles.hoursDetail, { textAlign: align }]}>
              {t('workingHoursFriday')}
            </Text>
          </View>
        </View>

        {/* FAQ Section */}
        <Text style={[styles.sectionTitle, { textAlign: align, marginTop: 28 }]}>
          {t('faq')}
        </Text>
        {faqs.map((faq) => {
          const isExpanded = expandedId === faq.id;
          return (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqCard}
              onPress={() => setExpandedId(isExpanded ? null : faq.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.faqHeader, { flexDirection: flexDir }]}>
                <Text style={[styles.faqQuestion, { textAlign: align }]}>
                  {t(faq.questionKey as any)}
                </Text>
                <Icon
                  name={isExpanded ? 'chevronUp' : 'chevronDown'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </View>
              {isExpanded && (
                <Text style={[styles.faqAnswer, { textAlign: align }]}>
                  {t(faq.answerKey as any)}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Support CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaText}>{t('faqNotFound')}</Text>
          <TouchableOpacity
            style={[styles.ctaButton, { flexDirection: flexDir }]}
            activeOpacity={0.8}
            onPress={() => showAlert(t('chatWithSupport'), t('comingSoon'))}
          >
            <Icon name="chat" size={18} color={Colors.white} />
            <Text style={styles.ctaButtonText}>{t('chatWithSupport')}</Text>
          </TouchableOpacity>
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
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  contactGrid: {
    gap: 10,
    marginBottom: 20,
  },
  contactCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  contactSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  hoursCard: {
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    alignItems: 'flex-start',
  },
  hoursIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoursTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  hoursDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  faqHeader: {
    alignItems: 'center',
    gap: 10,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  ctaSection: {
    alignItems: 'center',
    marginTop: 28,
    gap: 14,
  },
  ctaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ctaButton: {
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 28,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 15,
    color: Colors.white,
    fontWeight: '700',
  },
});
