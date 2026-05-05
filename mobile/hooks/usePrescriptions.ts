/**
 * Firestore Prescriptions Hook
 *
 * Handles prescription uploads to Cloud Storage and
 * tracks prescription status from Firestore.
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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';

// ── Types ────────────────────────────────────────────────────

export interface FirestorePrescription {
  id: string;
  userId: string;
  date: string;
  status: 'pending_review' | 'approved' | 'expired' | 'rejected' | 'hold';
  fileName: string;
  storageUrl: string | null;
  linkedOrderId: string | null;
  pharmacistNotes: string | null;
  createdAt: any;
  reviewedAt: any;
  reviewedBy: string | null;
}

// ── Hook ─────────────────────────────────────────────────────

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<FirestorePrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setPrescriptions([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'prescriptions'),
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
          } as FirestorePrescription;
        });
        setPrescriptions(items);
        setLoading(false);
      },
      (err) => {
        console.error('Prescriptions fetch error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  // ── Upload a prescription ────────────────────────────────
  const uploadPrescription = useCallback(async (
    fileUri: string,
    fileName: string,
    mimeType: string = 'image/jpeg'
  ) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Must be logged in');

    setUploading(true);
    setError(null);

    try {
      // Upload to Cloud Storage
      const storageRef = ref(storage, `prescriptions/${user.uid}/${Date.now()}_${fileName}`);

      // Fetch the file as blob for upload
      const response = await fetch(fileUri);
      const blob = await response.blob();

      const uploadResult = await uploadBytes(storageRef, blob, {
        contentType: mimeType,
      });

      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // Create Firestore document
      const prescriptionData = {
        userId: user.uid,
        fileName,
        storageUrl: downloadUrl,
        status: 'pending_review' as const,
        linkedOrderId: null,
        pharmacistNotes: null,
        reviewedAt: null,
        reviewedBy: null,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'prescriptions'), prescriptionData);

      setUploading(false);
      return {
        id: docRef.id,
        ...prescriptionData,
        date: new Date().toISOString().split('T')[0],
      } as FirestorePrescription;
    } catch (err: any) {
      console.error('Prescription upload error:', err);
      setError(err.message);
      setUploading(false);
      throw err;
    }
  }, []);

  // ── Link prescription to order ───────────────────────────
  const linkToOrder = useCallback(async (prescriptionId: string, orderId: string) => {
    await updateDoc(doc(db, 'prescriptions', prescriptionId), {
      linkedOrderId: orderId,
    });
  }, []);

  return {
    prescriptions,
    loading,
    uploading,
    error,
    uploadPrescription,
    linkToOrder,
  };
}
