import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, font, space } from '@/constants/theme';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Privacy & data" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        <Text style={styles.h1}>Privacy Policy</Text>
        <Text style={styles.meta}>Last updated: May 2026</Text>

        <Text style={styles.h2}>What we collect</Text>
        <Text style={styles.p}>
          We collect the minimum information needed to deliver your medication
          safely: your phone number, name, delivery address, payment method
          details (tokenized through Moyasar), and any prescription you
          upload. With your permission we also save medical context you
          enter on your medical profile (allergies, chronic conditions) so
          our pharmacists can flag interactions before they happen.
        </Text>

        <Text style={styles.h2}>How we use it</Text>
        <Text style={styles.p}>
          Personal data is used solely to fulfill your order, contact you
          about it, comply with regulatory requirements (SFDA, MOH), and
          improve the service. Your medical profile is visible only to
          licensed pharmacists on our staff during a review of your order.
        </Text>

        <Text style={styles.h2}>Saudi PDPL compliance</Text>
        <Text style={styles.p}>
          We comply with the Saudi Personal Data Protection Law (PDPL).
          You have the right to access, correct, delete, or export your
          personal data at any time. Email
          <Text style={styles.email}> privacy@estrogen.sa </Text>
          to exercise these rights and we'll respond within 7 days.
        </Text>

        <Text style={styles.h2}>Who we share with</Text>
        <Text style={styles.p}>
          Order details are shared with your assigned delivery driver
          (name, phone, address, NOT the medication contents). Card details
          are tokenized through Moyasar; we never store your raw card
          number. We never sell your data.
        </Text>

        <Text style={styles.h2}>Retention</Text>
        <Text style={styles.p}>
          Order records are retained for 7 years per SFDA pharmacy
          regulations. Your medical profile and prescriptions are retained
          while your account is active and for 1 year after closure, then
          permanently deleted.
        </Text>

        <Text style={styles.h2}>End-to-end encryption</Text>
        <Text style={styles.p}>
          Conversations with our pharmacists are end-to-end encrypted
          (your device generates a key pair on first launch; only the
          intended pharmacist's device can read your messages). Keys are
          stored in your phone's secure enclave and never leave the device
          in plaintext.
        </Text>

        <Text style={styles.h2}>Contact</Text>
        <Text style={styles.p}>
          For any privacy concern, email{' '}
          <Text style={styles.email}>privacy@estrogen.sa</Text>. For data
          subject requests, also include a copy of your national ID for
          identity verification.
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
