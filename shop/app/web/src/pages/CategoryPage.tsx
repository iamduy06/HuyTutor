import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  buildInitialCategoryBlocks,
  CategoryBannerBlock,
  CategoryHeroBlock,
  CategoryNoticeBlock,
  CategorySectionBlock,
  GiftHeroAnchorsBlock,
  GiftFormEmbedBlock,
  GiftDonateCtaBlock,
} from '../components/DynamicCategoryBlocks';
import { useStore } from '../context/StoreContext';
import {
  CategoryBannerBlockConfig,
  CategoryHeroBlockConfig,
  CategoryItem,
  CategoryNoticeBlockConfig,
  CategorySectionBlockConfig,
  GiftHeroAnchorsConfig,
  GiftFormEmbedConfig,
  GiftDonateCtaConfig,
} from '../types';

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

  const activeSections = useMemo(() => {
    return blocks
      .filter((b) => b.is_active && b.type === 'category_section')
      .map((b) => b.config as CategorySectionBlockConfig);
  }, [blocks]);

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
        blocks
          .filter((b) => b.is_active)
          .map((block) => {
            switch (block.type) {
              case 'category_hero':
                return (
                  <CategoryHeroBlock
                    key={block.id}
                    config={block.config as CategoryHeroBlockConfig}
                    sections={activeSections}
                  />
                );
              case 'category_section':
                return (
                  <CategorySectionBlock
                    key={block.id}
                    config={block.config as CategorySectionBlockConfig}
                    allCategoryProducts={categoryProducts}
                  />
                );
              case 'category_banner':
                return (
                  <CategoryBannerBlock
                    key={block.id}
                    config={block.config as CategoryBannerBlockConfig}
                  />
                );
              case 'category_notice':
                return (
                  <CategoryNoticeBlock
                    key={block.id}
                    config={block.config as CategoryNoticeBlockConfig}
                  />
                );
              case 'gift_hero_anchors':
                return (
                  <GiftHeroAnchorsBlock
                    key={block.id}
                    config={block.config as GiftHeroAnchorsConfig}
                  />
                );
              case 'gift_form_embed':
                return (
                  <GiftFormEmbedBlock
                    key={block.id}
                    config={block.config as GiftFormEmbedConfig}
                  />
                );
              case 'gift_donate_cta':
                return (
                  <GiftDonateCtaBlock
                    key={block.id}
                    config={block.config as GiftDonateCtaConfig}
                  />
                );
              default:
                return null;
            }
          })
      )}
    </main>
  );
};
