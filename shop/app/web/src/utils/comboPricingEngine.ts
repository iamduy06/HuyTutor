import {
  CartItem,
  ComboFormatPricing,
  ComboPackageItem,
  Product,
  UiFormatCode,
  UI_FORMATS,
  UserLibraryItem,
  formatVnd,
} from '../types';

/**
 * Đảm bảo gói Combo luôn có cấu hình đủ 5 định dạng, khởi tạo giá trống '' (không hardcode số tiền)
 */
export function ensurePackageFormatPricings(pkg: ComboPackageItem): ComboFormatPricing[] {
  const existing = pkg.format_pricings || [];
  return UI_FORMATS.map((fmt) => {
    const found = existing.find((f) => f.format_code === fmt);
    if (found) {
      return {
        format_code: fmt,
        is_enabled: Boolean(found.is_enabled),
        combo_price: found.combo_price !== undefined ? found.combo_price : '',
      };
    }
    const isLegacyPdf = (pkg.format_badge || '').toLowerCase().includes('pdf');
    const defaultEnabled = isLegacyPdf ? fmt === 'PDF' : fmt === 'Word';
    return {
      format_code: fmt,
      is_enabled: defaultEnabled,
      combo_price: '',
    };
  });
}

export interface MatchedComboInfo {
  packageId: string;
  title: string;
  formatCode: UiFormatCode;
  comboPrice: number;
  totalOriginalPrice: number;
  comboDiscountAmount: number;
  discountPercent: number;
  matchedProductIds: string[]; // Tất cả product ID của gói combo
  cartProductIds: string[]; // Các product ID đang nằm trong giỏ hàng
  ownedProductIds: string[]; // Các product ID khách đã sở hữu trước đó (cùng định dạng hoặc PDF)
  ownedOffsetAmount: number; // Tổng số tiền khấu trừ từ tài liệu đã mua
  ownedProductTitles: string[]; // Tên các tài liệu đã sở hữu được khấu trừ
  comboPayable: number; // Math.max(0, comboPrice - ownedOffsetAmount)
}

export interface ExtraCartItemCalculation {
  cartItemId: string;
  productId: string;
  slug: string;
  title: string;
  formatCode: UiFormatCode;
  unitPrice: number;
  quantity: number;
  isUpgrade: boolean;
  upgradeOffset: number;
  payableAmount: number;
}

export interface ComboCartEvaluation {
  matchedCombo: MatchedComboInfo | null;
  comboProductIds: string[];
  extraItems: ExtraCartItemCalculation[];
  originalSubtotal: number; // Tổng giá gốc của toàn bộ sản phẩm đang chọn trong giỏ
  comboDiscountAmount: number; // Tiền tiết kiệm từ gói Combo
  ownedOffsetAmount: number; // Tiền khấu trừ tài liệu đã sở hữu
  finalPayableAmount: number; // Tổng số tiền thực thanh toán
  hasExtraItems: boolean;
}

/**
 * Tra cứu giá bán lẻ của một sản phẩm theo định dạng cụ thể
 */
export function getProductRetailPrice(product: Product, formatCode: UiFormatCode): number {
  const fmt = (product.formats || []).find(
    (f) => f.format_code === formatCode && f.is_active && Number(f.price) > 0
  );
  return fmt ? Number(fmt.price) : 0;
}

/**
 * Thuật toán tự động ghép Gói Combo Lớn Nhất & Tối Ưu Nhất cho giỏ hàng
 * Ưu tiên:
 * 1. Gói có số lượng sản phẩm lớn nhất (pkg.product_ids.length lớn nhất)
 * 2. Khớp được nhiều sản phẩm trong giỏ nhất
 * 3. Tổng số tiền thanh toán thấp nhất (tiết kiệm nhất cho khách hàng)
 */
export function evaluateBestComboForCart(params: {
  selectedCartItems: CartItem[];
  activeFormat: UiFormatCode;
  allComboPackages: ComboPackageItem[];
  allProducts: Product[];
  userLibrary: UserLibraryItem[];
}): ComboCartEvaluation {
  const { selectedCartItems, activeFormat, allComboPackages, allProducts, userLibrary } = params;

  // Tính tổng giá gốc ban đầu của các item đang chọn trong giỏ
  const originalSubtotal = selectedCartItems.reduce((acc, it) => {
    const orig = it.originalPrice || it.unitPrice + (it.upgradeOffset || 0);
    return acc + orig * it.quantity;
  }, 0);

  if (selectedCartItems.length === 0) {
    return {
      matchedCombo: null,
      comboProductIds: [],
      extraItems: [],
      originalSubtotal: 0,
      comboDiscountAmount: 0,
      ownedOffsetAmount: 0,
      finalPayableAmount: 0,
      hasExtraItems: false,
    };
  }

  // Tập sản phẩm trong giỏ (chuẩn hóa về slug và id)
  const cartProductKeys = new Set(
    selectedCartItems.flatMap((it) => [
      String(it.productId || '').toLowerCase().trim(),
      String(it.slug || '').toLowerCase().trim(),
    ])
  );

  // Ánh xạ linh hoạt giữa Product ID (UUID) và Product Slug
  const resolveProductKeys = (prodIdOrSlug: string) => {
    const clean = String(prodIdOrSlug || '').toLowerCase().trim();
    const prod = allProducts.find(
      (p) =>
        String(p.id || '').toLowerCase().trim() === clean ||
        String(p.slug || '').toLowerCase().trim() === clean
    );
    return {
      id: prod ? String(prod.id).toLowerCase().trim() : clean,
      slug: prod ? String(prod.slug).toLowerCase().trim() : clean,
    };
  };

  // Tập sản phẩm đã sở hữu trong Tủ sách cá nhân (So khớp cả Slug và ID)
  const isOwnedSameFormat = (prodIdOrSlug: string): boolean => {
    const { id, slug } = resolveProductKeys(prodIdOrSlug);
    return userLibrary.some(
      (lib) =>
        lib.is_active &&
        lib.format_code === activeFormat &&
        (String(lib.product_slug || '').toLowerCase().trim() === slug ||
          String(lib.product_slug || '').toLowerCase().trim() === id ||
          String(lib.id || '').toLowerCase().trim() === id)
    );
  };

  const isOwnedPdfForWordUpgrade = (prodIdOrSlug: string): boolean => {
    if (activeFormat !== 'Word') return false;
    const { id, slug } = resolveProductKeys(prodIdOrSlug);
    return userLibrary.some(
      (lib) =>
        lib.is_active &&
        lib.format_code === 'PDF' &&
        (String(lib.product_slug || '').toLowerCase().trim() === slug ||
          String(lib.product_slug || '').toLowerCase().trim() === id ||
          String(lib.id || '').toLowerCase().trim() === id)
    );
  };

  const getPaidAmountForOwnedItem = (
    prodIdOrSlug: string,
    fmt: UiFormatCode,
    fallbackPrice: number
  ): number => {
    const { id, slug } = resolveProductKeys(prodIdOrSlug);
    const matchedLib = userLibrary.find(
      (lib) =>
        lib.is_active &&
        lib.format_code === fmt &&
        (String(lib.product_slug || '').toLowerCase().trim() === slug ||
          String(lib.product_slug || '').toLowerCase().trim() === id ||
          String(lib.id || '').toLowerCase().trim() === id)
    );
    if (matchedLib && typeof matchedLib.paid_amount === 'number' && matchedLib.paid_amount > 0) {
      return matchedLib.paid_amount;
    }
    return fallbackPrice;
  };

  // Quét các gói combo ứng viên khớp với định dạng activeFormat
  interface CandidateCombo {
    pkg: ComboPackageItem;
    comboPrice: number;
    totalOriginalPrice: number;
    comboDiscountAmount: number;
    discountPercent: number;
    matchedProductIds: string[];
    cartProductIds: string[];
    ownedProductIds: string[];
    ownedOffsetAmount: number;
    ownedProductTitles: string[];
    comboPayable: number;
    extraItems: ExtraCartItemCalculation[];
    totalPayable: number;
  }

  const candidateCombos: CandidateCombo[] = [];

  for (const pkg of allComboPackages) {
    if (!pkg.product_ids || pkg.product_ids.length === 0) continue;

    const pricings = ensurePackageFormatPricings(pkg);
    const formatPricing = pricings.find((fp) => fp.format_code === activeFormat && fp.is_enabled);

    let comboPrice = 0;
    if (formatPricing && typeof formatPricing.combo_price === 'number' && formatPricing.combo_price > 0) {
      comboPrice = formatPricing.combo_price;
    } else {
      // Tương thích ngược: nếu gói cũ dùng format_badge
      const badgeFormat = (pkg.format_badge || '').toLowerCase().includes('pdf') ? 'PDF' : 'Word';
      if (badgeFormat === activeFormat) {
        // Dự phòng tính từ discount_badge nếu chưa có format_pricings
        const match = (pkg.discount_badge || '').match(/(\d+)\s*%/);
        const discountPct = match ? parseInt(match[1], 10) : 0;
        const pkgProds = allProducts.filter(
          (p) => pkg.product_ids.includes(p.id) || pkg.product_ids.includes(p.slug)
        );
        const sumOrig = pkgProds.reduce((sum, p) => sum + getProductRetailPrice(p, activeFormat), 0);
        comboPrice = discountPct > 0 ? Math.round((sumOrig * (100 - discountPct)) / 100) : sumOrig;
      }
    }

    if (comboPrice <= 0) continue;

    // Kiểm tra xem tất cả các sản phẩm của pkg có được thỏa mãn không:
    // Mỗi sản phẩm trong pkg.product_ids:
    // - Phải đang nằm trong giỏ hàng (cartProductKeys), HOẶC
    // - Đã sở hữu trong Tủ sách (cùng định dạng activeFormat)
    const pkgProductIds = pkg.product_ids;
    let allAccountedFor = true;
    const cartProductIds: string[] = [];
    const ownedProductIds: string[] = [];
    const ownedProductTitles: string[] = [];
    let ownedOffsetAmount = 0;

    for (const prodKey of pkgProductIds) {
      const cleanKey = String(prodKey).toLowerCase().trim();
      const inCart = cartProductKeys.has(cleanKey);
      const dbProd = allProducts.find(
        (p) =>
          String(p.id).toLowerCase().trim() === cleanKey ||
          String(p.slug).toLowerCase().trim() === cleanKey
      );
      const retailPrice = dbProd ? getProductRetailPrice(dbProd, activeFormat) : 0;
      const pdfRetailPrice = dbProd ? getProductRetailPrice(dbProd, 'PDF') : 0;
      const title = dbProd?.title || prodKey;

      if (inCart) {
        cartProductIds.push(prodKey);
        // Nếu mua bản Word và khách đã có bản PDF trước đó -> Khấu trừ tiền PDF đã mua
        if (activeFormat === 'Word' && isOwnedPdfForWordUpgrade(prodKey)) {
          const paidPdf = getPaidAmountForOwnedItem(prodKey, 'PDF', pdfRetailPrice);
          ownedOffsetAmount += Math.min(paidPdf, retailPrice);
          ownedProductIds.push(prodKey);
          ownedProductTitles.push(`${title} (bản PDF)`);
        }
      } else if (isOwnedSameFormat(prodKey)) {
        // Đã sở hữu cùng định dạng -> Khấu trừ số tiền cuốn này vào giá combo
        const paidSame = getPaidAmountForOwnedItem(prodKey, activeFormat, retailPrice);
        ownedOffsetAmount += Math.min(paidSame, retailPrice);
        ownedProductIds.push(prodKey);
        ownedProductTitles.push(title);
      } else {
        // Sản phẩm này chưa có trong giỏ và cũng chưa sở hữu -> Không khớp trọn gói combo này
        allAccountedFor = false;
        break;
      }
    }

    // Điều kiện: Phải thỏa mãn toàn bộ sản phẩm của gói VÀ phải có ít nhất 1 sản phẩm của gói đang nằm trong giỏ
    if (!allAccountedFor || cartProductIds.length === 0) continue;

    // Tính tổng giá gốc của toàn bộ sản phẩm trong combo
    const pkgProds = allProducts.filter(
      (p) => pkg.product_ids.includes(p.id) || pkg.product_ids.includes(p.slug)
    );
    const totalOriginalPrice = pkgProds.reduce(
      (sum, p) => sum + getProductRetailPrice(p, activeFormat),
      0
    );
    const comboDiscountAmount = Math.max(0, totalOriginalPrice - comboPrice);
    const discountPercent =
      totalOriginalPrice > 0 ? Math.round((comboDiscountAmount / totalOriginalPrice) * 100) : 0;

    // Tính tổng giá bán lẻ của các tài liệu trong gói mà khách chưa sở hữu
    const missingProds = pkgProds.filter((p) => {
      const cleanId = String(p.id).toLowerCase().trim();
      const cleanSlug = String(p.slug).toLowerCase().trim();
      return !ownedProductIds.some((oid) => {
        const { id, slug } = resolveProductKeys(oid);
        return id === cleanId || slug === cleanSlug;
      });
    });
    const missingRetailSum = missingProds.reduce(
      (sum, p) => sum + getProductRetailPrice(p, activeFormat),
      0
    );

    // Mức thanh toán ưu đãi combo sau khi khấu trừ tiền tài liệu đã mua
    const discountedComboPayable = comboPrice - ownedOffsetAmount;

    // Khách hàng luôn được hưởng mức giá tối ưu nhất:
    // - Nếu combo sau khấu trừ > 0: lấy mức tối ưu giữa (giá lẻ các cuốn còn thiếu) và (combo sau khấu trừ)
    // - Nếu combo sau khấu trừ <= 0: khách chỉ cần thanh toán theo giá lẻ các cuốn còn thiếu
    let comboPayable = 0;
    if (discountedComboPayable > 0) {
      comboPayable = missingRetailSum > 0 ? Math.min(missingRetailSum, discountedComboPayable) : discountedComboPayable;
    } else {
      comboPayable = missingRetailSum > 0 ? missingRetailSum : 0;
    }

    // Tính toán các sản phẩm còn dư nằm ngoài combo (tính giá lẻ bình thường hoặc giá nâng cấp lẻ)
    const comboKeySet = new Set(
      pkgProductIds.flatMap((id) => {
        const prod = allProducts.find((p) => p.id === id || p.slug === id);
        return [
          String(id).toLowerCase().trim(),
          prod ? String(prod.id).toLowerCase().trim() : '',
          prod ? String(prod.slug).toLowerCase().trim() : '',
        ].filter(Boolean);
      })
    );

    const extraItems: ExtraCartItemCalculation[] = [];
    let extraItemsPayable = 0;

    for (const it of selectedCartItems) {
      const itSlug = String(it.slug || it.productId || '').toLowerCase().trim();
      const itId = String(it.productId || '').toLowerCase().trim();
      const isPartOfCombo = comboKeySet.has(itSlug) || comboKeySet.has(itId);

      if (!isPartOfCombo) {
        const isUpgrade = Boolean(it.isUpgrade);
        const upgradeOffset = isUpgrade ? Number(it.upgradeOffset || 0) : 0;
        const linePayable = isUpgrade
          ? Math.max(0, it.unitPrice - upgradeOffset) * it.quantity
          : it.unitPrice * it.quantity;

        extraItems.push({
          cartItemId: it.cartItemId,
          productId: it.productId,
          slug: it.slug,
          title: it.title,
          formatCode: it.formatCode,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
          isUpgrade,
          upgradeOffset,
          payableAmount: linePayable,
        });
        extraItemsPayable += linePayable;
      }
    }

    const totalPayable = comboPayable + extraItemsPayable;

    candidateCombos.push({
      pkg,
      comboPrice,
      totalOriginalPrice,
      comboDiscountAmount,
      discountPercent,
      matchedProductIds: pkgProductIds,
      cartProductIds,
      ownedProductIds,
      ownedOffsetAmount,
      ownedProductTitles,
      comboPayable,
      extraItems,
      totalPayable,
    });
  }

  // Nếu không khớp gói combo nào: tính theo giá lẻ / nâng cấp lẻ thông thường
  if (candidateCombos.length === 0) {
    let regularTotal = 0;
    let regularOffset = 0;
    const extraItems: ExtraCartItemCalculation[] = selectedCartItems.map((it) => {
      const isUpgrade = Boolean(it.isUpgrade);
      const upgradeOffset = isUpgrade ? Number(it.upgradeOffset || 0) : 0;
      const linePayable = isUpgrade
        ? Math.max(0, it.unitPrice - upgradeOffset) * it.quantity
        : it.unitPrice * it.quantity;
      regularTotal += linePayable;
      regularOffset += upgradeOffset;
      return {
        cartItemId: it.cartItemId,
        productId: it.productId,
        slug: it.slug,
        title: it.title,
        formatCode: it.formatCode,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        isUpgrade,
        upgradeOffset,
        payableAmount: linePayable,
      };
    });

    return {
      matchedCombo: null,
      comboProductIds: [],
      extraItems,
      originalSubtotal,
      comboDiscountAmount: 0,
      ownedOffsetAmount: regularOffset,
      finalPayableAmount: regularTotal,
      hasExtraItems: false,
    };
  }

  // Sắp xếp các gói combo ứng viên:
  // 1. Số lượng sản phẩm của combo lớn nhất (pkg.product_ids.length giảm dần)
  // 2. Số lượng sản phẩm trong giỏ được ghép vào combo nhiều nhất (cartProductIds.length giảm dần)
  // 3. Tổng số tiền thanh toán thấp nhất (totalPayable tăng dần)
  candidateCombos.sort((a, b) => {
    if (b.pkg.product_ids.length !== a.pkg.product_ids.length) {
      return b.pkg.product_ids.length - a.pkg.product_ids.length;
    }
    if (b.cartProductIds.length !== a.cartProductIds.length) {
      return b.cartProductIds.length - a.cartProductIds.length;
    }
    return a.totalPayable - b.totalPayable;
  });

  const best = candidateCombos[0];

  // Tổng tiền khấu trừ bao gồm: khấu trừ tài liệu combo + khấu trừ nâng cấp của sách lẻ ngoài combo
  const extraUpgradeOffset = best.extraItems.reduce(
    (sum, it) => sum + (it.isUpgrade ? it.upgradeOffset : 0),
    0
  );
  const totalOwnedOffset = best.ownedOffsetAmount + extraUpgradeOffset;

  return {
    matchedCombo: {
      packageId: best.pkg.id,
      title: best.pkg.title,
      formatCode: activeFormat,
      comboPrice: best.comboPrice,
      totalOriginalPrice: best.totalOriginalPrice,
      comboDiscountAmount: best.comboDiscountAmount,
      discountPercent: best.discountPercent,
      matchedProductIds: best.matchedProductIds,
      cartProductIds: best.cartProductIds,
      ownedProductIds: best.ownedProductIds,
      ownedOffsetAmount: best.ownedOffsetAmount,
      ownedProductTitles: best.ownedProductTitles,
      comboPayable: best.comboPayable,
    },
    comboProductIds: best.matchedProductIds,
    extraItems: best.extraItems,
    originalSubtotal,
    comboDiscountAmount: best.comboDiscountAmount,
    ownedOffsetAmount: totalOwnedOffset,
    finalPayableAmount: best.totalPayable,
    hasExtraItems: best.extraItems.length > 0,
  };
}

/**
 * Phát hiện và trả về đúng câu thông báo chuyển đổi trạng thái Combo chuẩn (Mục 3.1)
 */
export function detectComboTransitionNotice(params: {
  prevComboId: string | null;
  prevComboTitle: string | null;
  prevComboProductCount: number;
  newEvaluation: ComboCartEvaluation;
}): string | null {
  const { prevComboId, prevComboTitle, prevComboProductCount, newEvaluation } = params;
  const newCombo = newEvaluation.matchedCombo;

  // 1. Nhặt lẻ đủ sách khớp với 1 gói Combo lần đầu
  if (!prevComboId && newCombo) {
    return `Đã áp dụng ưu đãi gói "${newCombo.title}" (Tiết kiệm ${formatVnd(newCombo.comboDiscountAmount)} so với mua lẻ).`;
  }

  // 2. Chuyển đổi từ Combo nhỏ lên Combo lớn hơn
  if (
    prevComboId &&
    newCombo &&
    prevComboId !== newCombo.packageId &&
    newCombo.matchedProductIds.length > prevComboProductCount
  ) {
    return `Đã chuyển đổi lên gói "${newCombo.title}" với mức ưu đãi tốt hơn (Tiết kiệm ${formatVnd(newCombo.comboDiscountAmount)}).`;
  }

  // 5. Xóa bớt sách của Combo lớn nhưng vẫn khớp Combo nhỏ
  if (
    prevComboId &&
    newCombo &&
    prevComboId !== newCombo.packageId &&
    newCombo.matchedProductIds.length < prevComboProductCount
  ) {
    return `Đã chuyển đổi sang gói "${newCombo.title}" phù hợp với các tài liệu hiện có trong giỏ hàng.`;
  }

  // 4. Xóa bớt sách khiến không còn đủ điều kiện gói Combo nào
  if (prevComboId && !newCombo) {
    return `Giỏ hàng không còn đủ tài liệu của gói "${prevComboTitle || 'Combo'}". Các tài liệu hiện tại được tính theo giá lẻ.`;
  }

  return null;
}
