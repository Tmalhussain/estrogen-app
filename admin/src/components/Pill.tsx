import type { CSSProperties, ReactNode } from 'react';
import { colors } from '@/styles/theme';

export type PillTone =
  | 'placed'
  | 'preparing'
  | 'dispatched'
  | 'delivered'
  | 'stuck'
  | 'info'
  | 'neutral';

const TONE: Record<PillTone, { bg: string; fg: string }> = {
  placed: { bg: colors.bgAlt, fg: colors.textSoft },
  preparing: { bg: colors.warningSoft, fg: colors.warning },
  dispatched: { bg: colors.infoSoft, fg: colors.info },
  delivered: { bg: colors.successSoft, fg: colors.success },
  stuck: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.brandSoft, fg: colors.primaryDark },
  neutral: { bg: colors.bgAlt, fg: colors.textSoft },
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
  padding: '3px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 600,
  lineHeight: 1,
};
