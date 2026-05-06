import { Hono } from 'hono';
import { and, eq, like, or } from 'drizzle-orm';
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

async function userHasApprovedPrescription(
  userId: string,
  productId: string
): Promise<boolean> {
  const now = new Date();
  const [row] = await db
    .select({ id: schema.prescriptions.id })
    .from(schema.prescriptions)
    .where(
      and(
        eq(schema.prescriptions.userId, userId),
        eq(schema.prescriptions.productId, productId),
        eq(schema.prescriptions.status, 'approved')
      )
    )
    .limit(1);
  if (!row) return false;
  // Treat expired prescriptions as not-approved even if status hasn't
  // been updated by the cron yet.
  const [full] = await db
    .select({ expiresAt: schema.prescriptions.expiresAt })
    .from(schema.prescriptions)
    .where(eq(schema.prescriptions.id, row.id))
    .limit(1);
  if (full?.expiresAt && full.expiresAt.getTime() < now.getTime()) return false;
  return true;
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
  return c.json({ products: rows });
});

productRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  const [row] = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.id, id))
    .limit(1);
  if (!row) return c.json({ error: 'product_not_found' }, 404);
  return c.json({ product: row });
});

/**
 * GET /products/by-barcode/:code
 *
 * Resolves a printed retail barcode (EAN-13 / UPC) to a product row.
 * Used by the mobile scan flow.
 *
 * Behavior:
 *   - 404 not_in_catalog if the barcode isn't in our products table
 *   - 200 + { product, requiresPrescription: false } for OTC items
 *   - 200 + { product, requiresPrescription: true, hasPrescription: true }
 *     when the caller is signed in AND has an approved prescription for
 *     this product (mobile shows it as orderable, with an Rx-verified badge)
 *   - 403 prescription_required for Rx items when there's no approved
 *     prescription. The product info is intentionally omitted from the
 *     403 response so the gate is the gate.
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

  if (!product.rxRequired) {
    return c.json({ product, requiresPrescription: false, hasPrescription: false });
  }

  const claims = await getOptionalUser(c);
  const hasPrescription = claims
    ? await userHasApprovedPrescription(claims.sub, product.id)
    : false;

  if (!hasPrescription) {
    return c.json(
      {
        error: 'prescription_required',
        productName: product.name,
        message:
          'This medication requires a prescription. Upload yours and a pharmacist will review it.',
      },
      403
    );
  }

  return c.json({ product, requiresPrescription: true, hasPrescription: true });
});
