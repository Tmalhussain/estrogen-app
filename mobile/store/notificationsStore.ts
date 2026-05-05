/**
 * Notifications store — Firestore-backed.
 *
 * Re-exports the Firestore hook as the primary API.
 * Legacy types kept for backward compatibility.
 */

// Re-export the Firestore hook as the primary API
export { useNotifications, type FirestoreNotification } from '../hooks/useNotifications';

// ── Legacy Types ─────────────────────────────────────────────

export interface AppNotification {
  id: string;
  type: 'order' | 'promo' | 'health' | 'system';
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  timestamp: number;
  read: boolean;
}

/**
 * @deprecated Use the `useNotifications()` hook instead.
 */
export const useNotificationsStore = {
  getState: () => ({
    notifications: [] as AppNotification[],
    initialized: true,
    initSeedData: () => {},
    addNotification: () => { console.warn('Use useNotifications() hook'); },
    markAsRead: () => { console.warn('Use useNotifications() hook'); },
    markAllRead: () => { console.warn('Use useNotifications() hook'); },
    unreadCount: () => 0,
  }),
};
