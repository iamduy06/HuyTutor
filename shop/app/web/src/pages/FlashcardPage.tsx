import React, { useMemo } from 'react';
import { buildInitialFlashcardBlocks } from '../components/DynamicFlashcardBlocks';
import { UniversalBlockRenderer } from '../components/UniversalBlockRenderer';
import { useStore } from '../context/StoreContext';
import {
  FlashcardGroupPricingBlockConfig,
  FlashcardIndividualPackageItem,
  Product,
} from '../types';

export const FlashcardPage: React.FC = () => {
  const { products, siteConfigs, buyNow } = useStore();

  const blocks = useMemo(() => {
    return buildInitialFlashcardBlocks(siteConfigs?.flashcard_page_blocks);
  }, [siteConfigs?.flashcard_page_blocks]);

  const existingFlashcardProd = useMemo(() => {
    return products.find(
      (p) =>
        p.slug.includes('flashcard') ||
        p.formats?.some((f) => f.format_code === 'Flashcard' && f.is_active)
    );
  }, [products]);

  const handleRegisterFlashcard = (priceOverride?: number, pkgTitle?: string) => {
    const baseProd: Product = existingFlashcardProd || {
      id: 'flashcard-pkg',
      category_id: 'flashcard',
      category_slug: 'flashcard',
      category_name: 'Flashcard',
      sub_section: '',
      code: 'FC',
      title: pkgTitle || 'Flashcard',
      slug: 'flashcard',
      google_form_product_name: pkgTitle || 'Flashcard',
      badge_text: '',
      short_desc: '',
      cover_tag: '',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: false,
      watermark_text: '',
      preview_images: [],
      specs: [],
      topics: [],
      features: [],
      is_featured: false,
      is_combo_eligible: false,
      is_active: true,
      formats: [{ format_code: 'Flashcard', price: priceOverride || 0, is_active: true }],
    };

    const customProd: Product = {
      ...baseProd,
      title: pkgTitle || baseProd.title,
      google_form_product_name: pkgTitle || baseProd.google_form_product_name,
      formats: [
        {
          format_code: 'Flashcard',
          price: priceOverride ?? 0,
          is_active: true,
        },
      ],
    };
    buyNow(customProd, 'Flashcard', 1);
  };

  const handleSelectPackage = (pkg: FlashcardIndividualPackageItem) => {
    handleRegisterFlashcard(pkg.price, pkg.label);
  };

  const handleRegisterGroup = () => {
    const groupBlock = blocks.find((b) => b.type === 'flashcard_group_pricing');
    const cfg = groupBlock?.config as FlashcardGroupPricingBlockConfig | undefined;
    handleRegisterFlashcard(cfg?.default_price || 0, cfg?.default_title || cfg?.cta_button_text || 'Flashcard');
  };

  return (
    <div className="pb-12 space-y-6">
      <UniversalBlockRenderer
        blocks={blocks}
        context={{
          pageType: 'flashcard',
          product: existingFlashcardProd,
          allProducts: products,
        }}
        onSelectFlashcardPackage={handleSelectPackage}
        onRegisterFlashcardGroup={handleRegisterGroup}
      />
    </div>
  );
};
