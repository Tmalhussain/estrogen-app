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

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 500));

    const user = authenticate(username, password);
    if (user) {
      router.push('/');
    } else {
      setError(t('invalidCredentials'));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#2D1B4E] via-[#4A2D6B] to-[#6B3FA0] p-4">
      {/* Language Toggle */}
      <button
        onClick={toggleLanguage}
        className="absolute top-6 right-6 text-white/70 hover:text-white text-sm font-medium bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 transition-all"
      >
        {language === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="w-full max-w-md">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-white/15 rounded-3xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <span className="text-4xl">💊</span>
          </div>
          <h1 className="text-2xl font-bold text-white">{t('appName')}</h1>
          <p className="text-white/60 text-sm mt-1">{t('adminPanel')}</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-3xl shadow-2xl p-8 space-y-6"
        >
          <div className="text-center">
            <h2 className="text-xl font-bold text-[var(--primary-dark)]">{t('login')}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{t('loginSubtitle')}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">{t('username')}</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent focus:bg-white transition-all"
                autoComplete="username"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[var(--text)] mb-2">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-[var(--border)] rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent focus:bg-white transition-all"
                autoComplete="current-password"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium px-4 py-3 rounded-xl text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full bg-[var(--primary)] text-white font-semibold py-3.5 rounded-xl hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? t('loggingIn') : t('loginBtn')}
          </button>
        </form>

        <p className="text-center text-white/40 text-xs mt-6">
          {t('appName')} &copy; 2026
        </p>
      </div>
    </div>
  );
}
