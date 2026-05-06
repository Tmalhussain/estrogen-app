import { Hono } from 'hono';
import { and, eq, inArray, like, or } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';
import { verifySession } from '../lib/jwt.ts';

export const productRoutes = new Hono();

/**
 * Optional auth — read the JWT if present so we can enforce Rx gating
 * with the caller's prescription set, but DON'T 401 for missing token.
 * The mobile scan flow always sends Authorization (logged-in users),
 * but other callers (curl exploration) get the public/unfiltered path.
 */
async function getOptionalUser(c: import('hono').Context) {
  const header = c.req.header('Authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  return await verifySession(token);
}

/**
 * Return the set of productIds for which the user has an approved,
 * non-expired prescription. One query, used to compute `canOrder` on
 * each product in a list response.
 */
async function approvedProductIds(userId: string | null): Promise<Set<string>> {
  if (!userId) return new Set();
  const rows = await db
    .select({
      productId: schema.prescriptions.productId,
      expiresAt: schema.prescriptions.expiresAt,
    })
    .from(schema.prescriptions)
    .where(
      and(
        eq(schema.prescriptions.userId, userId),
        eq(schema.prescriptions.status, 'approved')
      )
    );
  const now = Date.now();
  const out = new Set<string>();
  for (const r of rows) {
    if (!r.expiresAt || r.expiresAt.getTime() > now) out.add(r.productId);
  }
  return out;
}

/**
 * Decorate a raw product row with a `canOrder` flag and (when Rx) a
 * `lockedReason`. OTC products always have canOrder=true. Rx products
 * only have canOrder=true when the caller has an approved prescription.
 */
function decorate<T extends { id: string; rxRequired: boolean }>(
  row: T,
  approved: Set<string>
): T & { canOrder: boolean; lockedReason: 'prescription_required' | null } {
  if (!row.rxRequired)
    return { ...row, canOrder: true, lockedReason: null };
  const has = approved.has(row.id);
  return {
    ...row,
    canOrder: has,
    lockedReason: has ? null : 'prescription_required',
  };
}

productRoutes.get('/', async (c) => {
  const category = c.req.query('category');
  const inStockOnly = c.req.query('inStock') === 'true';
  const rxOnly = c.req.query('rx') === 'true';
  const q = c.req.query('q')?.trim();

  const conditions = [] as ReturnType<typeof eq>[];
  if (category) conditions.push(eq(schema.products.category, category as never));
  if (inStockOnly) conditions.push(eq(schema.products.inStock, true));
  if (rxOnly) conditions.push(eq(schema.products.rxRequired, true));
  if (q) {
    const wild = `%${q}%`;
    conditions.push(
      or(
        like(schema.products.name, wild),
        like(schema.products.nameAr, wild),
        like(schema.products.brand, wild)
      )!
    );
  }

  const rows =
    conditions.length > 0
      ? await db
          .select()
          .from(schema.products)
          .where(and(...conditions))
      : await db.select().from(schema.products);

  const claims = await getOptionalUser(c);
  const approved = await approvedProductIds(claims?.sub ?? null);
  return c.json({ products: rows.map((r) => decorate(r, approved)) });
});

productRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [row] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);
  if (!row) return c.json({ error: 'product_not_found' }, 404);
  const claims = await getOptionalUser(c);
  const approved = await approvedProductIds(claims?.sub ?? null);
  return c.json({ product: decorate(row, approved) });
});

/**
 * GET /products/by-barcode/:code
 *
 * Resolves a printed retail barcode (EAN-13 / UPC) to a product row.
 * Used by the mobile scan flow.
 *
 * Always returns 200 + the full product row when the barcode is in
 * our catalog — even for Rx products the caller can't order. The
 * `canOrder` flag tells the mobile UI whether to render the Add to
 * cart action or the locked / "upload prescription" state. Hiding Rx
 * products entirely (the previous 403 behavior) made it harder for
 * customers to confirm "yes the pharmacy carries this" before going
 * through the prescription flow.
 *
 *   404 not_in_catalog        — barcode not in our products table
 *   400 invalid_barcode_format — not 6-14 digits
 *   200 { product, canOrder, lockedReason }
 *
 * `lockedReason` is "prescription_required" for Rx products without an
 * approved prescription, otherwise null.
 */
productRoutes.get('/by-barcode/:code', async (c) => {
  const code = c.req.param('code').trim();
  if (!/^\d{6,14}$/.test(code))
    return c.json({ error: 'invalid_barcode_format' }, 400);

  const [product] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.barcode, code))
    .limit(1);
  if (!product) return c.json({ error: 'not_in_catalog', barcode: code }, 404);

  const claims = await getOptionalUser(c);
  const approved = await approvedProductIds(claims?.sub ?? null);
  return c.json({ product: decorate(product, approved) });
});
