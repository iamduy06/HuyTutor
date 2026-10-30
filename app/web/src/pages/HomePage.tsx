import React from 'react';
import {
  BottomBannerBlock,
  CategoriesGridBlock,
  HeroBlock,
  NoticeTextBlock,
  SectionGroupsBlock,
  TopBannerBlock,
} from '../components/DynamicHomepageBlocks';
import { useStore } from '../context/StoreContext';

export const HomePage: React.FC = () => {
  const { siteConfigs } = useStore();

  const blocks = siteConfigs?.homepage_blocks || [];
  const activeBlocks = [...blocks]
    .filter((b) => b.is_active !== false)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (activeBlocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-10 pb-12">
      {activeBlocks.map((block) => {
        if (block.type === 'hero') {
          return <HeroBlock key={block.id} config={block.config} />;
        }

        return (
          <div key={block.id} className="max-w-[920px] mx-auto px-4">
            {block.type === 'top_banner' && <TopBannerBlock config={block.config} />}
            {block.type === 'categories_grid' && <CategoriesGridBlock config={block.config} />}
            {block.type === 'section_groups' && <SectionGroupsBlock config={block.config} />}
            {block.type === 'notice_text' && <NoticeTextBlock config={block.config} />}
            {block.type === 'bottom_banner' && <BottomBannerBlock config={block.config} />}
          </div>
        );
      })}
    </div>
  );
};
