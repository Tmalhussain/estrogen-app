import { useAuthStore } from '../store';
import { strings, type Language, type StringKeys } from './strings';

export function useTranslation() {
  const language = useAuthStore((s) => s.language);
  const isRTL = language === 'ar';

  function t(key: StringKeys): string {
    const val = strings[language]?.[key] ?? key;
    if (typeof val === 'string') return val;
    return key;
  }

  /** For nested keys like orderStatus.delivered */
  function tn(section: string, key: string): string {
    const lang = strings[language] as any;
    return lang?.[section]?.[key] ?? key;
  }

  /** Get the right field from bilingual data objects (nameAr/nameEn, etc.) */
  function localize(ar: string, en: string): string {
    return language === 'ar' ? ar : en;
  }

  /** Alignment helpers for RTL/LTR */
  const align = isRTL ? 'right' as const : 'left' as const;
  const alignOpposite = isRTL ? 'left' as const : 'right' as const;
  const flexDir = isRTL ? 'row-reverse' as const : 'row' as const;
  const flexDirReverse = isRTL ? 'row' as const : 'row-reverse' as const;

  return {
    t,
    tn,
    localize,
    language,
    isRTL,
    align,
    alignOpposite,
    flexDir,
    flexDirReverse,
  };
}

export default useTranslation;
