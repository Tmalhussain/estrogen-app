import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/hooks/useAuth';
import { api, ApiError } from '@/lib/api';
import { fingerprintPublicKey, getOrCreateChatKeypair } from '@/lib/crypto';
import { colors, font, radius, shadow, space } from '@/constants/theme';

const PHARMACIST_WHATSAPP = '+966500000000'; // Placeholder pharmacy WA line.

type DeviceState =
  | { kind: 'loading' }
  | { kind: 'ready'; publicKey: string; alreadyRegistered: boolean }
  | { kind: 'error'; message: string };

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [device, setDevice] = useState<DeviceState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const kp = await getOrCreateChatKeypair();
        if (!token) {
          if (!cancelled)
            setDevice({
              kind: 'ready',
              publicKey: kp.publicKey,
              alreadyRegistered: false,
            });
          return;
        }
        const res = await api.publishChatDevice(token, {
          publicKey: kp.publicKey,
          deviceLabel: Platform.OS === 'web' ? 'Web' : Platform.OS === 'ios' ? 'iPhone' : 'Android',
        });
        if (!cancelled)
          setDevice({
            kind: 'ready',
            publicKey: kp.publicKey,
            alreadyRegistered: res.alreadyRegistered,
          });
      } catch (err) {
        if (!cancelled)
          setDevice({
            kind: 'error',
            message: err instanceof ApiError ? err.code : 'unexpected_error',
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const openWhatsApp = async () => {
    const url = `https://wa.me/${PHARMACIST_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(
      'Hi, I have a question about my Estrogen Pharmacy order.'
    )}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('WhatsApp not available', 'Please install WhatsApp or call us instead.');
      return;
    }
    Linking.openURL(url);
  };

  const callPharmacy = () => {
    Linking.openURL(`tel:${PHARMACIST_WHATSAPP}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Chat with a pharmacist" />
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingBottom: insets.bottom + space.xxl },
        ]}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="lock-closed" size={22} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>End-to-end encrypted</Text>
          <Text style={styles.heroBody}>
            Conversations with our pharmacists are encrypted on your device
            before they leave it. Only the pharmacist you're chatting with
            can read them — not us, not anyone in between.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Your device key</Text>
        <View style={styles.keyCard}>
          {device.kind === 'loading' ? (
            <ActivityIndicator color={colors.primary} />
          ) : device.kind === 'error' ? (
            <Text style={styles.errorText}>
              We couldn't register this device's encryption key. Tap below to
              reach a pharmacist on WhatsApp while we sort it out.
            </Text>
          ) : (
            <>
              <Text style={styles.fingerprint}>
                {fingerprintPublicKey(device.publicKey)}
              </Text>
              <Text style={styles.fingerprintHint}>
                {device.alreadyRegistered
                  ? 'This device is already registered for secure chat.'
                  : 'New device registered. Your private key never leaves this phone.'}
              </Text>
            </>
          )}
        </View>

        <View style={styles.fallbackBlock}>
          <Text style={styles.sectionLabel}>Today, talk to us on</Text>
          <Text style={styles.fallbackBody}>
            Our in-app secure chat goes live this month. In the meantime,
            our pharmacists answer over WhatsApp from 7am to 11pm daily.
          </Text>

          <Pressable
            onPress={openWhatsApp}
            style={({ pressed }) => [
              styles.cta,
              styles.ctaWhatsapp,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityLabel="Chat with a pharmacist on WhatsApp"
          >
            <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
            <Text style={styles.ctaLabel}>Chat on WhatsApp</Text>
          </Pressable>

          <Pressable
            onPress={callPharmacy}
            style={({ pressed }) => [
              styles.cta,
              styles.ctaCall,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityLabel="Call the pharmacy"
          >
            <Ionicons name="call" size={20} color={colors.primary} />
            <Text style={[styles.ctaLabel, { color: colors.primary }]}>
              Call the pharmacy
            </Text>
          </Pressable>
        </View>

        <View style={styles.note}>
          <Ionicons name="information-circle" size={16} color={colors.textMuted} />
          <Text style={styles.noteText}>
            For medical emergencies, call 997 (Saudi Red Crescent).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  heroCard: {
    backgroundColor: colors.primaryDim,
    padding: space.xl,
    borderRadius: radius.xl,
    alignItems: 'flex-start',
    ...shadow.card,
  },
  heroIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  heroTitle: {
    fontSize: font.size.xl,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    marginBottom: space.xs,
  },
  heroBody: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    lineHeight: 20,
  },
  sectionLabel: {
    marginTop: space.xl,
    marginBottom: space.sm,
    fontSize: font.size.xs,
    color: colors.textMuted,
    fontFamily: font.family.semi,
    fontWeight: font.weight.semi,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  keyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    padding: space.lg,
    minHeight: 76,
    justifyContent: 'center',
  },
  fingerprint: {
    fontSize: font.size.lg,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    letterSpacing: 1.2,
    fontVariant: ['tabular-nums'],
  },
  fingerprintHint: {
    marginTop: space.xs,
    fontSize: font.size.xs,
    color: colors.textMuted,
  },
  errorText: {
    fontSize: font.size.sm,
    color: colors.danger,
    lineHeight: 20,
  },
  fallbackBlock: {
    marginTop: space.md,
  },
  fallbackBody: {
    fontSize: font.size.sm,
    color: colors.textSoft,
    lineHeight: 20,
    marginBottom: space.md,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    height: 52,
    borderRadius: radius.lg,
    marginTop: space.sm,
  },
  ctaWhatsapp: {
    backgroundColor: '#25D366',
  },
  ctaCall: {
    backgroundColor: colors.primaryDim,
  },
  ctaLabel: {
    fontSize: font.size.md,
    color: '#FFFFFF',
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.xl,
    paddingHorizontal: space.sm,
  },
  noteText: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    flex: 1,
  },
});
