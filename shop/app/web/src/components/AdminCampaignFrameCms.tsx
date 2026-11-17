import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import {
  CampaignFrameConfig,
  CampaignFramePreset,
  CampaignFrameScope,
  CampaignSlugMatchMode,
  AspectRatioMode,
  PresetAspectRatio,
} from '../types';
import { ProductImageFrame } from './ProductImageFrame';
import { R2ImageUploader } from './R2ImageUploader';
import {
  extractAllSlugs,
  toggleSlugItem,
  isSlugSelected,
  selectAllSlugs,
  deselectAllSlugs,
  SlugItem,
  SlugGroupKey,
  SLUG_GROUPS,
} from '../utils/slugRegistry';

type FilterTabKey =
  | 'all'
  | 'selected'
  | 'core'
  | 'category_level1'
  | 'product_level2'
  | 'utility_policy_custom';

export const AdminCampaignFrameCms: React.FC = () => {
  const { siteConfigs, updateSiteConfig, products, categories, showToast } = useStore();

  // State cấu hình chiến dịch
  const [config, setConfig] = useState<CampaignFrameConfig>(() => {
    const existing = siteConfigs?.campaign_frame;
    return {
      is_enabled: existing?.is_enabled ?? false,
      frame_type: existing?.frame_type || 'preset',
      preset_name: existing?.preset_name || 'tet',
      custom_frame_url: existing?.custom_frame_url || '',
      scope: (existing?.scope as CampaignFrameScope) || 'global',
      applied_product_ids: existing?.applied_product_ids || [],
      applied_slugs: existing?.applied_slugs || [],
      slug_match_mode: existing?.slug_match_mode || 'exact',
    };
  });

  // State sandbox xem trước trực tiếp
  const [testRatioMode, setTestRatioMode] = useState<AspectRatioMode>('preset');
  const [testPresetRatio, setTestPresetRatio] = useState<PresetAspectRatio>('3:4');
  const [testCustomW, setTestCustomW] = useState<number>(5);
  const [testCustomH, setTestCustomH] = useState<number>(7);
  const [testMaxWidth, setTestMaxWidth] = useState<number>(360);
  const [testObjectFit, setTestObjectFit] = useState<'cover' | 'contain'>('cover');
  const [testProductId, setTestProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [customTestImgUrl, setCustomTestImgUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // State cho bộ chọn Slug (Campaign Slug Selector Suite)
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<FilterTabKey>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [productCodeSearch, setProductCodeSearch] = useState<string>('');

  // State Accordions đóng/mở cho 4 nhóm
  const [accordionsOpen, setAccordionsOpen] = useState<Record<SlugGroupKey, boolean>>({
    core: true,
    category_level1: true,
    product_level2: true,
    utility_policy_custom: true,
  });

  // Trích xuất toàn bộ slug tĩnh & động của toàn hệ thống
  const allSlugItems = useMemo<SlugItem[]>(() => {
    return extractAllSlugs(
      categories,
      products,
      siteConfigs?.custom_pages_config?.pages
    );
  }, [categories, products, siteConfigs?.custom_pages_config?.pages]);

  // Đồng bộ khi siteConfigs từ database tải về
  useEffect(() => {
    if (siteConfigs?.campaign_frame) {
      const cur = siteConfigs.campaign_frame;
      setConfig({
        is_enabled: cur.is_enabled ?? false,
        frame_type: cur.frame_type || 'preset',
        preset_name: cur.preset_name || 'tet',
        custom_frame_url: cur.custom_frame_url || '',
        scope: cur.scope || 'global',
        applied_product_ids: cur.applied_product_ids || [],
        applied_slugs: cur.applied_slugs || [],
        slug_match_mode: cur.slug_match_mode || 'exact',
      });
    }
  }, [siteConfigs?.campaign_frame]);

  // Cập nhật trường trong config
  const updateField = <K extends keyof CampaignFrameConfig>(
    field: K,
    val: CampaignFrameConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [field]: val }));
  };

  // Lưu cấu hình (Admin Error Sanitization: Lỗi hiển thị đầy đủ, chính xác)
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSiteConfig('campaign_frame', config);
      showToast('Đã lưu cấu hình Khung Chiến Dịch thành công!');
    } catch (err: any) {
      console.error('Lỗi khi lưu cấu hình campaign_frame:', err);
      const detailMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        JSON.stringify(err);
      showToast(
        `Lỗi khi lưu cấu hình (${err?.response?.status || '500'}): ${detailMsg}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Thống kê số lượng slug đã chọn
  const appliedSlugs = config.applied_slugs || [];
  const selectedSlugItemsCount = useMemo(() => {
    return allSlugItems.filter((item) => isSlugSelected(appliedSlugs, item)).length;
  }, [allSlugItems, appliedSlugs]);

  // Thống kê theo từng nhóm
  const groupStats = useMemo(() => {
    const stats: Record<SlugGroupKey, { total: number; selected: number }> = {
      core: { total: 0, selected: 0 },
      category_level1: { total: 0, selected: 0 },
      product_level2: { total: 0, selected: 0 },
      utility_policy_custom: { total: 0, selected: 0 },
    };

    allSlugItems.forEach((item) => {
      const g = item.group;
      if (stats[g]) {
        stats[g].total += 1;
        if (isSlugSelected(appliedSlugs, item)) {
          stats[g].selected += 1;
        }
      }
    });

    return stats;
  }, [allSlugItems, appliedSlugs]);

  // 1-Click Master Select All Slugs (100% slug toàn hệ thống)
  const handleSelectAllMaster = () => {
    const newApplied = selectAllSlugs(appliedSlugs, allSlugItems);
    updateField('applied_slugs', newApplied);
  };

  // Master Deselect All Slugs
  const handleDeselectAllMaster = () => {
    updateField('applied_slugs', []);
  };

  // Chọn toàn bộ slug của 1 nhóm
  const handleSelectGroup = (groupKey: SlugGroupKey) => {
    const groupItems = allSlugItems.filter((item) => item.group === groupKey);
    const newApplied = selectAllSlugs(appliedSlugs, groupItems);
    updateField('applied_slugs', newApplied);
  };

  // Bỏ chọn toàn bộ slug của 1 nhóm
  const handleDeselectGroup = (groupKey: SlugGroupKey) => {
    const groupItems = allSlugItems.filter((item) => item.group === groupKey);
    const newApplied = deselectAllSlugs(appliedSlugs, groupItems);
    updateField('applied_slugs', newApplied);
  };

  // Toggle chọn 1 SlugItem đơn lẻ
  const handleToggleSlugItem = (item: SlugItem, isChecked: boolean) => {
    const newApplied = toggleSlugItem(appliedSlugs, item, isChecked);
    updateField('applied_slugs', newApplied);
  };

  // Toggle Accordion Group
  const toggleAccordion = (groupKey: SlugGroupKey) => {
    setAccordionsOpen((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Lọc items cho 1 nhóm dựa trên Search, Tabs và Dropdown
  const getFilteredItemsForGroup = (groupKey: SlugGroupKey): SlugItem[] => {
    // 1. Nếu tab filter đang chỉ định 1 nhóm khác thì ẩn nhóm này
    if (activeTab !== 'all' && activeTab !== 'selected' && activeTab !== groupKey) {
      return [];
    }

    let items = allSlugItems.filter((item) => item.group === groupKey);

    // 2. Nếu tab đang là 'selected', chỉ lấy các items đã chọn
    if (activeTab === 'selected') {
      items = items.filter((item) => isSlugSelected(appliedSlugs, item));
    }

    // 3. Nếu là nhóm sản phẩm cấp 2, áp dụng thêm lọc theo danh mục cha và mã sản phẩm
    if (groupKey === 'product_level2') {
      if (selectedCategoryFilter !== 'all') {
        items = items.filter(
          (item) => item.categorySlug === selectedCategoryFilter
        );
      }
      if (productCodeSearch.trim()) {
        const qCode = productCodeSearch.trim().toLowerCase();
        items = items.filter((item) => {
          const prodObj = products.find((p) => p.id === item.productId);
          return (
            item.productId?.toLowerCase().includes(qCode) ||
            prodObj?.code?.toLowerCase().includes(qCode)
          );
        });
      }
    }

    // 4. Lọc theo ô tìm kiếm chung (searchQuery)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter((item) => {
        const matchLabel = item.label.toLowerCase().includes(q);
        const matchSlug = item.slug.toLowerCase().includes(q);
        const matchAlias = item.aliases.some((a) => a.toLowerCase().includes(q));
        const matchCat = item.categoryName?.toLowerCase().includes(q);
        const matchProdId = item.productId?.toLowerCase().includes(q);
        const prodObj = products.find((p) => p.id === item.productId);
        const matchCode = prodObj?.code?.toLowerCase().includes(q);
        return (
          matchLabel ||
          matchSlug ||
          matchAlias ||
          matchCat ||
          matchProdId ||
          matchCode
        );
      });
    }

    return items;
  };

  // Scope hiện tại (hỗ trợ tương thích ngược với 'specific' cũ)
  const effectiveScope: CampaignFrameScope =
    config.scope === 'specific' ? 'specific_products' : config.scope;

  // Lấy ảnh mẫu để preview bên Sandbox
  const selectedProduct =
    products.find((p) => p.id === testProductId) || products[0];
  const sampleImg =
    customTestImgUrl.trim() || selectedProduct?.thumbnail_url || '';

  // Danh sách các danh mục phục vụ dropdown filter Nhóm 3
  const categoryFilterOptions = useMemo(() => {
    return categories.map((c) => ({
      slug: (c.slug || '').replace(/^\/+/, '').replace(/\/+$/, ''),
      name: c.name,
    }));
  }, [categories]);

  return (
    <div className="space-y-6">
      {/* Top Action Bar chuẩn: Title trang - Mô tả trang */}
      <div className="bg-white border border-gray-200 rounded-md p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e60049] animate-pulse"></span>
            <h2 className="text-sm font-extrabold text-[#e60049] uppercase tracking-wide">
              Quản Trị Khung Hình & Khung Đè Chiến Dịch (Campaign Overlay CMS)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Quy chuẩn khung hình bo tròn 16px, viền xám, đổ bóng 3D, hỗ trợ thiết kế full tấm.
            Bật/tắt lớp khung đè sự kiện (Tết, Sale, Mùa thi, Giáng Sinh) tức thì cho toàn bộ website
            hoặc chỉ định đích danh từng tuyến đường slug/sản phẩm mà không cần sửa ảnh gốc.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-white hover:bg-gray-100 text-[#e60049] border border-[#e60049]/30 font-bold text-xs px-5 py-2.5 rounded-md shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-70"
        >
          {isSaving ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <span>💾</span>
          )}
          <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái (7 cols): Cấu hình Khung Chiến Dịch */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Công tắc Kích hoạt Master */}
          <div className="bg-white border border-gray-200 rounded-md p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-[#e60049] text-white">
                    KHỐI 1
                  </span>
                  <h3 className="text-sm font-black text-gray-900">
                    [KHỐI 1: KÍCH HOẠT KHUNG ĐÈ CHIẾN DỊCH] - Bật/tắt lớp khung chiến dịch trên toàn bộ website hoặc từng trang/sản phẩm
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Gạt công tắc để bật hoặc tắt lớp khung chiến dịch trên toàn bộ website hoặc từng trang/sản phẩm.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.is_enabled}
                  onChange={(e) => updateField('is_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e60049]"></div>
              </label>
            </div>

            {config.is_enabled && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                <span className="font-bold">Đang BẬT:</span> Khung chiến dịch đang được áp dụng
                trực tiếp trên các trang web cho khách hàng theo phạm vi cấu hình bên dưới.
              </div>
            )}
          </div>

          {/* Card 2: Lựa chọn Khung Chiến Dịch */}
          <div className="bg-white border border-gray-200 rounded-md p-5 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-blue-600 text-white">
                  KHỐI 2
                </span>
                <h3 className="text-sm font-black text-gray-900">
                  [KHỐI 2: CHỌN LOẠI KHUNG CHIẾN DỊCH] - Lựa chọn 4 mẫu preset hoặc tải file ảnh PNG trong suốt riêng lên Cloudflare R2
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lựa chọn một trong 4 mẫu thiết kế có sẵn hoặc tải file ảnh PNG trong suốt riêng lên Cloudflare R2.
              </p>
            </div>

            {/* Radio Mode */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="frame_type"
                  checked={config.frame_type === 'preset'}
                  onChange={() => updateField('frame_type', 'preset')}
                  className="text-[#e60049] focus:ring-[#e60049]"
                />
                <span>Sử dụng 4 Khung Preset Sẵn Có (Vector Hi-Res)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="frame_type"
                  checked={config.frame_type === 'custom'}
                  onChange={() => updateField('frame_type', 'custom')}
                  className="text-[#e60049] focus:ring-[#e60049]"
                />
                <span>Tải Khung PNG Riêng (Custom Upload)</span>
              </label>
            </div>

            {/* Khung Preset */}
            {config.frame_type === 'preset' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { id: 'tet', label: 'Tết & Năm Mới', icon: '🌸', desc: 'Hoa mai, hoa đào, ruy băng vàng' },
                  { id: 'sale', label: 'Mega Sale / Hot Deal', icon: '🔥', desc: 'Viền Neon, nhãn -25%' },
                  { id: 'exam', label: 'Mùa Thi & Ôn Luyện', icon: '🎓', desc: 'Cúp vàng, ma trận 2026' },
                  { id: 'christmas', label: 'Giáng Sinh / Đông', icon: '❄️', desc: 'Bông tuyết, nơ đỏ, thông' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateField('preset_name', item.id as CampaignFramePreset)}
                    className={`p-3 rounded-md border text-left transition flex flex-col justify-between h-28 cursor-pointer ${
                      config.preset_name === item.id
                        ? 'border-[#e60049] bg-pink-50/50 shadow-xs ring-2 ring-[#e60049]/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-xl mb-1">{item.icon}</div>
                      <div className="text-xs font-bold text-gray-900 leading-tight">
                        {item.label}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">{item.desc}</div>
                  </button>
                ))}
              </div>
            ) : (
              /* Custom Upload PNG qua R2ImageUploader */
              <div className="pt-2">
                <R2ImageUploader
                  label="Khung viền PNG tùy chỉnh (Cloudflare R2)"
                  helperText="Tạo khung PNG trong suốt 600x800 px (hoặc cùng tỉ lệ với ảnh sản phẩm). Họa tiết ở 4 cạnh viền ngoài, để rỗng 100% vùng giữa để nhìn thấy ảnh sản phẩm bên dưới."
                  imageUrl={config.custom_frame_url || ''}
                  onUrlChange={(url) => {
                    updateField('custom_frame_url', url);
                    if (url) updateField('frame_type', 'custom');
                  }}
                  folder="campaign"
                  pageLevel1="frame"
                  fitMode="contain"
                  maxPreviewHeight="max-h-36"
                  aspectRatioHint="Khuyên dùng 600x800 px hoặc 3:4"
                />
              </div>
            )}
          </div>

          {/* Card 3: PHẠM VI ÁP DỤNG KHUNG CHIẾN DỊCH (UPGRADED SLUG SELECTOR SUITE) */}
          <div className="bg-white border border-gray-200 rounded-md p-5 shadow-xs space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-emerald-600 text-white">
                  KHỐI 3
                </span>
                <h3 className="text-sm font-black text-gray-900">
                  [KHỐI 3: PHẠM VI ÁP DỤNG KHUNG CHIẾN DỊCH] - Cấu hình áp dụng toàn bộ website, theo danh sách slug tĩnh/động hoặc sản phẩm cụ thể
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lựa chọn phạm vi phủ sóng chiến dịch: Toàn hệ thống, từng trang/slug cụ thể linh hoạt, hoặc đích danh từng sản phẩm.
              </p>
            </div>

            {/* ========================================================================= */}
            {/* PHẦN 1: CHỌN PHẠM VI ÁP DỤNG (SCOPE) */}
            {/* ========================================================================= */}
            <div className="space-y-3 pt-1 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
                1. CHỌN PHẠM VI ÁP DỤNG (SCOPE):
              </label>

              <div className="space-y-2">
                {/* Scope: global */}
                <label className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition ${
                  config.scope === 'global'
                    ? 'border-[#e60049] bg-pink-50/40 ring-1 ring-[#e60049]'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="scope"
                    checked={config.scope === 'global'}
                    onChange={() => updateField('scope', 'global')}
                    className="mt-0.5 text-[#e60049] focus:ring-[#e60049]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-900">
                      Áp dụng Toàn Hệ Thống (Global Campaign):
                    </span>
                    <p className="text-gray-500 mt-0.5">
                      Tất cả các trang và tất cả sản phẩm đều tự động hiển thị khung đè.
                    </p>
                  </div>
                </label>

                {/* Scope: specific_slugs */}
                <label className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition ${
                  config.scope === 'specific_slugs'
                    ? 'border-[#e60049] bg-pink-50/40 ring-1 ring-[#e60049]'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="scope"
                    checked={config.scope === 'specific_slugs'}
                    onChange={() => updateField('scope', 'specific_slugs')}
                    className="mt-0.5 text-[#e60049] focus:ring-[#e60049]"
                  />
                  <div className="text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-gray-900">
                        Áp dụng Theo Tuyến Đường / Slug Hiển Thị (Specific Slugs)
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-emerald-600 text-white">
                        KHUYÊN DÙNG
                      </span>
                      {config.scope === 'specific_slugs' && (
                        <span className="text-[10px] font-bold text-[#e60049] bg-pink-100 px-1.5 py-0.5 rounded">
                          [ĐANG CHỌN]
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 mt-0.5">
                      Cho phép tích chọn linh hoạt từng trang cụ thể (Trang chủ, Cấp 1, Cấp 2, Combo, Tiện ích, Chính sách).
                    </p>
                  </div>
                </label>

                {/* Scope: specific_products */}
                <label className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition ${
                  effectiveScope === 'specific_products'
                    ? 'border-[#e60049] bg-pink-50/40 ring-1 ring-[#e60049]'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="scope"
                    checked={effectiveScope === 'specific_products'}
                    onChange={() => updateField('scope', 'specific_products')}
                    className="mt-0.5 text-[#e60049] focus:ring-[#e60049]"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-gray-900">
                      Áp dụng Theo Sản Phẩm Đích Danh (Specific Products):
                    </span>
                    <p className="text-gray-500 mt-0.5">
                      Chỉ gắn khung cho các sản phẩm cụ thể theo mã ID.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* PHẦN 2: CHẾ ĐỘ HIỂN THỊ TRANG (MATCHING MODE) - CHỈ HIỆN KHI SPECIFIC_SLUGS */}
            {/* ========================================================================= */}
            {config.scope === 'specific_slugs' && (
              <div className="space-y-3 pt-3 border-t border-dashed border-gray-200 bg-gray-50/60 p-3.5 rounded-md border">
                <label className="text-xs font-bold text-gray-800 uppercase tracking-wide block">
                  2. CHẾ ĐỘ HIỂN THỊ TRANG (MATCHING MODE):
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Mode: exact */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition bg-white ${
                    (config.slug_match_mode || 'exact') === 'exact'
                      ? 'border-[#e60049] ring-1 ring-[#e60049] bg-pink-50/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="slug_match_mode"
                      checked={(config.slug_match_mode || 'exact') === 'exact'}
                      onChange={() => updateField('slug_match_mode', 'exact')}
                      className="mt-0.5 text-[#e60049] focus:ring-[#e60049]"
                    />
                    <div className="text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-gray-900">
                          CHỈ TRANG CỤ THỂ (Exact Page Only)
                        </span>
                        <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-sm bg-emerald-600 text-white">
                          KHUYÊN DÙNG
                        </span>
                      </div>
                      <p className="text-gray-500 mt-1 leading-relaxed text-[11px]">
                        Khung đè chỉ xuất hiện đúng tại trang được chọn. Ví dụ: Chọn Cấp 1 (<code className="text-[#e60049]">/high-school</code>) thì CHỈ hiển thị ở trang <code className="text-[#e60049]">/high-school</code>, KHÔNG tự động tràn sang các trang chi tiết sản phẩm Cấp 2 (<code className="text-[#e60049]">/high-school/dgnlbca</code>).
                      </p>
                    </div>
                  </label>

                  {/* Mode: include_children */}
                  <label className={`flex items-start gap-2.5 p-3 rounded-md border cursor-pointer transition bg-white ${
                    config.slug_match_mode === 'include_children'
                      ? 'border-[#e60049] ring-1 ring-[#e60049] bg-pink-50/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="slug_match_mode"
                      checked={config.slug_match_mode === 'include_children'}
                      onChange={() => updateField('slug_match_mode', 'include_children')}
                      className="mt-0.5 text-[#e60049] focus:ring-[#e60049]"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-gray-900">
                        BAO GỒM TRANG CON (Include Sub-routes)
                      </span>
                      <p className="text-gray-500 mt-1 leading-relaxed text-[11px]">
                        Chọn trang Cấp 1 sẽ tự động kích hoạt khung đè cho tất cả các trang chi tiết sản phẩm con bên trong.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PHẦN 3: BỘ ĐIỀU KHIỂN & CHỌN SLUG (CAMPAIGN SLUG SELECTOR SUITE) */}
            {/* ========================================================================= */}
            {config.scope === 'specific_slugs' && (
              <div className="space-y-4 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    3. BỘ ĐIỀU KHIỂN & CHỌN SLUG (CAMPAIGN SLUG SELECTOR SUITE):
                  </label>
                  <span className="text-xs font-bold text-[#e60049] bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-md">
                    Đã chọn: {selectedSlugItemsCount} / {allSlugItems.length} slug (
                    {allSlugItems.length > 0
                      ? Math.round((selectedSlugItemsCount / allSlugItems.length) * 100)
                      : 0}
                    %)
                  </span>
                </div>

                {/* Header Controls Container */}
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3.5 space-y-3">
                  {/* Hàng 1: Ô tìm kiếm real-time */}
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                      🔍
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm trang, đường dẫn slug hoặc mã SP..."
                      className="w-full pl-9 pr-9 py-2 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#e60049] focus:border-[#e60049]"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Hàng 2: Nút Master 1-Click Select All & Deselect All */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllMaster}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>✓</span>
                      <span>Chọn Tất Cả Slug (1-Click)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeselectAllMaster}
                      className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold text-xs px-3 py-1.5 rounded-md shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>✗</span>
                      <span>Bỏ Chọn Tất Cả</span>
                    </button>

                    <div className="ml-auto text-[11px] text-gray-500">
                      Hiển thị danh mục tĩnh, động, alias song ngữ & custom pages
                    </div>
                  </div>

                  {/* Hàng 3: Filter Tabs */}
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-gray-200/70">
                    {[
                      { key: 'all', label: `Tất cả (${allSlugItems.length})` },
                      { key: 'selected', label: `★ Đã chọn (${selectedSlugItemsCount})` },
                      {
                        key: 'core',
                        label: `Cốt lõi (${groupStats.core.selected}/${groupStats.core.total})`,
                      },
                      {
                        key: 'category_level1',
                        label: `Cấp 1 (${groupStats.category_level1.selected}/${groupStats.category_level1.total})`,
                      },
                      {
                        key: 'product_level2',
                        label: `Cấp 2 (${groupStats.product_level2.selected}/${groupStats.product_level2.total})`,
                      },
                      {
                        key: 'utility_policy_custom',
                        label: `Tiện ích & Chính sách (${groupStats.utility_policy_custom.selected}/${groupStats.utility_policy_custom.total})`,
                      },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key as FilterTabKey)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                          activeTab === tab.key
                            ? 'bg-[#e60049] text-white shadow-xs'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4 Accordion Groups */}
                <div className="space-y-4 pt-1">
                  {/* ================================================================= */}
                  {/* NHÓM 1: TUYẾN ĐƯỜNG CỐT LÕI (CORE HUBS) */}
                  {/* ================================================================= */}
                  {(() => {
                    const groupKey: SlugGroupKey = 'core';
                    const items = getFilteredItemsForGroup(groupKey);
                    if (activeTab !== 'all' && activeTab !== 'selected' && activeTab !== groupKey) {
                      return null;
                    }
                    const isOpen = accordionsOpen[groupKey];
                    const meta = SLUG_GROUPS[groupKey];
                    const selectedInGroup = groupStats[groupKey].selected;
                    const totalInGroup = groupStats[groupKey].total;

                    return (
                      <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-xs">
                        {/* Header Accordion */}
                        <div
                          onClick={() => toggleAccordion(groupKey)}
                          className="bg-gray-50 hover:bg-gray-100/80 px-4 py-2.5 flex items-center justify-between cursor-pointer border-b border-gray-200 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs font-mono">
                              {isOpen ? '▼' : '▶'}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-purple-600 text-white">
                              {meta.badge}
                            </span>
                            <h4 className="text-xs font-bold text-gray-900">
                              [NHÓM 1] TUYẾN ĐƯỜNG CỐT LÕI (CORE HUBS)
                            </h4>
                            <span className="text-[11px] text-gray-500 font-medium">
                              (Đã chọn: {selectedInGroup} / {totalInGroup})
                            </span>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleSelectGroup(groupKey)}
                              className="text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold px-2 py-0.5 rounded cursor-pointer"
                            >
                              Chọn cả nhóm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeselectGroup(groupKey)}
                              className="text-[11px] text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 font-medium px-2 py-0.5 rounded cursor-pointer"
                            >
                              Bỏ chọn nhóm
                            </button>
                          </div>
                        </div>

                        {/* Nội dung danh sách Items */}
                        {isOpen && (
                          <div className="p-3 space-y-1.5 divide-y divide-gray-100">
                            {items.length === 0 ? (
                              <div className="text-xs text-gray-400 py-2 text-center">
                                Không tìm thấy tuyến đường nào khớp với bộ lọc
                              </div>
                            ) : (
                              items.map((item) => {
                                const isChecked = isSlugSelected(appliedSlugs, item);
                                return (
                                  <label
                                    key={item.slug}
                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                                      isChecked
                                        ? 'bg-pink-50/50 hover:bg-pink-50'
                                        : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) =>
                                          handleToggleSlugItem(item, e.target.checked)
                                        }
                                        className="text-[#e60049] rounded focus:ring-[#e60049]"
                                      />
                                      <span className="text-xs font-semibold text-gray-800 truncate">
                                        {item.label}
                                      </span>
                                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                        {item.slug}
                                      </span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                        {item.badge}
                                      </span>
                                    </div>

                                    <div>
                                      {isChecked ? (
                                        <span className="text-[11px] font-bold text-[#e60049] bg-pink-100/80 px-2 py-0.5 rounded">
                                          [★ ĐÃ CHỌN]
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-gray-400">
                                          (Chưa chọn)
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ================================================================= */}
                  {/* NHÓM 2: TRANG DANH MỤC CẤP 1 ĐỘNG (LEVEL-1 CATEGORIES) */}
                  {/* ================================================================= */}
                  {(() => {
                    const groupKey: SlugGroupKey = 'category_level1';
                    const items = getFilteredItemsForGroup(groupKey);
                    if (activeTab !== 'all' && activeTab !== 'selected' && activeTab !== groupKey) {
                      return null;
                    }
                    const isOpen = accordionsOpen[groupKey];
                    const meta = SLUG_GROUPS[groupKey];
                    const selectedInGroup = groupStats[groupKey].selected;
                    const totalInGroup = groupStats[groupKey].total;

                    return (
                      <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-xs">
                        {/* Header Accordion */}
                        <div
                          onClick={() => toggleAccordion(groupKey)}
                          className="bg-gray-50 hover:bg-gray-100/80 px-4 py-2.5 flex items-center justify-between cursor-pointer border-b border-gray-200 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs font-mono">
                              {isOpen ? '▼' : '▶'}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-blue-600 text-white">
                              {meta.badge}
                            </span>
                            <h4 className="text-xs font-bold text-gray-900">
                              [NHÓM 2] TRANG DANH MỤC CẤP 1 ĐỘNG (LEVEL-1 CATEGORIES)
                            </h4>
                            <span className="text-[11px] text-gray-500 font-medium">
                              (Đã chọn: {selectedInGroup} / {totalInGroup})
                            </span>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleSelectGroup(groupKey)}
                              className="text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold px-2 py-0.5 rounded cursor-pointer"
                            >
                              Chọn cả nhóm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeselectGroup(groupKey)}
                              className="text-[11px] text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 font-medium px-2 py-0.5 rounded cursor-pointer"
                            >
                              Bỏ chọn nhóm
                            </button>
                          </div>
                        </div>

                        {/* Nội dung danh sách Items */}
                        {isOpen && (
                          <div className="p-3 space-y-1.5 divide-y divide-gray-100">
                            {items.length === 0 ? (
                              <div className="text-xs text-gray-400 py-2 text-center">
                                Không tìm thấy danh mục cấp 1 nào khớp với bộ lọc
                              </div>
                            ) : (
                              items.map((item) => {
                                const isChecked = isSlugSelected(appliedSlugs, item);
                                return (
                                  <label
                                    key={item.slug}
                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                                      isChecked
                                        ? 'bg-pink-50/50 hover:bg-pink-50'
                                        : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) =>
                                          handleToggleSlugItem(item, e.target.checked)
                                        }
                                        className="text-[#e60049] rounded focus:ring-[#e60049]"
                                      />
                                      <span className="text-xs font-semibold text-gray-800 truncate">
                                        {item.label}
                                      </span>
                                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                        {item.slug}
                                      </span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                        {item.badge}
                                      </span>
                                      {item.count !== undefined && (
                                        <span className="text-[10px] text-gray-500">
                                          ({item.count} SP)
                                        </span>
                                      )}
                                    </div>

                                    <div>
                                      {isChecked ? (
                                        <span className="text-[11px] font-bold text-[#e60049] bg-pink-100/80 px-2 py-0.5 rounded">
                                          [★ ĐÃ CHỌN]
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-gray-400">
                                          (Chưa chọn)
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ================================================================= */}
                  {/* NHÓM 3: CHI TIẾT SẢN PHẨM CẤP 2 ĐỘNG (LEVEL-2 PRODUCTS) */}
                  {/* ================================================================= */}
                  {(() => {
                    const groupKey: SlugGroupKey = 'product_level2';
                    const items = getFilteredItemsForGroup(groupKey);
                    if (activeTab !== 'all' && activeTab !== 'selected' && activeTab !== groupKey) {
                      return null;
                    }
                    const isOpen = accordionsOpen[groupKey];
                    const meta = SLUG_GROUPS[groupKey];
                    const selectedInGroup = groupStats[groupKey].selected;
                    const totalInGroup = groupStats[groupKey].total;

                    return (
                      <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-xs">
                        {/* Header Accordion */}
                        <div
                          onClick={() => toggleAccordion(groupKey)}
                          className="bg-gray-50 hover:bg-gray-100/80 px-4 py-2.5 flex items-center justify-between cursor-pointer border-b border-gray-200 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs font-mono">
                              {isOpen ? '▼' : '▶'}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-amber-600 text-white">
                              {meta.badge}
                            </span>
                            <h4 className="text-xs font-bold text-gray-900">
                              [NHÓM 3] CHI TIẾT SẢN PHẨM CẤP 2 ĐỘNG (LEVEL-2 PRODUCTS)
                            </h4>
                            <span className="text-[11px] text-gray-500 font-medium">
                              (Đã chọn: {selectedInGroup} / {totalInGroup})
                            </span>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleSelectGroup(groupKey)}
                              className="text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold px-2 py-0.5 rounded cursor-pointer"
                            >
                              Chọn cả nhóm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeselectGroup(groupKey)}
                              className="text-[11px] text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 font-medium px-2 py-0.5 rounded cursor-pointer"
                            >
                              Bỏ chọn nhóm
                            </button>
                          </div>
                        </div>

                        {/* Nội dung danh sách Items với subcontrols */}
                        {isOpen && (
                          <div className="p-3 space-y-3">
                            {/* Subcontrols lọc theo danh mục cha & tìm mã SP */}
                            <div className="flex flex-col sm:flex-row items-center gap-2.5 p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                                <span className="text-gray-600 font-semibold shrink-0">
                                  Lọc danh mục cha:
                                </span>
                                <select
                                  value={selectedCategoryFilter}
                                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                  className="w-full sm:w-48 px-2 py-1 bg-white border border-gray-300 rounded focus:outline-none"
                                >
                                  <option value="all">Tất cả danh mục ({categoryFilterOptions.length})</option>
                                  {categoryFilterOptions.map((c) => (
                                    <option key={c.slug} value={c.slug}>
                                      {c.name} (/{c.slug})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex items-center gap-1.5 w-full sm:w-auto sm:ml-auto">
                                <span className="text-gray-600 font-semibold shrink-0">
                                  Tìm mã SP:
                                </span>
                                <input
                                  type="text"
                                  value={productCodeSearch}
                                  onChange={(e) => setProductCodeSearch(e.target.value)}
                                  placeholder="Mã SP (#SP001)..."
                                  className="w-full sm:w-36 px-2 py-1 bg-white border border-gray-300 rounded focus:outline-none"
                                />
                                {productCodeSearch && (
                                  <button
                                    type="button"
                                    onClick={() => setProductCodeSearch('')}
                                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Danh sách cuộn mượt mà max-h-80 */}
                            <div className="max-h-80 overflow-y-auto space-y-1.5 divide-y divide-gray-100 pr-1">
                              {items.length === 0 ? (
                                <div className="text-xs text-gray-400 py-4 text-center">
                                  Không tìm thấy sản phẩm cấp 2 nào khớp với điều kiện lọc
                                </div>
                              ) : (
                                items.map((item) => {
                                  const isChecked = isSlugSelected(appliedSlugs, item);
                                  const prodObj = products.find((p) => p.id === item.productId);
                                  return (
                                    <label
                                      key={item.slug}
                                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                                        isChecked
                                          ? 'bg-pink-50/50 hover:bg-pink-50'
                                          : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={(e) =>
                                            handleToggleSlugItem(item, e.target.checked)
                                          }
                                          className="text-[#e60049] rounded focus:ring-[#e60049]"
                                        />
                                        <span className="text-xs font-semibold text-gray-800 truncate max-w-xs sm:max-w-md">
                                          {item.label}
                                        </span>
                                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                          {item.slug}
                                        </span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                          {item.badge}
                                        </span>
                                        {prodObj?.code && (
                                          <span className="text-[10px] font-mono text-gray-400">
                                            (#{prodObj.code})
                                          </span>
                                        )}
                                      </div>

                                      <div className="shrink-0 ml-2">
                                        {isChecked ? (
                                          <span className="text-[11px] font-bold text-[#e60049] bg-pink-100/80 px-2 py-0.5 rounded">
                                            [★ ĐÃ CHỌN]
                                          </span>
                                        ) : (
                                          <span className="text-[11px] text-gray-400">
                                            (Chưa chọn)
                                          </span>
                                        )}
                                      </div>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ================================================================= */}
                  {/* NHÓM 4: TIỆN ÍCH, CHÍNH SÁCH & TRANG ĐỘNG (UTILITY, POLICIES & CUSTOM) */}
                  {/* ================================================================= */}
                  {(() => {
                    const groupKey: SlugGroupKey = 'utility_policy_custom';
                    const items = getFilteredItemsForGroup(groupKey);
                    if (activeTab !== 'all' && activeTab !== 'selected' && activeTab !== groupKey) {
                      return null;
                    }
                    const isOpen = accordionsOpen[groupKey];
                    const meta = SLUG_GROUPS[groupKey];
                    const selectedInGroup = groupStats[groupKey].selected;
                    const totalInGroup = groupStats[groupKey].total;

                    return (
                      <div className="border border-gray-200 rounded-md overflow-hidden bg-white shadow-xs">
                        {/* Header Accordion */}
                        <div
                          onClick={() => toggleAccordion(groupKey)}
                          className="bg-gray-50 hover:bg-gray-100/80 px-4 py-2.5 flex items-center justify-between cursor-pointer border-b border-gray-200 transition"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-xs font-mono">
                              {isOpen ? '▼' : '▶'}
                            </span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-teal-600 text-white">
                              {meta.badge}
                            </span>
                            <h4 className="text-xs font-bold text-gray-900">
                              [NHÓM 4] TIỆN ÍCH, CHÍNH SÁCH & TRANG ĐỘNG (UTILITY, POLICIES & CUSTOM)
                            </h4>
                            <span className="text-[11px] text-gray-500 font-medium">
                              (Đã chọn: {selectedInGroup} / {totalInGroup})
                            </span>
                          </div>

                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleSelectGroup(groupKey)}
                              className="text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold px-2 py-0.5 rounded cursor-pointer"
                            >
                              Chọn cả nhóm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeselectGroup(groupKey)}
                              className="text-[11px] text-gray-600 hover:text-gray-800 bg-white hover:bg-gray-50 border border-gray-200 font-medium px-2 py-0.5 rounded cursor-pointer"
                            >
                              Bỏ chọn nhóm
                            </button>
                          </div>
                        </div>

                        {/* Nội dung danh sách Items */}
                        {isOpen && (
                          <div className="p-3 space-y-1.5 divide-y divide-gray-100">
                            {items.length === 0 ? (
                              <div className="text-xs text-gray-400 py-2 text-center">
                                Không tìm thấy trang tiện ích/chính sách nào khớp với bộ lọc
                              </div>
                            ) : (
                              items.map((item) => {
                                const isChecked = isSlugSelected(appliedSlugs, item);
                                return (
                                  <label
                                    key={item.slug}
                                    className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                                      isChecked
                                        ? 'bg-pink-50/50 hover:bg-pink-50'
                                        : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={(e) =>
                                          handleToggleSlugItem(item, e.target.checked)
                                        }
                                        className="text-[#e60049] rounded focus:ring-[#e60049]"
                                      />
                                      <span className="text-xs font-semibold text-gray-800 truncate">
                                        {item.label}
                                      </span>
                                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                        {item.slug}
                                      </span>
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                                        {item.badge}
                                      </span>
                                      {item.aliases.length > 1 && (
                                        <span className="text-[10px] text-gray-400">
                                          (gộp {item.aliases.length} URL)
                                        </span>
                                      )}
                                    </div>

                                    <div>
                                      {isChecked ? (
                                        <span className="text-[11px] font-bold text-[#e60049] bg-pink-100/80 px-2 py-0.5 rounded">
                                          [★ ĐÃ CHỌN]
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-gray-400">
                                          (Chưa chọn)
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PHẦN 4: CHỌN SẢN PHẨM ĐÍCH DANH (TƯƠNG THÍCH NGƯỢC SPECIFIC_PRODUCTS) */}
            {/* ========================================================================= */}
            {(effectiveScope === 'specific_products') && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <label className="text-xs font-semibold text-gray-700 block">
                  Chọn các sản phẩm được gắn khung chiến dịch theo mã ID:
                </label>
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-gray-50 rounded-md border border-gray-200 text-xs">
                  {products.map((p) => {
                    const isChecked = (config.applied_product_ids || []).includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 hover:bg-white p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = config.applied_product_ids || [];
                            if (e.target.checked) {
                              updateField('applied_product_ids', [...cur, p.id]);
                            } else {
                              updateField(
                                'applied_product_ids',
                                cur.filter((id) => id !== p.id)
                              );
                            }
                          }}
                          className="text-[#e60049] rounded"
                        />
                        <span className="font-medium text-gray-900">{p.title}</span>
                        <span className="text-[10px] text-gray-400">({p.code})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải (5 cols): Sandbox Kiểm Thử Trực Quan (Live Interactive Tester) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded-md p-5 shadow-xs sticky top-4 space-y-5">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <span>👁️</span> Sandbox Xem Trước & Thử Nghiệm Tỷ Lệ
              </h3>
              <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                Live Preview
              </span>
            </div>

            {/* Bộ điều khiển Tỷ lệ (Ratio Controller) */}
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-md border border-gray-200">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  1. Chế độ Tỷ lệ Khung hình (Aspect Ratio Mode):
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'preset', label: 'Preset Chuẩn' },
                    { id: 'custom', label: 'Custom W:H' },
                    { id: 'auto', label: 'Auto Gốc' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTestRatioMode(m.id as AspectRatioMode)}
                      className={`py-1.5 px-2 rounded text-xs font-bold transition cursor-pointer text-center ${
                        testRatioMode === m.id
                          ? 'bg-[#e60049] text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {testRatioMode === 'preset' && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Chọn Tỉ lệ Chuẩn:
                  </label>
                  <select
                    value={testPresetRatio}
                    onChange={(e) => setTestPresetRatio(e.target.value as PresetAspectRatio)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded focus:outline-none"
                  >
                    <option value="3:4">3 : 4 (Bìa sách dọc chuẩn 600x800)</option>
                    <option value="4:3">4 : 3 (Thẻ Combo / Flashcard 800x600)</option>
                    <option value="1:1">1 : 1 (Khung vuông 800x800)</option>
                    <option value="16:9">16 : 9 (Banner ngang 1280x720)</option>
                    <option value="3:1">3 : 1 (Banner rộng full-width 1200x400)</option>
                    <option value="1:1.414">1 : 1.414 (Khổ A4 đọc thử watermark)</option>
                  </select>
                </div>
              )}

              {testRatioMode === 'custom' && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Nhập Tỉ lệ Tự Do (W : H):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={testCustomW}
                      onChange={(e) => setTestCustomW(Number(e.target.value) || 1)}
                      className="w-20 text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded text-center font-bold"
                      placeholder="W"
                    />
                    <span className="font-bold text-gray-500">:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={testCustomH}
                      onChange={(e) => setTestCustomH(Number(e.target.value) || 1)}
                      className="w-20 text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded text-center font-bold"
                      placeholder="H"
                    />
                    <span className="text-[10px] text-gray-400">
                      (VD: 5:7, 2:3, 7:10...)
                    </span>
                  </div>
                </div>
              )}

              {testRatioMode === 'auto' && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  ✓ <strong>Chế độ Tự động:</strong> Khung tự động ôm sát chính xác theo tỷ lệ thật của file ảnh tải lên mà không bị crop hay co giãn!
                </div>
              )}

              {/* Điều khiển Độ Phân Giải / Chiều rộng hiển thị */}
              <div className="pt-2 border-t border-gray-200/60 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-semibold text-gray-700">
                  <span>Chiều rộng hiển thị (Max-Width):</span>
                  <span className="text-[#e60049] font-bold">{testMaxWidth} px</span>
                </div>
                <input
                  type="range"
                  min="160"
                  max="600"
                  step="10"
                  value={testMaxWidth}
                  onChange={(e) => setTestMaxWidth(Number(e.target.value))}
                  className="w-full accent-[#e60049] cursor-pointer"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold text-gray-700">Chế độ Co giãn (Object Fit):</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTestObjectFit('cover')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        testObjectFit === 'cover'
                          ? 'bg-[#e60049] text-white'
                          : 'bg-white border text-gray-600'
                      }`}
                    >
                      Cover (Tràn đầy)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestObjectFit('contain')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        testObjectFit === 'contain'
                          ? 'bg-[#e60049] text-white'
                          : 'bg-white border text-gray-600'
                      }`}
                    >
                      Contain (Giữ trọn)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chọn Sản phẩm mẫu để test */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700">
                2. Chọn Sản phẩm mẫu thử nghiệm:
              </label>
              <select
                value={testProductId}
                onChange={(e) => setTestProductId(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Khung Hiển Thị Trực Quan (Interactive Render Canvas) */}
            <div className="bg-gray-100 rounded-md p-4 flex flex-col items-center justify-center min-h-[340px] border border-dashed border-gray-300">
              <div className="w-full flex justify-center">
                <ProductImageFrame
                  src={sampleImg}
                  alt={selectedProduct?.title || 'Ảnh thử nghiệm'}
                  ratioMode={testRatioMode}
                  presetRatio={testPresetRatio}
                  customRatioW={testCustomW}
                  customRatioH={testCustomH}
                  maxWidthPx={testMaxWidth}
                  objectFit={testObjectFit}
                  rounded="2xl"
                  showBorder={true}
                  showShadow={true}
                  hoverEffect={true}
                  productId={selectedProduct?.id}
                  forcePresetOverlay={
                    config.is_enabled && config.frame_type === 'preset'
                      ? config.preset_name
                      : undefined
                  }
                  customCampaignFrameUrl={
                    config.is_enabled && config.frame_type === 'custom'
                      ? config.custom_frame_url
                      : undefined
                  }
                  badgeText={selectedProduct?.badge_text || 'Mới'}
                  fallbackText="Chưa có ảnh"
                />
              </div>

              <div className="mt-3 text-center">
                <div className="text-[11px] font-bold text-gray-800">
                  {selectedProduct?.title || 'Sản phẩm demo'}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Tỷ lệ:{' '}
                  {testRatioMode === 'preset'
                    ? testPresetRatio
                    : testRatioMode === 'custom'
                    ? `${testCustomW}:${testCustomH}`
                    : 'Auto (Theo ảnh gốc)'}{' '}
                  • Chiều rộng: {testMaxWidth}px • Fit: {testObjectFit}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2.5 rounded-md shadow-xs transition text-center cursor-pointer disabled:opacity-70"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu & Áp Dụng Ngay Cho Toàn Website'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
