import type { CSSProperties, ReactNode } from 'react';

export type PillTone =
  | 'placed'
  | 'preparing'
  | 'dispatched'
  | 'delivered'
  | 'stuck'
  | 'info'
  | 'neutral';

const TONE: Record<PillTone, { bg: string; fg: string }> = {
  placed: { bg: '#FAF7FA', fg: '#4A3A4A' },
  preparing: { bg: '#FBEDD3', fg: '#C77B0A' },
  dispatched: { bg: '#DDE9F5', fg: '#2563A8' },
  delivered: { bg: '#DDF1E7', fg: '#1F8F5F' },
  stuck: { bg: '#FBE0E4', fg: '#C8253A' },
  info: { bg: '#F3E5F5', fg: '#5A1F5E' },
  neutral: { bg: '#FAF7FA', fg: '#4A3A4A' },
};

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: PillTone;
  children: ReactNode;
}) {
  const { bg, fg } = TONE[tone];
  return (
    <span
      style={{
        ...base,
        background: bg,
        color: fg,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'currentColor',
        }}
      />
      {children}
    </span>
  );
}

const base: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '3px 9px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1,
};
