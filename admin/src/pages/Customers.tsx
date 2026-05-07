import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { IconSearch } from '@/components/Icons';

/**
 * Customers — search-only by design.
 *
 * LOCKDOWN: This page does NOT and MUST NEVER list all customers, even
 * paginated. PDPL constraint + product trust constraint. The only way
 * to find a customer is to know something specific about them: their
 * phone, email, or order ID.
 *
 * The backend search endpoint (GET /staff/customers?phone=...) lands
 * in the next backend session along with the audit middleware that
 * logs every customer-data read. See TODOS.md.
 */
export default function Customers() {
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearched(query.trim());
  }

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
          placeholder="+966 5..., name@example.com, or EST-2049"
          style={styles.searchInput}
          autoFocus
        />
        <button type="submit" style={styles.btnPrimary}>
          Search
        </button>
      </form>

      {!searched ? (
        <EmptyState />
      ) : (
        <PendingResult query={searched} />
      )}
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
        <li>Order ID: e.g. <span className="mono">EST-2049</span></li>
      </ul>
    </div>
  );
}

function PendingResult({ query }: { query: string }) {
  return (
    <div style={styles.pendingCard}>
      <div style={styles.pendingTitle}>
        Search executed: <span className="mono">{query}</span>
      </div>
      <p style={styles.pendingBody}>
        The backend customer-search endpoint (<span className="mono">GET /staff/customers?phone=…</span>)
        lands in the next backend session, alongside the audit-log middleware that records
        every read. Until that endpoint exists, this page can't return a profile.
      </p>
      <p style={styles.pendingBody}>
        See TODOS.md → "Backend rec 6A — staff customer endpoints + audit on reads".
      </p>
    </div>
  );
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
  lockedCard: {
    background: '#FFFFFF',
    border: '1px solid #EDE6EC',
    borderRadius: 12,
    padding: '32px 32px',
    maxWidth: 640,
  },
  lockedTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 8,
  },
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
  pendingCard: {
    background: '#FBEDD3',
    border: '1px solid #C77B0A',
    borderRadius: 12,
    padding: 24,
    maxWidth: 640,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#7A4D08',
    marginBottom: 8,
  },
  pendingBody: {
    color: '#7A4D08',
    fontSize: 13,
    lineHeight: 1.6,
    margin: '8px 0 0',
  },
};
