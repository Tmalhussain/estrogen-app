import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
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
    // explicit fontFamily. Override the base RN-Web Text class so unstyled
    // body copy picks up DM Sans. Headings already set DMSans_700Bold via
    // their own atomic class and win on later source order; Ionicons set
    // font-family inline and inline always wins. Native (iOS/Android) is
    // unaffected.
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const id = 'estrogen-base-font';
      if (!document.getElementById(id)) {
        const style = document.createElement('style');
        style.id = id;
        // RN-Web's atomic stylesheet sets `font-family: -apple-system` on
        // every Text via `.css-146c3p1`. Headings, Ionicons glyphs, and
        // anything else with an explicit `fontFamily` style get an
        // additional atomic class like `.r-qjfcrk` (DMSans_700Bold) at the
        // same specificity — those win on source order.
        //
        // To set a body-text default of DMSans_400Regular without clobbering
        // those explicit classes, we discover at runtime which atomic class
        // hashes encode an explicit font-family and exempt them via
        // :not(.<hash>) selectors. This is robust against RN-Web changing
        // its hash algorithm — we read the live stylesheet.
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
        style.textContent = `
          .css-146c3p1${notSel}, .css-11aywtz${notSel} {
            font-family: 'DMSans_400Regular', -apple-system, BlinkMacSystemFont,
              'Segoe UI', Roboto, sans-serif;
          }
        `;
        document.head.appendChild(style);
        document.head.appendChild(style);
      }
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade_from_bottom',
            }}
          >
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
          </Stack>
        </CartProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
