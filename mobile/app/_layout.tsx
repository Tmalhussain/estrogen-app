import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useUserDb } from '../store/userDb';
import { useOrdersStore } from '../store/ordersStore';
import { usePrescriptionsStore } from '../store/prescriptionsStore';
import { useNotificationsStore } from '../store/notificationsStore';
import CartToast from '../components/ui/CartToast';

SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Wait for a Zustand persist store to finish hydrating,
 * then run a callback. Handles three cases:
 *   1. Store has persist middleware and is already hydrated → run now.
 *   2. Store has persist middleware and is hydrating → run on finish.
 *   3. Store is a non-persisted stub (e.g. Firestore-backed
 *      compatibility layer) → run immediately.
 */
function onStoreReady(store: any, cb: () => void) {
  if (!store?.persist || typeof store.persist.hasHydrated !== 'function') {
    cb();
    return;
  }
  if (store.persist.hasHydrated()) {
    cb();
  } else {
    const unsub = store.persist.onFinishHydration(() => {
      cb();
      unsub();
    });
  }
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let hydrated = 0;
    const total = 4;

    const check = () => {
      hydrated++;
      if (hydrated >= total) {
        setReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    };

    // Seed each store only AFTER its AsyncStorage hydration completes
    onStoreReady(useUserDb, () => {
      useUserDb.getState().initSeedData();
      check();
    });
    onStoreReady(useOrdersStore, () => {
      useOrdersStore.getState().initSeedOrders();
      check();
    });
    onStoreReady(usePrescriptionsStore, () => {
      usePrescriptionsStore.getState().initSeedData();
      check();
    });
    onStoreReady(useNotificationsStore, () => {
      useNotificationsStore.getState().initSeedData();
      check();
    });
  }, []);

  if (!ready) return null; // Keep splash screen visible until all stores hydrated

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="[locale]" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
        <CartToast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
