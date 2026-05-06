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
    role: text('role', { enum: ['customer', 'pharmacist', 'admin'] })
      .notNull()
      .default('customer'),
    // Set when the row has been mirrored into Firebase Auth. Null until then.
    firebaseUid: text('firebase_uid').unique(),
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

export type User = typeof users.$inferSelect;
export type OtpAttempt = typeof otpAttempts.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Prescription = typeof prescriptions.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type StockMovement = typeof stockMovements.$inferSelect;
