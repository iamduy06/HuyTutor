import React from 'react';
import {
  BottomCtaBlockConfig,
  CategoryBannerBlockConfig,
  CategoryHeroBlockConfig,
  CategoryNoticeBlockConfig,
  CategorySectionBlockConfig,
  ComboBannerBlockConfig,
  ComboBottomCtaBlockConfig,
  ComboHeroBlockConfig,
  ComboNoticeBlockConfig,
  ComboPackagesBlockConfig,
  ComboSectionsBlockConfig,
  FlashcardBannerBlockConfig,
  FlashcardContactNoticeBlockConfig,
  FlashcardFeaturesBlockConfig,
  FlashcardFreeTierBlockConfig,
  FlashcardGroupPricingBlockConfig,
  FlashcardHeroBlockConfig,
  FlashcardIndividualPackageItem,
  FlashcardPricingBlockConfig,
  HomepageBottomBannerConfig,
  HomepageCategoriesGridConfig,
  HomepageHeroConfig,
  HomepageNoticeTextConfig,
  HomepageSectionGroupsConfig,
  HomepageTopBannerConfig,
  Product,
  ProductHeroBlockConfig,
  ProductIntroBlockConfig,
  RelatedProductsBlockConfig,
  SampleGroupsBlockConfig,
  SamplePreviewGroup,
  TopicAccordionBlockConfig,
  UiFormatCode,
  UniversalBlockItem,
  UniversalPageContext,
} from '../types';
import {
  ComboBannerBlock,
  ComboBottomCtaBlock,
  ComboHeroBlock,
  ComboNoticeBlock,
  ComboPackagesBlock,
  ComboSectionsBlock,
} from './DynamicComboBlocks';
import {
  BottomBannerBlock,
  CategoriesGridBlock,
  HeroBlock,
  NoticeTextBlock,
  SectionGroupsBlock,
  TopBannerBlock,
} from './DynamicHomepageBlocks';
import {
  CategoryBannerBlock,
  CategoryHeroBlock,
  CategoryNoticeBlock,
  CategorySectionBlock,
  GiftDonateCtaBlock,
  GiftFormEmbedBlock,
  GiftHeroAnchorsBlock,
} from './DynamicCategoryBlocks';
import {
  BottomCtaBlock,
  GiftCrossSellBlock,
  GiftPreviewDownloadBlock,
  ProductHeroBlock,
  ProductIntroBlock,
  RelatedProductsBlock,
  SampleGroupsBlock,
  TopicAccordionBlock,
} from './DynamicProductDetailBlocks';
import {
  FlashcardBannerBlock,
  FlashcardContactNoticeBlock,
  FlashcardFeaturesBlock,
  FlashcardFreeTierBlock,
  FlashcardGroupPricingBlock,
  FlashcardHeroBlock,
  FlashcardPricingBlock,
} from './DynamicFlashcardBlocks';
import { ProductImageFrame } from './ProductImageFrame';
import { SmartLink } from './SmartLink';
import { buildProductUrl } from '../utils/urlHelper';

export interface UniversalBlockRendererProps {
  blocks: (UniversalBlockItem | any)[];
  context?: UniversalPageContext;
  selectedFormat?: UiFormatCode;
  onSelectFormat?: (fmt: UiFormatCode) => void;
  onAddToCart?: (fmt: UiFormatCode) => void;
  onBuyNow?: (fmt: UiFormatCode) => void;
  isFormatOwned?: boolean;
  isProductOwnedInAnyFormat?: boolean;
  onOpenComboCheckout?: (pkg: any) => void;
  onTriggerComboBuy?: () => void;
  onSelectFlashcardPackage?: (pkg: FlashcardIndividualPackageItem) => void;
  onRegisterFlashcardGroup?: () => void;
}

export const UniversalBlockRenderer: React.FC<UniversalBlockRendererProps> = ({
  blocks,
  context,
  selectedFormat = 'Word',
  onSelectFormat = () => {},
  onAddToCart = () => {},
  onBuyNow = () => {},
  isFormatOwned = false,
  isProductOwnedInAnyFormat = false,
  onOpenComboCheckout = () => {},
  onTriggerComboBuy = () => {},
  onSelectFlashcardPackage = () => {},
  onRegisterFlashcardGroup = () => {},
}) => {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return null;
  }

  const activeBlocks = blocks.filter((b) => b && b.is_active !== false);

  // Lấy danh sách sections cho CategoryHeroBlock nếu có
  const categorySections = activeBlocks
    .filter((b) => b.type === 'category_section')
    .map((b) => b.config as CategorySectionBlockConfig);

  // Lấy danh sách sample groups cho TopicAccordionBlock nếu có
  const allSampleGroups = React.useMemo(() => {
    const list: SamplePreviewGroup[] = [];
    for (const b of activeBlocks) {
      if (b.type === 'sample_groups' && Array.isArray(b.config?.groups)) {
        for (const g of b.config.groups) {
          if (g && g.is_active !== false) {
            list.push(g);
          }
        }
      }
    }
    return list;
  }, [activeBlocks]);

  return (
    <>
      {activeBlocks.map((block, index) => {
        const key = block.id || `blk_${block.type}_${index}`;
        const cfg = block.config || {};

        switch (block.type) {
          // ==========================================
          // 1. HERO & BANNER
          // ==========================================
          case 'hero':
            return <HeroBlock key={key} config={cfg as HomepageHeroConfig} />;

          case 'top_banner':
            return <TopBannerBlock key={key} config={cfg as HomepageTopBannerConfig} />;

          case 'bottom_banner':
            return <BottomBannerBlock key={key} config={cfg as HomepageBottomBannerConfig} />;

          case 'combo_hero':
            return (
              <ComboHeroBlock
                key={key}
                config={cfg as ComboHeroBlockConfig}
                onActionClick={onTriggerComboBuy}
              />
            );

          case 'combo_banner':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-3">
                <ComboBannerBlock config={cfg as ComboBannerBlockConfig} />
              </div>
            );

          case 'category_hero':
            return (
              <CategoryHeroBlock
                key={key}
                config={cfg as CategoryHeroBlockConfig}
                sections={categorySections}
              />
            );

          case 'category_banner':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-3">
                <CategoryBannerBlock config={cfg as CategoryBannerBlockConfig} />
              </div>
            );

          case 'product_hero':
            if (context?.product) {
              return (
                <div key={key} className="max-w-[920px] mx-auto py-4">
                  <ProductHeroBlock
                    config={cfg as ProductHeroBlockConfig}
                    product={context.product}
                    selectedFormat={selectedFormat}
                    onSelectFormat={onSelectFormat}
                    onAddToCart={onAddToCart}
                    onBuyNow={onBuyNow}
                  />
                </div>
              );
            }
            return null;

          case 'flashcard_hero':
            return <FlashcardHeroBlock key={key} config={cfg as FlashcardHeroBlockConfig} />;

          case 'flashcard_banner':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-3">
                <FlashcardBannerBlock config={cfg as FlashcardBannerBlockConfig} />
              </div>
            );

          case 'campaign_frame': {
            const frameType = cfg.frame_type || 'preset';
            const presetName = cfg.preset_name || 'sale';
            const customFrameUrl = cfg.custom_frame_url;
            const appliedIds: string[] = Array.isArray(cfg.applied_product_ids) ? cfg.applied_product_ids : [];
            const scope = cfg.scope || 'global';
            const sampleProds = (context?.allProducts || []).filter((p) => {
              if (scope === 'specific') {
                return appliedIds.includes(p.id) || appliedIds.includes(p.slug);
              }
              return true;
            }).slice(0, 3);

            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <section className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 rounded-lg p-5 text-white shadow-md relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
                    <div className="space-y-1 max-w-[70%]">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                        CHIẾN DỊCH KHUYẾN MÃI
                      </span>
                      <h2 className="text-base sm:text-lg font-black leading-tight drop-shadow-xs">
                        {cfg.title || 'ƯU ĐÃI ĐẶC BIỆT THEO MÙA'}
                      </h2>
                      {cfg.subtitle && (
                        <p className="text-xs text-rose-100">{cfg.subtitle}</p>
                      )}
                      {cfg.banner_text && (
                        <p className="text-xs font-bold text-amber-200 mt-1">{cfg.banner_text}</p>
                      )}
                    </div>
                    {cfg.cta_label && (
                      <SmartLink
                        to={cfg.cta_url || '#'}
                        className="bg-white hover:bg-amber-100 text-[#e60049] font-black text-xs px-4 py-2 rounded shadow transition"
                      >
                        {cfg.cta_label} →
                      </SmartLink>
                    )}
                  </div>

                  {sampleProds.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-4 border-t border-white/20 relative z-10">
                      {sampleProds.map((prod) => (
                        <div key={prod.id} className="bg-white rounded-md p-2 text-gray-900 shadow flex flex-col justify-between">
                          <ProductImageFrame
                            src={prod.thumbnail_url || (prod.preview_images && prod.preview_images[0]) || ''}
                            alt={prod.title}
                            presetRatio={cfg.aspect_ratio || '3:4'}
                            forcePresetOverlay={frameType === 'preset' ? presetName : undefined}
                            customCampaignFrameUrl={frameType === 'custom' ? customFrameUrl : undefined}
                            className="w-full"
                          />
                          <div className="pt-2 text-center">
                            <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{prod.title}</h4>
                            <SmartLink
                              to={buildProductUrl(prod.category_slug, prod.slug)}
                              className="mt-1.5 inline-block w-full bg-[#e60049] hover:bg-[#cc0041] text-white text-[10px] font-bold py-1 rounded"
                            >
                              Xem tài liệu
                            </SmartLink>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            );
          }

          // ==========================================
          // 2. SẢN PHẨM & BÁN HÀNG
          // ==========================================
          case 'categories_grid':
            return <CategoriesGridBlock key={key} config={cfg as HomepageCategoriesGridConfig} />;

          case 'section_groups':
            return <SectionGroupsBlock key={key} config={cfg as HomepageSectionGroupsConfig} />;

          case 'combo_packages':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <ComboPackagesBlock
                  config={cfg as ComboPackagesBlockConfig}
                  allProducts={context?.allProducts || []}
                  onSelectPackage={onOpenComboCheckout || (() => {})}
                />
              </div>
            );

          case 'combo_sections':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <ComboSectionsBlock
                  config={cfg as ComboSectionsBlockConfig}
                  allProducts={context?.allProducts || []}
                />
              </div>
            );

          case 'category_section':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <CategorySectionBlock
                  config={cfg as CategorySectionBlockConfig}
                  allCategoryProducts={context?.allProducts || []}
                />
              </div>
            );

          case 'related_products':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <RelatedProductsBlock
                  config={cfg as RelatedProductsBlockConfig}
                  autoRelatedProducts={context?.allProducts || []}
                />
              </div>
            );

          case 'gift_cross_sell':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <GiftCrossSellBlock
                  config={cfg}
                  allProducts={context?.allProducts || []}
                />
              </div>
            );

          // ==========================================
          // 3. NỘI DUNG & ĐỌC THỬ
          // ==========================================
          case 'product_intro':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-2">
                <ProductIntroBlock config={cfg as ProductIntroBlockConfig} />
              </div>
            );

          case 'topic_accordion':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-2">
                <TopicAccordionBlock
                  config={cfg as TopicAccordionBlockConfig}
                  sampleGroups={allSampleGroups}
                />
              </div>
            );

          case 'sample_groups':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <SampleGroupsBlock config={cfg as SampleGroupsBlockConfig} />
              </div>
            );

          case 'notice_text':
            return <NoticeTextBlock key={key} config={cfg as HomepageNoticeTextConfig} />;

          case 'combo_notice':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-2">
                <ComboNoticeBlock config={cfg as ComboNoticeBlockConfig} />
              </div>
            );

          case 'category_notice':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-2">
                <CategoryNoticeBlock config={cfg as CategoryNoticeBlockConfig} />
              </div>
            );

          case 'flashcard_features':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <FlashcardFeaturesBlock config={cfg as FlashcardFeaturesBlockConfig} />
              </div>
            );

          case 'flashcard_contact_notice':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-2">
                <FlashcardContactNoticeBlock config={cfg as FlashcardContactNoticeBlockConfig} />
              </div>
            );

          case 'gift_form_embed':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <GiftFormEmbedBlock config={cfg} />
              </div>
            );

          // ==========================================
          // 4. BẢNG GIÁ & CHÍNH SÁCH
          // ==========================================
          case 'flashcard_free_tier':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <FlashcardFreeTierBlock config={cfg as FlashcardFreeTierBlockConfig} />
              </div>
            );

          case 'flashcard_pricing_packages':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <FlashcardPricingBlock
                  config={cfg as FlashcardPricingBlockConfig}
                  onSelectPackage={onSelectFlashcardPackage}
                />
              </div>
            );

          case 'flashcard_group_pricing':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <FlashcardGroupPricingBlock
                  config={cfg as FlashcardGroupPricingBlockConfig}
                  onRegisterGroup={onRegisterFlashcardGroup}
                />
              </div>
            );

          // ==========================================
          // 5. CHUYỂN ĐỔI & CTA
          // ==========================================
          case 'bottom_cta':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <BottomCtaBlock
                  config={cfg as BottomCtaBlockConfig}
                  selectedFormat={selectedFormat}
                  onBuyNow={onBuyNow}
                  onAddToCart={onAddToCart}
                />
              </div>
            );

          case 'combo_bottom_cta':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <ComboBottomCtaBlock
                  config={cfg as ComboBottomCtaBlockConfig}
                  onActionClick={onTriggerComboBuy}
                />
              </div>
            );

          case 'gift_hero_anchors':
            return <GiftHeroAnchorsBlock key={key} config={cfg} />;

          case 'gift_preview_download':
            if (context?.product) {
              return (
                <div key={key} className="max-w-[920px] mx-auto py-4">
                  <GiftPreviewDownloadBlock config={cfg} product={context.product} />
                </div>
              );
            }
            return null;

          case 'gift_donate_cta':
            return (
              <div key={key} className="max-w-[920px] mx-auto py-4">
                <GiftDonateCtaBlock config={cfg} />
              </div>
            );

          default:
            return null;
        }
      })}
    </>
  );
};
