import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { apiClient } from '../api/client';
import { TelegramNotificationConfig } from '../types';
import { getClientErrorMessage } from '../utils/errorHandler';

interface AdminTelegramConfigCmsProps {
  showToast?: (msg: string) => void;
}

export const AdminTelegramConfigCms: React.FC<AdminTelegramConfigCmsProps> = ({ showToast: propShowToast }) => {
  const { siteConfigs, updateSiteConfig, showToast: storeShowToast } = useStore();
  const showToast = propShowToast || storeShowToast;

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const [formConfig, setFormConfig] = useState<TelegramNotificationConfig>({
    is_active: true,
    notify_on_order_created: true,
    notify_on_order_paid: true,
    chat_id: '',
    bot_token: '',
  });

  // Đồng bộ cấu hình từ siteConfigs khi có thay đổi
  useEffect(() => {
    if (siteConfigs?.telegram_notifications) {
      setFormConfig({
        is_active: siteConfigs.telegram_notifications.is_active ?? true,
        notify_on_order_created: siteConfigs.telegram_notifications.notify_on_order_created ?? true,
        notify_on_order_paid: siteConfigs.telegram_notifications.notify_on_order_paid ?? true,
        chat_id: siteConfigs.telegram_notifications.chat_id || '',
        bot_token: siteConfigs.telegram_notifications.bot_token || '',
      });
    }
  }, [siteConfigs?.telegram_notifications]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSiteConfig('telegram_notifications', formConfig);
      showToast('Đã lưu cấu hình thông báo Telegram thành công!');
    } catch (err: any) {
      const errorMsg = getClientErrorMessage(err, true);
      showToast(errorMsg || 'Lỗi khi lưu cấu hình thông báo Telegram.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTest = async () => {
    setIsTesting(true);
    try {
      const res = await apiClient.sendTelegramTestMessage({
        chat_id: formConfig.chat_id.trim() || undefined,
        bot_token: formConfig.bot_token.trim() || undefined,
      });
      showToast(res.message || 'Gửi tin nhắn test Telegram thành công! Vui lòng kiểm tra nhóm Telegram.');
    } catch (err: any) {
      const errorMsg = getClientErrorMessage(err, true);
      showToast(errorMsg || 'Lỗi gửi tin nhắn test Telegram. Vui lòng kiểm tra Bot Token hoặc Chat ID.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-sm bg-white overflow-hidden shadow-2xs mb-6">
      {/* Header Khối CMS */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(!isExpanded)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
        className="w-full flex items-center justify-between p-4 bg-gray-50/70 border-b border-gray-200 cursor-pointer select-none transition hover:bg-gray-100/70"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-[#e60049] text-white tracking-wider">
            THÔNG BÁO TELEGRAM
          </span>
          <h2 className="text-xs sm:text-sm font-black text-gray-900 uppercase">
            [CẤU HÌNH THÔNG BÁO TELEGRAM] - [QUẢN LÝ BẬT/TẮT THÔNG BÁO ĐƠN HÀNG VÀ THANH TOÁN VỀ BOT TELEGRAM]
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-sm ${
              formConfig.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {formConfig.is_active ? 'ĐANG BẬT' : 'ĐANG TẮT'}
          </span>
          <span className="text-gray-600 p-1 flex items-center justify-center">
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      {/* Nội dung khối */}
      {isExpanded && (
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3.5 bg-gray-50 border border-gray-200 rounded-sm">
            {/* Master Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.is_active}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 text-[#e60049] rounded-sm focus:ring-[#e60049]"
              />
              <span className="text-xs font-bold text-gray-800">Bật toàn bộ thông báo Telegram</span>
            </label>

            {/* Toggle Báo Đơn mới */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.notify_on_order_created}
                disabled={!formConfig.is_active}
                onChange={(e) =>
                  setFormConfig((prev) => ({ ...prev, notify_on_order_created: e.target.checked }))
                }
                className="w-4 h-4 text-[#e60049] rounded-sm focus:ring-[#e60049] disabled:opacity-50"
              />
              <span className={`text-xs font-bold ${formConfig.is_active ? 'text-gray-800' : 'text-gray-400'}`}>
                Báo khi có đơn mới (Pending)
              </span>
            </label>

            {/* Toggle Báo Thanh toán */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.notify_on_order_paid}
                disabled={!formConfig.is_active}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, notify_on_order_paid: e.target.checked }))}
                className="w-4 h-4 text-[#e60049] rounded-sm focus:ring-[#e60049] disabled:opacity-50"
              />
              <span className={`text-xs font-bold ${formConfig.is_active ? 'text-gray-800' : 'text-gray-400'}`}>
                Báo khi thanh toán thành công (Paid)
              </span>
            </label>
          </div>

          {/* Cấu hình Chat ID và Bot Token */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Telegram Chat ID (Group ID hoặc User ID)
              </label>
              <input
                type="text"
                placeholder="Để trống sẽ dùng TELEGRAM_CHAT_ID từ biến môi trường"
                value={formConfig.chat_id}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, chat_id: e.target.value }))}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#e60049]"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Ví dụ: <code className="bg-gray-100 px-1 py-0.5 rounded-xs text-gray-700">-1004365184788</code>. Nếu để trống, hệ thống tự nạp từ server env.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Telegram Bot Token (Từ @BotFather)
              </label>
              <input
                type="password"
                placeholder="Để trống sẽ dùng TELEGRAM_BOT_TOKEN từ biến môi trường"
                value={formConfig.bot_token}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, bot_token: e.target.value }))}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#e60049]"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Khóa bí mật Telegram Bot. Đã được mã hóa và bảo mật tại server API.
              </p>
            </div>
          </div>

          {/* Hàng nút Thao tác */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              disabled={isTesting || !formConfig.is_active}
              onClick={handleSendTest}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-sm border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Đang gửi tin test...</span>
                </>
              ) : (
                <>
                  <span>💬</span>
                  <span>Gửi tin nhắn test</span>
                </>
              )}
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-sm bg-[#e60049] text-white hover:bg-[#c4003e] shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu cấu hình Telegram</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
