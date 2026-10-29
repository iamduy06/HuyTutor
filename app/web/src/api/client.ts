import {
  CategoryItem,
  ComboRule,
  MenuItem,
  OrderRecord,
  PaymentInstruction,
  Product,
  UiFormatCode,
} from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const ADMIN_API_KEY = import.meta.env.VITE_ADMIN_API_KEY || 'huytutor-admin-2026';
export const R2_DOMAIN = (
  import.meta.env.VITE_R2_DOMAIN ||
  import.meta.env.VITE_R2_PUBLIC_DOMAIN ||
  'https://media.huytutor.edu.vn'
).replace(/\/$/, '');

function buildApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_API_KEY,
      ...(init?.headers || {}),
    },
  });

  const data = await response.json();
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `HTTP Error ${response.status}`);
  }
  return data as T;
}

/**
 * Tất cả luồng dữ liệu liên quan đến Database (Menu, Danh mục, Sản phẩm, Định dạng,
 * Quy tắc Combo, Đơn hàng, Admin CRUD) đều bắt buộc đi qua Backend API (`app/api`).
 * Frontend (`app/web`) tuyệt đối không kết nối trực tiếp vào Supabase.
 */
export const apiClient = {
  // 1. Lấy toàn bộ dữ liệu khởi tạo từ Backend API
  async getCatalogInit(countryOverride?: 'VN' | 'INTL'): Promise<{
    ok: boolean;
    menus: MenuItem[];
    categories: CategoryItem[];
    comboRules: ComboRule[];
    products: Product[];
    clientRegion: {
      country: string;
      recommendedGateway: 'sepay' | 'paypal';
    };
    mediaDomain: string;
  }> {
    const query = countryOverride ? `?country=${countryOverride}` : '';
    return requestJson(`/api/catalog/init${query}`);
  },

  // 2. Lấy chi tiết 1 sản phẩm theo slug từ Backend API
  async getProductDetail(slug: string): Promise<{
    ok: boolean;
    product: Product;
    relatedProducts: Product[];
  }> {
    return requestJson(`/api/catalog/products/${encodeURIComponent(slug)}`);
  },

  // 3. Tạo đơn hàng mới qua Backend API
  async createOrder(payload: {
    customerName: string;
    customerEmail: string;
    customerEmailConfirm: string;
    customerPhone: string;
    customerGroup: 'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác';
    needInvoice: boolean;
    invoiceTaxOrCccd: string;
    invoiceAddress: string;
    flashcardQuantity?: number | null;
    paymentMethod: 'sepay' | 'paypal';
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

  // 4. Kiểm tra trạng thái đơn hàng qua Backend API
  async getOrderStatus(orderCode: string): Promise<{
    ok: boolean;
    order: OrderRecord;
    mappedGoogleFormNote: string;
    paymentInstruction: PaymentInstruction;
  }> {
    return requestJson(`/api/orders/${encodeURIComponent(orderCode)}`);
  },

  // 5. Giả lập xác nhận thanh toán thành công & tự động bắn 14 entry Google Form tại Backend
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

  // 6. Admin: Lấy tổng quan Dashboard từ Backend API
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

  // 7. Admin: Lưu sản phẩm mới hoặc cập nhật sản phẩm vào Database qua Backend API
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

  // 8. Admin: Xóa sản phẩm qua Backend API
  async deleteProduct(slug: string): Promise<{
    ok: boolean;
    deleted: boolean;
    message: string;
  }> {
    return requestJson(`/api/admin/products/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    });
  },

  // 9. Admin: Tải file trực tiếp lên Cloudflare R2 qua Backend API (An toàn, không bị lỗi CORS)
  async uploadFileDirect(formData: FormData): Promise<{
    ok: boolean;
    publicUrl: string;
    objectKey: string;
  }> {
    const response = await fetch(buildApiUrl('/api/admin/upload-file'), {
      method: 'POST',
      headers: {
        'x-admin-key': ADMIN_API_KEY,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || 'Lỗi tải file lên Cloudflare R2.');
    }
    return data;
  },

  // 9b. Admin: Tạo Presigned URL để upload ảnh bìa / PDF lên Cloudflare R2
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

  // 10. Admin: Bắn lại 14 entry đơn hàng vào Google Form qua Backend API
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
};
