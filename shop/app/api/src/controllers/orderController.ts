import crypto from 'crypto';
import { Request, Response } from 'express';
import { dbService, SeedOrder, SeedOrderItem, SeedProductFormat } from '../services/dbService';
import { isValidUiFormat, UiFormatCode, mapFormatToGoogleFormNote } from '../constants/formatMapping';
import { buildPaymentInstruction } from '../services/paymentService';

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
        items,
      } = req.body;

      // 1. Kiểm tra thông tin khách hàng cơ bản
      if (!customerName || String(customerName).trim().length < 2) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng nhập đầy đủ Họ và tên khách hàng.',
        });
        return;
      }

      const email1 = String(customerEmail || '').trim().toLowerCase();
      const email2 = String(customerEmailConfirm || customerEmail || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email1 || !emailRegex.test(email1)) {
        res.status(400).json({
          ok: false,
          error: 'Địa chỉ Gmail nhận tài liệu không hợp lệ.',
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

      // 2.1 Quy tắc đơn hàng: Trừ định dạng Flashcard, mỗi đơn hàng chỉ được phép đặt tối đa 1 sản phẩm với số lượng 1
      if (selectedFormat !== 'Flashcard') {
        if (items.length !== 1 || Number(items[0]?.quantity || 1) !== 1) {
          res.status(400).json({
            ok: false,
            error:
              'Quy tắc đặt hàng: Trừ định dạng Flashcard, mỗi đơn hàng chỉ được phép đặt tối đa 1 sản phẩm với số lượng 1. Vui lòng kiểm tra lại giỏ hàng.',
          });
          return;
        }
      }

      // 2.2 Quy tắc chống mua trùng lặp: Nếu khách đã đăng nhập, chặn thanh toán nếu đã sở hữu trong Tủ sách
      if (req.user && req.user.id) {
        const userLibrary = await dbService.getUserLibrary(req.user.id);
        const ownedItem = items.find((rawItem: any) => {
          const slugOrId = String(rawItem.productId || rawItem.slug || rawItem.code || '').toLowerCase().trim();
          const itemFmt = String(rawItem.formatCode || rawItem.format_code || selectedFormat).trim();
          return userLibrary.some(
            (lib) =>
              (lib.product_slug.toLowerCase() === slugOrId || lib.id === slugOrId) &&
              lib.format_code === itemFmt &&
              lib.is_active
          );
        });

        if (ownedItem) {
          res.status(400).json({
            ok: false,
            error: `Bạn đã sở hữu tài liệu "${ownedItem.title || ownedItem.productTitle || selectedFormat}" ở định dạng ${selectedFormat} trong Tủ sách cá nhân. Không thể thanh toán lại.`,
          });
          return;
        }
      }

      // 3. Kiểm tra điều kiện Xuất hóa đơn VAT
      const isInvoiceRequested = Boolean(needInvoice);
      if (isInvoiceRequested) {
        if (!invoiceTaxOrCccd || !invoiceAddress) {
          res.status(400).json({
            ok: false,
            error: 'Vui lòng nhập đầy đủ MST/CCCD và Địa chỉ xuất hóa đơn khi tích chọn Xuất hóa đơn.',
          });
          return;
        }
      }

      // 4. Tra cứu giá gốc chính thức từ Database ở Backend và tính Combo
      const [allProducts, comboRules] = await Promise.all([
        dbService.getProducts({ includeInactive: true }),
        dbService.getComboRules(),
      ]);

      const resolvedItems: SeedOrderItem[] = [];
      let subtotalAmount = 0;
      let totalEligibleBooks = 0;

      for (const rawItem of items) {
        const slugOrId = String(rawItem.productId || rawItem.slug || rawItem.code || '');
        const qty = Math.max(1, Number(rawItem.quantity || 1));
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

      // Tính chiết khấu Combo tự động theo số lượng sách đủ điều kiện
      let discountPercent = 0;
      for (const rule of comboRules) {
        if (totalEligibleBooks >= rule.min_quantity && rule.discount_percent > discountPercent) {
          discountPercent = rule.discount_percent;
        }
      }

      const discountAmount = Math.round((subtotalAmount * discountPercent) / 100);
      const totalAmount = Math.max(0, subtotalAmount - discountAmount);

      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const prefix = process.env.ORDER_CODE_PREFIX || 'DH';
      const orderCode = `${prefix}${randomDigits}`;
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

      const validGroups = ['Giáo viên', 'Học sinh', 'Phụ huynh', 'Khác'] as const;
      const normalizedGroup = validGroups.includes(customerGroup) ? customerGroup : 'Giáo viên';

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
            ? Math.max(1, Number(flashcardQuantity || resolvedItems[0]?.quantity || 1))
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
};
