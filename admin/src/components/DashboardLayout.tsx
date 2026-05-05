'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { isLoggedIn, subscribeToAuthState } from '../lib/adminAuth';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Subscribe to Firebase Auth state changes so the localStorage cache
    // stays in sync with the real auth state across reloads, silent token
    // refresh, and explicit sign-out from another tab.
    const unsubscribe = subscribeToAuthState((session) => {
      if (!session) {
        router.replace('/login');
      } else {
        setChecked(true);
      }
    });

    // Optimistic gate based on the cached session. If the cache says we're
    // logged in, render through immediately; the subscription above will
    // bounce us to /login if Firebase disagrees within a tick.
    if (isLoggedIn()) {
      setChecked(true);
    } else {
      router.replace('/login');
    }

    return unsubscribe;
  }, [router]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
