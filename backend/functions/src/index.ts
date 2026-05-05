/**
 * Estrogen Pharmacy — Firebase Cloud Functions
 *
 * Entry point. All deployable functions are re-exported from
 * here so the deploy CLI picks them up.
 */

// ── Auth & profile triggers ─────────────────────────────────
export { onUserCreated } from './triggers/onUserCreated';
export { onUserDeleted } from './triggers/onUserDeleted';
export { onUserRoleChanged } from './triggers/onUserRoleChanged';

// ── Order & prescription triggers ───────────────────────────
export { onOrderCreated, onOrderUpdated } from './triggers/onOrderCreated';
export { onPrescriptionUpdated } from './triggers/onPrescriptionUpdated';

// ── Notification fan-out ────────────────────────────────────
export { onNotificationCreated } from './triggers/onNotificationCreated';

// ── Auth (Unifonic OTP, locked by /plan-eng-review ARCH-1.1) ─
export { sendOtp, verifyOtp } from './api/auth';

// ── First-admin bootstrap (one-shot, locked after first call) ─
export { bootstrapFirstAdmin } from './api/adminBootstrap';

// ── Customer-facing callables ───────────────────────────────
export { placeOrder, cancelOrder } from './api/orders';
export { validatePromoCode } from './api/promo';
export { initiatePayment, moyasarWebhook } from './api/payments';

// ── Staff / admin callables ─────────────────────────────────
export {
  searchProducts,
  updateOrderStatus,
  registerFcmToken,
  unregisterFcmToken,
} from './api/admin';
export {
  createStaffAccount,
  assignPrescription,
  reviewPrescription,
} from './api/staff';

// ── Scheduled jobs ──────────────────────────────────────────
export { aggregateDailyStats } from './scheduled/dailyStats';
export { catalogSync } from './scheduled/catalogSync';
export { lowStockAlert } from './scheduled/lowStockAlert';
export { posSync } from './scheduled/posSync';
