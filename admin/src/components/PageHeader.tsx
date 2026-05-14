import type { ReactNode } from 'react';
import { colors, font } from '@/styles/theme';

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
    marginBottom: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: 0,
    margin: '0 0 4px',
    color: colors.text,
  },
  sub: {
    color: colors.textMuted,
    fontSize: font.size.sm,
    maxWidth: 720,
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexShrink: 0,
  },
};
