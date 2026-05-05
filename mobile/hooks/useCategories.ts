/**
 * Firestore Categories Hook
 *
 * Fetches categories from the Firestore `categories` collection.
 * Also provides banners and health tips.
 */

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  categories as fallbackCategories,
  banners as fallbackBanners,
  healthTips as fallbackHealthTips,
  type Category,
  type Banner,
} from '../constants/mockData';

// ── Categories ──────────────────────────────────────────────

export function useCategories() {
  // Initialize with fallback so the UI is never empty before Firestore
  // returns its first snapshot (which may never arrive without real creds).
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
        setCategories(items.length > 0 ? items : fallbackCategories);
        setLoading(false);
      },
      (err) => {
        console.error('Categories fetch error, using fallback data:', err);
        setCategories(fallbackCategories);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { categories, loading };
}

// ── Banners ─────────────────────────────────────────────────

export function useBanners() {
  const [banners, setBanners] = useState<Banner[]>(fallbackBanners);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'banners'), orderBy('sortOrder', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Banner[];
        setBanners(items.length > 0 ? items : fallbackBanners);
        setLoading(false);
      },
      (err) => {
        console.error('Banners fetch error, using fallback data:', err);
        setBanners(fallbackBanners);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { banners, loading };
}

// ── Health Tips ──────────────────────────────────────────────

export interface HealthTip {
  id: string;
  textAr: string;
  textEn: string;
}

export function useHealthTips() {
  const [tips, setTips] = useState<HealthTip[]>(fallbackHealthTips);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'healthTips'),
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HealthTip[];
        setTips(items.length > 0 ? items : fallbackHealthTips);
        setLoading(false);
      },
      () => {
        setTips(fallbackHealthTips);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { tips, loading };
}
