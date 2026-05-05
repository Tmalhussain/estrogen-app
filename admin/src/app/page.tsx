'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import StatusBadge from '../components/StatusBadge';
import {
  fetchOrders,
  fetchPrescriptions,
  fetchCustomers,
  fetchProducts,
  updatePrescriptionStatus,
  orderStatusLabels,
  type DashboardOrder,
  type DashboardPrescription,
  type DashboardCustomer,
  type DashboardProduct,
} from '../data/mock';
import Link from 'next/link';
import { useAdminLang } from '../i18n/AdminLangContext';

export default function DashboardPage() {
  const { t, isRTL, language } = useAdminLang();
  const textAlign = isRTL ? 'text-right' : 'text-left';

  // ── Firestore data state ──────────────────────────────────
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [prescriptions, setPrescriptions] = useState<DashboardPrescription[]>([]);
  const [customers, setCustomers] = useState<DashboardCustomer[]>([]);
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load data from Firestore ──────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [ordersData, rxData, customersData, productsData] = await Promise.all([
          fetchOrders({ maxResults: 20 }),
          fetchPrescriptions(),
          fetchCustomers(),
          fetchProducts(),
        ]);
        setOrders(ordersData);
        setPrescriptions(rxData);
        setCustomers(customersData);
        setProducts(productsData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const recentOrders = orders.slice(0, 5);
  const pendingRx = prescriptions.filter(rx => rx.status === 'pending_review');
  const lowStockProducts = products.filter(p => p.stockCount <= 10);

  // ── Compute stats from real data ──────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.date === today);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const stats = [
    { label: t('todayOrders'), value: String(todayOrders.length), change: '', icon: '📦', color: 'var(--primary)' },
    {
      label: t('todayRevenue'),
      value: isRTL
        ? `${todayRevenue.toLocaleString('ar-SA')} ر.س`
        : `${todayRevenue.toLocaleString('en-SA')} SAR`,
      change: '', icon: '💰', color: 'var(--success)',
    },
    { label: t('pendingRx'), value: String(pendingRx.length), change: '', icon: '📋', color: 'var(--warning)' },
    { label: t('newCustomersMonth'), value: String(customers.length), change: '', icon: '👥', color: 'var(--accent)' },
  ];

  // ── Prescription actions → Firestore ──────────────────────
  const handleApproveRx = async (id: string) => {
    try {
      await updatePrescriptionStatus(id, 'approved');
      setPrescriptions(prev =>
        prev.map(rx => rx.id === id ? { ...rx, status: 'approved' } : rx)
      );
    } catch (err) {
      console.error('Failed to approve prescription:', err);
    }
  };

  const handleRejectRx = async (id: string) => {
    try {
      await updatePrescriptionStatus(id, 'rejected');
      setPrescriptions(prev =>
        prev.map(rx => rx.id === id ? { ...rx, status: 'rejected' } : rx)
      );
    } catch (err) {
      console.error('Failed to reject prescription:', err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
            <p className="text-[var(--text-secondary)]">{isRTL ? 'جاري التحميل...' : 'Loading...'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-2xl font-bold text-[var(--primary-dark)] ${textAlign}`}>{t('dashboard')}</h1>
          <p className={`text-sm text-[var(--text-secondary)] mt-1 ${textAlign}`}>{t('welcomeAdmin')}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                {stat.change && (
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className={`text-sm text-[var(--text-secondary)] mt-1 ${textAlign}`}>{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[var(--border)]">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h2 className={`text-lg font-bold text-[var(--text)] ${textAlign}`}>{t('recentOrders')}</h2>
              <Link href="/orders" className="text-sm text-[var(--primary)] font-semibold hover:underline">
                {t('viewAll')}
              </Link>
            </div>
            <div className="overflow-x-auto">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-12">
                  {isRTL ? 'لا توجد طلبات بعد' : 'No orders yet'}
                </p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('orderNumber')}</th>
                      <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('customer')}</th>
                      <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('total')}</th>
                      <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => {
                      const status = orderStatusLabels[order.status] || { ar: order.status, en: order.status, color: '#6B7280', bg: '#F3F4F6' };
                      const statusLabel = isRTL ? status.ar : status.en;
                      return (
                        <tr key={order.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <span className="text-sm font-mono font-medium text-[var(--primary)]">{order.id.slice(0, 16)}</span>
                            {order.hasRx && <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded`}>Rx</span>}
                          </td>
                          <td className="p-4">
                            <p className={`text-sm font-medium text-[var(--text)] ${textAlign}`}>{order.customerName}</p>
                            <p className={`text-xs text-[var(--text-secondary)] ${textAlign}`}>{order.city}</p>
                          </td>
                          <td className="p-4 text-sm font-semibold">{order.total.toFixed(2)} {t('sar')}</td>
                          <td className="p-4">
                            <StatusBadge label={statusLabel} color={status.color} bg={status.bg} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Pending Prescriptions */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)]">
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <h2 className={`text-lg font-bold text-[var(--text)] ${textAlign}`}>{t('rxNeedReview')}</h2>
              <span className="bg-[var(--warning)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {pendingRx.length}
              </span>
            </div>
            <div className="p-4 space-y-4">
              {pendingRx.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-8">{t('noRxPending')}</p>
              ) : (
                pendingRx.map((rx) => (
                  <div key={rx.id} className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-bold text-[var(--text)] ${textAlign}`}>{rx.customerName}</span>
                      <span className="text-xs text-[var(--text-secondary)]">{rx.date}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mb-3">{rx.fileName}</p>
                    {rx.linkedOrderId && (
                      <p className="text-xs text-[var(--primary)] mb-3">{t('linkedTo')} {rx.linkedOrderId}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRx(rx.id)}
                        className="flex-1 bg-green-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {t('approve')}
                      </button>
                      <button
                        onClick={() => handleRejectRx(rx.id)}
                        className="flex-1 bg-red-500 text-white text-xs font-semibold py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        {t('reject')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-[var(--border)]">
              <Link href="/prescriptions" className="block text-center text-sm text-[var(--primary)] font-semibold hover:underline">
                {t('viewAllRx')}
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Top Customers */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6">
            <h3 className={`text-sm font-bold text-[var(--text)] mb-4 ${textAlign}`}>{t('topCustomers')}</h3>
            <div className="space-y-3">
              {customers.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                  {isRTL ? 'لا يوجد عملاء' : 'No customers yet'}
                </p>
              ) : (
                [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${textAlign}`}>{c.name}</p>
                      <p className={`text-xs text-[var(--text-secondary)] ${textAlign}`}>{c.ordersCount} {t('orderWord')}</p>
                    </div>
                    <span className="text-sm font-bold text-[var(--primary)]">{c.totalSpent.toFixed(0)} {t('sar')}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6">
            <h3 className={`text-sm font-bold text-[var(--text)] mb-4 ${textAlign}`}>{t('stockAlert')}</h3>
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-green-600 text-center py-4">
                  {isRTL ? 'المخزون جيد ✓' : 'Stock levels OK ✓'}
                </p>
              ) : (
                lowStockProducts.slice(0, 3).map((p) => (
                  <div key={p.id} className={`flex items-center justify-between p-3 ${p.stockCount === 0 ? 'bg-red-50' : 'bg-amber-50'} rounded-xl`}>
                    <div>
                      <p className={`text-sm font-medium ${p.stockCount === 0 ? 'text-red-700' : 'text-amber-700'} ${textAlign}`}>
                        {isRTL ? p.nameAr : p.nameEn}
                      </p>
                      <p className={`text-xs ${p.stockCount === 0 ? 'text-red-500' : 'text-amber-500'} ${textAlign}`}>
                        {p.stockCount === 0 ? t('outOfStock') : t('lowStock')}
                      </p>
                    </div>
                    <span className={`text-lg font-bold ${p.stockCount === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {p.stockCount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] p-6">
            <h3 className={`text-sm font-bold text-[var(--text)] mb-4 ${textAlign}`}>{t('orderStatuses')}</h3>
            <div className="space-y-2">
              {orders.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">
                  {isRTL ? 'لا توجد طلبات' : 'No orders'}
                </p>
              ) : (
                Object.entries(orderStatusLabels).map(([key, val]) => {
                  const count = orders.filter(o => o.status === key).length;
                  if (count === 0) return null;
                  const statusLabel = isRTL ? val.ar : val.en;
                  return (
                    <div key={key} className="flex items-center justify-between">
                      <StatusBadge label={statusLabel} color={val.color} bg={val.bg} />
                      <span className="text-sm font-bold text-[var(--text)]">{count}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
