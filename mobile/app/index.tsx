import { Redirect } from 'expo-router';
import { useAuthStore } from '../store';

export default function Index() {
  const language = useAuthStore((s) => s.language) || 'ar';
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const hasSeenWelcome = useAuthStore((s) => s.hasSeenWelcome);

  if (isLoggedIn && hasSeenWelcome) {
    return <Redirect href={`/${language}/(tabs)` as any} />;
  }
  return <Redirect href={`/${language}/(auth)` as any} />;
}
