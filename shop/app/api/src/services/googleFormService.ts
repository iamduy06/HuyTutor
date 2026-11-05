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
 * Danh sách nhóm khách hàng định sẵn chuẩn (giữ nguyên theo nghiệp vụ hệ thống & Google Form).
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
 * Danh sách các định dạng ghi chú chuẩn (giữ nguyên theo nghiệp vụ hệ thống & Google Form).
 */
export const GOOGLE_FORM_FORMAT_NOTES = [
  'Word dài',
  'PDF dài',
  'Flashcard',
  'Trang tính',
  'Thiết kế',
] as const;

// Bộ nhớ đệm danh sách tùy chọn sản phẩm lấy động từ Google Form (không hardcode danh sách sản phẩm)
let formOptionsCache: { [entryId: string]: string[] } | null = null;
let formOptionsCacheTime = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 giờ

/**
 * Đọc động các tùy chọn sản phẩm hiện tại từ Google Form trực tiếp qua URL viewform.
 * Tuyệt đối không hardcode danh sách sản phẩm tài liệu.
 */
export async function fetchDynamicFormOptions(
  formUrl: string
): Promise<{ [entryId: string]: string[] }> {
  const now = Date.now();
  if (formOptionsCache && now - formOptionsCacheTime < CACHE_TTL_MS) {
    return formOptionsCache;
  }

  try {
    const viewUrl = formUrl.replace(/\/formResponse.*$/, '/viewform');
    const res = await fetch(viewUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
    });

    if (res.ok) {
      const text = await res.text();
      const fbMatch = text.match(/var FB_PUBLIC_LOAD_DATA_ = (\[[\s\S]+?\]);\s*<\/script>/);
      if (fbMatch) {
        const data = JSON.parse(fbMatch[1]);
        const questions = data[1]?.[1] || [];
        const optionsMap: { [entryId: string]: string[] } = {};

        for (const q of questions) {
          const entryId = q[4]?.[0]?.[0];
          const opts = q[4]?.[0]?.[1]
            ? q[4][0][1].map((o: any) => o[0]).filter(Boolean)
            : [];
          if (entryId && opts.length > 0) {
            optionsMap[String(entryId)] = opts;
          }
        }

        formOptionsCache = optionsMap;
        formOptionsCacheTime = now;
        return optionsMap;
      }
    }
  } catch (err) {
    console.warn('[googleFormService] Không thể tải tùy chọn động từ Google Form, sử dụng chế độ fallback linh hoạt:', err);
  }

  return formOptionsCache || {};
}

/**
 * Tự động gửi dữ liệu đơn hàng đã thanh toán vào Google Form nội bộ (14 entry IDs).
 * Tên sản phẩm được lấy trực tiếp và linh hoạt từ:
 *   1. item.google_form_product_name (nhập trong Admin CMS khi thêm/sửa tài liệu)
 *   2. Tra cứu từ database (dbService.getProductBySlugOrId)
 *   3. item.product_title
 * Nhóm khách hàng được giữ nguyên theo danh mục chuẩn của hệ thống.
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

  // Lấy các tùy chọn thực tế từ Google Form động cho sản phẩm
  const dynamicOptions = await fetchDynamicFormOptions(formUrl);

  const submissions: GoogleFormSyncResult['submissions'] = [];
  let allSuccess = true;

  for (const item of order.items) {
    const netAmount = Math.round(item.subtotal * discountRatio);

    // Lấy tên sản phẩm chuẩn điền vào Google Forms từ cấu hình của tài liệu khi thêm sản phẩm
    let productName = (item.google_form_product_name || '').trim();
    if (!productName && item.product_id) {
      try {
        const prod = await dbService.getProductBySlugOrId(item.product_id);
        if (prod) {
          productName = (prod.google_form_product_name || prod.title || '').trim();
        }
      } catch {
        // Tiếp tục dùng fallback nếu tra cứu lỗi
      }
    }
    if (!productName) {
      productName = (item.product_title || 'Tài liệu').trim();
    }

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

    // 6. Tên sản phẩm chuẩn (Checkboxes - entry.2088729906)
    // So khớp động với tùy chọn hiện có của Google Form; nếu không khớp thì gửi kèm __other_option__
    const formProductOptions = dynamicOptions['2088729906'] || [];
    const matchedProduct = formProductOptions.find(
      (opt) => opt.toLowerCase() === productName.toLowerCase()
    );
    if (matchedProduct) {
      payloadRecord['entry.2088729906'] = matchedProduct;
    } else {
      payloadRecord['entry.2088729906'] = '__other_option__';
      payloadRecord['entry.2088729906.other_option_response'] = productName;
    }

    // 8. Ghi chú định dạng (Multiple choice - entry.906534887)
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

    // 10. Nhóm khách hàng (Multiple choice - entry.1680953650)
    // Giữ nguyên theo các nhóm chuẩn của hệ thống
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
