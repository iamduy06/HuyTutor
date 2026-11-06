import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';
import {
  CartItem,
  CategoryItem,
  ComboRule,
  MenuItem,
  Product,
  SiteConfigs,
  UiFormatCode,
  ClientRegion,
  formatVnd,
} from '../types';

interface StoreContextValue {
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
  buyNow: (product: Product, formatCode: UiFormatCode, quantity?: number) => void;
  toggleCartItemSelect: (cartItemId: string) => void;
  selectOnlyFormat: (formatCode: UiFormatCode) => void;
  updateCartItemQty: (cartItemId: string, delta: number) => void;
  updateCartItemFormat: (cartItemId: string, newFormatCode: UiFormatCode) => void;
  removeCartItem: (cartItemId: string) => void;
  clearSelectedCartItems: () => void;

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
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'huytutor_cart_v1';

const DEFAULT_SITE_CONFIGS: SiteConfigs = {
  footer_social_links: [],
  footer_policy_links: [],
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isItemInLibrary } = useAuth();
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

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
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

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // ignore storage errors
    }
  }, [cartItems]);

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
        const hasOtherItem = prev.some((it) => it.cartItemId !== cartItemId);
        if (hasOtherItem) {
          showToast(
            `⚠️ Quy tắc: Trừ Flashcard, mỗi đơn chỉ được đặt 1 sản phẩm. Giỏ hàng đã được chọn tài liệu mới.`
          );
        }
        return [
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

    if (formatCode !== 'Flashcard') {
      setCartItems([
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
      ]);
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
    setCartItems((prev) => prev.filter((item) => !item.selected));
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

  // Quy tắc: Trừ định dạng Flashcard, mỗi đơn hàng chỉ được đặt tối đa 1 sản phẩm với số lượng 1
  const hasMultipleProductsConflict = useMemo(() => {
    const isNonFlashcard = selectedFormats.some((fmt) => fmt !== 'Flashcard');
    if (!isNonFlashcard) return false;
    return selectedCartItems.length > 1 || selectedCartItems.some((it) => it.quantity > 1);
  }, [selectedFormats, selectedCartItems]);

  const { subtotalAmount, discountPercent, discountAmount, totalAmount } = useMemo(() => {
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
      subtotalAmount: subtotal,
      discountPercent: bestDiscount,
      discountAmount: discAmt,
      totalAmount: Math.max(0, subtotal - discAmt),
    };
  }, [selectedCartItems, comboRules]);

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
        subtotalAmount,
        discountPercent,
        discountAmount,
        totalAmount,
        checkOwnershipStatus,
        addToCart,
        buyNow,
        toggleCartItemSelect,
        selectOnlyFormat,
        updateCartItemQty,
        updateCartItemFormat,
        removeCartItem,
        clearSelectedCartItems,
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
        toastMessage,
        showToast,
      }}
    >
      <React.Fragment key={hasInitialHydrated ? 'hydrated' : 'loading'}>{children}</React.Fragment>
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
