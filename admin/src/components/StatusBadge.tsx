interface StatusBadgeProps {
  label: string;
  color: string;
  bg: string;
}

export default function StatusBadge({ label, color, bg }: StatusBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  );
}
