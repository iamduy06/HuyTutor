import React, { useMemo } from 'react';
import {
  buildInitialFlashcardBlocks,
  FlashcardBannerBlock,
  FlashcardContactNoticeBlock,
  FlashcardFeaturesBlock,
  FlashcardFreeTierBlock,
  FlashcardGroupPricingBlock,
  FlashcardHeroBlock,
  FlashcardPricingBlock,
} from '../components/DynamicFlashcardBlocks';
import { useStore } from '../context/StoreContext';
import {
  FlashcardBannerBlockConfig,
  FlashcardContactNoticeBlockConfig,
  FlashcardFeaturesBlockConfig,
  FlashcardFreeTierBlockConfig,
  FlashcardGroupPricingBlockConfig,
  FlashcardHeroBlockConfig,
  FlashcardIndividualPackageItem,
  FlashcardPricingBlockConfig,
  Product,
} from '../types';

export const FlashcardPage: React.FC = () => {
  const { products, siteConfigs, buyNow } = useStore();

  const blocks = useMemo(() => {
    return buildInitialFlashcardBlocks(siteConfigs?.flashcard_page_blocks);
  }, [siteConfigs?.flashcard_page_blocks]);

  const flashcardProduct: Product =
    products.find((p) => p.slug.includes('flashcard')) || {
      id: 'prod-flashcard-1',
      category_id: 'cat-flashcard',
      category_slug: 'flashcard',
      category_name: 'Flashcard',
      sub_section: 'Tiện ích',
      code: 'FC-ALL',
      title: 'Flashcard từ vựng - tổng hợp mọi tài liệu',
      slug: 'flashcard-tu-vung',
      google_form_product_name: 'Flashcard từ vựng - tổng hợp mọi tài liệu',
      badge_text: 'Mới',
      short_desc: 'Hệ thống Flashcard học từ vựng trực tuyến 4 chế độ luyện tập.',
      cover_tag: 'Học từ vựng\ncơ bản đến\nnâng cao',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
      preview_images: [],
      specs: [],
      topics: [],
      features: [],
      is_featured: true,
      is_combo_eligible: false,
      is_active: true,
      formats: [{ format_code: 'Flashcard', price: 100000, is_active: true }],
    };

  const handleRegisterFlashcard = (priceOverride?: number, pkgTitle?: string) => {
    const customProd: Product = {
      ...flashcardProduct,
      title: pkgTitle || flashcardProduct.title,
      google_form_product_name: pkgTitle || flashcardProduct.google_form_product_name,
      formats: [
        {
          format_code: 'Flashcard',
          price: priceOverride || 100000,
          is_active: true,
        },
      ],
    };
    buyNow(customProd, 'Flashcard', 1);
  };

  const handleSelectPackage = (pkg: FlashcardIndividualPackageItem) => {
    handleRegisterFlashcard(pkg.price, `Flashcard Huy Tutor - ${pkg.label}`);
  };

  return (
    <div className="pb-12">
      {blocks
        .filter((b) => b.is_active !== false)
        .map((block) => {
          switch (block.type) {
            case 'flashcard_hero':
              return (
                <FlashcardHeroBlock
                  key={block.id}
                  config={block.config as FlashcardHeroBlockConfig}
                />
              );

            case 'flashcard_features': {
              const featConfig = block.config as FlashcardFeaturesBlockConfig;
              return (
                <FlashcardFeaturesBlock
                  key={block.id}
                  config={featConfig}
                  onCtaClick={() => {
                    if (featConfig.cta_button.action_type === 'link' && featConfig.cta_button.target_url) {
                      window.open(featConfig.cta_button.target_url, '_blank');
                    } else {
                      handleRegisterFlashcard(
                        featConfig.cta_button.package_price || 100000,
                        featConfig.cta_button.package_title || 'Flashcard Huy Tutor - Gói 1 Năm'
                      );
                    }
                  }}
                />
              );
            }

            case 'flashcard_free_tier':
              return (
                <main key={block.id} className="max-w-[760px] mx-auto px-4 pt-10">
                  <FlashcardFreeTierBlock config={block.config as FlashcardFreeTierBlockConfig} />
                </main>
              );

            case 'flashcard_pricing_packages':
              return (
                <main key={block.id} className="max-w-[760px] mx-auto px-4 pt-6">
                  <FlashcardPricingBlock
                    config={block.config as FlashcardPricingBlockConfig}
                    onSelectPackage={handleSelectPackage}
                  />
                </main>
              );

            case 'flashcard_group_pricing': {
              const groupConfig = block.config as FlashcardGroupPricingBlockConfig;
              return (
                <main key={block.id} className="max-w-[760px] mx-auto px-4">
                  <FlashcardGroupPricingBlock
                    config={groupConfig}
                    onRegisterGroup={() =>
                      handleRegisterFlashcard(
                        groupConfig.default_price || 100000,
                        groupConfig.default_title || 'Flashcard từ vựng - tổng hợp mọi tài liệu'
                      )
                    }
                  />
                </main>
              );
            }

            case 'flashcard_contact_notice':
              return (
                <main key={block.id} className="max-w-[760px] mx-auto px-4 pt-4">
                  <FlashcardContactNoticeBlock
                    config={block.config as FlashcardContactNoticeBlockConfig}
                  />
                </main>
              );

            case 'flashcard_banner':
              return (
                <main key={block.id} className="max-w-[760px] mx-auto px-4 py-4">
                  <FlashcardBannerBlock config={block.config as FlashcardBannerBlockConfig} />
                </main>
              );

            default:
              return null;
          }
        })}
    </div>
  );
};
