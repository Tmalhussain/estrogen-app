import { Hono } from 'hono';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';
import { requireAuth, type AuthVariables } from '../middleware/auth.ts';

const VAT_RATE = 0.15;
const FREE_DELIVERY_THRESHOLD = 100;
const STANDARD_FEE = 15;
const EXPRESS_FEE = 35;

export const orderRoutes = new Hono<{ Variables: AuthVariables }>();

orderRoutes.use('*', requireAuth);

orderRoutes.get('/', async (c) => {
  const claims = c.get('user');
  const rows = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.userId, claims.sub))
    .orderBy(desc(schema.orders.placedAt));

  if (rows.length === 0) return c.json({ orders: [] });

  const items = await db
    .select()
    .from(schema.orderItems)
    .where(
      inArray(
        schema.orderItems.orderId,
        rows.map((o) => o.id)
      )
    );

  const grouped = new Map<string, typeof items>();
  for (const it of items) {
    const list = grouped.get(it.orderId) ?? [];
    list.push(it);
    grouped.set(it.orderId, list);
  }

  return c.json({
    orders: rows.map((o) => ({ ...o, items: grouped.get(o.id) ?? [] })),
  });
});

orderRoutes.get('/:id', async (c) => {
  const claims = c.get('user');
  const id = c.req.param('id');
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(and(eq(schema.orders.id, id), eq(schema.orders.userId, claims.sub)))
    .limit(1);
  if (!order) return c.json({ error: 'order_not_found' }, 404);
  const items = await db
    .select()
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, id));
  return c.json({ order: { ...order, items } });
});

orderRoutes.post('/', async (c) => {
  const claims = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return c.json({ error: 'invalid_body' }, 400);

  const {
    items,
    address,
    deliveryOption = 'standard',
    paymentMethod = 'mada',
    notes,
  } = body as Record<string, unknown>;

  if (!Array.isArray(items) || items.length === 0)
    return c.json({ error: 'items_required' }, 400);
  if (typeof address !== 'string' || !address.trim())
    return c.json({ error: 'address_required' }, 400);

  type LineInput = { productId: string; quantity: number };
  const lines: LineInput[] = [];
  for (const raw of items) {
    if (
      typeof raw !== 'object' ||
      raw === null ||
      typeof (raw as LineInput).productId !== 'string' ||
      typeof (raw as LineInput).quantity !== 'number' ||
      (raw as LineInput).quantity <= 0
    ) {
      return c.json({ error: 'invalid_line', value: raw }, 400);
    }
    lines.push({
      productId: (raw as LineInput).productId,
      quantity: Math.floor((raw as LineInput).quantity),
    });
  }

  const productRows = await db
    .select()
    .from(schema.products)
    .where(
      inArray(
        schema.products.id,
        lines.map((l) => l.productId)
      )
    );
  const productMap = new Map(productRows.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItemRows: { productId: string; quantity: number; priceAtOrder: number }[] = [];
  for (const line of lines) {
    const product = productMap.get(line.productId);
    if (!product) return c.json({ error: 'product_not_found', id: line.productId }, 404);
    if (product.stockCount < line.quantity)
      return c.json(
        {
          error: 'insufficient_stock',
          productId: product.id,
          available: product.stockCount,
        },
        409
      );
    subtotal += product.price * line.quantity;
    orderItemRows.push({
      productId: product.id,
      quantity: line.quantity,
      priceAtOrder: product.price,
    });
  }

  const deliveryFee =
    deliveryOption === 'express'
      ? EXPRESS_FEE
      : subtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : STANDARD_FEE;
  const vat = Math.round((subtotal + deliveryFee) * VAT_RATE);
  const total = subtotal + deliveryFee + vat;

  const order = db.transaction((insert) => {
    const [created] = insert
      .insert(schema.orders)
      .values({
        userId: claims.sub,
        subtotal,
        deliveryFee,
        vat,
        total,
        address: address.trim(),
        deliveryOption: deliveryOption as never,
        paymentMethod: paymentMethod as never,
        notes: typeof notes === 'string' ? notes : null,
      })
      .returning()
      .all();

    for (const row of orderItemRows) {
      insert
        .insert(schema.orderItems)
        .values({ orderId: created.id, ...row })
        .run();
      const product = productMap.get(row.productId)!;
      const after = product.stockCount - row.quantity;
      insert
        .update(schema.products)
        .set({ stockCount: after, inStock: after > 0, updatedAt: new Date() })
        .where(eq(schema.products.id, row.productId))
        .run();
      insert
        .insert(schema.stockMovements)
        .values({
          productId: row.productId,
          delta: -row.quantity,
          afterStock: after,
          source: 'order_placed',
          note: `Order ${created.id}`,
        })
        .run();
    }

    return created;
  });

  return c.json({ order });
});
