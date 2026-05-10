/**
 * Operator's Cockpit — staff-only API surface.
 *
 * Mounted under /staff. Every route except /staff/auth/login requires
 * the requireStaff middleware (JWT must belong to pharmacist | admin |
 * owner). Every mutating route writes an audit_log row inside its own
 * Drizzle transaction. Every customer-data read writes an audit row via
 * the fire-and-forget auditRead() helper.
 *
 *   POST   /staff/auth/login                       customer creds rejected
 *
 *   GET    /staff/products                         (no soft-deleted)
 *   POST   /staff/products
 *   PATCH  /staff/products/:id
 *   DELETE /staff/products/:id                     soft-delete only
 *
 *   GET    /staff/orders                           today's orders + customer name
 *   GET    /staff/orders/:id                       full order + items + customer
 *   PATCH  /staff/orders/:id/status                advance the state machine
 *
 *   GET    /staff/customers?phone= | ?email= | ?orderId=    SEARCH-ONLY (lockdown)
 *   GET    /staff/customers/:id                    profile + audit row
 *   GET    /staff/customers/:id/medical            allergies/conditions + audit row
 *
 *   GET    /staff/prescriptions/pending
 *   POST   /staff/prescriptions/:id/approve
 *   POST   /staff/prescriptions/:id/reject
 *
 *   GET    /staff/audit                            (read-only; for v1 forensics)
 *
 * LOCKDOWN: There is NO list-all-customers endpoint, even paginated.
 * PDPL constraint + product trust constraint. To bulk-operate, write a
 * CLI with explicit business rationale logged to audit_log.
 */

import { Hono } from 'hono';
import { and, desc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';
import { hashPassword, verifyPassword } from '../lib/passwords.ts';
import { signSession, isStaffRole } from '../lib/jwt.ts';
import { audit, auditRead, actorFromContext } from '../lib/audit.ts';
import { liveOrders, liveProducts, liveUsers } from '../lib/live.ts';
import { requireStaff, type StaffVariables } from '../middleware/staff.ts';

export const staffRoutes = new Hono<{ Variables: StaffVariables }>();

// --------------------------------------------------------------------
// Auth: /staff/auth/login
// Customer creds rejected. JWT issued is identical shape to /auth/login,
// but separating the URL means the audit log can distinguish staff
// logins from customer logins, and a leaked customer credential cannot
// open the staff door even if /auth/login is later relaxed.
// --------------------------------------------------------------------

staffRoutes.post('/auth/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return c.json({ error: 'invalid_body' }, 400);

  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== 'string' || typeof password !== 'string')
    return c.json({ error: 'invalid_credentials' }, 400);

  const normalized = email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.email, normalized), liveUsers()))
    .limit(1);

  // Constant-ish time: still hash a dummy password if user is missing or
  // has no passwordHash so the attacker can't trivially distinguish
  // "no such email" / "phone-only account" from "wrong password".
  const valid =
    user && user.passwordHash
      ? verifyPassword(password, user.passwordHash)
      : (verifyPassword(password, 'salt:0000000000000000000000000000000000000000000000000000000000000000'),
        false);

  if (!user || !user.passwordHash || !valid)
    return c.json({ error: 'invalid_credentials' }, 401);

  if (!isStaffRole(user.role))
    return c.json({ error: 'staff_only' }, 403);

  // Audit the login. Outside a txn — login itself is a single-row
  // event, no atomicity gain from wrapping it.
  await db.insert(schema.auditLog).values({
    actorUserId: user.id,
    actorRole: user.role,
    action: 'staff.login',
    entityType: 'user',
    entityId: user.id,
    beforeJson: null,
    afterJson: null,
    ipAddr:
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      c.req.header('x-real-ip') ??
      null,
    userAgent: c.req.header('user-agent') ?? null,
  });

  const token = await signSession({
    sub: user.id,
    email: user.email ?? normalized,
    role: user.role,
  });
  return c.json({ token, user: publicUser(user) });
});

// All routes below this line require a staff JWT.
staffRoutes.use('*', requireStaff);

// --------------------------------------------------------------------
// Products: full CRUD with audit
// --------------------------------------------------------------------

staffRoutes.get('/products', async (c) => {
  const q = c.req.query('q')?.trim();
  let where = liveProducts();
  if (q) {
    const wild = `%${q}%`;
    where = and(
      where,
      or(
        like(schema.products.name, wild),
        like(schema.products.nameAr, wild),
        like(schema.products.brand, wild),
        like(schema.products.sku, wild)
      )!
    )!;
  }
  const rows = await db
    .select()
    .from(schema.products)
    .where(where)
    .orderBy(desc(schema.products.updatedAt));
  return c.json({ products: rows });
});

staffRoutes.post('/products', async (c) => {
  const actor = actorFromContext(c);
  const body = await c.req.json().catch(() => null);
  const validation = validateProductInput(body, { create: true });
  if (!validation.ok) return c.json({ error: validation.error }, 400);

  // validateProductInput with create:true has guaranteed name+category+price
  // are present, but TypeScript can't widen Partial<ProductInsert> on its
  // own. Cast at the boundary; the runtime invariant is upheld above.
  const insertValues = validation.value as ProductInsert;

  const created = db.transaction((tx) => {
    const [row] = tx
      .insert(schema.products)
      .values(insertValues)
      .returning()
      .all();
    audit(tx, actor, {
      action: 'product.create',
      entityType: 'product',
      entityId: row.id,
      before: null,
      after: row,
    });
    return row;
  });

  return c.json({ product: created });
});

staffRoutes.patch('/products/:id', async (c) => {
  const actor = actorFromContext(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  const validation = validateProductInput(body, { create: false });
  if (!validation.ok) return c.json({ error: validation.error }, 400);

  const updated = db.transaction((tx) => {
    const [before] = tx
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), liveProducts()))
      .limit(1)
      .all();
    if (!before) return null;

    const [after] = tx
      .update(schema.products)
      .set({ ...validation.value, updatedAt: new Date() })
      .where(eq(schema.products.id, id))
      .returning()
      .all();

    audit(tx, actor, {
      action: 'product.update',
      entityType: 'product',
      entityId: id,
      before,
      after,
    });
    return after;
  });

  if (!updated) return c.json({ error: 'product_not_found' }, 404);
  return c.json({ product: updated });
});

staffRoutes.delete('/products/:id', async (c) => {
  const actor = actorFromContext(c);
  const id = c.req.param('id');

  const result = db.transaction((tx) => {
    const [before] = tx
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.id, id), liveProducts()))
      .limit(1)
      .all();
    if (!before) return null;
    const now = new Date();
    const [after] = tx
      .update(schema.products)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(schema.products.id, id))
      .returning()
      .all();
    audit(tx, actor, {
      action: 'product.soft_delete',
      entityType: 'product',
      entityId: id,
      before,
      after,
    });
    return after;
  });

  if (!result) return c.json({ error: 'product_not_found' }, 404);
  return c.json({ ok: true });
});

// --------------------------------------------------------------------
// Orders: read all, change status
// --------------------------------------------------------------------

const ORDER_STATUSES = [
  'placed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

staffRoutes.get('/orders', async (c) => {
  const status = c.req.query('status') as OrderStatus | undefined;
  let where = liveOrders();
  if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
    where = and(where, eq(schema.orders.status, status))!;
  }

  const rows = await db
    .select({
      id: schema.orders.id,
      userId: schema.orders.userId,
      status: schema.orders.status,
      subtotal: schema.orders.subtotal,
      deliveryFee: schema.orders.deliveryFee,
      vat: schema.orders.vat,
      total: schema.orders.total,
      address: schema.orders.address,
      deliveryOption: schema.orders.deliveryOption,
      paymentMethod: schema.orders.paymentMethod,
      notes: schema.orders.notes,
      placedAt: schema.orders.placedAt,
      updatedAt: schema.orders.updatedAt,
      customerFirstName: schema.users.firstName,
      customerLastName: schema.users.lastName,
      customerPhone: schema.users.phoneNumber,
    })
    .from(schema.orders)
    .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
    .where(where)
    .orderBy(desc(schema.orders.placedAt))
    .limit(200);

  return c.json({ orders: rows });
});

staffRoutes.get('/orders/:id', async (c) => {
  const id = c.req.param('id');
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, id), liveOrders()))
    .limit(1);
  if (!order) return c.json({ error: 'order_not_found' }, 404);
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, id));
  const [customer] = await db
    .select({
      id: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
      phoneNumber: schema.users.phoneNumber,
      email: schema.users.email,
    })
    .from(schema.users)
    .where(and(eq(schema.users.id, order.userId), liveUsers()))
    .limit(1);

  // Reading the order surfaces customer name+phone — count it as a
  // customer-data read for audit purposes.
  if (customer) {
    void auditRead(actorFromContext(c), {
      action: 'customer.view',
      entityType: 'user',
      entityId: customer.id,
      scope: `staff order detail ${order.id}`,
    });
  }

  return c.json({ order: { ...order, items, customer: customer ?? null } });
});

staffRoutes.patch('/orders/:id/status', async (c) => {
  const actor = actorFromContext(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return c.json({ error: 'invalid_body' }, 400);
  const { status } = body as Record<string, unknown>;
  if (
    typeof status !== 'string' ||
    !(ORDER_STATUSES as readonly string[]).includes(status)
  )
    return c.json({ error: 'invalid_status', allowed: ORDER_STATUSES }, 400);

  const updated = db.transaction((tx) => {
    const [before] = tx
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.id, id), liveOrders()))
      .limit(1)
      .all();
    if (!before) return null;
    const [after] = tx
      .update(schema.orders)
      .set({ status: status as OrderStatus, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning()
      .all();
    audit(tx, actor, {
      action: 'order.status_change',
      entityType: 'order',
      entityId: id,
      before: { status: before.status },
      after: { status: after.status },
    });
    return after;
  });

  if (!updated) return c.json({ error: 'order_not_found' }, 404);
  return c.json({ order: updated });
});

// --------------------------------------------------------------------
// Customers: SEARCH-ONLY by design.
//
// LOCKDOWN: NEVER add a `GET /staff/customers` listing endpoint here,
// even paginated. PDPL constraint + product trust constraint. If you
// need bulk operations, write a CLI with explicit business rationale
// logged to audit_log. See DESIGN.md → Architecture lockdowns.
// --------------------------------------------------------------------

staffRoutes.get('/customers', async (c) => {
  const phone = c.req.query('phone')?.trim();
  const email = c.req.query('email')?.trim().toLowerCase();
  const orderId = c.req.query('orderId')?.trim();

  if (!phone && !email && !orderId)
    return c.json({ error: 'search_term_required' }, 400);

  let user: typeof schema.users.$inferSelect | undefined;

  if (orderId) {
    // Resolve user via order id (the most common operator path: "I have
    // an order number, who's the customer?").
    const [row] = await db
      .select({ user: schema.users })
      .from(schema.orders)
      .leftJoin(schema.users, eq(schema.orders.userId, schema.users.id))
      .where(and(eq(schema.orders.id, orderId), liveOrders()))
      .limit(1);
    user = row?.user ?? undefined;
  } else if (phone) {
    // Permissive matching: try exact, then trailing-digits suffix so
    // "0501234567" finds "+966501234567".
    const tail = phone.replace(/\D/g, '').replace(/^0/, '');
    const wild = `%${tail}`;
    const [exact] = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.phoneNumber, phone), liveUsers()))
      .limit(1);
    if (exact) {
      user = exact;
    } else if (tail.length >= 4) {
      const [suffix] = await db
        .select()
        .from(schema.users)
        .where(and(like(schema.users.phoneNumber, wild), liveUsers()))
        .limit(1);
      user = suffix;
    }
  } else if (email) {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(and(eq(schema.users.email, email), liveUsers()))
      .limit(1);
    user = row;
  }

  // Audit the search itself even when nothing matches. Don't log the
  // search digits — log that a search happened.
  void auditRead(actorFromContext(c), {
    action: 'customer.search',
    entityType: 'user',
    entityId: user?.id ?? null,
    scope: orderId ? 'by orderId' : phone ? 'by phone' : 'by email',
  });

  if (!user) return c.json({ customer: null });
  return c.json({ customer: publicUser(user) });
});

staffRoutes.get('/customers/:id', async (c) => {
  const id = c.req.param('id');
  const [user] = await db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.id, id), liveUsers()))
    .limit(1);
  if (!user) return c.json({ error: 'customer_not_found' }, 404);

  // Pull recent orders + active prescriptions for the profile view.
  const orders = await db
    .select({
      id: schema.orders.id,
      status: schema.orders.status,
      total: schema.orders.total,
      placedAt: schema.orders.placedAt,
    })
    .from(schema.orders)
    .where(and(eq(schema.orders.userId, id), liveOrders()))
    .orderBy(desc(schema.orders.placedAt))
    .limit(20);

  const prescriptions = await db
    .select({
      id: schema.prescriptions.id,
      productId: schema.prescriptions.productId,
      status: schema.prescriptions.status,
      approvedAt: schema.prescriptions.approvedAt,
      expiresAt: schema.prescriptions.expiresAt,
      createdAt: schema.prescriptions.createdAt,
      productName: schema.products.name,
    })
    .from(schema.prescriptions)
    .leftJoin(
      schema.products,
      eq(schema.prescriptions.productId, schema.products.id)
    )
    .where(eq(schema.prescriptions.userId, id))
    .orderBy(desc(schema.prescriptions.createdAt))
    .limit(20);

  void auditRead(actorFromContext(c), {
    action: 'customer.view',
    entityType: 'user',
    entityId: id,
  });

  return c.json({ customer: publicUser(user), orders, prescriptions });
});

staffRoutes.get('/customers/:id/medical', async (c) => {
  const id = c.req.param('id');
  const [user] = await db
    .select({
      id: schema.users.id,
      firstName: schema.users.firstName,
      lastName: schema.users.lastName,
    })
    .from(schema.users)
    .where(and(eq(schema.users.id, id), liveUsers()))
    .limit(1);
  if (!user) return c.json({ error: 'customer_not_found' }, 404);

  // The full medical profile (allergies, conditions, pregnancy status,
  // blood type) is currently customer-side state in the mobile app's
  // local store. When the mobile app starts publishing it (via a future
  // POST /me/medical endpoint), this read will return it. Until then we
  // return only the placeholder shape so the admin UI can render.
  //
  // The audit row STILL writes — opening the medical drawer is the
  // accountability event regardless of what was visible.
  void auditRead(actorFromContext(c), {
    action: 'customer.medical_profile_view',
    entityType: 'user',
    entityId: id,
  });

  return c.json({
    customer: user,
    medical: {
      pregnancyStatus: null,
      bloodType: null,
      allergies: [] as string[],
      conditions: [] as string[],
      note: 'Customer-side medical profile is not yet published to the backend. See TODOS.md.',
    },
  });
});

// --------------------------------------------------------------------
// Prescriptions: pharmacist queue + approve/reject
// --------------------------------------------------------------------

staffRoutes.get('/prescriptions/pending', async (c) => {
  const rows = await db
    .select({
      id: schema.prescriptions.id,
      userId: schema.prescriptions.userId,
      productId: schema.prescriptions.productId,
      status: schema.prescriptions.status,
      imagePath: schema.prescriptions.imagePath,
      prescribedBy: schema.prescriptions.prescribedBy,
      notes: schema.prescriptions.notes,
      createdAt: schema.prescriptions.createdAt,
      productName: schema.products.name,
      productNameAr: schema.products.nameAr,
      productImage: schema.products.image,
      customerFirstName: schema.users.firstName,
      customerLastName: schema.users.lastName,
      customerPhone: schema.users.phoneNumber,
    })
    .from(schema.prescriptions)
    .leftJoin(
      schema.products,
      eq(schema.prescriptions.productId, schema.products.id)
    )
    .leftJoin(schema.users, eq(schema.prescriptions.userId, schema.users.id))
    .where(eq(schema.prescriptions.status, 'pending_review'))
    .orderBy(desc(schema.prescriptions.createdAt));

  return c.json({ prescriptions: rows });
});

staffRoutes.post('/prescriptions/:id/approve', async (c) => {
  const actor = actorFromContext(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const expiresAt = parseExpiry((body as Record<string, unknown>)?.expiresAt);

  const updated = db.transaction((tx) => {
    const [before] = tx
      .select()
      .from(schema.prescriptions)
      .where(eq(schema.prescriptions.id, id))
      .limit(1)
      .all();
    if (!before) return null;
    if (before.status !== 'pending_review') return { conflict: before } as const;

    const now = new Date();
    const [after] = tx
      .update(schema.prescriptions)
      .set({
        status: 'approved',
        approvedAt: now,
        expiresAt: expiresAt ?? defaultExpiry(),
        updatedAt: now,
      })
      .where(eq(schema.prescriptions.id, id))
      .returning()
      .all();

    audit(tx, actor, {
      action: 'prescription.approve',
      entityType: 'prescription',
      entityId: id,
      before: { status: before.status },
      after: { status: after.status, approvedAt: after.approvedAt, expiresAt: after.expiresAt },
    });
    return after;
  });

  if (!updated) return c.json({ error: 'prescription_not_found' }, 404);
  if ('conflict' in updated)
    return c.json({ error: 'not_pending', current: updated.conflict.status }, 409);
  return c.json({ prescription: updated });
});

staffRoutes.post('/prescriptions/:id/reject', async (c) => {
  const actor = actorFromContext(c);
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const reason =
    typeof (body as Record<string, unknown>)?.reason === 'string'
      ? ((body as Record<string, unknown>).reason as string).slice(0, 500)
      : null;

  const updated = db.transaction((tx) => {
    const [before] = tx
      .select()
      .from(schema.prescriptions)
      .where(eq(schema.prescriptions.id, id))
      .limit(1)
      .all();
    if (!before) return null;
    if (before.status !== 'pending_review') return { conflict: before } as const;

    const now = new Date();
    const [after] = tx
      .update(schema.prescriptions)
      .set({
        status: 'rejected',
        notes: reason ?? before.notes,
        updatedAt: now,
      })
      .where(eq(schema.prescriptions.id, id))
      .returning()
      .all();

    audit(tx, actor, {
      action: 'prescription.reject',
      entityType: 'prescription',
      entityId: id,
      before: { status: before.status },
      after: { status: after.status, reason },
    });
    return after;
  });

  if (!updated) return c.json({ error: 'prescription_not_found' }, 404);
  if ('conflict' in updated)
    return c.json({ error: 'not_pending', current: updated.conflict.status }, 409);
  return c.json({ prescription: updated });
});

// --------------------------------------------------------------------
// Audit log: read-only forensics view.
//
// Per scope reduction 1, the rich filterable Audit page is deferred to
// v1.1 — but the data is here from day 1. This minimal endpoint lets a
// future admin UI tail recent events without rebuilding it.
// --------------------------------------------------------------------

staffRoutes.get('/audit', async (c) => {
  const limit = Math.min(Number(c.req.query('limit') ?? '100'), 500);
  const entityType = c.req.query('entityType');
  const entityId = c.req.query('entityId');
  const actorUserId = c.req.query('actorUserId');

  const filters = [] as ReturnType<typeof eq>[];
  if (entityType) filters.push(eq(schema.auditLog.entityType, entityType));
  if (entityId) filters.push(eq(schema.auditLog.entityId, entityId));
  if (actorUserId) filters.push(eq(schema.auditLog.actorUserId, actorUserId));

  const rows = filters.length
    ? await db
        .select()
        .from(schema.auditLog)
        .where(and(...filters))
        .orderBy(desc(schema.auditLog.createdAt))
        .limit(limit)
    : await db
        .select()
        .from(schema.auditLog)
        .orderBy(desc(schema.auditLog.createdAt))
        .limit(limit);

  return c.json({ rows });
});

// ====================================================================
// Helpers
// ====================================================================

const PRODUCT_CATEGORIES = [
  'pregnancy',
  'vitamins',
  'hormonal',
  'skincare',
  'menstrual',
  'pain',
  'chronic',
  'postpartum',
] as const;
type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

type ProductInsert = typeof schema.products.$inferInsert;

type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

function validateProductInput(
  body: unknown,
  opts: { create: boolean }
): Validation<Partial<ProductInsert>> {
  if (!body || typeof body !== 'object')
    return { ok: false, error: 'invalid_body' };
  const b = body as Record<string, unknown>;

  const value: Partial<ProductInsert> = {};

  if (opts.create) {
    if (typeof b.name !== 'string' || !b.name.trim())
      return { ok: false, error: 'name_required' };
    if (typeof b.category !== 'string' ||
        !(PRODUCT_CATEGORIES as readonly string[]).includes(b.category))
      return { ok: false, error: 'invalid_category', allowed: PRODUCT_CATEGORIES } as never;
    if (typeof b.price !== 'number' || b.price < 0)
      return { ok: false, error: 'price_required' };
  }

  if (b.name !== undefined) {
    if (typeof b.name !== 'string') return { ok: false, error: 'invalid_name' };
    value.name = b.name.trim();
  }
  if (b.nameAr !== undefined) {
    if (typeof b.nameAr !== 'string') return { ok: false, error: 'invalid_nameAr' };
    value.nameAr = b.nameAr;
  }
  if (b.brand !== undefined) {
    if (typeof b.brand !== 'string') return { ok: false, error: 'invalid_brand' };
    value.brand = b.brand;
  }
  if (b.category !== undefined) {
    if (typeof b.category !== 'string' ||
        !(PRODUCT_CATEGORIES as readonly string[]).includes(b.category))
      return { ok: false, error: 'invalid_category' };
    value.category = b.category as ProductCategory;
  }
  if (b.price !== undefined) {
    if (typeof b.price !== 'number' || b.price < 0)
      return { ok: false, error: 'invalid_price' };
    value.price = b.price;
  }
  if (b.oldPrice !== undefined) {
    if (b.oldPrice !== null && (typeof b.oldPrice !== 'number' || b.oldPrice < 0))
      return { ok: false, error: 'invalid_oldPrice' };
    value.oldPrice = b.oldPrice as number | null;
  }
  if (b.unit !== undefined && typeof b.unit === 'string') value.unit = b.unit;
  if (b.image !== undefined && typeof b.image === 'string') value.image = b.image;
  if (b.description !== undefined && typeof b.description === 'string')
    value.description = b.description;
  if (b.pharmacistNote !== undefined) {
    value.pharmacistNote =
      typeof b.pharmacistNote === 'string' ? b.pharmacistNote : null;
  }
  if (b.sku !== undefined) {
    value.sku = typeof b.sku === 'string' ? b.sku.trim() || null : null;
  }
  if (b.barcode !== undefined) {
    value.barcode = typeof b.barcode === 'string' ? b.barcode.trim() || null : null;
  }
  if (b.stockCount !== undefined && typeof b.stockCount === 'number')
    value.stockCount = Math.max(0, Math.floor(b.stockCount));
  if (b.inStock !== undefined && typeof b.inStock === 'boolean')
    value.inStock = b.inStock;
  if (b.rxRequired !== undefined && typeof b.rxRequired === 'boolean')
    value.rxRequired = b.rxRequired;
  if (b.pregnancySafe !== undefined && typeof b.pregnancySafe === 'boolean')
    value.pregnancySafe = b.pregnancySafe;
  if (b.tags !== undefined && Array.isArray(b.tags)) {
    value.tags = b.tags.filter((t): t is string => typeof t === 'string');
  }

  return { ok: true, value };
}

function defaultExpiry(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 12);
  return d;
}

function parseExpiry(raw: unknown): Date | null {
  if (typeof raw !== 'string') return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? new Date(t) : null;
}

function publicUser(u: typeof schema.users.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    phoneNumber: u.phoneNumber,
    phoneVerifiedAt: u.phoneVerifiedAt,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    createdAt: u.createdAt,
  };
}

// Suppress "imported but only used in JSDoc" type-only references the
// linter sometimes flags. inArray + sql are kept available for future
// audit filters without re-importing on each addition.
void inArray;
void sql;
