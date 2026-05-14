import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type ApiProduct } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Pill, type PillTone } from '@/components/Pill';
import { colors, font, radius, space } from '@/styles/theme';

const SAR = new Intl.NumberFormat('en-SA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const STATUS_LABEL: Record<string, { label: string; tone: PillTone }> = {
  placed: { label: 'Placed', tone: 'placed' },
  preparing: { label: 'Preparing', tone: 'preparing' },
  out_for_delivery: { label: 'On the way', tone: 'dispatched' },
  delivered: { label: 'Delivered', tone: 'delivered' },
  cancelled: { label: 'Cancelled', tone: 'stuck' },
};

export default function Today() {
  const ordersQ = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.listOrders().catch(() => ({ orders: [] })),
  });

  const productsQ = useQuery({
    queryKey: ['products'],
    queryFn: () => api.listProducts().catch(() => ({ products: [] })),
  });

  const [manualOrderOpen, setManualOrderOpen] = useState(false);

  const orders = ordersQ.data?.orders ?? [];
  const products = productsQ.data?.products ?? [];
  const today = new Date();
  const todayOrders = orders.filter((o) => {
    const d = new Date(o.placedAt);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });

  function handleExport() {
    if (orders.length === 0) {
      window.alert('No orders available to export yet.');
      return;
    }

    const rows = orders.map((o) => ({
      orderId: `EST-${o.id.slice(-4).toUpperCase()}`,
      customer: [o.customerFirstName, o.customerLastName].filter(Boolean).join(' ') || '—',
      phone: o.customerPhone ?? '—',
      status: o.status,
      total: o.total.toFixed(2),
      placedAt: o.placedAt,
    }));

    const header = ['Order ID', 'Customer', 'Phone', 'Status', 'Total', 'Placed At'];
    const csv = [header.join(','), ...rows.map((row) =>
      [row.orderId, row.customer, row.phone, row.status, row.total, row.placedAt]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(',')
    )].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estrogen-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  const revenueToday = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const avgEta = todayOrders.length ? '38m' : '—';
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div style={styles.shell}>
      <PageHeader
        title="Today"
        subtitle={`${dateStr} · Riyadh`}
        actions={
          <>
            <button onClick={handleExport} style={styles.btnSecondary}>Export</button>
            <button onClick={() => setManualOrderOpen(true)} style={styles.btnPrimary}>+ New manual order</button>
          </>
        }
      />

      <AlertStrip />

      <div style={styles.statsRow}>
        <Stat label="Orders today" value={todayOrders.length.toString()} delta="—" />
        <Stat label="Revenue today" value={`SAR ${SAR.format(revenueToday)}`} delta="—" />
        <Stat label="Avg time-to-delivery" value={avgEta} delta="—" />
        <Stat label="Active drivers" value="1 / 3" delta="2 off-shift" deltaColor="#C77B0A" />
      </div>

      <div style={styles.panels}>
        <div style={styles.ordersCard}>
          <div style={styles.ordersHead}>
            <h3 style={styles.cardTitle}>Live orders</h3>
            <div style={styles.cardSub}>
              {ordersQ.isLoading
                ? 'Loading…'
                : `${orders.length} total · ${todayOrders.length} today`}
            </div>
          </div>
          {ordersQ.isLoading ? (
            <div style={styles.empty}>Fetching orders…</div>
          ) : ordersQ.isError ? (
            <div style={styles.empty}>Could not reach the backend.</div>
          ) : orders.length === 0 ? (
            <div style={styles.empty}>
              No orders yet. Once customers place orders through the app, they'll
              show up here.
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 12).map((o) => {
                  const s = STATUS_LABEL[o.status] ?? { label: o.status, tone: 'neutral' as const };
                  const placedAt = new Date(o.placedAt);
                  const hh = placedAt.getHours().toString().padStart(2, '0');
                  const mm = placedAt.getMinutes().toString().padStart(2, '0');
                  const customerName =
                    [o.customerFirstName, o.customerLastName]
                      .filter(Boolean)
                      .join(' ')
                      .trim() || '—';
                  return (
                    <tr key={o.id}>
                      <td style={{ ...styles.td }}>
                        <span className="mono">EST-{o.id.slice(-4).toUpperCase()}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 500 }}>{customerName}</div>
                        {o.customerPhone ? (
                          <div className="mono" style={{ fontSize: 11, color: '#8A7A8A' }}>
                            {o.customerPhone}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ ...styles.td }}>
                        <span className="mono">SAR {SAR.format(o.total)}</span>
                      </td>
                      <td style={styles.td}>
                        <Pill tone={s.tone}>{s.label}</Pill>
                      </td>
                      <td style={styles.td}>
                        <span className="mono">{hh}:{mm}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div style={styles.driverCard}>
          <h3 style={styles.cardTitle}>Drivers on shift</h3>
          <Driver name="Mohammed" meta="3 active · 2 done today" status="On road" tone="dispatched" />
          <Driver name="Abdullah" meta="Off shift · back 14:00" status="Off" tone="placed" />
          <Driver name="Faisal" meta="Off shift · back 18:00" status="Off" tone="placed" />
          <p style={styles.note}>
            Driver assignment is manual in v1. Auto-dispatch is a v1.1 feature.
          </p>
        </div>
      </div>
      {manualOrderOpen ? (
        <OrderDrawer
          products={products}
          onClose={() => setManualOrderOpen(false)}
          onCreated={() => {
            setManualOrderOpen(false);
            ordersQ.refetch();
          }}
        />
      ) : null}
    </div>
  );
}

function OrderDrawer({
  products,
  onClose,
  onCreated,
}: {
  products: ApiProduct[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [productId, setProductId] = useState<string>(products[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'mada' | 'stcpay' | 'applepay' | 'cod'>('mada');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId && products.length > 0) {
      setProductId(products[0].id);
    }
  }, [productId, products]);

  async function handleCreate() {
    if (!productId) {
      setError('Select a product first.');
      return;
    }
    if (!address.trim()) {
      setError('Address is required.');
      return;
    }
    if (quantity <= 0) {
      setError('Quantity must be at least 1.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api.createOrder({
        items: [{ productId, quantity }],
        address: address.trim(),
        deliveryOption,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order creation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={styles.scrim} onClick={onClose} />
      <aside style={styles.drawer}>
        <div style={styles.drawerHead}>
          <div>
            <div style={styles.drawerEyebrow}>NEW MANUAL ORDER</div>
            <h3 style={styles.drawerTitle}>Create a customer order</h3>
          </div>
          <button onClick={onClose} style={styles.iconBtn} aria-label="Close">
            ×
          </button>
        </div>
        <div style={styles.drawerBody}>
          <label style={styles.fieldLabel}>Product</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            style={styles.select}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} — {product.brand}
              </option>
            ))}
          </select>
          <label style={styles.fieldLabel}>Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            style={styles.inputField}
          />
          <label style={styles.fieldLabel}>Delivery address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            style={styles.textarea}
          />
          <label style={styles.fieldLabel}>Delivery option</label>
          <select
            value={deliveryOption}
            onChange={(e) => setDeliveryOption(e.target.value as 'standard' | 'express')}
            style={styles.select}
          >
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
          <label style={styles.fieldLabel}>Payment method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as 'mada' | 'stcpay' | 'applepay' | 'cod')}
            style={styles.select}
          >
            <option value="mada">Mada</option>
            <option value="stcpay">STC Pay</option>
            <option value="applepay">Apple Pay</option>
            <option value="cod">Cash on delivery</option>
          </select>
          <label style={styles.fieldLabel}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={styles.textarea}
          />
          {error ? <div style={styles.error}>{error}</div> : null}
          <button onClick={handleCreate} disabled={busy} style={styles.btnPrimary}>
            {busy ? 'Creating order…' : 'Create order'}
          </button>
          <p style={styles.note}>
            Manual orders are created under the currently logged-in staff account for fast v1 testing.
          </p>
        </div>
      </aside>
    </>
  );
}

function AlertStrip() {
  return (
    <div style={styles.alertStrip}>
      <AlertCell count="0" label="Prescriptions awaiting review" tone="warn" />
      <AlertCell count="0" label="Low-stock items" tone="warn" />
      <AlertCell count="0" label="Orders unassigned > 30 min" tone="danger" />
    </div>
  );
}

function AlertCell({
  count,
  label,
  tone,
}: {
  count: string;
  label: string;
  tone: 'warn' | 'danger' | 'neutral';
}) {
  const color =
    tone === 'warn' ? '#C77B0A' : tone === 'danger' ? '#C8253A' : '#4A3A4A';
  return (
    <div style={styles.alertCell}>
      <span className="mono" style={{ ...styles.alertCount, color }}>
        {count}
      </span>
      <span style={styles.alertLabel}>{label}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  deltaColor,
}: {
  label: string;
  value: string;
  delta: string;
  deltaColor?: string;
}) {
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div className="mono" style={styles.statValue}>{value}</div>
      <div style={{ ...styles.statDelta, color: deltaColor ?? '#8A7A8A' }}>{delta}</div>
    </div>
  );
}

function Driver({
  name,
  meta,
  status,
  tone,
}: {
  name: string;
  meta: string;
  status: string;
  tone: PillTone;
}) {
  return (
    <div style={styles.driverRow}>
      <div style={styles.driverAvatar}>{name[0]}</div>
      <div style={{ flex: 1 }}>
        <div style={styles.driverName}>{name}</div>
        <div className="mono" style={styles.driverMeta}>{meta}</div>
      </div>
      <Pill tone={tone}>{status}</Pill>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { padding: `${space.xxxl}px ${space.xxl}px`, background: colors.bg },
  alertStrip: {
    display: 'flex',
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: space.xxxl,
  },
  alertCell: {
    flex: 1,
    padding: `${space.md}px ${space.lg}px`,
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
    borderRight: `1px solid ${colors.border}`,
  },
  alertCount: { fontSize: 18, fontWeight: 600 },
  alertLabel: { fontSize: font.size.xs, color: colors.textSoft },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: space.md,
    marginBottom: space.xxxl,
  },
  stat: {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: `${space.lg}px ${space.xl}px`,
  },
  statLabel: {
    fontSize: font.size.xxs,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 600,
    marginTop: 6,
    letterSpacing: -0.2,
    color: colors.text,
  },
  statDelta: {
    fontSize: font.size.xxs,
    fontWeight: 600,
    marginTop: 4,
    color: colors.textMuted,
  },
  panels: {
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
    gap: space.lg,
  },
  ordersCard: {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  ordersHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${space.lg}px ${space.xl}px`,
    borderBottom: `1px solid ${colors.border}`,
  },
  cardTitle: { fontSize: font.size.sm, fontWeight: 600, margin: 0, color: colors.text },
  cardSub: { fontSize: font.size.xs, color: colors.textMuted },
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
  driverCard: {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: space.lg,
  },
  driverRow: {
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
    padding: `${space.sm}px 0`,
    borderBottom: `1px solid ${colors.border}`,
  },
  driverAvatar: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    background: colors.brandSoft,
    color: colors.primary,
    display: 'grid',
    placeItems: 'center',
    fontSize: font.size.xs,
    fontWeight: 700,
  },
  driverName: { fontWeight: 500, fontSize: font.size.sm, color: colors.text },
  driverMeta: { fontSize: font.size.xs, color: colors.textMuted },
  note: { fontSize: font.size.xs, color: colors.textMuted, marginTop: space.sm, marginBottom: 0 },
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
    background: 'rgba(0,0,0,0.32)',
    zIndex: 20,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 420,
    maxWidth: '100%',
    height: '100vh',
    background: colors.bg,
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
    fontSize: 20,
    color: colors.text,
    cursor: 'pointer',
    padding: 8,
  },
  drawerBody: {
    flex: 1,
    overflowY: 'auto',
    padding: `${space.lg}px ${space.xl}px`,
    display: 'grid',
    gap: space.sm,
  },
  fieldLabel: {
    fontSize: font.size.xxs,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: 600,
  },
  inputField: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: radius.sm,
    border: `1px solid ${colors.border}`,
    background: colors.surface ?? colors.bg,
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
    background: colors.surface ?? colors.bg,
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
    background: colors.surface ?? colors.bg,
    color: colors.text,
    fontSize: font.size.sm,
    outline: 'none',
  },
  error: {
    color: '#C8253A',
    fontSize: font.size.xs,
    marginTop: space.sm,
  },
};
