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
 * Danh sách 25 sản phẩm có sẵn trong Google Form (Checkboxes).
 * Nếu tên sản phẩm không nằm trong danh sách này, hệ thống sẽ tự động gửi dưới dạng __other_option__.
 */
export const GOOGLE_FORM_PREDEFINED_PRODUCTS = [
  'Đọc điền - Đọc hiểu Tiếng Anh cơ bản | Lớp 6',
  'Đọc điền - Đọc hiểu Tiếng Anh cơ bản | Lớp 7',
  'Đọc điền - Đọc hiểu Tiếng Anh cơ bản | Lớp 8',
  'Đọc điền - Đọc hiểu Tiếng Anh cơ bản | Lớp 9',
  'Tuyển tập từ vựng chi tiết Tiếng Anh 10',
  'Tuyển tập từ vựng chi tiết Tiếng Anh 11',
  'Tuyển tập từ vựng chi tiết Tiếng Anh 12',
  'Đột phá đề thi THPTQG môn Tiếng Anh (30 đề)',
  'Thực chiến đề thi THPTQG môn Tiếng Anh theo chủ đề (30 đề)',
  'Bộ đề chuẩn cấu trúc – ôn luyện nước rút môn Tiếng Anh (30 đề)',
  'Bộ đề chốt hạ môn tiếng Anh (30 đề)',
  'Bộ đề thi thử ngôn ngữ Anh - ĐGNL BCA (30 đề)',
  'Sổ tay từ vựng tiếng Anh trọng tâm (B1-C2)',
  '1400 câu cụm động từ (Intermediate)',
  'Chuyên đề nền tảng tốt nghiệp THPT',
  'Chuyên đề điền từ quảng cáo - tờ rơi - thông báo',
  '2500 cụm từ cố định thông dụng',
  'Cấp quyền truy cập tài khoản vào hệ thống flashcard (gói 6 tháng)',
  'Cấp quyền truy cập tài khoản vào hệ thống flashcard (gói 1 năm)',
  'Cấp quyền truy cập tài khoản vào hệ thống flashcard (gói 2 năm)',
  'Cấp quyền truy cập tài khoản vào hệ thống flashcard (gói 3 năm)',
  'Cấp quyền truy cập nhóm flashcard tương ứng tài liệu đã mua',
  'Cấp quyền truy cập nhóm flashcard',
  'Mẫu thu học phí theo buổi',
  'Mẫu thu học phí theo tháng',
] as const;

/**
 * Danh sách các lựa chọn Nhóm khách hàng trong Google Form (Multiple Choice).
 */
export const GOOGLE_FORM_CUSTOMER_GROUPS = [
  'Giáo viên công lập',
  'Giáo viên ngoài công lập',
  'Gia sư',
  'Học sinh',
  'Phụ huynh',
  'Chủ trung tâm',
] as const;

/**
 * Danh sách các định dạng ghi chú trong Google Form (Multiple Choice).
 */
export const GOOGLE_FORM_FORMAT_NOTES = [
  'Word dài',
  'PDF dài',
  'Flashcard',
  'Trang tính',
  'Thiết kế',
] as const;

/**
 * Tự động gửi dữ liệu đơn hàng đã thanh toán vào Google Form nội bộ (14 entry IDs)
 * Tuân thủ tuyệt đối cấu trúc payload của Google Forms:
 * - Ngày mua hàng (Date): gửi đủ _year, _month, _day
 * - Thời gian thanh toán (Time): gửi đủ _hour, _minute
 * - Checkboxes (Tên sản phẩm): nếu không nằm trong danh sách định sẵn, gửi kèm __other_option__
 * - Multiple Choice (Nhóm khách, Ghi chú): nếu không nằm trong danh sách, gửi kèm __other_option__
 * - fvv: '1', pageHistory: '0'
 * - Địa chỉ & MST/CCCD chỉ điền khi need_invoice = true, ngược lại để trống ""
 * - Điểm khuyến mãi đã sử dụng & Đơn vị khác luôn để trống ""
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
  const year = vnTime.getUTCFullYear().toString();
  const month = (vnTime.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = vnTime.getUTCDate().toString().padStart(2, '0');
  const hour = vnTime.getUTCHours().toString().padStart(2, '0');
  const minute = vnTime.getUTCMinutes().toString().padStart(2, '0');
  const saleDate = `${year}-${month}-${day}`;
  const saleTime = `${hour}:${minute}`;

  const mappedNote = mapFormatToGoogleFormNote(order.selected_format as UiFormatCode);
  const discountRatio = 1 - (order.discount_percent || 0) / 100;

  const submissions: GoogleFormSyncResult['submissions'] = [];
  let allSuccess = true;

  for (const item of order.items) {
    const netAmount = Math.round(item.subtotal * discountRatio);
    const productName = (item.google_form_product_name || item.product_title || '').trim();

    const payloadRecord: Record<string, string> = {
      // 1. Tên khách hàng (Paragraph)
      'entry.528749633': order.customer_name || 'Khách hàng',

      // 2. Ngày mua hàng (Date - Google Form yêu cầu các field con _year, _month, _day)
      'entry.598112260_year': year,
      'entry.598112260_month': month,
      'entry.598112260_day': day,
      'entry.598112260': saleDate,

      // 3. Thời gian thanh toán (Time - Google Form yêu cầu các field con _hour, _minute)
      'entry.1044261621_hour': hour,
      'entry.1044261621_minute': minute,
      'entry.1044261621': saleTime,

      // 4. Địa chỉ (chỉ khi xuất HĐ)
      'entry.681163783': order.need_invoice ? order.invoice_address || '' : '',

      // 5. MST/CCCD (chỉ khi xuất HĐ)
      'entry.575498379': order.need_invoice ? order.invoice_tax_or_cccd || '' : '',

      // 7. Số tiền thực thu
      'entry.801296064': String(netAmount),

      // 9. Gmail đã xác thực 2 lớp
      'entry.1610762805': order.customer_email || '',

      // 11. Số lượng (chỉ điền khi là Flashcard)
      'entry.112780521':
        order.selected_format === 'Flashcard' && order.flashcard_quantity
          ? String(order.flashcard_quantity)
          : '',

      // 12. Điểm khuyến mãi đã sử dụng (luôn để trống)
      'entry.242891304': '',

      // 13. Đơn vị khác (luôn để trống)
      'entry.317416358': '',

      // 14. Người bán (luôn là Website)
      'entry.118891792': 'Website',

      // Form control fields
      fvv: '1',
      pageHistory: '0',
    };

    // 6. Sản phẩm (Checkboxes)
    const isPredefinedProd = GOOGLE_FORM_PREDEFINED_PRODUCTS.some(
      (p) => p.toLowerCase() === productName.toLowerCase()
    );
    if (isPredefinedProd) {
      const exactMatch = GOOGLE_FORM_PREDEFINED_PRODUCTS.find(
        (p) => p.toLowerCase() === productName.toLowerCase()
      )!;
      payloadRecord['entry.2088729906'] = exactMatch;
    } else {
      payloadRecord['entry.2088729906'] = '__other_option__';
      payloadRecord['entry.2088729906.other_option_response'] = productName;
    }

    // 8. Ghi chú (Multiple choice)
    const isPredefinedNote = GOOGLE_FORM_FORMAT_NOTES.some(
      (n) => n.toLowerCase() === mappedNote.toLowerCase()
    );
    if (isPredefinedNote) {
      const exactNote = GOOGLE_FORM_FORMAT_NOTES.find(
        (n) => n.toLowerCase() === mappedNote.toLowerCase()
      )!;
      payloadRecord['entry.906534887'] = exactNote;
    } else {
      payloadRecord['entry.906534887'] = '__other_option__';
      payloadRecord['entry.906534887.other_option_response'] = mappedNote;
    }

    // 10. Nhóm khách hàng (Multiple choice)
    const rawGroup = (order.customer_group || '').trim();
    let mappedGroup: string;
    if (rawGroup === 'Giáo viên' || rawGroup === 'Giáo viên công lập') {
      mappedGroup = 'Giáo viên công lập';
    } else if (rawGroup === 'Giáo viên ngoài công lập') {
      mappedGroup = 'Giáo viên ngoài công lập';
    } else if (rawGroup === 'Học sinh') {
      mappedGroup = 'Học sinh';
    } else if (rawGroup === 'Phụ huynh') {
      mappedGroup = 'Phụ huynh';
    } else if (rawGroup === 'Gia sư') {
      mappedGroup = 'Gia sư';
    } else if (rawGroup === 'Chủ trung tâm') {
      mappedGroup = 'Chủ trung tâm';
    } else {
      mappedGroup = rawGroup || 'Khác';
    }

    const isPredefinedGroup = GOOGLE_FORM_CUSTOMER_GROUPS.includes(mappedGroup as any);
    if (isPredefinedGroup) {
      payloadRecord['entry.1680953650'] = mappedGroup;
    } else {
      payloadRecord['entry.1680953650'] = '__other_option__';
      payloadRecord['entry.1680953650.other_option_response'] = mappedGroup;
    }

    const formBody = new URLSearchParams(payloadRecord);
    let httpStatus = 200;
    let isSuccess = true;
    let errorMessage: string | undefined;

    try {
      const response = await fetch(formUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        },
        body: formBody.toString(),
      });
      httpStatus = response.status;
      const htmlText = await response.text();

      const hasSuccessText =
        htmlText.includes('Hệ thống đã ghi lại câu trả lời') ||
        htmlText.includes('Câu trả lời của bạn đã được ghi lại') ||
        htmlText.includes('Your response has been recorded') ||
        htmlText.includes('freebirdFormviewerViewResponseConfirmationMessage');

      isSuccess =
        (response.ok || response.status === 200 || response.status === 302) &&
        (hasSuccessText || !htmlText.includes('freebirdFormviewerViewHeaderHeader'));

      if (!isSuccess) {
        errorMessage = `Google Form submission returned ${httpStatus} without confirmation.`;
        allSuccess = false;
      }
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
