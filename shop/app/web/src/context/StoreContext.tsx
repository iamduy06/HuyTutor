import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../api/client';
import {
  CartItem,
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
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const CART_STORAGE_KEY = 'huytutor_cart_v1';

const DEFAULT_SITE_CONFIGS: SiteConfigs = {
  footer_social_links: [],
  footer_policy_links: [],
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isItemInLibrary, userLibrary } = useAuth();
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

  const comboPackages = useMemo(() => {
    const blocks = siteConfigs?.combo_page_blocks || [];
    const pkgBlock = blocks.find((b: any) => b.type === 'combo_packages');
    const cfg = pkgBlock?.config as ComboPackagesBlockConfig | undefined;
    return (cfg?.packages || []) as ComboPackageItem[];
  }, [siteConfigs?.combo_page_blocks]);

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
