'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticate } from '../../lib/adminAuth';
import { useAdminLang } from '../../i18n/AdminLangContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t, toggleLanguage, language } = useAdminLang();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authenticate(username, password);
      if (result.success) {
        router.push('/');
        return;
      }

      // Translate Firebase Auth error codes into something a Saudi
      // pharmacy admin can read. Anything else falls back to the
      // generic invalid-credentials string.
      const msg = mapAuthError(result.error, language);
      setError(msg);
    } catch {
      setError(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFFFF] via-[#FBEAF1] to-[#FDF5F8] p-4">
      {/* Language toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 text-[var(--purple)] hover:text-[var(--magenta)] text-sm font-medium bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-[var(--hairline-pink)] hover:border-[var(--magenta)] transition-all"
      >
        {language === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-28 h-28 mx-auto bg-white rounded-3xl shadow-md flex items-center justify-center mb-5 border border-[var(--hairline-pink)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.jpeg"
              alt="Estrogen Pharmacy"
              className="w-24 h-24 object-contain rounded-2xl"
            />
          </div>
          <p className="text-[var(--text-secondary)] text-sm">{t('adminPanel')}</p>
        </div>

        {/* Login form card */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-3xl shadow-xl p-8 space-y-6 border border-[var(--hairline-pink)]"
        >
          <div className="text-center">
            <h2 className="text-xl font-bold text-[var(--purple)]">
              {t('login')}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t('loginSubtitle')}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">
                {t('username')}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--magenta)] focus:border-transparent focus:bg-white transition-all"
                autoComplete="username"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">
                {t('password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm bg-[var(--surface-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--magenta)] focus:border-transparent focus:bg-white transition-all"
                autoComplete="current-password"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/20 text-[var(--danger)] text-sm font-medium px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-[var(--magenta)] text-white font-semibold py-3.5 rounded-xl hover:bg-[var(--magenta-deep)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md"
          >
            {loading ? t('loggingIn') : t('loginBtn')}
          </button>

          {/* Seed-credentials hint — only shown when no admin exists yet */}
          <div className="text-center text-xs text-[var(--text-tertiary)] pt-2 border-t border-[var(--border-light)]">
            {language === 'ar'
              ? 'الدخول الأول: admin / admin'
              : 'First-time setup: admin / admin'}
          </div>
        </form>

        <p className="text-center text-[var(--text-tertiary)] text-xs mt-6">
          إستروجين · Estrogen Pharmacy &copy; 2026
        </p>
      </div>
    </div>
  );
}

// ── Error mapping ────────────────────────────────────────────────
function mapAuthError(code: string | undefined, lang: 'ar' | 'en'): string {
  const M: Record<string, { ar: string; en: string }> = {
    notAuthorized: {
      ar: 'هذا الحساب ليس لديه صلاحيات الإدارة.',
      en: 'This account does not have admin access.',
    },
    'auth/invalid-credential': {
      ar: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
      en: 'Invalid username or password.',
    },
    'auth/wrong-password': {
      ar: 'كلمة المرور غير صحيحة.',
      en: 'Wrong password.',
    },
    'auth/user-not-found': {
      ar: 'لا يوجد حساب بهذا الاسم.',
      en: 'No account found with that username.',
    },
    'auth/too-many-requests': {
      ar: 'محاولات كثيرة. حاولي بعد قليل.',
      en: 'Too many attempts. Try again later.',
    },
    'auth/network-request-failed': {
      ar: 'تعذر الاتصال بالخادم. تحققي من الإنترنت.',
      en: 'Network error. Check your connection.',
    },
    bootstrapMissingRole: {
      ar: 'تم إنشاء الحساب لكن لم يتم تعيين الصلاحيات.',
      en: 'Account created but role not assigned.',
    },
  };
  const fallback = {
    ar: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
    en: 'Invalid username or password.',
  };
  const entry = (code && M[code]) || fallback;
  return lang === 'ar' ? entry.ar : entry.en;
}
