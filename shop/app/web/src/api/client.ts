import { AdminUserRecord,
  CategoryItem,
  ComboRule,
  CustomerGroupType,
  MenuItem,
  OrderRecord,
  PaymentInstruction,
  Product,
  SiteConfigs,
  UiFormatCode,
  UpgradeQuote,
  UserLibraryItem,
  UserProfile,
  UserSessionItem, ClientRegion } from '../types';

const rawApiBase = import.meta.env.API_BASE_URL;
const API_BASE_URL = rawApiBase ? (rawApiBase as string).replace(/\/$/, '') : '';
const rawAdminKey = import.meta.env.ADMIN_API_KEY;
const ADMIN_API_KEY = rawAdminKey ? (rawAdminKey as string) : '';
export const R2_DOMAIN = (
  import.meta.env.R2_DOMAIN ? (import.meta.env.R2_DOMAIN as string) : ''
).replace(/\/$/, '');

export const SESSION_STORAGE_KEY = 'ht_session_token';

function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

function buildAuthHeaders(extra?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = {};
  const savedToken =
    typeof window !== 'undefined' ? localStorage.getItem(SESSION_STORAGE_KEY) : null;
  if (savedToken) {
    headers['Authorization'] = `Bearer ${savedToken}`;
  }
  if (extra) {
    const entries =
      extra instanceof Headers
        ? Array.from(extra.entries())
        : Array.isArray(extra)
        ? extra
        : Object.entries(extra);
    for (const [k, v] of entries) {
      headers[k] = String(v);
    }
  }
  return headers;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const isSafeToRetry = !init?.method || init.method.toUpperCase() === 'GET';
  const maxAttempts = isSafeToRetry ? 3 : 1;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await fetch(buildApiUrl(path), {
        credentials: 'include',
        ...init,
        headers: buildAuthHeaders({
          'Content-Type': 'application/json',
          ...(init?.headers || {}),
        }),
      });

      const data = await response.json();
      if (!response.ok || data.ok === false) {
        throw new Error(data.error || `HTTP Error ${response.status}`);
      }
      return data as T;
    } catch (err: any) {
      lastError = err;
      const isNetworkError =
        err?.name === 'TypeError' ||
        String(err?.message || '').toLowerCase().includes('failed to fetch') ||
        String(err?.message || '').toLowerCase().includes('networkerror');

      if (isNetworkError && attempt < maxAttempts) {
        // Chờ 2.5s để Backend Render hoàn tất thức dậy (Cold start recovery)
        await new Promise((resolve) => setTimeout(resolve, 2500));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Tất cả luồng dữ liệu liên quan đến Database (Tài khoản, Session, Tủ sách, Menu,
 * Danh mục, Sản phẩm, Định dạng, Quy tắc Combo, Đơn hàng, Admin CRUD) đều bắt buộc
 * đi qua Backend API (`app/api`). Frontend tuyệt đối không kết nối trực tiếp vào Supabase.
 */
export const apiClient = {
  // ====================================================================
  // NHÓM AUTHENTICATION & QUẢN LÝ SESSION (SHA3-256)
  // ====================================================================
  async register(payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    customerGroup?: CustomerGroupType | 'Giáo viên' | 'Khác';
    schoolOrOrg?: string;
  }): Promise<{
    ok: boolean;
    token: string;
    user: UserProfile;
  }> {
    return requestJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async login(
    email: string,
    password: string
  ): Promise<{
    ok: boolean;
    token: string;
    user: UserProfile;
  }> {
    return requestJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getCurrentUser(): Promise<{
    ok: boolean;
    user: UserProfile;
    activeSessionCount: number;
  }> {
    return requestJson('/api/auth/me');
  },

  async logout(): Promise<{ ok: boolean; message: string }> {
    return requestJson('/api/auth/logout', { method: 'POST' });
  },

  async logoutAll(): Promise<{ ok: boolean; revokedCount: number; message: string }> {
    return requestJson('/api/auth/logout-all', { method: 'POST' });
  },

  async getSessions(): Promise<{
    ok: boolean;
    sessions: UserSessionItem[];
  }> {
    return requestJson('/api/auth/sessions');
  },

  async revokeSession(sessionId: string): Promise<{
    ok: boolean;
    revoked: boolean;
    message: string;
  }> {
    return requestJson(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
    });
  },

  async changePassword(payload: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ ok: boolean; message: string }> {
    return requestJson('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async forgotPassword(email: string): Promise<{ ok: boolean; message: string }> {
    return requestJson('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async resetPassword(payload: {
    token: string;
    newPassword: string;
  }): Promise<{ ok: boolean; message: string }> {
    return requestJson('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // ====================================================================
  // NHÓM KHÁCH HÀNG: TỦ SÁCH CÁ NHÂN & HỒ SƠ
  // ====================================================================
  async getUserLibrary(): Promise<{
    ok: boolean;
    items: UserLibraryItem[];
  }> {
    return requestJson('/api/user/library');
  },

  async getUserOrders(): Promise<{
    ok: boolean;
    orders: OrderRecord[];
  }> {
    return requestJson('/api/user/orders');
  },

  async updateUserProfile(payload: {
    fullName?: string;
    phone?: string;
    customerGroup?: CustomerGroupType | 'Giáo viên' | 'Khác';
    schoolOrOrg?: string;
    defaultTaxCccd?: string;
    defaultInvoiceAddress?: string;
  }): Promise<{
    ok: boolean;
    user: UserProfile;
    message: string;
  }> {
    return requestJson('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // ====================================================================
  // NHÓM CATALOG & ĐƠN HÀNG
  // ====================================================================
  async getCatalogInit(countryOverride?: 'VN' | 'INTL'): Promise<{
    ok: boolean;
    menus: MenuItem[];
    categories: CategoryItem[];
    comboRules: ComboRule[];
    products: Product[];
    siteConfigs?: SiteConfigs;
    clientRegion: ClientRegion;
    mediaDomain: string;
  }> {
    const tz =
      typeof Intl !== 'undefined' && Intl.DateTimeFormat
        ? Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        : '';
    const params = new URLSearchParams();
    if (countryOverride) params.set('country', countryOverride);
    if (tz) params.set('tz', tz);
    const query = params.toString() ? `?${params.toString()}` : '';
    return requestJson(`/api/catalog/init${query}`);
  },

  async getAdminMenus(): Promise<{ ok: boolean; menus: MenuItem[] }> {
    return requestJson('/api/admin/menus');
  },

  async updateMenus(menus: MenuItem[]): Promise<{ ok: boolean; menus: MenuItem[] }> {
    return requestJson('/api/admin/menus', {
      method: 'PUT',
      body: JSON.stringify({ menus }),
    });
  },

  async getSiteConfigs(): Promise<{ ok: boolean; configs: SiteConfigs }> {
    return requestJson('/api/admin/configs');
  },

  async updateSiteConfig(key: string, value: any): Promise<{ ok: boolean; key: string; value: any }> {
    return requestJson(`/api/admin/configs/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },

  async getProductDetail(slug: string): Promise<{
    ok: boolean;
    product: Product;
    relatedProducts: Product[];
  }> {
    return requestJson(`/api/catalog/products/${encodeURIComponent(slug)}`);
  },

  async getCategoryDetail(slug: string): Promise<{
    ok: boolean;
    category: CategoryItem;
    products: Product[];
  }> {
    return requestJson(`/api/catalog/categories/${encodeURIComponent(slug)}`);
  },

  async createOrder(payload: {
    customerName: string;
    customerEmail: string;
    customerEmailConfirm: string;
    customerPhone: string;
    customerGroup: CustomerGroupType;
    needInvoice: boolean;
    invoiceTaxOrCccd: string;
    invoiceAddress: string;
    flashcardQuantity?: number | null;
    paymentMethod: 'sepay' | 'paypal';
    consentOrderProcessing: boolean;
    consentMarketingEmails?: boolean;
    items: Array<{
      productId: string;
      productTitle: string;
      formatCode: UiFormatCode;
      unitPrice: number;
      quantity: number;
    }>;
  }): Promise<{
    ok: boolean;
    order: OrderRecord;
    mappedGoogleFormNote: string;
    paymentInstruction: PaymentInstruction;
  }> {
    return requestJson('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getOrderStatus(orderCode: string, token?: string): Promise<{
    ok: boolean;
    order: OrderRecord;
    mappedGoogleFormNote: string;
    paymentInstruction: PaymentInstruction;
  }> {
    const q = token ? `?token=${encodeURIComponent(token)}` : '';
    return requestJson(`/api/orders/${encodeURIComponent(orderCode)}${q}`);
  },

  async getUpgradeQuote(slug: string): Promise<{
    ok: boolean;
    quote: UpgradeQuote;
  }> {
    return requestJson(`/api/orders/upgrade-quote?slug=${encodeURIComponent(slug)}`);
  },

  async simulatePaymentSuccess(orderCode: string): Promise<{
    ok: boolean;
    order: OrderRecord;
    googleFormSync: {
      orderCode: string;
      allSuccess: boolean;
      submissions: Array<{
        productName: string;
        mappedFormatNote: string;
        httpStatus: number;
        isSuccess: boolean;
        payload: Record<string, string>;
      }>;
    };
  }> {
    return requestJson('/api/webhook/simulate-payment', {
      method: 'POST',
      body: JSON.stringify({ orderCode }),
    });
  },

  // ====================================================================
  // NHÓM QUẢN TRỊ VIÊN (ADMIN)
  // ====================================================================
  async getAdminOverview(): Promise<{
    ok: boolean;
    stats: {
      totalProducts: number;
      activeProducts: number;
      totalOrders: number;
      paidOrders: number;
      totalRevenue: number;
      syncedFormCount: number;
    };
    products: Product[];
    categories: CategoryItem[];
    menus: MenuItem[];
    comboRules: ComboRule[];
    orders: OrderRecord[];
  }> {
    return requestJson('/api/admin/overview');
  },

  async upsertProduct(productPayload: Partial<Product>): Promise<{
    ok: boolean;
    message: string;
    product: Product;
  }> {
    const method = productPayload.slug ? 'PUT' : 'POST';
    const url = productPayload.slug
      ? `/api/admin/products/${encodeURIComponent(productPayload.slug)}`
      : '/api/admin/products';
    return requestJson(url, {
      method,
      body: JSON.stringify(productPayload),
    });
  },

  async deleteProduct(slug: string): Promise<{
    ok: boolean;
    deleted?: boolean;
    message: string;
    deletedProduct?: {
      id: string;
      slug: string;
      title: string;
    };
    report?: import('../types').CascadeDeleteProductReport;
  }> {
    return requestJson(`/api/admin/products/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    });
  },

  async upsertCategory(categoryPayload: Partial<CategoryItem>): Promise<{
    ok: boolean;
    message: string;
    category: CategoryItem;
  }> {
    const method = categoryPayload.slug ? 'PUT' : 'POST';
    const url = categoryPayload.slug
      ? `/api/admin/categories/${encodeURIComponent(categoryPayload.slug)}`
      : '/api/admin/categories';
    return requestJson(url, {
      method,
      body: JSON.stringify(categoryPayload),
    });
  },

  async deleteCategory(slug: string): Promise<{
    ok: boolean;
    deleted: boolean;
    message: string;
  }> {
    return requestJson(`/api/admin/categories/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    });
  },

  async uploadFileDirect(formData: FormData): Promise<{
    ok: boolean;
    publicUrl: string;
    objectKey: string;
  }> {
    const response = await fetch(buildApiUrl('/api/admin/upload-file'), {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || 'Lỗi tải file lên Cloudflare R2.');
    }
    return data;
  },

  async uploadFile(
    file: File,
    options?: string | { folder?: string; pageLevel1?: string; pageLevel2?: string }
  ): Promise<{ url: string; objectKey: string }> {
    const formData = new FormData();
    formData.append('file', file);
    if (typeof options === 'string') {
      formData.append('folder', options);
    } else if (options) {
      formData.append('folder', options.folder || 'homepage');
      if (options.pageLevel1) formData.append('pageLevel1', options.pageLevel1);
      if (options.pageLevel2) formData.append('pageLevel2', options.pageLevel2);
    } else {
      formData.append('folder', 'homepage');
    }
    const res = await this.uploadFileDirect(formData);
    return { url: res.publicUrl, objectKey: res.objectKey };
  },

  async deleteR2File(urlOrKey: string): Promise<{ ok: boolean; result?: any }> {
    if (!urlOrKey) return { ok: true };
    try {
      return await requestJson('/api/admin/delete-file', {
        method: 'POST',
        body: JSON.stringify({ url: urlOrKey }),
      });
    } catch {
      return { ok: false };
    }
  },

  async createR2UploadPresign(params: {
    folder: 'thumbnails' | 'previews' | 'samples' | 'banners';
    fileName: string;
    contentType: string;
  }): Promise<{
    ok: boolean;
    uploadUrl: string;
    publicUrl: string;
    objectKey: string;
    isSimulated: boolean;
  }> {
    return requestJson('/api/admin/upload-presign', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async resyncOrderGoogleForm(orderCode: string): Promise<{
    ok: boolean;
    syncResult: {
      orderCode: string;
      allSuccess: boolean;
      submissions: Array<{
        productName: string;
        mappedFormatNote: string;
        httpStatus: number;
        isSuccess: boolean;
        payload: Record<string, string>;
      }>;
    };
  }> {
    return requestJson(`/api/admin/orders/${encodeURIComponent(orderCode)}/resync-form`, {
      method: 'POST',
    });
  },

  async getAdminUsers(): Promise<{
    ok: boolean;
    users: AdminUserRecord[];
  }> {
    return requestJson('/api/admin/users');
  },

  async updateAdminUserRole(
    userId: string,
    payload: { role?: 'user' | 'admin' | 'subadmin'; isActive?: boolean }
  ): Promise<{
    ok: boolean;
    user: UserProfile;
    message: string;
  }> {
    return requestJson(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Tải ảnh minh họa khối động có bảo mật phân quyền Admin (Authorization Bearer).
   * Trả về ObjectURL blob an toàn trong bộ nhớ client.
   */
  async getBlockPreviewImageUrl(blockType: string): Promise<string> {
    const res = await fetch(
      buildApiUrl('/api/admin/block-previews/' + encodeURIComponent(blockType)),
      {
        credentials: 'include',
        headers: buildAuthHeaders(),
      }
    );
    if (!res.ok) {
      throw new Error('Failed to load preview for ' + blockType + ': ' + res.status);
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  async revokeAdminUserSessions(userId: string): Promise<{
    ok: boolean;
    revokedCount: number;
    message: string;
  }> {
    return requestJson(`/api/admin/users/${encodeURIComponent(userId)}/sessions`, {
      method: 'DELETE',
    });
  },
};
