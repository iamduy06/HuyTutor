import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { buildInitialCategoryBlocks } from '../components/DynamicCategoryBlocks';
import { UniversalBlockRenderer } from '../components/UniversalBlockRenderer';
import { useStore } from '../context/StoreContext';
import { CategoryItem } from '../types';

export const CategoryPage: React.FC<{ categorySlug?: string }> = ({ categorySlug: propSlug }) => {
  const params = useParams<{ categorySlug?: string }>();
  const activeSlug = propSlug || params.categorySlug || 'high-school';

  const { products, categories, isLoading } = useStore();

  const categoryInfo = useMemo(() => {
    return (
      categories.find((c) => c.slug === activeSlug) ||
      ({
        id: activeSlug,
        slug: activeSlug,
        name: 'Danh mục tài liệu',
        description: '',
        sort_order: 1,
        is_active: true,
        blocks: [],
      } as CategoryItem)
    );
  }, [categories, activeSlug]);

  const categoryProducts = useMemo(() => {
    return products.filter((p) => p.category_slug === activeSlug && p.is_active !== false);
  }, [products, activeSlug]);

  const blocks = useMemo(() => {
    return buildInitialCategoryBlocks(categoryInfo, categoryProducts);
  }, [categoryInfo, categoryProducts]);

  return (
    <main className="max-w-[960px] mx-auto px-4 py-8 sm:py-10 space-y-10">
      {isLoading ? (
        <div className="text-xs text-gray-500 py-12 text-center">
          Đang tải danh mục tài liệu...
        </div>
      ) : blocks.length === 0 ? (
        <div className="text-xs text-gray-500 py-12 text-center">
          Chưa có tài liệu nào trong danh mục này.
        </div>
      ) : (
        <UniversalBlockRenderer
          blocks={blocks}
          context={{
            pageType: 'category',
            category: categoryInfo,
            allProducts: categoryProducts,
          }}
        />
      )}
    </main>
  );
};
