/**
 * Firestore Notifications Hook
 *
 * Real-time notification listener for the authenticated user.
 * Notifications are created by Cloud Functions triggers.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// ── Types ────────────────────────────────────────────────────

export interface FirestoreNotification {
  id: string;
  userId: string;
  type: 'order' | 'promo' | 'health' | 'system';
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  read: boolean;
  timestamp: number;
  linkedOrderId?: string;
}

// ── Hook ─────────────────────────────────────────────────────

export function useNotifications(maxCount: number = 50) {
  const [notifications, setNotifications] = useState<FirestoreNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(maxCount)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            timestamp: data.timestamp instanceof Timestamp
              ? data.timestamp.toMillis()
              : data.timestamp || Date.now(),
          } as FirestoreNotification;
        });
        setNotifications(items);
        setUnreadCount(items.filter((n) => !n.read).length);
        setLoading(false);
      },
      (err) => {
        console.error('Notifications fetch error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser?.uid, maxCount]);

  // ── Mark single as read ──────────────────────────────────
  const markAsRead = useCallback(async (notificationId: string) => {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
    });
  }, []);

  // ── Mark all as read ─────────────────────────────────────
  const markAllRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((n) => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    await batch.commit();
  }, [notifications]);

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllRead,
  };
}
