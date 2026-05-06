import { Hono } from 'hono';
import { and, eq, like, or } from 'drizzle-orm';
import { db, schema } from '../db/index.ts';

export const productRoutes = new Hono();

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
