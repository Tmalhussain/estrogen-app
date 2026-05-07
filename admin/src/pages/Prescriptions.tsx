import { PageHeader } from '@/components/PageHeader';
import { Pill } from '@/components/Pill';

/**
 * Prescriptions — pharmacist review queue.
 *
 * In v1 each pending Rx renders as a card with the customer name, the
 * product the Rx is attached to, the uploaded image at full size, and
 * approve/reject buttons. Approve writes `approvedBy = caller.userId +
 * approvedAt`, unlocks the Rx for that customer, and the order proceeds.
 * Reject sends a templated SMS via the existing SMS provider.
 *
 * The backend endpoints (GET /staff/prescriptions/pending,
 * POST /staff/prescriptions/:id/approve, POST /staff/prescriptions/:id/reject)
 * are not yet shipped. See TODOS.md.
 */
export default function Prescriptions() {
  return (
    <div style={styles.shell}>
      <PageHeader
        title="Prescriptions"
        subtitle="Pharmacist review queue · regulated flow"
      />

      <div style={styles.tabs}>
        <Tab label="Pending review" count="0" active />
        <Tab label="Approved" count="—" />
        <Tab label="Rejected" count="—" />
      </div>

      <div style={styles.empty}>
        <Pill tone="preparing">Awaiting backend</Pill>
        <h3 style={styles.emptyTitle}>The pharmacist review queue is empty</h3>
        <p style={styles.emptyBody}>
          When customers upload prescriptions through the mobile app, they land
          here for a licensed pharmacist to review. The backend endpoints land
          in the next session — see TODOS.md.
        </p>

        <div style={styles.howCard}>
          <div style={styles.howTitle}>How review works (v1)</div>
          <ol style={styles.howList}>
            <li>Customer uploads an Rx photo from the mobile app.</li>
            <li>It appears here as a card. Click to open the image at full size.</li>
            <li>The customer's medical profile is shown alongside (allergies, conditions). Opening it writes an audit row.</li>
            <li>Approve or reject. Approval lets the customer's order proceed; rejection sends a templated SMS.</li>
            <li>The audit log records who approved and when.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Tab({ label, count, active }: { label: string; count: string; active?: boolean }) {
  return (
    <div style={{ ...styles.tab, ...(active ? styles.tabActive : {}) }}>
      <span>{label}</span>
      <span className="mono" style={styles.tabCount}>{count}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { padding: '24px 28px' },
  tabs: {
    display: 'flex',
    gap: 4,
    marginBottom: 20,
    borderBottom: '1px solid #EDE6EC',
  },
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 500,
    color: '#8A7A8A',
    borderBottom: '2px solid transparent',
    marginBottom: -1,
  },
  tabActive: {
    color: '#1A0F1A',
    fontWeight: 600,
    borderBottomColor: '#B02080',
  },
  tabCount: { fontSize: 12, color: '#8A7A8A' },
  empty: {
    background: '#FFFFFF',
    border: '1px solid #EDE6EC',
    borderRadius: 12,
    padding: 32,
    textAlign: 'center',
    maxWidth: 720,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: '12px 0 8px',
  },
  emptyBody: {
    color: '#4A3A4A',
    fontSize: 13,
    lineHeight: 1.6,
    margin: '0 auto 24px',
    maxWidth: 480,
  },
  howCard: {
    background: '#FBF7FA',
    border: '1px solid #EDE6EC',
    borderRadius: 8,
    padding: 20,
    textAlign: 'left',
  },
  howTitle: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: 600,
    color: '#8A7A8A',
    marginBottom: 8,
  },
  howList: {
    margin: 0,
    paddingLeft: 18,
    fontSize: 13,
    lineHeight: 1.8,
    color: '#4A3A4A',
  },
};
