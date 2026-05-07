/**
 * API client for the admin web. Hits the same Hono backend the mobile
 * app uses. In dev, vite.config.ts proxies /api → http://127.0.0.1:8787.
 *
 * Token is held in localStorage under `estrogen.admin.token`. On 401
 * the client clears the token and surfaces the error so the React layer
 * can redirect to /login.
 */

const TOKEN_KEY = 'estrogen.admin.token';

export type ApiUser = {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  firstName: string;
  lastName: string;
  role: 'customer' | 'pharmacist' | 'admin';
  createdAt: string;
};

export type ApiProduct = {
  id: string;
  sku: string | null;
  name: string;
  nameAr: string;
  brand: string;
  category: string;
  price: number;
  oldPrice: number | null;
  unit: string;
  image: string;
  rating: number;
  reviews: number;
  stockCount: number;
  inStock: boolean;
  rxRequired: boolean;
  pregnancySafe: boolean;
  description: string;
  pharmacistNote: string | null;
  tags: string[];
};

export type ApiOrder = {
  id: string;
  userId: string;
  status: 'placed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  subtotal: number;
  deliveryFee: number;
  vat: number;
  total: number;
  address: string;
  deliveryOption: 'standard' | 'express';
  paymentMethod: 'mada' | 'stcpay' | 'applepay' | 'cod';
  notes: string | null;
  placedAt: string;
  updatedAt: string;
  items?: { id: string; productId: string; quantity: number; priceAtOrder: number }[];
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, public details?: unknown) {
    super(code);
  }
}

export const tokenStore = {
  get: (): string | null => {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* private mode — accept the silent failure */
    }
  },
  clear: () => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  },
};

type RequestOpts = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch (err) {
    throw new ApiError(0, 'network_error', err);
  }

  const text = await res.text();
  const json = text ? safeParse(text) : null;

  if (res.status === 401) {
    tokenStore.clear();
  }

  if (!res.ok) {
    const code =
      json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
        ? json.error
        : `http_${res.status}`;
    throw new ApiError(res.status, code, json);
  }

  return json as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body }),
  me: () => request<{ user: ApiUser }>('/auth/me'),

  listProducts: (params?: { q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    const query = qs.toString();
    return request<{ products: ApiProduct[] }>(`/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id: string) => request<{ product: ApiProduct }>(`/products/${id}`),

  // BACKEND-DEPENDENT: these endpoints don't exist yet for staff.
  // They will land in the next backend session (see TODOS.md).
  // For now the admin renders empty states and reads what's public.
  listOrders: () => request<{ orders: ApiOrder[] }>('/orders'),
  getOrder: (id: string) => request<{ order: ApiOrder }>(`/orders/${id}`),
};
