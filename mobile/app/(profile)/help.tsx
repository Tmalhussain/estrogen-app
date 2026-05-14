import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { colors, font, radius, space } from '@/constants/theme';

const WHATSAPP_NUMBER = '+966500000000';
const PHONE_NUMBER = '+966112345678';
const SUPPORT_EMAIL = 'support@estrogen.sa';

const FAQ = [
  {
    q: 'How do I order a medication that requires a prescription?',
    a: 'Tap the locked product, then "Upload prescription". A pharmacist reviews each upload (typically within 30 minutes during working hours). Once approved, the product unlocks and you can order it like any other item.',
  },
  {
    q: 'When will my order arrive?',
    a: 'Standard delivery is 2–4 hours in Riyadh. Express delivery is within 60 minutes for an extra 20 SAR. You\'ll get a notification when your driver leaves and can track them on the order page.',
  },
  {
    q: 'Is the packaging discreet?',
    a: 'Yes. Every order ships in a plain outer package with no medication names visible. The driver doesn\'t see the contents either.',
  },
  {
    q: 'How do I know a medication is safe during pregnancy?',
    a: 'Products with a green "Pregnancy-safe" badge have been reviewed by our pharmacists. If you\'re unsure, tap "Chat with a pharmacist" and a licensed pharmacist will answer within minutes.',
  },
  {
    q: 'Can I return a medication?',
    a: 'For safety reasons, medications cannot be returned once delivered. Non-medication items (skincare, supplements with sealed packaging) can be returned within 7 days.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Mada, Visa, Mastercard, STC Pay, Apple Pay, and cash on delivery. All card details are tokenized through Moyasar — we never store your raw card number.',
  },
];

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Help center" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        <Text style={styles.sectionTitle}>Talk to us</Text>
        <View style={{ gap: space.sm }}>
          <ContactRow
            icon="logo-whatsapp"
            tint="#25D366"
            title="WhatsApp"
            subtitle="Fastest reply, 8am–midnight"
            onPress={() =>
              Linking.openURL(
                `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, '')}?text=${encodeURIComponent(
                  "Hi Estrogen Pharmacy, I have a question about"
                )}`
              )
            }
          />
          <ContactRow
            icon="call-outline"
            tint={colors.primary}
            title="Call us"
            subtitle={PHONE_NUMBER}
            onPress={() => Linking.openURL(`tel:${PHONE_NUMBER}`)}
          />
          <ContactRow
            icon="mail-outline"
            tint={colors.accent}
            title="Email"
            subtitle={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
        </View>

        <View style={styles.hours}>
          <Ionicons name="time-outline" size={16} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hoursTitle}>Working hours</Text>
            <Text style={styles.hoursLine}>Saturday – Thursday: 8 AM – 12 AM</Text>
            <Text style={styles.hoursLine}>Friday: 4 PM – 12 AM</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: space.xl }]}>FAQ</Text>
        {FAQ.map((item, i) => (
          <Pressable
            key={i}
            onPress={() => setOpen(open === i ? null : i)}
            style={styles.faq}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ}>{item.q}</Text>
              <Ionicons
                name={open === i ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </View>
            {open === i ? <Text style={styles.faqA}>{item.a}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function ContactRow({
  icon,
  tint,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.contactRow, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.contactIcon, { backgroundColor: tint + '22' }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.lg, paddingTop: space.lg },
  sectionTitle: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: space.sm,
    marginLeft: space.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  contactSubtitle: {
    fontSize: font.size.xs,
    color: colors.textSoft,
    marginTop: 2,
  },
  hours: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.sm,
    marginTop: space.lg,
    padding: space.md,
    backgroundColor: colors.bgAlt,
    borderRadius: radius.lg,
  },
  hoursTitle: {
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.bold,
  },
  hoursLine: {
    fontSize: font.size.xs,
    color: colors.textSoft,
    marginTop: 2,
  },
  faq: {
    padding: space.md,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.sm,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
  },
  faqQ: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.text,
    fontWeight: font.weight.bold,
    lineHeight: 22,
  },
  faqA: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    marginTop: space.sm,
    lineHeight: 22,
  },
});
