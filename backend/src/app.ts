import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { authRoutes } from './routes/auth.ts';
import { otpRoutes } from './routes/otp.ts';
import { productRoutes } from './routes/products.ts';
import { orderRoutes } from './routes/orders.ts';
import { prescriptionRoutes } from './routes/prescriptions.ts';
import { stockRoutes } from './routes/stock.ts';

export const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) =>
  c.json({
    name: 'estrogen-backend',
    version: '1.0.0',
    endpoints: {
      otp: ['POST /auth/send-otp', 'POST /auth/verify-otp'],
      auth: ['POST /auth/signup', 'POST /auth/login', 'GET /auth/me'],
      products: [
        'GET /products',
        'GET /products/:id',
        'GET /products/by-barcode/:code (Rx-gated when auth)',
      ],
      orders: [
        'GET /orders (auth)',
        'POST /orders (auth)',
        'GET /orders/:id (auth)',
      ],
      prescriptions: [
        'GET /prescriptions/mine (auth)',
        'POST /prescriptions (auth)',
      ],
      stock: ['GET /api/stock (X-API-Key)', 'POST /api/stock/update (X-API-Key)'],
    },
  })
);

app.route('/auth', otpRoutes);
app.route('/auth', authRoutes);
app.route('/products', productRoutes);
app.route('/orders', orderRoutes);
app.route('/prescriptions', prescriptionRoutes);
app.route('/api/stock', stockRoutes);

app.notFound((c) => c.json({ error: 'not_found', path: c.req.path }, 404));
app.onError((err, c) => {
  console.error('[onError]', err);
  return c.json({ error: 'internal_error', message: err.message }, 500);
});
