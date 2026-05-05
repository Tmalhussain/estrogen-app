/**
 * Locale-aware router hook.
 * Wraps expo-router with locale prefix support.
 * All navigation paths are prefixed with /{locale}/.
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../store';

export function useLocaleRouter() {
  const params = useLocalSearchParams<{ locale?: string }>();
  const language = useAuthStore((s) => s.language);
  const locale = params.locale || language || 'ar';

  const push = (path: string, extraParams?: Record<string, string>) => {
    const fullPath = `/${locale}${path}`;
    if (extraParams) {
      router.push({ pathname: fullPath as any, params: extraParams });
    } else {
      router.push(fullPath as any);
    }
  };

  const replace = (path: string) => {
    router.replace(`/${locale}${path}` as any);
  };

  const back = () => {
    router.back();
  };

  const switchLocale = (newLocale: 'ar' | 'en') => {
    const setLanguage = useAuthStore.getState().setLanguage;
    setLanguage(newLocale);
    router.replace(`/${newLocale}/(tabs)` as any);
  };

  return { push, replace, back, switchLocale, locale };
}
