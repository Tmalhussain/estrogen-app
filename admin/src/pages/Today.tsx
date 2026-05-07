import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Pill, type PillTone } from '@/components/Pill';

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

  const orders = ordersQ.data?.orders ?? [];
  const today = new Date();
  const todayOrders = orders.filter((o) => {
    const d = new Date(o.placedAt);
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  });
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
            <button style={styles.btnSecondary}>Export</button>
            <button style={styles.btnPrimary}>+ New manual order</button>
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
    </div>
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
  shell: { padding: '24px 28px' },
  alertStrip: {
    display: 'flex',
    background: '#FFFFFF',
    border: '1px solid #EDE6EC',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  alertCell: {
    flex: 1,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderRight: '1px solid #EDE6EC',
  },
  alertCount: { fontSize: 18, fontWeight: 600 },
  alertLabel: { fontSize: 12, color: '#4A3A4A' },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    marginBottom: 24,
  },
  stat: {
    background: '#FFFFFF',
    border: '1px solid #EDE6EC',
    borderRadius: 8,
    padding: '14px 16px',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#8A7A8A',
  },
  statValue: { fontSize: 22, fontWeight: 600, marginTop: 4, letterSpacing: -0.5 },
  statDelta: { fontSize: 11, fontWeight: 600, marginTop: 2 },
  panels: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: 16,
  },
  ordersCard: {
    background: '#FFFFFF',
    border: '1px solid #EDE6EC',
    borderRadius: 8,
    overflow: 'hidden',
  },
  ordersHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 16px',
    borderBottom: '1px solid #EDE6EC',
  },
  cardTitle: { fontSize: 13, fontWeight: 600, margin: 0 },
  cardSub: { fontSize: 12, color: '#8A7A8A' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#8A7A8A',
    fontWeight: 600,
    padding: '10px 14px',
    borderBottom: '1px solid #EDE6EC',
  },
  td: {
    padding: '12px 14px',
    borderBottom: '1px solid #EDE6EC',
    fontSize: 13,
  },
  driverCard: {
    background: '#FFFFFF',
    border: '1px solid #EDE6EC',
    borderRadius: 8,
    padding: 16,
  },
  driverRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderBottom: '1px solid #EDE6EC',
  },
  driverAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#E9D9E9',
    color: '#702070',
    display: 'grid',
    placeItems: 'center',
    fontSize: 12,
    fontWeight: 600,
  },
  driverName: { fontWeight: 500, fontSize: 13 },
  driverMeta: { fontSize: 11, color: '#8A7A8A' },
  note: { fontSize: 11, color: '#8A7A8A', marginTop: 12, marginBottom: 0 },
  empty: { padding: 32, color: '#8A7A8A', textAlign: 'center', fontSize: 13 },
  btnPrimary: {
    background: '#B02080',
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
    border: '1px solid #EDE6EC',
    padding: '8px 14px',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: 13,
  },
};
