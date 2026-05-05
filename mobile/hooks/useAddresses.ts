/**
 * Firestore Addresses Hook
 *
 * Manages user delivery addresses stored as a Firestore
 * subcollection: users/{uid}/addresses/{addressId}
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { Address } from '../store/addressesStore';

// ── Hook ─────────────────────────────────────────────────────

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    const addressesRef = collection(db, 'users', uid, 'addresses');

    const unsubscribe = onSnapshot(
      addressesRef,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Address[];
        setAddresses(items);
        setLoading(false);
      },
      (err) => {
        console.error('Addresses fetch error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid]);

  // ── Add address ──────────────────────────────────────────
  const addAddress = useCallback(async (data: Omit<Address, 'id' | 'isDefault'>) => {
    if (!uid) return;
    const isFirst = addresses.length === 0;
    await addDoc(collection(db, 'users', uid, 'addresses'), {
      ...data,
      isDefault: isFirst,
    });
  }, [uid, addresses.length]);

  // ── Update address ───────────────────────────────────────
  const updateAddress = useCallback(async (addressId: string, data: Partial<Address>) => {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid, 'addresses', addressId), data);
  }, [uid]);

  // ── Remove address ───────────────────────────────────────
  const removeAddress = useCallback(async (addressId: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'addresses', addressId));
  }, [uid]);

  // ── Set default ──────────────────────────────────────────
  const setDefault = useCallback(async (addressId: string) => {
    if (!uid) return;

    const batch = writeBatch(db);

    // Unset all defaults
    addresses.forEach((addr) => {
      batch.update(doc(db, 'users', uid, 'addresses', addr.id), {
        isDefault: addr.id === addressId,
      });
    });

    await batch.commit();
  }, [uid, addresses]);

  // ── Get default ──────────────────────────────────────────
  const getDefault = useCallback(() => {
    return addresses.find((a) => a.isDefault) || addresses[0] || null;
  }, [addresses]);

  return {
    addresses,
    loading,
    addAddress,
    updateAddress,
    removeAddress,
    setDefault,
    getDefault,
  };
}
