'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { fetchProducts, type DashboardProduct } from '../../data/mock';
import { useAdminLang } from '../../i18n/AdminLangContext';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, isRTL } = useAdminLang();
  const textAlign = isRTL ? 'text-right' : 'text-left';

  // Fetch products from Firestore
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await fetchProducts();
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filtered = products.filter(p => {
    if (!searchQuery) return true;
    return p.nameAr.includes(searchQuery) || p.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleEdit = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      alert(`${t('edit')}: ${isRTL ? product.nameAr : product.nameEn}\n${t('code')}: ${product.id}\n${t('price')}: ${product.price.toFixed(2)} ${t('sar')}\n${t('stock')}: ${product.stock}`);
    }
  };

  const handleAddProduct = () => {
    alert(t('addProduct'));
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
            <h1 className={`text-2xl font-bold text-[var(--primary-dark)] ${textAlign}`}>{t('productsManagement')}</h1>
            <p className={`text-sm text-[var(--text-secondary)] mt-1 ${textAlign}`}>{products.length} {t('productCount2')}</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[var(--primary-dark)] transition-colors"
          >
            {t('addProduct')}
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder={t('searchProductPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full max-w-md px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent ${textAlign}`}
          />
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-[var(--border)]">
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('code')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('product')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('category')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('price')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('stock')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('type')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('status')}</th>
                <th className={`${textAlign} text-xs font-semibold text-[var(--text-secondary)] p-4`}>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-mono text-[var(--text-secondary)]">{product.id.slice(0, 10)}</td>
                  <td className="p-4">
                    <p className={`text-sm font-medium ${textAlign}`}>{isRTL ? product.nameAr : product.nameEn}</p>
                    <p className={`text-xs text-[var(--text-secondary)] ${textAlign}`}>{isRTL ? product.nameEn : product.nameAr}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-gray-100 text-[var(--text-secondary)] px-2 py-1 rounded-lg">{product.category}</span>
                  </td>
                  <td className="p-4 text-sm font-semibold">{product.price.toFixed(2)} {t('sar')}</td>
                  <td className="p-4">
                    <span className={`text-sm font-bold ${
                      product.stock === 0 ? 'text-red-600' :
                      product.stock < 50 ? 'text-amber-600' :
                      'text-green-600'
                    }`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    {product.requiresRx ? (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-lg font-semibold">{t('requiresRx')}</span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-lg font-semibold">{t('otc')}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      product.isActive
                        ? 'text-green-700 bg-green-50'
                        : 'text-gray-500 bg-gray-100'
                    }`}>
                      {product.isActive ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleEdit(product.id)}
                      className={`text-xs text-[var(--primary)] font-semibold hover:underline ${isRTL ? 'ml-3' : 'mr-3'}`}
                    >
                      {t('edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
