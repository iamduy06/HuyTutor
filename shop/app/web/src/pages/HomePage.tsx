import React from 'react';
import { UniversalBlockRenderer } from '../components/UniversalBlockRenderer';
import { useStore } from '../context/StoreContext';
import { HomepageBlockItem } from '../types';

export const HomePage: React.FC = () => {
  const { siteConfigs, products, categories } = useStore();

  let blocks: HomepageBlockItem[] = siteConfigs?.homepage_blocks || [];

  // Tương thích ngược: Nếu chưa có mảng blocks, tự động dựng từ các cấu hình riêng lẻ trong Database
  if (!Array.isArray(blocks) || blocks.length === 0) {
    const fallbackList: HomepageBlockItem[] = [];
    if (siteConfigs?.homepage_hero) {
      fallbackList.push({
        id: 'hero_auto',
        type: 'hero',
        title_label: 'Hero Header',
        is_active: siteConfigs.homepage_hero.is_active !== false,
        sort_order: 1,
        config: siteConfigs.homepage_hero,
      });
    }
    if (siteConfigs?.homepage_top_banner) {
      fallbackList.push({
        id: 'top_banner_auto',
        type: 'top_banner',
        title_label: 'Top Banner',
        is_active: siteConfigs.homepage_top_banner.is_active !== false,
        sort_order: 2,
        config: siteConfigs.homepage_top_banner,
      });
    }
    if (siteConfigs?.homepage_categories_grid) {
      fallbackList.push({
        id: 'categories_auto',
        type: 'categories_grid',
        title_label: 'Danh mục sản phẩm',
        is_active: siteConfigs.homepage_categories_grid.is_active !== false,
        sort_order: 3,
        config: siteConfigs.homepage_categories_grid,
      });
    }
    if (siteConfigs?.homepage_section_groups) {
      fallbackList.push({
        id: 'sections_auto',
        type: 'section_groups',
        title_label: 'Nhóm tài liệu & Sản phẩm',
        is_active: siteConfigs.homepage_section_groups.is_active !== false,
        sort_order: 4,
        config: siteConfigs.homepage_section_groups,
      });
    }
    if (siteConfigs?.homepage_notice_text) {
      fallbackList.push({
        id: 'notice_auto',
        type: 'notice_text',
        title_label: 'Thông báo & Nút liên kết',
        is_active: siteConfigs.homepage_notice_text.is_active !== false,
        sort_order: 5,
        config: siteConfigs.homepage_notice_text,
      });
    }
    if (siteConfigs?.homepage_bottom_banner) {
      fallbackList.push({
        id: 'bottom_banner_auto',
        type: 'bottom_banner',
        title_label: 'Bottom Banner',
        is_active: siteConfigs.homepage_bottom_banner.is_active !== false,
        sort_order: 6,
        config: siteConfigs.homepage_bottom_banner,
      });
    }
    blocks = fallbackList;
  }

  const activeBlocks = [...blocks]
    .filter((b) => b.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (activeBlocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      <UniversalBlockRenderer
        blocks={activeBlocks}
        context={{
          pageType: 'homepage',
          allProducts: products,
          allCategories: categories,
          siteConfigs,
        }}
      />
    </div>
  );
};
