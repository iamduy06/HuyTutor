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
    <div className="border-2 border-[#e60049]/30 rounded-md p-4 bg-white space-y-4">
      {/* Header khu vực Builder Trang cấp 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <span className="inline-block bg-[#e60049] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-sm mb-1">
            CẤU TRÚC ĐỘNG TRANG CẤP 2 (`detail_blocks`)
          </span>
          <h3 className="text-sm font-black text-gray-900">
            Trình thiết kế Bố cục Trang Chi tiết Sản phẩm (6 Phần Động như Trang chủ)
          </h3>
          <p className="text-[11px] text-gray-600 mt-0.5">
            Tự do thêm/xóa, bật/tắt, đổi vị trí Lên/Xuống từng phần và tải nhiều nhóm trang ảnh A4
            đọc thử trực tiếp lên Cloudflare R2.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleInitializeStandardBlocks}
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] px-3 py-1.5 rounded-sm transition"
          >
            Khởi tạo mẫu 6 Phần chuẩn
          </button>
          <button
            type="button"
            onClick={() => setShowLivePreview((prev) => !prev)}
            className={`font-bold text-[11px] px-3 py-1.5 rounded-sm border transition ${
              showLivePreview
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
            }`}
          >
            {showLivePreview ? 'Đóng Xem trước Trang cấp 2' : 'Xem trước Giao diện Trang cấp 2'}
          </button>
        </div>
      </div>

      {/* Thanh công cụ thêm nhanh 6 loại khung */}
      <div className="bg-gray-50 border border-gray-200 rounded-sm p-3 space-y-2">
        <div className="text-[11px] font-extrabold text-gray-700 uppercase">
          + Thêm Khung nội dung vào Trang cấp 2:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(Object.keys(DETAIL_BLOCK_META) as ProductDetailBlockType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleAddBlock(type)}
              className="text-left p-2 bg-white hover:bg-[#fff5f7] border border-gray-200 hover:border-[#e60049] rounded-sm transition group"
            >
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm ${DETAIL_BLOCK_META[type].badgeColor}`}
                >
                  + Thêm
                </span>
                <span className="text-[10px] font-mono text-gray-400">{type}</span>
              </div>
              <div className="text-[11px] font-bold text-gray-900 group-hover:text-[#e60049] mt-1 line-clamp-1">
                {DETAIL_BLOCK_META[type].label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-300 rounded-sm space-y-2">
          <p className="text-xs text-gray-600 font-semibold">
            Sản phẩm này chưa có danh sách Khung Trang cấp 2 (`detail_blocks`).
          </p>
          <button
            type="button"
            onClick={handleInitializeStandardBlocks}
            className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-2 rounded-sm transition"
          >
            Tạo ngay 6 Phần chuẩn cho sản phẩm này
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {blocks.map((block, idx) => {
            const meta = DETAIL_BLOCK_META[block.type] || {
              label: block.type,
              badgeColor: 'bg-gray-700 text-white',
              desc: '',
            };

            return (
              <div
                key={block.id}
                className={`border rounded-md overflow-hidden transition ${
                  block.is_active
                    ? 'border-gray-300 bg-white shadow-sm'
                    : 'border-gray-200 bg-gray-50 opacity-75'
                }`}
              >
                {/* Thanh tiêu đề mỗi Block */}
                <div className="bg-gray-100 border-b border-gray-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-gray-500">#{idx + 1}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-sm ${meta.badgeColor}`}
                    >
                      {meta.label}
                    </span>
                    {!block.is_active && (
                      <span className="text-[10px] bg-gray-300 text-gray-700 font-bold px-1.5 py-0.5 rounded-sm">
                        Đang ẩn
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1 text-[11px] font-bold text-gray-700 mr-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={block.is_active}
                        onChange={() => handleToggleActive(idx)}
                        className="accent-[#e60049]"
                      />
                      Hiển thị
                    </label>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveBlock(idx, -1)}
                      className="px-2 py-1 bg-white border border-gray-300 rounded-sm text-[11px] font-bold text-gray-700 disabled:opacity-40"
                    >
                      ↑ Lên
                    </button>
                    <button
                      type="button"
                      disabled={idx === blocks.length - 1}
                      onClick={() => handleMoveBlock(idx, 1)}
                      className="px-2 py-1 bg-white border border-gray-300 rounded-sm text-[11px] font-bold text-gray-700 disabled:opacity-40"
                    >
                      ↓ Xuống
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(idx)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 rounded-sm text-[11px] font-bold text-[#e60049]"
                    >
                      Xóa phần này
                    </button>
                  </div>
                </div>

                {/* Nội dung cấu hình chi tiết từng loại Block */}
                <div className="p-4 space-y-3">
                  {/* ================= PHẦN 1: PRODUCT_HERO ================= */}
                  {block.type === 'product_hero' && (() => {
                    const cfg = block.config as ProductHeroBlockConfig;
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Kiểu hiển thị Ảnh sản phẩm cột trái
                            </label>
                            <select
                              value={cfg.image_mode || 'standalone'}
                              onChange={(e) =>
                                updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  image_mode: e.target.value as 'standalone' | 'card_box',
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs bg-white font-semibold"
                            >
                              <option value="standalone">
                                Ảnh nằm độc lập (Không viền khung giả - Chuẩn huytutor.io.vn)
                              </option>
                              <option value="card_box">
                                Đặt trong khung thẻ xám bo góc kèm Tag góc phải
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Ghi đè chữ trong Badge Giá (Để trống sẽ tự tính theo Định dạng)
                            </label>
                            <input
                              type="text"
                              placeholder="VD: 169.000đ hoặc Miễn phí"
                              value={cfg.price_override_text || ''}
                              onChange={(e) =>
                                updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  price_override_text: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                            />
                          </div>
                        </div>

                        {/* Ảnh Hero */}
                        <div className="bg-blue-50/50 border border-blue-200 rounded-sm p-3 space-y-2">
                          <label className="block text-[11px] font-bold text-blue-900">
                            Ảnh sản phẩm cột trái (Cloudflare R2)
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder="https://media.huytutor.edu.vn/..."
                              value={cfg.image_url || ''}
                              onChange={(e) =>
                                updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  image_url: e.target.value,
                                }))
                              }
                              className="flex-1 border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs bg-white"
                            />
                            <label className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3 py-1.5 rounded-sm cursor-pointer text-center shrink-0">
                              {uploadingKey === `hero_img_${idx}`
                                ? 'Đang tải lên R2...'
                                : 'Tải ảnh lên R2'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  handleSingleUploadR2(
                                    f,
                                    'products/hero',
                                    `hero_img_${idx}`,
                                    cfg.image_url,
                                    (url) =>
                                      updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                        ...c,
                                        image_url: url,
                                      }))
                                  );
                                }}
                              />
                            </label>
                            {cfg.image_url && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (cfg.image_url && cfg.image_url !== product.thumbnail_url) {
                                    apiClient.deleteR2File(cfg.image_url).catch(() => {});
                                  }
                                  updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                    ...c,
                                    image_url: '',
                                  }));
                                }}
                                className="px-2.5 py-1.5 bg-white border border-red-200 text-[#e60049] text-xs font-bold rounded-sm"
                              >
                                Xóa ảnh
                              </button>
                            )}
                          </div>
                          {cfg.image_url && (
                            <div className="pt-1">
                              <img
                                src={cfg.image_url}
                                alt="Hero preview"
                                className="h-24 w-auto object-contain rounded-sm border border-gray-200 bg-white p-1"
                              />
                            </div>
                          )}
                        </div>

                        {/* Danh sách thông số ngắn ở cột phải */}
                        <div className="border border-gray-200 rounded-sm p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-800">
                              Danh sách gạch đầu dòng Thông số nhanh (Cột phải dưới giá)
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  specs: [...(c.specs || []), { label: '', val: '' }],
                                }))
                              }
                              className="px-2 py-1 bg-[#fff0f3] text-[#e60049] border border-[#e60049]/30 text-[10px] font-bold rounded-sm"
                            >
                              + Thêm dòng thông số
                            </button>
                          </div>
                          {(cfg.specs || []).map((sp, sIdx) => (
                            <div key={sIdx} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Nhãn (VD: Định dạng)"
                                value={sp.label}
                                onChange={(e) =>
                                  updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => {
                                    const list = [...(c.specs || [])];
                                    list[sIdx] = { ...list[sIdx], label: e.target.value };
                                    return { ...c, specs: list };
                                  })
                                }
                                className="w-1/3 border border-gray-300 rounded-sm px-2 py-1 text-xs"
                              />
                              <input
                                type="text"
                                placeholder="Giá trị (VD: File Word (.docx) - nhận qua Gmail)"
                                value={sp.val}
                                onChange={(e) =>
                                  updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => {
                                    const list = [...(c.specs || [])];
                                    list[sIdx] = { ...list[sIdx], val: e.target.value };
                                    return { ...c, specs: list };
                                  })
                                }
                                className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                    ...c,
                                    specs: (c.specs || []).filter((_, i) => i !== sIdx),
                                  }))
                                }
                                className="text-xs font-bold text-gray-400 hover:text-[#e60049]"
                              >
                                Xóa
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Nút CTA chính & Link phụ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="border border-gray-200 rounded-sm p-2.5 space-y-2">
                            <div className="text-[11px] font-bold text-gray-800">
                              Nút Đỏ Chính (VD: "Đặt hàng" hoặc "Tải xuống")
                            </div>
                            <input
                              type="text"
                              placeholder="Nhãn nút (VD: Đặt hàng)"
                              value={cfg.primary_cta_text || ''}
                              onChange={(e) =>
                                updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  primary_cta_text: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                            />
                            <select
                              value={cfg.primary_cta_action || 'buy_now'}
                              onChange={(e) =>
                                updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  primary_cta_action: e.target.value as
                                    | 'buy_now'
                                    | 'add_to_cart'
                                    | 'custom_link',
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs bg-white"
                            >
                              <option value="buy_now">
                                Mua ngay (Thêm vào Giỏ &amp; chuyển tới Thanh toán)
                              </option>
                              <option value="add_to_cart">Chỉ thêm vào Giỏ hàng</option>
                              <option value="custom_link">
                                Mở đường dẫn đích (Link nội bộ /url hoặc https://)
                              </option>
                            </select>
                            {cfg.primary_cta_action === 'custom_link' && (
                              <input
                                type="text"
                                placeholder="https://... hoặc /combo"
                                value={cfg.primary_cta_link || ''}
                                onChange={(e) =>
                                  updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                    ...c,
                                    primary_cta_link: e.target.value,
                                  }))
                                }
                                onBlur={(e) =>
                                  updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                    ...c,
                                    primary_cta_link: normalizeTargetUrl(e.target.value),
                                  }))
                                }
                                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                              />
                            )}
                          </div>

                          <div className="border border-gray-200 rounded-sm p-2.5 space-y-2">
                            <div className="text-[11px] font-bold text-gray-800">
                              Link Phụ Gạch Chân Bên Dưới (VD: "Mua combo ưu đãi")
                            </div>
                            <input
                              type="text"
                              placeholder="Nhãn link phụ (Để trống nếu muốn ẩn)"
                              value={cfg.secondary_cta_text || ''}
                              onChange={(e) =>
                                updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  secondary_cta_text: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Đường dẫn đích (/high-school/combo hoặc https://...)"
                              value={cfg.secondary_cta_link || ''}
                              onChange={(e) =>
                                updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  secondary_cta_link: e.target.value,
                                }))
                              }
                              onBlur={(e) =>
                                updateBlockConfig<ProductHeroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  secondary_cta_link: normalizeTargetUrl(e.target.value),
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ================= PHẦN 2: PRODUCT_INTRO ================= */}
                  {block.type === 'product_intro' && (() => {
                    const cfg = block.config as ProductIntroBlockConfig;
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <label className="text-[11px] font-bold text-gray-700">
                            Màu nền khung mô tả:
                          </label>
                          <select
                            value={cfg.bg_style || 'gray'}
                            onChange={(e) =>
                              updateBlockConfig<ProductIntroBlockConfig>(idx, (c) => ({
                                ...c,
                                bg_style: e.target.value as 'gray' | 'white',
                              }))
                            }
                            className="border border-gray-300 rounded-sm px-2.5 py-1 text-xs bg-white font-semibold"
                          >
                            <option value="gray">
                              Nền xám nhạt (#f3f4f6 - Chuẩn huytutor.io.vn)
                            </option>
                            <option value="white">Nền trắng có viền mảnh</option>
                          </select>
                        </div>

                        {/* Đoạn văn giới thiệu mở đầu */}
                        <div className="border border-gray-200 rounded-sm p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-800">
                              Các đoạn văn giới thiệu mở đầu (Paragraphs)
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateBlockConfig<ProductIntroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  paragraphs: [...(c.paragraphs || []), ''],
                                }))
                              }
                              className="px-2 py-1 bg-[#fff0f3] text-[#e60049] border border-[#e60049]/30 text-[10px] font-bold rounded-sm"
                            >
                              + Thêm đoạn văn
                            </button>
                          </div>
                          {(cfg.paragraphs || []).map((p, pIdx) => (
                            <div key={pIdx} className="flex gap-2 items-start">
                              <textarea
                                rows={2}
                                placeholder="Nhập đoạn văn giới thiệu bộ tài liệu..."
                                value={p}
                                onChange={(e) =>
                                  updateBlockConfig<ProductIntroBlockConfig>(idx, (c) => {
                                    const list = [...(c.paragraphs || [])];
                                    list[pIdx] = e.target.value;
                                    return { ...c, paragraphs: list };
                                  })
                                }
                                className="flex-1 border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlockConfig<ProductIntroBlockConfig>(idx, (c) => ({
                                    ...c,
                                    paragraphs: (c.paragraphs || []).filter((_, i) => i !== pIdx),
                                  }))
                                }
                                className="text-xs font-bold text-gray-400 hover:text-[#e60049] pt-1"
                              >
                                Xóa
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Các gạch đầu dòng điểm nổi bật (có tuỳ chọn Tô đỏ in đậm) */}
                        <div className="border border-gray-200 rounded-sm p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-800">
                              Danh sách gạch đầu dòng chi tiết (Tích chọn "Tô đỏ" để nhấn mạnh như
                              bản gốc)
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateBlockConfig<ProductIntroBlockConfig>(idx, (c) => ({
                                  ...c,
                                  bullets: [
                                    ...(c.bullets || []),
                                    {
                                      id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                                      text: '',
                                      is_highlight: false,
                                    },
                                  ],
                                }))
                              }
                              className="px-2 py-1 bg-[#fff0f3] text-[#e60049] border border-[#e60049]/30 text-[10px] font-bold rounded-sm"
                            >
                              + Thêm gạch đầu dòng
                            </button>
                          </div>
                          {(cfg.bullets || []).map((b, bIdx) => (
                            <div
                              key={b.id || bIdx}
                              className="flex flex-wrap sm:flex-nowrap gap-2 items-center"
                            >
                              <input
                                type="text"
                                placeholder="Nội dung gạch đầu dòng..."
                                value={b.text}
                                onChange={(e) =>
                                  updateBlockConfig<ProductIntroBlockConfig>(idx, (c) => {
                                    const list = [...(c.bullets || [])];
                                    list[bIdx] = { ...list[bIdx], text: e.target.value };
                                    return { ...c, bullets: list };
                                  })
                                }
                                className={`flex-1 border border-gray-300 rounded-sm px-2.5 py-1 text-xs ${
                                  b.is_highlight ? 'text-[#e60049] font-bold bg-[#fff5f7]' : ''
                                }`}
                              />
                              <label className="flex items-center gap-1 text-[11px] font-bold text-[#e60049] shrink-0 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={Boolean(b.is_highlight)}
                                  onChange={(e) =>
                                    updateBlockConfig<ProductIntroBlockConfig>(idx, (c) => {
                                      const list = [...(c.bullets || [])];
                                      list[bIdx] = {
                                        ...list[bIdx],
                                        is_highlight: e.target.checked,
                                      };
                                      return { ...c, bullets: list };
                                    })
                                  }
                                  className="accent-[#e60049]"
                                />
                                Tô đỏ in đậm
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  updateBlockConfig<ProductIntroBlockConfig>(idx, (c) => ({
                                    ...c,
                                    bullets: (c.bullets || []).filter((_, i) => i !== bIdx),
                                  }))
                                }
                                className="text-xs font-bold text-gray-400 hover:text-[#e60049]"
                              >
                                Xóa
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ================= PHẦN 3: TOPIC_ACCORDION ================= */}
                  {block.type === 'topic_accordion' && (() => {
                    const cfg = block.config as TopicAccordionBlockConfig;
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Tiêu đề khu vực (Có gạch chân xám kéo dài)
                            </label>
                            <input
                              type="text"
                              placeholder="VD: Bản xem thử"
                              value={cfg.section_heading || ''}
                              onChange={(e) =>
                                updateBlockConfig<TopicAccordionBlockConfig>(idx, (c) => ({
                                  ...c,
                                  section_heading: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs font-bold text-[#e60049]"
                            />
                          </div>

                          <label className="flex items-center gap-2 text-xs font-bold text-gray-800 pt-4 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(cfg.show_quick_anchor_nav)}
                              onChange={(e) =>
                                updateBlockConfig<TopicAccordionBlockConfig>(idx, (c) => ({
                                  ...c,
                                  show_quick_anchor_nav: e.target.checked,
                                }))
                              }
                              className="accent-[#e60049] w-4 h-4"
                            />
                            Hiển thị hàng nút nhảy nhanh tới các nhóm ảnh mẫu (Phần 4)
                          </label>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-gray-800">
                              Danh sách Hộp Đóng/Mở (Accordions - VD: "Danh sách chủ đề")
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateBlockConfig<TopicAccordionBlockConfig>(idx, (c) => ({
                                  ...c,
                                  accordions: [
                                    ...(c.accordions || []),
                                    {
                                      id: `acc_${Date.now()}`,
                                      title: 'Danh sách chủ đề',
                                      default_open: true,
                                      items: [],
                                    },
                                  ],
                                }))
                              }
                              className="px-2.5 py-1 bg-[#fff0f3] text-[#e60049] border border-[#e60049]/30 text-[11px] font-bold rounded-sm"
                            >
                              + Thêm hộp Mở rộng
                            </button>
                          </div>

                          {(cfg.accordions || []).map((acc: TopicAccordionBox, aIdx: number) => {
                            const bulkKey = `${block.id}_${acc.id}`;
                            return (
                              <div
                                key={acc.id || aIdx}
                                className="border border-gray-200 rounded-sm p-3 bg-gray-50/60 space-y-2.5"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <input
                                    type="text"
                                    placeholder="Tiêu đề hộp (VD: Danh sách chủ đề)"
                                    value={acc.title}
                                    onChange={(e) =>
                                      updateBlockConfig<TopicAccordionBlockConfig>(idx, (c) => {
                                        const list = [...(c.accordions || [])];
                                        list[aIdx] = { ...list[aIdx], title: e.target.value };
                                        return { ...c, accordions: list };
                                      })
                                    }
                                    className="border border-gray-300 rounded-sm px-2.5 py-1 text-xs font-bold text-[#e60049] bg-white w-64"
                                  />
                                  <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-1 text-[11px] font-bold text-gray-700 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={acc.default_open !== false}
                                        onChange={(e) =>
                                          updateBlockConfig<TopicAccordionBlockConfig>(idx, (c) => {
                                            const list = [...(c.accordions || [])];
                                            list[aIdx] = {
                                              ...list[aIdx],
                                              default_open: e.target.checked,
                                            };
                                            return { ...c, accordions: list };
                                          })
                                        }
                                        className="accent-[#e60049]"
                                      />
                                      Mở sẵn mặc định
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateBlockConfig<TopicAccordionBlockConfig>(idx, (c) => ({
                                          ...c,
                                          accordions: (c.accordions || []).filter(
                                            (_, i) => i !== aIdx
                                          ),
                                        }))
                                      }
                                      className="text-xs font-bold text-[#e60049]"
                                    >
                                      Xóa hộp
                                    </button>
                                  </div>
                                </div>

                                <div className="bg-white border border-gray-200 rounded-sm p-2.5 space-y-1.5">
                                  <label className="block text-[11px] font-bold text-gray-700">
                                    Danh sách các dòng chủ đề (Mỗi dòng tương ứng 1 dấu chấm • VD:
                                    "Đề 1: Topic... - Số câu: 40 câu"):
                                  </label>
                                  <textarea
                                    rows={5}
                                    placeholder={
                                      'Đề 1: Chủ đề A - Số câu: 40 câu\nĐề 2: Chủ đề B - Số câu: 40 câu'
                                    }
                                    value={
                                      bulkTopicInputMap[bulkKey] !== undefined
                                        ? bulkTopicInputMap[bulkKey]
                                        : (acc.items || []).join('\n')
                                    }
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      setBulkTopicInputMap((prev) => ({
                                        ...prev,
                                        [bulkKey]: raw,
                                      }));
                                      const lines = raw
                                        .split('\n')
                                        .map((l) => l.trim())
                                        .filter(Boolean);
                                      updateBlockConfig<TopicAccordionBlockConfig>(idx, (c) => {
                                        const list = [...(c.accordions || [])];
                                        list[aIdx] = { ...list[aIdx], items: lines };
                                        return { ...c, accordions: list };
                                      });
                                    }}
                                    className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs font-mono"
                                  />
                                  <div className="text-[10px] text-gray-500">
                                    Đang có <strong>{(acc.items || []).length}</strong> dòng chủ đề.
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* ================= PHẦN 4: SAMPLE_GROUPS ================= */}
                  {block.type === 'sample_groups' && (() => {
                    const cfg = block.config as SampleGroupsBlockConfig;
                    const groups = cfg.groups || [];

                    const addSampleGroup = (presetTitle = 'Demo đề thi') => {
                      updateBlockConfig<SampleGroupsBlockConfig>(idx, (c) => ({
                        ...c,
                        groups: [
                          ...(c.groups || []),
                          {
                            id: `sgrp_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                            title: presetTitle,
                            description: '',
                            media_type: 'images',
                            images: [],
                            pdf_url: '',
                            watermark_enabled: false,
                            watermark_text: '',
                            is_active: true,
                            sort_order: (c.groups || []).length + 1,
                          },
                        ],
                      }));
                    };

                    const moveGroup = (gIdx: number, dir: -1 | 1) => {
                      const target = gIdx + dir;
                      if (target < 0 || target >= groups.length) return;
                      updateBlockConfig<SampleGroupsBlockConfig>(idx, (c) => {
                        const next = [...(c.groups || [])];
                        const temp = next[gIdx];
                        next[gIdx] = next[target];
                        next[target] = temp;
                        return {
                          ...c,
                          groups: next.map((g, i) => ({ ...g, sort_order: i + 1 })),
                        };
                      });
                    };

                    const removeGroup = (gIdx: number) => {
                      const g = groups[gIdx];
                      if (g) {
                        if (g.pdf_url) apiClient.deleteR2File(g.pdf_url).catch(() => {});
                        (g.images || []).forEach((u) => {
                          if (u) apiClient.deleteR2File(u).catch(() => {});
                        });
                      }
                      updateBlockConfig<SampleGroupsBlockConfig>(idx, (c) => ({
                        ...c,
                        groups: (c.groups || [])
                          .filter((_, i) => i !== gIdx)
                          .map((grp, i) => ({ ...grp, sort_order: i + 1 })),
                      }));
                      showToast('Đã xóa nhóm đọc thử và dọn dẹp các trang ảnh trên R2.');
                    };

                    return (
                      <div className="space-y-4">
                        {/* Thanh nút thêm nhanh Nhóm đọc thử */}
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fff5f7] border border-pink-200 rounded-sm p-2.5">
                          <span className="text-xs font-extrabold text-[#e60049]">
                            Quản lý các Nhóm Ảnh Đọc Thử ({groups.length} nhóm):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'Demo đề thi',
                              'Demo đáp án & giải thích',
                              'Demo bảng từ vựng',
                              'Ma trận tham khảo',
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => addSampleGroup(preset)}
                                className="px-2.5 py-1 bg-white hover:bg-[#e60049] text-[#e60049] hover:text-white border border-[#e60049]/40 rounded-sm text-[11px] font-bold transition"
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {groups.map((grp: SamplePreviewGroup, gIdx: number) => {
                          const multiUploadKey = `sample_multi_${idx}_${gIdx}`;
                          return (
                            <div
                              key={grp.id || gIdx}
                              className="border border-gray-300 rounded-sm p-3.5 bg-gray-50/50 space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                                  <span className="bg-[#e60049] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-sm">
                                    Nhóm #{gIdx + 1}
                                  </span>
                                  <input
                                    type="text"
                                    placeholder="Tiêu đề nhóm (VD: Demo đề thi)"
                                    value={grp.title}
                                    onChange={(e) =>
                                      updateBlockConfig<SampleGroupsBlockConfig>(idx, (c) => {
                                        const list = [...(c.groups || [])];
                                        list[gIdx] = { ...list[gIdx], title: e.target.value };
                                        return { ...c, groups: list };
                                      })
                                    }
                                    className="flex-1 border border-gray-300 rounded-sm px-2.5 py-1 text-xs font-bold text-[#e60049] bg-white"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={grp.media_type || 'images'}
                                    onChange={(e) =>
                                      updateBlockConfig<SampleGroupsBlockConfig>(idx, (c) => {
                                        const list = [...(c.groups || [])];
                                        list[gIdx] = {
                                          ...list[gIdx],
                                          media_type: e.target.value as 'images' | 'pdf',
                                        };
                                        return { ...c, groups: list };
                                      })
                                    }
                                    className="border border-gray-300 rounded-sm px-2 py-1 text-[11px] bg-white font-semibold"
                                  >
                                    <option value="images">Các trang Ảnh A4 dọc</option>
                                    <option value="pdf">Nhúng file PDF</option>
                                  </select>
                                  <button
                                    type="button"
                                    disabled={gIdx === 0}
                                    onClick={() => moveGroup(gIdx, -1)}
                                    className="px-2 py-1 bg-white border border-gray-300 rounded-sm text-[10px] font-bold disabled:opacity-40"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    disabled={gIdx === groups.length - 1}
                                    onClick={() => moveGroup(gIdx, 1)}
                                    className="px-2 py-1 bg-white border border-gray-300 rounded-sm text-[10px] font-bold disabled:opacity-40"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeGroup(gIdx)}
                                    className="px-2 py-1 bg-red-50 text-[#e60049] border border-red-200 rounded-sm text-[10px] font-bold"
                                  >
                                    Xóa nhóm
                                  </button>
                                </div>
                              </div>

                              {grp.media_type === 'pdf' ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Link file PDF trên R2 hoặc Google Drive..."
                                    value={grp.pdf_url || ''}
                                    onChange={(e) =>
                                      updateBlockConfig<SampleGroupsBlockConfig>(idx, (c) => {
                                        const list = [...(c.groups || [])];
                                        list[gIdx] = { ...list[gIdx], pdf_url: e.target.value };
                                        return { ...c, groups: list };
                                      })
                                    }
                                    className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs bg-white"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-2.5">
                                  {/* Nút tải nhiều trang ảnh A4 cùng lúc lên R2 */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-dashed border-gray-300 rounded-sm p-2.5">
                                    <div className="text-[11px] text-gray-600">
                                      Đang có <strong>{(grp.images || []).length}</strong> trang ảnh
                                      A4 độc lập trong nhóm <strong>"{grp.title}"</strong>.
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <label className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3 py-1.5 rounded-sm cursor-pointer">
                                        {uploadingKey === multiUploadKey
                                          ? 'Đang tải các trang lên R2...'
                                          : '+ Chọn tải (1 hoặc nhiều) trang Ảnh lên R2'}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          multiple
                                          className="hidden"
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                              handleMultiSampleImagesUpload(
                                                e.target.files,
                                                idx,
                                                gIdx
                                              );
                                              e.target.value = '';
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>

                                  {/* Lưới quản lý các trang ảnh đã tải lên trong nhóm */}
                                  {(grp.images || []).length > 0 && (
                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-1">
                                      {(grp.images || []).map((imgUrl, imgIdx) => (
                                        <div
                                          key={imgIdx}
                                          className="bg-white border border-gray-200 rounded-sm p-1.5 flex flex-col justify-between shadow-sm"
                                        >
                                          <div className="relative">
                                            <span className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                                              Trang {imgIdx + 1}
                                            </span>
                                            <img
                                              src={imgUrl}
                                              alt={`Trang ${imgIdx + 1}`}
                                              className="w-full h-32 object-contain bg-gray-50 rounded-sm"
                                            />
                                          </div>
                                          <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-gray-100">
                                            <div className="flex gap-1">
                                              <button
                                                type="button"
                                                disabled={imgIdx === 0}
                                                onClick={() =>
                                                  updateBlockConfig<SampleGroupsBlockConfig>(
                                                    idx,
                                                    (c) => {
                                                      const list = [...(c.groups || [])];
                                                      const imgs = [...(list[gIdx].images || [])];
                                                      const tmp = imgs[imgIdx];
                                                      imgs[imgIdx] = imgs[imgIdx - 1];
                                                      imgs[imgIdx - 1] = tmp;
                                                      list[gIdx] = { ...list[gIdx], images: imgs };
                                                      return { ...c, groups: list };
                                                    }
                                                  )
                                                }
                                                className="px-1.5 py-0.5 bg-gray-100 rounded-sm text-[10px] font-bold disabled:opacity-40"
                                              >
                                                ←
                                              </button>
                                              <button
                                                type="button"
                                                disabled={imgIdx === (grp.images || []).length - 1}
                                                onClick={() =>
                                                  updateBlockConfig<SampleGroupsBlockConfig>(
                                                    idx,
                                                    (c) => {
                                                      const list = [...(c.groups || [])];
                                                      const imgs = [...(list[gIdx].images || [])];
                                                      const tmp = imgs[imgIdx];
                                                      imgs[imgIdx] = imgs[imgIdx + 1];
                                                      imgs[imgIdx + 1] = tmp;
                                                      list[gIdx] = { ...list[gIdx], images: imgs };
                                                      return { ...c, groups: list };
                                                    }
                                                  )
                                                }
                                                className="px-1.5 py-0.5 bg-gray-100 rounded-sm text-[10px] font-bold disabled:opacity-40"
                                              >
                                                →
                                              </button>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                if (imgUrl) {
                                                  apiClient.deleteR2File(imgUrl).catch(() => {});
                                                }
                                                updateBlockConfig<SampleGroupsBlockConfig>(
                                                  idx,
                                                  (c) => {
                                                    const list = [...(c.groups || [])];
                                                    list[gIdx] = {
                                                      ...list[gIdx],
                                                      images: (list[gIdx].images || []).filter(
                                                        (_, i) => i !== imgIdx
                                                      ),
                                                    };
                                                    return { ...c, groups: list };
                                                  }
                                                );
                                              }}
                                              className="text-[10px] font-bold text-[#e60049] hover:underline"
                                            >
                                              Xóa
                                            </button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* ================= PHẦN 5: BOTTOM_CTA ================= */}
                  {block.type === 'bottom_cta' && (() => {
                    const cfg = block.config as BottomCtaBlockConfig;
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Dòng chữ cảm ơn in đậm
                            </label>
                            <input
                              type="text"
                              placeholder="Cảm ơn Quý Thầy/Cô và các bạn đã tham khảo tài liệu này!"
                              value={cfg.thank_you_text || ''}
                              onChange={(e) =>
                                updateBlockConfig<BottomCtaBlockConfig>(idx, (c) => ({
                                  ...c,
                                  thank_you_text: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Dòng mô tả phụ bên dưới (Tuỳ chọn)
                            </label>
                            <input
                              type="text"
                              placeholder="Để trống nếu không cần"
                              value={cfg.sub_text || ''}
                              onChange={(e) =>
                                updateBlockConfig<BottomCtaBlockConfig>(idx, (c) => ({
                                  ...c,
                                  sub_text: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="border border-gray-200 rounded-sm p-2.5 space-y-2">
                            <div className="text-[11px] font-bold text-gray-800">
                              Nút Đỏ Chính Cuối Trang
                            </div>
                            <input
                              type="text"
                              placeholder="Đặt hàng"
                              value={cfg.primary_button_text || ''}
                              onChange={(e) =>
                                updateBlockConfig<BottomCtaBlockConfig>(idx, (c) => ({
                                  ...c,
                                  primary_button_text: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                            />
                            <select
                              value={cfg.primary_button_action || 'buy_now'}
                              onChange={(e) =>
                                updateBlockConfig<BottomCtaBlockConfig>(idx, (c) => ({
                                  ...c,
                                  primary_button_action: e.target.value as
                                    | 'buy_now'
                                    | 'add_to_cart'
                                    | 'custom_link',
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs bg-white"
                            >
                              <option value="buy_now">
                                Mua ngay (Thêm vào Giỏ &amp; chuyển tới Thanh toán)
                              </option>
                              <option value="add_to_cart">Chỉ thêm vào Giỏ hàng</option>
                              <option value="custom_link">Mở đường dẫn đích</option>
                            </select>
                            {cfg.primary_button_action === 'custom_link' && (
                              <input
                                type="text"
                                placeholder="/url hoặc https://..."
                                value={cfg.primary_button_link || ''}
                                onChange={(e) =>
                                  updateBlockConfig<BottomCtaBlockConfig>(idx, (c) => ({
                                    ...c,
                                    primary_button_link: e.target.value,
                                  }))
                                }
                                onBlur={(e) =>
                                  updateBlockConfig<BottomCtaBlockConfig>(idx, (c) => ({
                                    ...c,
                                    primary_button_link: normalizeTargetUrl(e.target.value),
                                  }))
                                }
                                className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                              />
                            )}
                          </div>

                          <div className="border border-gray-200 rounded-sm p-2.5 space-y-2">
                            <div className="text-[11px] font-bold text-gray-800">
                              Link Phụ Gạch Chân (VD: "Mua combo ưu đãi")
                            </div>
                            <input
                              type="text"
                              placeholder="Mua combo ưu đãi (Để trống nếu ẩn)"
                              value={cfg.secondary_link_text || ''}
                              onChange={(e) =>
                                updateBlockConfig<BottomCtaBlockConfig>(idx, (c) => ({
                                  ...c,
                                  secondary_link_text: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                            />
                            <input
                              type="text"
                              placeholder="/high-school/combo hoặc https://..."
                              value={cfg.secondary_link_url || ''}
                              onChange={(e) =>
                                updateBlockConfig<BottomCtaBlockConfig>(idx, (c) => ({
                                  ...c,
                                  secondary_link_url: e.target.value,
                                }))
                              }
                              onBlur={(e) =>
                                updateBlockConfig<BottomCtaBlockConfig>(idx, (c) => ({
                                  ...c,
                                  secondary_link_url: normalizeTargetUrl(e.target.value),
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ================= PHẦN 6: RELATED_PRODUCTS ================= */}
                  {block.type === 'related_products' && (() => {
                    const cfg = block.config as RelatedProductsBlockConfig;
                    return (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Tiêu đề khu vực (VD: Nhiều Thầy/Cô cũng chọn)
                            </label>
                            <input
                              type="text"
                              value={cfg.title || ''}
                              onChange={(e) =>
                                updateBlockConfig<RelatedProductsBlockConfig>(idx, (c) => ({
                                  ...c,
                                  title: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs font-bold text-[#e60049]"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Chế độ lấy sản phẩm liên quan
                            </label>
                            <select
                              value={cfg.mode || 'auto'}
                              onChange={(e) =>
                                updateBlockConfig<RelatedProductsBlockConfig>(idx, (c) => ({
                                  ...c,
                                  mode: e.target.value as 'auto' | 'manual',
                                }))
                              }
                              className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs bg-white font-semibold"
                            >
                              <option value="auto">Tự động lấy cùng danh mục</option>
                              <option value="manual">Tự cấu hình từng thẻ sản phẩm</option>
                            </select>
                          </div>

                          {cfg.mode !== 'manual' && (
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                                Số lượng hiển thị tối đa
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={cfg.max_items || 3}
                                onChange={(e) =>
                                  updateBlockConfig<RelatedProductsBlockConfig>(idx, (c) => ({
                                    ...c,
                                    max_items: Number(e.target.value) || 3,
                                  }))
                                }
                                className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                              />
                            </div>
                          )}
                        </div>

                        {cfg.mode === 'manual' && (
                          <div className="space-y-2 border border-gray-200 rounded-sm p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-[11px] font-bold text-gray-800">
                                Danh sách thẻ sản phẩm liên quan ({(cfg.items || []).length} thẻ):
                              </span>
                              <div className="flex gap-2">
                                <select
                                  defaultValue=""
                                  onChange={(e) => {
                                    const found = allProducts.find((p) => p.slug === e.target.value);
                                    if (!found) return;
                                    updateBlockConfig<RelatedProductsBlockConfig>(idx, (c) => ({
                                      ...c,
                                      items: [
                                        ...(c.items || []),
                                        {
                                          id: `rel_${Date.now()}`,
                                          display_title: found.title,
                                          image_url: found.thumbnail_url,
                                          badge_text: found.badge_text,
                                          tag_text: found.cover_tag,
                                          button_text: 'Đọc thử',
                                          target_url: `/${found.category_slug}/${found.slug}`,
                                          is_active: true,
                                        },
                                      ],
                                    }));
                                    e.target.value = '';
                                  }}
                                  className="border border-gray-300 rounded-sm px-2 py-1 text-[11px] bg-white"
                                >
                                  <option value="">+ Chọn nhanh từ Sản phẩm có sẵn...</option>
                                  {allProducts.map((p) => (
                                    <option key={p.id} value={p.slug}>
                                      {p.title}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateBlockConfig<RelatedProductsBlockConfig>(idx, (c) => ({
                                      ...c,
                                      items: [
                                        ...(c.items || []),
                                        {
                                          id: `rel_${Date.now()}`,
                                          display_title: '',
                                          image_url: '',
                                          badge_text: '',
                                          tag_text: '',
                                          button_text: 'Đọc thử',
                                          target_url: '',
                                          is_active: true,
                                        },
                                      ],
                                    }))
                                  }
                                  className="px-2.5 py-1 bg-[#fff0f3] text-[#e60049] border border-[#e60049]/30 text-[11px] font-bold rounded-sm"
                                >
                                  + Thêm thẻ trống
                                </button>
                              </div>
                            </div>

                            {(cfg.items || []).map((item, rIdx) => (
                              <div
                                key={item.id || rIdx}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-2 border border-gray-200 rounded-sm p-2 bg-gray-50"
                              >
                                <input
                                  type="text"
                                  placeholder="Tiêu đề dưới nút"
                                  value={item.display_title || ''}
                                  onChange={(e) =>
                                    updateBlockConfig<RelatedProductsBlockConfig>(idx, (c) => {
                                      const list = [...(c.items || [])];
                                      list[rIdx] = { ...list[rIdx], display_title: e.target.value };
                                      return { ...c, items: list };
                                    })
                                  }
                                  className="border border-gray-300 rounded-sm px-2 py-1 text-xs bg-white"
                                />
                                <input
                                  type="text"
                                  placeholder="Link ảnh R2"
                                  value={item.image_url || ''}
                                  onChange={(e) =>
                                    updateBlockConfig<RelatedProductsBlockConfig>(idx, (c) => {
                                      const list = [...(c.items || [])];
                                      list[rIdx] = { ...list[rIdx], image_url: e.target.value };
                                      return { ...c, items: list };
                                    })
                                  }
                                  className="border border-gray-300 rounded-sm px-2 py-1 text-xs bg-white"
                                />
                                <div className="flex gap-1">
                                  <input
                                    type="text"
                                    placeholder="/url hoặc https://..."
                                    value={item.target_url || ''}
                                    onChange={(e) =>
                                      updateBlockConfig<RelatedProductsBlockConfig>(idx, (c) => {
                                        const list = [...(c.items || [])];
                                        list[rIdx] = { ...list[rIdx], target_url: e.target.value };
                                        return { ...c, items: list };
                                      })
                                    }
                                    onBlur={(e) =>
                                      updateBlockConfig<RelatedProductsBlockConfig>(idx, (c) => {
                                        const list = [...(c.items || [])];
                                        list[rIdx] = {
                                          ...list[rIdx],
                                          target_url: normalizeTargetUrl(e.target.value),
                                        };
                                        return { ...c, items: list };
                                      })
                                    }
                                    className="flex-1 border border-gray-300 rounded-sm px-2 py-1 text-xs bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateBlockConfig<RelatedProductsBlockConfig>(idx, (c) => ({
                                        ...c,
                                        items: (c.items || []).filter((_, i) => i !== rIdx),
                                      }))
                                    }
                                    className="px-2 text-xs font-bold text-[#e60049]"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BẢN XEM TRƯỚC TRỰC TIẾP TRANG CẤP 2 */}
      {showLivePreview && (
        <div className="border-2 border-gray-900 rounded-md overflow-hidden bg-white mt-4">
          <div className="bg-gray-900 text-white px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              Bản Xem Trước Trực Tiếp Giao Diện Trang Cấp 2 (`/{product.category_slug}/
              {product.slug}`)
            </span>
            <button
              type="button"
              onClick={() => setShowLivePreview(false)}
              className="text-xs text-gray-300 hover:text-white font-bold"
            >
              Thu gọn ✕
            </button>
          </div>
          <div className="p-6 max-h-[850px] overflow-y-auto space-y-8">
            {blocks
              .filter((b) => b.is_active)
              .map((block) => {
                switch (block.type) {
                  case 'product_hero':
                    return (
                      <ProductHeroBlock
                        key={block.id}
                        config={block.config as ProductHeroBlockConfig}
                        product={previewProductObj}
                        selectedFormat={previewSelectedFormat}
                        onSelectFormat={setPreviewSelectedFormat}
                        onBuyNow={() =>
                          showToast('Nút Mua ngay sẽ thêm vào Giỏ & chuyển tới Thanh toán.')
                        }
                        onAddToCart={() => showToast('Đã thêm sản phẩm vào Giỏ hàng.')}
                      />
                    );
                  case 'product_intro':
                    return (
                      <ProductIntroBlock
                        key={block.id}
                        config={block.config as ProductIntroBlockConfig}
                      />
                    );
                  case 'topic_accordion':
                    return (
                      <TopicAccordionBlock
                        key={block.id}
                        config={block.config as TopicAccordionBlockConfig}
                        sampleGroups={sampleGroupsPreviewConfig?.groups}
                      />
                    );
                  case 'sample_groups':
                    return (
                      <SampleGroupsBlock
                        key={block.id}
                        config={block.config as SampleGroupsBlockConfig}
                      />
                    );
                  case 'bottom_cta':
                    return (
                      <BottomCtaBlock
                        key={block.id}
                        config={block.config as BottomCtaBlockConfig}
                        selectedFormat={previewSelectedFormat}
                        onBuyNow={() =>
                          showToast('Nút Đặt hàng sẽ thêm vào Giỏ & chuyển tới Thanh toán.')
                        }
                        onAddToCart={() => showToast('Đã thêm sản phẩm vào Giỏ hàng.')}
                      />
                    );
                  case 'related_products':
                    return (
                      <RelatedProductsBlock
                        key={block.id}
                        config={block.config as RelatedProductsBlockConfig}
                        autoRelatedProducts={allProducts.filter(
                          (p) =>
                            p.slug !== previewProductObj.slug &&
                            p.category_slug === previewProductObj.category_slug
                        )}
                      />
                    );
                  default:
                    return null;
                }
              })}
          </div>
        </div>
      )}
    </div>
  );
};
