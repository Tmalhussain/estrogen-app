import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { colors, radius, space, font } from '@/styles/theme';
import {
  IconCalendar,
  IconCatalog,
  IconCustomers,
  IconPrescription,
  IconSignOut,
} from './Icons';

const NAV_ITEMS: { to: string; label: string; Icon: () => React.ReactElement }[] = [
  { to: '/', label: 'Today', Icon: IconCalendar },
  { to: '/catalog', label: 'Catalog', Icon: IconCatalog },
  { to: '/customers', label: 'Customers', Icon: IconCustomers },
  { to: '/prescriptions', label: 'Prescriptions', Icon: IconPrescription },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const initial =
    user?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'E';
  const roleLabel =
    user?.role === 'owner'
      ? 'Owner'
      : user?.role === 'admin'
      ? 'Admin'
      : user?.role === 'pharmacist'
      ? 'Pharmacist'
      : 'Staff';

  return (
    <aside style={styles.aside}>
      <div style={styles.brandRow}>
        <div style={styles.brandMark}>E</div>
        <div style={styles.brandWord}>Estrogen</div>
      </div>

      <nav style={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              ...styles.navItem,
              ...(isActive ? styles.navItemActive : {}),
            })}
          >
            {({ isActive }) => (
              <>
                <span
                  style={{
                    ...styles.dot,
                    background: isActive ? colors.primary : 'transparent',
                  }}
                />
                <span style={{ display: 'inline-flex', width: 16, color: isActive ? colors.primaryDark : colors.textMuted }}>
                  <item.Icon />
                </span>
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={styles.footer}>
        <div style={styles.avatar}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.actorName}>{user?.firstName || 'Operator'}</div>
          <div style={styles.actorRole}>{roleLabel}</div>
        </div>
        <button
          onClick={() => {
            signOut();
            navigate('/login', { replace: true });
          }}
          title="Sign out"
          style={styles.signOutBtn}
        >
          <IconSignOut />
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  aside: {
    background: colors.bg,
    borderRight: `1px solid ${colors.border}`,
    padding: `${space.xl}px ${space.md}px`,
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
    padding: `4px ${space.md}px 24px`,
  },
  brandMark: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    background: colors.primary,
    color: colors.onPrimary,
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    fontSize: 12,
  },
  brandWord: {
    fontWeight: 700,
    letterSpacing: -0.3,
    fontSize: 15,
    color: colors.text,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 12px',
    borderRadius: radius.sm,
    color: colors.textSoft,
    fontWeight: 500,
    fontSize: font.size.sm,
    textDecoration: 'none',
  },
  navItemActive: {
    background: colors.brandSoft,
    color: colors.primaryDark,
    fontWeight: 600,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: space.lg,
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'center',
    gap: space.sm,
    fontSize: 12,
    color: colors.textSoft,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    background: colors.brandSoft,
    color: colors.primary,
    display: 'grid',
    placeItems: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  actorName: {
    fontWeight: 600,
    fontSize: font.size.xs,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actorRole: {
    fontSize: font.size.xxs,
    color: colors.textMuted,
  },
  signOutBtn: {
    background: 'transparent',
    border: 'none',
    color: colors.textMuted,
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    display: 'grid',
    placeItems: 'center',
  },
};
