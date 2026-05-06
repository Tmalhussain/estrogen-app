import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { authRoutes } from './routes/auth.ts';
import { productRoutes } from './routes/products.ts';
import { orderRoutes } from './routes/orders.ts';
import { stockRoutes } from './routes/stock.ts';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) =>
  c.json({
    name: 'estrogen-backend',
    version: '1.0.0',
    endpoints: {
      auth: ['POST /auth/signup', 'POST /auth/login', 'GET /auth/me'],
      products: ['GET /products', 'GET /products/:id'],
      orders: [
        'GET /orders (auth)',
        'POST /orders (auth)',
        'GET /orders/:id (auth)',
      ],
      stock: ['GET /api/stock (X-API-Key)', 'POST /api/stock/update (X-API-Key)'],
    },
  })
);

app.route('/auth', authRoutes);
app.route('/products', productRoutes);
app.route('/orders', orderRoutes);
app.route('/api/stock', stockRoutes);

app.notFound((c) => c.json({ error: 'not_found', path: c.req.path }, 404));
app.onError((err, c) => {
  console.error('[onError]', err);
  return c.json({ error: 'internal_error', message: err.message }, 500);
});

const port = Number.parseInt(process.env.PORT ?? '8787', 10);
serve({ fetch: app.fetch, port }, (info) => {
  console.log(`estrogen-backend listening on http://127.0.0.1:${info.port}`);
});
