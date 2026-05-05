import './globals.css';
import { AdminLangProvider } from '../i18n/AdminLangContext';

export const metadata = {
  title: 'Estrogen Pharmacy — Admin Panel',
  description: 'Estrogen Pharmacy — Admin & Pharmacist Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)]">
        <AdminLangProvider>
          {children}
        </AdminLangProvider>
      </body>
    </html>
  );
}
