import React, { useState } from 'react';
import { apiClient } from '../api/client';
import {
  BottomCtaBlockConfig,
  Product,
  ProductDetailBlockItem,
  ProductDetailBlockType,
  ProductHeroBlockConfig,
  ProductIntroBlockConfig,
  RelatedProductsBlockConfig,
  SampleGroupsBlockConfig,
  SamplePreviewGroup,
  TopicAccordionBlockConfig,
  TopicAccordionBox,
  UI_FORMATS,
  UiFormatCode,
} from '../types';
import { normalizeTargetUrl } from './SmartLink';
import {
  BottomCtaBlock,
  buildInitialDetailBlocksFromProduct,
  ProductHeroBlock,
  ProductIntroBlock,
  RelatedProductsBlock,
  SampleGroupsBlock,
  TopicAccordionBlock,
} from './DynamicProductDetailBlocks';
import { UniversalBlockCardRepeater } from './UniversalBlockCardRepeater';
import { UniversalBlockRenderer } from './UniversalBlockRenderer';

interface AdminProductDetailBuilderProps {
  product: Partial<Product>;
  allProducts: Product[];
  onChangeBlocks: (blocks: ProductDetailBlockItem[]) => void;
  showToast: (msg: string) => void;
}

const DETAIL_BLOCK_META: Record<
  ProductDetailBlockType,
  { label: string; badgeColor: string; desc: string }
> = {
  product_hero: {
    label: 'PHẦN 1: Hero Sản phẩm (Ảnh độc lập + Giá + Thông số + Nút Đặt hàng)',
    badgeColor: 'bg-blue-600 text-white',
    desc: 'Khung đầu trang gồm ảnh bìa/sách bên trái và thông tin giá, thông số, nút đặt hàng bên phải.',
  },
  product_intro: {
    label: 'PHẦN 2: Hộp Xám Mô tả Chi tiết & Điểm nổi bật',
    badgeColor: 'bg-emerald-600 text-white',
    desc: 'Khung nền xám nhạt giới thiệu tổng quan tài liệu và danh sách dấu chấm tròn (hỗ trợ tô đỏ in đậm).',
  },
  topic_accordion: {
    label: 'PHẦN 3: Tiêu đề "Bản xem thử" & Hộp Mở rộng Danh sách Chủ đề',
    badgeColor: 'bg-amber-500 text-white',
    desc: 'Tiêu đề Bản xem thử kèm hộp đóng/mở (Accordion) liệt kê danh sách các đề/chủ đề.',
  },
  sample_groups: {
    label: 'PHẦN 4: Các Nhóm Ảnh Đọc Thử A4 Dọc (Demo Đề thi, Đáp án, Từ vựng...)',
    badgeColor: 'bg-[#e60049] text-white',
    desc: 'Nhiều nhóm đọc thử nối tiếp nhau. Mỗi nhóm có tiêu đề đỏ và danh sách các trang ảnh A4 đứng độc lập.',
  },
  bottom_cta: {
    label: 'PHẦN 5: Lời cảm ơn & Cụm Nút Đặt hàng Cuối trang',
    badgeColor: 'bg-purple-600 text-white',
    desc: 'Dòng chữ cảm ơn Quý Thầy/Cô sau khi xem hết bản đọc thử kèm nút Đặt hàng toàn chiều rộng.',
  },
  related_products: {
    label: 'PHẦN 6: Tài liệu Liên quan ("Nhiều Thầy/Cô cũng chọn")',
    badgeColor: 'bg-teal-600 text-white',
    desc: 'Lưới 3 cột giới thiệu các tài liệu liên quan ở cuối trang.',
  },
  gift_preview_download: {
    label: 'QUÀ TẶNG: Xem thử Watermark & Nút Tải ngay',
    badgeColor: 'bg-emerald-600 text-white',
    desc: 'Hiển thị các trang đọc thử kèm nút Tải ngay màu đỏ lớn cho tài liệu miễn phí.',
  },
  gift_cross_sell: {
    label: 'QUÀ TẶNG: Gợi ý tài liệu có phí bán kèm (Cross-sell)',
    badgeColor: 'bg-amber-600 text-white',
    desc: 'Lưới 3 cột gợi ý các tài liệu trọng tâm có phí để kích thích mua hàng.',
  },
  gift_donate_cta: {
    label: 'QUÀ TẶNG: Kêu gọi ủng hộ tác giả (Donate CTA)',
    badgeColor: 'bg-red-600 text-white',
    desc: 'Dòng text kêu gọi ủng hộ tác giả kèm nút chuyển đến trang /donate.',
  },
};

function collectBlockR2Urls(block: ProductDetailBlockItem): string[] {
  const urls: string[] = [];
  if (!block || !block.config) return urls;
  if (block.type === 'product_hero') {
    const cfg = block.config as ProductHeroBlockConfig;
    if (cfg.image_url) urls.push(cfg.image_url);
  } else if (block.type === 'sample_groups') {
    const cfg = block.config as SampleGroupsBlockConfig;
    (cfg.groups || []).forEach((g) => {
      if (g.pdf_url) urls.push(g.pdf_url);
      (g.images || []).forEach((u) => {
        if (u) urls.push(u);
      });
    });
  } else if (block.type === 'related_products') {
    const cfg = block.config as RelatedProductsBlockConfig;
    (cfg.items || []).forEach((it) => {
      if (it.image_url) urls.push(it.image_url);
    });
  }
  return urls;
}

export const AdminProductDetailBuilder: React.FC<AdminProductDetailBuilderProps> = ({
  product,
  allProducts,
  onChangeBlocks,
  showToast,
}) => {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);
  const [bulkTopicInputMap, setBulkTopicInputMap] = useState<Record<string, string>>({});

  const blocks: ProductDetailBlockItem[] = Array.isArray(product.detail_blocks)
    ? product.detail_blocks
    : [];

  const pageLevel1 = product.category_name || product.category_slug || 'San pham';
  const pageLevel2 = product.title || product.slug || 'Chi tiet';

  const buildFullPreviewProduct = (): Product => ({
    id: product.id || 'preview',
    category_id: product.category_id || '',
    code: product.code || '',
    slug: product.slug || '',
    category_slug: product.category_slug || 'high-school',
    category_name: product.category_name || '',
    sub_section: product.sub_section || '',
    title: product.title || '',
    badge_text: product.badge_text || '',
    google_form_product_name: product.google_form_product_name || '',
    cover_tag: product.cover_tag || '',
    short_desc: product.short_desc || '',
    thumbnail_url: product.thumbnail_url || '',
    preview_type: product.preview_type || 'images',
    sample_pdf_source: product.sample_pdf_source || 'r2',
    sample_pdf_url: product.sample_pdf_url || '',
    watermark_enabled: product.watermark_enabled ?? false,
    watermark_text: product.watermark_text || '',
    preview_images: product.preview_images || [],
    specs: product.specs || [],
    topics: product.topics || [],
    features: product.features || [],
    is_combo_eligible: product.is_combo_eligible ?? true,
    is_featured: product.is_featured ?? false,
    is_active: product.is_active ?? true,
    formats: product.formats || [],
    detail_blocks: blocks,
  });

  const createEmptyBlock = (
    type: ProductDetailBlockType,
    sortOrder: number
  ): ProductDetailBlockItem => {
    const id = `dblock_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    switch (type) {
      case 'product_hero': {
        const cfg: ProductHeroBlockConfig = {
          image_mode: 'standalone',
          image_url: product.thumbnail_url || '',
          badge_text: product.badge_text || '',
          cover_tag: product.cover_tag || '',
          title: product.title || '',
          price_override_text: '',
          show_format_selector: true,
          specs:
            product.specs && product.specs.length > 0
              ? product.specs.map((s) => ({ ...s }))
              : [],
          primary_cta_text: 'Đặt hàng',
          primary_cta_action: 'buy_now',
          primary_cta_link: '',
          show_add_to_cart_button: false,
          secondary_cta_text: '',
          secondary_cta_link: '',
          is_active: true,
        };
        return {
          id,
          type,
          title_label: DETAIL_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: cfg,
        };
      }
      case 'product_intro': {
        const cfg: ProductIntroBlockConfig = {
          bg_style: 'gray',
          paragraphs: product.short_desc ? [product.short_desc] : [],
          bullets_title: '',
          bullets: (product.features || []).map((f, idx) => ({
            id: `b_${Date.now()}_${idx}`,
            text: f,
            is_highlight: idx === 0,
          })),
          is_active: true,
        };
        return {
          id,
          type,
          title_label: DETAIL_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: cfg,
        };
      }
      case 'topic_accordion': {
        const cfg: TopicAccordionBlockConfig = {
          section_heading: 'Bản xem thử',
          show_quick_anchor_nav: false,
          accordions: [
            {
              id: `acc_${Date.now()}`,
              title: 'Danh sách chủ đề',
              default_open: true,
              items: product.topics ? [...product.topics] : [],
            },
          ],
          is_active: true,
        };
        return {
          id,
          type,
          title_label: DETAIL_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: cfg,
        };
      }
      case 'sample_groups': {
        const cfg: SampleGroupsBlockConfig = {
          groups: [
            {
              id: `sgrp_${Date.now()}`,
              title: 'Demo đề thi',
              description: '',
              media_type: product.preview_type === 'pdf' ? 'pdf' : 'images',
              images: product.preview_images ? [...product.preview_images] : [],
              pdf_url: product.sample_pdf_url || '',
              watermark_enabled: product.watermark_enabled ?? false,
              watermark_text: product.watermark_text || '',
              is_active: true,
              sort_order: 1,
            },
          ],
          is_active: true,
        };
        return {
          id,
          type,
          title_label: DETAIL_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: cfg,
        };
      }
      case 'bottom_cta': {
        const cfg: BottomCtaBlockConfig = {
          thank_you_text: 'Cảm ơn Quý Thầy/Cô và các bạn đã tham khảo tài liệu này!',
          sub_text: '',
          primary_button_text: 'Đặt hàng',
          primary_button_action: 'buy_now',
          primary_button_link: '',
          secondary_link_text: '',
          secondary_link_url: '',
          is_active: true,
        };
        return {
          id,
          type,
          title_label: DETAIL_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: cfg,
        };
      }
      case 'related_products': {
        const cfg: RelatedProductsBlockConfig = {
          title: 'Nhiều Thầy/Cô cũng chọn',
          mode: 'auto',
          max_items: 3,
          items: [],
          is_active: true,
        };
        return {
          id,
          type,
          title_label: DETAIL_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: cfg,
        };
      }
      case 'gift_preview_download':
        return {
          id,
          type,
          title_label: DETAIL_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: {
            title: product.title || 'Đề thi chính thức môn Tiếng Anh',
            subtitle: product.short_desc || 'File Word + File PDF có lời giải chi tiết',
            download_url: product.download_url || product.sample_pdf_url || '',
            preview_images: product.preview_images || [],
            sample_pdf_url: product.sample_pdf_url || '',
            watermark_text: product.watermark_text || 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
          },
        };
      case 'gift_cross_sell':
        return {
          id,
          type,
          title_label: DETAIL_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: {
            heading: 'Các bộ đề thi thử nổi bật do Huy Tutor biên soạn',
            product_ids: product.cross_sell_product_ids || [],
          },
        };
      case 'gift_donate_cta':
        return {
          id,
          type,
          title_label: DETAIL_BLOCK_META[type].label,
          is_active: true,
          sort_order: sortOrder,
          config: {
            prompt_text: 'Ủng hộ tác giả để có thêm những tài liệu chất lượng!',
            button_text: 'Ủng hộ tác giả',
            target_url: '/donate',
            is_active: true,
          },
        };
    }
  };

  const handleInitializeStandardBlocks = () => {
    const rawProd = buildFullPreviewProduct();
    rawProd.detail_blocks = [];
    const generated = buildInitialDetailBlocksFromProduct(rawProd);
    onChangeBlocks(generated);
    showToast('Đã khởi tạo bộ khung 6 Phần chuẩn cho Trang cấp 2!');
  };

  const handleAddBlock = (type: ProductDetailBlockType) => {
    const next = [...blocks, createEmptyBlock(type, blocks.length + 1)];
    onChangeBlocks(next);
  };

  const handleMoveBlock = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const temp = next[idx];
    next[idx] = next[target];
    next[target] = temp;
    onChangeBlocks(next.map((b, i) => ({ ...b, sort_order: i + 1 })));
  };

  const handleToggleActive = (idx: number) => {
    const next = [...blocks];
    next[idx] = { ...next[idx], is_active: !next[idx].is_active };
    onChangeBlocks(next);
  };

  const handleRemoveBlock = async (idx: number) => {
    const targetBlock = blocks[idx];
    const r2Urls = collectBlockR2Urls(targetBlock);
    for (const u of r2Urls) {
      if (u && u !== product.thumbnail_url) {
        apiClient.deleteR2File(u).catch(() => {});
      }
    }
    const next = blocks
      .filter((_, i) => i !== idx)
      .map((b, i) => ({ ...b, sort_order: i + 1 }));
    onChangeBlocks(next);
    showToast('Đã xóa khung nội dung (và dọn dẹp file R2 đi kèm).');
  };

  const updateBlockConfig = <T,>(idx: number, updater: (prevConfig: T) => T) => {
    const next = [...blocks];
    const current = next[idx];
    next[idx] = {
      ...current,
      config: updater(current.config as T),
    };
    onChangeBlocks(next);
  };

  const handleSingleUploadR2 = async (
    file: File,
    folder: string,
    keyId: string,
    oldUrl: string | undefined,
    onSuccess: (url: string) => void
  ) => {
    setUploadingKey(keyId);
    try {
      const res = await apiClient.uploadFile(file, {
        folder,
        pageLevel1,
        pageLevel2,
      });
      if (oldUrl && oldUrl !== res.url && oldUrl !== product.thumbnail_url) {
        apiClient.deleteR2File(oldUrl).catch(() => {});
      }
      onSuccess(res.url);
      showToast('Đã tải file lên Cloudflare R2 thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải file lên R2.');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleMultiSampleImagesUpload = async (
    files: FileList,
    blockIdx: number,
    groupIdx: number
  ) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const keyId = `sample_multi_${blockIdx}_${groupIdx}`;
    setUploadingKey(keyId);
    try {
      const uploadedUrls: string[] = [];
      for (const file of fileArray) {
        const res = await apiClient.uploadFile(file, {
          folder: 'samples/pages',
          pageLevel1,
          pageLevel2,
        });
        uploadedUrls.push(res.url);
      }
      updateBlockConfig<SampleGroupsBlockConfig>(blockIdx, (cfg) => {
        const groups = [...(cfg.groups || [])];
        const currentGroup = groups[groupIdx];
        if (!currentGroup) return cfg;
        groups[groupIdx] = {
          ...currentGroup,
          images: [...(currentGroup.images || []), ...uploadedUrls],
        };
        return { ...cfg, groups };
      });
      showToast(`Đã tải lên ${uploadedUrls.length} trang ảnh mẫu lên Cloudflare R2!`);
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải các trang ảnh mẫu lên R2.');
    } finally {
      setUploadingKey(null);
    }
  };

  const previewFormats = (product.formats || []).filter((f) => f.is_active);
  const [previewSelectedFormat, setPreviewSelectedFormat] = useState<UiFormatCode>(
    previewFormats[0]?.format_code || UI_FORMATS[0]
  );

  const previewProductObj = buildFullPreviewProduct();
  const sampleGroupsPreviewConfig = blocks.find(
    (b) => b.is_active && b.type === 'sample_groups'
  )?.config as SampleGroupsBlockConfig | undefined;

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#e60049] uppercase flex items-center gap-2">
            <span>Quản lý Khối Động Trang Chi Tiết (/san-pham/${product.slug || 'chi-tiet'})</span>
            <span className="text-[10px] bg-pink-100 text-[#e60049] font-black px-2 py-0.5 rounded">
              {blocks.length} KHỐI
            </span>
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Tự do thêm/xóa, bật/tắt, đổi vị trí Lên/Xuống từng phần và tải nhiều nhóm trang ảnh A4 đọc thử trực tiếp lên Cloudflare R2.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleInitializeStandardBlocks}
            className="border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs px-3.5 py-2 rounded-sm transition"
          >
            Khởi tạo mẫu 6 Phần chuẩn
          </button>
          <button
            type="button"
            onClick={() => setShowLivePreview(!showLivePreview)}
            className="border border-gray-300 bg-white hover:border-[#e60049] text-gray-700 font-bold text-xs px-3.5 py-2 rounded-sm transition"
          >
            {showLivePreview ? 'Ẩn Xem trước' : '👁️ Xem trước Trang Chi Tiết'}
          </button>
        </div>
      </div>

      {/* Xem trước Live Preview */}
      {showLivePreview && (
        <div className="bg-gray-100 border-2 border-dashed border-pink-300 rounded-md p-4">
          <div className="text-xs font-bold text-[#e60049] uppercase mb-3 flex items-center justify-between">
            <span>Live Preview: Giao diện Trang Chi Tiết Sản Phẩm thực tế</span>
            <span className="text-[10px] text-gray-500 font-normal">Cập nhật tức thời theo cấu hình bên dưới</span>
          </div>
          <div className="bg-white rounded border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
            <UniversalBlockRenderer
              blocks={blocks}
              context={{
                pageType: 'product_detail',
                product: previewProductObj as Product,
                allProducts,
              }}
              selectedFormat={previewSelectedFormat}
              onSelectFormat={(fmt) => setPreviewSelectedFormat(fmt)}
              onBuyNow={() => showToast('Nút Đặt hàng sẽ thêm vào Giỏ & chuyển tới Thanh toán.')}
              onAddToCart={() => showToast('Đã thêm sản phẩm vào Giỏ hàng.')}
            />
          </div>
        </div>
      )}

      {/* Block Repeater & Universal Picker */}
      <UniversalBlockCardRepeater
        pageTitle={`Trang Chi Tiết (${product.title || 'Sản phẩm'})`}
        pageRouteLabel={`/san-pham/${product.slug || 'chi-tiet'}`}
        blocks={blocks}
        onBlocksChange={(newBlocks) => onChangeBlocks(newBlocks)}
        allProducts={allProducts}
        context={{
          pageType: 'product_detail',
          product: previewProductObj as Product,
          allProducts,
        }}
        quickAddTypes={[
          { type: 'product_hero', label: 'Hero Sản Phẩm' },
          { type: 'product_intro', label: 'Hộp Xám Giới Thiệu' },
          { type: 'topic_accordion', label: 'Bản Xem Thử Accordion' },
          { type: 'sample_groups', label: 'Nhóm Đọc Thử A4' },
          { type: 'bottom_cta', label: 'Nút Đặt Hàng CTA' },
          { type: 'related_products', label: 'Sản Phẩm Gợi Ý' },
          { type: 'gift_preview_download', label: 'Quà Tặng Tải Ngay' },
          { type: 'gift_cross_sell', label: 'Quà Tặng Bán Kèm' },
          { type: 'gift_donate_cta', label: 'Ủng Hộ Donate' },
        ]}
      />
    </div>
  );
};