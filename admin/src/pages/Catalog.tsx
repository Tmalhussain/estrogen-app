import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type ApiProduct } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Pill } from '@/components/Pill';
import { IconClose, IconSearch } from '@/components/Icons';
import { colors, font, radius, space } from '@/styles/theme';

const SAR = new Intl.NumberFormat('en-SA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PRODUCT_CATEGORIES = [
  'chronic',
  'postpartum',
  'women',
  'digestive',
  'cardio',
  'dermatology',
] as const;

type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

const EMPTY_PRODUCT: Partial<ApiProduct> = {
  sku: '',
  name: '',
  nameAr: '',
  brand: '',
  category: 'chronic',
  price: 0,
  oldPrice: null,
  unit: 'unit',
  image: '',
  rating: 0,
  reviews: 0,
  stockCount: 0,
  inStock: true,
  rxRequired: false,
  pregnancySafe: false,
  description: '',
  pharmacistNote: '',
  tags: [],
};

export default function Catalog() {
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<ApiProduct | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<ApiProduct> | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fileInput = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

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

  const openCreateDrawer = () => {
    setDraft({ ...EMPTY_PRODUCT });
    setDrawerOpen(true);
    setEditing(null);
    setBulkMessage(null);
  };

  const openEditDrawer = (product: ApiProduct) => {
    setEditing(product);
    setDraft(product);
    setDrawerOpen(true);
    setBulkMessage(null);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
    setDraft(null);
    setBusy(false);
    setBulkMessage(null);
  };

  const saveProduct = async () => {
    if (!draft) return;
    setBusy(true);
    setBulkMessage(null);

    const payload = {
      ...draft,
      price: Number(draft.price || 0),
      oldPrice: draft.oldPrice ? Number(draft.oldPrice) : null,
      stockCount: Number(draft.stockCount || 0),
      inStock: Boolean(draft.inStock),
      rxRequired: Boolean(draft.rxRequired),
      pregnancySafe: Boolean(draft.pregnancySafe),
      category: (draft.category || 'chronic') as ProductCategory,
      tags: draft.tags?.filter(Boolean) ?? [],
    } as ApiProduct;

    try {
      if (editing) {
        await api.updateProduct(editing.id, payload);
      } else {
        await api.createProduct(payload);
      }
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      closeDrawer();
    } catch (error) {
      console.error(error);
      setBulkMessage('Could not save product.');
    } finally {
      setBusy(false);
    }
  };

  const deleteProduct = async () => {
    if (!editing) return;
    setBusy(true);
    setBulkMessage(null);
    try {
      await api.deleteProduct(editing.id);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      closeDrawer();
    } catch (error) {
      console.error(error);
      setBulkMessage('Could not delete product.');
    } finally {
      setBusy(false);
    }
  };

  const handleBulkImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setBulkMessage(null);

    try {
      const text = await file.text();
      const rows = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      const productsToCreate = rows.map((row) => {
        const [sku, name, price, brand, category] = row.split(',').map((cell) => cell.trim());
        return {
          ...EMPTY_PRODUCT,
          sku,
          name,
          price: Number(price || 0),
          brand,
          category: (PRODUCT_CATEGORIES.includes(category as ProductCategory)
            ? category
            : 'chronic') as ProductCategory,
        };
      });

      const createPromises = productsToCreate.map((product) => api.createProduct(product as ApiProduct));
      await Promise.all(createPromises);
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      setBulkMessage(`Imported ${productsToCreate.length} products successfully.`);
    } catch (error) {
      console.error(error);
      setBulkMessage('Bulk import failed. The file should be a simple CSV with sku,name,price,brand,category.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div style={styles.shell}>
      <PageHeader
        title="Catalog"
        subtitle={`${products.length} products in the system`}
        actions={
          <>
            <button
              style={styles.btnSecondary}
              onClick={() => fileInput.current?.click()}
              disabled={busy}
            >
              SFDA bulk import
            </button>
            <button style={styles.btnPrimary} onClick={openCreateDrawer} disabled={busy}>
              + Add product
            </button>
            <input
              ref={fileInput}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleBulkImport}
            />
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
                  onClick={() => openEditDrawer(p)}
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

      {drawerOpen && draft ? (
        <ProductEditorDrawer
          product={draft}
          isEditing={Boolean(editing)}
          busy={busy}
          message={bulkMessage}
          onClose={closeDrawer}
          onSave={saveProduct}
          onDelete={editing ? deleteProduct : undefined}
          onChange={(updated) => setDraft(updated)}
        />
      ) : null}
    </div>
  );
}

function ProductEditorDrawer({
  product,
  isEditing,
  busy,
  message,
  onClose,
  onSave,
  onDelete,
  onChange,
}: {
  product: Partial<ApiProduct>;
  isEditing: boolean;
  busy: boolean;
  message: string | null;
  onClose: () => void;
  onSave: () => void;
  onDelete?: () => void;
  onChange: (updated: Partial<ApiProduct>) => void;
}) {
  const updateField = (key: keyof ApiProduct, value: any) => {
    onChange({ ...product, [key]: value });
  };

  const tags = Array.isArray(product.tags) ? product.tags : [];

  return (
    <>
      <div style={styles.scrim} onClick={onClose} />
      <aside style={styles.drawer}>
        <div style={styles.drawerHead}>
          <div>
            <div style={styles.drawerEyebrow}>{isEditing ? 'Edit product' : 'New product'}</div>
            <h3 style={styles.drawerTitle}>{product.name || (isEditing ? 'Untitled product' : 'Create a product')}</h3>
            <div className="ar" style={styles.drawerSub}>{product.nameAr || ''}</div>
          </div>
          <button onClick={onClose} style={styles.iconBtn} aria-label="Close">
            <IconClose />
          </button>
        </div>

        <div style={styles.drawerBody}>
          <label style={styles.fieldLabel}>SKU</label>
          <input
            value={product.sku ?? ''}
            onChange={(e) => updateField('sku', e.target.value)}
            style={styles.inputField}
          />

          <label style={styles.fieldLabel}>Product name</label>
          <input
            value={product.name ?? ''}
            onChange={(e) => updateField('name', e.target.value)}
            style={styles.inputField}
          />

          <label style={styles.fieldLabel}>Arabic name</label>
          <input
            value={product.nameAr ?? ''}
            onChange={(e) => updateField('nameAr', e.target.value)}
            style={styles.inputField}
          />

          <label style={styles.fieldLabel}>Brand</label>
          <input
            value={product.brand ?? ''}
            onChange={(e) => updateField('brand', e.target.value)}
            style={styles.inputField}
          />

          <label style={styles.fieldLabel}>Category</label>
          <select
            value={product.category ?? 'chronic'}
            onChange={(e) => updateField('category', e.target.value as ProductCategory)}
            style={styles.select}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <label style={styles.fieldLabel}>Price</label>
          <input
            type="number"
            value={product.price ?? 0}
            onChange={(e) => updateField('price', Number(e.target.value))}
            style={styles.inputField}
          />

          <label style={styles.fieldLabel}>Old price</label>
          <input
            type="number"
            value={product.oldPrice ?? ''}
            onChange={(e) => updateField('oldPrice', e.target.value ? Number(e.target.value) : null)}
            style={styles.inputField}
          />

          <label style={styles.fieldLabel}>Stock count</label>
          <input
            type="number"
            value={product.stockCount ?? 0}
            onChange={(e) => updateField('stockCount', Number(e.target.value))}
            style={styles.inputField}
          />

          <label style={styles.fieldLabel}>Unit</label>
          <input
            value={product.unit ?? ''}
            onChange={(e) => updateField('unit', e.target.value)}
            style={styles.inputField}
          />

          <label style={styles.fieldLabel}>Description</label>
          <textarea
            value={product.description ?? ''}
            onChange={(e) => updateField('description', e.target.value)}
            style={styles.textarea}
          />

          <label style={styles.fieldLabel}>Pharmacist note</label>
          <textarea
            value={product.pharmacistNote ?? ''}
            onChange={(e) => updateField('pharmacistNote', e.target.value)}
            style={styles.textarea}
          />

          <label style={styles.fieldLabel}>Rx required</label>
          <input
            type="checkbox"
            checked={Boolean(product.rxRequired)}
            onChange={(e) => updateField('rxRequired', e.target.checked)}
          />

          <label style={styles.fieldLabel}>Pregnancy-safe</label>
          <input
            type="checkbox"
            checked={Boolean(product.pregnancySafe)}
            onChange={(e) => updateField('pregnancySafe', e.target.checked)}
          />

          <label style={styles.fieldLabel}>Tags</label>
          <input
            value={tags.join(', ')}
            onChange={(e) => updateField('tags', e.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
            placeholder="comma-separated tags"
            style={styles.inputField}
          />

          {message ? <div style={styles.message}>{message}</div> : null}
        </div>

        <div style={styles.drawerFoot}>
          <div style={styles.drawerActions}>
            {onDelete ? (
              <button style={styles.btnSecondary} onClick={onDelete} disabled={busy}>
                Delete product
              </button>
            ) : null}
            <button style={styles.btnPrimary} onClick={onSave} disabled={busy}>
              {isEditing ? 'Save changes' : 'Create product'}
            </button>
          </div>
          <div style={styles.note}>
            You can create or update products here; bulk import reads a simple CSV file.
          </div>
        </div>
      </aside>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { padding: `${space.xxxl}px ${space.xxl}px`, background: colors.bg },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: `${space.sm}px ${space.lg}px`,
    marginBottom: space.lg,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: font.size.sm,
    color: colors.text,
  },
  card: {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    fontSize: font.size.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.textMuted,
    fontWeight: 600,
    padding: `${space.sm}px ${space.lg}px`,
    borderBottom: `1px solid ${colors.border}`,
  },
  td: {
    padding: `${space.sm + 4}px ${space.lg}px`,
    borderBottom: `1px solid ${colors.border}`,
    fontSize: font.size.sm,
    color: colors.text,
  },
  row: { cursor: 'pointer' },
  productName: { fontWeight: 500, color: colors.text },
  productNameAr: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  empty: { padding: 32, color: colors.textMuted, textAlign: 'center', fontSize: font.size.sm },
  btnPrimary: {
    background: colors.primary,
    color: colors.onPrimary,
    border: 'none',
    padding: '8px 14px',
    borderRadius: radius.sm,
    fontWeight: 600,
    fontSize: font.size.sm,
  },
  btnSecondary: {
    background: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
    padding: '8px 14px',
    borderRadius: radius.sm,
    fontWeight: 600,
    fontSize: font.size.sm,
  },
  scrim: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.35)',
    zIndex: 20,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: 420,
    maxWidth: '100%',
    background: colors.surface || '#fff',
    boxShadow: '-24px 0 64px rgba(0,0,0,0.12)',
    zIndex: 30,
    display: 'flex',
    flexDirection: 'column',
  },
  drawerHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: space.md,
    padding: `${space.xl}px ${space.xl}px 0`,
  },
  drawerEyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: font.size.xxs,
    color: colors.textMuted,
    marginBottom: 6,
  },
  drawerTitle: { margin: 0, fontSize: 22, fontWeight: 700, color: colors.text },
  drawerSub: { fontSize: font.size.xs, color: colors.textMuted, marginTop: 2 },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: colors.text,
    cursor: 'pointer',
    padding: 8,
  },
  drawerBody: {
    flex: 1,
    overflowY: 'auto',
    padding: `${space.md}px ${space.xl}px`,
    display: 'grid',
    gap: space.sm,
  },
  drawerFoot: {
    borderTop: `1px solid ${colors.border}`,
    padding: `${space.sm}px ${space.xl}px ${space.xl}px`,
  },
  fieldLabel: { fontSize: font.size.xxs, color: colors.textMuted, marginBottom: 6, fontWeight: 600 },
  inputField: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    fontSize: font.size.sm,
    outline: 'none',
  },
  textarea: {
    width: '100%',
    minHeight: 96,
    padding: '10px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    fontSize: font.size.sm,
    outline: 'none',
    resize: 'vertical',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    fontSize: font.size.sm,
  },
  drawerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: space.sm,
    marginTop: space.lg,
  },
  note: {
    fontSize: font.size.xs,
    color: colors.textMuted,
    marginTop: space.md,
  },
  message: {
    color: colors.primary,
    fontSize: font.size.xs,
    marginTop: space.sm,
  },
};
