import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { buildProductUrl } from '../utils/urlHelper';
import { formatVnd } from '../types';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, products } = useStore();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.short_desc.toLowerCase().includes(q) ||
        p.sub_section.toLowerCase().includes(q) ||
        p.category_name.toLowerCase().includes(q)
    );
  }, [query, products]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-16 px-4">
      <div className="bg-white rounded-md border border-gray-200 shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-[#fff5f7]">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên bộ đề, từ khóa (THPT, ĐGNL, Flashcard, Lớp 9, Cụm động từ...)"
            className="flex-1 bg-white border border-gray-300 rounded-sm px-3 py-2 text-xs focus:outline-none focus:border-[#e60049]"
          />
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="px-3 py-2 bg-[#e60049] text-white font-bold text-xs rounded-sm hover:bg-[#cc0041]"
          >
            Đóng
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500">
              Không tìm thấy tài liệu phù hợp với từ khóa "{query}".
            </div>
          ) : (
            filtered.map((item) => {
              const firstActiveFmt =
                item.formats.find((f) => f.is_active) || item.formats[0];
              return (
                <Link
                  key={item.id}
                  to={buildProductUrl(item.category_slug, item.slug)}
                  onClick={() => setIsSearchOpen(false)}
                  className="p-3.5 flex items-center justify-between hover:bg-[#fff5f7] transition"
                >
                  <div className="pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-[#e60049] text-white px-2 py-0.5 rounded-sm">
                        {item.badge_text || 'Mới'}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {item.category_name} • {item.sub_section}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-900 mt-1">
                      {item.title}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {firstActiveFmt && (
                      <div className="text-xs font-extrabold text-[#e60049]">
                        {formatVnd(firstActiveFmt.price)}
                      </div>
                    )}
                    <span className="text-[10px] text-gray-500 font-semibold">
                      Đọc thử
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

