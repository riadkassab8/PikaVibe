const configuredApiUrl = String(import.meta.env.VITE_API_URL || 'https://pika-vibe-pikavibe-store-he3pissa7.vercel.app').replace(/\/$/, '');
const API_BASE_URL = import.meta.env.PROD
  ? 'https://pika-vibe-pikavibe-store.vercel.app/api'
  : (configuredApiUrl
    ? (configuredApiUrl.endsWith('/api') ? configuredApiUrl : `${configuredApiUrl}/api`)
    : '/api');

export type ApiProduct = {
  id: string;
  backendId?: number;
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  category: string;
  price: number;
  basePrice?: number;
  oldPrice?: number;
  discount?: number;
  discountPercent?: number | null;
  discountActive?: boolean;
  discountStartsAt?: string | null;
  discountEndsAt?: string | null;
  image: string;
  images: string[];
  description: string;
  specifications: string[];
  rating: number;
  inStock: boolean;
  stock: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  active?: boolean;
  variants?: Array<{ name: string; options: string[] }>;
};

export type AdminCategory = { id: number; slug: string; name: string; nameAr?: string | null; nameEn?: string | null; active: boolean };

export type AdminOrder = {
  id: number;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  customer: {
    name: string;
    phone: string;
    governorate: string;
    city: string;
    address: string;
    notes: string;
  };
  items: Array<{
    productId: number;
    name: string;
    price: number;
    quantity: number;
    variant?: string;
  }>;
  createdAt: string;
};

export type OrderPayload = {
  customer: {
    name: string;
    phone: string;
    governorate: string;
    city: string;
    address: string;
    notes?: string;
  };
  items: Array<{
    productId: string | number;
    quantity: number;
    variant?: string;
  }>;
  paymentMethod: string;
};

export type OrderResponse = AdminOrder;
export type NewOrderListener = (order: AdminOrder) => void;

function adminHeaders(): Record<string, string> {
  const token = localStorage.getItem('pikavibe-admin-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  const auth = adminHeaders();
  if (auth.Authorization) headers.set('Authorization', auth.Authorization);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'Request failed') as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return body as T;
}

function normalizeProduct(product: any): ApiProduct {
  const images = Array.isArray(product.images) && product.images.length
    ? product.images.filter(Boolean).map(String)
    : [String(product.imageUrl || product.image || '')].filter(Boolean);
  const price = Number(product.price) || 0;
  const oldPrice = product.oldPrice == null ? undefined : Number(product.oldPrice);
  return {
    ...product,
    id: String(product.slug || product.id),
    backendId: Number(product.id) || undefined,
    price,
    basePrice: product.basePrice == null ? undefined : Number(product.basePrice),
    oldPrice,
    discount: oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : undefined,
    discountPercent: product.discountPercent == null ? undefined : Number(product.discountPercent),
    discountActive: product.discountActive == null ? undefined : Boolean(product.discountActive),
    discountStartsAt: product.discountStartsAt == null ? undefined : String(product.discountStartsAt),
    discountEndsAt: product.discountEndsAt == null ? undefined : String(product.discountEndsAt),
    image: images[0] || '',
    images,
    description: String(product.description || ''),
    specifications: Array.isArray(product.specifications) ? product.specifications.map(String) : [],
    rating: Number(product.rating) || 4.8,
    stock: Math.max(0, Number(product.stock) || 0),
    inStock: product.active !== false && (Number(product.stock) || 0) > 0,
    active: product.active !== false,
    isBestSeller: Boolean(product.featured || product.isBestSeller),
    variants: Array.isArray(product.variants) ? product.variants : [],
  };
}

export async function fetchCategories(all = false): Promise<AdminCategory[]> {
  try { return await request<AdminCategory[]>(`/categories${all ? '/all' : ''}`); }
  catch (error) { console.error('Error fetching categories:', error); return []; }
}

export async function createCategory(name: string, nameAr?: string, nameEn?: string) {
  return request<AdminCategory>('/categories', { method: 'POST', body: JSON.stringify({ name: nameEn || nameAr || name, nameAr, nameEn }) });
}

export async function updateCategory(id: number, name: string, active: boolean, nameAr?: string, nameEn?: string) {
  return request<AdminCategory>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify({ name: nameEn || nameAr || name, nameAr, nameEn, active }) });
}

export async function deleteCategory(id: number) {
  return request<{ message: string }>(`/categories/${id}`, { method: 'DELETE' });
}

export async function fetchProducts(includeInactive = false): Promise<ApiProduct[]> {
  try {
    const data = await request<any[]>(`/products${includeInactive ? '?includeInactive=true' : ''}`);
    return Array.isArray(data) ? data.map(normalizeProduct) : [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function fetchProduct(id: string | number): Promise<ApiProduct | null> {
  try {
    return normalizeProduct(await request<any>(`/products/${encodeURIComponent(String(id))}`));
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function createProduct(product: unknown) {
  return request<ApiProduct>('/products', { method: 'POST', body: JSON.stringify(product) });
}

export async function updateProduct(id: number, product: unknown) {
  return request<ApiProduct>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) });
}

export async function deleteProduct(id: number) {
  return request<{ message: string }>(`/products/${id}`, { method: 'DELETE' });
}

export async function fetchOrders(): Promise<AdminOrder[]> {
  try {
    return await request<AdminOrder[]>('/orders');
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

export async function fetchOrder(id: number): Promise<AdminOrder | null> {
  try {
    return await request<AdminOrder>(`/orders/${id}`);
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

export async function createOrder(order: OrderPayload) {
  return request<OrderResponse>('/orders', { method: 'POST', body: JSON.stringify(order) });
}

export async function updateOrderStatus(id: number, status: string) {
  return request<AdminOrder>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
}

export async function deleteOrder(id: number) {
  return request<{ message: string }>(`/orders/${id}`, { method: 'DELETE' });
}

export async function adminLogin(email: string, password: string) {
  return request<{ token: string; admin: { email: string; name: string } }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function subscribeToNewOrders(onOrder: NewOrderListener, onConnectionChange?: (connected: boolean) => void) {
  const controller = new AbortController();
  const run = async () => {
    const response = await fetch(`${API_BASE_URL}/admin/events`, { headers: adminHeaders(), signal: controller.signal });
    if (!response.ok || !response.body) throw new Error('Realtime connection failed');
    onConnectionChange?.(true);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (!controller.signal.aborted) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';
      for (const block of blocks) {
        if (!block.split('\n').some((line) => line === 'event: new_order')) continue;
        const data = block.split('\n').find((line) => line.startsWith('data: '))?.slice(6);
        if (data) onOrder(JSON.parse(data) as AdminOrder);
      }
    }
  };
  void run().catch((error) => {
    onConnectionChange?.(false);
    if (!controller.signal.aborted) console.warn(error);
  });
  return () => controller.abort();
}

export async function fetchDashboard() {
  return request<{
    totalOrders: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    totalProducts: number;
    lowStockProducts: number;
    revenue: number;
  }>('/admin/dashboard');
}
