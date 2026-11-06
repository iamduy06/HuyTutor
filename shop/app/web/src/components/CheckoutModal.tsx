import React, { useEffect, useMemo, useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { getClientErrorMessage } from '../utils/errorHandler';
import {
  CUSTOMER_GROUP_OPTIONS,
  CustomerGroupType,
  formatVnd,
  OrderRecord,
  PaymentInstruction,
  UiFormatCode,
} from '../types';

export const CheckoutModal: React.FC = () => {
  const { user, isItemInLibrary } = useAuth();
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    selectedCartItems,
    selectedFormats,
    hasFormatConflict,
    hasMultipleProductsConflict,
    subtotalAmount,
    discountPercent,
    discountAmount,
    totalAmount,
    clientRegion,
    setRegionOverride,
    clearSelectedCartItems,
    siteConfigs,
    showToast,
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerEmailConfirm, setCustomerEmailConfirm] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerGroup, setCustomerGroup] = useState<CustomerGroupType | ''>('');
  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceTaxOrCccd, setInvoiceTaxOrCccd] = useState('');
  const [invoiceAddress, setInvoiceAddress] = useState('');
  const [flashcardQuantity, setFlashcardQuantity] = useState<number>(1);
  const [selectedGateway, setSelectedGateway] = useState<'sepay' | 'paypal'>('sepay');
  const isVietnamUser = clientRegion.isVietnam !== false && clientRegion.country === 'VN';
  const isVatInvoiceEnabled = Boolean(siteConfigs?.checkout_config?.enable_vat_invoice);
  const [consentOrderProcessing, setConsentOrderProcessing] = useState(false);
  const [consentMarketingEmails, setConsentMarketingEmails] = useState(false);

  // Tự động điền thông tin từ tài khoản đang đăng nhập
  useEffect(() => {
    if (user && isCheckoutOpen) {
      setCustomerName((prev) => prev || user.fullName || '');
      setCustomerEmail((prev) => prev || user.email || '');
      setCustomerEmailConfirm((prev) => prev || user.email || '');
      setCustomerPhone((prev) => prev || user.phone || '');
      if (user.customerGroup) {
        if ((CUSTOMER_GROUP_OPTIONS as readonly string[]).includes(user.customerGroup)) {
          setCustomerGroup((prev) => prev || (user.customerGroup as CustomerGroupType));
        } else if (user.customerGroup === 'Giáo viên') {
          setCustomerGroup((prev) => prev || 'Giáo viên công lập');
        }
      }
      if (user.defaultTaxCccd) {
        setInvoiceTaxOrCccd((prev) => prev || user.defaultTaxCccd);
      }
      if (user.defaultInvoiceAddress) {
        setInvoiceAddress((prev) => prev || user.defaultInvoiceAddress);
      }
    }
  }, [user, isCheckoutOpen]);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [createdOrder, setCreatedOrder] = useState<OrderRecord | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInstruction | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Tự động kiểm tra trạng thái đơn hàng định kỳ khi đang ở màn hình thanh toán
  useEffect(() => {
    if (!createdOrder || createdOrder.payment_status === 'paid') return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.getOrderStatus(createdOrder.order_code, createdOrder.view_token);
        if (res.order.payment_status === 'paid') {
          setCreatedOrder(res.order);
          clearSelectedCartItems();
          showToast(`Thanh toán đơn hàng ${createdOrder.order_code} thành công!`);
        }
      } catch {
        // silent polling
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [createdOrder, clearSelectedCartItems, showToast]);

  // Tính toán số tiền thực tế đồng bộ với số lượng Flashcard tài khoản
  const activeFormat: UiFormatCode = selectedFormats[0] || 'Word';

  const displaySubtotal = useMemo(() => {
    if (activeFormat === 'Flashcard' && selectedCartItems.length > 0) {
      return selectedCartItems.reduce(
        (acc, it) => acc + it.unitPrice * Math.max(1, flashcardQuantity),
        0
      );
    }
    return subtotalAmount;
  }, [activeFormat, selectedCartItems, flashcardQuantity, subtotalAmount]);

  const displayTotal = useMemo(() => {
    if (activeFormat === 'Flashcard' && selectedCartItems.length > 0) {
      const discount = Math.round((displaySubtotal * discountPercent) / 100);
      return Math.max(0, displaySubtotal - discount);
    }
    return totalAmount;
  }, [activeFormat, selectedCartItems, flashcardQuantity, displaySubtotal, discountPercent, totalAmount]);

  if (!isCheckoutOpen) return null;

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setFormError(null);
    if (createdOrder?.payment_status === 'paid') {
      setCreatedOrder(null);
      setPaymentInfo(null);
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
        'Mỗi đơn hàng chỉ được phép thanh toán cho 1 định dạng duy nhất. Vui lòng quay lại giỏ hàng để chọn đồng nhất định dạng.'
      );
      return;
    }

    if (hasMultipleProductsConflict) {
      setFormError(
        'Trừ định dạng Flashcard, mỗi đơn hàng chỉ được phép đặt tối đa 1 sản phẩm với số lượng 1. Vui lòng điều chỉnh lại giỏ hàng.'
      );
      return;
    }

    const hasOwnedItem = selectedCartItems.some((it) => {
      if (it.isUpgrade) return false;
      if (!isItemInLibrary) return false;
      if (it.formatCode === 'PDF' && isItemInLibrary(it.slug, 'Word')) return true;
      return isItemInLibrary(it.slug, it.formatCode);
    });
    if (hasOwnedItem) {
      const isWordOwnedPdfRequest = selectedCartItems.some(
        (it) => it.formatCode === 'PDF' && isItemInLibrary && isItemInLibrary(it.slug, 'Word')
      );
      if (isWordOwnedPdfRequest) {
        setFormError(
          'Bạn đã sở hữu định dạng Word, không cần mua thêm bản PDF vì nội dung chúng là giống nhau.'
        );
      } else {
        setFormError(
          'Đơn hàng có tài liệu bạn đã sở hữu trong Tủ sách cá nhân. Không thể thanh toán lại. Vui lòng quay lại giỏ hàng và bỏ chọn tài liệu đó.'
        );
      }
      return;
    }

    const email1 = customerEmail.trim().toLowerCase();
    const email2 = customerEmailConfirm.trim().toLowerCase();
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

    if (!email1 || !gmailRegex.test(email1)) {
      setFormError(
        'Vui lòng nhập đúng định dạng địa chỉ Gmail (@gmail.com) để hệ thống cấp quyền truy cập tài liệu.'
      );
      return;
    }

    if (!email2 || !gmailRegex.test(email2)) {
      setFormError(
        'Vui lòng xác nhận lại Gmail lần 2 đúng định dạng @gmail.com.'
      );
      return;
    }

    if (email1 !== email2) {
      setFormError(
        'Gmail xác nhận lần 2 không khớp với Gmail lần 1. Vui lòng kiểm tra và nhập lại chính xác.'
      );
      return;
    }

    if (!customerGroup || !(CUSTOMER_GROUP_OPTIONS as readonly string[]).includes(customerGroup)) {
      setFormError('Vui lòng chọn mục "Bạn là..." trước khi tiến hành thanh toán.');
      return;
    }

    const effectiveNeedInvoice = isVatInvoiceEnabled && needInvoice;
    if (effectiveNeedInvoice && (!invoiceTaxOrCccd.trim() || !invoiceAddress.trim())) {
      setFormError('Vui lòng nhập đầy đủ MST/CCCD và Địa chỉ khi tích chọn Xuất hóa đơn VAT.');
      return;
    }

    if (!consentOrderProcessing) {
      setFormError('Vui lòng đồng ý để Hộ kinh doanh Huy Crecom xử lý thông tin cho mục đích giao đơn hàng này.');
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
        needInvoice: effectiveNeedInvoice,
        invoiceTaxOrCccd: effectiveNeedInvoice ? invoiceTaxOrCccd.trim() : '',
        invoiceAddress: effectiveNeedInvoice ? invoiceAddress.trim() : '',
        flashcardQuantity: activeFormat === 'Flashcard' ? flashcardQuantity : null,
        paymentMethod: isVietnamUser ? 'sepay' : selectedGateway,
        consentOrderProcessing: true,
        consentMarketingEmails: Boolean(consentMarketingEmails),
        items: selectedCartItems.map((it) => ({
          productId: it.slug,
          productTitle: it.title,
          formatCode: it.formatCode,
          unitPrice: it.unitPrice,
          quantity: activeFormat === 'Flashcard' ? Math.max(1, flashcardQuantity) : it.quantity,
        })),
      });

      setCreatedOrder(response.order);
      setPaymentInfo(response.paymentInstruction);
      showToast(`Đã tạo đơn hàng ${response.order.order_code}.`);
    } catch (err: any) {
      setFormError(getClientErrorMessage(err, 'Không thể tạo đơn hàng. Vui lòng thử lại sau.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualCheckStatus = async () => {
    if (!createdOrder) return;
    setVerifyingPayment(true);
    setFormError(null);
    try {
      const res = await apiClient.getOrderStatus(createdOrder.order_code, createdOrder.view_token);
      if (res.order.payment_status === 'paid') {
        setCreatedOrder(res.order);
        clearSelectedCartItems();
        showToast(`Đơn hàng ${createdOrder.order_code} đã được thanh toán thành công!`);
      } else {
        showToast('Hệ thống đang kiểm tra giao dịch từ ngân hàng, vui lòng đợi trong giây lát...');
      }
    } catch {
      setFormError('Chưa nhận được giao dịch hoặc đang xử lý. Vui lòng kiểm tra lại sau ít phút.');
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
              Thanh toán &amp; Cấp quyền tài liệu
            </h2>
            <p className="text-[11px] text-white/90 mt-0.5">
              Định dạng tài liệu: <strong>{activeFormat}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-2.5 py-1 bg-white text-[#e60049] font-bold text-xs rounded-sm hover:bg-gray-100 transition"
          >
            Đóng
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[82vh] overflow-y-auto">
          {!createdOrder ? (
            <form onSubmit={handleCreateOrder} className="space-y-4">
              {/* Lựa chọn phương thức thanh toán (Tự động tracking Việt Nam vs Nước ngoài) */}
              {isVietnamUser ? (
                /* Khách hàng ở Việt Nam: Bắt buộc 100% VietQR, không có PayPal, không huy hiệu */
                <div className="bg-[#fff5f7] border border-pink-200 rounded-md p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                      Phương thức thanh toán
                    </div>
                    <div className="text-xs font-bold text-[#e60049] flex items-center gap-1.5 mt-0.5">
                      <span>Chuyển khoản Ngân hàng (VietQR)</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-sm">
                    Tự động kích hoạt
                  </span>
                </div>
              ) : (
                /* Khách hàng ở Nước ngoài: Mặc định là VietQR, nếu không có tài khoản VN thì bấm chọn PayPal */
                selectedGateway === 'sepay' ? (
                  <div className="bg-[#fff5f7] border border-pink-200 rounded-md p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                          Phương thức thanh toán
                        </div>
                        <div className="text-xs font-bold text-[#e60049] flex items-center gap-1.5 mt-0.5">
                          <span>Chuyển khoản Ngân hàng (VietQR)</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-sm">
                        Mặc định
                      </span>
                    </div>
                    <div className="pt-2 border-t border-pink-100 flex flex-wrap items-center justify-between text-xs gap-1">
                      <span className="text-gray-600">Bạn không có tài khoản ngân hàng Việt Nam?</span>
                      <button
                        type="button"
                        onClick={() => setSelectedGateway('paypal')}
                        className="text-[#e60049] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        Thanh toán bằng PayPal ↗
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-md p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-blue-700 font-semibold uppercase tracking-wider">
                          Phương thức thanh toán
                        </div>
                        <div className="text-xs font-bold text-blue-900 mt-0.5">
                          Thanh toán Quốc tế (PayPal / Thẻ Visa, MasterCard)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedGateway('sepay')}
                        className="text-xs text-[#e60049] hover:underline font-bold cursor-pointer"
                      >
                        ← Đổi sang VietQR
                      </button>
                    </div>
                    <div className="text-[11px] text-gray-600 bg-white/80 p-2 rounded border border-blue-100 flex flex-wrap items-center justify-between gap-1">
                      <span>
                        Số tiền quy đổi:{' '}
                        <strong>
                          ~${(displayTotal / (clientRegion.usdExchangeRate || 26000)).toFixed(2)} USD
                        </strong>
                      </span>
                      <span className="text-gray-500 text-[10px]">
                        Tỷ giá: 1 USD ≈ {(clientRegion.usdExchangeRate || 26000).toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </div>
                )
              )}

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
                    placeholder="Ví dụ: Thầy/Cô Nguyễn Văn A"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Số điện thoại / Zalo
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Ví dụ: 0912345678 (Không bắt buộc)"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
                  />
                </div>
              </div>

              {/* Nhập Gmail nhận tài liệu 2 lớp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-gray-50 p-3.5 rounded-md border border-gray-200">
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">
                    Gmail nhận tài liệu &amp; quyền truy cập *
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
                    Xác nhận lại Gmail lần 2 *
                  </label>
                  <input
                    type="email"
                    required
                    onPaste={(e) => {
                      e.preventDefault();
                      showToast('Vui lòng tự gõ lại Gmail lần 2 để tránh nhầm lẫn địa chỉ nhận.');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      showToast('Vui lòng tự gõ lại Gmail lần 2 để tránh nhầm lẫn địa chỉ nhận.');
                    }}
                    value={customerEmailConfirm}
                    onChange={(e) => setCustomerEmailConfirm(e.target.value)}
                    placeholder="Gõ lại chính xác Gmail của bạn"
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#e60049]"
                  />
                </div>
              </div>

              {/* Nhóm khách hàng & Số lượng Flashcard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Bạn là... *
                  </label>
                  <select
                    required
                    value={customerGroup}
                    onChange={(e) => setCustomerGroup(e.target.value as CustomerGroupType)}
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#e60049]"
                  >
                    <option value="" disabled>
                      -- Chọn đối tượng --
                    </option>
                    {CUSTOMER_GROUP_OPTIONS.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                  </select>
                </div>

                {activeFormat === 'Flashcard' && (
                  <div>
                    <label className="block text-[11px] font-bold text-[#e60049] mb-1">
                      Số lượng tài khoản Flashcard *
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

              {/* Checkbox Xuất hóa đơn VAT (Chỉ hiển thị khi được bật cấu hình trong Admin) */}
              {isVatInvoiceEnabled && (
                <div className="border border-gray-200 rounded-md p-3.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={needInvoice}
                      onChange={(e) => setNeedInvoice(e.target.checked)}
                      className="accent-[#e60049] w-4 h-4"
                    />
                    Yêu cầu xuất hóa đơn VAT điện tử
                  </label>

                  {needInvoice && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Mã số thuế hoặc CCCD *
                        </label>
                        <input
                          type="text"
                          required={needInvoice}
                          value={invoiceTaxOrCccd}
                          onChange={(e) => setInvoiceTaxOrCccd(e.target.value)}
                          placeholder="Nhập MST cơ quan hoặc số CCCD"
                          className="w-full border border-gray-300 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#e60049]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Địa chỉ xuất hóa đơn *
                        </label>
                        <input
                          type="text"
                          required={needInvoice}
                          value={invoiceAddress}
                          onChange={(e) => setInvoiceAddress(e.target.value)}
                          placeholder="Nhập địa chỉ đơn vị / cá nhân"
                          className="w-full border border-gray-300 rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#e60049]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tóm tắt sản phẩm & tiền thanh toán */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3.5 space-y-2 text-xs">
                <div className="font-bold text-gray-800 border-b border-gray-200 pb-1.5">
                  Danh sách tài liệu ({selectedCartItems.length} tài liệu - Định dạng {activeFormat}):
                </div>
                {selectedCartItems.map((it) => {
                  const effectiveQty =
                    activeFormat === 'Flashcard' ? Math.max(1, flashcardQuantity) : it.quantity;
                  return (
                    <div key={it.cartItemId} className="space-y-1 text-gray-700">
                      <div className="flex justify-between">
                        <span>
                          {it.title} ({it.formatCode} x{effectiveQty})
                          {it.isUpgrade && (
                            <span className="ml-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-xs">
                              Nâng cấp
                            </span>
                          )}
                        </span>
                        <span className="font-bold">{formatVnd(it.unitPrice * effectiveQty)}</span>
                      </div>
                      {it.isUpgrade && (
                        <div className="text-[10px] text-gray-500 pl-1">
                          Giá niêm yết: {formatVnd(it.originalPrice || it.unitPrice + (it.upgradeOffset || 0))} - Khấu trừ bản PDF: -{formatVnd(it.upgradeOffset || 0)}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="border-t border-gray-200 pt-2 flex justify-between text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{formatVnd(displaySubtotal)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-[#e60049] font-bold">
                    <span>Ưu đãi Combo (-{discountPercent}%):</span>
                    <span>-{formatVnd(displaySubtotal - displayTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1">
                  <span>Tổng thanh toán:</span>
                  <span className="text-[#e60049]">{formatVnd(displayTotal)}</span>
                </div>
              </div>

              {/* Điều khoản & Đồng ý Xử lý Dữ liệu Cá nhân (Nghị định 13/2023/NĐ-CP) */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3.5 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={consentOrderProcessing}
                    onChange={(e) => setConsentOrderProcessing(e.target.checked)}
                    className="accent-[#e60049] mt-0.5 rounded-xs w-4 h-4 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-gray-700 leading-snug">
                    Tôi đồng ý để Hộ kinh doanh Huy Crecom xử lý họ tên, số điện thoại/email, địa chỉ của tôi cho mục đích xử lý và giao đơn hàng này. <span className="text-[#e60049] font-bold">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentMarketingEmails}
                    onChange={(e) => setConsentMarketingEmails(e.target.checked)}
                    className="accent-[#e60049] mt-0.5 rounded-xs w-4 h-4 cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-gray-700 leading-snug">
                    Tôi đồng ý nhận email giới thiệu sản phẩm, ưu đãi từ Hộ kinh doanh Huy Crecom. Tôi có thể hủy bất cứ lúc nào.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2.5 rounded-sm transition"
              >
                {submitting ? 'Đang xử lý đơn hàng...' : 'Tiến hành thanh toán'}
              </button>
            </form>
          ) : (
            /* Màn hình Hướng dẫn Chuyển khoản VietQR / PayPal */
            <div className="space-y-5">
              <div className="bg-[#fff5f7] border border-pink-200 rounded-md p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold text-gray-900">
                    Mã đơn hàng: <span className="text-[#e60049]">{createdOrder.order_code}</span>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-0.5">
                    Gmail nhận tài liệu: <strong>{createdOrder.customer_email}</strong> • Định dạng:{' '}
                    <strong>{createdOrder.selected_format}</strong>
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
                    ? 'ĐÃ THANH TOÁN THÀNH CÔNG'
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
                          alt="Mã VietQR Chuyển khoản"
                          className="w-48 h-48 object-contain border border-gray-200 rounded-sm p-1 bg-white"
                        />
                        <span className="text-[10px] text-gray-500 mt-1.5 text-center">
                          Quét mã VietQR bằng ứng dụng Ngân hàng bất kỳ
                        </span>
                      </div>
                      <div className="md:col-span-7 space-y-2 text-xs text-gray-700">
                        <div className="font-extrabold text-[#e60049] uppercase">
                          Thông tin chuyển khoản Ngân hàng
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
                          Hệ thống sẽ tự động xác nhận và cấp quyền tài liệu qua Gmail của bạn ngay khi nhận được thanh toán.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="md:col-span-12 space-y-2 text-xs text-gray-700">
                      <div className="font-extrabold text-[#e60049] uppercase">
                        Cổng thanh toán Quốc tế PayPal
                      </div>
                      <p>
                        Số tiền thanh toán: <strong>${paymentInfo.amountUsd} USD</strong> (Tương đương{' '}
                        {formatVnd(paymentInfo.amountVnd)})
                      </p>
                      <p>
                        Mã tham chiếu đơn hàng: <strong>{createdOrder.order_code}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Nút kiểm tra trạng thái dành cho khách hàng */}
              {createdOrder.payment_status !== 'paid' && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="text-[11px] text-gray-600">
                    Sau khi hoàn tất chuyển khoản, hệ thống sẽ tự động xác nhận trong vòng 1-2 phút.
                  </div>
                  <button
                    type="button"
                    disabled={verifyingPayment}
                    onClick={handleManualCheckStatus}
                    className="shrink-0 bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-2 rounded-sm transition"
                  >
                    {verifyingPayment ? 'Đang kiểm tra...' : 'Tôi đã chuyển khoản'}
                  </button>
                </div>
              )}

              {/* Màn hình thông báo thanh toán thành công */}
              {createdOrder.payment_status === 'paid' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-5 text-center space-y-3">
                  <div className="text-sm font-extrabold text-emerald-800 uppercase">
                    Thanh toán thành công!
                  </div>
                  <p className="text-xs text-emerald-700">
                    Cảm ơn bạn đã tin tưởng và ủng hộ Huy Tutor. Tài liệu đã được cấp quyền truy cập tới hòm thư:{' '}
                    <strong>{createdOrder.customer_email}</strong>.
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Quý khách vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam/Quảng cáo) để truy cập tài liệu.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2 rounded-sm transition"
                    >
                      Hoàn tất &amp; Tiếp tục xem tài liệu
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
