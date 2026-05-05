'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminLang } from '../i18n/AdminLangContext';
import { getSession, clearSession } from '../lib/adminAuth';
import type { AdminStringKeys } from '../i18n/strings';

interface NavItem {
  href: string;
  labelKey: AdminStringKeys;
  icon: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/', labelKey: 'dashboard', icon: '📊' },
  { href: '/orders', labelKey: 'orders', icon: '📦', badge: 2 },
  { href: '/prescriptions', labelKey: 'prescriptions', icon: '📋', badge: 2 },
  { href: '/products', labelKey: 'products', icon: '💊' },
  { href: '/customers', labelKey: 'customers', icon: '👥' },
  { href: '/settings', labelKey: 'settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, language, toggleLanguage } = useAdminLang();
  const session = getSession();

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-[var(--primary-dark)] min-h-screen flex flex-col text-white">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold text-white">{t('appName')}</h1>
        <p className="text-xs text-white/60 mt-1">{t('adminPanel')}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/15 text-white shadow-lg'
                      : 'text-white/70 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-[var(--accent)] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {/* Language Toggle */}
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/8 hover:text-white transition-all"
        >
          <span className="text-lg">🌐</span>
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all"
        >
          <span className="text-lg">🚪</span>
          <span>{t('logout')}</span>
        </button>

        {/* User */}
        <div className="flex items-center gap-3 px-4 py-3 mt-2">
          <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center text-sm font-bold">
            {session?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{session?.name ?? 'Admin'}</p>
            <p className="text-xs text-white/50 truncate" dir="ltr">@{session?.username ?? 'admin'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
