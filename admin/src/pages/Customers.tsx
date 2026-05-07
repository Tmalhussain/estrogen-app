import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, ApiError, type ApiUser } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Pill, type PillTone } from '@/components/Pill';
import { IconSearch } from '@/components/Icons';

/**
 * Customers — search-only by design.
 *
 * LOCKDOWN: This page does NOT and MUST NEVER list all customers, even
 * paginated. PDPL constraint + product trust constraint. The only way
 * to find a customer is to know something specific about them: their
 * phone, email, or order ID. The backend `/staff/customers` endpoint
 * returns 0 or 1 customer per call, never a list.
 */

const SAR = new Intl.NumberFormat('en-SA', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const STATUS_TONE: Record<string, PillTone> = {
  placed: 'placed',
  preparing: 'preparing',
  out_for_delivery: 'dispatched',
  delivered: 'delivered',
  cancelled: 'stuck',
};

type SearchKind = 'phone' | 'email' | 'orderId';

function detectKind(q: string): SearchKind {
  const trimmed = q.trim();
  if (/^[A-Z]{2,}-/i.test(trimmed)) return 'orderId';
  if (trimmed.includes('@')) return 'email';
  return 'phone';
}

function normalizeOrderId(raw: string): string {
  // Admin shows "EST-XXXX" but the underlying ID is the full UUID. The
  // current backend `?orderId=` lookup is exact-match on the UUID. For
  // the human-friendly EST-XXXX variant we'd need a secondary lookup;
  // out of v1 scope. So we pass through the raw value and tell the
  // user to paste the full ID if they hit the empty result.
  return raw.trim();
}

export default function Customers() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState<{
    raw: string;
    kind: SearchKind;
    value: string;
  } | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const raw = query.trim();
    if (!raw) return;
    const kind = detectKind(raw);
    const value = kind === 'orderId' ? normalizeOrderId(raw) : raw;
    setSubmitted({ raw, kind, value });
    setProfileId(null);
  }

  const searchQ = useQuery({
    queryKey: ['customer-search', submitted?.kind, submitted?.value],
    queryFn: () => {
      if (!submitted) return Promise.resolve({ customer: null });
      const params: Parameters<typeof api.searchCustomer>[0] = {};
      params[submitted.kind] = submitted.value;
      return api.searchCustomer(params);
    },
    enabled: !!submitted,
    retry: false,
  });

  return (
    <div style={styles.shell}>
      <PageHeader
        title="Customers"
        subtitle="Search by phone, email, or order ID. Listing all customers is intentionally not possible."
      />

      <form onSubmit={onSubmit} style={styles.searchForm}>
        <span style={{ color: '#8A7A8A', display: 'inline-flex' }}>
          <IconSearch />
        </span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="0501234567 · name@example.com · or full order UUID"
          style={styles.searchInput}
          autoFocus
        />
        <button type="submit" style={styles.btnPrimary}>
          Search
        </button>
      </form>

      {!submitted ? (
        <EmptyState />
      ) : searchQ.isLoading ? (
        <Card>Searching…</Card>
      ) : searchQ.isError ? (
        <Card>
          We couldn't reach the backend.{' '}
          {searchQ.error instanceof ApiError ? `(${searchQ.error.code})` : ''}
        </Card>
      ) : !searchQ.data?.customer ? (
        <Card>
          <strong>No customer found</strong> for {submitted.kind} "{submitted.raw}".
          {submitted.kind === 'orderId' ? (
            <p style={styles.bodyMuted}>
              Order lookup currently expects the full UUID, not the "EST-XXXX"
              short form. (See TODOS.md.)
            </p>
          ) : null}
        </Card>
      ) : (
        <ProfileSummary
          customer={searchQ.data.customer}
          isOpen={profileId === searchQ.data.customer.id}
          onOpen={() => setProfileId(searchQ.data!.customer!.id)}
        />
      )}
    </div>
  );
}

function ProfileSummary({
  customer,
  isOpen,
  onOpen,
}: {
  customer: ApiUser;
  isOpen: boolean;
  onOpen: () => void;
}) {
  const fullName =
    [customer.firstName, customer.lastName].filter(Boolean).join(' ').trim() ||
    'Estrogen customer';
  return (
    <div style={styles.profileCard}>
      <div style={styles.profileHead}>
        <div>
          <div style={styles.profileEyebrow}>CUSTOMER FOUND</div>
          <h3 style={styles.profileName}>{fullName}</h3>
          <div className="mono" style={styles.profileMeta}>
            {customer.phoneNumber ?? customer.email ?? '—'}
          </div>
        </div>
        {!isOpen ? (
          <button onClick={onOpen} style={styles.btnSecondary}>
            Open full profile
          </button>
        ) : null}
      </div>
      {isOpen ? <FullProfile id={customer.id} /> : null}
    </div>
  );
}

function FullProfile({ id }: { id: string }) {
  const profileQ = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.getCustomer(id),
  });
  const [showMedical, setShowMedical] = useState(false);
  const medicalQ = useQuery({
    queryKey: ['customer-medical', id],
    queryFn: () => api.getCustomerMedical(id),
    enabled: showMedical,
  });

  if (profileQ.isLoading) return <div style={styles.bodyMuted}>Loading profile…</div>;
  if (profileQ.isError)
    return <div style={styles.bodyMuted}>Could not load profile.</div>;
  if (!profileQ.data) return null;

  const { orders, prescriptions } = profileQ.data;

  return (
    <div style={styles.fullProfile}>
      <Section title={`Recent orders (${orders.length})`}>
        {orders.length === 0 ? (
          <div style={styles.bodyMuted}>No orders yet.</div>
        ) : (
          <div>
            {orders.map((o) => (
              <div key={o.id} style={styles.orderRow}>
                <span className="mono" style={styles.orderId}>
                  EST-{o.id.slice(-4).toUpperCase()}
                </span>
                <Pill tone={STATUS_TONE[o.status] ?? 'neutral'}>
                  {o.status.replace(/_/g, ' ')}
                </Pill>
                <span className="mono" style={styles.orderTotal}>
                  SAR {SAR.format(o.total)}
                </span>
                <span className="mono" style={styles.orderDate}>
                  {new Date(o.placedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title={`Prescriptions (${prescriptions.length})`}>
        {prescriptions.length === 0 ? (
          <div style={styles.bodyMuted}>No prescriptions on file.</div>
        ) : (
          <div>
            {prescriptions.map((p) => (
              <div key={p.id} style={styles.orderRow}>
                <Pill
                  tone={
                    p.status === 'approved'
                      ? 'delivered'
                      : p.status === 'pending_review'
                      ? 'preparing'
                      : p.status === 'rejected'
                      ? 'stuck'
                      : 'neutral'
                  }
                >
                  {p.status.replace(/_/g, ' ')}
                </Pill>
                <span style={{ flex: 1 }}>{p.productName ?? '—'}</span>
                {p.expiresAt ? (
                  <span className="mono" style={styles.orderDate}>
                    expires {new Date(p.expiresAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Medical profile (audit-gated)">
        <p style={styles.bodyMuted}>
          Opening this view writes a row to the audit log. Use only for active Rx
          review or pharmacist consultation.
        </p>
        {!showMedical ? (
          <button
            onClick={() => setShowMedical(true)}
            style={{ ...styles.btnSecondary, alignSelf: 'flex-start' }}
          >
            View medical profile
          </button>
        ) : medicalQ.isLoading ? (
          <div style={styles.bodyMuted}>Loading…</div>
        ) : medicalQ.data ? (
          <div style={styles.medicalCard}>
            <Field label="Allergies">
              {medicalQ.data.medical.allergies.length
                ? medicalQ.data.medical.allergies.join(', ')
                : '—'}
            </Field>
            <Field label="Conditions">
              {medicalQ.data.medical.conditions.length
                ? medicalQ.data.medical.conditions.join(', ')
                : '—'}
            </Field>
            <Field label="Pregnancy">
              {medicalQ.data.medical.pregnancyStatus ?? '—'}
            </Field>
            <Field label="Blood type">
              {medicalQ.data.medical.bloodType ?? '—'}
            </Field>
            {medicalQ.data.medical.note ? (
              <p style={styles.bodyMuted}>{medicalQ.data.medical.note}</p>
            ) : null}
          </div>
        ) : null}
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionTitle}>{title}</div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      <div style={styles.fieldValue}>{children}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.lockedCard}>
      <div style={styles.lockedTitle}>Search-only by design</div>
      <p style={styles.lockedBody}>
        We do not show a list of all customers. To look someone up you need
        their phone, email, or an order ID. Every search and profile view is
        written to the audit log so we know who looked at what.
      </p>
      <ul style={styles.lockedList}>
        <li>Phone: e.g. <span className="mono">0501234567</span> or <span className="mono">+966501234567</span></li>
        <li>Email: e.g. <span className="mono">name@example.com</span></li>
        <li>Order ID: full UUID (the "EST-XXXX" short-form lookup is a TODO).</li>
      </ul>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={styles.card}>{children}</div>;
}

const styles: Record<string, React.CSSProperties> = {
  shell: { padding: '24px 28px' },
  searchForm: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#FFFFFF',
    border: '1px solid #EDE6EC',
    borderRadius: 8,
    padding: '8px 8px 8px 12px',
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: 14,
    padding: '6px 0',
  },
  btnPrimary: {
    background: '#B02080',
    color: '#FFFFFF',
    border: 'none',
    padding: '8px 14px',
    borderRadius: 6,
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
  card: {
    background: '#FFFFFF',
    border: '1px solid #EDE6EC',
    borderRadius: 12,
    padding: 24,
    maxWidth: 720,
    fontSize: 13,
    color: '#4A3A4A',
  },
  lockedCard: {
    background: '#FFFFFF',
    border: '1px solid #EDE6EC',
    borderRadius: 12,
    padding: '32px 32px',
    maxWidth: 640,
  },
  lockedTitle: { fontSize: 16, fontWeight: 600, marginBottom: 8 },
  lockedBody: {
    color: '#4A3A4A',
    fontSize: 13,
    lineHeight: 1.6,
    margin: '0 0 12px',
  },
  lockedList: {
    fontSize: 13,
    color: '#4A3A4A',
    lineHeight: 1.8,
    paddingLeft: 18,
    margin: 0,
  },
  profileCard: {
    background: '#FFFFFF',
    border: '1px solid #EDE6EC',
    borderRadius: 12,
    padding: 24,
    maxWidth: 720,
  },
  profileHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  profileEyebrow: {
    fontSize: 11,
    fontWeight: 600,
    color: '#8A7A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: -0.3,
    margin: 0,
  },
  profileMeta: { fontSize: 12, color: '#8A7A8A', marginTop: 4 },
  fullProfile: {
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
    paddingTop: 16,
    borderTop: '1px solid #EDE6EC',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: 600,
    letterSpacing: 0.5,
    color: '#8A7A8A',
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  bodyMuted: {
    fontSize: 13,
    color: '#8A7A8A',
    lineHeight: 1.6,
    margin: 0,
  },
  orderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 0',
    borderBottom: '1px solid #EDE6EC',
    fontSize: 13,
  },
  orderId: { fontSize: 12, color: '#4A3A4A', minWidth: 80 },
  orderTotal: { fontSize: 13, color: '#1A0F1A', textAlign: 'right' },
  orderDate: { fontSize: 11, color: '#8A7A8A' },
  medicalCard: {
    background: '#FBF7FA',
    border: '1px solid #EDE6EC',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  field: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr',
    gap: 16,
    fontSize: 13,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#8A7A8A',
  },
  fieldValue: { color: '#1A0F1A' },
};
