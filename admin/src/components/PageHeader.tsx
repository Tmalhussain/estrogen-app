import type { ReactNode } from 'react';

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div style={styles.row}>
      <div>
        <h2 style={styles.title}>{title}</h2>
        {subtitle ? <div style={styles.sub}>{subtitle}</div> : null}
      </div>
      {actions ? <div style={styles.actions}>{actions}</div> : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.4,
    margin: '0 0 4px',
  },
  sub: {
    color: '#8A7A8A',
    fontSize: 13,
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexShrink: 0,
  },
};
