import { GoogleAnalyticsConfig, Order, Product } from '../types';

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

const GA_SCRIPT_ID = 'google-analytics-script';
const GTM_SCRIPT_ID = 'google-tag-manager-script';

let currentMeasurementId: string | null = null;

/**
 * Khởi tạo Google Analytics 4 động từ site_configs
 */
export function initGoogleAnalytics(config?: GoogleAnalyticsConfig | null): void {
  if (typeof window === 'undefined') return;

  const measurementId = config?.measurement_id?.trim();
  if (!config || !config.is_active || !measurementId) {
    disableGoogleAnalytics(currentMeasurementId || measurementId);
    return;
  }

  currentMeasurementId = measurementId;

  // Xóa cờ ga-disable nếu có
  const disableKey = `ga-disable-${measurementId}` as const;
  if (window[disableKey]) {
    delete window[disableKey];
  }

  // Khởi tạo window.dataLayer và window.gtag
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function () {
      window.dataLayer?.push(arguments);
    };
  }

  // Chèn thẻ <script> Google Analytics vào <head> nếu chưa có
  let script = document.getElementById(GA_SCRIPT_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  } else if (!script.src.includes(measurementId)) {
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  }

  // Cấu hình GA4 với send_page_view: false để SPA tự quản lý qua trackPageView
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
  });

  // Tùy chọn nạp Google Tag Manager nếu có GTM ID
  const gtmId = config.gtm_id?.trim();
  if (gtmId) {
    let gtmScript = document.getElementById(GTM_SCRIPT_ID) as HTMLScriptElement | null;
    if (!gtmScript) {
      gtmScript = document.createElement('script');
      gtmScript.id = GTM_SCRIPT_ID;
      gtmScript.async = true;
      gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
      document.head.appendChild(gtmScript);
    }
  }
}

/**
 * Tắt hoàn toàn Google Analytics và gỡ bỏ script
 */
export function disableGoogleAnalytics(measurementId?: string | null): void {
  if (typeof window === 'undefined') return;

  const targetId = measurementId || currentMeasurementId;
  if (targetId) {
    const disableKey = `ga-disable-${targetId}` as const;
    window[disableKey] = true;
  }

  const gaScript = document.getElementById(GA_SCRIPT_ID);
  if (gaScript) {
    gaScript.remove();
  }

  const gtmScript = document.getElementById(GTM_SCRIPT_ID);
  if (gtmScript) {
    gtmScript.remove();
  }

  currentMeasurementId = null;
}

/**
 * Gửi sự kiện an toàn tới gtag
 */
function sendGtagEvent(eventName: string, params: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;

  if (!currentMeasurementId || Boolean(window[`ga-disable-${currentMeasurementId}`])) {
    return;
  }

  window.gtag('event', eventName, params);
}

/**
 * Theo dõi virtual pageview khi route SPA thay đổi
 */
export function trackPageView(path: string, title?: string): void {
  sendGtagEvent('page_view', {
    page_path: path,
    page_title: title || (typeof document !== 'undefined' ? document.title : ''),
    page_location: typeof window !== 'undefined' ? window.location.href : '',
  });
}

/**
 * Theo dõi sự kiện xem tài liệu (view_item)
 */
export function trackViewItem(product: Product, selectedFormat?: string, price?: number): void {
  if (!product) return;
  const itemPrice =
    typeof price === 'number' && !isNaN(price)
      ? price
      : typeof (product as any).price === 'number'
      ? (product as any).price
      : 0;

  sendGtagEvent('view_item', {
    currency: 'VND',
    value: itemPrice,
    items: [
      {
        item_id: String(product.id || product.slug || ''),
        item_name: product.title || '',
        item_category: product.category_name || product.category_slug || '',
        item_variant: selectedFormat || '',
        price: itemPrice,
        quantity: 1,
      },
    ],
  });
}

/**
 * Theo dõi sự kiện thêm vào giỏ hàng (add_to_cart)
 */
export function trackAddToCart(
  items: Array<{
    product: Product;
    formatCode?: string;
    quantity: number;
    price: number;
  }>
): void {
  if (!items || items.length === 0) return;

  const totalValue = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const mappedItems = items.map((item) => ({
    item_id: String(item.product.id || item.product.slug || ''),
    item_name: item.product.title || '',
    item_category: item.product.category_name || item.product.category_slug || '',
    item_variant: item.formatCode || '',
    price: item.price || 0,
    quantity: item.quantity || 1,
  }));

  sendGtagEvent('add_to_cart', {
    currency: 'VND',
    value: totalValue,
    items: mappedItems,
  });
}

/**
 * Theo dõi sự kiện bắt đầu thanh toán (begin_checkout)
 */
export function trackBeginCheckout(items: Array<any>, totalValue: number): void {
  if (!items || items.length === 0) return;

  const mappedItems = items.map((item) => ({
    item_id: String(item.productId || item.product_id || item.id || item.slug || ''),
    item_name: item.title || item.productTitle || item.name || '',
    item_variant: item.formatCode || item.format_code || item.selectedFormat || '',
    price: item.price || item.unit_price || 0,
    quantity: item.quantity || 1,
  }));

  sendGtagEvent('begin_checkout', {
    currency: 'VND',
    value: totalValue || 0,
    items: mappedItems,
  });
}

/**
 * Theo dõi sự kiện đặt mua thành công (purchase)
 */
export function trackPurchase(order: Order): void {
  if (!order || !order.order_code) return;

  const items = (order.items || []).map((it) => ({
    item_id: String(it.product_id || ''),
    item_name: it.product_title || it.google_form_product_name || '',
    item_variant: it.format_code || '',
    price: it.unit_price || 0,
    quantity: it.quantity || 1,
  }));

  sendGtagEvent('purchase', {
    transaction_id: order.order_code,
    value: order.total_amount || 0,
    currency: 'VND',
    tax: 0,
    shipping: 0,
    items,
  });
}
