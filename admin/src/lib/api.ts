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
  role: 'customer' | 'pharmacist' | 'admin' | 'owner';
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

export type StaffOrder = ApiOrder & {
  customerFirstName: string | null;
  customerLastName: string | null;
  customerPhone: string | null;
};

export type PendingPrescription = {
  id: string;
  userId: string;
  productId: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'expired';
  imagePath: string | null;
  prescribedBy: string | null;
  notes: string | null;
  createdAt: string;
  productName: string | null;
  productNameAr: string | null;
  productImage: string | null;
  customerFirstName: string | null;
  customerLastName: string | null;
  customerPhone: string | null;
};

export type AuditRow = {
  id: string;
  actorUserId: string | null;
  actorRole: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  beforeJson: string | null;
  afterJson: string | null;
  ipAddr: string | null;
  userAgent: string | null;
  createdAt: string;
};

export const api = {
  // Auth — staff endpoint rejects role==='customer' at the door, so a
  // leaked customer credential cannot open the admin even if the public
  // /auth/login is later relaxed.
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: ApiUser }>('/staff/auth/login', {
      method: 'POST',
      body,
    }),
  me: () => request<{ user: ApiUser }>('/auth/me'),

  // Catalog — staff endpoints with full CRUD; every mutation is audited.
  listProducts: (params?: { q?: string }) => {
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    const query = qs.toString();
    return request<{ products: ApiProduct[] }>(
      `/staff/products${query ? `?${query}` : ''}`
    );
  },
  getProduct: (id: string) => request<{ product: ApiProduct }>(`/products/${id}`),
  createProduct: (body: Partial<ApiProduct>) =>
    request<{ product: ApiProduct }>('/staff/products', { method: 'POST', body }),
  updateProduct: (id: string, body: Partial<ApiProduct>) =>
    request<{ product: ApiProduct }>(`/staff/products/${id}`, {
      method: 'PATCH',
      body,
    }),
  deleteProduct: (id: string) =>
    request<{ ok: true }>(`/staff/products/${id}`, { method: 'DELETE' }),

  // Orders — staff sees ALL orders (with customer name/phone joined).
  listOrders: (params?: { status?: ApiOrder['status'] }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    return request<{ orders: StaffOrder[] }>(
      `/staff/orders${query ? `?${query}` : ''}`
    );
  },
  getOrder: (id: string) =>
    request<{
      order: ApiOrder & {
        items: { id: string; productId: string; quantity: number; priceAtOrder: number }[];
        customer:
          | { id: string; firstName: string; lastName: string; phoneNumber: string | null; email: string | null }
          | null;
      };
    }>(`/staff/orders/${id}`),
  createOrder: (body: {
    items: { productId: string; quantity: number }[];
    address: string;
    deliveryOption?: 'standard' | 'express';
    paymentMethod?: 'mada' | 'stcpay' | 'applepay' | 'cod';
    notes?: string;
  }) =>
    request<{ order: ApiOrder }>('/orders', {
      method: 'POST',
      body,
    }),
  updateOrderStatus: (id: string, status: ApiOrder['status']) =>
    request<{ order: ApiOrder }>(`/staff/orders/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),

  // Customers — search-only by design. PDPL lockdown.
  searchCustomer: (params: { phone?: string; email?: string; orderId?: string }) => {
    const qs = new URLSearchParams();
    if (params.phone) qs.set('phone', params.phone);
    if (params.email) qs.set('email', params.email);
    if (params.orderId) qs.set('orderId', params.orderId);
    return request<{ customer: ApiUser | null }>(`/staff/customers?${qs.toString()}`);
  },
  getCustomer: (id: string) =>
    request<{
      customer: ApiUser;
      orders: { id: string; status: ApiOrder['status']; total: number; placedAt: string }[];
      prescriptions: {
        id: string;
        productId: string;
        status: 'pending_review' | 'approved' | 'rejected' | 'expired';
        approvedAt: string | null;
        expiresAt: string | null;
        createdAt: string;
        productName: string | null;
      }[];
    }>(`/staff/customers/${id}`),
  getCustomerMedical: (id: string) =>
    request<{
      customer: { id: string; firstName: string; lastName: string };
      medical: {
        pregnancyStatus: string | null;
        bloodType: string | null;
        allergies: string[];
        conditions: string[];
        note?: string;
      };
    }>(`/staff/customers/${id}/medical`),

  // Prescription review — pharmacist queue.
  pendingPrescriptions: () =>
    request<{ prescriptions: PendingPrescription[] }>(
      `/staff/prescriptions/pending`
    ),
  approvePrescription: (id: string, body?: { expiresAt?: string }) =>
    request(`/staff/prescriptions/${id}/approve`, { method: 'POST', body: body ?? {} }),
  rejectPrescription: (id: string, reason?: string) =>
    request(`/staff/prescriptions/${id}/reject`, {
      method: 'POST',
      body: reason ? { reason } : {},
    }),

  // Audit forensics (read-only).
  audit: (params?: { limit?: number; entityType?: string; entityId?: string; actorUserId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.entityType) qs.set('entityType', params.entityType);
    if (params?.entityId) qs.set('entityId', params.entityId);
    if (params?.actorUserId) qs.set('actorUserId', params.actorUserId);
    const query = qs.toString();
    return request<{ rows: AuditRow[] }>(`/staff/audit${query ? `?${query}` : ''}`);
  },
};
