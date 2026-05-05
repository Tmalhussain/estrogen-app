'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { fetchCustomers, type DashboardCustomer } from '../../data/mock';
import { useAdminLang } from '../../i18n/AdminLangContext';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<DashboardCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, isRTL } = useAdminLang();
  const textAlign = isRTL ? 'text-right' : 'text-left';

  useEffect(() => {
    fetchCustomers().then(setCustomers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter(c => {
    if (!searchQuery) return true;
    return c.name.includes(searchQuery) || c.phone.includes(searchQuery) || c.email.includes(searchQuery);
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className={`text-2xl font-bold text-[var(--primary-dark)] ${textAlign}`}>{t('customersManagement')}</h1>
          <p className={`text-sm text-[var(--text-secondary)] mt-1 ${textAlign}`}>{customers.length} {t('registeredCustomers')}</p>
        </div>
        <div className="mb-6">
          <input type="text" placeholder={t('searchCustomerPlaceholder')} value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full max-w-md px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${textAlign}`} />
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-[var(--border)]">
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('customer')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('phone')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('email')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('ordersCount')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('totalSpent')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('joinDate')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[var(--primary-soft)] flex items-center justify-center text-sm font-bold text-[var(--primary)]">{c.name.charAt(0)}</div>
                      <span className={`text-sm font-medium ${textAlign}`}>{c.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm font-mono text-[var(--text-secondary)]">{c.phone}</td>
                  <td className="p-4 text-sm text-[var(--text-secondary)]">{c.email}</td>
                  <td className="p-4"><span className="text-sm font-semibold text-[var(--primary)]">{c.ordersCount}</span></td>
                  <td className="p-4 text-sm font-semibold">{c.totalSpent.toFixed(2)} {t('sar')}</td>
                  <td className="p-4 text-sm text-[var(--text-secondary)]">{c.joinedDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-12 text-center"><p className="text-[var(--text-secondary)]">{isRTL ? 'لا يوجد عملاء' : 'No customers'}</p></div>}
        </div>
      </div>
    </DashboardLayout>
  );
}
