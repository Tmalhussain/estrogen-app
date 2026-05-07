import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppShell() {
  return (
    <div style={styles.shell}>
      <Sidebar />
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    display: 'grid',
    gridTemplateColumns: '220px 1fr',
    minHeight: '100vh',
    background: '#FBF7FA',
  },
  main: {
    overflow: 'auto',
    minHeight: '100vh',
  },
};
