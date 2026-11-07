import crypto from 'crypto';
import { Request, Response } from 'express';
import { dbService, SeedOrder, SeedOrderItem, SeedProductFormat } from '../services/dbService';
import { isValidUiFormat, UiFormatCode, mapFormatToGoogleFormNote } from '../constants/formatMapping';
import { buildPaymentInstruction } from '../services/paymentService';
import { GOOGLE_FORM_CUSTOMER_GROUPS } from '../services/googleFormService';

/**
 * Hàm tính toán khấu trừ nâng cấp định dạng PDF -> Word theo Phương án B:
 * - Kiểm tra quyền sở hữu PDF trong Tủ sách cá nhân
 * - Truy vấn đơn hàng đã cấp cuốn PDF để tính chính xác số tiền thực tế đã trả (bao gồm % giảm giá Combo nếu có)
 * - Khấu trừ số tiền đã trả cho bản Word niêm yết hiện tại
 */
export async function calculateUpgradeForUser(
  userId: string,
  userEmail: string,
  productSlugOrId: string,
  allProducts: any[]
): Promise<{
  eligible: boolean;
  code: 'ELIGIBLE' | 'ALREADY_OWNS_WORD' | 'NO_PDF_OWNED' | 'INVALID_FORMAT' | 'PRODUCT_NOT_FOUND';
  message: string;
  formatFrom?: UiFormatCode;
  formatTo?: UiFormatCode;
  paidAmount?: number;
  wordPrice?: number;
  offsetAmount?: number;
  amountToPay?: number;
  matchedProduct?: any;
}> {
  const cleanKey = String(productSlugOrId || '').toLowerCase().trim();
  const dbProd = allProducts.find(
    (p) =>
      (p.id && String(p.id).toLowerCase().trim() === cleanKey) ||
      (p.slug && String(p.slug).toLowerCase().trim() === cleanKey) ||
      (p.code && String(p.code).toLowerCase().trim() === cleanKey)
  );

  if (!dbProd) {
    return {
      eligible: false,
      code: 'PRODUCT_NOT_FOUND',
      message: 'Không tìm thấy sản phẩm trên hệ thống.',
    };
  }

  const wordFmt = (dbProd.formats || []).find(
    (f: any) => f.format_code === 'Word' && f.is_active && Number(f.price) > 0
  );
  if (!wordFmt) {
    return {
      eligible: false,
      code: 'INVALID_FORMAT',
      message: 'Tài liệu này không hỗ trợ định dạng Word để nâng cấp.',
    };
  }

  const userLibrary = await dbService.getUserLibrary(userId);
  const prodSlug = (dbProd.slug || '').toLowerCase().trim();
  const prodId = (dbProd.id || '').toLowerCase().trim();

  const ownsWord = userLibrary.some(
    (lib) =>
      ((lib.product_slug || '').toLowerCase().trim() === prodSlug ||
        (lib.product_slug || '').toLowerCase().trim() === prodId ||
        lib.id === prodSlug ||
        lib.id === prodId) &&
      lib.format_code === 'Word' &&
      lib.is_active
  );

  if (ownsWord) {
    return {
      eligible: false,
      code: 'ALREADY_OWNS_WORD',
      message: 'Bạn đã sở hữu tài liệu này ở định dạng Word trong Tủ sách cá nhân.',
      matchedProduct: dbProd,
    };
  }

  const pdfLibItem = userLibrary.find(
    (lib) =>
      ((lib.product_slug || '').toLowerCase().trim() === prodSlug ||
        (lib.product_slug || '').toLowerCase().trim() === prodId ||
        lib.id === prodSlug ||
        lib.id === prodId) &&
      lib.format_code === 'PDF' &&
      lib.is_active
  );

  if (!pdfLibItem) {
    return {
      eligible: false,
      code: 'NO_PDF_OWNED',
      message: 'Bạn chưa sở hữu bản PDF của tài liệu này trong Tủ sách cá nhân.',
      matchedProduct: dbProd,
    };
  }

  // Khách hàng ĐÃ SỞ HỮU PDF và CHƯA CÓ WORD -> Đủ điều kiện nâng cấp bù tiền!
  // Tính toán số tiền thực tế khách đã thanh toán cho bản PDF (kèm chia đều theo % Combo)
  let paidForPdf = 0;
  const pdfFmt = (dbProd.formats || []).find((f: any) => f.format_code === 'PDF');
  const fallbackPdfPrice = pdfFmt && Number(pdfFmt.price) > 0 ? Number(pdfFmt.price) : 0;

  try {
    const userOrders = await dbService.getUserOrders(userId, userEmail);
    // Tìm đơn hàng đã cấp cuốn PDF: ưu tiên khớp order_code, order_id hoặc tìm đơn đã thanh toán có chứa sản phẩm PDF này
    const matchedOrder = userOrders.find(
      (o) =>
        o.payment_status === 'paid' &&
        ((pdfLibItem.order_code && o.order_code === pdfLibItem.order_code) ||
          (pdfLibItem.order_id && o.id === pdfLibItem.order_id) ||
          (Array.isArray(o.items) &&
            o.items.some(
              (it) =>
                ((it.product_id || '').toLowerCase().trim() === prodSlug ||
                  (it.product_id || '').toLowerCase().trim() === prodId) &&
                it.format_code === 'PDF'
            )))
    );

    if (matchedOrder && Array.isArray(matchedOrder.items)) {
      const orderItem = matchedOrder.items.find(
        (it) =>
          ((it.product_id || '').toLowerCase().trim() === prodSlug ||
            (it.product_id || '').toLowerCase().trim() === prodId) &&
          it.format_code === 'PDF'
      );

      const baseItemPrice = orderItem ? Number(orderItem.unit_price) : fallbackPdfPrice;

      const actualOrderPaid =
        typeof matchedOrder.final_amount === 'number'
          ? matchedOrder.final_amount
          : typeof matchedOrder.total_amount === 'number'
          ? matchedOrder.total_amount
          : -1;

      // Nếu đơn hàng chỉ có duy nhất 1 sản phẩm, lấy trực tiếp số tiền thực tế khách đã trả (loại bỏ hoàn toàn sai số làm tròn %)
      if (matchedOrder.items.length === 1 && actualOrderPaid >= 0) {
        paidForPdf = actualOrderPaid;
      } else {
        // Đơn hàng nhiều sản phẩm hoặc Combo: Tính tỷ lệ chiết khấu thực tế bằng con số thực VND
        let discountRate = 0;
        const subtotal = Number(matchedOrder.subtotal_amount || 0);
        const totalPaid = actualOrderPaid >= 0 ? actualOrderPaid : Number(matchedOrder.total_amount || 0);
        const discountAmt =
          typeof matchedOrder.discount_amount === 'number' && matchedOrder.discount_amount > 0
            ? matchedOrder.discount_amount
            : subtotal > totalPaid && totalPaid > 0
            ? subtotal - totalPaid
            : 0;

        // Ưu tiên tính từ discount_amount / subtotal_amount để đảm bảo độ chính xác toán học tuyệt đối
        if (discountAmt > 0 && subtotal > 0) {
          discountRate = discountAmt / subtotal;
        } else if (
          typeof matchedOrder.discount_percent === 'number' &&
          matchedOrder.discount_percent > 0
        ) {
          // Dự phòng duy nhất cho đơn cũ legacy chưa có discount_amount
          discountRate = matchedOrder.discount_percent / 100;
        }

        paidForPdf = Math.max(0, Math.round(baseItemPrice * (1 - discountRate)));
      }
    } else {
      paidForPdf = fallbackPdfPrice;
    }
  } catch (err) {
    console.error('[orderController] Error calculating historical PDF price:', err);
    paidForPdf = fallbackPdfPrice;
  }

  const wordPrice = Number(wordFmt.price || 0);
  const offsetAmount = Math.min(paidForPdf, wordPrice);
  const amountToPay = Math.max(0, wordPrice - offsetAmount);

  return {
    eligible: true,
    code: 'ELIGIBLE',
    message: 'Đủ điều kiện nâng cấp định dạng Word chỉ cần bù tiền chênh lệch.',
    formatFrom: 'PDF',
    formatTo: 'Word',
    paidAmount: paidForPdf,
    wordPrice,
    offsetAmount,
    amountToPay,
    matchedProduct: dbProd,
  };
}

/**
 * Tra cứu số tiền thực tế khách hàng đã thanh toán cho một tài liệu cụ thể trong lịch sử đơn hàng
 */
export async function getHistoricalPaidAmount(
  userId: string,
  userEmail: string,
  prodSlugOrId: string,
  formatCode: UiFormatCode,
  fallbackPrice: number
): Promise<number> {
  const cleanSlug = String(prodSlugOrId || '').toLowerCase().trim();
  try {
    const [userOrders, allProducts] = await Promise.all([
      dbService.getUserOrders(userId, userEmail),
      dbService.getProducts(),
    ]);
    const prod = allProducts.find(
      (p) => String(p.id).toLowerCase().trim() === cleanSlug || String(p.slug).toLowerCase().trim() === cleanSlug
    );
    const targetSlug = prod ? String(prod.slug).toLowerCase().trim() : cleanSlug;
    const targetId = prod ? String(prod.id).toLowerCase().trim() : cleanSlug;

    const matchedOrder = userOrders.find(
      (o) =>
        o.payment_status === 'paid' &&
        Array.isArray(o.items) &&
        o.items.some((it) => {
          const itKey = (it.product_id || '').toLowerCase().trim();
          const itTitle = (it.product_title || '').trim().toLowerCase();
          return (
            (itKey === targetSlug ||
              itKey === targetId ||
              itTitle === targetSlug ||
              (prod && itTitle === prod.title.toLowerCase().trim())) &&
            it.format_code === formatCode
          );
        })
    );

    if (matchedOrder && Array.isArray(matchedOrder.items)) {
      const orderItem = matchedOrder.items.find((it) => {
        const itKey = (it.product_id || '').toLowerCase().trim();
        const itTitle = (it.product_title || '').trim().toLowerCase();
        return (
          (itKey === targetSlug ||
            itKey === targetId ||
            itTitle === targetSlug ||
            (prod && itTitle === prod.title.toLowerCase().trim())) &&
          it.format_code === formatCode
        );
      });
      const baseItemPrice = orderItem ? Number(orderItem.unit_price) : fallbackPrice;

      const actualOrderPaid =
        typeof matchedOrder.final_amount === 'number'
          ? matchedOrder.final_amount
          : typeof matchedOrder.total_amount === 'number'
          ? matchedOrder.total_amount
          : -1;

      // Nếu đơn hàng chỉ có duy nhất 1 sản phẩm, lấy trực tiếp số tiền thực tế khách đã trả (loại bỏ hoàn toàn sai số làm tròn %)
      if (matchedOrder.items.length === 1 && actualOrderPaid >= 0) {
        return actualOrderPaid;
      }

      let discountRate = 0;
      const subtotal = Number(matchedOrder.subtotal_amount || 0);
      const totalPaid = actualOrderPaid >= 0 ? actualOrderPaid : Number(matchedOrder.total_amount || 0);
      const discountAmt =
        typeof matchedOrder.discount_amount === 'number' && matchedOrder.discount_amount > 0
          ? matchedOrder.discount_amount
          : subtotal > totalPaid && totalPaid > 0
          ? subtotal - totalPaid
          : 0;

      // Ưu tiên tính từ discount_amount / subtotal_amount để đảm bảo độ chính xác toán học tuyệt đối
      if (discountAmt > 0 && subtotal > 0) {
        discountRate = discountAmt / subtotal;
      } else if (
        typeof matchedOrder.discount_percent === 'number' &&
        matchedOrder.discount_percent > 0
      ) {
        discountRate = matchedOrder.discount_percent / 100;
      }
      return Math.max(0, Math.round(baseItemPrice * (1 - discountRate)));
    }
  } catch (err) {
    console.error('[orderController] Error calculating historical price:', err);
  }
  return fallbackPrice;
}

export const orderController = {
  /**
   * POST /api/orders
   * Tạo đơn hàng mới từ Giỏ hàng hoặc Mua ngay:
   * - Kiểm tra xác thực Gmail 2 lần (Double Email Verification)
   * - Kiểm tra quy tắc BẮT BUỘC ĐỒNG NHẤT 1 ĐỊNH DẠNG (Single-Format Checkout Rule)
   * - Tự động tính chiết khấu Combo từ bảng `combo_rules`
   * - Lưu đơn hàng vào Database qua Backend và trả về thông tin VietQR (SePay) hoặc PayPal
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const {
        customerName,
        customerEmail,
        customerEmailConfirm,
        customerPhone,
        customerGroup,
        needInvoice,
        invoiceTaxOrCccd,
        invoiceAddress,
        flashcardQuantity,
        paymentMethod,
        consentOrderProcessing,
        consentMarketingEmails,
        items,
      } = req.body;

      // 0. Kiểm tra đồng ý xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP (PDPD)
      if (consentOrderProcessing !== true) {
        res.status(400).json({
          ok: false,
          error: 'Bạn cần đồng ý để Hộ kinh doanh Huy Crecom xử lý thông tin cá nhân cho mục đích xử lý và giao đơn hàng này.',
        });
        return;
      }
      // 1. Kiểm tra thông tin khách hàng cơ bản
      if (!customerName || String(customerName).trim().length < 2) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng nhập đầy đủ Họ và tên khách hàng.',
        });
        return;
      }

      const email1 = String(customerEmail || '').trim().toLowerCase();
      const email2 = String(customerEmailConfirm || '').trim().toLowerCase();
      const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

      if (!email1 || !gmailRegex.test(email1)) {
        res.status(400).json({
          ok: false,
          error: 'Địa chỉ Gmail nhận tài liệu không hợp lệ (bắt buộc sử dụng định dạng @gmail.com).',
        });
        return;
      }

      if (!email2 || !gmailRegex.test(email2)) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng xác nhận lại địa chỉ Gmail lần 2 đúng định dạng @gmail.com.',
        });
        return;
      }

      if (email1 !== email2) {
        res.status(400).json({
          ok: false,
          error: 'Gmail xác nhận lần 2 không khớp. Vui lòng kiểm tra kỹ để tránh thất lạc tài liệu.',
        });
        return;
      }

      // Kiểm tra bắt buộc mục "Bạn là..." (Đối tượng khách hàng - 6 đối tượng chuẩn Google Form)
      const rawCustomerGroup = String(customerGroup || '').trim();
      if (!(GOOGLE_FORM_CUSTOMER_GROUPS as readonly string[]).includes(rawCustomerGroup)) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng chọn mục "Bạn là..." hợp lệ trước khi thanh toán.',
        });
        return;
      }
      const normalizedGroup = rawCustomerGroup as (typeof GOOGLE_FORM_CUSTOMER_GROUPS)[number];

      // 2. Kiểm tra danh sách sản phẩm và Quy tắc Single-Format Checkout
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({
          ok: false,
          error: 'Đơn hàng phải có ít nhất 1 tài liệu được chọn.',
        });
        return;
      }

      const distinctFormats = Array.from(
        new Set(items.map((it: any) => String(it.formatCode || it.format_code || '').trim()))
      );

      if (distinctFormats.length !== 1) {
        res.status(400).json({
          ok: false,
          error:
            'Quy tắc thanh toán: Mỗi đơn hàng chỉ được phép thanh toán cho 1 định dạng duy nhất (ví dụ: tất cả cùng là Word hoặc tất cả cùng là PDF). Vui lòng bỏ tích các sản phẩm khác định dạng trong giỏ hàng.',
        });
        return;
      }

      const selectedFormatRaw = distinctFormats[0];
      if (!isValidUiFormat(selectedFormatRaw)) {
        res.status(400).json({
          ok: false,
          error: `Định dạng "${selectedFormatRaw}" không hợp lệ. Chỉ chấp nhận: Word, PDF, Flashcard, Trang tính, Thiết kế.`,
        });
        return;
      }
      const selectedFormat: UiFormatCode = selectedFormatRaw;

      // 2.1 Quy tắc đơn hàng: Trừ định dạng Flashcard, mỗi tài liệu chỉ được phép đặt số lượng đúng bằng 1 và không trùng lặp
      if (selectedFormat !== 'Flashcard') {
        const seenKeys = new Set<string>();
        for (const item of items) {
          const qty = Number(item?.quantity || 1);
          if (qty !== 1) {
            res.status(400).json({
              ok: false,
              error:
                'Quy tắc đặt hàng: Trừ định dạng Flashcard, mỗi tài liệu chỉ được phép đặt số lượng đúng bằng 1. Vui lòng kiểm tra lại giỏ hàng.',
            });
            return;
          }
          const pKey = String(item?.productId || item?.slug || item?.code || '').toLowerCase().trim();
          if (pKey && seenKeys.has(pKey)) {
            res.status(400).json({
              ok: false,
              error:
                'Quy tắc đặt hàng: Đơn hàng có tài liệu bị trùng lặp. Vui lòng kiểm tra lại giỏ hàng.',
            });
            return;
          }
          if (pKey) seenKeys.add(pKey);
        }
      }

      // 3. Tra cứu cấu hình hệ thống (kiểm tra bật/tắt Xuất hóa đơn VAT), giá gốc sản phẩm, quy tắc Combo và Tủ sách
      const [allProducts, comboRules, siteConfigs] = await Promise.all([
        dbService.getProducts({ includeInactive: true }),
        dbService.getComboRules(),
        dbService.getSiteConfigs(),
      ]);

      // 2.2 Quy tắc phân định sở hữu và nâng cấp định dạng (PDF -> Word Upgrade Rule) trên từng tài liệu
      let userLibrary: Awaited<ReturnType<typeof dbService.getUserLibrary>> = [];

      if (req.user && req.user.id) {
        userLibrary = await dbService.getUserLibrary(req.user.id);

        for (const item of items) {
          const rawSlugOrId = String(item?.productId || item?.slug || item?.code || '').toLowerCase().trim();
          const dbProd = allProducts.find(
            (p) =>
              p.id.toLowerCase() === rawSlugOrId ||
              p.slug.toLowerCase() === rawSlugOrId ||
              p.code.toLowerCase() === rawSlugOrId
          );
          const itemTitle = dbProd?.title || item?.productTitle || '';

          // Tình huống 1: Khách hàng chọn mua PDF
          if (selectedFormat === 'PDF') {
            const ownsWord = userLibrary.some(
              (lib) =>
                ((lib.product_slug || '').toLowerCase().trim() === rawSlugOrId ||
                  (dbProd && (lib.product_slug || '').toLowerCase().trim() === dbProd.slug.toLowerCase()) ||
                  lib.id === rawSlugOrId) &&
                lib.format_code === 'Word' &&
                lib.is_active
            );
            if (ownsWord) {
              res.status(400).json({
                ok: false,
                error: `Bạn đã sở hữu định dạng Word của tài liệu "${itemTitle || 'này'}", không cần mua thêm bản PDF vì nội dung chúng là giống nhau.`,
              });
              return;
            }

            const ownsPdf = userLibrary.some(
              (lib) =>
                ((lib.product_slug || '').toLowerCase().trim() === rawSlugOrId ||
                  (dbProd && (lib.product_slug || '').toLowerCase().trim() === dbProd.slug.toLowerCase()) ||
                  lib.id === rawSlugOrId) &&
                lib.format_code === 'PDF' &&
                lib.is_active
            );
            if (ownsPdf) {
              res.status(400).json({
                ok: false,
                error: `Bạn đã sở hữu tài liệu "${itemTitle || 'này'}" ở định dạng PDF trong Tủ sách cá nhân. Không thể thanh toán lại.`,
              });
              return;
            }
          } else if (selectedFormat === 'Word') {
            // Tình huống 2: Khách hàng chọn mua Word
            const ownsWord = userLibrary.some(
              (lib) =>
                ((lib.product_slug || '').toLowerCase().trim() === rawSlugOrId ||
                  (dbProd && (lib.product_slug || '').toLowerCase().trim() === dbProd.slug.toLowerCase()) ||
                  lib.id === rawSlugOrId) &&
                lib.format_code === 'Word' &&
                lib.is_active
            );
            if (ownsWord) {
              res.status(400).json({
                ok: false,
                error: `Bạn đã sở hữu tài liệu "${itemTitle || 'này'}" ở định dạng Word trong Tủ sách cá nhân. Không thể thanh toán lại.`,
              });
              return;
            }
            // Nếu đã có PDF -> Không chặn, sẽ kích hoạt khấu trừ nâng cấp bù tiền ở bước tính giá!
          } else {
            // Tình huống 3: Các định dạng khác (Flashcard, Trang tính, Thiết kế)
            const ownsSame = userLibrary.some(
              (lib) =>
                ((lib.product_slug || '').toLowerCase().trim() === rawSlugOrId ||
                  (dbProd && (lib.product_slug || '').toLowerCase().trim() === dbProd.slug.toLowerCase()) ||
                  lib.id === rawSlugOrId) &&
                lib.format_code === selectedFormat &&
                lib.is_active
            );
            if (ownsSame) {
              res.status(400).json({
                ok: false,
                error: `Bạn đã sở hữu tài liệu "${itemTitle || 'này'}" ở định dạng ${selectedFormat} trong Tủ sách cá nhân. Không thể thanh toán lại.`,
              });
              return;
            }
          }
        }
      }

      const isVatInvoiceEnabled = Boolean((siteConfigs as any)?.checkout_config?.enable_vat_invoice);
      const isInvoiceRequested = isVatInvoiceEnabled && Boolean(needInvoice);
      if (isInvoiceRequested) {
        if (!invoiceTaxOrCccd || !invoiceAddress) {
          res.status(400).json({
            ok: false,
            error: 'Vui lòng nhập đầy đủ MST/CCCD và Địa chỉ xuất hóa đơn khi tích chọn Xuất hóa đơn.',
          });
          return;
        }
      }

      const resolvedItems: SeedOrderItem[] = [];
      let subtotalAmount = 0;
      let totalEligibleBooks = 0;

      for (const rawItem of items) {
        const slugOrId = String(rawItem.productId || rawItem.slug || rawItem.code || '');
        const qty =
          selectedFormat === 'Flashcard' && flashcardQuantity
            ? Math.max(1, Number(flashcardQuantity))
            : Math.max(1, Number(rawItem.quantity || 1));
        const dbProd = allProducts.find(
          (p) => p.id === slugOrId || p.slug === slugOrId || p.code === slugOrId
        );

        // SEC-06: Chặn đứng thao túng giá từ client - Bắt buộc sản phẩm và định dạng phải tồn tại trong DB
        if (!dbProd) {
          res.status(400).json({
            ok: false,
            error: `Sản phẩm với mã/slug "${slugOrId}" không tồn tại trên hệ thống.`,
          });
          return;
        }

        const fmtObj = dbProd.formats.find((f: SeedProductFormat) => f.format_code === selectedFormat);
        if (!fmtObj || typeof fmtObj.price !== 'number' || fmtObj.price <= 0) {
          res.status(400).json({
            ok: false,
            error: `Sản phẩm "${dbProd.title}" không hỗ trợ định dạng "${selectedFormat}".`,
          });
          return;
        }

        const unitPrice = fmtObj.price;
        const lineSubtotal = unitPrice * qty;

        subtotalAmount += lineSubtotal;
        if (dbProd.is_combo_eligible) {
          totalEligibleBooks += qty;
        }

        resolvedItems.push({
          product_id: dbProd?.id || slugOrId,
          product_title: dbProd?.title || rawItem.productTitle || 'Tài liệu Huy Tutor',
          google_form_product_name:
            dbProd?.google_form_product_name ||
            dbProd?.title ||
            rawItem.productTitle ||
            'Tài liệu Huy Tutor',
          format_code: selectedFormat,
          unit_price: unitPrice,
          quantity: qty,
          subtotal: lineSubtotal,
        });
      }

      let discountPercent = 0;
      let discountAmount = 0;
      let totalAmount = 0;

      // 3.1 Đánh giá Gói Combo tối ưu nhất và Khấu trừ tài liệu đã sở hữu
      const comboBlocks = (siteConfigs as any)?.combo_page_blocks || [];
      const pkgBlock = comboBlocks.find((b: any) => b.type === 'combo_packages');
      const comboPackages: any[] = (pkgBlock?.config?.packages || []) as any[];

      const userId = req.user?.id || '';
      const orderProductKeys = new Set(
        resolvedItems.flatMap((it) => {
          const dbP = allProducts.find((p) => p.id === it.product_id || p.slug === it.product_id);
          return [
            String(it.product_id || '').toLowerCase().trim(),
            dbP ? String(dbP.id).toLowerCase().trim() : '',
            dbP ? String(dbP.slug).toLowerCase().trim() : '',
          ].filter(Boolean);
        })
      );

      const resolveProductKeys = (prodIdOrSlug: string) => {
        const clean = String(prodIdOrSlug || '').toLowerCase().trim();
        const prod = allProducts.find(
          (p) => String(p.id).toLowerCase().trim() === clean || String(p.slug).toLowerCase().trim() === clean
        );
        return {
          id: prod ? String(prod.id).toLowerCase().trim() : clean,
          slug: prod ? String(prod.slug).toLowerCase().trim() : clean,
        };
      };

      const isOwnedSameFormat = (prodIdOrSlug: string): boolean => {
        const { id, slug } = resolveProductKeys(prodIdOrSlug);
        return userLibrary.some(
          (lib) =>
            lib.is_active &&
            lib.format_code === selectedFormat &&
            (String(lib.product_slug || '').toLowerCase().trim() === slug ||
              String(lib.product_slug || '').toLowerCase().trim() === id ||
              String(lib.id || '').toLowerCase().trim() === id)
        );
      };

      const isOwnedPdfForWordUpgrade = (prodIdOrSlug: string): boolean => {
        if (selectedFormat !== 'Word') return false;
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

      interface CandidateCombo {
        pkg: any;
        comboPrice: number;
        totalOriginalPrice: number;
        comboDiscountAmount: number;
        discountPercent: number;
        pkgProductIds: string[];
        cartProductIds: string[];
        ownedOffsetAmount: number;
        comboPayable: number;
        extraItemsPayable: number;
        totalPayable: number;
      }

      const candidateCombos: CandidateCombo[] = [];

      for (const pkg of comboPackages) {
        const pkgProductIds: string[] = Array.isArray(pkg.product_ids) ? pkg.product_ids : [];
        if (pkgProductIds.length === 0) continue;

        const pricings: any[] = Array.isArray(pkg.format_pricings) ? pkg.format_pricings : [];
        const formatPricing = pricings.find((fp: any) => fp.format_code === selectedFormat && fp.is_enabled);

        let comboPrice = 0;
        if (formatPricing && typeof formatPricing.combo_price === 'number' && formatPricing.combo_price > 0) {
          comboPrice = formatPricing.combo_price;
        } else {
          const badgeFormat = (pkg.format_badge || '').toLowerCase().includes('pdf') ? 'PDF' : 'Word';
          if (badgeFormat === selectedFormat) {
            const match = (pkg.discount_badge || '').match(/(\d+)\s*%/);
            const discountPct = match ? parseInt(match[1], 10) : 0;
            const pkgProds = allProducts.filter(
              (p) => pkgProductIds.includes(p.id) || pkgProductIds.includes(p.slug)
            );
            const sumOrig = pkgProds.reduce((sum, p) => {
              const fmt = p.formats?.find((f: any) => f.format_code === selectedFormat && f.is_active);
              return sum + (fmt ? Number(fmt.price || 0) : 0);
            }, 0);
            comboPrice = discountPct > 0 ? Math.round((sumOrig * (100 - discountPct)) / 100) : sumOrig;
          }
        }

        if (comboPrice <= 0) continue;

        let allAccountedFor = true;
        const cartProductIds: string[] = [];
        let ownedOffsetAmount = 0;

        for (const prodKey of pkgProductIds) {
          const cleanKey = String(prodKey).toLowerCase().trim();
          const inOrder = orderProductKeys.has(cleanKey);
          const dbProd = allProducts.find(
            (p) =>
              String(p.id).toLowerCase().trim() === cleanKey ||
              String(p.slug).toLowerCase().trim() === cleanKey
          );
          const fmtObj = dbProd?.formats?.find((f: any) => f.format_code === selectedFormat);
          const retailPrice = fmtObj ? Number(fmtObj.price || 0) : 0;
          const pdfFmt = dbProd?.formats?.find((f: any) => f.format_code === 'PDF');
          const pdfRetailPrice = pdfFmt ? Number(pdfFmt.price || 0) : 0;

          if (inOrder) {
            cartProductIds.push(prodKey);
            if (selectedFormat === 'Word' && isOwnedPdfForWordUpgrade(prodKey)) {
              const paidPdf = await getHistoricalPaidAmount(userId, email1, prodKey, 'PDF', pdfRetailPrice);
              ownedOffsetAmount += Math.min(paidPdf, retailPrice);
            }
          } else if (isOwnedSameFormat(prodKey)) {
            const paidSame = await getHistoricalPaidAmount(userId, email1, prodKey, selectedFormat, retailPrice);
            ownedOffsetAmount += Math.min(paidSame, retailPrice);
          } else {
            allAccountedFor = false;
            break;
          }
        }

        if (!allAccountedFor || cartProductIds.length === 0) continue;

        const pkgProds = allProducts.filter(
          (p) => pkgProductIds.includes(p.id) || pkgProductIds.includes(p.slug)
        );
        const totalOriginalPrice = pkgProds.reduce((sum, p) => {
          const fmt = p.formats?.find((f: any) => f.format_code === selectedFormat && f.is_active);
          return sum + (fmt ? Number(fmt.price || 0) : 0);
        }, 0);
        const comboDiscountAmount = Math.max(0, totalOriginalPrice - comboPrice);
        const discountPercent =
          totalOriginalPrice > 0 ? Math.round((comboDiscountAmount / totalOriginalPrice) * 100) : 0;

        const missingProds = pkgProds.filter((p) => {
          const cleanId = String(p.id).toLowerCase().trim();
          const cleanSlug = String(p.slug).toLowerCase().trim();
          return !pkgProductIds.some((oid) => {
            const { id, slug } = resolveProductKeys(oid);
            return isOwnedSameFormat(oid) && (slug === cleanSlug || id === cleanId);
          });
        });
        const missingRetailSum = missingProds.reduce((sum, p) => {
          const fmt = p.formats?.find((f: any) => f.format_code === selectedFormat && f.is_active);
          return sum + (fmt ? Number(fmt.price || 0) : 0);
        }, 0);

        const discountedComboPayable = comboPrice - ownedOffsetAmount;
        let comboPayable = 0;
        if (discountedComboPayable > 0) {
          comboPayable = missingRetailSum > 0 ? Math.min(missingRetailSum, discountedComboPayable) : discountedComboPayable;
        } else {
          comboPayable = missingRetailSum > 0 ? missingRetailSum : 0;
        }

        // Các tài liệu ngoài combo (nếu có): Tính giá lẻ hoặc nâng cấp PDF -> Word lẻ
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

        let extraItemsPayable = 0;
        for (const item of resolvedItems) {
          const itId = String(item.product_id || '').toLowerCase().trim();
          const isPartOfCombo = comboKeySet.has(itId);
          if (!isPartOfCombo) {
            const isUpgrade = selectedFormat === 'Word' && isOwnedPdfForWordUpgrade(itId);
            if (isUpgrade) {
              const dbProd = allProducts.find((p) => p.id === itId || p.slug === itId);
              const pdfFmt = dbProd?.formats?.find((f: any) => f.format_code === 'PDF');
              const pdfRetailPrice = pdfFmt ? Number(pdfFmt.price || 0) : 0;
              const paidPdf = await getHistoricalPaidAmount(userId, email1, itId, 'PDF', pdfRetailPrice);
              const upgradeOffset = Math.min(paidPdf, item.unit_price);
              extraItemsPayable += Math.max(0, item.unit_price - upgradeOffset) * item.quantity;
            } else {
              extraItemsPayable += item.unit_price * item.quantity;
            }
          }
        }

        const totalPayable = comboPayable + extraItemsPayable;

        candidateCombos.push({
          pkg,
          comboPrice,
          totalOriginalPrice,
          comboDiscountAmount,
          discountPercent,
          pkgProductIds,
          cartProductIds,
          ownedOffsetAmount,
          comboPayable,
          extraItemsPayable,
          totalPayable,
        });
      }

      if (candidateCombos.length > 0) {
        candidateCombos.sort((a, b) => {
          if (b.pkgProductIds.length !== a.pkgProductIds.length) {
            return b.pkgProductIds.length - a.pkgProductIds.length;
          }
          if (b.cartProductIds.length !== a.cartProductIds.length) {
            return b.cartProductIds.length - a.cartProductIds.length;
          }
          return a.totalPayable - b.totalPayable;
        });

        const best = candidateCombos[0];
        totalAmount = Math.max(0, best.totalPayable);
        discountAmount = Math.max(0, subtotalAmount - totalAmount);
        discountPercent = subtotalAmount > 0 ? Math.round((discountAmount / subtotalAmount) * 100) : 0;
      } else {
        // Không khớp gói Combo nào -> Tính theo giá lẻ / nâng cấp đơn lẻ
        let runningTotal = 0;
        for (const item of resolvedItems) {
          const itId = String(item.product_id || '').toLowerCase().trim();
          const isUpgrade = selectedFormat === 'Word' && isOwnedPdfForWordUpgrade(itId);
          if (isUpgrade) {
            const dbProd = allProducts.find((p) => p.id === itId || p.slug === itId);
            const pdfFmt = dbProd?.formats?.find((f: any) => f.format_code === 'PDF');
            const pdfRetailPrice = pdfFmt ? Number(pdfFmt.price || 0) : 0;
            const paidPdf = await getHistoricalPaidAmount(userId, email1, itId, 'PDF', pdfRetailPrice);
            const upgradeOffset = Math.min(paidPdf, item.unit_price);
            runningTotal += Math.max(0, item.unit_price - upgradeOffset) * item.quantity;
          } else {
            runningTotal += item.unit_price * item.quantity;
          }
        }

        // Áp dụng comboRules (chiết khấu số lượng sách đủ điều kiện) nếu không có gói cố định
        let legacyDiscountPercent = 0;
        for (const rule of comboRules) {
          if (totalEligibleBooks >= rule.min_quantity && rule.discount_percent > legacyDiscountPercent) {
            legacyDiscountPercent = rule.discount_percent;
          }
        }
        if (legacyDiscountPercent > 0) {
          discountPercent = legacyDiscountPercent;
          const legacyDiscountAmt = Math.round((runningTotal * legacyDiscountPercent) / 100);
          totalAmount = Math.max(0, runningTotal - legacyDiscountAmt);
          discountAmount = Math.max(0, subtotalAmount - totalAmount);
        } else {
          totalAmount = Math.max(0, runningTotal);
          discountAmount = Math.max(0, subtotalAmount - totalAmount);
          discountPercent = subtotalAmount > 0 ? Math.round((discountAmount / subtotalAmount) * 100) : 0;
        }
      }

      const now = new Date();
      const MM = String(now.getMonth() + 1).padStart(2, '0');
      const YY = String(now.getFullYear()).slice(-2);
      const DD = String(now.getDate()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      const prefix = process.env.ORDER_CODE_PREFIX || 'DH';
      const orderCode = `${prefix}${MM}${YY}${DD}${ss}${mm}${ms}`;
      const viewToken = crypto.randomBytes(16).toString('hex');

      const isVietnam = req.clientCountry === 'VN';

      // KIỂM SOÁT BẢO MẬT: Người dùng tại Việt Nam BẮT BUỘC thanh toán qua VietQR, chặn đứng PayPal
      if (isVietnam && paymentMethod === 'paypal') {
        res.status(400).json({
          ok: false,
          error: 'Khách hàng tại Việt Nam bắt buộc thanh toán qua VietQR ngân hàng. Cổng PayPal chỉ hỗ trợ cho khách hàng ở nước ngoài.',
        });
        return;
      }

      // Khách hàng ở nước ngoài: được chọn 'paypal' hoặc 'sepay'. Khách tại VN: luôn là 'sepay'.
      const chosenGateway: 'sepay' | 'paypal' =
        !isVietnam && paymentMethod === 'paypal' ? 'paypal' : 'sepay';

      const newOrder: SeedOrder = {
        id: `ord-${Date.now()}`,
        user_id: req.user?.id || null,
        order_code: orderCode,
        customer_name: String(customerName).trim(),
        customer_email: email1,
        customer_phone: String(customerPhone || '').trim(),
        customer_group: normalizedGroup,
        selected_format: selectedFormat,
        flashcard_quantity:
          selectedFormat === 'Flashcard'
            ? Math.max(1, Number(resolvedItems[0]?.quantity || flashcardQuantity || 1))
            : null,
        need_invoice: isInvoiceRequested,
        invoice_tax_or_cccd: isInvoiceRequested ? String(invoiceTaxOrCccd).trim() : '',
        invoice_address: isInvoiceRequested ? String(invoiceAddress).trim() : '',
        subtotal_amount: subtotalAmount,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        payment_method: chosenGateway,
        payment_status: 'pending',
        view_token: viewToken,
        google_form_submitted: false,
        consent_order_processing: true,
        consent_marketing_emails: Boolean(consentMarketingEmails),
        consent_timestamp: new Date().toISOString(),
        consent_policy_version: 'v1.0',
        client_ip: req.clientIp || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
        client_user_agent: String(req.headers['user-agent'] || ''),
        created_at: new Date().toISOString(),
        items: resolvedItems,
      };

      const savedOrder = await dbService.createOrder(newOrder);
      const paymentInstruction = buildPaymentInstruction(savedOrder);

      res.status(201).json({
        ok: true,
        order: savedOrder,
        mappedGoogleFormNote: mapFormatToGoogleFormNote(selectedFormat),
        paymentInstruction,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi khởi tạo đơn hàng tại Backend.',
      });
    }
  },

  /**
   * GET /api/orders/:orderCode
   * Kiểm tra trạng thái đơn hàng theo thời gian thực
   */
  async getOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const orderCode = String(req.params.orderCode || '');
      const order = await dbService.getOrderByCode(orderCode);
      if (!order) {
        res.status(404).json({
          ok: false,
          error: `Không tìm thấy đơn hàng mã "${orderCode}".`,
        });
        return;
      }

      // SEC-05: Chống IDOR & Rò rỉ thông tin cá nhân khách hàng (PII)
      const incomingToken = String(req.query.token || '').trim();
      const isAuthorized =
        Boolean(order.view_token && incomingToken && incomingToken === order.view_token) ||
        Boolean(req.user && order.user_id && req.user.id === order.user_id) ||
        Boolean(req.user && req.user.role === 'admin');

      const safeOrder = isAuthorized
        ? order
        : {
            order_code: order.order_code,
            payment_status: order.payment_status,
            payment_method: order.payment_method,
            total_amount: order.total_amount,
            subtotal_amount: order.subtotal_amount,
            discount_amount: order.discount_amount,
            selected_format: order.selected_format,
            created_at: order.created_at,
            customer_name: order.customer_name ? `${order.customer_name.slice(0, 2)}***` : '',
            customer_email: order.customer_email
              ? order.customer_email.replace(/(.{2})(.*)(?=@)/, '$1***')
              : '',
            customer_phone: order.customer_phone
              ? `*******${order.customer_phone.slice(-3)}`
              : '',
            items: (order.items || []).map((it) => ({
              product_title: it.product_title,
              format_code: it.format_code,
              quantity: it.quantity,
              unit_price: it.unit_price,
              subtotal: it.subtotal,
            })),
          };

      res.json({
        ok: true,
        order: safeOrder,
        mappedGoogleFormNote: mapFormatToGoogleFormNote(order.selected_format),
        paymentInstruction: buildPaymentInstruction(order),
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tra cứu đơn hàng.',
      });
    }
  },

  /**
   * GET /api/orders/upgrade-quote
   * Báo giá nâng cấp định dạng (PDF -> Word chỉ bù tiền chênh lệch)
   */
  async getUpgradeQuote(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({
          ok: false,
          error: 'Vui lòng đăng nhập để kiểm tra quyền lợi nâng cấp định dạng.',
        });
        return;
      }

      const slug = String(req.query.slug || req.query.productId || '').trim();
      if (!slug) {
        res.status(400).json({
          ok: false,
          error: 'Thiếu tham số slug hoặc productId.',
        });
        return;
      }

      const allProducts = await dbService.getProducts({ includeInactive: true });
      const quote = await calculateUpgradeForUser(req.user.id, req.user.email, slug, allProducts);

      res.json({
        ok: true,
        quote,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi kiểm tra báo giá nâng cấp định dạng.',
      });
    }
  },
};
