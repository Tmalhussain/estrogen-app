/**
 * Firestore Orders Hook
 *
 * Provides real-time order tracking for the authenticated user.
 * Orders are stored in the top-level `orders` collection
 * and filtered by userId.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { CartItem } from '../store';

// ── Types ────────────────────────────────────────────────────

export interface FirestoreOrder {
  id: string;
  userId: string;
  status: string;
  date: string;
  total: number;
  items: {
    productId: string;
    nameAr: string;
    nameEn: string;
    quantity: number;
    price: number;
  }[];
  requiresPrescription: boolean;
  prescriptionId?: string;
  delivery: {
    addressAr: string;
    addressEn: string;
    type: string;
    estimatedDelivery: string | null;
  };
  payment: {
    method: string;
    discreetPackaging: boolean;
  };
  promoCode: string | null;
  discount: number;
  createdAt: any;
  updatedAt: any;
}

// ── Hook ─────────────────────────────────────────────────────

export function useOrders() {
  const [orders, setOrders] = useState<FirestoreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            date: data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString().split('T')[0]
              : data.date || '',
          } as FirestoreOrder;
        });
        setOrders(items);
        setLoading(false);
      },
      (err) => {
        console.error('Orders fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  // ── Place a new order ────────────────────────────────────
  const placeOrder = useCallback(async (data: {
    items: CartItem[];
    total: number;
    requiresPrescription: boolean;
    prescriptionId?: string;
    deliveryAddressAr: string;
    deliveryAddressEn: string;
    deliveryType: string;
    paymentMethod: string;
    discreetPackaging: boolean;
    promoCode: string | null;
    discount: number;
  }) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in to place order');

    const orderData = {
      userId: user.uid,
      status: data.requiresPrescription ? 'pending_review' : 'placed',
      items: data.items.map((item) => ({
        productId: item.productId,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        quantity: item.quantity,
        price: item.price,
      })),
      total: data.total,
      requiresPrescription: data.requiresPrescription,
      prescriptionId: data.prescriptionId || null,
      delivery: {
        addressAr: data.deliveryAddressAr,
        addressEn: data.deliveryAddressEn,
        type: data.deliveryType,
        estimatedDelivery: null,
      },
      payment: {
        method: data.paymentMethod,
        discreetPackaging: data.discreetPackaging,
      },
      promoCode: data.promoCode,
      discount: data.discount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'orders'), orderData);
    return docRef.id;
  }, []);

  // ── Cancel an order ──────────────────────────────────────
  const cancelOrder = useCallback(async (orderId: string) => {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
  }, []);

  // ── Get single order ─────────────────────────────────────
  const getOrder = useCallback((orderId: string) => {
    return orders.find((o) => o.id === orderId);
  }, [orders]);

  return { orders, loading, error, placeOrder, cancelOrder, getOrder };
}
