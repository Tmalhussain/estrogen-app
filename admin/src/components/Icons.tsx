/**
 * Inline SVG icons. We avoid an icon-library dependency for the small
 * set we need; if this grows past ~10 icons swap to lucide-react.
 *
 * All icons render at 16×16 by default and inherit currentColor so they
 * tint with the surrounding text color.
 */

type IconProps = { size?: number };

function Svg({
  size = 16,
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const IconCalendar = (p: IconProps = {}) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const IconCatalog = (p: IconProps = {}) => (
  <Svg {...p}>
    <path d="M4 4h16v6H4zM4 14h16v6H4zM8 7h0M8 17h0" />
  </Svg>
);

export const IconCustomers = (p: IconProps = {}) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c1-3.5 3.5-5 6-5s5 1.5 6 5M16 11a3 3 0 100-6M21 20c-.6-2.4-2-4-4-4.5" />
  </Svg>
);

export const IconPrescription = (p: IconProps = {}) => (
  <Svg {...p}>
    <path d="M6 4v16M6 4h6a3 3 0 010 6H6M14 14l6 6M14 20l6-6" />
  </Svg>
);

export const IconSearch = (p: IconProps = {}) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6" />
    <path d="M20 20l-3.5-3.5" />
  </Svg>
);

export const IconClose = (p: IconProps = {}) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const IconSignOut = (p: IconProps = {}) => (
  <Svg {...p}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </Svg>
);

export const IconAlert = (p: IconProps = {}) => (
  <Svg {...p}>
    <path d="M12 2L1 21h22L12 2zM12 9v5M12 17.5h.01" />
  </Svg>
);

export const IconCheck = (p: IconProps = {}) => (
  <Svg {...p}>
    <path d="M5 12l5 5L20 6" />
  </Svg>
);

export const IconChevronRight = (p: IconProps = {}) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);

export const IconPlus = (p: IconProps = {}) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
