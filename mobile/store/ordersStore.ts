/**
 * Orders store — Firestore-backed.
 *
 * This module now serves as a re-export compatibility layer.
 * The actual data fetching is done by the useOrders hook in hooks/useOrders.ts.
 *
 * The Zustand store is kept for components that still import from here,
 * but all data flows through Firestore via the hook.
 */

import { create } from 'zustand';

// Re-export the Firestore hook as the primary API
export { useOrders, type FirestoreOrder } from '../hooks/useOrders';

// ── Legacy Types (for backward compatibility) ────────────────

export interface OrderItem {
  productId: string;
  nameAr: string;
  nameEn: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  status: string;
  date: string;
  total: number;
  items: OrderItem[];
  requiresPrescription: boolean;
  deliveryAddressAr: string;
  deliveryAddressEn: string;
  estimatedDelivery: string | null;
  paymentMethod: string;
  deliveryType: string;
  discreetPackaging: boolean;
}

/**
 * @deprecated Use the `useOrders()` hook instead.
 * This store is kept for backward compatibility during migration.
 */
interface OrdersStore {
  orders: Order[];
  initialized: boolean;
  initSeedOrders: () => void;
  addOrder: (order: Omit<Order, 'id' | 'date' | 'status'>) => Order;
  getOrder: (id: string) => Order | undefined;
  updateStatus: (id: string, status: string) => void;
}

export const useOrdersStore = create<OrdersStore>()((set, get) => ({
  orders: [],
  initialized: true,

  // No-ops: data is now in Firestore
  initSeedOrders: () => {},

  addOrder: (data) => {
    // This is now handled by the useOrders().placeOrder() method
    console.warn('useOrdersStore.addOrder is deprecated. Use useOrders().placeOrder() instead.');
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const id = `ORD-${dateStr.replace(/-/g, '')}-${Date.now().toString(36).slice(-5).toUpperCase()}`;
    const order: Order = {
      ...data,
      id,
      date: dateStr,
      status: data.requiresPrescription ? 'pending_review' : 'placed',
    };
    set((state) => ({ orders: [order, ...state.orders] }));
    return order;
  },

  getOrder: (id) => get().orders.find((o) => o.id === id),

  updateStatus: (id, status) => {
    console.warn('useOrdersStore.updateStatus is deprecated. Use Firestore directly.');
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
  },
}));
