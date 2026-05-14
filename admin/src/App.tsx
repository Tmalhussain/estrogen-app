import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/auth/AuthContext';
import LoginPage from '@/auth/LoginPage';
import AppShell from '@/components/AppShell';
import Today from '@/pages/Today';
import Catalog from '@/pages/Catalog';
import Customers from '@/pages/Customers';
import Prescriptions from '@/pages/Prescriptions';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<Today />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/prescriptions" element={<Prescriptions />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function RequireAuth() {
  const { status } = useAuth();
  if (status === 'loading') return <Loading />;
  if (status === 'signed-out') return <Navigate to="/login" replace />;
  return <Outlet />;
}

function Loading() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', color: '#8A7A8A' }}>
      <div>Loading…</div>
    </div>
  );
}
