import { Hono } from 'hono';
import { eq, inArray } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';
import { requireApiKey, type ApiKeyVariables } from '../middleware/api-key.ts';

export const stockRoutes = new Hono<{ Variables: ApiKeyVariables }>();

stockRoutes.get('/', requireApiKey('stock:read'), async (c) => {
  const products = await db
    .select({
      id: schema.products.id,
      sku: schema.products.sku,
      name: schema.products.name,
      stockCount: schema.products.stockCount,
      inStock: schema.products.inStock,
      updatedAt: schema.products.updatedAt,
    })
    .from(schema.products);
  return c.json({ products });
});

/**
 * POST /api/stock/update
 *
 * Body: { updates: [{ productId | sku, delta? | absolute? }, ...] }
 *
 * Each entry must specify either `productId` or `sku` to identify the
 * product, and exactly one of:
 *   - `delta`: signed integer to add to current stock (e.g., -3 sold,
 *     +50 restock).
 *   - `absolute`: non-negative integer to set the stock to this value.
 *
 * The update runs in a single transaction. If any line fails (unknown
 * product, negative absolute, would drive stock below zero) the whole
 * batch rolls back.
 */
stockRoutes.post('/update', requireApiKey('stock:update'), async (c) => {
  const apiKey = c.get('apiKey');
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return c.json({ error: 'invalid_body' }, 400);

  const { updates } = body as { updates?: unknown };
  if (!Array.isArray(updates) || updates.length === 0)
    return c.json({ error: 'updates_required' }, 400);
  if (updates.length > 1000)
    return c.json({ error: 'batch_too_large', max: 1000 }, 400);

  type Line = {
    productId?: string;
    sku?: string;
    delta?: number;
    absolute?: number;
    note?: string;
  };
  const lines = updates as Line[];

  for (const [i, l] of lines.entries()) {
    if (!l || typeof l !== 'object') return c.json({ error: 'invalid_line', i }, 400);
    if (!l.productId && !l.sku)
      return c.json({ error: 'line_missing_identifier', i }, 400);
    const hasDelta = typeof l.delta === 'number';
    const hasAbsolute = typeof l.absolute === 'number';
    if (hasDelta === hasAbsolute)
      return c.json({ error: 'line_needs_delta_xor_absolute', i }, 400);
    if (hasAbsolute && l.absolute! < 0)
      return c.json({ error: 'line_absolute_negative', i }, 400);
  }

  const ids = lines.flatMap((l) => (l.productId ? [l.productId] : []));
  const skus = lines.flatMap((l) => (l.sku ? [l.sku] : []));

  const byId = ids.length
    ? await db.select().from(schema.products).where(inArray(schema.products.id, ids))
    : [];
  const bySku = skus.length
    ? await db.select().from(schema.products).where(inArray(schema.products.sku, skus))
    : [];

  const idMap = new Map(byId.map((p) => [p.id, p]));
  const skuMap = new Map(bySku.map((p) => [p.sku!, p]));

  const resolved: { product: typeof schema.products.$inferSelect; line: Line }[] = [];
  for (const line of lines) {
    const product = line.productId
      ? idMap.get(line.productId)
      : skuMap.get(line.sku!);
    if (!product) {
      return c.json(
        { error: 'product_not_found', identifier: line.productId ?? line.sku },
        404
      );
    }
    resolved.push({ product, line });
  }

  type AppliedLine = { productId: string; before: number; after: number; delta: number };
  try {
    const applied = db.transaction((insert) => {
      const out: AppliedLine[] = [];
      for (const { product, line } of resolved) {
        const before = product.stockCount;
        const after =
          typeof line.absolute === 'number'
            ? line.absolute
            : before + (line.delta ?? 0);
        if (after < 0) {
          throw Object.assign(new Error('stock_would_go_negative'), {
            status: 409,
            productId: product.id,
            before,
            requested: after,
          });
        }
        const delta = after - before;
        insert
          .update(schema.products)
          .set({ stockCount: after, inStock: after > 0, updatedAt: new Date() })
          .where(eq(schema.products.id, product.id))
          .run();
        insert
          .insert(schema.stockMovements)
          .values({
            productId: product.id,
            delta,
            afterStock: after,
            source: 'api',
            apiKeyId: apiKey.id,
            note: line.note?.slice(0, 200) ?? null,
          })
          .run();
        out.push({ productId: product.id, before, after, delta });
      }
      return out;
    });
    return c.json({ ok: true, applied });
  } catch (err) {
    const e = err as Error & { status?: number };
    if (e.status === 409) {
      return c.json(
        {
          error: e.message,
          productId: (e as unknown as { productId: string }).productId,
        },
        409
      );
    }
    throw err;
  }
});
