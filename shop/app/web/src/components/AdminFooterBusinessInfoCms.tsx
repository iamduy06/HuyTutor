import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { FooterBlockSection, FooterContentItem } from '../types';
import { getClientErrorMessage } from '../utils/errorHandler';

interface AdminFooterBusinessInfoCmsProps {
  showToast?: (msg: string) => void;
}

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

  const [sections, setSections] = useState<FooterBlockSection[]>(() => {
    if (
      Array.isArray(siteConfigs?.footer_info_sections) &&
      siteConfigs.footer_info_sections.length > 0
    ) {
      return siteConfigs.footer_info_sections;
    }
    return DEFAULT_SECTIONS;
  });

  // Đồng bộ cấu hình từ siteConfigs khi có thay đổi
  useEffect(() => {
    if (
      Array.isArray(siteConfigs?.footer_info_sections) &&
      siteConfigs.footer_info_sections.length > 0
    ) {
      setSections(siteConfigs.footer_info_sections);
    }
  }, [siteConfigs?.footer_info_sections]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSiteConfig('footer_info_sections', sections);
      showToast('Đã lưu cấu hình Header & Content Footer thành công!');
    } catch (err: any) {
      const errorMsg = getClientErrorMessage(err, true);
      showToast(errorMsg || 'Lỗi khi lưu cấu hình Header & Content Footer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setSections(DEFAULT_SECTIONS);
    showToast('Đã đặt lại cấu hình mẫu ban đầu (chưa lưu vào DB cho đến khi bấm Lưu).');
  };

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
      if (!window.confirm('Bạn có chắc chắn muốn xóa khối Header duy nhất này không?')) {
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
            [CẤU HÌNH THÔNG TIN HEADER &amp; NỘI DUNG FOOTER] - [QUẢN LÝ CÁC TIÊU ĐỀ HEADER VÀ CÁC DÒNG NỘI DUNG (KÈM LINK TÙY CHỌN) HIỂN THỊ TẠI CỘT 2 FOOTER]
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
          {/* Khung Live Preview trực quan */}
          <div className="bg-gray-50 border border-gray-200 rounded-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                XEM TRƯỚC HIỂN THỊ THỰC TẾ (CỘT 2 FOOTER)
              </span>
              <span className="text-[10px] text-gray-400 italic">
                Dòng có link sẽ đổi màu khi hover và bấm mở được; dòng không có link là văn bản thuần.
              </span>
            </div>

            <div className="bg-[#fff0f3] p-4 rounded-sm border border-pink-100 text-[11px] text-gray-700 space-y-4 leading-relaxed">
              {sections.length === 0 ? (
                <p className="text-gray-400 italic text-center py-2">
                  (Chưa có khối Header nào. Bấm &quot;+ Thêm khối Header mới&quot; bên dưới để tạo.)
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
                      <p className="text-gray-400 italic text-[10px]">(Chưa có dòng nội dung nào trong Header này)</p>
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

          {/* Danh sách các Khối Header */}
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                DANH SÁCH CÁC KHỐI HEADER &amp; CÁC DÒNG CONTENT NỘI DUNG
              </h3>
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
                <span>Lưu Cấu Hình Footer</span>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
