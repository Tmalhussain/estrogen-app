'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { adminStrings, type AdminLanguage, type AdminStringKeys } from './strings';

interface AdminLangContextType {
  language: AdminLanguage;
  isRTL: boolean;
  t: (key: AdminStringKeys) => string;
  toggleLanguage: () => void;
  setLanguage: (lang: AdminLanguage) => void;
}

const AdminLangContext = createContext<AdminLangContextType | null>(null);

export function AdminLangProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin-lang') as AdminLanguage | null;
    if (saved === 'ar' || saved === 'en') {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('admin-lang', language);
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language, mounted]);

  const isRTL = language === 'ar';

  function t(key: AdminStringKeys): string {
    return adminStrings[language]?.[key] ?? key;
  }

  function toggleLanguage() {
    setLanguageState((prev) => (prev === 'ar' ? 'en' : 'ar'));
  }

  function setLanguage(lang: AdminLanguage) {
    setLanguageState(lang);
  }

  // Prevent hydration mismatch: render nothing until mounted
  if (!mounted) {
    return null;
  }

  return (
    <AdminLangContext.Provider value={{ language, isRTL, t, toggleLanguage, setLanguage }}>
      {children}
    </AdminLangContext.Provider>
  );
}

export function useAdminLang() {
  const ctx = useContext(AdminLangContext);
  if (!ctx) throw new Error('useAdminLang must be used within AdminLangProvider');
  return ctx;
}
