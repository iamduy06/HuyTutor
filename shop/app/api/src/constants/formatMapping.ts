export const UI_FORMATS = ['Word', 'PDF', 'Flashcard', 'Trang tính', 'Thiết kế'] as const;
export type UIFormat = typeof UI_FORMATS[number];
export type UiFormatCode = UIFormat;

export const GOOGLE_FORM_NOTES = [
  'Word dài',
  'PDF dài',
  'Flashcard',
  'Trang tính',
  'Thiết kế'
] as const;
export type GoogleFormNote = typeof GOOGLE_FORM_NOTES[number];

export const CUSTOMER_GROUPS = [
  'Giáo viên',
  'Giáo viên công lập',
  'Giáo viên ngoài công lập',
  'Gia sư',
  'Học sinh',
  'Phụ huynh',
  'Chủ trung tâm',
  'Khác',
  'Other'
] as const;

export const FORM_ENTRIES = {
  customerName:       'entry.528749633',  // 1. Tên khách hàng (Bắt buộc)
  paymentDate:        'entry.598112260',  // 2. Ngày mua hàng YYYY-MM-DD (Tự động)
  paymentTime:        'entry.1044261621', // 3. Thời gian thanh toán HH:mm (Tự động)
  customerAddress:    'entry.681163783',  // 4. Địa chỉ KH (Để trống "" nếu không tick Xuất hóa đơn)
  taxOrCccd:          'entry.575498379',  // 5. MST / CCCD (Để trống "" nếu không tick Xuất hóa đơn)
  productName:        'entry.2088729906', // 6. Tên sản phẩm chuẩn từ Database (google_form_product_name)
  amount:             'entry.801296064',  // 7. Số tiền thực trả
  documentNote:       'entry.906534887',  // 8. Ghi chú (Word dài | PDF dài | Flashcard | Trang tính | Thiết kế)
  customerEmail:      'entry.1610762805', // 9. Email nhận tài liệu (Đã xác thực 2 lớp)
  customerGroup:      'entry.1680953650', // 10. Nhóm khách
  quantity:           'entry.112780521',  // 11. Số lượng (Chỉ điền khi mua Flashcard, còn lại để trống "")
  discountPointsUsed: 'entry.242891304',  // 12. Điểm KM đã sử dụng (Mặc định để trống "")
  otherUnit:          'entry.317416358',  // 13. Đơn vị khác (Mặc định để trống "")
  sellerName:         'entry.118891792',  // 14. Người bán (Mặc định: 'Website')
} as const;

export function isValidUiFormat(val: string): val is UiFormatCode {
  return (UI_FORMATS as readonly string[]).includes(val);
}

/**
 * Tự động ánh xạ từ 1 trong 5 định dạng UI sang 1 trong 5 định dạng Ghi chú Google Form:
 * Word -> Word dài
 * PDF -> PDF dài
 * Flashcard -> Flashcard
 * Trang tính -> Trang tính
 * Thiết kế -> Thiết kế
 */
export function mapUIFormatToFormNote(uiFormat: string): GoogleFormNote {
  switch (uiFormat) {
    case 'Word':
      return 'Word dài';
    case 'PDF':
      return 'PDF dài';
    case 'Flashcard':
      return 'Flashcard';
    case 'Trang tính':
      return 'Trang tính';
    case 'Thiết kế':
      return 'Thiết kế';
    default:
      return 'Word dài';
  }
}

export const mapFormatToGoogleFormNote = mapUIFormatToFormNote;
