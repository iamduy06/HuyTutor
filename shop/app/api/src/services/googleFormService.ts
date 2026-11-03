import { mapFormatToGoogleFormNote, UiFormatCode } from '../constants/formatMapping';
import { dbService, SeedOrder } from './dbService';

export interface GoogleFormSyncResult {
  orderCode: string;
  allSuccess: boolean;
  submissions: Array<{
    productName: string;
    mappedFormatNote: string;
    httpStatus: number;
    isSuccess: boolean;
    payload: Record<string, string>;
    errorMessage?: string;
  }>;
}

/**
 * Tự động gửi dữ liệu đơn hàng đã thanh toán vào Google Form nội bộ (14 entry IDs)
 * Đảm bảo mapping chính xác:
 * - Word -> Word dài
 * - PDF -> PDF dài
 * - Flashcard -> Flashcard (kèm số lượng tài khoản ở entry.242891304)
 * - Trang tính -> Trang tính
 * - Thiết kế -> Thiết kế
 * - Địa chỉ & MST/CCCD chỉ điền khi need_invoice = true, ngược lại để trống ""
 * - Trừ điểm tích lũy & Đơn vị khác luôn để trống ""
 * - Người bán luôn là "Website"
 */
export async function submitOrderToGoogleForm(order: SeedOrder): Promise<GoogleFormSyncResult> {
  const formUrl = process.env.GOOGLE_FORM_ACTION_URL;
  if (!formUrl) {
    throw new Error('Missing required environment variable: GOOGLE_FORM_ACTION_URL');
  }
  const now = new Date();
  // Chuyển sang múi giờ Việt Nam (UTC+7)
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const saleDate = vnTime.toISOString().slice(0, 10); // YYYY-MM-DD
  const saleTime = vnTime.toISOString().slice(11, 16); // HH:mm

  const mappedNote = mapFormatToGoogleFormNote(order.selected_format as UiFormatCode);
  const discountRatio = 1 - (order.discount_percent || 0) / 100;

  const submissions: GoogleFormSyncResult['submissions'] = [];
  let allSuccess = true;

  for (const item of order.items) {
    const netAmount = Math.round(item.subtotal * discountRatio);
    const productName = item.google_form_product_name || item.product_title;

    const payloadRecord: Record<string, string> = {
      'entry.528749633': order.customer_name, // 1. Tên khách hàng
      'entry.598112260': saleDate, // 2. Ngày bán (YYYY-MM-DD)
      'entry.1044261621': saleTime, // 3. Giờ bán (HH:mm)
      'entry.681163783': order.need_invoice ? order.invoice_address || '' : '', // 4. Địa chỉ (chỉ khi xuất HĐ)
      'entry.575498379': order.need_invoice ? order.invoice_tax_or_cccd || '' : '', // 5. MST/CCCD (chỉ khi xuất HĐ)
      'entry.2088729906': productName, // 6. Sản phẩm
      'entry.801296064': String(netAmount), // 7. Số tiền thực thu
      'entry.906534887': mappedNote, // 8. Ghi chú (Word dài / PDF dài / Flashcard / Trang tính / Thiết kế)
      'entry.1610762805': order.customer_email, // 9. Gmail đã xác thực 2 lớp
      'entry.1680953650': order.customer_group, // 10. Nhóm khách hàng
      'entry.112780521': '', // 11. Trừ điểm tích lũy (luôn để trống)
      'entry.242891304':
        order.selected_format === 'Flashcard' && order.flashcard_quantity
          ? String(order.flashcard_quantity)
          : '', // 12. Số lượng (chỉ điền khi là Flashcard)
      'entry.317416358': '', // 13. Đơn vị khác (luôn để trống)
      'entry.118891792': 'Website', // 14. Người bán (luôn là Website)
    };

    const formBody = new URLSearchParams(payloadRecord);
    let httpStatus = 200;
    let isSuccess = true;
    let errorMessage: string | undefined;

    try {
      const response = await fetch(formUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody.toString(),
      });
      httpStatus = response.status;
      isSuccess = response.ok || response.status === 200 || response.status === 302;
    } catch (err: any) {
      httpStatus = 500;
      isSuccess = false;
      errorMessage = err?.message || 'Network error calling Google Form';
      allSuccess = false;
    }

    await dbService.logGoogleFormSubmission({
      order_id: order.id,
      order_code: order.order_code,
      product_name: productName,
      payload: payloadRecord,
      http_status: httpStatus,
      is_success: isSuccess,
      error_message: errorMessage,
    });

    submissions.push({
      productName,
      mappedFormatNote: mappedNote,
      httpStatus,
      isSuccess,
      payload: payloadRecord,
      errorMessage,
    });
  }

  if (allSuccess) {
    await dbService.updateOrderStatus(order.order_code, {
      google_form_submitted: true,
    });
  }

  return {
    orderCode: order.order_code,
    allSuccess,
    submissions,
  };
}
