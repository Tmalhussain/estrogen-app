import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, font, space } from '@/constants/theme';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Terms & conditions" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        <Text style={styles.h1}>Terms of Service</Text>
        <Text style={styles.meta}>Last updated: May 2026</Text>

        <Text style={styles.h2}>1. About Estrogen Pharmacy</Text>
        <Text style={styles.p}>
          Estrogen Pharmacy is operated by Al-Mishari Hospital (commercial
          registration available on request). We are a licensed Saudi
          pharmacy regulated by the Saudi Food and Drug Authority (SFDA)
          and the Ministry of Health (MOH).
        </Text>

        <Text style={styles.h2}>2. Eligibility</Text>
        <Text style={styles.p}>
          You must be at least 18 years old, a Saudi resident, and have a
          valid Saudi mobile number to use this service. Some products are
          restricted to specific medical conditions and require a valid
          prescription.
        </Text>

        <Text style={styles.h2}>3. Prescription medications</Text>
        <Text style={styles.p}>
          Prescription products are dispensed only after a licensed
          pharmacist on our staff reviews and approves your prescription.
          Approval is at the pharmacist's professional discretion and may
          be declined for safety reasons. Approved prescriptions are valid
          for the period specified on the prescription itself, typically
          6–12 months.
        </Text>

        <Text style={styles.h2}>4. Orders and delivery</Text>
        <Text style={styles.p}>
          Standard delivery is 2–4 hours within Riyadh; express is within
          60 minutes. Delivery times are best efforts and may extend during
          peak hours, severe weather, or for prescription products awaiting
          pharmacist review. Orders containing controlled substances may
          require ID verification at the door.
        </Text>

        <Text style={styles.h2}>5. Payment and refunds</Text>
        <Text style={styles.p}>
          Payment is due at order placement except for cash on delivery.
          Card payments are processed through Moyasar. For safety reasons,
          medications are non-refundable once delivered. Non-medication
          items (skincare, supplements with sealed packaging) may be
          returned within 7 days for a full refund.
        </Text>

        <Text style={styles.h2}>6. Pharmacist consultations</Text>
        <Text style={styles.p}>
          Conversations with our pharmacists are advisory and don't replace
          a face-to-face medical consultation. In a medical emergency, call
          997 (Saudi Red Crescent) or go to your nearest emergency room.
        </Text>

        <Text style={styles.h2}>7. Account security</Text>
        <Text style={styles.p}>
          You are responsible for keeping your phone and account secure.
          We will never call or message you asking for the OTP we sent
          you. If you suspect unauthorized access, contact support
          immediately.
        </Text>

        <Text style={styles.h2}>8. Service changes</Text>
        <Text style={styles.p}>
          We may update prices, the product catalog, delivery zones, or
          these terms at any time. Material changes will be notified via
          push notification and email at least 7 days before they take
          effect.
        </Text>

        <Text style={styles.h2}>9. Governing law</Text>
        <Text style={styles.p}>
          These terms are governed by the laws of the Kingdom of Saudi
          Arabia. Disputes will be settled in the competent Saudi courts.
        </Text>

        <Text style={styles.h2}>10. Contact</Text>
        <Text style={styles.p}>
          Questions about these terms?{' '}
          <Text style={styles.email}>support@estrogen.sa</Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.lg },
  h1: {
    fontSize: font.size.display,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: -0.6,
  },
  meta: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: space.xs,
  },
  h2: {
    fontSize: font.size.lg,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    marginTop: space.xl,
    marginBottom: space.sm,
  },
  p: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    lineHeight: 22,
  },
  email: {
    color: colors.primary,
    fontWeight: font.weight.bold,
  },
});
