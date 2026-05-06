import { useEffect } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
} from '@expo-google-fonts/tajawal';
import { CartProvider } from '@/hooks/useCart';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
  });

  useEffect(() => {
    if (!loaded) return;
    SplashScreen.hideAsync().catch(() => {});

    // Web fallback: RN-Web sets -apple-system on every Text that lacks an
    // explicit fontFamily. Discover atomic class hashes that encode an
    // explicit fontFamily (DMSans / Tajawal / ionicons) and exempt them so
    // headings stay bold and icons keep their glyph font; everything else
    // picks up DMSans_400Regular. Native is unaffected.
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const id = 'estrogen-base-font';
      if (!document.getElementById(id)) {
        const exempt = new Set<string>();
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules)) {
              const r = rule as CSSStyleRule;
              if (!r.selectorText) continue;
              const ff = r.style?.fontFamily || '';
              if (
                ff.includes('DMSans') ||
                ff.includes('Tajawal') ||
                ff.includes('ionicons')
              ) {
                const m = r.selectorText.match(/\.(r-[A-Za-z0-9_-]+)/);
                if (m) exempt.add(m[1]);
              }
            }
          } catch {
            // Cross-origin stylesheet — skip silently.
          }
        }
        const notSel = [...exempt].map((c) => `:not(.${c})`).join('');
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
          .css-146c3p1${notSel}, .css-11aywtz${notSel} {
            font-family: 'DMSans_400Regular', -apple-system, BlinkMacSystemFont,
              'Segoe UI', Roboto, sans-serif;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CartProvider>
            <StatusBar style="dark" />
            <RootStack />
          </CartProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Inner stack so we can read auth state and decide where to send the user.
 *
 * - While auth is loading (token check on first launch) we show a tiny
 *   spinner and don't navigate.
 * - Signed-out users on a (tabs)/protected route get bounced to /(auth)/login.
 * - Signed-in users sitting on /(auth)/* get bounced into /(tabs).
 */
function RootStack() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    const inAuthGroup = segments[0] === '(auth)';
    if (status === 'signed-out' && !inAuthGroup) {
      router.replace('/(auth)/phone');
    } else if (status === 'signed-in' && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [status, segments, router]);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="product/[id]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="checkout"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="order/[id]"
        options={{ presentation: 'card', animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="scan"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          contentStyle: { backgroundColor: '#000' },
        }}
      />
    </Stack>
  );
}
