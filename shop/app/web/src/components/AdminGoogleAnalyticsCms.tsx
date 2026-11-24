import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { GoogleAnalyticsConfig } from '../types';
import { getClientErrorMessage } from '../utils/errorHandler';

interface AdminGoogleAnalyticsCmsProps {
  showToast?: (msg: string) => void;
}

export const AdminGoogleAnalyticsCms: React.FC<AdminGoogleAnalyticsCmsProps> = ({ showToast: propShowToast }) => {
  const { siteConfigs, updateSiteConfig, showToast: storeShowToast } = useStore();
  const showToast = propShowToast || storeShowToast;

  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [formConfig, setFormConfig] = useState<GoogleAnalyticsConfig>({
    is_active: true,
    measurement_id: '',
    gtm_id: '',
    track_pageviews: true,
    track_ecommerce: true,
  });

  // Đồng bộ cấu hình từ siteConfigs
  useEffect(() => {
    if (siteConfigs?.google_analytics) {
      setFormConfig({
        is_active: siteConfigs.google_analytics.is_active ?? true,
        measurement_id: siteConfigs.google_analytics.measurement_id || '',
        gtm_id: siteConfigs.google_analytics.gtm_id || '',
        track_pageviews: siteConfigs.google_analytics.track_pageviews ?? true,
        track_ecommerce: siteConfigs.google_analytics.track_ecommerce ?? true,
      });
    }
  }, [siteConfigs?.google_analytics]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSiteConfig('google_analytics', formConfig);
      showToast('Đã lưu cấu hình Google Analytics thành công!');
    } catch (err: any) {
      const errorMsg = getClientErrorMessage(err, true);
      showToast(errorMsg || 'Lỗi khi lưu cấu hình Google Analytics.');
    } finally {
      setIsSaving(false);
    }
  };

  const statusBadge = formConfig.is_active && formConfig.measurement_id.trim()
    ? `ĐANG KẾT NỐI (${formConfig.measurement_id.trim()})`
    : 'ĐANG TẮT';

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
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-blue-600 text-white tracking-wider">
            GOOGLE ANALYTICS 4
          </span>
          <h2 className="text-xs sm:text-sm font-black text-gray-900 uppercase">
            [CẤU HÌNH GOOGLE ANALYTICS] - [QUẢN LÝ MÃ ĐO LƯỜNG VÀ THEO DÕI LƯU LƯỢNG TRUY CẬP WEBSITE]
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-sm ${
              formConfig.is_active && formConfig.measurement_id.trim()
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {statusBadge}
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
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-600"
              />
              <span className="text-xs font-bold text-gray-800">Bật Google Analytics</span>
            </label>

            {/* Toggle Pageviews */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.track_pageviews ?? true}
                disabled={!formConfig.is_active}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, track_pageviews: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-600 disabled:opacity-50"
              />
              <span className={`text-xs font-bold ${formConfig.is_active ? 'text-gray-800' : 'text-gray-400'}`}>
                Theo dõi chuyển trang SPA (Pageviews)
              </span>
            </label>

            {/* Toggle E-commerce */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formConfig.track_ecommerce ?? true}
                disabled={!formConfig.is_active}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, track_ecommerce: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-600 disabled:opacity-50"
              />
              <span className={`text-xs font-bold ${formConfig.is_active ? 'text-gray-800' : 'text-gray-400'}`}>
                Theo dõi sự kiện mua sắm (E-commerce)
              </span>
            </label>
          </div>

          {/* Cấu hình Measurement ID và GTM ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mã đo lường Google Analytics 4 (Measurement ID)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: G-H2SNLBF2VH"
                value={formConfig.measurement_id}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, measurement_id: e.target.value }))}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-600 font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Được cấp từ Google Analytics (Luồng dữ liệu web). Định dạng chuẩn: <code className="bg-gray-100 px-1 py-0.5 rounded-xs text-gray-700">G-XXXXXXXXXX</code>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Mã vùng chứa Google Tag Manager (GTM ID - Tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: GTM-MTRDVN3N (nếu có)"
                value={formConfig.gtm_id || ''}
                onChange={(e) => setFormConfig((prev) => ({ ...prev, gtm_id: e.target.value }))}
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-blue-600 font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Định dạng chuẩn: <code className="bg-gray-100 px-1 py-0.5 rounded-xs text-gray-700">GTM-XXXXXXX</code>. Để trống nếu không sử dụng GTM.
              </p>
            </div>
          </div>

          {/* Hàng nút Thao tác */}
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-sm bg-blue-600 text-white hover:bg-blue-700 shadow-2xs transition disabled:opacity-50 cursor-pointer"
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
                <span>Lưu cấu hình Analytics</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
