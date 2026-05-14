import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/lib/api';
import { useAuth } from './AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@estrogen.sa');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrorCode(null);
    try {
      await signIn(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorCode(err.code);
      } else {
        setErrorCode('unexpected_error');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.shell}>
      <form onSubmit={onSubmit} style={styles.card}>
        <div style={styles.brandRow}>
          <div style={styles.brandMark}>E</div>
          <div style={styles.brandWord}>Estrogen</div>
        </div>
        <h1 style={styles.title}>Operator's Cockpit</h1>
        <p style={styles.subtitle}>Staff sign-in</p>

        <label style={styles.label}>Email</label>
        <input
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <label style={styles.label}>Password</label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />

        {errorCode ? (
          <div style={styles.error}>{humanizeError(errorCode)}</div>
        ) : null}

        <button type="submit" disabled={busy || !password} style={busy ? styles.btnBusy : styles.btn}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p style={styles.footnote}>
          For demo: <span className="mono">admin@estrogen.sa</span> /{' '}
          <span className="mono">admin12345</span>
        </p>
      </form>
    </div>
  );
}

function humanizeError(code: string): string {
  switch (code) {
    case 'invalid_credentials':
    case 'http_401':
      return 'Wrong email or password.';
    case 'staff_only':
      return 'This entrance is for staff accounts only.';
    case 'network_error':
      return 'Could not reach the backend. Is `npm run dev` running in `backend/`?';
    default:
      return `Sign-in failed (${code}).`;
  }
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    background: '#FFFFFF',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#FFFFFF',
    border: '1px solid #ECE5EC',
    borderRadius: 16,
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  brandMark: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: '#752A79',
    color: '#FFFFFF',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 700,
    fontSize: 13,
  },
  brandWord: {
    fontWeight: 700,
    letterSpacing: -0.3,
    fontSize: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.4,
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: 13,
    color: '#8A7A8A',
    margin: '0 0 20px',
  },
  label: {
    fontSize: 11,
    color: '#8A7A8A',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ECE5EC',
    borderRadius: 8,
    background: '#FFFFFF',
    fontSize: 14,
    marginTop: 4,
    color: '#1A0F1A',
  },
  error: {
    marginTop: 14,
    padding: '10px 12px',
    background: '#FBE0E4',
    color: '#C8253A',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
  },
  btn: {
    marginTop: 20,
    background: '#752A79',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    padding: '11px 14px',
    fontWeight: 600,
    fontSize: 14,
  },
  btnBusy: {
    marginTop: 20,
    background: '#D89BC2',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 8,
    padding: '11px 14px',
    fontWeight: 600,
    fontSize: 14,
    cursor: 'wait',
  },
  footnote: {
    marginTop: 16,
    fontSize: 11,
    color: '#8A7A8A',
    textAlign: 'center',
  },
};
