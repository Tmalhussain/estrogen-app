import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
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
                    background: isActive ? '#752A79' : 'transparent',
                  }}
                />
                <span style={{ display: 'inline-flex', width: 16, color: isActive ? '#5A1F5E' : '#8A7A8A' }}>
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
    background: '#FFFFFF',
    borderRight: '1px solid #ECE5EC',
    padding: '20px 14px',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 8px 24px',
  },
  brandMark: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    background: '#752A79',
    color: '#FFFFFF',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    fontSize: 12,
  },
  brandWord: {
    fontWeight: 700,
    letterSpacing: -0.3,
    fontSize: 15,
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
    padding: '9px 10px',
    borderRadius: 8,
    color: '#4A3A4A',
    fontWeight: 500,
    fontSize: 13,
    textDecoration: 'none',
  },
  navItemActive: {
    background: '#F3E5F5',
    color: '#5A1F5E',
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
    paddingTop: 16,
    borderTop: '1px solid #ECE5EC',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 12,
    color: '#4A3A4A',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#F3E5F5',
    color: '#752A79',
    display: 'grid',
    placeItems: 'center',
    fontSize: 11,
    fontWeight: 700,
    flexShrink: 0,
  },
  actorName: {
    fontWeight: 600,
    fontSize: 12,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  actorRole: {
    fontSize: 11,
    color: '#8A7A8A',
  },
  signOutBtn: {
    background: 'transparent',
    border: 'none',
    color: '#8A7A8A',
    width: 28,
    height: 28,
    borderRadius: 6,
    display: 'grid',
    placeItems: 'center',
  },
};
