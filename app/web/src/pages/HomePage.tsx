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

  return (
    <div>
      {/* 1. Khung Đen: Hero Header (Tùy biến HTML hoặc Ảnh + Chữ) */}
      <HeroBlock config={siteConfigs?.homepage_hero} />

      {/* Container Chính */}
      <main className="max-w-[920px] mx-auto px-4 py-8 space-y-12">
        {/* 2. Khung Xanh Dương: Top Banner (Tùy biến HTML hoặc Ảnh + Chữ) */}
        <TopBannerBlock config={siteConfigs?.homepage_top_banner} />

        {/* 3. Khung Vàng: Danh mục sản phẩm (Ô vuông, tên & ảnh tự cấu hình, auto scale) */}
        <CategoriesGridBlock config={siteConfigs?.homepage_categories_grid} />

        {/* 4. Khung Tím: Nhóm tài liệu cấp 1 & Sản phẩm cấp 2 tự cấu hình tên/ảnh/link/active */}
        <SectionGroupsBlock config={siteConfigs?.homepage_section_groups} />

        {/* 5. Dòng Chữ Xám: Thông báo bổ trợ & Nút xem toàn bộ */}
        <NoticeTextBlock config={siteConfigs?.homepage_notice_text} />

        {/* 6. Khung Nâu: Bottom Banner (Tùy biến Ảnh mới / HTML / 3D books) */}
        <BottomBannerBlock config={siteConfigs?.homepage_bottom_banner} />
      </main>
    </div>
  );
};
