import './globals.css';
import { DM_Sans, Cairo } from 'next/font/google';
import { AdminLangProvider } from '../i18n/AdminLangContext';

// Locked design system fonts (DESIGN.md):
// DM Sans for English / Latin, Cairo for Arabic. Both are humanist
// sans-serifs with similar x-height proportions so they harmonize
// across mixed-script content.
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-app',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-app-ar',
});

export const metadata = {
  title: 'إستروجين — Estrogen Pharmacy Admin',
  description: 'Estrogen Pharmacy — Admin & Pharmacist Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${dmSans.variable} ${cairo.variable}`}
    >
      <body className="min-h-screen bg-[var(--background)]">
        <AdminLangProvider>
          {children}
        </AdminLangProvider>
      </body>
    </html>
  );
}
