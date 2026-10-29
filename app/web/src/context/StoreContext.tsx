import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import {
  CartItem,
  CategoryItem,
  ComboRule,
  MenuItem,
  Product,
  UiFormatCode,
} from '../types';

interface StoreContextValue {
  isLoading: boolean;
  apiError: string | null;
  menus: MenuItem[];
  categories: CategoryItem[];
  comboRules: ComboRule[];
  products: Product[];
  clientRegion: {
    country: string;
    recommendedGateway: 'sepay' | 'paypal';
  };
  setRegionOverride: (country: 'VN' | 'INTL') => void;
  refreshCatalog: () => Promise<void>;

  // Cart & Single-Format Rule
  cartItems: CartItem[];
  selectedCartItems: CartItem[];
  selectedFormats: UiFormatCode[];
  hasFormatConflict: boolean;
  subtotalAmount: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  addToCart: (product: Product, formatCode: UiFormatCode, quantity?: number) => void;
  buyNow: (product: Product, formatCode: UiFormatCode, quantity?: number) => void;
  toggleCartItemSelect: (cartItemId: string) => void;
  selectOnlyFormat: (formatCode: UiFormatCode) => void;
  updateCartItemQty: (cartItemId: string, delta: number) => void;
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
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'huytutor_cart_v1';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [comboRules, setComboRules] = useState<ComboRule[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientRegion, setClientRegion] = useState<{
    country: string;
    recommendedGateway: 'sepay' | 'paypal';
  }>({
    country: 'VN',
    recommendedGateway: 'sepay',
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
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
      setClientRegion(data.clientRegion);
    } catch (err: any) {
      setApiError(
        err?.message ||
          'Không thể kết nối tới máy chủ. Vui lòng tải lại trang hoặc kiểm tra kết nối mạng.'
      );
    } finally {
      setIsLoading(false);
    }
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
    setClientRegion({
      country,
      recommendedGateway: country === 'VN' ? 'sepay' : 'paypal',
    });
  };

  const refreshCatalog = async () => {
    await loadInitFromBackend();
  };

  const resolveFormatPrice = (product: Product, formatCode: UiFormatCode): number => {
    const found = product.formats.find((f) => f.format_code === formatCode);
    if (found) return found.price;
    const firstActive = product.formats.find((f) => f.is_active) || product.formats[0];
    return firstActive ? firstActive.price : 150000;
  };

  const addToCart = (product: Product, formatCode: UiFormatCode, quantity = 1) => {
    const unitPrice = resolveFormatPrice(product, formatCode);
    const cartItemId = `${product.slug}__${formatCode}`;

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

    showToast(`Đã thêm "${product.title}" (${formatCode}) vào giỏ hàng.`);
  };

  const buyNow = (product: Product, formatCode: UiFormatCode, quantity = 1) => {
    const unitPrice = resolveFormatPrice(product, formatCode);
    const cartItemId = `${product.slug}__${formatCode}`;

    setCartItems((prev) => {
      // Để đảm bảo quy tắc Single-Format khi bấm Mua ngay, chỉ tích chọn các sản phẩm cùng định dạng hoặc sản phẩm vừa bấm
      const deselectedOtherFormats = prev.map((it) => ({
        ...it,
        selected: it.formatCode === formatCode ? it.selected : false,
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

  const updateCartItemQty = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
    );
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
        clientRegion,
        setRegionOverride,
        refreshCatalog,
        cartItems,
        selectedCartItems,
        selectedFormats,
        hasFormatConflict,
        subtotalAmount,
        discountPercent,
        discountAmount,
        totalAmount,
        addToCart,
        buyNow,
        toggleCartItemSelect,
        selectOnlyFormat,
        updateCartItemQty,
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
        toastMessage,
        showToast,
      }}
    >
      {children}
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
