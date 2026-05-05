'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatusBadge from '../../components/StatusBadge';
import { fetchOrders, updateOrderStatus, orderStatusLabels, type DashboardOrder } from '../../data/mock';
import { useAdminLang } from '../../i18n/AdminLangContext';

const statusFilters = ['all', 'placed', 'pending_review', 'pharmacist_review', 'approved', 'packing', 'out_for_delivery', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, isRTL } = useAdminLang();
  const textAlign = isRTL ? 'text-right' : 'text-left';

  // Fetch orders from Firestore
  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await fetchOrders();
        setOrders(data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filtered = orders.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false;
    if (searchQuery && !o.id.includes(searchQuery) && !o.customerName.includes(searchQuery)) return false;
    return true;
  });

  const handleView = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const status = orderStatusLabels[order.status] || { ar: order.status, en: order.status };
      alert(`${t('orderNumber')}: ${order.id}\n${t('customer')}: ${order.customerName}\n${t('total')}: ${order.total.toFixed(2)} ${t('sar')}\n${t('status')}: ${isRTL ? status.ar : status.en}`);
    }
  };

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
            <h1 className={`text-2xl font-bold text-[var(--primary-dark)] ${textAlign}`}>{t('ordersManagement')}</h1>
            <p className={`text-sm text-[var(--text-secondary)] mt-1 ${textAlign}`}>{orders.length} {t('orderWord')}</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder={t('searchOrderPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`flex-1 min-w-[200px] px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${textAlign}`}
            />
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((s) => {
                const label = s === 'all' ? t('all') : (isRTL ? orderStatusLabels[s]?.ar : orderStatusLabels[s]?.en) ?? s;
                return (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      filter === s
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-[var(--border)]">
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('orderNumber')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('customer')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('date')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('productsCol')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('payment')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('total')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('status')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const status = orderStatusLabels[order.status] || { ar: order.status, en: order.status, color: '#6B7280', bg: '#F3F4F6' };
                const statusLabel = isRTL ? status.ar : status.en;
                return (
                  <tr key={order.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="text-sm font-mono font-medium text-[var(--primary)]">{order.id.slice(0, 16)}</span>
                      {order.hasRx && <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded`}>Rx</span>}
                    </td>
                    <td className="p-4">
                      <p className={`text-sm font-medium ${textAlign}`}>{order.customerName}</p>
                      <p className={`text-xs text-[var(--text-secondary)] ${textAlign}`}>{order.phone}</p>
                    </td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">{order.date}</td>
                    <td className="p-4 text-sm">{order.itemCount} {t('productCount')}</td>
                    <td className="p-4 text-sm text-[var(--text-secondary)]">{order.paymentMethod}</td>
                    <td className="p-4 text-sm font-semibold">{order.total.toFixed(2)} {t('sar')}</td>
                    <td className="p-4">
                      <StatusBadge label={statusLabel} color={status.color} bg={status.bg} />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleView(order.id)}
                        className="text-xs text-[var(--primary)] font-semibold hover:underline"
                      >
                        {t('view')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-[var(--text-secondary)]">{t('noMatchingOrders')}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
