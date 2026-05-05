/**
 * Addresses store — Firestore-backed.
 *
 * Re-exports the Firestore hook as the primary API.
 * Legacy types kept for backward compatibility.
 */

// Re-export the Firestore hook as the primary API
export { useAddresses } from '../hooks/useAddresses';

// ── Types (kept for backward compatibility) ──────────────────

export interface Address {
  id: string;
  label: string;
  city: string; // stored as key, e.g. 'cityRiyadh'
  district: string;
  street: string;
  buildingNo: string;
  floor: string;
  notes: string;
  isDefault: boolean;
  // Bilingual fields for checkout delivery strings
  districtEn?: string;
  streetEn?: string;
}

/**
 * @deprecated Use the `useAddresses()` hook instead.
 * This legacy store is kept for type compatibility only.
 */
export const useAddressesStore = {
  getState: () => ({
    addresses: [] as Address[],
    initialized: true,
    initSeedData: () => {},
    addAddress: () => { console.warn('Use useAddresses() hook'); },
    updateAddress: () => { console.warn('Use useAddresses() hook'); },
    removeAddress: () => { console.warn('Use useAddresses() hook'); },
    setDefault: () => { console.warn('Use useAddresses() hook'); },
    getDefault: () => undefined as Address | undefined,
  }),
};
