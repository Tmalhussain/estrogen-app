'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { fetchPrescriptions, updatePrescriptionStatus, rxStatusLabels, type DashboardPrescription } from '../../data/mock';
import { useAdminLang } from '../../i18n/AdminLangContext';

export default function PrescriptionsPage() {
  const [filter, setFilter] = useState('all');
  const [prescriptions, setPrescriptions] = useState<DashboardPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, isRTL } = useAdminLang();
  const textAlign = isRTL ? 'text-right' : 'text-left';

  useEffect(() => {
    fetchPrescriptions().then(setPrescriptions).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = prescriptions.filter(rx => filter === 'all' || rx.status === filter);

  const handleApprove = async (id: string) => {
    try {
      await updatePrescriptionStatus(id, 'approved');
      setPrescriptions(prev => prev.map(rx => rx.id === id ? { ...rx, status: 'approved' } : rx));
    } catch (err) { console.error(err); }
  };

  const handleReject = async (id: string) => {
    try {
      await updatePrescriptionStatus(id, 'rejected');
      setPrescriptions(prev => prev.map(rx => rx.id === id ? { ...rx, status: 'rejected' } : rx));
    } catch (err) { console.error(err); }
  };

  const pendingCount = prescriptions.filter(rx => rx.status === 'pending_review').length;

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-2xl font-bold text-[var(--primary-dark)] ${textAlign}`}>{t('prescriptionsManagement')}</h1>
            <p className={`text-sm text-[var(--text-secondary)] mt-1 ${textAlign}`}>
              {prescriptions.length} {t('rxCountSummary')} · {pendingCount} {t('pendingReview')}
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-white text-sm font-bold px-4 py-2 rounded-xl animate-pulse">
              {pendingCount} {t('rxNeedReviewBanner')}
            </span>
          )}
        </div>

        <div className="flex gap-2 mb-6">
          {['all', 'pending_review', 'approved', 'rejected', 'expired'].map((s) => {
            const label = s === 'all' ? t('all') : (isRTL ? rxStatusLabels[s]?.ar : rxStatusLabels[s]?.en) ?? s;
            const count = s === 'all' ? prescriptions.length : prescriptions.filter(rx => rx.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  filter === s ? 'bg-[var(--primary)] text-white' : 'bg-white text-[var(--text-secondary)] border border-[var(--border)] hover:bg-gray-50'
                }`}>
                {label} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rx) => {
            const status = rxStatusLabels[rx.status] || { ar: rx.status, en: rx.status, color: '#6B7280', bg: '#F3F4F6' };
            const statusLabel = isRTL ? status.ar : status.en;
            const isPending = rx.status === 'pending_review';
            return (
              <div key={rx.id} className={`bg-white rounded-2xl shadow-sm border p-6 transition-all ${isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-[var(--border)]'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-mono font-semibold text-[var(--primary)]">{rx.id.slice(0, 12)}</span>
                  <StatusBadge label={statusLabel} color={status.color} bg={status.bg} />
                </div>
                <div className="w-full h-32 bg-gray-100 rounded-xl mb-4 flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <span className="text-3xl">📄</span>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{rx.fileName}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">{t('patient')}</span>
                    <span className="text-sm font-medium">{rx.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">{t('phone')}</span>
                    <span className="text-sm font-mono">{rx.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">{t('date')}</span>
                    <span className="text-sm">{rx.date}</span>
                  </div>
                  {rx.linkedOrderId && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">{t('order')}</span>
                      <span className="text-sm font-mono text-[var(--primary)]">{rx.linkedOrderId}</span>
                    </div>
                  )}
                </div>
                {isPending && (
                  <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                    <button onClick={() => handleApprove(rx.id)} className="flex-1 bg-green-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-green-700 transition-colors">{t('approve')}</button>
                    <button onClick={() => handleReject(rx.id)} className="flex-1 bg-red-500 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors">{t('reject')}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-[var(--border)]">
            <p className="text-[var(--text-secondary)]">{t('noRxInCategory')}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
