import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

const updatedAt = () =>
  integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const users = sqliteTable(
  'users',
  {
    id: id(),
    // Phone is the primary identity for the SMS-OTP flow. Stored E.164.
    phoneNumber: text('phone_number').unique(),
    phoneVerifiedAt: integer('phone_verified_at', { mode: 'timestamp_ms' }),
    // Email + password remain available for staff/admin accounts that don't
    // sign in by phone. Customer rows can have null email/passwordHash.
    email: text('email').unique(),
    passwordHash: text('password_hash'),
    firstName: text('first_name').notNull().default(''),
    lastName: text('last_name').notNull().default(''),
    // 'owner' is the super-admin role (Mishari). Future RBAC reads role,
    // not a separate boolean. Plan-eng-review rec 3A — see TODOS.md.
    role: text('role', { enum: ['customer', 'pharmacist', 'admin', 'owner'] })
      .notNull()
      .default('customer'),
    // Set when the row has been mirrored into Firebase Auth. Null until then.
    firebaseUid: text('firebase_uid').unique(),
    // Soft delete. PDPL erasure is a separate cooler-headed flow. NEVER
    // query `users` directly without going through liveUsers() (lib/live.ts)
    // unless you intentionally want to see deleted rows for audit purposes.
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    phoneIdx: index('users_phone_idx').on(t.phoneNumber),
  })
);

/**
 * One row per OTP send. We never store the plaintext code — only its hash.
 * Verify reads the freshest unverified row inside TTL, increments
 * verifyAttempts on each wrong guess, marks verified on success.
 */
export const otpAttempts = sqliteTable(
  'otp_attempts',
  {
    id: id(),
    phoneNumber: text('phone_number').notNull(),
    codeHash: text('code_hash').notNull(),
    verifyAttempts: integer('verify_attempts').notNull().default(0),
    verifiedAt: integer('verified_at', { mode: 'timestamp_ms' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    ip: text('ip'),
    createdAt: createdAt(),
  },
  (t) => ({
    phoneIdx: index('otp_attempts_phone_idx').on(t.phoneNumber),
    createdIdx: index('otp_attempts_created_idx').on(t.createdAt),
  })
);

export const products = sqliteTable(
  'products',
  {
    id: id(),
    name: text('name').notNull(),
    nameAr: text('name_ar').notNull().default(''),
    brand: text('brand').notNull().default(''),
    category: text('category', {
      enum: [
        'pregnancy',
        'vitamins',
        'hormonal',
        'skincare',
        'menstrual',
        'pain',
        'chronic',
        'postpartum',
      ],
    }).notNull(),
    price: real('price').notNull(),
    oldPrice: real('old_price'),
    unit: text('unit').notNull().default(''),
    image: text('image').notNull().default(''),
    rating: real('rating').notNull().default(0),
    reviews: integer('reviews').notNull().default(0),
    stockCount: integer('stock_count').notNull().default(0),
    inStock: integer('in_stock', { mode: 'boolean' }).notNull().default(true),
    rxRequired: integer('rx_required', { mode: 'boolean' })
      .notNull()
      .default(false),
    pregnancySafe: integer('pregnancy_safe', { mode: 'boolean' })
      .notNull()
      .default(true),
    description: text('description').notNull().default(''),
    pharmacistNote: text('pharmacist_note'),
    tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
    sku: text('sku').unique(),
    // Retail barcode (EAN-13 / UPC-A). Used by the mobile scan flow to
    // resolve a physical pack to a product row. Unique when set; null is
    // allowed for items without a printed barcode.
    barcode: text('barcode').unique(),
    // SFDA medication-list ID for idempotent bulk-import. See
    // backend/scripts/import-sfda.ts.
    sfdaId: text('sfda_id').unique(),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    categoryIdx: index('products_category_idx').on(t.category),
    inStockIdx: index('products_in_stock_idx').on(t.inStock),
    barcodeIdx: index('products_barcode_idx').on(t.barcode),
  })
);

/**
 * A pharmacist-approved prescription that unlocks one Rx-required product
 * for one user. Status starts at `pending_review` when the customer
 * uploads, transitions to `approved` (rx unlocks) or `rejected` after
 * pharmacist review. `expiresAt` tracks when the prescription is no
 * longer valid (typically 6-12 months from the prescriber's date).
 */
export const prescriptions = sqliteTable(
  'prescriptions',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    status: text('status', {
      enum: ['pending_review', 'approved', 'rejected', 'expired'],
    })
      .notNull()
      .default('pending_review'),
    imagePath: text('image_path'),
    prescribedBy: text('prescribed_by'),
    notes: text('notes'),
    approvedAt: integer('approved_at', { mode: 'timestamp_ms' }),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    userIdx: index('prescriptions_user_idx').on(t.userId),
    productIdx: index('prescriptions_product_idx').on(t.productId),
    userProductStatusIdx: index('prescriptions_user_product_status_idx').on(
      t.userId,
      t.productId,
      t.status
    ),
  })
);

export const orders = sqliteTable(
  'orders',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['placed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    })
      .notNull()
      .default('placed'),
    subtotal: real('subtotal').notNull(),
    deliveryFee: real('delivery_fee').notNull().default(0),
    vat: real('vat').notNull().default(0),
    total: real('total').notNull(),
    address: text('address').notNull().default(''),
    deliveryOption: text('delivery_option', {
      enum: ['standard', 'express'],
    })
      .notNull()
      .default('standard'),
    paymentMethod: text('payment_method', {
      enum: ['mada', 'stcpay', 'applepay', 'cod'],
    })
      .notNull()
      .default('mada'),
    notes: text('notes'),
    deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
    placedAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    userIdx: index('orders_user_idx').on(t.userId),
    statusIdx: index('orders_status_idx').on(t.status),
  })
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: id(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    priceAtOrder: real('price_at_order').notNull(),
  },
  (t) => ({
    orderIdx: index('order_items_order_idx').on(t.orderId),
  })
);

export const apiKeys = sqliteTable('api_keys', {
  id: id(),
  label: text('label').notNull(),
  keyPrefix: text('key_prefix').notNull(),
  keyHash: text('key_hash').notNull().unique(),
  scopes: text('scopes', { mode: 'json' }).$type<string[]>().notNull().default([]),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp_ms' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
  createdAt: createdAt(),
});

export const stockMovements = sqliteTable(
  'stock_movements',
  {
    id: id(),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    afterStock: integer('after_stock').notNull(),
    source: text('source', {
      enum: ['api', 'admin', 'order_placed', 'order_cancelled', 'seed'],
    }).notNull(),
    apiKeyId: text('api_key_id').references(() => apiKeys.id, {
      onDelete: 'set null',
    }),
    note: text('note'),
    createdAt: createdAt(),
  },
  (t) => ({
    productIdx: index('stock_movements_product_idx').on(t.productId),
  })
);

/**
 * Append-only audit log.
 *
 * Every mutating staff endpoint writes one row inside its own Drizzle
 * transaction (see lib/audit.ts → audit()) so audit cannot drift from
 * data state — if the data write succeeds, the audit row succeeded too.
 *
 * Customer-data reads (customer profile view, medical profile view,
 * search hit) write a row via auditRead() which is fire-and-forget; a
 * read failure should not fail the response, but the row landing is
 * required for PDPL compliance.
 *
 *   actor_user_id          who did it (FK users.id)
 *   actor_role             role snapshot at the time
 *   action                 e.g. 'product.update', 'customer.medical_profile_view'
 *   entity_type            'product' | 'order' | 'user' | 'prescription' | ...
 *   entity_id              the entity touched (nullable for searches)
 *   before_json            null for inserts and reads
 *   after_json             null for deletes and reads
 *   ip_addr / user_agent   request metadata
 */
export const auditLog = sqliteTable(
  'audit_log',
  {
    id: id(),
    actorUserId: text('actor_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    actorRole: text('actor_role').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: text('entity_id'),
    beforeJson: text('before_json'),
    afterJson: text('after_json'),
    ipAddr: text('ip_addr'),
    userAgent: text('user_agent'),
    createdAt: createdAt(),
  },
  (t) => ({
    actorIdx: index('audit_log_actor_idx').on(t.actorUserId, t.createdAt),
    entityIdx: index('audit_log_entity_idx').on(
      t.entityType,
      t.entityId,
      t.createdAt
    ),
  })
);

/**
 * One row per device the user signs in from. The device's X25519 public
 * key is published here so other parties can encrypt messages to it.
 * The matching private key never leaves the device's secure storage.
 *
 * Multi-device support is intentional: one user can have a phone +
 * tablet, and senders fan-out the ciphertext to every active device.
 */
export const chatDevices = sqliteTable(
  'chat_devices',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    publicKey: text('public_key').notNull(),
    deviceLabel: text('device_label').notNull().default(''),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }),
    revokedAt: integer('revoked_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
  },
  (t) => ({
    userIdx: index('chat_devices_user_idx').on(t.userId),
  })
);

/**
 * Two-party conversation between a customer and a pharmacist (or, in v2,
 * any pair of users). Stored separately from messages so we can attach
 * conversation-level metadata (assigned pharmacist, status, last
 * activity) without rewriting every message.
 */
export const chatConversations = sqliteTable(
  'chat_conversations',
  {
    id: id(),
    customerId: text('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pharmacistId: text('pharmacist_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    status: text('status', { enum: ['open', 'closed'] })
      .notNull()
      .default('open'),
    lastMessageAt: integer('last_message_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => ({
    customerIdx: index('chat_conv_customer_idx').on(t.customerId),
    pharmacistIdx: index('chat_conv_pharmacist_idx').on(t.pharmacistId),
  })
);

/**
 * One row per message envelope addressed to a specific recipient device.
 * Server stores ciphertext + nonce only; the plaintext lives only in
 * RAM on sender + recipient devices. Server never has the keys to
 * decrypt — that's the E2EE contract.
 *
 * `senderDeviceId` lets us drop a duplicate envelope on retransmit and
 * lets the recipient verify continuity from the same device fingerprint
 * across the conversation.
 */
export const chatMessages = sqliteTable(
  'chat_messages',
  {
    id: id(),
    conversationId: text('conversation_id')
      .notNull()
      .references(() => chatConversations.id, { onDelete: 'cascade' }),
    senderUserId: text('sender_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    senderDeviceId: text('sender_device_id')
      .notNull()
      .references(() => chatDevices.id, { onDelete: 'cascade' }),
    recipientDeviceId: text('recipient_device_id')
      .notNull()
      .references(() => chatDevices.id, { onDelete: 'cascade' }),
    ciphertext: text('ciphertext').notNull(),
    nonce: text('nonce').notNull(),
    sentAt: createdAt(),
    deliveredAt: integer('delivered_at', { mode: 'timestamp_ms' }),
    readAt: integer('read_at', { mode: 'timestamp_ms' }),
  },
  (t) => ({
    convIdx: index('chat_msg_conv_idx').on(t.conversationId),
    recipientIdx: index('chat_msg_recipient_idx').on(t.recipientDeviceId),
  })
);

export type User = typeof users.$inferSelect;
export type OtpAttempt = typeof otpAttempts.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;
export type ChatDevice = typeof chatDevices.$inferSelect;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
