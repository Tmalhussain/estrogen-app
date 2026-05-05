'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAdminLang } from '../../i18n/AdminLangContext';
import { listAdmins, createAdmin, getSession } from '../../lib/adminAuth';

export default function SettingsPage() {
  const { t, language, isRTL, toggleLanguage } = useAdminLang();
  const [admins, setAdmins] = useState<ReturnType<typeof listAdmins>>([]);
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [creating, setCreating] = useState(false);
  const session = getSession();
  const textAlign = isRTL ? 'text-right' : 'text-left';

  useEffect(() => {
    setAdmins(listAdmins());
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setMessage(t('fillAllFields'));
      setMessageType('error');
      return;
    }

    setCreating(true);
    await new Promise((r) => setTimeout(r, 400));

    const result = createAdmin(newUsername.trim(), newPassword, newName.trim());
    if (result.success) {
      setMessage(t('adminCreated'));
      setMessageType('success');
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setAdmins(listAdmins());
    } else {
      setMessage(t(result.error as any) || result.error || '');
      setMessageType('error');
    }
    setCreating(false);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className={`text-2xl font-bold text-[var(--primary-dark)] ${textAlign}`}>{t('accountSettings')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Existing Admins */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6">
            <h2 className={`text-lg font-bold text-[var(--text)] mb-6 ${textAlign}`}>{t('adminAccounts')}</h2>
            <div className="space-y-3">
              {admins.map((admin) => (
                <div
                  key={admin.username}
                  className={`flex items-center gap-4 p-4 bg-gray-50 rounded-xl ${isRTL ? 'flex-row' : 'flex-row'}`}
                >
                  <div className="w-10 h-10 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-sm font-bold text-[var(--primary)]">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold text-[var(--text)] ${textAlign}`}>{admin.name}</p>
                    <p className={`text-xs text-[var(--text-secondary)] ${textAlign}`} dir="ltr">@{admin.username}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                    admin.role === 'super_admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {admin.role === 'super_admin' ? t('superAdmin') : t('admin')}
                  </span>
                  {session?.username === admin.username && (
                    <span className="text-xs text-green-600 font-medium">●</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Create New Admin */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6">
            <h2 className={`text-lg font-bold text-[var(--text)] mb-6 ${textAlign}`}>{t('createNewAdmin')}</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold text-[var(--text)] mb-1.5 ${textAlign}`}>{t('adminName')}</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`w-full px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${textAlign}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold text-[var(--text)] mb-1.5 ${textAlign}`}>{t('adminUsername')}</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  dir="ltr"
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold text-[var(--text)] mb-1.5 ${textAlign}`}>{t('adminPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                  dir="ltr"
                />
              </div>

              {message && (
                <div className={`text-sm font-medium px-4 py-3 rounded-xl text-center ${
                  messageType === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-[var(--primary)] text-white font-semibold py-3 rounded-xl hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 text-sm"
              >
                {creating ? t('creating') : t('createAccount')}
              </button>
            </form>
          </div>
        </div>

        {/* Language Setting */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6 max-w-md">
          <h2 className={`text-lg font-bold text-[var(--text)] mb-4 ${textAlign}`}>{t('language')}</h2>
          <div className="flex gap-3">
            <button
              onClick={() => language !== 'ar' && toggleLanguage()}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                language === 'ar'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200'
              }`}
            >
              {t('languageAr')}
            </button>
            <button
              onClick={() => language !== 'en' && toggleLanguage()}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                language === 'en'
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200'
              }`}
            >
              {t('languageEn')}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
