/**
 * Firestore data layer for the Admin Dashboard.
 *
 * Provides functions and hooks for fetching and mutating data
 * from Firestore collections. Replaces the static mock.ts data.
 */

import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  writeBatch,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';

// ── Types ────────────────────────────────────────────────────

export interface DashboardOrder {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  date: string;
  status: string;
  total: number;
  itemCount: number;
  items: any[];
  hasRx: boolean;
  paymentMethod: string;
  city: string;
  delivery?: any;
  payment?: any;
  createdAt: any;
  updatedAt: any;
}

export interface DashboardPrescription {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  date: string;
  status: string;
  fileName: string;
  storageUrl: string | null;
  linkedOrderId: string | null;
  pharmacistNotes: string | null;
}

export interface DashboardProduct {
  id: string;
  nameAr: string;
  nameEn: string;
  category: string;
  categoryId: string;
  price: number;
  stock: number;
  stockCount: number;
  requiresRx: boolean;
  requiresPrescription: boolean;
  isActive: boolean;
  inStock: boolean;
}

export interface DashboardCustomer {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  joinedDate: string;
  role: string;
  createdAt: any;
}

// ── Orders ───────────────────────────────────────────────────

export async function fetchOrders(options?: {
  status?: string;
  maxResults?: number;
}): Promise<DashboardOrder[]> {
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
  ];

  if (options?.status) {
    constraints.unshift(where('status', '==', options.status));
  }
  if (options?.maxResults) {
    constraints.push(limit(options.maxResults));
  }

  const q = query(collection(db, 'orders'), ...constraints);
  const snapshot = await getDocs(q);

  const orders: DashboardOrder[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    // Fetch customer info
    let customerName = 'Unknown';
    let phone = '';
    let city = '';

    if (data.userId) {
      try {
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        if (userDoc.exists()) {
          const user = userDoc.data();
          customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          phone = user.phone || '';
        }
      } catch { /* fallback to Unknown */ }
    }

    orders.push({
      id: docSnap.id,
      userId: data.userId,
      customerName,
      phone,
      date: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString().split('T')[0]
        : data.date || '',
      status: data.status,
      total: data.total || 0,
      itemCount: data.items?.length || 0,
      items: data.items || [],
      hasRx: data.requiresPrescription || false,
      paymentMethod: data.payment?.method || '',
      city,
      delivery: data.delivery,
      payment: data.payment,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  return orders;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: string,
  notes?: string
): Promise<void> {
  const updateData: Record<string, any> = {
    status: newStatus,
    updatedAt: serverTimestamp(),
  };
  if (notes) {
    updateData.staffNotes = notes;
  }
  await updateDoc(doc(db, 'orders', orderId), updateData);
}

// ── Prescriptions ────────────────────────────────────────────

export async function fetchPrescriptions(options?: {
  status?: string;
}): Promise<DashboardPrescription[]> {
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
  ];

  if (options?.status) {
    constraints.unshift(where('status', '==', options.status));
  }

  const q = query(collection(db, 'prescriptions'), ...constraints);
  const snapshot = await getDocs(q);

  const prescriptions: DashboardPrescription[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    let customerName = 'Unknown';
    let phone = '';

    if (data.userId) {
      try {
        const userDoc = await getDoc(doc(db, 'users', data.userId));
        if (userDoc.exists()) {
          const user = userDoc.data();
          customerName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          phone = user.phone || '';
        }
      } catch { /* fallback */ }
    }

    prescriptions.push({
      id: docSnap.id,
      userId: data.userId,
      customerName,
      phone,
      date: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString().split('T')[0]
        : '',
      status: data.status,
      fileName: data.fileName || '',
      storageUrl: data.storageUrl || null,
      linkedOrderId: data.linkedOrderId || null,
      pharmacistNotes: data.pharmacistNotes || null,
    });
  }

  return prescriptions;
}

export async function updatePrescriptionStatus(
  prescriptionId: string,
  newStatus: string,
  pharmacistNotes?: string
): Promise<void> {
  const updateData: Record<string, any> = {
    status: newStatus,
    reviewedAt: serverTimestamp(),
  };
  if (pharmacistNotes) {
    updateData.pharmacistNotes = pharmacistNotes;
  }
  await updateDoc(doc(db, 'prescriptions', prescriptionId), updateData);
}

// ── Products ─────────────────────────────────────────────────

export async function fetchProducts(): Promise<DashboardProduct[]> {
  const snapshot = await getDocs(collection(db, 'products'));

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      nameAr: data.nameAr || '',
      nameEn: data.nameEn || '',
      category: data.categoryId || '',
      categoryId: data.categoryId || '',
      price: data.price || 0,
      stock: data.stockCount || 0,
      stockCount: data.stockCount || 0,
      requiresRx: data.requiresPrescription || false,
      requiresPrescription: data.requiresPrescription || false,
      isActive: data.inStock !== false,
      inStock: data.inStock !== false,
    };
  });
}

export async function updateProduct(
  productId: string,
  data: Partial<Record<string, any>>
): Promise<void> {
  await updateDoc(doc(db, 'products', productId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function createProduct(data: Record<string, any>): Promise<string> {
  const docRef = await addDoc(collection(db, 'products'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId));
}

// ── Customers ────────────────────────────────────────────────

export async function fetchCustomers(): Promise<DashboardCustomer[]> {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'user'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      phone: data.phone || '',
      email: data.email || '',
      city: '',
      ordersCount: 0, // Could be computed via aggregation query
      totalSpent: 0,
      joinedDate: data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString().split('T')[0]
        : '',
      role: data.role || 'user',
      createdAt: data.createdAt,
    };
  });
}

// ── Dashboard Stats ──────────────────────────────────────────

export interface DashboardStats {
  totalOrders: number;
  pendingReview: number;
  todayRevenue: number;
  activeCustomers: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  // Fetch orders to compute stats
  const ordersSnap = await getDocs(collection(db, 'orders'));
  const orders = ordersSnap.docs.map((d) => d.data());

  const today = new Date().toISOString().split('T')[0];

  return {
    totalOrders: orders.length,
    pendingReview: orders.filter(
      (o) => o.status === 'pending_review' || o.status === 'pharmacist_review'
    ).length,
    todayRevenue: orders
      .filter(
        (o) =>
          o.createdAt instanceof Timestamp &&
          o.createdAt.toDate().toISOString().split('T')[0] === today
      )
      .reduce((sum, o) => sum + (o.total || 0), 0),
    activeCustomers: new Set(orders.map((o) => o.userId)).size,
  };
}

// ── Status Labels (kept from original mock.ts) ───────────────

export const orderStatusLabels: Record<string, { ar: string; en: string; color: string; bg: string }> = {
  placed: { ar: 'جديد', en: 'New', color: '#3B82F6', bg: '#EFF6FF' },
  pending_review: { ar: 'قيد المراجعة', en: 'Under Review', color: '#F59E0B', bg: '#FFFBEB' },
  pharmacist_review: { ar: 'مراجعة صيدلانية', en: 'Pharmacist Review', color: '#8B5CF6', bg: '#F5F3FF' },
  approved: { ar: 'مؤكد', en: 'Approved', color: '#22C55E', bg: '#F0FDF4' },
  packing: { ar: 'تعبئة', en: 'Packing', color: '#06B6D4', bg: '#ECFEFF' },
  out_for_delivery: { ar: 'في الطريق', en: 'Out for Delivery', color: '#D4956A', bg: '#FBF0E8' },
  delivered: { ar: 'تم التسليم', en: 'Delivered', color: '#16A34A', bg: '#F0FDF4' },
  cancelled: { ar: 'ملغي', en: 'Cancelled', color: '#EF4444', bg: '#FEF2F2' },
};

export const rxStatusLabels: Record<string, { ar: string; en: string; color: string; bg: string }> = {
  pending_review: { ar: 'بانتظار المراجعة', en: 'Pending Review', color: '#F59E0B', bg: '#FFFBEB' },
  approved: { ar: 'موافق عليها', en: 'Approved', color: '#22C55E', bg: '#F0FDF4' },
  rejected: { ar: 'مرفوضة', en: 'Rejected', color: '#EF4444', bg: '#FEF2F2' },
  expired: { ar: 'منتهية', en: 'Expired', color: '#6B7280', bg: '#F3F4F6' },
};
