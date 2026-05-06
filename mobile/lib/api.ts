import { Platform } from 'react-native';

/**
 * Resolve the backend base URL for the current runtime.
 *
 * - Web: same-origin or EXPO_PUBLIC_API_URL.
 * - iOS simulator: 127.0.0.1 works.
 * - Android emulator: 10.0.2.2 maps to host loopback.
 * - Physical device: set EXPO_PUBLIC_API_URL=http://<your-lan-ip>:8787 in
 *   .env.local — neither localhost nor 10.0.2.2 will reach your laptop.
 */
function resolveBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL;
  if (explicit && explicit.length > 0) return explicit.replace(/\/$/, '');
  if (Platform.OS === 'android') return 'http://10.0.2.2:8787';
  return 'http://127.0.0.1:8787';
}

export const API_BASE_URL = resolveBaseUrl();

export type ApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
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

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
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

  if (!res.ok) {
    const code =
      (json && typeof json === 'object' && 'error' in json && typeof json.error === 'string'
        ? json.error
        : `http_${res.status}`) || `http_${res.status}`;
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
  signup: (body: {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
    phone?: string;
  }) => request<{ token: string; user: ApiUser }>('/auth/signup', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body }),
  me: (token: string) => request<{ user: ApiUser }>('/auth/me', { token }),

  listProducts: (params?: { category?: string; q?: string; rxOnly?: boolean; inStockOnly?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set('category', params.category);
    if (params?.q) qs.set('q', params.q);
    if (params?.rxOnly) qs.set('rx', 'true');
    if (params?.inStockOnly) qs.set('inStock', 'true');
    const query = qs.toString();
    return request<{ products: ApiProduct[] }>(`/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id: string) => request<{ product: ApiProduct }>(`/products/${id}`),

  listOrders: (token: string) =>
    request<{ orders: ApiOrder[] }>('/orders', { token }),
  getOrder: (id: string, token: string) =>
    request<{ order: ApiOrder }>(`/orders/${id}`, { token }),
  createOrder: (
    token: string,
    body: {
      items: { productId: string; quantity: number }[];
      address: string;
      deliveryOption?: 'standard' | 'express';
      paymentMethod?: 'mada' | 'stcpay' | 'applepay' | 'cod';
      notes?: string;
    }
  ) => request<{ order: ApiOrder }>('/orders', { method: 'POST', body, token }),
};
