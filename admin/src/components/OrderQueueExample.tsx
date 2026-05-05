/**
 * OrderQueueExample — reference implementation for the admin orders queue.
 *
 * Sprint 1 Lane C deliverable. Documents the intended pattern for the
 * orders page once the admin Firestore data layer (admin/src/lib/firestore.ts
 * + admin/src/lib/adminAuth.ts) is built. Until then, this component is
 * standalone and shows the team three things:
 *
 *   1. Every Firestore query on `orders` MUST filter on `branchId` first.
 *      v1 = `'main'`. The composite index `(branchId, status, createdAt DESC)`
 *      shipped in Sprint 0's `firestore.indexes.json` supports this.
 *      See CLAUDE.md anti-pattern #1.
 *
 *   2. Status mutations MUST go through the `updateOrderStatus` Cloud Function
 *      callable (in `backend/functions/src/api/admin.ts`). Lane A is wiring
 *      `assertTransition` from `backend/functions/src/lib/orderStatus.ts` into
 *      that callable. Do not duplicate state-machine logic in the admin
 *      client — call the function and let it enforce.
 *
 *   3. The 4-step progress UI maps the 8-state machine onto a visual
 *      pipeline: Received → Preparing → Out for delivery → Delivered.
 *      Locked Variant A brand colors per `DESIGN.md`:
 *        - Magenta `#B8267E` for the current step
 *        - Success green `#1E9F6E` for completed steps
 *        - Hairline-pink `#F5DCE6` for pending steps
 *
 * The actual `app/orders/page.tsx` should be rebuilt around this pattern
 * once the data layer (lib/firestore.ts, lib/adminAuth.ts) is wired up.
 */

'use client';

import { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  type Timestamp,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// ── Brand tokens (locked Variant A from DESIGN.md) ─────────────
const BRAND = {
  magenta: '#B8267E',
  purple: '#5B1F65',
  pink: '#E89AB6',
  pinkSoft: '#FBEAF1',
  hairlinePink: '#F5DCE6',
  successGreen: '#1E9F6E',
  ink: '#1A0F1F',
  muted: '#6B6373',
  white: '#FFFFFF',
} as const;

// ── Order state machine (mirrors backend/functions/src/lib/orderStatus.ts) ──
// Forward-only transitions. Cancellation may fork from early states.
// Keep this aligned with the source of truth in backend/functions/src/lib/orderStatus.ts.
export type OrderStatus =
  | 'placed'
  | 'pending_review'
  | 'pharmacist_review'
  | 'approved'
  | 'packing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export const FORWARD_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  placed: ['pharmacist_review', 'approved', 'cancelled'],
  pending_review: ['pharmacist_review', 'approved', 'cancelled'],
  pharmacist_review: ['approved', 'cancelled'],
  approved: ['packing', 'cancelled'],
  packing: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return FORWARD_TRANSITIONS[from]?.includes(to) ?? false;
}

// ── 4-step visual pipeline ─────────────────────────────────────
// The 8-state machine collapses onto 4 visual steps for the queue view.
// Cancelled orders are rendered separately (no step on the pipeline).
type StepKey = 'received' | 'preparing' | 'out' | 'delivered';

const STEP_ORDER: StepKey[] = ['received', 'preparing', 'out', 'delivered'];

const STATUS_TO_STEP: Record<OrderStatus, StepKey | null> = {
  placed: 'received',
  pending_review: 'received',
  pharmacist_review: 'received',
  approved: 'preparing',
  packing: 'preparing',
  out_for_delivery: 'out',
  delivered: 'delivered',
  cancelled: null,
};

const STEP_LABELS: Record<StepKey, { en: string; ar: string }> = {
  received: { en: 'Received', ar: 'تم الاستلام' },
  preparing: { en: 'Preparing', ar: 'قيد التحضير' },
  out: { en: 'Out for delivery', ar: 'في الطريق' },
  delivered: { en: 'Delivered', ar: 'تم التوصيل' },
};

// ── Order shape (subset relevant to queue view) ────────────────
export interface QueueOrder {
  id: string;
  branchId: string;
  userId: string;
  customerName?: string;
  total: number;
  status: OrderStatus;
  requiresPrescription?: boolean;
  createdAt?: Timestamp;
}

// ── Firebase bootstrap ─────────────────────────────────────────
// In the real admin/src/lib/firestore.ts this should be a singleton
// shared across all admin pages, configured from env vars.
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

interface OrderQueueExampleProps {
  /** v1 default = 'main'. v2 multi-store will pass the active branch. */
  branchId?: string;
  /** Filter by status. Omit for the full active queue. */
  statusFilter?: OrderStatus;
  /** Page size. */
  pageSize?: number;
  /** Render in Arabic (RTL) labels. */
  isRTL?: boolean;
}

export default function OrderQueueExample({
  branchId = 'main',
  statusFilter,
  pageSize = 25,
  isRTL = false,
}: OrderQueueExampleProps) {
  const [orders, setOrders] = useState<QueueOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Live branchId-filtered query ─────────────────────────────
  // Composite index: (branchId, status, createdAt DESC) when statusFilter
  // is set; (branchId, createdAt DESC) otherwise. Both shipped in
  // firestore.indexes.json in Sprint 0.
  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const db = getFirestore(getFirebaseApp());
      const constraints = [
        where('branchId', '==', branchId), // ← anti-pattern #1: ALWAYS filter on branchId
        ...(statusFilter ? [where('status', '==', statusFilter)] : []),
        orderBy('createdAt', 'desc'),
        limit(pageSize),
      ];
      const q = query(collection(db, 'orders'), ...constraints);
      unsub = onSnapshot(
        q,
        (snap) => {
          const rows: QueueOrder[] = snap.docs.map((d) => {
            const data = d.data() as Omit<QueueOrder, 'id'>;
            return { id: d.id, ...data };
          });
          setOrders(rows);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setLoading(false);
    }
    return () => {
      if (unsub) unsub();
    };
  }, [branchId, statusFilter, pageSize]);

  // ── Mutate via Cloud Function callable, NEVER updateDoc directly ───
  async function advance(orderId: string, newStatus: OrderStatus) {
    try {
      const fns = getFunctions(getFirebaseApp(), 'us-central1');
      const callable = httpsCallable<
        { orderId: string; newStatus: OrderStatus },
        { success: boolean }
      >(fns, 'updateOrderStatus');
      await callable({ orderId, newStatus });
      // The onSnapshot listener will reflect the change automatically.
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to update order';
      setError(msg);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, color: BRAND.muted }}>
        {isRTL ? 'جاري التحميل...' : 'Loading orders…'}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: '#D63B5A' }}>
        {isRTL ? 'حدث خطأ: ' : 'Error: '}
        {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ padding: 24, color: BRAND.muted }}>
        {isRTL ? 'لا توجد طلبات في هذا الفرع' : `No orders for branch '${branchId}'`}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          isRTL={isRTL}
          onAdvance={(next) => advance(order.id, next)}
        />
      ))}
    </div>
  );
}

// ── Single-order card with 4-step pipeline + legal-transition buttons ───
function OrderCard({
  order,
  isRTL,
  onAdvance,
}: {
  order: QueueOrder;
  isRTL: boolean;
  onAdvance: (next: OrderStatus) => void;
}) {
  const currentStep = STATUS_TO_STEP[order.status];
  const cancelled = order.status === 'cancelled';
  const legalNext = FORWARD_TRANSITIONS[order.status] ?? [];

  return (
    <div
      style={{
        background: BRAND.white,
        border: `1px solid ${BRAND.hairlinePink}`,
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 1px 2px rgba(26, 15, 31, 0.04)',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 13,
              color: BRAND.purple,
              fontWeight: 600,
            }}
          >
            #{order.id.slice(0, 8)}
          </div>
          <div style={{ fontSize: 17, color: BRAND.ink, fontWeight: 600, marginTop: 2 }}>
            {order.customerName ?? (isRTL ? 'عميلة' : 'Customer')}
            {order.requiresPrescription ? (
              <span
                style={{
                  marginInlineStart: 8,
                  fontSize: 11,
                  background: BRAND.pinkSoft,
                  color: BRAND.purple,
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontWeight: 700,
                }}
              >
                Rx
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 13, color: BRAND.muted, marginTop: 2 }}>
            {isRTL ? 'الفرع' : 'Branch'}: {order.branchId}
          </div>
        </div>
        <div style={{ fontSize: 17, color: BRAND.ink, fontWeight: 700 }}>
          {order.total.toFixed(2)} {isRTL ? 'ر.س' : 'SAR'}
        </div>
      </div>

      {/* 4-step pipeline */}
      {cancelled ? (
        <div
          style={{
            background: '#FBE9EC',
            color: '#D63B5A',
            padding: '8px 12px',
            borderRadius: 999,
            display: 'inline-block',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {isRTL ? 'تم الإلغاء' : 'Cancelled'}
        </div>
      ) : (
        <Pipeline currentStep={currentStep} isRTL={isRTL} />
      )}

      {/* Legal-transition action buttons */}
      {legalNext.length > 0 ? (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {legalNext.map((next) => (
            <button
              key={next}
              onClick={() => onAdvance(next)}
              style={{
                background: next === 'cancelled' ? BRAND.white : BRAND.magenta,
                color: next === 'cancelled' ? '#D63B5A' : BRAND.white,
                border:
                  next === 'cancelled' ? '1px solid #D63B5A' : `1px solid ${BRAND.magenta}`,
                borderRadius: 999,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {labelFor(next, isRTL)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Pipeline({
  currentStep,
  isRTL,
}: {
  currentStep: StepKey | null;
  isRTL: boolean;
}) {
  const currentIndex = currentStep ? STEP_ORDER.indexOf(currentStep) : -1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {STEP_ORDER.map((step, i) => {
        const state: 'done' | 'current' | 'pending' =
          i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'pending';
        const dotColor =
          state === 'done'
            ? BRAND.successGreen
            : state === 'current'
              ? BRAND.magenta
              : BRAND.hairlinePink;
        const labelColor =
          state === 'pending' ? BRAND.muted : state === 'current' ? BRAND.magenta : BRAND.ink;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: dotColor,
                flexShrink: 0,
                boxShadow:
                  state === 'current' ? `0 0 0 4px ${BRAND.pinkSoft}` : 'none',
              }}
            />
            <div
              style={{
                marginInlineStart: 8,
                fontSize: 13,
                fontWeight: state === 'current' ? 700 : 500,
                color: labelColor,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isRTL ? STEP_LABELS[step].ar : STEP_LABELS[step].en}
            </div>
            {i < STEP_ORDER.length - 1 ? (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  marginInline: 8,
                  background: i < currentIndex ? BRAND.successGreen : BRAND.hairlinePink,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function labelFor(status: OrderStatus, isRTL: boolean): string {
  const map: Record<OrderStatus, { en: string; ar: string }> = {
    placed: { en: 'Mark placed', ar: 'تم الاستلام' },
    pending_review: { en: 'Mark pending review', ar: 'بانتظار المراجعة' },
    pharmacist_review: { en: 'Send to pharmacist', ar: 'إرسال للصيدلي' },
    approved: { en: 'Approve', ar: 'موافقة' },
    packing: { en: 'Start packing', ar: 'بدء التحضير' },
    out_for_delivery: { en: 'Out for delivery', ar: 'للتوصيل' },
    delivered: { en: 'Mark delivered', ar: 'تم التوصيل' },
    cancelled: { en: 'Cancel', ar: 'إلغاء' },
  };
  return isRTL ? map[status].ar : map[status].en;
}
