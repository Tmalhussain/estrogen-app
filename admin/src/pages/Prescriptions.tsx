import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError, type PendingPrescription } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Pill } from '@/components/Pill';
import { colors, font, radius, space } from '@/styles/theme';

/**
 * Prescriptions — pharmacist review queue.
 *
 * Approve writes `approvedBy` + `approvedAt` and unlocks the customer's
 * order. Reject records the reason. Both writes go through the
 * audit-coupled txn on the backend.
 */
export default function Prescriptions() {
  const qc = useQueryClient();
  const queueQ = useQuery({
    queryKey: ['rx-pending'],
    queryFn: () => api.pendingPrescriptions(),
  });

  const items = queueQ.data?.prescriptions ?? [];

  return (
    <div style={styles.shell}>
      <PageHeader
        title="Prescriptions"
        subtitle="Pharmacist review queue · regulated flow"
      />

      <div style={styles.tabs}>
        <Tab label="Pending review" count={String(items.length)} active />
      </div>

      {queueQ.isLoading ? (
        <div style={styles.empty}>Loading queue…</div>
      ) : queueQ.isError ? (
        <div style={styles.empty}>
          Could not reach the backend.{' '}
          {queueQ.error instanceof ApiError ? `(${queueQ.error.code})` : ''}
        </div>
      ) : items.length === 0 ? (
        <EmptyQueue />
      ) : (
        <div style={styles.list}>
          {items.map((p) => (
            <RxCard
              key={p.id}
              rx={p}
              onResolved={() => qc.invalidateQueries({ queryKey: ['rx-pending'] })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Tab({
  label,
  count,
  active,
}: {
  label: string;
  count: string;
  active?: boolean;
}) {
  return (
    <div style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}>
      <span>{label}</span>
      <span className="mono" style={styles.tabCount}>
        {count}
      </span>
    </div>
  );
}

function RxCard({
  rx,
  onResolved,
}: {
  rx: PendingPrescription;
  onResolved: () => void;
}) {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');

  const approveM = useMutation({
    mutationFn: () => api.approvePrescription(rx.id),
    onSuccess: onResolved,
  });
  const rejectM = useMutation({
    mutationFn: () => api.rejectPrescription(rx.id, reason || 'Insufficient documentation'),
    onSuccess: () => {
      setRejectMode(false);
      setReason('');
      onResolved();
    },
  });

  const customerName =
    [rx.customerFirstName, rx.customerLastName].filter(Boolean).join(' ').trim() ||
    'Estrogen customer';
  const sinceMin = Math.round(
    (Date.now() - new Date(rx.createdAt).getTime()) / 60_000
  );

  return (
    <div style={styles.card}>
      <div style={styles.cardLeft}>
        {rx.imagePath ? (
          <img src={rx.imagePath} alt="Prescription" style={styles.image} />
        ) : (
          <div style={styles.imagePlaceholder}>No image attached</div>
        )}
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardHead}>
          <div>
            <div style={styles.eyebrow}>RX REVIEW</div>
            <h3 style={styles.title}>
              {rx.productName ?? '—'}
              {rx.productNameAr ? (
                <span className="ar" style={styles.titleAr}> · {rx.productNameAr}</span>
              ) : null}
            </h3>
          </div>
          <Pill tone="preparing">Pending {sinceMin}m</Pill>
        </div>

        <dl style={styles.dl}>
          <Row label="Customer" value={customerName} />
          <Row
            label="Phone"
            value={rx.customerPhone ?? '—'}
            mono
          />
          <Row label="Prescribed by" value={rx.prescribedBy ?? '—'} />
          {rx.notes ? <Row label="Notes" value={rx.notes} /> : null}
        </dl>

        {!rejectMode ? (
          <div style={styles.actions}>
            <button
              onClick={() => approveM.mutate()}
              disabled={approveM.isPending}
              style={styles.btnPrimary}
            >
              {approveM.isPending ? 'Approving…' : 'Approve'}
            </button>
            <button
              onClick={() => setRejectMode(true)}
              disabled={rejectM.isPending}
              style={styles.btnGhost}
            >
              Reject
            </button>
            {approveM.error ? (
              <span style={styles.error}>
                {approveM.error instanceof ApiError ? approveM.error.code : 'failed'}
              </span>
            ) : null}
          </div>
        ) : (
          <div style={styles.rejectBlock}>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for rejection (sent to the customer)"
              rows={2}
              style={styles.textarea}
            />
            <div style={styles.actions}>
              <button
                onClick={() => rejectM.mutate()}
                disabled={rejectM.isPending}
                style={styles.btnDanger}
              >
                {rejectM.isPending ? 'Rejecting…' : 'Confirm reject'}
              </button>
              <button
                onClick={() => {
                  setRejectMode(false);
                  setReason('');
                }}
                style={styles.btnGhost}
              >
                Cancel
              </button>
              {rejectM.error ? (
                <span style={styles.error}>
                  {rejectM.error instanceof ApiError ? rejectM.error.code : 'failed'}
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <>
      <dt style={styles.dt}>{label}</dt>
      <dd style={styles.dd} className={mono ? 'mono' : undefined}>
        {value}
      </dd>
    </>
  );
}

function EmptyQueue() {
  return (
    <div style={styles.empty}>
      <h3 style={styles.emptyTitle}>The queue is empty</h3>
      <p style={styles.emptyBody}>
        When customers upload prescriptions through the mobile app, they appear
        here for a licensed pharmacist to review.
      </p>
      <div style={styles.howCard}>
        <div style={styles.howTitle}>How review works</div>
        <ol style={styles.howList}>
          <li>Customer uploads an Rx photo from the mobile app.</li>
          <li>The card appears here with the image and the customer's medical context.</li>
          <li>Approve unlocks the customer's order. Reject sends a templated SMS.</li>
          <li>The audit log records who approved and when.</li>
        </ol>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { padding: `${space.xxxl}px ${space.xxl}px`, background: colors.bg },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 20,
    borderBottom: `1px solid ${colors.border}`,
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    fontSize: font.size.sm,
    fontWeight: 500,
    color: colors.textMuted,
    borderBottom: '2px solid transparent',
    marginBottom: -1,
  },
  tabActive: {
    color: colors.text,
    fontWeight: 600,
    borderBottomColor: colors.primary,
  },
  tabCount: { fontSize: font.size.xs, color: colors.textMuted },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: space.lg,
    maxWidth: 920,
  },
  card: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    gap: 18,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  cardLeft: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  image: {
    width: '100%',
    aspectRatio: '3 / 4',
    objectFit: 'cover',
    borderRadius: radius.md,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: '3 / 4',
    background: colors.bg,
    border: `1px dashed ${colors.border}`,
    borderRadius: radius.md,
    color: colors.textMuted,
    fontSize: font.size.xs,
    display: 'grid',
    placeItems: 'center',
    textAlign: 'center',
    padding: 12,
  },
  cardBody: { display: 'flex', flexDirection: 'column', gap: 12 },
  cardHead: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrow: {
    fontSize: font.size.xxs,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    fontSize: font.size.lg,
    fontWeight: 700,
    margin: 0,
    letterSpacing: -0.2,
    color: colors.text,
  },
  titleAr: { fontSize: font.size.sm, color: colors.textMuted, fontWeight: 500 },
  dl: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr',
    margin: 0,
    gap: '6px 16px',
  },
  dt: {
    fontSize: font.size.xxs,
    fontWeight: 600,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dd: { margin: 0, fontSize: font.size.sm, color: colors.text },
  actions: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  rejectBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 6,
  },
  textarea: {
    width: '100%',
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '10px 12px',
    background: colors.bg,
    fontSize: font.size.sm,
    resize: 'vertical',
    color: colors.text,
  },
  btnPrimary: {
    background: colors.primary,
    color: colors.onPrimary,
    border: 'none',
    padding: '8px 14px',
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: font.size.sm,
  },
  btnGhost: {
    background: 'transparent',
    color: colors.textSoft,
    border: `1px solid ${colors.border}`,
    padding: '8px 14px',
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: font.size.sm,
  },
  btnDanger: {
    background: colors.danger,
    color: colors.onPrimary,
    border: 'none',
    padding: '8px 14px',
    borderRadius: radius.md,
    fontWeight: 600,
    fontSize: font.size.sm,
  },
  error: { color: colors.danger, fontSize: font.size.xs, fontWeight: 500 },
  empty: {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    padding: 32,
    textAlign: 'center',
    maxWidth: 720,
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, margin: '0 0 8px' },
  emptyBody: {
    color: colors.textSoft,
    fontSize: font.size.sm,
    lineHeight: 1.6,
    margin: '0 auto 24px',
    maxWidth: 480,
  },
  howCard: {
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: 20,
    textAlign: 'left',
  },
  howTitle: {
    fontSize: font.size.xxs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 600,
    color: colors.textMuted,
    marginBottom: 8,
  },
  howList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: font.size.sm,
    lineHeight: 1.8,
    color: colors.textSoft,
  },
};
