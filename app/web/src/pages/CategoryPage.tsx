import React, { useMemo } from 'react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

export const CategoryPage: React.FC<{ categorySlug: string }> = ({ categorySlug }) => {
  const { products, categories, isLoading } = useStore();

  const categoryInfo = useMemo(() => {
    return categories.find((c) => c.slug === categorySlug) || null;
  }, [categories, categorySlug]);

  const categoryProducts = useMemo(() => {
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
          {categoryInfo ? categoryInfo.name : ''}
        </h1>
        {categoryInfo?.description && (
          <p className="text-xs text-gray-500 mb-4">{categoryInfo.description}</p>
        )}

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
          Đang tải danh mục tài liệu...
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
