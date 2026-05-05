/**
 * Prescriptions store — Firestore-backed.
 *
 * Re-exports the Firestore hook as the primary API.
 * Legacy Zustand store kept for backward compatibility.
 */

import { create } from 'zustand';

// Re-export the Firestore hook as the primary API
export { usePrescriptions, type FirestorePrescription } from '../hooks/usePrescriptions';

// ── Legacy Types ─────────────────────────────────────────────

export interface Prescription {
  id: string;
  date: string;
  status: 'pending_review' | 'approved' | 'expired' | 'rejected';
  fileName: string;
  imageUri: string | null;
  linkedOrder: string | null;
}

/**
 * @deprecated Use the `usePrescriptions()` hook instead.
 */
interface PrescriptionsStore {
  prescriptions: Prescription[];
  initialized: boolean;
  initSeedData: () => void;
  addPrescription: (fileName: string, imageUri: string | null) => Prescription;
  updateStatus: (id: string, status: Prescription['status']) => void;
  linkOrder: (id: string, orderId: string) => void;
}

export const usePrescriptionsStore = create<PrescriptionsStore>()((set, get) => ({
  prescriptions: [],
  initialized: true,

  initSeedData: () => {},

  addPrescription: (fileName, imageUri) => {
    console.warn('usePrescriptionsStore.addPrescription is deprecated. Use usePrescriptions().uploadPrescription() instead.');
    const rx: Prescription = {
      id: `rx-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      status: 'pending_review',
      fileName,
      imageUri,
      linkedOrder: null,
    };
    set((state) => ({
      prescriptions: [rx, ...state.prescriptions],
    }));
    return rx;
  },

  updateStatus: (id, status) => {
    set((state) => ({
      prescriptions: state.prescriptions.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    }));
  },

  linkOrder: (id, orderId) => {
    set((state) => ({
      prescriptions: state.prescriptions.map((p) =>
        p.id === id ? { ...p, linkedOrder: orderId } : p
      ),
    }));
  },
}));
