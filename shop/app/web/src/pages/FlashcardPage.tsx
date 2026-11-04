import React, { useMemo } from 'react';
import { buildInitialFlashcardBlocks } from '../components/DynamicFlashcardBlocks';
import { UniversalBlockRenderer } from '../components/UniversalBlockRenderer';
import { useStore } from '../context/StoreContext';
import {
  FlashcardIndividualPackageItem,
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
    <div className="pb-12 space-y-6">
      <UniversalBlockRenderer
        blocks={blocks}
        context={{
          pageType: 'flashcard',
          product: flashcardProduct,
          allProducts: products,
        }}
        onSelectFlashcardPackage={handleSelectPackage}
        onRegisterFlashcardGroup={() => {
          handleRegisterFlashcard(100000, 'Flashcard Nhóm - Đăng ký nhóm học');
        }}
      />
    </div>
  );
};
