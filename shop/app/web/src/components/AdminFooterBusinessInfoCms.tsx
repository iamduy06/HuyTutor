import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { FooterBlockSection, FooterContentItem, FooterBrandConfig } from '../types';
import { apiClient } from '../api/client';
import { getClientErrorMessage } from '../utils/errorHandler';

interface AdminFooterBusinessInfoCmsProps {
  showToast?: (msg: string) => void;
}

const DEFAULT_BRAND: FooterBrandConfig = {
  logo_url: '/logo.png',
  logo_alt: 'Huy Tutor',
  slogan: 'Chuẩn mực & Chi tiết',
  home_url: '/',
};

const DEFAULT_SECTIONS: FooterBlockSection[] = [
  {
    id: 'sec_main',
    header: 'HỘ KINH DOANH HUY CRECOM',
    header_url: '',
    items: [
      {
        id: 'item_1',
        text: 'Địa chỉ: Phường An Khánh, thành phố Hồ Chí Minh',
        url: '',
      },
      {
        id: 'item_2',
        text: 'Zalo: 0358999147',
        url: 'https://zalo.me/0358999147',
      },
      {
        id: 'item_3',
        text: 'Email: huymdcc@gmail.com',
        url: 'mailto:huymdcc@gmail.com',
      },
      {
        id: 'item_4',
        text: 'Hân hạnh được đồng hành lâu dài cùng Quý Thầy/Cô và các bạn!',
        url: '',
      },
    ],
  },
];

export const AdminFooterBusinessInfoCms: React.FC<AdminFooterBusinessInfoCmsProps> = ({
  showToast: propShowToast,
}) => {
  const { siteConfigs, updateSiteConfig, showToast: storeShowToast } = useStore();
  const showToast = propShowToast || storeShowToast;

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);

  // Cấu hình Cột 1: Logo & Slogan
  const [brandConfig, setBrandConfig] = useState<FooterBrandConfig>(() => {
    return siteConfigs?.footer_brand || DEFAULT_BRAND;
  });

  // Cấu hình Cột 2: Các khối Header & Content
  const [sections, setSections] = useState<FooterBlockSection[]>(() => {
    if (
      Array.isArray(siteConfigs?.footer_info_sections) &&
      siteConfigs.footer_info_sections.length > 0
    ) {
      return siteConfigs.footer_info_sections;
    }
    return DEFAULT_SECTIONS;
  });

  // Đồng bộ cấu hình từ siteConfigs
  useEffect(() => {
    if (siteConfigs?.footer_brand) {
      setBrandConfig({
        logo_url: siteConfigs.footer_brand.logo_url || '/logo.png',
        logo_alt: siteConfigs.footer_brand.logo_alt || 'Huy Tutor',
        slogan: siteConfigs.footer_brand.slogan ?? 'Chuẩn mực & Chi tiết',
        home_url: siteConfigs.footer_brand.home_url || '/',
      });
    }
    if (
      Array.isArray(siteConfigs?.footer_info_sections) &&
      siteConfigs.footer_info_sections.length > 0
    ) {
      setSections(siteConfigs.footer_info_sections);
    }
  }, [siteConfigs?.footer_brand, siteConfigs?.footer_info_sections]);

  // Upload Logo lên Cloudflare R2
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

  // Xóa ảnh Logo trên Cloudflare R2 (quay về logo mặc định /logo.png)
  const handleDeleteLogo = async () => {
    const currentUrl = brandConfig.logo_url;
    if (currentUrl && currentUrl.startsWith('http')) {
      try {
        await apiClient.deleteR2File(currentUrl);
      } catch (err) {
        console.warn('[AdminFooterCms] Lỗi xóa file R2:', err);
      }
    }
    setBrandConfig((prev) => ({
      ...prev,
      logo_url: '/logo.png',
    }));
    showToast('Đã xóa ảnh Logo trên R2, quay về Logo mặc định.');
  };

  // Lưu toàn bộ cấu hình Footer (Logo, Slogan, Header, Content)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSiteConfig('footer_brand', brandConfig);
      await updateSiteConfig('footer_info_sections', sections);
      showToast('Đã lưu cấu hình Footer (Logo, Slogan & Nội dung) thành công!');
    } catch (err: any) {
      const errorMsg = getClientErrorMessage(err, true);
      showToast(errorMsg || 'Lỗi khi lưu cấu hình Footer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setBrandConfig(DEFAULT_BRAND);
    setSections(DEFAULT_SECTIONS);
    showToast('Đã đặt lại cấu hình mẫu ban đầu (chưa lưu vào DB cho đến khi bấm Lưu).');
  };

  // Thao tác khối Header
  const handleAddSection = () => {
    const newSec: FooterBlockSection = {
      id: `sec_${Date.now()}`,
      header: 'TIÊU ĐỀ KHỐI MỚI',
      header_url: '',
      items: [
        {
          id: `item_${Date.now()}_1`,
          text: 'Dòng nội dung mới',
          url: '',
        },
      ],
    };
    setSections((prev) => [...prev, newSec]);
  };

  const handleRemoveSection = (sIdx: number) => {
    if (sections.length <= 1) {
      if (!window.confirm('Bạn có chắc chắn muốn xóa khối Header này không?')) {
        return;
      }
    }
    setSections((prev) => prev.filter((_, idx) => idx !== sIdx));
  };

  const handleUpdateSectionHeader = (
    sIdx: number,
    field: 'header' | 'header_url',
    value: string
  ) => {
    setSections((prev) =>
      prev.map((sec, idx) => (idx === sIdx ? { ...sec, [field]: value } : sec))
    );
  };

  // Thao tác dòng Content
  const handleAddItem = (sIdx: number) => {
    const newItem: FooterContentItem = {
      id: `item_${Date.now()}`,
      text: '',
      url: '',
    };
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx ? { ...sec, items: [...(sec.items || []), newItem] } : sec
      )
    );
  };

  const handleRemoveItem = (sIdx: number, iIdx: number) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? { ...sec, items: (sec.items || []).filter((_, cIdx) => cIdx !== iIdx) }
          : sec
      )
    );
  };

  const handleUpdateItem = (
    sIdx: number,
    iIdx: number,
    field: 'text' | 'url',
    value: string
  ) => {
    setSections((prev) =>
      prev.map((sec, idx) =>
        idx === sIdx
          ? {
              ...sec,
              items: (sec.items || []).map((it, cIdx) =>
                cIdx === iIdx ? { ...it, [field]: value } : it
              ),
            }
          : sec
      )
    );
  };

  const totalItemsCount = sections.reduce(
    (acc, sec) => acc + (sec.items ? sec.items.length : 0),
    0
  );

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
            [CẤU HÌNH LOGO, SLOGAN &amp; NỘI DUNG FOOTER] - [QUẢN LÝ ẢNH LOGO, SLOGAN, CÁC TIÊU ĐỀ HEADER VÀ CÁC DÒNG NỘI DUNG (KÈM LINK TÙY CHỌN) TẠI FOOTER]
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-800">
            {sections.length} KHỐI HEADER ({totalItemsCount} DÒNG)
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
          {/* Khung Live Preview trực quan mô phỏng cả Cột 1 và Cột 2 */}
          <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                XEM TRƯỚC HIỂN THỊ THỰC TẾ (CỘT 1 LOGO &amp; CỘT 2 NỘI DUNG FOOTER)
              </span>
              <span className="text-[10px] text-gray-400 italic">
                Mô phỏng màu sắc, logo, slogan và các dòng liên kết đúng thực tế
              </span>
            </div>

            <div className="bg-[#fff0f3] p-5 rounded-sm border border-pink-100 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Cột 1 Live Preview: Logo & Slogan */}
              <div className="md:col-span-4 flex flex-col items-start gap-1">
                <img
                  src={brandConfig.logo_url || '/logo.png'}
                  alt={brandConfig.logo_alt || 'Huy Tutor'}
                  className="h-8 w-auto object-contain"
                />
                <div className="text-[10px] text-gray-500 font-medium">
                  {brandConfig.slogan || '(Chưa nhập slogan)'}
                </div>
              </div>

              {/* Cột 2 Live Preview: Header & Content lines */}
              <div className="md:col-span-8 text-[11px] text-gray-700 space-y-4 leading-relaxed">
                {sections.length === 0 ? (
                  <p className="text-gray-400 italic">
                    (Chưa có khối Header nào)
                  </p>
                ) : (
                  sections.map((sec, sIdx) => (
                    <div key={sec.id || sIdx} className="space-y-1.5">
                      {sec.header ? (
                        sec.header_url?.trim() ? (
                          <a
                            href={sec.header_url.trim()}
                            target={sec.header_url.startsWith('http') ? '_blank' : undefined}
                            rel="noreferrer"
                            className="font-bold text-gray-900 uppercase hover:text-[#e60049] transition inline-flex items-center gap-1"
                          >
                            <span>{sec.header}</span>
                            <span className="text-[9px] text-[#e60049] font-normal lowercase font-mono">🔗 link</span>
                          </a>
                        ) : (
                          <p className="font-bold text-gray-900 uppercase">{sec.header}</p>
                        )
                      ) : (
                        <p className="font-bold text-gray-400 italic uppercase">(Chưa nhập tiêu đề Header #{sIdx + 1})</p>
                      )}

                      {(!sec.items || sec.items.length === 0) ? (
                        <p className="text-gray-400 italic text-[10px]">(Chưa có dòng nội dung)</p>
                      ) : (
                        sec.items.map((item, iIdx) => {
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
                  ))
                )}
              </div>
            </div>
          </div>

          {/* PHẦN 1: CẤU HÌNH LOGO & SLOGAN (CỘT 1 FOOTER) */}
          <div className="border border-gray-200 rounded-sm bg-gray-50/50 p-4 space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
              <span className="bg-[#e60049] text-white text-[10px] font-black px-2 py-0.5 rounded-sm">
                CỘT 1
              </span>
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                CẤU HÌNH LOGO &amp; SLOGAN THƯƠNG HIỆU
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 border border-gray-200 rounded-sm">
              {/* Ảnh Logo */}
              <div className="md:col-span-5 space-y-2">
                <label className="block text-xs font-bold text-gray-800">
                  Ảnh Logo Footer
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative inline-flex items-center justify-center h-14 w-28 bg-[#fff0f3] border border-gray-300 rounded p-1 group">
                    <img
                      src={brandConfig.logo_url || '/logo.png'}
                      alt={brandConfig.logo_alt || 'Huy Tutor'}
                      className="max-h-full max-w-full object-contain"
                    />
                    {brandConfig.logo_url && brandConfig.logo_url !== '/logo.png' && (
                      <button
                        type="button"
                        onClick={handleDeleteLogo}
                        title="Xóa ảnh Logo khỏi Cloudflare R2 (quay về logo mặc định)"
                        className="absolute -top-2 -right-2 z-10 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center font-bold text-[10px] shadow border border-white cursor-pointer transition"
                      >
                        ✕
                      </button>
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
                  placeholder="Chuẩn mực & Chi tiết"
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

          {/* PHẦN 2: CẤU HÌNH CÁC KHỐI HEADER & CONTENT (CỘT 2 FOOTER) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#e60049] text-white text-[10px] font-black px-2 py-0.5 rounded-sm">
                  CỘT 2
                </span>
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                  CÁC KHỐI HEADER &amp; DÒNG NỘI DUNG (KÈM LINK TÙY CHỌN)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                className="bg-white border border-gray-300 hover:border-[#e60049] text-gray-800 hover:text-[#e60049] font-bold text-xs px-3 py-1.5 rounded-sm transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <span>+ Thêm khối Header mới</span>
              </button>
            </div>

            {sections.map((sec, sIdx) => (
              <div
                key={sec.id || sIdx}
                className="border border-gray-200 rounded-sm bg-gray-50/50 p-4 space-y-4 relative"
              >
                {/* Header khối */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#e60049] text-white text-[10px] font-black px-2 py-0.5 rounded-sm">
                      KHỐI #{sIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-700">Tiêu đề Header &amp; Link</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveSection(sIdx)}
                    className="text-red-600 hover:text-red-800 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                  >
                    <span>🗑 Xóa khối Header này</span>
                  </button>
                </div>

                {/* Ô nhập tiêu đề và link của Header */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-3 border border-gray-200 rounded-sm">
                  <div className="md:col-span-7 space-y-1">
                    <label className="block text-[11px] font-bold text-gray-700">
                      Tiêu đề Header (in đậm, viết hoa) <span className="text-[#e60049]">*</span>
                    </label>
                    <input
                      type="text"
                      value={sec.header}
                      onChange={(e) => handleUpdateSectionHeader(sIdx, 'header', e.target.value)}
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
                      value={sec.header_url || ''}
                      onChange={(e) => handleUpdateSectionHeader(sIdx, 'header_url', e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs border border-gray-300 rounded-sm px-2.5 py-1.5 font-mono text-gray-700 focus:outline-none focus:border-[#e60049]"
                    />
                  </div>
                </div>

                {/* Bảng danh sách các dòng Content bên dưới Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-700 uppercase">
                      Các dòng nội dung (Content lines) thuộc khối #{sIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddItem(sIdx)}
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
                        {(!sec.items || sec.items.length === 0) ? (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-gray-400 italic">
                              Chưa có dòng nội dung nào. Bấm &quot;+ Thêm dòng Content&quot; để thêm.
                            </td>
                          </tr>
                        ) : (
                          sec.items.map((item, iIdx) => (
                            <tr key={item.id || iIdx} className="hover:bg-gray-50/80 border-b border-gray-100 last:border-b-0">
                              <td className="p-2 text-center text-gray-500 font-mono text-[11px]">
                                {iIdx + 1}
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.text}
                                  onChange={(e) => handleUpdateItem(sIdx, iIdx, 'text', e.target.value)}
                                  placeholder="VD: Địa chỉ: Phường An Khánh... hoặc Zalo: 0358999147"
                                  className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs focus:outline-none focus:border-[#e60049]"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={item.url || ''}
                                  onChange={(e) => handleUpdateItem(sIdx, iIdx, 'url', e.target.value)}
                                  placeholder="VD: https://zalo.me/0358999147 hoặc mailto:..."
                                  className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-mono text-gray-700 focus:outline-none focus:border-[#e60049]"
                                />
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(sIdx, iIdx)}
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
            ))}
          </div>

          {/* Thanh nút bấm hành động */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleResetToDefault}
              disabled={isSaving}
              className="text-xs text-gray-600 hover:text-gray-900 font-bold px-3 py-2 rounded-sm border border-gray-300 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
            >
              Khôi phục mẫu ban đầu
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
                <span>Lưu Toàn Bộ Cấu Hình Footer</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
