/**
 * Firestore Products Hook
 *
 * Fetches products from the Firestore `products` collection
 * with real-time updates, filtering, and search.
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
  getDoc,
  getDocs,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { products as fallbackProducts, type Product } from '../constants/mockData';

// ── All products with real-time updates ─────────────────────

export function useProducts(options?: {
  categoryId?: string;
  inStockOnly?: boolean;
  maxResults?: number;
}) {
  // Apply the same filter to the fallback dataset so the UI matches
  // the requested options when Firestore is empty / unconfigured.
  const applyFallbackFilters = (list: Product[]): Product[] => {
    let out = list;
    if (options?.categoryId) out = out.filter((p) => p.categoryId === options.categoryId);
    if (options?.inStockOnly) out = out.filter((p) => p.inStock);
    if (options?.maxResults) out = out.slice(0, options.maxResults);
    return out;
  };

  // Seed initial state with fallback data so the UI never shows an
  // empty grid while waiting for the first Firestore snapshot (which
  // may never arrive when Firestore credentials are placeholders).
  const [products, setProducts] = useState<Product[]>(() =>
    applyFallbackFilters(fallbackProducts),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const constraints: QueryConstraint[] = [];

    if (options?.categoryId) {
      constraints.push(where('categoryId', '==', options.categoryId));
    }
    if (options?.inStockOnly) {
      constraints.push(where('inStock', '==', true));
    }
    if (options?.maxResults) {
      constraints.push(limit(options.maxResults));
    }

    const q = query(collection(db, 'products'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];
        setProducts(items.length > 0 ? items : applyFallbackFilters(fallbackProducts));
        setLoading(false);
      },
      (err) => {
        console.error('Products fetch error, using fallback data:', err);
        setError(err.message);
        setProducts(applyFallbackFilters(fallbackProducts));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [options?.categoryId, options?.inStockOnly, options?.maxResults]);

  return { products, loading, error };
}

// ── Single product by ID ────────────────────────────────────

export function useProduct(productId: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'products', productId),
      (snap) => {
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() } as Product);
        } else {
          // Fall back to local mock data so demo URLs like /product/prod-1 work
          // without a configured Firestore.
          setProduct(fallbackProducts.find((p) => p.id === productId) ?? null);
        }
        setLoading(false);
      },
      () => {
        setProduct(fallbackProducts.find((p) => p.id === productId) ?? null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [productId]);

  return { product, loading };
}

// ── Search products ─────────────────────────────────────────

export function useProductSearch() {
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const search = useCallback(async (queryText: string) => {
    if (!queryText.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    const q = queryText.toLowerCase();
    const matches = (p: Product) =>
      p.nameAr?.includes(queryText) ||
      p.nameEn?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.tags?.some((t) => t.includes(q));

    try {
      // Firestore doesn't have full-text search, so we fetch all
      // and filter client-side. For production, use Algolia or Typesense.
      const snapshot = await getDocs(collection(db, 'products'));
      const list =
        snapshot.size > 0
          ? snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product))
          : fallbackProducts;

      setResults(list.filter(matches));
    } catch (err) {
      console.error('Search error, using fallback data:', err);
      setResults(fallbackProducts.filter(matches));
    } finally {
      setSearching(false);
    }
  }, []);

  return { results, searching, search };
}
