import { useEffect } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { I18nManager, Platform } from 'react-native';
import { useAuthStore } from '../../store';
import { Colors } from '../../constants/colors';
import type { Language } from '../../i18n/strings';

export default function LocaleLayout() {
  const { locale } = useLocalSearchParams<{ locale: string }>();
  const setLanguage = useAuthStore((s) => s.setLanguage);
  const language = useAuthStore((s) => s.language);

  // Sync the URL locale into the auth store
  useEffect(() => {
    const lang = (locale === 'en' ? 'en' : 'ar') as Language;
    if (language !== lang) {
      setLanguage(lang);
    }
  }, [locale]);

  // Sync RTL/LTR direction based on locale
  const isRTL = locale === 'ar';

  useEffect(() => {
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
      I18nManager.allowRTL(isRTL);
    }
    if (Platform.OS === 'web') {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = locale === 'en' ? 'en' : 'ar';
    }
  }, [isRTL, locale]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="cart" options={{ presentation: 'modal' }} />
      <Stack.Screen name="checkout" options={{ presentation: 'card' }} />
      <Stack.Screen name="order/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="profile/personal" options={{ presentation: 'card' }} />
      <Stack.Screen name="profile/medical" options={{ presentation: 'card' }} />
      <Stack.Screen name="profile/addresses" options={{ presentation: 'card' }} />
      <Stack.Screen name="notifications" options={{ presentation: 'card' }} />
      <Stack.Screen name="help" options={{ presentation: 'card' }} />
      <Stack.Screen name="search" options={{ presentation: 'modal' }} />
      <Stack.Screen name="terms" options={{ presentation: 'card' }} />
      <Stack.Screen name="privacy" options={{ presentation: 'card' }} />
      <Stack.Screen name="forgot-password" options={{ presentation: 'card' }} />
    </Stack>
  );
}
