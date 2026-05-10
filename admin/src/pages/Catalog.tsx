import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type ApiProduct } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Pill } from '@/components/Pill';
import { IconClose, IconSearch } from '@/components/Icons';

const SAR = new Intl.NumberFormat('en-SA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function Catalog() {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<ApiProduct | null>(null);

  const productsQ = useQuery({
    queryKey: ['products'],
    queryFn: () => api.listProducts(),
  });

  const products = productsQ.data?.products ?? [];
  const filtered = useMemo(() => {
    if (!q.trim()) return products;
    const term = q.trim().toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        p.brand.toLowerCase().includes(term) ||
        p.nameAr.includes(term)
    );
  }, [products, q]);

  return (
    <div style={styles.shell}>
      <PageHeader
        title="Catalog"
        subtitle={`${products.length} products in the system`}
        actions={
          <>
            <button style={styles.btnSecondary}>SFDA bulk import</button>
            <button style={styles.btnPrimary}>+ Add product</button>
          </>
        }
      />

      <div style={styles.searchBar}>
        <span style={{ color: '#8A7A8A', display: 'inline-flex' }}>
          <IconSearch />
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, brand, SKU, or Arabic name…"
          style={styles.searchInput}
        />
      </div>

      <div style={styles.card}>
        {productsQ.isLoading ? (
          <div style={styles.empty}>Fetching catalog…</div>
        ) : productsQ.isError ? (
          <div style={styles.empty}>Could not reach the backend.</div>
        ) : filtered.length === 0 ? (
          <div style={styles.empty}>No products match that search.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Product</th>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Stock</th>
                <th style={styles.th}>Tags</th>
                <th style={styles.th}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setEditing(p)}
                  style={styles.row}
                >
                  <td style={styles.td}>
                    <span className="mono" style={{ color: '#8A7A8A' }}>
                      {p.sku ?? '—'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.productName}>{p.name}</div>
                    <div className="ar" style={styles.productNameAr}>{p.nameAr}</div>
                  </td>
                  <td style={styles.td}>{p.brand}</td>
                  <td style={styles.td}>
                    <span className="mono">SAR {SAR.format(p.price)}</span>
                  </td>
                  <td style={styles.td}>
                    {p.inStock ? (
                      <span className="mono">{p.stockCount}</span>
                    ) : (
                      <Pill tone="stuck">Out</Pill>
                    )}
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {p.rxRequired ? <Pill tone="info">Rx</Pill> : null}
                      {p.pregnancySafe ? <Pill tone="delivered">Pregnancy-safe</Pill> : null}
                    </div>
                  </td>
                  <td style={{ ...styles.td, color: '#8A7A8A', fontSize: 11, textAlign: 'right' }}>
                    Edit →
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing ? (
        <ProductDrawer product={editing} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
}

function ProductDrawer({ product, onClose }: { product: ApiProduct; onClose: () => void }) {
  return (
    <>
      <div style={styles.scrim} onClick={onClose} />
      <aside style={styles.drawer}>
        <div style={styles.drawerHead}>
          <div>
            <div style={styles.drawerEyebrow}>EDIT PRODUCT</div>
            <h3 style={styles.drawerTitle}>{product.name}</h3>
            <div className="ar" style={styles.drawerSub}>{product.nameAr}</div>
          </div>
          <button onClick={onClose} style={styles.iconBtn} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div style={styles.drawerBody}>
          <Field label="SKU"><span className="mono">{product.sku ?? '—'}</span></Field>
          <Field label="Brand">{product.brand}</Field>
          <Field label="Category">{product.category}</Field>
          <Field label="Price"><span className="mono">SAR {SAR.format(product.price)}</span></Field>
          <Field label="Unit">{product.unit}</Field>
          <Field label="In stock">
            {product.inStock ? (
              <span className="mono">{product.stockCount}</span>
            ) : (
              <Pill tone="stuck">Out</Pill>
            )}
          </Field>
          <Field label="Rx required">{product.rxRequired ? 'Yes' : 'No'}</Field>
          <Field label="Pregnancy-safe">{product.pregnancySafe ? 'Yes' : 'No'}</Field>
          <Field label="Description">
            <div style={styles.descBlock}>{product.description}</div>
          </Field>
          {product.pharmacistNote ? (
            <Field label="Pharmacist note">
              <div style={styles.descBlock}>{product.pharmacistNote}</div>
            </Field>
          ) : null}
        </div>

        <div style={styles.drawerFoot}>
          <div style={styles.note}>
            Editing requires the staff product endpoints (POST/PATCH /staff/products).
            Those land in the next backend session — see TODOS.md.
          </div>
        </div>
      </aside>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.fieldValue}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { padding: '24px 28px' },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#FFFFFF',
    border: '1px solid #ECE5EC',
    borderRadius: 8,
    padding: '8px 12px',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: 13,
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #ECE5EC',
    borderRadius: 8,
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#8A7A8A',
    fontWeight: 600,
    padding: '10px 14px',
    borderBottom: '1px solid #ECE5EC',
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid #ECE5EC',
    fontSize: 13,
  },
  row: { cursor: 'pointer' },
  productName: { fontWeight: 500 },
  productNameAr: { fontSize: 12, color: '#8A7A8A', marginTop: 2 },
  empty: { padding: 32, color: '#8A7A8A', textAlign: 'center', fontSize: 13 },
  btnPrimary: {
    background: '#752A79',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
  },
  btnSecondary: {
    background: '#FFFFFF',
    color: '#1A0F1A',
    border: '1px solid #ECE5EC',
    padding: '8px 14px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
  },

  // Drawer
  scrim: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26, 15, 26, 0.32)',
    zIndex: 100,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 480,
    background: '#FFFFFF',
    boxShadow: '0 8px 24px rgba(42, 10, 31, 0.16)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 101,
  },
  drawerHead: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: '20px 24px 16px',
    borderBottom: '1px solid #ECE5EC',
    gap: 16,
  },
  drawerEyebrow: {
    fontSize: 11,
    fontWeight: 600,
    color: '#8A7A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.3,
    margin: 0,
  },
  drawerSub: {
    color: '#8A7A8A',
    fontSize: 13,
    marginTop: 2,
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: '#8A7A8A',
    width: 32,
    height: 32,
    borderRadius: 6,
    display: 'grid',
    placeItems: 'center',
  },
  drawerBody: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  field: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr',
    alignItems: 'baseline',
    gap: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#8A7A8A',
  },
  fieldValue: { fontSize: 13, color: '#1A0F1A' },
  descBlock: {
    background: '#FFFFFF',
    border: '1px solid #ECE5EC',
    borderRadius: 6,
    padding: '10px 12px',
    color: '#4A3A4A',
    fontSize: 13,
    lineHeight: 1.6,
  },
  drawerFoot: {
    borderTop: '1px solid #ECE5EC',
    padding: '16px 24px',
  },
  note: { fontSize: 11, color: '#8A7A8A' },
};
