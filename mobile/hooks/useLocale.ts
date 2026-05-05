import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../store';

/**
 * Returns the current locale, using the URL param if available,
 * falling back to the auth store language (which is always set).
 */
export function useLocale(): string {
  const { locale } = useLocalSearchParams<{ locale: string }>();
  const language = useAuthStore((s) => s.language);
  return locale || language || 'ar';
}
