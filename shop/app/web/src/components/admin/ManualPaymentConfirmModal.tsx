import React, { useState, useEffect } from 'react';
import { OrderRecord, formatVnd } from '../../types';
import { apiClient } from '../../api/client';
import { getClientErrorMessage } from '../../utils/errorHandler';

export interface ManualPaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderRecord | null;
  onConfirmSuccess: () => Promise<void>;
  showToast: (message: string) => void;
}

/**
 * Returns current date/time in Vietnam (UTC+7) formatted for <input type="datetime-local" />: YYYY-MM-DDTHH:mm
 */
const getVietnamDateTimeLocal = (date = new Date()): string => {
  const tzOffset = 7 * 60; // minutes
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const vnTime = new Date(utc + tzOffset * 60000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${vnTime.getFullYear()}-${pad(vnTime.getMonth() + 1)}-${pad(vnTime.getDate())}T${pad(vnTime.getHours())}:${pad(vnTime.getMinutes())}`;
};

/**
 * Converts a datetime-local string (YYYY-MM-DDTHH:mm) into an ISO string with Vietnam offset (+07:00)
 */
const formatPaidAtForPayload = (val: string): string => {
  if (!val) return new Date().toISOString();
  if (val.includes('+') || val.endsWith('Z')) return new Date(val).toISOString();
  const fullIsoLike = val.length === 16 ? `${val}:00+07:00` : `${val}+07:00`;
  const d = new Date(fullIsoLike);
  return isNaN(d.getTime()) ? new Date(val).toISOString() : d.toISOString();
};

export const ManualPaymentConfirmModal: React.FC<ManualPaymentConfirmModalProps> = ({
  isOpen,
  onClose,
  order,
  onConfirmSuccess,
  showToast,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [paidAt, setPaidAt] = useState<string>('');
  const [paymentRefId, setPaymentRefId] = useState<string>('');
  const [confirmText, setConfirmText] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && order) {
      setStep(1);
      setPaidAt(getVietnamDateTimeLocal());
      setPaymentRefId('');
      setConfirmText('');
      setCountdown(3);
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen, order]);

  // Countdown timer in step 2
  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, countdown]);

  if (!isOpen || !order) return null;

  const productTitle = order.items?.[0]?.product_title || 'Tài liệu đặt mua';
  const canConfirm =
    confirmText.trim() === 'XAC NHAN' && countdown === 0 && !isSubmitting && Boolean(paidAt);

  const handleConfirmPayment = async () => {
    if (!canConfirm) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payloadPaidAt = formatPaidAtForPayload(paidAt);
      const res = await (apiClient as any).manualConfirmOrderPayment(order.order_code, {
        paidAt: payloadPaidAt,
        paymentRefId: paymentRefId.trim() || undefined,
        notes: `Admin thủ công duyệt đơn lúc ${new Date().toLocaleString('vi-VN')}`,
      });
      showToast(res?.message || `Đã duyệt thanh toán thành công cho đơn ${order.order_code}!`);
      await onConfirmSuccess();
      onClose();
    } catch (err: any) {
      const detailed = getClientErrorMessage(err, true);
      setErrorMsg(detailed);
      showToast(detailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-in">
      <div className="bg-white rounded-sm border border-gray-300 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-gray-800">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm bg-blue-600 text-white">
              {step === 1 ? 'BƯỚC 1/2: KIỂM TRA ĐƠN' : 'BƯỚC 2/2: XÁC NHẬN BẢO MẬT'}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-gray-900 truncate">
              [DUYỆT THANH TOÁN THỦ CÔNG] - [MÃ ĐƠN {order.order_code}]
            </h3>
          </div>
          {!isSubmitting && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-base font-bold px-1.5 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed flex-1">
          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-sm font-mono text-[11px]">
              <strong>Lỗi thực thi:</strong> {errorMsg}
            </div>
          )}

          {step === 1 ? (
            /* ============================================================== */
            /* BƯỚC 1: KIỂM TRA THÔNG TIN ĐƠN & CẢNH BÁO                      */
            /* ============================================================== */
            <div className="space-y-3.5">
              <div className="border border-gray-200 rounded-sm p-3.5 bg-gray-50 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-gray-500">Mã đơn hàng:</span>{' '}
                    <strong className="text-[#e60049] font-mono">{order.order_code}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Tổng tiền thực thu:</span>{' '}
                    <strong className="text-gray-900 font-extrabold">{formatVnd(order.total_amount)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Khách hàng:</span>{' '}
                    <strong className="text-gray-800">{order.customer_name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500">Nhóm:</span>{' '}
                    <span className="font-semibold text-gray-700">{order.customer_group}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Email nhận tài liệu:</span>{' '}
                    <span className="font-mono text-blue-700 font-semibold">{order.customer_email}</span>
                  </div>
                  {order.customer_phone && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Số điện thoại:</span>{' '}
                      <span className="font-mono text-gray-800">{order.customer_phone}</span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-gray-500">Sản phẩm &amp; Định dạng:</span>{' '}
                    <span className="font-bold text-gray-900">{productTitle}</span>{' '}
                    <span className="text-[#e60049] font-bold">({order.selected_format})</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Cổng thanh toán:</span>{' '}
                    <span className="font-semibold text-gray-800">
                      {order.payment_method === 'paypal' ? 'PayPal' : 'VietQR (SePay)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cảnh báo hậu quả nghiệp vụ */}
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm p-3.5 text-amber-900">
                <span className="text-xl">⚠️</span>
                <div className="space-y-1 text-[11px]">
                  <p className="font-black text-amber-950 uppercase">Hậu quả nghiệp vụ sau khi duyệt:</p>
                  <ul className="list-disc pl-4 space-y-1 text-amber-800">
                    <li>Đơn hàng sẽ chuyển sang trạng thái <strong>ĐÃ THANH TOÁN (PAID)</strong> và hoàn tất.</li>
                    <li>Tự động cấp quyền tài liệu vào <strong>Tủ sách cá nhân (my_library)</strong> của khách ngay lập tức.</li>
                    <li>Tự động bắn <strong>14 Entry Google Form</strong> để hệ thống gửi Gmail link tài liệu cho khách.</li>
                    <li className="font-bold text-rose-700">Thao tác này không thể hoàn tác.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* BƯỚC 2: NHẬP PAID_AT & MÃ XÁC NHẬN BẢO MẬT                      */
            /* ============================================================== */
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Thời gian thanh toán thực tế (theo sao kê ngân hàng) *
                </label>
                <input
                  type="datetime-local"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#e60049]"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Mặc định là giờ Việt Nam hiện tại. Có thể chỉnh sửa khớp với sao kê ngân hàng để đối soát.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Mã tham chiếu ngân hàng / Ghi chú giao dịch (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={paymentRefId}
                  onChange={(e) => setPaymentRefId(e.target.value)}
                  placeholder="VD: MB-FT2611... hoặc Check sao kê 09:30"
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#e60049]"
                />
              </div>

              <div className="border-t border-gray-100 pt-3">
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Nhập chính xác chữ &ldquo;<span className="text-[#e60049] font-mono">XAC NHAN</span>&rdquo; để xác nhận *
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="XAC NHAN"
                  className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs font-mono font-black text-[#e60049] tracking-wider focus:outline-none focus:border-[#e60049]"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Gõ đúng chữ <strong>XAC NHAN</strong> (viết hoa, không dấu) để chống click nhầm.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-sm transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setCountdown(3);
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-sm transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                Tiếp tục Bước 2 (Nhập mã) &rarr;
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
                className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-sm transition cursor-pointer"
              >
                &larr; Quay lại Bước 1
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={!canConfirm}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold text-xs rounded-sm transition cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
              >
                {isSubmitting
                  ? 'Đang cấp quyền & gửi form...'
                  : countdown > 0
                  ? `Xác Nhận Duyệt Đơn (${countdown}s)`
                  : '✓ Xác Nhận Duyệt Đơn'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
