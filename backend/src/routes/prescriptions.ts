import { Hono } from 'hono';
import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';
import { requireAuth, type AuthVariables } from '../middleware/auth.ts';

export const prescriptionRoutes = new Hono<{ Variables: AuthVariables }>();

prescriptionRoutes.use('*', requireAuth);

prescriptionRoutes.get('/mine', async (c) => {
  const claims = c.get('user');
  const rows = await db
    .select({
      id: schema.prescriptions.id,
      productId: schema.prescriptions.productId,
      status: schema.prescriptions.status,
      prescribedBy: schema.prescriptions.prescribedBy,
      approvedAt: schema.prescriptions.approvedAt,
      expiresAt: schema.prescriptions.expiresAt,
      createdAt: schema.prescriptions.createdAt,
      productName: schema.products.name,
      productNameAr: schema.products.nameAr,
      productImage: schema.products.image,
    })
    .from(schema.prescriptions)
    .leftJoin(
      schema.products,
      eq(schema.prescriptions.productId, schema.products.id)
    )
    .where(eq(schema.prescriptions.userId, claims.sub))
    .orderBy(desc(schema.prescriptions.createdAt));
  return c.json({ prescriptions: rows });
});

/**
 * Customer uploads a prescription. For now we record the metadata and
 * mark it pending_review. A pharmacist would later approve via an
 * admin tool. Image storage path stays opaque here — the actual file
 * lives in Firebase Storage / S3 in production.
 */
prescriptionRoutes.post('/', async (c) => {
  const claims = c.get('user');
  const body = await c.req.json().catch(() => null);
  if (!body || typeof body !== 'object')
    return c.json({ error: 'invalid_body' }, 400);

  const { productId, imagePath, prescribedBy, notes } = body as Record<string, unknown>;
  if (typeof productId !== 'string' || !productId)
    return c.json({ error: 'product_id_required' }, 400);

  const [product] = await db
    .select({ id: schema.products.id, rxRequired: schema.products.rxRequired })
    .from(schema.products)
    .where(eq(schema.products.id, productId))
    .limit(1);
  if (!product) return c.json({ error: 'product_not_found' }, 404);
  if (!product.rxRequired)
    return c.json({ error: 'product_does_not_require_prescription' }, 400);

  // If the user already has an approved + non-expired prescription for
  // this product, just return that one — no need for them to re-upload.
  const [existingApproved] = await db
    .select()
    .from(schema.prescriptions)
    .where(
      and(
        eq(schema.prescriptions.userId, claims.sub),
        eq(schema.prescriptions.productId, productId),
        eq(schema.prescriptions.status, 'approved')
      )
    )
    .limit(1);
  if (existingApproved) {
    const stillValid =
      !existingApproved.expiresAt ||
      existingApproved.expiresAt.getTime() > Date.now();
    if (stillValid) return c.json({ prescription: existingApproved, alreadyApproved: true });
  }

  const [created] = await db
    .insert(schema.prescriptions)
    .values({
      userId: claims.sub,
      productId,
      status: 'pending_review',
      imagePath: typeof imagePath === 'string' ? imagePath : null,
      prescribedBy: typeof prescribedBy === 'string' ? prescribedBy.trim() : null,
      notes: typeof notes === 'string' ? notes.slice(0, 500) : null,
    })
    .returning();
  return c.json({ prescription: created });
});
