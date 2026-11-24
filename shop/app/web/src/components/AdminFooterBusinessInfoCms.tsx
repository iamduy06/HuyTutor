import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { FooterBusinessInfo } from '../types';
import { getClientErrorMessage } from '../utils/errorHandler';

interface AdminFooterBusinessInfoCmsProps {
  showToast?: (msg: string) => void;
}

export const AdminFooterBusinessInfoCms: React.FC<AdminFooterBusinessInfoCmsProps> = ({
  showToast: propShowToast,
}) => {
  const { siteConfigs, updateSiteConfig, showToast: storeShowToast } = useStore();
  const showToast = propShowToast || storeShowToast;

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [formConfig, setFormConfig] = useState<FooterBusinessInfo>({
    business_name: '',
    address: '',
    zalo: '',
    email: '',
    companion_message: '',
  });

  // Đồng bộ cấu hình từ siteConfigs khi có thay đổi
  useEffect(() => {
    if (siteConfigs?.footer_business_info) {
      setFormConfig({
        business_name: siteConfigs.footer_business_info.business_name || '',
        address: siteConfigs.footer_business_info.address || '',
        zalo: siteConfigs.footer_business_info.zalo || '',
        email: siteConfigs.footer_business_info.email || '',
        companion_message: siteConfigs.footer_business_info.companion_message || '',
      });
    }
  }, [siteConfigs?.footer_business_info]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSiteConfig('footer_business_info', formConfig);
      showToast('Đã lưu cấu hình thông tin Hộ kinh doanh Footer thành công!');
    } catch (err: any) {
      const errorMsg = getClientErrorMessage(err, true);
      showToast(errorMsg || 'Lỗi khi lưu cấu hình thông tin Hộ kinh doanh Footer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToCurrent = () => {
    if (siteConfigs?.footer_business_info) {
      setFormConfig({
        business_name: siteConfigs.footer_business_info.business_name || '',
        address: siteConfigs.footer_business_info.address || '',
        zalo: siteConfigs.footer_business_info.zalo || '',
        email: siteConfigs.footer_business_info.email || '',
        companion_message: siteConfigs.footer_business_info.companion_message || '',
      });
      showToast('Đã khôi phục lại dữ liệu hiện tại.');
    }
  };

  const statusBadge = formConfig.business_name?.trim()
    ? formConfig.business_name.trim()
    : 'CHƯA CẤU HÌNH';

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
            THÔNG TIN FOOTER
          </span>
          <h2 className="text-xs sm:text-sm font-black text-gray-900 uppercase">
            [CẤU HÌNH THÔNG TIN HỘ KINH DOANH FOOTER] - [QUẢN LÝ TÊN HỘ KINH DOANH, ĐỊA CHỈ, SỐ ZALO, EMAIL VÀ THÔNG ĐIỆP ĐỒNG HÀNH HIỂN THỊ TẠI CỘT 2 FOOTER]
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-sm max-w-[200px] truncate ${
              formConfig.business_name?.trim()
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
            title={statusBadge}
          >
            {statusBadge}
          </span>
          <span className="text-gray-600 p-1 flex items-center justify-center">
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        </div>
      </div>

      {/* Nội dung Khối CMS */}
      {isExpanded && (
        <form onSubmit={handleSave} className="p-5 space-y-6">
          {/* Khung Live Preview trực quan */}
          <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                XEM TRƯỚC HIỂN THỊ THỰC TẾ (CỘT 2 FOOTER)
              </span>
              <span className="text-[10px] text-gray-400 italic">Mô phỏng màu sắc &amp; font chữ Footer</span>
            </div>
            <div className="bg-[#fff0f3] p-4 rounded-sm border border-pink-100 text-[11px] text-gray-700 space-y-2 leading-relaxed">
              {formConfig.business_name?.trim() ? (
                <p className="font-bold text-gray-900 uppercase">{formConfig.business_name.trim()}</p>
              ) : (
                <p className="font-bold text-gray-400 italic uppercase">(Chưa nhập tên Hộ kinh doanh)</p>
              )}

              {formConfig.address?.trim() ? (
                <p>Địa chỉ: {formConfig.address.trim()}</p>
              ) : (
                <p className="text-gray-400 italic">Địa chỉ: (Chưa nhập địa chỉ)</p>
              )}

              {formConfig.zalo?.trim() ? (
                <p>Zalo: {formConfig.zalo.trim()}</p>
              ) : (
                <p className="text-gray-400 italic">Zalo: (Chưa nhập số Zalo)</p>
              )}

              {formConfig.email?.trim() ? (
                <p>Email: {formConfig.email.trim()}</p>
              ) : (
                <p className="text-gray-400 italic">Email: (Chưa nhập email)</p>
              )}

              {formConfig.companion_message?.trim() ? (
                <p>{formConfig.companion_message.trim()}</p>
              ) : (
                <p className="text-gray-400 italic">(Chưa nhập thông điệp đồng hành)</p>
              )}
            </div>
          </div>

          {/* Form nhập liệu 5 trường */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trường 1: Tên Hộ kinh doanh */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-gray-800">
                1. Tên Hộ Kinh Doanh / Đơn Vị <span className="text-[#e60049]">*</span>
              </label>
              <input
                type="text"
                value={formConfig.business_name || ''}
                onChange={(e) => setFormConfig({ ...formConfig, business_name: e.target.value })}
                placeholder="HỘ KINH DOANH HUY CRECOM"
                className="w-full text-xs border border-gray-300 rounded-sm px-3 py-2 font-semibold uppercase focus:outline-none focus:border-[#e60049] focus:ring-1 focus:ring-[#e60049]"
              />
              <p className="text-[10px] text-gray-500">
                Hiển thị ở dòng đầu tiên của Cột 2 Footer, chữ in đậm và viết hoa.
              </p>
            </div>

            {/* Trường 2: Địa chỉ */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-gray-800">
                2. Địa Chỉ Hoạt Động / Đăng Ký
              </label>
              <input
                type="text"
                value={formConfig.address || ''}
                onChange={(e) => setFormConfig({ ...formConfig, address: e.target.value })}
                placeholder="Phường An Khánh, thành phố Hồ Chí Minh"
                className="w-full text-xs border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:border-[#e60049] focus:ring-1 focus:ring-[#e60049]"
              />
              <p className="text-[10px] text-gray-500">
                Hiển thị sau tiền tố &quot;Địa chỉ: &quot; ở dòng thứ hai.
              </p>
            </div>

            {/* Trường 3: Số Zalo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800">
                3. Số Điện Thoại Zalo
              </label>
              <input
                type="text"
                value={formConfig.zalo || ''}
                onChange={(e) => setFormConfig({ ...formConfig, zalo: e.target.value })}
                placeholder="0358999147"
                className="w-full text-xs border border-gray-300 rounded-sm px-3 py-2 font-mono focus:outline-none focus:border-[#e60049] focus:ring-1 focus:ring-[#e60049]"
              />
              <p className="text-[10px] text-gray-500">
                Hiển thị sau tiền tố &quot;Zalo: &quot; ở dòng thứ ba.
              </p>
            </div>

            {/* Trường 4: Email liên hệ */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800">
                4. Email Liên Hệ
              </label>
              <input
                type="email"
                value={formConfig.email || ''}
                onChange={(e) => setFormConfig({ ...formConfig, email: e.target.value })}
                placeholder="huymdcc@gmail.com"
                className="w-full text-xs border border-gray-300 rounded-sm px-3 py-2 font-mono focus:outline-none focus:border-[#e60049] focus:ring-1 focus:ring-[#e60049]"
              />
              <p className="text-[10px] text-gray-500">
                Hiển thị sau tiền tố &quot;Email: &quot; ở dòng thứ tư.
              </p>
            </div>

            {/* Trường 5: Lời chào / Thông điệp đồng hành */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-xs font-bold text-gray-800">
                5. Thông Điệp / Lời Chào Đồng Hành
              </label>
              <textarea
                rows={2}
                value={formConfig.companion_message || ''}
                onChange={(e) => setFormConfig({ ...formConfig, companion_message: e.target.value })}
                placeholder="Hân hạnh được đồng hành lâu dài cùng Quý Thầy/Cô và các bạn!"
                className="w-full text-xs border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:border-[#e60049] focus:ring-1 focus:ring-[#e60049]"
              />
              <p className="text-[10px] text-gray-500">
                Dòng chữ thông điệp trang trọng ở cuối Cột 2 của Footer.
              </p>
            </div>
          </div>

          {/* Thanh nút bấm hành động */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleResetToCurrent}
              disabled={isSaving}
              className="text-xs text-gray-600 hover:text-gray-900 font-bold px-3 py-2 rounded-sm border border-gray-300 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
            >
              Khôi phục dữ liệu ban đầu
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#e60049] hover:bg-[#cc0041] text-white font-extrabold text-xs px-6 py-2 rounded-sm transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>Lưu Cấu Hình Doanh Nghiệp</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
