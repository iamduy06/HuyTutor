import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiClient, buildApiUrl, buildAuthHeaders } from '../api/client';
import { CheckoutAuthPromptModal } from '../components/CheckoutAuthPromptModal';
import {
  CartItem,
  CompactCartItem,
  CategoryItem,
  ComboPackageItem,
  ComboPackagesBlockConfig,
  ComboRule,
  MenuItem,
  Product,
  SiteConfigs,
  UiFormatCode,
  ClientRegion,
  formatVnd,
} from '../types';
import {
  evaluateBestComboForCart,
  detectComboTransitionNotice,
  ComboCartEvaluation,
} from '../utils/comboPricingEngine';

export interface StoreContextValue {
  isLoading: boolean;
  apiError: string | null;
  menus: MenuItem[];
  categories: CategoryItem[];
  comboRules: ComboRule[];
  products: Product[];
  siteConfigs: SiteConfigs;
  updateSiteConfig: (key: string, value: any) => Promise<void>;
  clientRegion: ClientRegion;
  setRegionOverride: (country: 'VN' | 'INTL') => void;
  refreshCatalog: () => Promise<void>;

  // Cart & Single-Format Rule
  cartItems: CartItem[];
  selectedCartItems: CartItem[];
  selectedFormats: UiFormatCode[];
  hasFormatConflict: boolean;
  hasMultipleProductsConflict: boolean;
  comboEvaluation: ComboCartEvaluation;
  subtotalAmount: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  checkOwnershipStatus: (
    slug: string,
    formatCode: UiFormatCode
  ) => {
    canPurchase: boolean;
    isUpgrade: boolean;
    errorMessage?: string;
    warningMessage?: string;
  };
  addToCart: (product: Product, formatCode: UiFormatCode, quantity?: number) => void;
  addComboToCart: (
    pkg: ComboPackageItem,
    formatCode: UiFormatCode,
    actionType?: 'open_checkout' | 'add_to_cart'
  ) => void;
  buyNow: (product: Product, formatCode: UiFormatCode, quantity?: number) => void;
  toggleCartItemSelect: (cartItemId: string) => void;
  selectOnlyFormat: (formatCode: UiFormatCode) => void;
  deselectAllCartItems: () => void;
  bulkChangeSelectedFormats: (targetFormat: 'Word' | 'PDF') => void;
  updateCartItemQty: (cartItemId: string, delta: number) => void;
  updateCartItemFormat: (cartItemId: string, newFormatCode: UiFormatCode) => void;
  removeCartItem: (cartItemId: string) => void;
  clearSelectedCartItems: () => void;
  clearCart: () => Promise<void>;
  checkoutItems: CartItem[];
  setCheckoutItems: (items: CartItem[]) => void;

  // Modals & Drawers
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  sampleModalProduct: Product | null;
  setSampleModalProduct: (product: Product | null) => void;
  formatModalProduct: Product | null;
  formatModalInitialFormat?: UiFormatCode;
  formatModalDefaultAction: 'add_to_cart' | 'buy_now';
  openFormatModal: (
    product: Product,
    defaultAction?: 'add_to_cart' | 'buy_now',
    initialFormat?: UiFormatCode
  ) => void;
  closeFormatModal: () => void;

  // Combo Format Modal
  comboModalPackage: ComboPackageItem | null;
  comboModalAction: 'add_to_cart' | 'buy_now';
  comboModalInitialFormat?: UiFormatCode;
  openComboFormatModal: (
    pkg: ComboPackageItem,
    action?: 'add_to_cart' | 'buy_now',
    initialFormat?: UiFormatCode
  ) => void;
  closeComboFormatModal: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Checkout Auth Guard
  isAuthPromptOpen: boolean;
  setIsAuthPromptOpen: (open: boolean) => void;
  pendingCheckoutItems: CartItem[];
  openAuthPrompt: (items: CartItem[]) => void;
  closeAuthPrompt: () => void;
  savePendingCheckout: (items: CartItem[], source?: 'cart' | 'buy_now') => void;
  restorePendingCheckout: () => CartItem[] | null;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'ht_cart';
const OLD_CART_STORAGE_KEY = 'huytutor_cart_v1';

/**
 * Trích xuất danh sách CompactCartItem siêu nhẹ (<300 bytes) từ mảng CartItem đầy đủ
 */
export function compactCart(items: CartItem[]): CompactCartItem[] {
  return items.map((it) => ({
    productId: it.productId || it.slug,
    formatCode: it.formatCode,
    quantity: it.formatCode === 'Flashcard' ? Math.max(1, it.quantity || 1) : 1,
    selected: it.selected !== false,
    comboPackageId: it.comboPackageId || null,
    isUpgrade: Boolean(it.isUpgrade),
  }));
}

/**
 * Tính toán chuỗi băm chuẩn hóa (Canonical Hash) xác định duy nhất trạng thái giỏ hàng
 */
export function computeCartHash(items: CompactCartItem[]): string {
  const canonical = [...items]
    .map((it) => ({
      productId: String(it.productId || '').trim(),
      formatCode: String(it.formatCode || '').trim(),
      quantity: it.formatCode === 'Flashcard' ? Math.max(1, it.quantity || 1) : 1,
      selected: it.selected !== false,
      comboPackageId: it.comboPackageId ? String(it.comboPackageId).trim() : null,
      isUpgrade: Boolean(it.isUpgrade),
    }))
    .sort((a, b) => {
      const keyA = `${a.productId}:${a.formatCode}`;
      const keyB = `${b.productId}:${b.formatCode}`;
      return keyA.localeCompare(keyB);
    });

  const str = JSON.stringify(canonical);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
}

/**
 * Tái tạo CartItem[] hoàn chỉnh từ CompactCartItem[] dựa trên danh mục sản phẩm trong RAM
 * Tuân thủ Kịch bản 8: Nếu sản phẩm hoặc định dạng tạm ngưng kinh doanh,
 * VẪN GIỮ NGUYÊN trong giỏ hàng và gán isInactive: true kèm inactiveReason.
 */
export function hydrateCompactCart(
  compactItems: CompactCartItem[],
  products: Product[],
  isItemInLibrary?: (slug: string, format: UiFormatCode) => boolean,
  comboPackages?: ComboPackageItem[]
): CartItem[] {
  return compactItems.map((compact) => {
    const p = products.find(
      (prod) => prod.id === compact.productId || prod.slug === compact.productId
    );

    // Kịch bản 8A: Sản phẩm không tìm thấy hoặc đã bị tắt is_active
    if (!p || !p.is_active) {
      return {
        cartItemId: `${compact.productId}__${compact.formatCode}`,
        productId: compact.productId,
        slug: compact.productId,
        categorySlug: '',
        code: '',
        title: p ? p.title : `Sản phẩm (${compact.productId})`,
        googleFormProductName: p ? (p.google_form_product_name || p.title) : compact.productId,
        formatCode: compact.formatCode,
        unitPrice: 0,
        originalPrice: 0,
        upgradeOffset: 0,
        quantity: compact.formatCode === 'Flashcard' ? Math.max(1, compact.quantity || 1) : 1,
        selected: compact.selected !== false,
        isComboEligible: false,
        comboPackageId: compact.comboPackageId || undefined,
        isUpgrade: Boolean(compact.isUpgrade),
        isInactive: true,
        inactiveReason: 'Sản phẩm tạm ngưng kinh doanh',
      };
    }

    const fmt = (p.formats || []).find((f) => f.format_code === compact.formatCode);

    // Kịch bản 8B: Định dạng không tồn tại hoặc đã bị tắt is_active
    if (!fmt || !fmt.is_active) {
      return {
        cartItemId: `${p.slug}__${compact.formatCode}`,
        productId: p.id,
        slug: p.slug,
        categorySlug: p.category_slug || '',
        code: p.code || '',
        title: p.title,
        googleFormProductName: p.google_form_product_name || p.title,
        formatCode: compact.formatCode,
        unitPrice: fmt ? (Number(fmt.price) || 0) : 0,
        originalPrice: fmt ? (Number(fmt.price) || 0) : 0,
        upgradeOffset: 0,
        quantity: compact.formatCode === 'Flashcard' ? Math.max(1, compact.quantity || 1) : 1,
        selected: compact.selected !== false,
        isComboEligible: p.is_combo_eligible,
        comboPackageId: compact.comboPackageId || undefined,
        isUpgrade: Boolean(compact.isUpgrade),
        isInactive: true,
        inactiveReason: 'Định dạng sản phẩm tạm ngưng kinh doanh',
      };
    }

    // Sản phẩm và định dạng hoạt động bình thường
    const catalogPrice = Number(fmt.price) || 0;
    let unitPrice = catalogPrice;
    const originalPrice = catalogPrice;
    let upgradeOffset = 0;
    let isUpgrade = false;

    if (compact.isUpgrade && isItemInLibrary) {
      const ownsWord = isItemInLibrary(p.slug, 'Word');
      const ownsPdf = isItemInLibrary(p.slug, 'PDF');
      if (compact.formatCode === 'Word' && ownsPdf && !ownsWord) {
        isUpgrade = true;
        const pdfFmt = (p.formats || []).find((f) => f.format_code === 'PDF');
        const pdfPrice = pdfFmt ? (Number(pdfFmt.price) || 0) : 0;
        upgradeOffset = Math.min(pdfPrice, catalogPrice);
        unitPrice = Math.max(0, catalogPrice - upgradeOffset);
      }
    }

    let comboPackageTitle: string | undefined = undefined;
    if (compact.comboPackageId && comboPackages) {
      const pkg = comboPackages.find((pkgItem) => pkgItem.id === compact.comboPackageId);
      if (pkg) comboPackageTitle = pkg.title;
    }

    return {
      cartItemId: `${p.slug}__${compact.formatCode}`,
      productId: p.id,
      slug: p.slug,
      categorySlug: p.category_slug || '',
      code: p.code || '',
      title: p.title,
      googleFormProductName: p.google_form_product_name || p.title,
      formatCode: compact.formatCode,
      unitPrice,
      originalPrice,
      upgradeOffset,
      isUpgrade,
      upgradeFromFormat: isUpgrade ? 'PDF' : undefined,
      quantity: compact.formatCode === 'Flashcard' ? Math.max(1, compact.quantity || 1) : 1,
      selected: compact.selected !== false,
      isComboEligible: p.is_combo_eligible,
      comboPackageId: compact.comboPackageId || undefined,
      comboPackageTitle,
      isInactive: false,
    };
  });
}

const DEFAULT_SITE_CONFIGS: SiteConfigs = {
  footer_social_links: [],
  footer_policy_links: [],
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isItemInLibrary, userLibrary, user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasInitialHydrated, setHasInitialHydrated] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [comboRules, setComboRules] = useState<ComboRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [siteConfigs, setSiteConfigs] = useState<SiteConfigs>(DEFAULT_SITE_CONFIGS);
  const [clientRegion, setClientRegion] = useState<ClientRegion>({
    country: 'VN',
    isVietnam: true,
    allowedGateways: ['sepay'],
    defaultGateway: 'sepay',
    usdExchangeRate: 26000,
  });

  const comboPackages = useMemo(() => {
    const blocks = siteConfigs?.combo_page_blocks || [];
    const pkgBlock = blocks.find((b: any) => b.type === 'combo_packages');
    const cfg = pkgBlock?.config as ComboPackagesBlockConfig | undefined;
    return (cfg?.packages || []) as ComboPackageItem[];
  }, [siteConfigs?.combo_page_blocks]);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw =
        localStorage.getItem(CART_STORAGE_KEY) ||
        localStorage.getItem(OLD_CART_STORAGE_KEY);
      if (raw) {
        if (localStorage.getItem(OLD_CART_STORAGE_KEY)) {
          localStorage.removeItem(OLD_CART_STORAGE_KEY);
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed as CartItem[];
        }
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [sampleModalProduct, setSampleModalProduct] = useState<Product | null>(null);
  const [formatModalProduct, setFormatModalProduct] = useState<Product | null>(null);
  const [formatModalInitialFormat, setFormatModalInitialFormat] = useState<UiFormatCode | undefined>(undefined);
  const [formatModalDefaultAction, setFormatModalDefaultAction] = useState<'add_to_cart' | 'buy_now'>('add_to_cart');

  const openFormatModal = (
    product: Product,
    defaultAction: 'add_to_cart' | 'buy_now' = 'add_to_cart',
    initialFormat?: UiFormatCode
  ) => {
    setFormatModalProduct(product);
    setFormatModalDefaultAction(defaultAction);
    setFormatModalInitialFormat(initialFormat);
  };

  const closeFormatModal = () => {
    setFormatModalProduct(null);
    setFormatModalInitialFormat(undefined);
  };

  // Combo Format Modal State
  const [comboModalPackage, setComboModalPackage] = useState<ComboPackageItem | null>(null);
  const [comboModalAction, setComboModalAction] = useState<'add_to_cart' | 'buy_now'>('buy_now');
  const [comboModalInitialFormat, setComboModalInitialFormat] = useState<UiFormatCode | undefined>(undefined);

  const openComboFormatModal = (
    pkg: ComboPackageItem,
    action: 'add_to_cart' | 'buy_now' = 'buy_now',
    initialFormat?: UiFormatCode
  ) => {
    setComboModalPackage(pkg);
    setComboModalAction(action);
    setComboModalInitialFormat(initialFormat);
  };

  const closeComboFormatModal = () => {
    setComboModalPackage(null);
    setComboModalInitialFormat(undefined);
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    const isTechnical =
      /supabase|pgrst|postgres|database|syntax|column|relation|table|uuid|stack|jwt|token|bearer|crypto|sha3|sha256|500|502|503|504|econnrefused|failed to fetch|networkerror|internal server/i.test(
        msg
      );
    const isAdmin =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');

    const displayMsg =
      !isAdmin && isTechnical
        ? 'Đã có lỗi xảy ra. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.'
        : msg;

    setToastMessage(displayMsg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === displayMsg ? null : prev));
    }, 3200);
  };

  // Checkout Auth Guard State & Helpers
  const PENDING_CHECKOUT_KEY = 'ht_pending_checkout';
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false);
  const [pendingCheckoutItems, setPendingCheckoutItems] = useState<CartItem[]>([]);
  const hasResumedPendingRef = useRef(false);

  const savePendingCheckout = (items: CartItem[], source: 'cart' | 'buy_now' = 'cart') => {
    if (typeof window === 'undefined') return;
    try {
      const payload = {
        items,
        source,
        savedAt: Date.now(),
      };
      sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  };

  const restorePendingCheckout = (): CartItem[] | null => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
      if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
        return parsed.items as CartItem[];
      }
      return null;
    } catch {
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
      return null;
    }
  };

  const openAuthPrompt = (items: CartItem[]) => {
    setPendingCheckoutItems(items);
    savePendingCheckout(items, 'cart');
    setIsAuthPromptOpen(true);
  };

  const closeAuthPrompt = () => {
    setIsAuthPromptOpen(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
    }
  };

  // Auto-resume checkout when authenticated
  useEffect(() => {
    if (!user) {
      hasResumedPendingRef.current = false;
      return;
    }
    if (!hasResumedPendingRef.current) {
      if (typeof window === 'undefined') return;
      try {
        const raw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
        if (raw) {
          hasResumedPendingRef.current = true;
          const parsed = JSON.parse(raw);
          sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
          const items: CartItem[] = Array.isArray(parsed?.items) ? parsed.items : [];
          if (items.length > 0) {
            setCheckoutItems(items);
            setIsCheckoutOpen(true);
            showToast('Đã khôi phục đơn hàng, bạn có thể tiếp tục thanh toán.');
          }
        }
      } catch {
        sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
      }
    }
  }, [user]);

  const loadInitFromBackend = async (countryOverride?: 'VN' | 'INTL') => {
    setIsLoading(true);
    setApiError(null);
    try {
      const data = await apiClient.getCatalogInit(countryOverride);
      setMenus(data.menus);
      setCategories(data.categories);
      setComboRules(data.comboRules);
      setProducts(data.products);
      if (data.siteConfigs) {
        setSiteConfigs(data.siteConfigs);
      }
      setClientRegion(data.clientRegion);
    } catch (err: any) {
      setApiError(
        err?.message ||
          'Không thể kết nối tới máy chủ. Vui lòng tải lại trang hoặc kiểm tra kết nối mạng.'
      );
    } finally {
      setIsLoading(false);
      setHasInitialHydrated(true);
    }
  };

  const updateSiteConfig = async (key: string, value: any) => {
    await apiClient.updateSiteConfig(key, value);
    setSiteConfigs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    loadInitFromBackend();
  }, []);

  // ====================================================================
  // CART SYNC ENGINE: REFS & PERSISTENCE
  // ====================================================================
  const cartItemsRef = useRef(cartItems);
  cartItemsRef.current = cartItems;

  const userRef = useRef(user);
  userRef.current = user;

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedHashRef = useRef<string | null>(null);
  const isReconcilingRef = useRef<boolean>(false);

  // Kịch bản 1: Khách vãng lai & đồng bộ LocalStorage tức thì (ht_cart)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore storage errors
    }
  }, [cartItems]);

  // Kịch bản 7: Sudden Unload Keepalive Flush
  const flushCartImmediately = () => {
    if (!userRef.current || isReconcilingRef.current) return;
    const currentCompact = compactCart(cartItemsRef.current);
    const currentHash = computeCartHash(currentCompact);

    if (lastSyncedHashRef.current === currentHash) return;

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    lastSyncedHashRef.current = currentHash;

    try {
      const url = buildApiUrl('/api/cart');
      const headers = buildAuthHeaders({ 'Content-Type': 'application/json' });
      const body = JSON.stringify({ items: currentCompact, cartHash: currentHash });

      fetch(url, {
        method: 'PUT',
        keepalive: true,
        credentials: 'include',
        headers,
        body,
      }).catch(() => {});
    } catch {
      // ignore unload errors
    }
  };

  // Kịch bản 7 & 9: Bắt W3C visibilitychange (hidden), beforeunload, và online recovery
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushCartImmediately();
      }
    };

    const handleBeforeUnload = () => {
      flushCartImmediately();
    };

    const handleOnline = () => {
      if (userRef.current && !isReconcilingRef.current) {
        const currentCompact = compactCart(cartItemsRef.current);
        const currentHash = computeCartHash(currentCompact);
        if (lastSyncedHashRef.current !== currentHash) {
          apiClient
            .saveUserCart(currentCompact, currentHash)
            .then(() => {
              lastSyncedHashRef.current = currentHash;
            })
            .catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Kịch bản 6: Multi-Tab Sync qua window.addEventListener('storage') & custom reset
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.storageArea !== window.localStorage) return;
      if (e.key === CART_STORAGE_KEY || e.key === OLD_CART_STORAGE_KEY) {
        if (e.newValue === null) {
          setCartItems([]);
          lastSyncedHashRef.current = null;
          if (syncTimerRef.current) {
            clearTimeout(syncTimerRef.current);
            syncTimerRef.current = null;
          }
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            if (Array.isArray(parsed)) {
              const rehydrated = hydrateCompactCart(
                compactCart(parsed),
                products,
                isItemInLibrary,
                comboPackages
              );
              setCartItems(rehydrated);
              const newHash = computeCartHash(compactCart(rehydrated));
              lastSyncedHashRef.current = newHash;
              if (syncTimerRef.current) {
                clearTimeout(syncTimerRef.current);
                syncTimerRef.current = null;
              }
            }
          } catch {
            // ignore
          }
        }
      }
    };

    const handleCustomReset = () => {
      setCartItems([]);
      lastSyncedHashRef.current = null;
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ht_cart_reset', handleCustomReset);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ht_cart_reset', handleCustomReset);
    };
  }, [products, isItemInLibrary, comboPackages]);

  // Kịch bản 4: 10-second Debounce Sync (chỉ chạy khi user đã đăng nhập)
  useEffect(() => {
    if (!user || isReconcilingRef.current) return;

    const currentCompact = compactCart(cartItems);
    const currentHash = computeCartHash(currentCompact);

    if (lastSyncedHashRef.current === currentHash) {
      return;
    }

    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current);
      syncTimerRef.current = null;
    }

    syncTimerRef.current = setTimeout(async () => {
      try {
        await apiClient.saveUserCart(currentCompact, currentHash);
        lastSyncedHashRef.current = currentHash;
      } catch (err) {
        console.error('[StoreContext] Failed to sync cart to server:', err);
      }
    }, 10000);

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
      }
    };
  }, [cartItems, user]);

  // Kịch bản 3, 5, 10: Auth State Transitions (Reconciliation, Logout, User Switch)
  const prevUserRef = useRef<any>(user);

  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    // Kịch bản 5: Đăng xuất (prevUser != null && user == null)
    if (prevUser && !user) {
      setCartItems([]);
      lastSyncedHashRef.current = null;
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(CART_STORAGE_KEY);
          localStorage.removeItem(OLD_CART_STORAGE_KEY);
        } catch {}
      }
      return;
    }

    // Kịch bản 10: Chuyển đổi tài khoản (userA -> userB)
    if (prevUser && user && prevUser.id !== user.id) {
      setCartItems([]);
      lastSyncedHashRef.current = null;
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      (async () => {
        try {
          const res = await apiClient.getUserCart();
          const serverItems = (res.cart?.items || []) as CompactCartItem[];
          const hydrated = hydrateCompactCart(
            serverItems,
            products,
            isItemInLibrary,
            comboPackages
          );
          setCartItems(hydrated);
          lastSyncedHashRef.current = computeCartHash(serverItems);
        } catch (err) {
          console.error('[StoreContext] Error loading user cart on account switch:', err);
        }
      })();
      return;
    }

    // Kịch bản 3: Đăng nhập (prevUser == null && user != null)
    if (!prevUser && user) {
      (async () => {
        if (isReconcilingRef.current) return;
        isReconcilingRef.current = true;
        try {
          const res = await apiClient.getUserCart();
          const serverItems = (res.cart?.items || []) as CompactCartItem[];
          const localItems = cartItemsRef.current;
          const localCompact = compactCart(localItems);

          // Nhánh 1: Server rỗng, Local có món
          if (serverItems.length === 0 && localCompact.length > 0) {
            const hash = computeCartHash(localCompact);
            await apiClient.saveUserCart(localCompact, hash);
            lastSyncedHashRef.current = hash;
            return;
          }

          // Nhánh 2: Server có món, Local rỗng
          if (serverItems.length > 0 && localCompact.length === 0) {
            const hydrated = hydrateCompactCart(
              serverItems,
              products,
              isItemInLibrary,
              comboPackages
            );
            setCartItems(hydrated);
            lastSyncedHashRef.current = computeCartHash(serverItems);
            return;
          }

          // Nhánh 3: Cả Server và Local đều có món -> Hợp nhất
          if (serverItems.length > 0 && localCompact.length > 0) {
            // Flashcard: Union theo productId
            const flashcardMap = new Map<string, CompactCartItem>();
            for (const item of serverItems.filter((i) => i.formatCode === 'Flashcard')) {
              flashcardMap.set(item.productId, { ...item });
            }
            for (const item of localCompact.filter((i) => i.formatCode === 'Flashcard')) {
              if (flashcardMap.has(item.productId)) {
                const sItem = flashcardMap.get(item.productId)!;
                flashcardMap.set(item.productId, {
                  ...item,
                  quantity: Math.max(item.quantity, sItem.quantity),
                  selected: item.selected || sItem.selected,
                });
              } else {
                flashcardMap.set(item.productId, { ...item });
              }
            }
            const flashcards = Array.from(flashcardMap.values());

            // Phi Flashcard: Quy chuẩn User Directive 1 - Ưu tiên tuyệt đối Local
            const localNonFc = localCompact.filter((i) => i.formatCode !== 'Flashcard');
            const serverNonFc = serverItems.filter((i) => i.formatCode !== 'Flashcard');

            let chosenNonFc: CompactCartItem | null = null;
            let hadConflict = false;

            if (localNonFc.length > 0) {
              chosenNonFc = { ...localNonFc[0], quantity: 1 };
              if (
                serverNonFc.length > 0 &&
                (serverNonFc[0].productId !== chosenNonFc.productId ||
                  serverNonFc[0].formatCode !== chosenNonFc.formatCode)
              ) {
                hadConflict = true;
              }
            } else if (serverNonFc.length > 0) {
              chosenNonFc = { ...serverNonFc[0], quantity: 1 };
            }

            const mergedCompact: CompactCartItem[] = [...flashcards];
            if (chosenNonFc) {
              mergedCompact.push(chosenNonFc);
            }

            if (hadConflict) {
              showToast('Đã đồng bộ giỏ hàng theo lựa chọn mới nhất của bạn.');
            }

            // Kiểm tra Tủ sách cá nhân
            if (isItemInLibrary) {
              for (const item of mergedCompact) {
                if (!item.isUpgrade && isItemInLibrary(item.productId, item.formatCode)) {
                  const p = products.find(
                    (prod) => prod.id === item.productId || prod.slug === item.productId
                  );
                  const title = p?.title || item.productId;
                  showToast(
                    `⚠️ Bạn đã sở hữu tài liệu "${title}" (${item.formatCode}) trong Tủ sách cá nhân.`
                  );
                }
              }
            }

            // Hydrate & Save ngay lập tức lên server
            const hydrated = hydrateCompactCart(
              mergedCompact,
              products,
              isItemInLibrary,
              comboPackages
            );
            setCartItems(hydrated);
            const hash = computeCartHash(mergedCompact);
            await apiClient.saveUserCart(mergedCompact, hash);
            lastSyncedHashRef.current = hash;
          }
        } catch (err) {
          console.error('[StoreContext] Error during cart reconciliation on login:', err);
        } finally {
          isReconcilingRef.current = false;
        }
      })();
    }
  }, [user, products, comboPackages]);

  // Kịch bản 8: Tự động rehydrate giỏ hàng khi products cập nhật từ backend
  useEffect(() => {
    if (products.length === 0) return;
    setCartItems((prevItems) => {
      if (prevItems.length === 0) return prevItems;
      return prevItems.map((item) => {
        const p = products.find(
          (prod) => prod.id === item.productId || prod.slug === item.slug
        );
        if (!p || !p.is_active) {
          return {
            ...item,
            isInactive: true,
            inactiveReason: 'Sản phẩm tạm ngưng kinh doanh',
          };
        }
        const fmt = (p.formats || []).find((f) => f.format_code === item.formatCode);
        if (!fmt || !fmt.is_active) {
          return {
            ...item,
            isInactive: true,
            inactiveReason: 'Định dạng sản phẩm tạm ngưng kinh doanh',
          };
        }
        const catalogPrice = Number(fmt.price) || 0;
        let unitPrice = catalogPrice;
        let upgradeOffset = item.upgradeOffset || 0;
        if (item.isUpgrade) {
          const pdfFmt = (p.formats || []).find((f) => f.format_code === 'PDF');
          const pdfPrice = pdfFmt ? (Number(pdfFmt.price) || 0) : 0;
          upgradeOffset = Math.min(pdfPrice, catalogPrice);
          unitPrice = Math.max(0, catalogPrice - upgradeOffset);
        }
        return {
          ...item,
          productId: p.id,
          slug: p.slug,
          categorySlug: p.category_slug || item.categorySlug,
          code: p.code || item.code,
          title: p.title,
          googleFormProductName: p.google_form_product_name || p.title,
          unitPrice,
          originalPrice: catalogPrice,
          upgradeOffset,
          isInactive: false,
          inactiveReason: undefined,
        };
      });
    });
  }, [products]);

  // Phím tắt Ctrl+K mở tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const setRegionOverride = (country: 'VN' | 'INTL') => {
    const isVN = country === 'VN';
    setClientRegion((prev: ClientRegion) => ({
      ...prev,
      country,
      isVietnam: isVN,
      allowedGateways: isVN ? ['sepay'] : ['sepay', 'paypal'],
    }));
  };

  const refreshCatalog = async () => {
    await loadInitFromBackend();
  };

  const resolveFormatPrice = (product: Product, formatCode: UiFormatCode): number => {
    const found = product.formats.find((f) => f.format_code === formatCode);
    if (found) return Number(found.price) || 0;
    const firstActive = product.formats.find((f) => f.is_active) || product.formats[0];
    return firstActive ? (Number(firstActive.price) || 0) : 0;
  };

  const checkOwnershipStatus = (
    slug: string,
    formatCode: UiFormatCode
  ): {
    canPurchase: boolean;
    isUpgrade: boolean;
    errorMessage?: string;
    warningMessage?: string;
  } => {
    if (!isItemInLibrary) return { canPurchase: true, isUpgrade: false };

    const ownsWord = isItemInLibrary(slug, 'Word');
    const ownsPdf = isItemInLibrary(slug, 'PDF');
    const ownsCurrent = isItemInLibrary(slug, formatCode);

    // Tình huống 1: Mua PDF mà đã có Word -> Chặn chuyên biệt
    if (formatCode === 'PDF' && ownsWord) {
      return {
        canPurchase: false,
        isUpgrade: false,
        errorMessage: 'Bạn đã sở hữu định dạng Word, không cần mua thêm bản PDF vì nội dung chúng là giống nhau.',
      };
    }

    // Tình huống 2: Mua PDF mà đã có PDF -> Chặn bình thường
    if (formatCode === 'PDF' && ownsPdf) {
      return {
        canPurchase: false,
        isUpgrade: false,
        errorMessage: 'Bạn đã sở hữu tài liệu này ở định dạng PDF trong Tủ sách cá nhân.',
      };
    }

    // Tình huống 3: Mua Word mà đã có Word -> Chặn bình thường
    if (formatCode === 'Word' && ownsWord) {
      return {
        canPurchase: false,
        isUpgrade: false,
        errorMessage: 'Bạn đã sở hữu tài liệu này ở định dạng Word trong Tủ sách cá nhân.',
      };
    }

    // Tình huống 4: Mua Word mà đã có PDF (chưa có Word) -> NÂNG CẤP BÙ TIỀN!
    if (formatCode === 'Word' && ownsPdf && !ownsWord) {
      return {
        canPurchase: true,
        isUpgrade: true,
        warningMessage: 'Kích hoạt nâng cấp từ PDF lên Word chỉ bù tiền chênh lệch.',
      };
    }

    // Các trường hợp khác đã sở hữu
    if (ownsCurrent) {
      return {
        canPurchase: false,
        isUpgrade: false,
        errorMessage: `Bạn đã sở hữu tài liệu này ở định dạng ${formatCode} trong Tủ sách cá nhân.`,
      };
    }

    return { canPurchase: true, isUpgrade: false };
  };

  const addToCart = (product: Product, formatCode: UiFormatCode, quantity = 1) => {
    const status = checkOwnershipStatus(product.slug, formatCode);

    if (!status.canPurchase) {
      showToast(`⚠️ ${status.errorMessage}`);
      return;
    }

    let unitPrice = resolveFormatPrice(product, formatCode);
    const originalPrice = unitPrice;
    let upgradeOffset = 0;
    const isUpgrade = status.isUpgrade;

    if (isUpgrade) {
      const pdfPrice = resolveFormatPrice(product, 'PDF');
      upgradeOffset = Math.min(pdfPrice, unitPrice);
      unitPrice = Math.max(0, unitPrice - upgradeOffset);
    }

    const cartItemId = `${product.slug}__${formatCode}`;

    if (formatCode !== 'Flashcard') {
      setCartItems((prev) => {
        const normalized = prev.map((it) => ({
          ...it,
          selected: it.formatCode === formatCode ? it.selected : false,
        }));
        const existingIdx = normalized.findIndex((it) => it.cartItemId === cartItemId);
        if (existingIdx >= 0) {
          const next = [...normalized];
          next[existingIdx] = {
            ...next[existingIdx],
            selected: true,
            quantity: 1,
            unitPrice,
            originalPrice,
            upgradeOffset,
            isUpgrade,
          };
          return next;
        }
        return [
          ...normalized,
          {
            cartItemId,
            productId: product.id,
            slug: product.slug,
            categorySlug: product.category_slug,
            code: product.code,
            title: product.title,
            googleFormProductName: product.google_form_product_name || product.title,
            formatCode,
            unitPrice,
            originalPrice,
            upgradeOffset,
            isUpgrade,
            upgradeFromFormat: isUpgrade ? 'PDF' : undefined,
            quantity: 1,
            selected: true,
            isComboEligible: product.is_combo_eligible,
          },
        ];
      });

      if (isUpgrade) {
        showToast(`Đã thêm bản Nâng cấp lên Word (Chỉ bù ${formatVnd(unitPrice)}) vào giỏ hàng.`);
      } else {
        showToast(`Đã thêm "${product.title}" (${formatCode}) vào giỏ hàng.`);
      }
      return;
    }

    setCartItems((prev) => {
      const existingIdx = prev.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: next[existingIdx].quantity + quantity,
          unitPrice,
          selected: true,
        };
        return next;
      }
      return [
        ...prev,
        {
          cartItemId,
          productId: product.id,
          slug: product.slug,
          categorySlug: product.category_slug,
          code: product.code,
          title: product.title,
          googleFormProductName: product.google_form_product_name || product.title,
          formatCode,
          unitPrice,
          quantity,
          selected: true,
          isComboEligible: product.is_combo_eligible,
        },
      ];
    });

    showToast(`Đã thêm gói Flashcard "${product.title}" vào giỏ hàng.`);
  };

  const buyNow = (product: Product, formatCode: UiFormatCode, quantity = 1) => {
    const status = checkOwnershipStatus(product.slug, formatCode);

    if (!status.canPurchase) {
      showToast(`⚠️ ${status.errorMessage}`);
      setIsCartOpen(true);
      return;
    }

    let unitPrice = resolveFormatPrice(product, formatCode);
    const originalPrice = unitPrice;
    let upgradeOffset = 0;
    const isUpgrade = status.isUpgrade;

    if (isUpgrade) {
      const pdfPrice = resolveFormatPrice(product, 'PDF');
      upgradeOffset = Math.min(pdfPrice, unitPrice);
      unitPrice = Math.max(0, unitPrice - upgradeOffset);
    }

    const cartItemId = `${product.slug}__${formatCode}`;

    const buyNowItem: CartItem = {
      cartItemId,
      productId: product.id,
      slug: product.slug,
      categorySlug: product.category_slug,
      code: product.code,
      title: product.title,
      googleFormProductName: product.google_form_product_name || product.title,
      formatCode,
      unitPrice,
      originalPrice,
      upgradeOffset,
      isUpgrade,
      upgradeFromFormat: isUpgrade ? 'PDF' : undefined,
      quantity: formatCode === 'Flashcard' ? quantity : 1,
      selected: true,
      isComboEligible: product.is_combo_eligible,
    };

    if (!user) {
      savePendingCheckout([buyNowItem], 'buy_now');
      openAuthPrompt([buyNowItem]);
      setIsCartOpen(false);
      return;
    }

    if (formatCode !== 'Flashcard') {
      setCartItems((prev) => {
        const normalized = prev.map((it) => ({
          ...it,
          selected: it.formatCode === formatCode ? it.selected : false,
        }));
        const existingIdx = normalized.findIndex((it) => it.cartItemId === cartItemId);
        if (existingIdx >= 0) {
          const next = [...normalized];
          next[existingIdx] = {
            ...next[existingIdx],
            selected: true,
            quantity: 1,
            unitPrice,
            originalPrice,
            upgradeOffset,
            isUpgrade,
          };
          return next;
        }
        return [
          ...normalized,
          {
            cartItemId,
            productId: product.id,
            slug: product.slug,
            categorySlug: product.category_slug,
            code: product.code,
            title: product.title,
            googleFormProductName: product.google_form_product_name || product.title,
            formatCode,
            unitPrice,
            originalPrice,
            upgradeOffset,
            isUpgrade,
            upgradeFromFormat: isUpgrade ? 'PDF' : undefined,
            quantity: 1,
            selected: true,
            isComboEligible: product.is_combo_eligible,
          },
        ];
      });
      setIsCheckoutOpen(true);
      return;
    } else {
      setCartItems((prev) => {
        const deselectedOtherFormats = prev.map((it) => ({
          ...it,
          selected: it.formatCode === 'Flashcard' ? it.selected : false,
        }));
        const existingIdx = deselectedOtherFormats.findIndex((it) => it.cartItemId === cartItemId);
        if (existingIdx >= 0) {
          const next = [...deselectedOtherFormats];
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: Math.max(next[existingIdx].quantity, quantity),
            unitPrice,
            selected: true,
          };
          return next;
        }
        return [
          ...deselectedOtherFormats,
          {
            cartItemId,
            productId: product.id,
            slug: product.slug,
            categorySlug: product.category_slug,
            code: product.code,
            title: product.title,
            googleFormProductName: product.google_form_product_name || product.title,
            formatCode,
            unitPrice,
            quantity,
            selected: true,
            isComboEligible: product.is_combo_eligible,
          },
        ];
      });
    }

    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const addComboToCart = (
    pkg: ComboPackageItem,
    formatCode: UiFormatCode,
    actionType?: 'open_checkout' | 'add_to_cart'
  ) => {
    const pkgProducts = products.filter(
      (p) => (pkg.product_ids || []).includes(p.id) || (pkg.product_ids || []).includes(p.slug)
    );
    if (pkgProducts.length === 0) return;

    // Lọc các sản phẩm chưa sở hữu ở định dạng này (canPurchase là true nếu chưa sở hữu hoặc là nâng cấp PDF -> Word)
    const unownedProducts = pkgProducts.filter((p) => {
      const status = checkOwnershipStatus(p.slug, formatCode);
      return status.canPurchase;
    });

    if (unownedProducts.length === 0) {
      showToast(
        `Bạn đã sở hữu toàn bộ tài liệu định dạng ${formatCode} của gói "${pkg.title}" trong Tủ sách cá nhân.`
      );
      return;
    }

    setCartItems((prev) => {
      // Bỏ chọn các định dạng khác định dạng formatCode để giỏ hàng đồng nhất
      const updated = prev.map((it) => ({
        ...it,
        selected: it.formatCode === formatCode ? it.selected : false,
      }));

      for (const product of unownedProducts) {
        const status = checkOwnershipStatus(product.slug, formatCode);
        let unitPrice = resolveFormatPrice(product, formatCode);
        const originalPrice = unitPrice;
        let upgradeOffset = 0;
        const isUpgrade = status.isUpgrade;

        if (isUpgrade) {
          const pdfPrice = resolveFormatPrice(product, 'PDF');
          upgradeOffset = Math.min(pdfPrice, unitPrice);
          unitPrice = Math.max(0, unitPrice - upgradeOffset);
        }

        const cartItemId = `${product.slug}__${formatCode}`;
        const existingIdx = updated.findIndex((it) => it.cartItemId === cartItemId);
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            selected: true,
            quantity: 1,
            unitPrice,
            originalPrice,
            upgradeOffset,
            isUpgrade,
            comboPackageId: pkg.id,
            comboPackageTitle: pkg.title,
          };
        } else {
          updated.push({
            cartItemId,
            productId: product.id,
            slug: product.slug,
            categorySlug: product.category_slug,
            code: product.code,
            title: product.title,
            googleFormProductName: product.google_form_product_name || product.title,
            formatCode,
            unitPrice,
            originalPrice,
            upgradeOffset,
            isUpgrade,
            upgradeFromFormat: isUpgrade ? 'PDF' : undefined,
            quantity: 1,
            selected: true,
            isComboEligible: product.is_combo_eligible,
            comboPackageId: pkg.id,
            comboPackageTitle: pkg.title,
          });
        }
      }
      return updated;
    });

    showToast(`Đã thêm gói "${pkg.title}" (${formatCode}) vào giỏ hàng.`);

    if (actionType === 'open_checkout') {
      if (!user) {
        const comboItems: CartItem[] = unownedProducts.map((p) => {
          const cartItemId = `${p.slug}__${formatCode}`;
          let unitPrice = resolveFormatPrice(p, formatCode);
          const originalPrice = unitPrice;
          let upgradeOffset = 0;
          const status = checkOwnershipStatus(p.slug, formatCode);
          const isUpgrade = status.isUpgrade;
          if (isUpgrade) {
            const pdfPrice = resolveFormatPrice(p, 'PDF');
            upgradeOffset = Math.min(pdfPrice, unitPrice);
            unitPrice = Math.max(0, unitPrice - upgradeOffset);
          }
          return {
            cartItemId,
            productId: p.id,
            slug: p.slug,
            categorySlug: p.category_slug,
            code: p.code,
            title: p.title,
            googleFormProductName: p.google_form_product_name || p.title,
            formatCode,
            unitPrice,
            originalPrice,
            upgradeOffset,
            isUpgrade,
            upgradeFromFormat: isUpgrade ? 'PDF' : undefined,
            quantity: 1,
            selected: true,
            isComboEligible: p.is_combo_eligible,
            comboPackageId: pkg.id,
            comboPackageTitle: pkg.title,
          };
        });
        savePendingCheckout(comboItems, 'buy_now');
        openAuthPrompt(comboItems);
        return;
      }
      setIsCheckoutOpen(true);
    } else {
      setIsCartOpen(true);
    }
  };

  const toggleCartItemSelect = (cartItemId: string) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const selectOnlyFormat = (formatCode: UiFormatCode) => {
    setCartItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: item.formatCode === formatCode,
      }))
    );
  };

  const deselectAllCartItems = () => {
    setCartItems((prev) => prev.map((item) => ({ ...item, selected: false })));
  };

  const bulkChangeSelectedFormats = (targetFormat: 'Word' | 'PDF') => {
    setCartItems((prev) => {
      let changedCount = 0;
      let skippedCount = 0;
      const nextMap = new Map<string, CartItem>();

      for (const item of prev) {
        if (!item.selected) {
          if (!nextMap.has(item.cartItemId)) {
            nextMap.set(item.cartItemId, item);
          }
          continue;
        }

        if (item.formatCode === targetFormat) {
          nextMap.set(item.cartItemId, { ...item, selected: true });
          continue;
        }

        const product = products.find((p) => p.id === item.productId || p.slug === item.slug);
        const hasTargetFormat = product
          ? (product.formats || []).some((f) => f.format_code === targetFormat && f.is_active)
          : true;
        const status = checkOwnershipStatus(item.slug, targetFormat);

        if (!hasTargetFormat || !status.canPurchase) {
          skippedCount++;
          if (!nextMap.has(item.cartItemId)) {
            nextMap.set(item.cartItemId, item);
          }
          continue;
        }

        let newUnitPrice = product ? resolveFormatPrice(product, targetFormat) : item.unitPrice;
        const originalPrice = newUnitPrice;
        let upgradeOffset = 0;
        const isUpgrade = status.isUpgrade;

        if (isUpgrade && product) {
          const pdfPrice = resolveFormatPrice(product, 'PDF');
          upgradeOffset = Math.min(pdfPrice, newUnitPrice);
          newUnitPrice = Math.max(0, newUnitPrice - upgradeOffset);
        }

        const newCartItemId = `${item.slug}__${targetFormat}`;
        const newQty = 1;

        const convertedItem: CartItem = {
          ...item,
          cartItemId: newCartItemId,
          formatCode: targetFormat,
          unitPrice: newUnitPrice,
          originalPrice,
          upgradeOffset,
          isUpgrade,
          upgradeFromFormat: isUpgrade ? 'PDF' : undefined,
          quantity: newQty,
          selected: true,
        };

        nextMap.set(newCartItemId, convertedItem);
        changedCount++;
      }

      if (changedCount > 0) {
        showToast(`Đã chuyển ${changedCount} tài liệu sang định dạng ${targetFormat}.`);
      } else if (skippedCount > 0) {
        showToast(`Không thể chuyển một số tài liệu sang định dạng ${targetFormat} do đã sở hữu hoặc không hỗ trợ.`);
      } else {
        showToast(`Các tài liệu đã chọn đều đang ở định dạng ${targetFormat}.`);
      }

      return Array.from(nextMap.values());
    });
  };

  const updateCartItemFormat = (cartItemId: string, newFormatCode: UiFormatCode) => {
    setCartItems((prev) => {
      const item = prev.find((it) => it.cartItemId === cartItemId);
      if (!item) return prev;
      if (item.formatCode === newFormatCode) return prev;

      const product = products.find((p) => p.id === item.productId || p.slug === item.slug);
      const status = checkOwnershipStatus(item.slug, newFormatCode);

      if (!status.canPurchase) {
        showToast(`⚠️ ${status.errorMessage}`);
        return prev;
      }

      let newUnitPrice = product ? resolveFormatPrice(product, newFormatCode) : item.unitPrice;
      const originalPrice = newUnitPrice;
      let upgradeOffset = 0;
      const isUpgrade = status.isUpgrade;

      if (isUpgrade && product) {
        const pdfPrice = resolveFormatPrice(product, 'PDF');
        upgradeOffset = Math.min(pdfPrice, newUnitPrice);
        newUnitPrice = Math.max(0, newUnitPrice - upgradeOffset);
      }

      const newCartItemId = `${item.slug}__${newFormatCode}`;
      const newQty = newFormatCode === 'Flashcard' ? item.quantity : 1;

      // Kiểm tra xem giỏ hàng đã có item khác trùng newCartItemId chưa
      const existingOtherIndex = prev.findIndex(
        (it) => it.cartItemId === newCartItemId && it.cartItemId !== cartItemId
      );

      let nextItems: CartItem[];
      if (existingOtherIndex >= 0) {
        // Hợp nhất / thay thế: xóa item cũ và giữ item mới
        nextItems = prev
          .filter((it) => it.cartItemId !== cartItemId)
          .map((it) =>
            it.cartItemId === newCartItemId
              ? {
                  ...it,
                  quantity: newFormatCode === 'Flashcard' ? it.quantity + newQty : 1,
                  unitPrice: newUnitPrice,
                  originalPrice,
                  upgradeOffset,
                  isUpgrade,
                  upgradeFromFormat: isUpgrade ? 'PDF' : undefined,
                  selected: true,
                }
              : it
          );
      } else {
        // Cập nhật ngay tại vị trí hiện tại
        nextItems = prev.map((it) =>
          it.cartItemId === cartItemId
            ? {
                ...it,
                cartItemId: newCartItemId,
                formatCode: newFormatCode,
                unitPrice: newUnitPrice,
                originalPrice,
                upgradeOffset,
                isUpgrade,
                upgradeFromFormat: isUpgrade ? 'PDF' : undefined,
                quantity: newQty,
                selected: true,
              }
            : it
        );
      }

      if (isUpgrade) {
        showToast(`Đã chuyển sang bản Nâng cấp Word (Chỉ bù ${formatVnd(newUnitPrice)}).`);
      } else {
        showToast(`Đã đổi định dạng sang ${newFormatCode} (${formatVnd(newUnitPrice)}).`);
      }
      return nextItems;
    });
  };

  const updateCartItemQty = (cartItemId: string, delta: number) => {
    setCartItems((prev) => {
      const target = prev.find((it) => it.cartItemId === cartItemId);
      if (target && target.formatCode !== 'Flashcard' && delta > 0) {
        showToast(`Định dạng ${target.formatCode} chỉ cho phép đặt số lượng 1 mỗi đơn.`);
        return prev;
      }
      return prev.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      );
    });
  };

  const removeCartItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearSelectedCartItems = () => {
    const checkoutIds = new Set(checkoutItems.map((it) => it.cartItemId));
    setCartItems((prev) =>
      prev.filter((item) => !item.selected && !checkoutIds.has(item.cartItemId))
    );
    setCheckoutItems([]);
  };

  const clearCart = async () => {
    setCartItems([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(OLD_CART_STORAGE_KEY);
      } catch {}
    }
    if (user) {
      try {
        await apiClient.clearUserCart();
        lastSyncedHashRef.current = computeCartHash([]);
      } catch (err) {
        console.error('[StoreContext] Error clearing cart on server:', err);
      }
    }
  };

  const selectedCartItems = useMemo(
    () => cartItems.filter((item) => item.selected),
    [cartItems]
  );

  const selectedFormats = useMemo(
    () => Array.from(new Set(selectedCartItems.map((item) => item.formatCode))),
    [selectedCartItems]
  );

  const hasFormatConflict = selectedFormats.length > 1;

  // Quy tắc: Trừ định dạng Flashcard, mỗi sản phẩm trong đơn chỉ được đặt với số lượng 1
  const hasMultipleProductsConflict = useMemo(() => {
    return selectedCartItems.some((it) => it.formatCode !== 'Flashcard' && it.quantity > 1);
  }, [selectedCartItems]);

  const activeFormat: UiFormatCode = selectedFormats[0] || 'Word';

  const comboEvaluation = useMemo(() => {
    if (hasFormatConflict || selectedCartItems.length === 0) {
      return {
        matchedCombo: null,
        comboProductIds: [],
        extraItems: [],
        originalSubtotal: selectedCartItems.reduce(
          (acc, it) => acc + (it.originalPrice || it.unitPrice + (it.upgradeOffset || 0)) * it.quantity,
          0
        ),
        comboDiscountAmount: 0,
        ownedOffsetAmount: selectedCartItems.reduce((acc, it) => acc + (it.upgradeOffset || 0), 0),
        finalPayableAmount: selectedCartItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0),
        hasExtraItems: false,
      };
    }
    return evaluateBestComboForCart({
      selectedCartItems,
      activeFormat,
      allComboPackages: comboPackages,
      allProducts: products,
      userLibrary,
    });
  }, [selectedCartItems, hasFormatConflict, activeFormat, comboPackages, products, userLibrary]);

  const prevMatchedComboRef = useRef<{ id: string | null; title: string | null; count: number }>({
    id: null,
    title: null,
    count: 0,
  });

  useEffect(() => {
    const prev = prevMatchedComboRef.current;
    const newCombo = comboEvaluation.matchedCombo;
    const notice = detectComboTransitionNotice({
      prevComboId: prev.id,
      prevComboTitle: prev.title,
      prevComboProductCount: prev.count,
      newEvaluation: comboEvaluation,
    });
    if (notice) {
      showToast(notice);
    }
    prevMatchedComboRef.current = {
      id: newCombo ? newCombo.packageId : null,
      title: newCombo ? newCombo.title : null,
      count: newCombo ? newCombo.matchedProductIds.length : 0,
    };
  }, [comboEvaluation.matchedCombo?.packageId]);

  const { subtotalAmount, discountPercent, discountAmount, totalAmount } = useMemo(() => {
    if (comboEvaluation.matchedCombo) {
      return {
        subtotalAmount: comboEvaluation.originalSubtotal,
        discountPercent: comboEvaluation.matchedCombo.discountPercent,
        discountAmount: comboEvaluation.comboDiscountAmount,
        totalAmount: comboEvaluation.finalPayableAmount,
      };
    }

    const subtotal = selectedCartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const eligibleCount = selectedCartItems
      .filter((item) => item.isComboEligible)
      .reduce((sum, item) => sum + item.quantity, 0);

    let bestDiscount = 0;
    for (const rule of comboRules) {
      if (eligibleCount >= rule.min_quantity && rule.discount_percent > bestDiscount) {
        bestDiscount = rule.discount_percent;
      }
    }

    const discAmt = Math.round((subtotal * bestDiscount) / 100);
    return {
      subtotalAmount: comboEvaluation.originalSubtotal || subtotal,
      discountPercent: bestDiscount,
      discountAmount: discAmt,
      totalAmount: Math.max(0, subtotal - discAmt),
    };
  }, [comboEvaluation, selectedCartItems, comboRules]);

  return (
    <StoreContext.Provider
      value={{
        isLoading,
        apiError,
        menus,
        categories,
        comboRules,
        products,
        siteConfigs,
        updateSiteConfig,
        clientRegion,
        setRegionOverride,
        refreshCatalog,
        cartItems,
        selectedCartItems,
        selectedFormats,
        hasFormatConflict,
        hasMultipleProductsConflict,
        comboEvaluation,
        subtotalAmount,
        discountPercent,
        discountAmount,
        totalAmount,
        checkOwnershipStatus,
        addToCart,
        addComboToCart,
        buyNow,
        toggleCartItemSelect,
        selectOnlyFormat,
        deselectAllCartItems,
        bulkChangeSelectedFormats,
        updateCartItemQty,
        updateCartItemFormat,
        removeCartItem,
        clearSelectedCartItems,
        clearCart,
        checkoutItems,
        setCheckoutItems,
        isCartOpen,
        setIsCartOpen,
        isSearchOpen,
        setIsSearchOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        sampleModalProduct,
        setSampleModalProduct,
        formatModalProduct,
        formatModalInitialFormat,
        formatModalDefaultAction,
        openFormatModal,
        closeFormatModal,
        comboModalPackage,
        comboModalAction,
        comboModalInitialFormat,
        openComboFormatModal,
        closeComboFormatModal,
        toastMessage,
        showToast,
        isAuthPromptOpen,
        setIsAuthPromptOpen,
        pendingCheckoutItems,
        openAuthPrompt,
        closeAuthPrompt,
        savePendingCheckout,
        restorePendingCheckout,
      }}
    >
      <React.Fragment key={hasInitialHydrated ? 'hydrated' : 'loading'}>{children}</React.Fragment>
      <CheckoutAuthPromptModal />
    </StoreContext.Provider>
  );
};

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
