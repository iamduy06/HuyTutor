import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';
import {
  FORMAT_TO_GOOGLE_FORM_MAP,
  formatVnd,
  OrderRecord,
  PaymentInstruction,
  UiFormatCode,
} from '../types';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    selectedCartItems,
    selectedFormats,
    hasFormatConflict,
    subtotalAmount,
    discountPercent,
    discountAmount,
    totalAmount,
    clientRegion,
    setRegionOverride,
    clearSelectedCartItems,
    showToast,
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerEmailConfirm, setCustomerEmailConfirm] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGroup, setCustomerGroup] = useState<
    'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác'
  >('Giáo viên');
  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceTaxOrCccd, setInvoiceTaxOrCccd] = useState('');
  const [invoiceAddress, setInvoiceAddress] = useState('');
  const [flashcardQuantity, setFlashcardQuantity] = useState<number>(1);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [createdOrder, setCreatedOrder] = useState<OrderRecord | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInstruction | null>(null);
  const [googleFormSyncPayload, setGoogleFormSyncPayload] = useState<
    Record<string, string> | null
  >(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  if (!isCheckoutOpen) return null;

  const activeFormat: UiFormatCode = selectedFormats[0] || 'Word';
  const mappedGoogleFormNote = FORMAT_TO_GOOGLE_FORM_MAP[activeFormat];

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setFormError(null);
    if (createdOrder?.payment_status === 'paid') {
      setCreatedOrder(null);
      setPaymentInfo(null);
      setGoogleFormSyncPayload(null);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (selectedCartItems.length === 0) {
      setFormError('Không có sản phẩm nào được chọn để thanh toán.');
      return;
    }

    if (hasFormatConflict) {
      setFormError(
        'Mỗi đơn hàng chỉ được phép thanh toán cho 1 định dạng duy nhất. Vui lòng quay lại giỏ hàng để lọc định dạng.'
      );
      return;
    }

    const email1 = customerEmail.trim().toLowerCase();
    const email2 = customerEmailConfirm.trim().toLowerCase();
    if (!email1 || email1 !== email2) {
      setFormError(
        'Gmail xác nhận lần 2 không khớp với Gmail lần 1. Vui lòng nhập khớp chính xác 2 ô Gmail.'
      );
      return;
    }

    if (needInvoice && (!invoiceTaxOrCccd.trim() || !invoiceAddress.trim())) {
      setFormError('Vui lòng nhập đầy đủ MST/CCCD và Địa chỉ khi tích chọn Xuất hóa đơn VAT.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.createOrder({
        customerName: customerName.trim(),
        customerEmail: email1,
        customerEmailConfirm: email2,
        customerPhone: customerPhone.trim(),
        customerGroup,
        needInvoice,
        invoiceTaxOrCccd: needInvoice ? invoiceTaxOrCccd.trim() : '',
        invoiceAddress: needInvoice ? invoiceAddress.trim() : '',
        flashcardQuantity: activeFormat === 'Flashcard' ? flashcardQuantity : null,
        paymentMethod: clientRegion.recommendedGateway,
        items: selectedCartItems.map((it) => ({
          productId: it.slug,
          productTitle: it.title,
          formatCode: it.formatCode,
          unitPrice: it.unitPrice,
          quantity: it.quantity,
        })),
      });

      setCreatedOrder(response.order);
      setPaymentInfo(response.paymentInstruction);
      showToast(`Đã khởi tạo đơn hàng ${response.order.order_code}.`);
    } catch (err: any) {
      setFormError(err?.message || 'Lỗi tạo đơn hàng từ Backend.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmPaymentSimulation = async () => {
    if (!createdOrder) return;
    setVerifyingPayment(true);
    setFormError(null);
    try {
      const res = await apiClient.simulatePaymentSuccess(createdOrder.order_code);
      setCreatedOrder(res.order);
      const firstSub = res.googleFormSync.submissions[0];
      if (firstSub) {
        setGoogleFormSyncPayload(firstSub.payload);
      }
      clearSelectedCartItems();
      showToast(
        `Thanh toán đơn ${createdOrder.order_code} thành công! Đã tự động bắn 14 entry vào Google Form.`
      );
    } catch (err: any) {
      setFormError(err?.message || 'Lỗi xác nhận thanh toán.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 overflow-y-auto">
      <div className="bg-white rounded-md border border-gray-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#e60049] text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold uppercase">
              Thanh toán &amp; Cấp quyền tài liệu tự động
            </h2>
            <p className="text-[11px] text-white/90 mt-0.5">
              Định dạng đơn hàng: <strong>{activeFormat}</strong> (Ghi chú Google Form:{' '}
              <strong>{mappedGoogleFormNote}</strong>)
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-2.5 py-1 bg-white text-[#e60049] font-bold text-xs rounded-sm hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[82vh] overflow-y-auto">
          {!createdOrder ? (
            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Chuyển đổi IP vùng thanh toán (Việt Nam VietQR vs Quốc tế PayPal) */}
              <div className="bg-[#fff5f7] border border-pink-200 rounded-md p-3 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] text-gray-700">
                  <span className="font-bold text-[#e60049]">Nhận diện cổng thanh toán theo IP:</span>{' '}
                  {clientRegion.country === 'VN'
                    ? 'Việt Nam (SePay VietQR)'
                    : 'Quốc tế (PayPal USD)'}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRegionOverride('VN')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-sm border ${
                      clientRegion.country === 'VN'
                        ? 'bg-[#e60049] text-white border-[#e60049]'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    IP Việt Nam (VietQR)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegionOverride('INTL')}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-sm border ${
                      clientRegion.country !== 'VN'
                        ? 'bg-[#e60049] text-white border-[#e60049]'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    IP Quốc tế (PayPal)
                  </button>
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-[#e60049] text-[#e60049] text-xs font-bold rounded-sm">
                  {formError}
                </div>
              )}

              {/* Thông tin khách hàng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Họ và tên khách hàng *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ví dụ: Cô Nguyễn Thị Mai"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Số điện thoại / Zalo *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                  />
                </div>
              </div>

              {/* Xác thực Gmail 2 lớp (Chống gõ sai Gmail nhận tài liệu) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-gray-50 p-3.5 rounded-md border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">
                    Gmail nhận tài liệu &amp; cấp quyền Google Drive *
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#e60049]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#e60049] mb-1">
                    Nhập lại chính xác Gmail lần 2 (Không copy/paste) *
                  </label>
                  <input
                    type="email"
                    required
                    onPaste={(e) => {
                      e.preventDefault();
                      showToast('Vui lòng tự gõ lại Gmail lần 2 để đảm bảo không sai sót.');
                    }}
                    value={customerEmailConfirm}
                    onChange={(e) => setCustomerEmailConfirm(e.target.value)}
                    placeholder="Gõ lại chính xác Gmail của bạn"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#e60049]"
                  />
                </div>
              </div>

              {/* Nhóm khách hàng & Số lượng tài khoản Flashcard (nếu định dạng là Flashcard) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Nhóm khách hàng (entry.1680953650) *
                  </label>
                  <select
                    value={customerGroup}
                    onChange={(e) =>
                      setCustomerGroup(
                        e.target.value as 'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác'
                      )
                    }
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#e60049]"
                  >
                    <option value="Giáo viên">Giáo viên</option>
                    <option value="Học sinh">Học sinh</option>
                    <option value="Phụ huynh">Phụ huynh</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {activeFormat === 'Flashcard' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#e60049] mb-1">
                      Số lượng tài khoản Flashcard (entry.242891304) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={flashcardQuantity}
                      onChange={(e) => setFlashcardQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full border border-[#e60049] rounded-sm px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Checkbox Xuất hóa đơn VAT có điều kiện (entry.681163783 & entry.575498379) */}
              <div className="border border-gray-200 rounded-md p-3.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                  <input
                    type="checkbox"
                    checked={needInvoice}
                    onChange={(e) => setNeedInvoice(e.target.checked)}
                    className="accent-[#e60049] w-4 h-4"
                  />
                  Yêu cầu xuất hóa đơn VAT (Nếu không tích, MST/CCCD và Địa chỉ sẽ gửi trống "")
                </label>

                {needInvoice && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Mã số thuế hoặc CCCD (entry.575498379) *
                      </label>
                      <input
                        type="text"
                        required={needInvoice}
                        value={invoiceTaxOrCccd}
                        onChange={(e) => setInvoiceTaxOrCccd(e.target.value)}
                        placeholder="Nhập MST đơn vị hoặc số CCCD"
                        className="w-full border border-gray-300 rounded-sm px-3 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Địa chỉ xuất hóa đơn (entry.681163783) *
                      </label>
                      <input
                        type="text"
                        required={needInvoice}
                        value={invoiceAddress}
                        onChange={(e) => setInvoiceAddress(e.target.value)}
                        placeholder="Nhập địa chỉ đơn vị / cá nhân"
                        className="w-full border border-gray-300 rounded-sm px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Tóm tắt sản phẩm & tiền thanh toán */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3.5 space-y-2 text-xs">
                <div className="font-bold text-gray-800 border-b border-gray-200 pb-1.5">
                  Danh sách tài liệu thanh toán ({selectedCartItems.length} tài liệu - Định dạng{' '}
                  {activeFormat}):
                </div>
                {selectedCartItems.map((it) => (
                  <div key={it.cartItemId} className="flex justify-between text-gray-700">
                    <span>
                      {it.title} ({it.formatCode} x{it.quantity})
                    </span>
                    <span className="font-bold">{formatVnd(it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{formatVnd(subtotalAmount)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-[#e60049] font-bold">
                    <span>Chiết khấu Combo (-{discountPercent}%):</span>
                    <span>-{formatVnd(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1">
                  <span>Tổng cộng cần thanh toán:</span>
                  <span className="text-[#e60049]">{formatVnd(totalAmount)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2.5 rounded-sm transition"
              >
                {submitting ? 'Đang khởi tạo đơn hàng tại Backend...' : 'Tiến hành thanh toán'}
              </button>
            </form>
          ) : (
            /* Màn hình QR SePay / PayPal & Kết quả tự động bắn 14 entry Google Form */
            <div className="space-y-5">
              <div className="bg-[#fff5f7] border border-pink-200 rounded-md p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold text-gray-900">
                    Mã đơn hàng: <span className="text-[#e60049]">{createdOrder.order_code}</span>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    Gmail nhận tài liệu: <strong>{createdOrder.customer_email}</strong> • Định dạng:{' '}
                    <strong>{createdOrder.selected_format}</strong> (Ghi chú Form:{' '}
                    <strong>{mappedGoogleFormNote}</strong>)
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-sm ${
                    createdOrder.payment_status === 'paid'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 text-white'
                  }`}
                >
                  {createdOrder.payment_status === 'paid'
                    ? 'ĐÃ THANH TOÁN & ĐỒNG BỘ GOOGLE FORM'
                    : 'ĐANG CHỜ THANH TOÁN'}
                </span>
              </div>

              {createdOrder.payment_status !== 'paid' && paymentInfo && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center border border-gray-200 rounded-md p-4">
                  {paymentInfo.method === 'sepay' && paymentInfo.sepay ? (
                    <>
                      <div className="md:col-span-5 flex flex-col items-center">
                        <img
                          src={paymentInfo.sepay.qrImageUrl}
                          alt="Mã VietQR SePay"
                          className="w-48 h-48 object-contain border border-gray-200 rounded-sm p-1 bg-white"
                        />
                        <span className="text-[10px] text-gray-500 mt-1.5 text-center">
                          Quét mã VietQR bằng mọi ứng dụng Ngân hàng
                        </span>
                      </div>
                      <div className="md:col-span-7 space-y-2 text-xs text-gray-700">
                        <div className="font-extrabold text-[#e60049] uppercase">
                          Chuyển khoản tự động VietQR (SePay)
                        </div>
                        <p>
                          Ngân hàng: <strong>{paymentInfo.sepay.bankName}</strong>
                        </p>
                        <p>
                          Số tài khoản: <strong>{paymentInfo.sepay.accountNumber}</strong>
                        </p>
                        <p>
                          Chủ tài khoản: <strong>{paymentInfo.sepay.accountHolder}</strong>
                        </p>
                        <p>
                          Số tiền: <strong className="text-[#e60049]">{formatVnd(paymentInfo.amountVnd)}</strong>
                        </p>
                        <p>
                          Nội dung chuyển khoản bắt buộc:{' '}
                          <strong className="bg-yellow-100 text-[#e60049] px-2 py-0.5 rounded-sm">
                            {paymentInfo.sepay.transferContent}
                          </strong>
                        </p>
                        <p className="text-[11px] text-gray-500 pt-1">
                          Ngay khi SePay nhận giao dịch khớp mã {paymentInfo.sepay.transferContent},
                          Backend sẽ tự động bắn 14 trường vào Google Form và cấp quyền tài liệu qua
                          Gmail.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-12 space-y-2 text-xs text-gray-700">
                      <div className="font-extrabold text-[#e60049] uppercase">
                        Cổng thanh toán Quốc tế PayPal (USD)
                      </div>
                      <p>
                        Số tiền quy đổi Quốc tế: <strong>${paymentInfo.amountUsd} USD</strong> (Tương
                        đương {formatVnd(paymentInfo.amountVnd)})
                      </p>
                      <p>
                        Mã tham chiếu PayPal Custom ID: <strong>{createdOrder.order_code}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Nút kiểm thử xác nhận Webhook & Đồng bộ 14 entry Google Form */}
              {createdOrder.payment_status !== 'paid' && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-[11px] text-gray-600">
                    Bấm nút bên cạnh để giả lập Webhook thanh toán thành công từ SePay/PayPal và
                    kiểm tra dữ liệu 14 entry bắn vào Google Form thực tế:
                  </div>
                  <button
                    type="button"
                    disabled={verifyingPayment}
                    onClick={handleConfirmPaymentSimulation}
                    className="shrink-0 bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-2 rounded-sm transition"
                  >
                    {verifyingPayment
                      ? 'Đang đồng bộ Google Form...'
                      : 'Xác nhận đã thanh toán (Test Webhook)'}
                  </button>
                </div>
              )}

              {/* Hiển thị bảng đối soát 14 Entry Google Form sau khi thanh toán */}
              {createdOrder.payment_status === 'paid' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4 space-y-3">
                  <div className="text-xs font-extrabold text-emerald-800 uppercase">
                    Đã thanh toán &amp; Tự động gửi 14 Entry vào Google Form thành công
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Hệ thống Backend (`app/api`) đã gửi HTTP POST trực tiếp tới Google Form nội bộ.
                    Tài liệu đang được cấp quyền tự động tới Gmail{' '}
                    <strong>{createdOrder.customer_email}</strong>.
                  </p>
                  {googleFormSyncPayload && (
                    <div className="bg-white border border-emerald-200 rounded-sm p-3 text-[11px] font-mono text-gray-700 overflow-x-auto">
                      <div className="font-sans font-bold text-gray-900 mb-1.5">
                        Payload 14 Entry đã gửi vào Google Form:
                      </div>
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(googleFormSyncPayload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

