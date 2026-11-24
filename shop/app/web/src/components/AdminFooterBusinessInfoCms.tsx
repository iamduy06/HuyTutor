import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  FooterBlockSection,
  FooterContentItem,
  FooterBrandConfig,
  FooterSocialLink,
  FooterPolicyLink,
} from '../types';
import { apiClient } from '../api/client';
import { getClientErrorMessage } from '../utils/errorHandler';

interface AdminFooterBusinessInfoCmsProps {
  showToast?: (msg: string) => void;
}

const EMPTY_BRAND: FooterBrandConfig = {
  logo_url: '',
  logo_alt: '',
  slogan: '',
  home_url: '',
};

export const AdminFooterBusinessInfoCms: React.FC<AdminFooterBusinessInfoCmsProps> = ({
  showToast: propShowToast,
}) => {
  const { siteConfigs, updateSiteConfig, showToast: storeShowToast } = useStore();
  const showToast = propShowToast || storeShowToast;

  // Trạng thái thu gọn/mở rộng khối chính (Mặc định thu gọn theo GEMINI.md)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [uploadingSocialIdx, setUploadingSocialIdx] = useState<number | null>(null);

  // Trạng thái thu gọn/mở rộng từng khối con bên trong (Mặc định thu gọn theo GEMINI.md)
  const [isPreviewExpanded, setIsPreviewExpanded] = useState<boolean>(false);
  const [isBrandExpanded, setIsBrandExpanded] = useState<boolean>(false);
  const [isSectionExpanded, setIsSectionExpanded] = useState<boolean>(false);
  const [isPoliciesExpanded, setIsPoliciesExpanded] = useState<boolean>(false);
  const [isSocialsExpanded, setIsSocialsExpanded] = useState<boolean>(false);

  // 1. Cấu hình Cột 1: Logo & Slogan (Không gán default value)
  const [brandConfig, setBrandConfig] = useState<FooterBrandConfig>(() => {
    return siteConfigs?.footer_brand || EMPTY_BRAND;
  });

  // 2. Cấu hình Cột 2: Tiêu đề Header & Các dòng nội dung (1 khối duy nhất, không lặp lại)
  const [header, setHeader] = useState<string>(() => {
    if (
      Array.isArray(siteConfigs?.footer_info_sections) &&
      siteConfigs.footer_info_sections.length > 0
    ) {
      return siteConfigs.footer_info_sections[0].header || '';
    }
    return '';
  });

  const [headerUrl, setHeaderUrl] = useState<string>(() => {
    if (
      Array.isArray(siteConfigs?.footer_info_sections) &&
      siteConfigs.footer_info_sections.length > 0
    ) {
      return siteConfigs.footer_info_sections[0].header_url || '';
    }
    return '';
  });

  const [items, setItems] = useState<FooterContentItem[]>(() => {
    if (
      Array.isArray(siteConfigs?.footer_info_sections) &&
      siteConfigs.footer_info_sections.length > 0
    ) {
      return Array.isArray(siteConfigs.footer_info_sections[0].items)
        ? siteConfigs.footer_info_sections[0].items
        : [];
    }
    return [];
  });

  // 3. Cấu hình Cột 3A: Liên kết Chính sách & Hỗ trợ Footer (Không gán default value)
  const [policies, setPolicies] = useState<FooterPolicyLink[]>(() => {
    return Array.isArray(siteConfigs?.footer_policy_links)
      ? siteConfigs.footer_policy_links
      : [];
  });

  // 4. Cấu hình Cột 3B: Đường dẫn Mạng xã hội Footer (Không gán default value)
  const [socials, setSocials] = useState<FooterSocialLink[]>(() => {
    return Array.isArray(siteConfigs?.footer_social_links)
      ? siteConfigs.footer_social_links
      : [];
  });

  // Đồng bộ cấu hình từ Store / DB
  useEffect(() => {
    if (siteConfigs?.footer_brand) {
      setBrandConfig({
        logo_url: siteConfigs.footer_brand.logo_url || '',
        logo_alt: siteConfigs.footer_brand.logo_alt || '',
        slogan: siteConfigs.footer_brand.slogan || '',
        home_url: siteConfigs.footer_brand.home_url || '',
      });
    }
    if (
      Array.isArray(siteConfigs?.footer_info_sections) &&
      siteConfigs.footer_info_sections.length > 0
    ) {
      const firstSec = siteConfigs.footer_info_sections[0];
      setHeader(firstSec.header || '');
      setHeaderUrl(firstSec.header_url || '');
      setItems(Array.isArray(firstSec.items) ? firstSec.items : []);
    }
    if (Array.isArray(siteConfigs?.footer_policy_links)) {
      setPolicies(siteConfigs.footer_policy_links);
    }
    if (Array.isArray(siteConfigs?.footer_social_links)) {
      setSocials(siteConfigs.footer_social_links);
    }
  }, [
    siteConfigs?.footer_brand,
    siteConfigs?.footer_info_sections,
    siteConfigs?.footer_policy_links,
    siteConfigs?.footer_social_links,
  ]);

  // ==========================================
  // XỬ LÝ ĐÓNG / MỞ TOÀN BỘ CÁC KHỐI CON
  // ==========================================
  const handleExpandAllSubBlocks = () => {
    setIsPreviewExpanded(true);
    setIsBrandExpanded(true);
    setIsSectionExpanded(true);
    setIsPoliciesExpanded(true);
    setIsSocialsExpanded(true);
  };

  const handleCollapseAllSubBlocks = () => {
    setIsPreviewExpanded(false);
    setIsBrandExpanded(false);
    setIsSectionExpanded(false);
    setIsPoliciesExpanded(false);
    setIsSocialsExpanded(false);
  };

  // ==========================================
  // XỬ LÝ CỘT 1: LOGO & SLOGAN
  // ==========================================
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const oldUrl = brandConfig.logo_url;
      const res = await apiClient.uploadFile(file, { folder: 'logos' });

      // Nếu ảnh cũ nằm trên R2, xóa file vật lý cũ
      if (oldUrl && oldUrl.startsWith('http') && oldUrl !== res.url) {
        apiClient.deleteR2File(oldUrl).catch((err) => {
          console.warn('[AdminFooterCms] Lỗi xóa ảnh R2 cũ:', err);
        });
      }

      setBrandConfig((prev) => ({
        ...prev,
        logo_url: res.url,
      }));
      showToast('Tải ảnh Logo lên Cloudflare R2 thành công!');
    } catch (err: any) {
      const errorMsg = getClientErrorMessage(err, true);
      showToast(errorMsg || 'Lỗi khi tải ảnh Logo lên R2.');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  const handleDeleteLogo = async () => {
    if (!brandConfig.logo_url) return;

    if (brandConfig.logo_url.startsWith('http')) {
      try {
        await apiClient.deleteR2File(brandConfig.logo_url);
      } catch (err) {
        console.warn('[AdminFooterCms] Lỗi xóa ảnh R2:', err);
      }
    }

    setBrandConfig((prev) => ({
      ...prev,
      logo_url: '',
    }));
    showToast('Đã xóa ảnh Logo trên R2.');
  };

  // ==========================================
  // XỬ LÝ CỘT 2: HEADER & CÁC DÒNG NỘI DUNG (1 KHỐI DUY NHẤT)
  // ==========================================
  const handleAddItem = () => {
    const newItem: FooterContentItem = {
      id: `item_${Date.now()}`,
      text: '',
      url: '',
    };
    setItems((prev) => [...prev, newItem]);
    setIsSectionExpanded(true);
  };

  const handleRemoveItem = (iIdx: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== iIdx));
  };

  const handleUpdateItem = (
    iIdx: number,
    field: 'text' | 'url',
    value: string
  ) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === iIdx ? { ...it, [field]: value } : it))
    );
  };

  // ==========================================
  // XỬ LÝ CỘT 3A: LIÊN KẾT CHÍNH SÁCH
  // ==========================================
  const handleAddPolicyRow = () => {
    const newId = `pol_${Date.now()}`;
    setPolicies((prev) => [
      ...prev,
      {
        id: newId,
        label: '',
        url: '',
        order_index: prev.length + 1,
        is_active: true,
      },
    ]);
    setIsPoliciesExpanded(true);
  };

  const handleDeletePolicyRow = (idx: number) => {
    setPolicies((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdatePolicy = (
    idx: number,
    field: keyof FooterPolicyLink,
    value: any
  ) => {
    setPolicies((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  // ==========================================
  // XỬ LÝ CỘT 3B: MẠNG XÃ HỘI & ICON R2
  // ==========================================
  const handleAddSocialRow = () => {
    const newId = `soc_${Date.now()}`;
    setSocials((prev) => [
      ...prev,
      {
        id: newId,
        platform: '',
        label: '',
        url: '',
        icon: '',
        icon_url: '',
        is_active: true,
      },
    ]);
    setIsSocialsExpanded(true);
  };

  const handleUploadSocialIcon = async (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSocialIdx(idx);
    try {
      const oldUrl = socials[idx]?.icon_url;
      const res = await apiClient.uploadFile(file, { folder: 'social-icons' });

      // Nếu đang thay thế ảnh cũ trên R2, xóa ảnh cũ vật lý
      if (oldUrl && oldUrl !== res.url) {
        apiClient.deleteR2File(oldUrl).catch((err) => {
          console.warn('[AdminFooterCms] Lỗi xóa file R2 cũ:', err);
        });
      }

      setSocials((prev) =>
        prev.map((s, i) =>
          i === idx ? { ...s, icon_url: res.url, icon: res.url } : s
        )
      );
      showToast('Tải ảnh biểu tượng lên Cloudflare R2 thành công!');
    } catch (err: any) {
      showToast(getClientErrorMessage(err, true) || 'Lỗi tải ảnh biểu tượng lên R2.');
    } finally {
      setUploadingSocialIdx(null);
      e.target.value = '';
    }
  };

  const handleDeleteSocialIcon = async (idx: number) => {
    const currentUrl =
      socials[idx]?.icon_url ||
      (socials[idx]?.icon?.startsWith('http') ? socials[idx]?.icon : '');

    if (currentUrl) {
      try {
        await apiClient.deleteR2File(currentUrl);
      } catch (err) {
        console.warn('[AdminFooterCms] Lỗi xóa file R2:', err);
      }
    }

    setSocials((prev) =>
      prev.map((s, i) =>
        i === idx
          ? {
              ...s,
              icon_url: '',
              icon: '',
            }
          : s
      )
    );
    showToast('Đã xóa hình ảnh biểu tượng khỏi Cloudflare R2.');
  };

  const handleDeleteSocialRow = async (idx: number) => {
    const soc = socials[idx];
    if (soc?.icon_url) {
      apiClient.deleteR2File(soc.icon_url).catch(() => {});
    } else if (soc?.icon && soc.icon.startsWith('http')) {
      apiClient.deleteR2File(soc.icon).catch(() => {});
    }
    setSocials((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateSocial = (
    idx: number,
    field: keyof FooterSocialLink,
    value: any
  ) => {
    setSocials((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  };

  // ==========================================
  // LƯU TOÀN BỘ CẤU HÌNH FOOTER (MASTER SAVE)
  // ==========================================
  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      // Làm sạch dữ liệu trước khi lưu
      const cleanedBrand: FooterBrandConfig = {
        logo_url: (brandConfig.logo_url || '').trim(),
        logo_alt: (brandConfig.logo_alt || '').trim(),
        slogan: (brandConfig.slogan || '').trim(),
        home_url: (brandConfig.home_url || '').trim() || '/',
      };

      const cleanedSections: FooterBlockSection[] = [
        {
          id: 'main',
          header: header.trim(),
          header_url: headerUrl.trim(),
          items: items.map((it, idx) => ({
            id: it.id || `item_${idx + 1}`,
            text: (it.text || '').trim(),
            url: (it.url || '').trim(),
          })),
        },
      ];

      const cleanedPolicies: FooterPolicyLink[] = policies.map((pol, idx) => ({
        id: pol.id || `pol_${idx + 1}`,
        label: (pol.label || '').trim(),
        url: (pol.url || '').trim(),
        order_index: Number(pol.order_index) || idx + 1,
        is_active: Boolean(pol.is_active),
      }));

      const cleanedSocials: FooterSocialLink[] = socials.map((soc, idx) => ({
        id: soc.id || `soc_${idx + 1}`,
        platform: (soc.platform || '').trim(),
        label: (soc.label || '').trim(),
        url: (soc.url || '').trim(),
        icon: (soc.icon || '').trim(),
        icon_url: (soc.icon_url || '').trim(),
        is_active: Boolean(soc.is_active),
      }));

      await Promise.all([
        updateSiteConfig('footer_brand', cleanedBrand),
        updateSiteConfig('footer_info_sections', cleanedSections),
        updateSiteConfig('footer_policy_links', cleanedPolicies),
        updateSiteConfig('footer_social_links', cleanedSocials),
      ]);

      showToast('Đã lưu thành công toàn bộ cấu hình Footer vào cơ sở dữ liệu!');
    } catch (err: unknown) {
      console.error('[AdminFooterCms] Lỗi khi lưu cấu hình Footer:', err);
      showToast(getClientErrorMessage(err, true));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm shadow-xs overflow-hidden">
      {/* ========================================================= */}
      {/* THANH TIÊU ĐỀ KHỐI CHÍNH (BẤM ĐỂ MỞ RỘNG / THU GỌN)        */}
      {/* ========================================================= */}
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
            [CẤU HÌNH TOÀN DIỆN CHÂN TRANG (FOOTER)] - [QUẢN LÝ TẬP TRUNG LOGO, SLOGAN, TIÊU ĐỀ HEADER, DÒNG NỘI DUNG, LIÊN KẾT CHÍNH SÁCH VÀ MẠNG XÃ HỘI TẠI FOOTER]
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
            {items.length} DÒNG NỘI DUNG • {policies.length} CHÍNH SÁCH • {socials.length} KÊNH MXH
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

      {/* Nội dung Khối CMS Khi mở rộng */}
      {isExpanded && (
        <form onSubmit={handleSaveAll} className="p-5 space-y-5">
          {/* ========================================================= */}
          {/* THANH CÔNG CỤ MỞ RỘNG / THU GỌN TẤT CẢ CÁC KHỐI CON       */}
          {/* ========================================================= */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-200 flex-wrap gap-2">
            <span className="text-[11px] font-bold text-gray-600">
              CÁC PHÂN ĐOẠN CẤU HÌNH FOOTER (BẤM THANH TIÊU ĐỀ ĐỂ ĐÓNG/MỞ):
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAllSubBlocks}
                className="text-[11px] text-[#e60049] hover:underline font-bold cursor-pointer px-2.5 py-1 bg-white border border-pink-200 rounded-sm shadow-2xs hover:bg-pink-50 transition"
              >
                ⊞ Mở rộng tất cả khối
              </button>
              <button
                type="button"
                onClick={handleCollapseAllSubBlocks}
                className="text-[11px] text-gray-600 hover:underline font-bold cursor-pointer px-2.5 py-1 bg-white border border-gray-300 rounded-sm shadow-2xs hover:bg-gray-50 transition"
              >
                ⊟ Thu gọn tất cả khối
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* KHUNG LIVE PREVIEW TRỰC QUAN MÔ PHỎNG ĐỦ 3 CỘT THỰC TẾ    */}
          {/* ========================================================= */}
          <div className="border border-gray-200 rounded-sm bg-white overflow-hidden shadow-2xs">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsPreviewExpanded(!isPreviewExpanded);
                }
              }}
              className="w-full flex items-center justify-between p-3 bg-gray-50/70 border-b border-gray-200 cursor-pointer select-none transition hover:bg-gray-100/70"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                  LIVE PREVIEW
                </span>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                  XEM TRƯỚC HIỂN THỊ THỰC TẾ CHÂN TRANG (MÔ PHỎNG TOÀN DIỆN 3 CỘT)
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 italic hidden sm:inline">
                  Tương thích 100% với giao diện khách hàng
                </span>
                <span className="text-gray-600 p-1 flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isPreviewExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {isPreviewExpanded && (
              <div className="p-4 bg-gray-50/50">
                <div className="bg-[#fff0f3] p-5 rounded-sm border border-pink-100 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  {/* Cột 1 Live Preview: Logo & Slogan */}
                  <div className="md:col-span-3 flex flex-col items-start gap-1">
                    {brandConfig.logo_url ? (
                      <img
                        src={brandConfig.logo_url}
                        alt={brandConfig.logo_alt || 'Logo'}
                        className="h-8 w-auto object-contain"
                      />
                    ) : (
                      <div className="text-[10px] text-gray-400 italic">(Chưa có Logo)</div>
                    )}
                    {brandConfig.slogan ? (
                      <div className="text-[10px] text-gray-500 font-medium">
                        {brandConfig.slogan}
                      </div>
                    ) : null}
                  </div>

                  {/* Cột 2 Live Preview: Header & Content lines */}
                  <div className="md:col-span-5 text-[11px] text-gray-700 space-y-2 leading-relaxed">
                    {header ? (
                      headerUrl.trim() ? (
                        <a
                          href={headerUrl.trim()}
                          target={headerUrl.startsWith('http') ? '_blank' : undefined}
                          rel="noreferrer"
                          className="font-bold text-gray-900 uppercase hover:text-[#e60049] transition inline-flex items-center gap-1"
                        >
                          <span>{header}</span>
                          <span className="text-[9px] text-[#e60049] font-normal lowercase font-mono">🔗 link</span>
                        </a>
                      ) : (
                        <p className="font-bold text-gray-900 uppercase">{header}</p>
                      )
                    ) : (
                      <p className="font-bold text-gray-400 italic uppercase">
                        (Chưa nhập tiêu đề Header)
                      </p>
                    )}

                    {items.length === 0 ? (
                      <p className="text-gray-400 italic text-[10px]">(Chưa có dòng nội dung)</p>
                    ) : (
                      items.map((item, iIdx) => {
                        if (!item.text?.trim()) {
                          return (
                            <p key={item.id || iIdx} className="text-gray-400 italic text-[10px]">
                              (Dòng #{iIdx + 1}: Chưa nhập nội dung)
                            </p>
                          );
                        }

                        if (item.url?.trim()) {
                          return (
                            <div key={item.id || iIdx} className="flex items-center gap-1.5">
                              <a
                                href={item.url.trim()}
                                target={item.url.startsWith('http') ? '_blank' : undefined}
                                rel="noreferrer"
                                className="text-blue-700 hover:text-[#e60049] hover:underline transition font-medium"
                                title={`Liên kết tới: ${item.url}`}
                              >
                                {item.text}
                              </a>
                              <span className="text-[9px] text-gray-400 font-mono">({item.url.trim()})</span>
                            </div>
                          );
                        }

                        return <p key={item.id || iIdx}>{item.text}</p>;
                      })
                    )}
                  </div>

                  {/* Cột 3 Live Preview: Điều khoản, Chính sách & Mạng xã hội */}
                  <div className="md:col-span-4 text-[11px] text-gray-700 space-y-3">
                    {/* Danh sách chính sách */}
                    <div className="space-y-1.5">
                      {policies
                        .filter((p) => p.is_active)
                        .map((pol, idx) => (
                          <div key={pol.id || idx}>
                            <a
                              href={pol.url}
                              className="hover:text-[#e60049] transition text-gray-700 hover:underline block"
                            >
                              {pol.label}
                            </a>
                          </div>
                        ))}
                    </div>

                    {/* Các kênh mạng xã hội */}
                    <div className="pt-2 border-t border-pink-200/60">
                      <div className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase">
                        Kênh kết nối chính thức:
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {socials
                          .filter((s) => s.is_active)
                          .map((soc, idx) => {
                            const hasImg = !!(
                              soc.icon_url ||
                              (soc.icon &&
                                (soc.icon.startsWith('http') ||
                                  soc.icon.startsWith('/') ||
                                  soc.icon.startsWith('data:')))
                            );
                            const imgSrc = soc.icon_url || (hasImg ? soc.icon : '');

                            return (
                              <a
                                key={soc.id || idx}
                                href={soc.url}
                                target="_blank"
                                rel="noreferrer"
                                title={soc.label || soc.platform}
                                className="w-7 h-7 rounded-sm bg-white border border-pink-200 flex items-center justify-center text-xs font-bold text-gray-700 hover:border-[#e60049] hover:text-[#e60049] transition shadow-2xs overflow-hidden"
                              >
                                {hasImg ? (
                                  <img
                                    src={imgSrc}
                                    alt={soc.label}
                                    className="w-full h-full object-contain p-0.5"
                                  />
                                ) : (
                                  <span>{soc.icon || soc.platform.charAt(0).toUpperCase()}</span>
                                )}
                              </a>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* PHẦN 1: CẤU HÌNH LOGO & SLOGAN (CỘT 1 FOOTER)             */}
          {/* ========================================================= */}
          <div className="border border-gray-200 rounded-sm bg-white overflow-hidden shadow-2xs">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsBrandExpanded(!isBrandExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsBrandExpanded(!isBrandExpanded);
                }
              }}
              className="w-full flex items-center justify-between p-3 bg-gray-50/70 border-b border-gray-200 cursor-pointer select-none transition hover:bg-gray-100/70"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#e60049] text-white text-[10px] font-black px-2 py-0.5 rounded-sm">
                  CỘT 1
                </span>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                  CẤU HÌNH LOGO &amp; SLOGAN THƯƠNG HIỆU
                </h3>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-sm bg-gray-100 text-gray-700">
                  {brandConfig.logo_url ? 'Đã có Logo' : 'Chưa có Logo'}
                  {brandConfig.slogan ? ' • Có Slogan' : ''}
                </span>
                <span className="text-gray-600 p-1 flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isBrandExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {isBrandExpanded && (
              <div className="p-4 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 border border-gray-200 rounded-sm">
                  {/* Ảnh Logo */}
                  <div className="md:col-span-5 space-y-2">
                    <label className="block text-xs font-bold text-gray-800">
                      Ảnh Logo Footer
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="relative inline-flex items-center justify-center h-14 w-28 bg-[#fff0f3] border border-gray-300 rounded p-1 group">
                        {brandConfig.logo_url ? (
                          <>
                            <img
                              src={brandConfig.logo_url}
                              alt={brandConfig.logo_alt || 'Logo Footer'}
                              className="max-h-full max-w-full object-contain"
                            />
                            <button
                              type="button"
                              onClick={handleDeleteLogo}
                              title="Xóa ảnh Logo vĩnh viễn khỏi Cloudflare R2"
                              className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] shadow border border-white cursor-pointer transition"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic text-center px-1">
                            (Chưa có ảnh Logo)
                          </span>
                        )}
                      </div>

                      <label
                        className={`inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-dashed border-gray-300 hover:border-[#e60049] text-gray-700 hover:text-[#e60049] rounded cursor-pointer text-xs font-bold transition shadow-2xs ${
                          isUploadingLogo ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <span>{isUploadingLogo ? 'Đang tải lên R2...' : '📤 Tải ảnh Logo lên R2'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadLogo}
                          disabled={isUploadingLogo}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-gray-500">
                      Ảnh sẽ được tải trực tiếp lên Cloudflare R2 theo định dạng chuẩn 12 chữ số.
                    </p>
                  </div>

                  {/* Dòng chữ Slogan */}
                  <div className="md:col-span-4 space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800">
                      Dòng chữ Slogan (Phụ đề dưới Logo)
                    </label>
                    <input
                      type="text"
                      value={brandConfig.slogan || ''}
                      onChange={(e) => setBrandConfig({ ...brandConfig, slogan: e.target.value })}
                      placeholder="Nhập slogan thương hiệu (nếu có)..."
                      className="w-full text-xs border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:border-[#e60049]"
                    />
                    <p className="text-[10px] text-gray-500">
                      Hiển thị ngay dưới ảnh Logo ở Cột 1 Footer.
                    </p>
                  </div>

                  {/* Đường dẫn khi click Logo */}
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="block text-xs font-bold text-gray-800">
                      Link khi bấm vào Logo
                    </label>
                    <input
                      type="text"
                      value={brandConfig.home_url || '/'}
                      onChange={(e) => setBrandConfig({ ...brandConfig, home_url: e.target.value })}
                      placeholder="/"
                      className="w-full text-xs border border-gray-300 rounded-sm px-3 py-2 font-mono text-gray-700 focus:outline-none focus:border-[#e60049]"
                    />
                    <p className="text-[10px] text-gray-500">
                      Mặc định là trang chủ (&quot;/&quot;).
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* PHẦN 2: CẤU HÌNH TIÊU ĐỀ & NỘI DUNG FOOTER (CỘT 2)        */}
          {/* ========================================================= */}
          <div className="border border-gray-200 rounded-sm bg-white overflow-hidden shadow-2xs">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsSectionExpanded(!isSectionExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsSectionExpanded(!isSectionExpanded);
                }
              }}
              className="w-full flex items-center justify-between p-3 bg-gray-50/70 border-b border-gray-200 cursor-pointer select-none transition hover:bg-gray-100/70"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#e60049] text-white text-[10px] font-black px-2 py-0.5 rounded-sm">
                  CỘT 2
                </span>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                  CẤU HÌNH TIÊU ĐỀ &amp; DÒNG NỘI DUNG FOOTER
                </h3>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
                  {items.length} DÒNG NỘI DUNG
                </span>
                <span className="text-gray-600 p-1 flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isSectionExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {isSectionExpanded && (
              <div className="p-4 bg-gray-50/50 space-y-4">
                {/* Ô nhập tiêu đề và link của Header */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3 border border-gray-200 rounded-sm">
                  <div className="md:col-span-7 space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700">
                      Tiêu đề Header (in đậm, viết hoa) <span className="text-[#e60049]">*</span>
                    </label>
                    <input
                      type="text"
                      value={header}
                      onChange={(e) => setHeader(e.target.value)}
                      placeholder="VD: HỘ KINH DOANH HUY CRECOM"
                      className="w-full text-xs border border-gray-300 rounded-sm px-2.5 py-1.5 font-bold uppercase focus:outline-none focus:border-[#e60049]"
                    />
                  </div>

                  <div className="md:col-span-5 space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700">
                      Link cho Header (Tùy chọn - để trống nếu không click)
                    </label>
                    <input
                      type="text"
                      value={headerUrl}
                      onChange={(e) => setHeaderUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs border border-gray-300 rounded-sm px-2.5 py-1.5 font-mono text-gray-700 focus:outline-none focus:border-[#e60049]"
                    />
                  </div>
                </div>

                {/* Bảng danh sách các dòng Content bên dưới Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-700 uppercase">
                      Các dòng nội dung (Content lines)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-[11px] text-[#e60049] hover:underline font-bold cursor-pointer"
                    >
                      + Thêm dòng Content
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-sm bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#fff0f3] text-gray-900 font-extrabold uppercase text-[10px]">
                        <tr>
                          <th className="border-b border-gray-200 p-2 w-12 text-center">STT</th>
                          <th className="border-b border-gray-200 p-2">Nội dung hiển thị (Văn bản thuần)</th>
                          <th className="border-b border-gray-200 p-2 w-72">
                            Đường dẫn liên kết (URL - Để trống nếu là plain text)
                          </th>
                          <th className="border-b border-gray-200 p-2 w-16 text-center">Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-gray-400 italic">
                              Chưa có dòng nội dung nào. Bấm &quot;+ Thêm dòng Content&quot; để thêm.
                            </td>
                          </tr>
                        ) : (
                          items.map((item, iIdx) => (
                            <tr
                              key={item.id || iIdx}
                              className="hover:bg-gray-50/80 border-b border-gray-100 last:border-b-0"
                            >
                              <td className="p-2 text-center text-gray-500 font-mono text-[11px]">
                                {iIdx + 1}
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.text}
                                  onChange={(e) => handleUpdateItem(iIdx, 'text', e.target.value)}
                                  placeholder="VD: Địa chỉ: Phường An Khánh... hoặc Zalo: 0358999147"
                                  className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs focus:outline-none focus:border-[#e60049]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.url || ''}
                                  onChange={(e) => handleUpdateItem(iIdx, 'url', e.target.value)}
                                  placeholder="VD: https://zalo.me/0358999147 hoặc mailto:..."
                                  className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-mono text-gray-700 focus:outline-none focus:border-[#e60049]"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(iIdx)}
                                  title="Xóa dòng này"
                                  className="w-5 h-5 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white rounded-full inline-flex items-center justify-center font-bold text-[10px] transition cursor-pointer"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* PHẦN 3: CẤU HÌNH LIÊN KẾT CHÍNH SÁCH (CỘT 3A FOOTER)      */}
          {/* ========================================================= */}
          <div className="border border-gray-200 rounded-sm bg-white overflow-hidden shadow-2xs">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsPoliciesExpanded(!isPoliciesExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsPoliciesExpanded(!isPoliciesExpanded);
                }
              }}
              className="w-full flex items-center justify-between p-3 bg-gray-50/70 border-b border-gray-200 cursor-pointer select-none transition hover:bg-gray-100/70"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#e60049] text-white text-[10px] font-black px-2 py-0.5 rounded-sm">
                  CỘT 3A
                </span>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                  CẤU HÌNH LIÊN KẾT CHÍNH SÁCH FOOTER
                </h3>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddPolicyRow();
                  }}
                  className="bg-white border border-gray-300 hover:border-[#e60049] text-gray-800 hover:text-[#e60049] font-bold text-xs px-2.5 py-1 rounded-sm transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>+ Thêm Liên Kết Chính Sách</span>
                </button>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-sm bg-purple-100 text-purple-800">
                  {policies.length} CHÍNH SÁCH
                </span>
                <span className="text-gray-600 p-1 flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isPoliciesExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {isPoliciesExpanded && (
              <div className="p-4 bg-gray-50/50">
                <div className="overflow-x-auto border border-gray-200 rounded-sm bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#fff0f3] text-gray-900 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="border-b border-gray-200 p-2.5 w-16 text-center">Thứ tự</th>
                        <th className="border-b border-gray-200 p-2.5 w-60">Tên liên kết (Label)</th>
                        <th className="border-b border-gray-200 p-2.5">Đường dẫn trang (URL)</th>
                        <th className="border-b border-gray-200 p-2.5 w-24 text-center">Hiển thị</th>
                        <th className="border-b border-gray-200 p-2.5 w-16 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policies.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-gray-400 italic">
                            Chưa có liên kết chính sách nào. Bấm &quot;+ Thêm Liên Kết Chính Sách&quot; để tạo.
                          </td>
                        </tr>
                      ) : (
                        policies.map((pol, idx) => (
                          <tr key={pol.id || idx} className="hover:bg-gray-50/80 border-b border-gray-100 last:border-b-0">
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                value={pol.order_index}
                                onChange={(e) =>
                                  handleUpdatePolicy(idx, 'order_index', Number(e.target.value))
                                }
                                className="w-12 border border-gray-300 rounded-sm text-center py-1 text-xs"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={pol.label}
                                onChange={(e) => handleUpdatePolicy(idx, 'label', e.target.value)}
                                placeholder="Tên chính sách..."
                                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-semibold focus:outline-none focus:border-[#e60049]"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={pol.url}
                                onChange={(e) => handleUpdatePolicy(idx, 'url', e.target.value)}
                                placeholder="/duong-dan..."
                                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-mono text-gray-700 focus:outline-none focus:border-[#e60049]"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={pol.is_active}
                                onChange={(e) =>
                                  handleUpdatePolicy(idx, 'is_active', e.target.checked)
                                }
                                className="w-4 h-4 text-[#e60049] rounded"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeletePolicyRow(idx)}
                                className="w-5 h-5 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white rounded-full inline-flex items-center justify-center font-bold text-[10px] transition cursor-pointer"
                                title="Xóa liên kết này"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* PHẦN 4: CẤU HÌNH MẠNG XÃ HỘI (CỘT 3B FOOTER)              */}
          {/* ========================================================= */}
          <div className="border border-gray-200 rounded-sm bg-white overflow-hidden shadow-2xs">
            <div
              role="button"
              tabIndex={0}
              onClick={() => setIsSocialsExpanded(!isSocialsExpanded)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setIsSocialsExpanded(!isSocialsExpanded);
                }
              }}
              className="w-full flex items-center justify-between p-3 bg-gray-50/70 border-b border-gray-200 cursor-pointer select-none transition hover:bg-gray-100/70"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-[#e60049] text-white text-[10px] font-black px-2 py-0.5 rounded-sm">
                  CỘT 3B
                </span>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                  CẤU HÌNH ĐƯỜNG DẪN MẠNG XÃ HỘI FOOTER
                </h3>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddSocialRow();
                  }}
                  className="bg-white border border-gray-300 hover:border-[#e60049] text-gray-800 hover:text-[#e60049] font-bold text-xs px-2.5 py-1 rounded-sm transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <span>+ Thêm Kênh MXH</span>
                </button>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-sm bg-pink-100 text-[#e60049]">
                  {socials.length} KÊNH MXH
                </span>
                <span className="text-gray-600 p-1 flex items-center justify-center">
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isSocialsExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
            </div>

            {isSocialsExpanded && (
              <div className="p-4 bg-gray-50/50">
                <div className="overflow-x-auto border border-gray-200 rounded-sm bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#fff0f3] text-gray-900 font-extrabold uppercase text-[10px]">
                      <tr>
                        <th className="border-b border-gray-200 p-2.5 w-28">Nền tảng</th>
                        <th className="border-b border-gray-200 p-2.5 w-36">Tên hiển thị</th>
                        <th className="border-b border-gray-200 p-2.5">Đường dẫn (URL chính thức)</th>
                        <th className="border-b border-gray-200 p-2.5 w-52 text-center">
                          Biểu tượng (Tải ảnh R2 / Ký tự)
                        </th>
                        <th className="border-b border-gray-200 p-2.5 w-20 text-center">Kích hoạt</th>
                        <th className="border-b border-gray-200 p-2.5 w-16 text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {socials.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400 italic">
                            Chưa có kênh mạng xã hội nào. Bấm &quot;+ Thêm Kênh MXH&quot; để tạo.
                          </td>
                        </tr>
                      ) : (
                        socials.map((soc, idx) => {
                          const hasImage = !!(
                            soc.icon_url ||
                            (soc.icon &&
                              (soc.icon.startsWith('http') ||
                                soc.icon.startsWith('/') ||
                                soc.icon.startsWith('data:')))
                          );
                          const imageSrc = soc.icon_url || (hasImage ? soc.icon : '');

                          return (
                            <tr
                              key={soc.id || idx}
                              className="hover:bg-gray-50/80 border-b border-gray-100 last:border-b-0"
                            >
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={soc.platform}
                                  onChange={(e) => handleUpdateSocial(idx, 'platform', e.target.value)}
                                  placeholder="Facebook, Zalo..."
                                  className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={soc.label}
                                  onChange={(e) => handleUpdateSocial(idx, 'label', e.target.value)}
                                  placeholder="Tên kênh..."
                                  className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={soc.url}
                                  onChange={(e) => handleUpdateSocial(idx, 'url', e.target.value)}
                                  placeholder="https://..."
                                  className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-mono text-gray-700"
                                />
                              </td>
                              <td className="p-2">
                                <div className="flex items-center justify-center gap-2">
                                  {hasImage ? (
                                    <div className="relative inline-flex items-center justify-center w-8 h-8 bg-gray-50 border border-gray-300 rounded p-0.5 group shrink-0">
                                      {/* Nút X đỏ hình tròn xóa vĩnh viễn trên R2 */}
                                      <button
                                        type="button"
                                        title="Xóa hình ảnh biểu tượng khỏi Cloudflare R2"
                                        onClick={() => handleDeleteSocialIcon(idx)}
                                        className="absolute -top-2 -right-2 z-10 w-4.5 h-4.5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-[9px] shadow border border-white cursor-pointer transition"
                                      >
                                        ✕
                                      </button>
                                      <img
                                        src={imageSrc}
                                        alt={soc.label}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                  ) : null}

                                  {/* Nút tải ảnh hoặc đổi ảnh */}
                                  <label
                                    className={`inline-flex items-center gap-1 px-2 py-1 bg-white border border-dashed border-gray-300 hover:border-[#e60049] text-gray-700 hover:text-[#e60049] rounded cursor-pointer text-[10px] font-bold transition shrink-0 ${
                                      uploadingSocialIdx === idx ? 'opacity-50 pointer-events-none' : ''
                                    }`}
                                  >
                                    {uploadingSocialIdx === idx ? (
                                      <span className="text-[#e60049]">Đang tải...</span>
                                    ) : (
                                      <span>{hasImage ? '🔄 Đổi ảnh' : '📤 Tải ảnh'}</span>
                                    )}
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleUploadSocialIcon(e, idx)}
                                      disabled={uploadingSocialIdx === idx}
                                      className="hidden"
                                    />
                                  </label>

                                  {/* Nhập text ký tự dự phòng nếu không có ảnh */}
                                  {!hasImage && (
                                    <input
                                      type="text"
                                      title="Ký tự văn bản hiển thị nếu chưa có ảnh (ví dụ: f, ▶, Zalo)"
                                      value={soc.icon || ''}
                                      placeholder="Ký tự"
                                      onChange={(e) =>
                                        handleUpdateSocial(idx, 'icon', e.target.value)
                                      }
                                      className="w-12 border border-gray-300 rounded text-center py-1 text-xs shrink-0"
                                    />
                                  )}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={soc.is_active}
                                  onChange={(e) =>
                                    handleUpdateSocial(idx, 'is_active', e.target.checked)
                                  }
                                  className="w-4 h-4 text-[#e60049] rounded"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSocialRow(idx)}
                                  className="w-5 h-5 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white rounded-full inline-flex items-center justify-center font-bold text-[10px] transition cursor-pointer"
                                  title="Xóa kênh này"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* THANH NÚT BẤM HÀNH ĐỘNG MASTER                            */}
          {/* ========================================================= */}
          <div className="flex items-center justify-end border-t border-gray-200 pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#e60049] hover:bg-[#cc0041] text-white font-extrabold text-xs px-6 py-2.5 rounded-sm transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <svg
                    className="animate-spin h-3.5 w-3.5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                  <span>Đang lưu toàn bộ Footer...</span>
                </>
              ) : (
                <span>💾 Lưu Toàn Bộ Cấu Hình Footer</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export const AdminFooterCms = AdminFooterBusinessInfoCms;
