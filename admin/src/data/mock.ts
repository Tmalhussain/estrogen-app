/**
 * Admin Data Layer
 *
 * This file previously contained static mock data.
 * It now re-exports types and functions from the Firestore data layer.
 *
 * All data is fetched from Firestore in real-time.
 * See: admin/src/lib/firestore.ts
 */

// Re-export everything from the Firestore data layer
export {
  type DashboardOrder,
  type DashboardPrescription,
  type DashboardProduct,
  type DashboardCustomer,
  type DashboardStats,
  fetchOrders,
  fetchPrescriptions,
  fetchProducts,
  fetchCustomers,
  fetchDashboardStats,
  updateOrderStatus,
  updatePrescriptionStatus,
  updateProduct,
  createProduct,
  deleteProduct,
  orderStatusLabels,
  rxStatusLabels,
} from '../lib/firestore';

// ── Backward compatibility: empty arrays for components ──────
// Components that previously imported static arrays should
// switch to using the async fetch functions above.

export const mockOrders: any[] = [];
export const mockPrescriptions: any[] = [];
export const mockProducts: any[] = [];
export const mockCustomers: any[] = [];
