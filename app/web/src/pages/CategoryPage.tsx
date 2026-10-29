import React, { useMemo } from 'react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

export const CategoryPage: React.FC<{ categorySlug: string }> = ({ categorySlug }) => {
  const { products, categories, isLoading } = useStore();

  const categoryInfo = useMemo(() => {
    const found = categories.find((c) => c.slug === categorySlug);
    if (found) return found;
    if (categorySlug === 'secondary-school') {
      return {
        name: 'Danh mục tài liệu Chuẩn mực & Chi tiết cấp THCS',
        description: 'Tài liệu Đọc điền - Đọc hiểu và Ôn thi vào lớp 10 chuẩn CT GDPT 2018.',
      };
    }
    if (categorySlug === 'gifted-students') {
      return {
        name: 'Danh mục tài liệu Bồi dưỡng Học sinh giỏi (HSG) & Chuyên Anh',
        description: 'Tài liệu chuyên sâu Cụm động từ, Collocations và Từ vựng nâng cao B2-C2.',
      };
    }
    if (categorySlug === 'gifts') {
      return {
        name: 'Kho Tài liệu Miễn phí & Quà tặng tri ân',
        description:
          'Tổng hợp các tài liệu Thành ngữ, Collocations và Đề thi chính thức chia sẻ miễn phí tới Quý Thầy/Cô và học sinh.',
      };
    }
    if (categorySlug === 'other') {
      return {
        name: 'Tài liệu khác & Chuyên đề mở rộng',
        description: 'Chuyên đề 2500 Cụm từ cố định (Collocations) và tài liệu bổ trợ nâng cao.',
      };
    }
    if (categorySlug === 'template' || categorySlug === 'do-dung-day-hoc') {
      return {
        name: 'Mẫu Trang tính & Tiện ích giảng dạy',
        description:
          'Trang tính quản lý lớp học, điểm danh, tính học phí tự động và hệ thống Flashcard trực tuyến.',
      };
    }
    return {
      name: 'Danh mục tài liệu Chuẩn mực & Chi tiết cấp THPT',
      description:
        'Trọn bộ đề thi thử THPTQG, ĐGNL, chuyên đề bổ trợ và từ vựng Global Success.',
    };
  }, [categories, categorySlug]);

  const categoryProducts = useMemo(() => {
    if (categorySlug === 'other') {
      return products.filter(
        (p) =>
          p.category_slug === 'other' ||
          p.slug === '2500-collocations' ||
          p.slug === '1400caucumdongtuintermediate'
      );
    }
    if (categorySlug === 'template' || categorySlug === 'do-dung-day-hoc') {
      return products.filter(
        (p) =>
          p.category_slug === categorySlug ||
          p.slug === 'mau-thu-hoc-phi' ||
          p.slug === 'flashcard-tu-vung'
      );
    }
    return products.filter((p) => p.category_slug === categorySlug);
  }, [products, categorySlug]);

  const groupedSections = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const prod of categoryProducts) {
      const sec = prod.sub_section || 'Tài liệu trọng tâm';
      const arr = map.get(sec) || [];
      arr.push(prod);
      map.set(sec, arr);
    }
    return Array.from(map.entries());
  }, [categoryProducts]);

  return (
    <main className="max-w-[920px] mx-auto px-4 py-10 space-y-10">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#e60049] leading-snug mb-3">
          {categorySlug === 'high-school' ? (
            <>
              Danh mục tài liệu Chuẩn mực &amp;
              <br />
              Chi tiết cấp THPT
            </>
          ) : (
            categoryInfo.name
          )}
        </h1>

        {groupedSections.length > 0 && (
          <div className="space-y-1 text-xs font-medium text-gray-700">
            {groupedSections.map(([sectionName], idx) => (
              <div key={sectionName}>
                <a href={`#sec-${idx}`} className="underline hover:text-[#e60049] transition">
                  {sectionName}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-xs text-gray-500 py-10 text-center">
          Đang tải danh mục sản phẩm từ Backend API...
        </div>
      ) : groupedSections.length === 0 ? (
        <div className="text-xs text-gray-500 py-10 text-center">
          Chưa có tài liệu nào trong danh mục này.
        </div>
      ) : (
        groupedSections.map(([sectionName, items], idx) => (
          <section key={sectionName} id={`sec-${idx}`}>
            <h2 className="text-[#e60049] font-bold text-sm mb-4">{sectionName}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
};
