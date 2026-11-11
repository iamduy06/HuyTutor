import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';
import {
  HomepageBlockItem,
  HomepageBlockType,
  HomepageBottomBannerConfig,
  HomepageCategoriesGridConfig,
  HomepageCategoryTile,
  HomepageHeroConfig,
  HomepageNoticeTextConfig,
  HomepageSectionGroup,
  HomepageSectionGroupsConfig,
  HomepageSectionItem,
  HomepageTopBannerConfig,
} from '../types';
import {
  BottomBannerBlock,
  CategoriesGridBlock,
  HeroBlock,
  NoticeTextBlock,
  SectionGroupsBlock,
  TopBannerBlock,
} from './DynamicHomepageBlocks';
import { normalizeTargetUrl } from './SmartLink';
import { R2ImageUploader } from './R2ImageUploader';
import { UniversalBlockCardRepeater } from './UniversalBlockCardRepeater';
import { UniversalBlockRenderer } from './UniversalBlockRenderer';

const BLOCK_TYPE_LABELS: Record<HomepageBlockType, { name: string; color: string; desc: string }> = {
  hero: {
    name: 'Hero Header (Phần đầu trang)',
    color: 'bg-rose-700 text-white',
    desc: 'Phần đầu trang (Chữ + Ảnh Thầy giáo bên phải / HTML / Full ảnh)',
  },
  top_banner: {
    name: 'Top Banner (Ưu đãi / Nổi bật)',
    color: 'bg-sky-700 text-white',
    desc: 'Banner quảng cáo (Tải ảnh banner rộng, đứng một mình full-width / HTML)',
  },
  categories_grid: {
    name: 'Danh mục sản phẩm',
    color: 'bg-amber-600 text-white',
    desc: 'Các ô danh mục sản phẩm squircle icon linh hoạt số lượng',
  },
  section_groups: {
    name: 'Nhóm tài liệu & Sản phẩm',
    color: 'bg-purple-800 text-white',
    desc: 'Các nhóm tài liệu (THPT, THCS...) với card sách 3D + badge + Đọc thử + tên sách',
  },
  notice_text: {
    name: 'Thông báo & Nút liên kết (Notice / CTA)',
    color: 'bg-zinc-700 text-white',
    desc: 'Dòng thông báo & nút điều hướng (Tham gia nhóm Facebook / Xem toàn bộ)',
  },
  bottom_banner: {
    name: 'Bottom Banner (Chân trang)',
    color: 'bg-emerald-700 text-white',
    desc: 'Banner chân trang (Tải ảnh banner rộng hoặc HTML)',
  },
  custom_html: {
    name: 'Khối HTML tùy biến',
    color: 'bg-pink-600 text-white',
    desc: 'Nhúng mã HTML, CSS an toàn trong Shadow DOM',
  },
};

export const AdminHomepageCms: React.FC = () => {
  const { siteConfigs, updateSiteConfig, showToast } = useStore();

  // Danh sách các khung (Block-based layout) - hoàn toàn động số lượng và thứ tự
  const [blocks, setBlocks] = useState<HomepageBlockItem[]>(() => {
    if (Array.isArray(siteConfigs?.homepage_blocks) && siteConfigs.homepage_blocks.length > 0) {
      return siteConfigs.homepage_blocks;
    }
    return [
      {
        id: 'block_hero_default',
        type: 'hero',
        title_label: 'Hero Header (Phần đầu trang)',
        is_active: siteConfigs?.homepage_hero?.is_active ?? true,
        sort_order: 1,
        config: siteConfigs?.homepage_hero || {
          mode: 'structured',
          title: '',
          subtitle: '',
          bullets: [],
          image_url: '',
          is_active: true,
        },
      },
      {
        id: 'block_banner_default',
        type: 'top_banner',
        title_label: 'Top Banner (Ưu đãi / Nổi bật)',
        is_active: siteConfigs?.homepage_top_banner?.is_active ?? true,
        sort_order: 2,
        config: siteConfigs?.homepage_top_banner || {
          mode: 'image_text',
          header_label: '',
          tag: '',
          title: '',
          subtitle: '',
          cta_badge: '',
          link_url: '',
          image_url: '',
          is_active: true,
        },
      },
      {
        id: 'block_cat_grid_default',
        type: 'categories_grid',
        title_label: 'Danh mục sản phẩm',
        is_active: siteConfigs?.homepage_categories_grid?.is_active ?? true,
        sort_order: 3,
        config: siteConfigs?.homepage_categories_grid || {
          title: '',
          items: [],
          is_active: true,
        },
      },
      {
        id: 'block_sec_groups_default',
        type: 'section_groups',
        title_label: 'Nhóm tài liệu & Sản phẩm',
        is_active: siteConfigs?.homepage_section_groups?.is_active ?? true,
        sort_order: 4,
        config: siteConfigs?.homepage_section_groups || {
          sections: [],
        },
      },
      {
        id: 'block_notice_default',
        type: 'notice_text',
        title_label: 'Thông báo & Nút liên kết (Notice / CTA)',
        is_active: siteConfigs?.homepage_notice_text?.is_active ?? true,
        sort_order: 5,
        config: siteConfigs?.homepage_notice_text || {
          text: '',
          cta_button_text: '',
          cta_button_link: '',
          is_active: true,
        },
      },
      {
        id: 'block_bottom_banner_default',
        type: 'bottom_banner',
        title_label: 'Bottom Banner (Chân trang)',
        is_active: siteConfigs?.homepage_bottom_banner?.is_active ?? true,
        sort_order: 6,
        config: siteConfigs?.homepage_bottom_banner || {
          mode: 'structured',
          title: '',
          link_url: '',
          books: [],
          is_active: true,
        },
      },
    ];
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string>('block_hero_default');
  const [isSideBySide, setIsSideBySide] = useState<boolean>(false);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Đồng bộ blocks khi siteConfigs load từ backend
  useEffect(() => {
    if (Array.isArray(siteConfigs?.homepage_blocks) && siteConfigs.homepage_blocks.length > 0) {
      setBlocks(siteConfigs.homepage_blocks);
      if (!selectedBlockId && siteConfigs.homepage_blocks[0]) {
        setSelectedBlockId(siteConfigs.homepage_blocks[0].id);
      }
    }
  }, [siteConfigs]);

  const currentBlockIndex = blocks.findIndex((b) => b.id === selectedBlockId);
  const currentBlock = blocks[currentBlockIndex] || blocks[0];

  // Upload ảnh qua R2 API (với naming chuẩn + tự động xóa ảnh cũ trên R2)
  const handleUploadFile = async (
    file: File,
    onSuccess: (url: string) => void,
    fieldId: string,
    options?: {
      oldUrl?: string;
      pageLevel1?: string;
      pageLevel2?: string;
    }
  ) => {
    setUploading(fieldId);
    try {
      const res = await apiClient.uploadFile(file, {
        folder: 'homepage',
        pageLevel1: options?.pageLevel1,
        pageLevel2: options?.pageLevel2,
      });

      // Nếu có ảnh cũ trên R2 khác với ảnh mới, xóa file cũ trên R2
      if (options?.oldUrl && options.oldUrl !== res.url) {
        apiClient.deleteR2File(options.oldUrl).catch((err) => {
          console.warn('Lỗi xóa ảnh cũ trên R2:', err);
        });
      }

      onSuccess(res.url);
      showToast('Tải ảnh lên Cloudflare R2 thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải ảnh lên.');
    } finally {
      setUploading(null);
    }
  };

  // Di chuyển khối lên trên
  const handleMoveBlockUp = (index: number) => {
    if (index <= 0) return;
    const next = [...blocks];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    next.forEach((b, idx) => {
      b.sort_order = idx + 1;
    });
    setBlocks(next);
  };

  // Di chuyển khối xuống dưới
  const handleMoveBlockDown = (index: number) => {
    if (index >= blocks.length - 1) return;
    const next = [...blocks];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    next.forEach((b, idx) => {
      b.sort_order = idx + 1;
    });
    setBlocks(next);
  };

  // Thêm một khối mới vào danh sách
  const handleAddBlock = (type: HomepageBlockType) => {
    const id = `block_${type}_${Date.now()}`;
    const info = BLOCK_TYPE_LABELS[type];

    let initialConfig: any = {};
    if (type === 'hero') {
      initialConfig = { mode: 'structured', title: '', subtitle: '', bullets: [], image_url: '', is_active: true };
    } else if (type === 'top_banner') {
      initialConfig = { mode: 'image_text', header_label: '', tag: '', title: '', subtitle: '', cta_badge: '', link_url: '', image_url: '', is_active: true };
    } else if (type === 'categories_grid') {
      initialConfig = { title: 'Danh mục sản phẩm', items: [], is_active: true };
    } else if (type === 'section_groups') {
      initialConfig = { sections: [] };
    } else if (type === 'notice_text') {
      initialConfig = { text: '', cta_button_text: '', cta_button_link: '', is_active: true };
    } else if (type === 'bottom_banner') {
      initialConfig = { mode: 'structured', title: '', link_url: '', books: [], is_active: true };
    } else if (type === 'custom_html') {
      initialConfig = {
        html_content: '<div style="padding: 24px; text-align: center;">\n  <h3 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 8px;">Khối HTML tùy biến</h3>\n  <p style="color: #6b7280;">Chỉnh sửa nội dung HTML/CSS trong trình soạn thảo.</p>\n</div>',
        container_mode: 'boxed',
        no_padding: false,
        admin_label: 'Khối HTML',
      };
    }

    const newBlock: HomepageBlockItem = {
      id,
      type,
      title_label: info.name,
      is_active: true,
      sort_order: blocks.length + 1,
      config: initialConfig,
    };

    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(id);
    showToast(`Đã thêm mới: ${info.name}`);
  };

  // Xóa một khối khỏi trang chủ (đồng thời xóa toàn bộ ảnh R2 thuộc khối đó)
  const handleDeleteBlock = (id: string) => {
    const blockToDelete = blocks.find((b) => b.id === id);
    if (blockToDelete?.config) {
      const cfg = blockToDelete.config;
      // Khung Hero / Top Banner / Bottom Banner
      if (cfg.image_url) apiClient.deleteR2File(cfg.image_url).catch(() => {});
      if (cfg.custom_image_url) apiClient.deleteR2File(cfg.custom_image_url).catch(() => {});

      // Khung Danh mục ô vuông (categories_grid)
      if (Array.isArray(cfg.items)) {
        cfg.items.forEach((it: any) => {
          if (it.image_url) apiClient.deleteR2File(it.image_url).catch(() => {});
        });
      }

      // Khung Nhóm tài liệu cấp 1 & cấp 2 (section_groups)
      if (Array.isArray(cfg.sections)) {
        cfg.sections.forEach((sec: any) => {
          if (Array.isArray(sec.items)) {
            sec.items.forEach((it: any) => {
              if (it.image_url) apiClient.deleteR2File(it.image_url).catch(() => {});
            });
          }
        });
      }
    }

    const next = blocks.filter((b) => b.id !== id);
    next.forEach((b, idx) => {
      b.sort_order = idx + 1;
    });
    setBlocks(next);
    if (selectedBlockId === id) {
      setSelectedBlockId(next[0]?.id || '');
    }
    showToast('Đã xóa khung và dọn dẹp ảnh R2 liên quan');
  };

  // Cập nhật config của khối đang chọn
  const updateCurrentConfig = (updater: (prev: any) => any) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === currentBlock.id ? { ...b, config: updater(b.config) } : b))
    );
  };

  // Lưu toàn bộ layout trang chủ vào Supabase (tự động chuẩn hóa link ra ngoài https:// và link nội bộ root/url)
  const handleSaveAllLayout = async () => {
    setSaving(true);
    try {
      const normalizedBlocks: HomepageBlockItem[] = blocks.map((b) => {
        const clone = JSON.parse(JSON.stringify(b));
        const cfg = clone.config || {};

        if (clone.type === 'top_banner' || clone.type === 'bottom_banner') {
          if (cfg.link_url) {
            const norm = normalizeTargetUrl(cfg.link_url);
            cfg.link_url = norm === '#' ? '' : norm;
          }
        } else if (clone.type === 'categories_grid') {
          if (Array.isArray(cfg.items)) {
            cfg.items.forEach((it: any) => {
              if (it.to) {
                const norm = normalizeTargetUrl(it.to);
                it.to = norm === '#' ? '' : norm;
              }
              if (it.category_slug && !it.to) {
                const norm = normalizeTargetUrl(it.category_slug);
                it.to = norm === '#' ? '' : norm;
              }
            });
          }
        } else if (clone.type === 'section_groups') {
          if (Array.isArray(cfg.sections)) {
            cfg.sections.forEach((sec: any) => {
              if (Array.isArray(sec.items)) {
                sec.items.forEach((it: any) => {
                  if (it.target_url) {
                    const norm = normalizeTargetUrl(it.target_url);
                    it.target_url = norm === '#' ? '' : norm;
                  }
                });
              }
            });
          }
        } else if (clone.type === 'notice_text') {
          if (cfg.cta_button_link) {
            const norm = normalizeTargetUrl(cfg.cta_button_link);
            cfg.cta_button_link = norm === '#' ? '' : norm;
          }
        }

        clone.config = cfg;
        return clone;
      });

      setBlocks(normalizedBlocks);

      await updateSiteConfig('homepage_blocks', normalizedBlocks);

      // Cập nhật đồng bộ các key lẻ nếu có block tương ứng (đảm bảo tương thích ngược)
      const hero = normalizedBlocks.find((b) => b.type === 'hero');
      if (hero) await updateSiteConfig('homepage_hero', hero.config);
      const banner = normalizedBlocks.find((b) => b.type === 'top_banner');
      if (banner) await updateSiteConfig('homepage_top_banner', banner.config);
      const cat = normalizedBlocks.find((b) => b.type === 'categories_grid');
      if (cat) await updateSiteConfig('homepage_categories_grid', cat.config);
      const sec = normalizedBlocks.find((b) => b.type === 'section_groups');
      if (sec) await updateSiteConfig('homepage_section_groups', sec.config);
      const noti = normalizedBlocks.find((b) => b.type === 'notice_text');
      if (noti) await updateSiteConfig('homepage_notice_text', noti.config);
      const btm = normalizedBlocks.find((b) => b.type === 'bottom_banner');
      if (btm) await updateSiteConfig('homepage_bottom_banner', btm.config);

      showToast('Đã lưu toàn bộ cấu hình và thứ tự các khung trang chủ thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-[#e60049] uppercase flex items-center gap-2">
            <span>Quản lý Khối Động Trang Chủ (/)</span>
            <span className="text-[10px] bg-pink-100 text-[#e60049] font-black px-2 py-0.5 rounded">
              {blocks.length} KHỐI
            </span>
          </h2>
          <p className="text-xs text-gray-600 mt-1">
            Tự do thêm bớt, đổi thứ tự, cấu hình các nhóm tài liệu, banner và khối tác giả mà không cần sửa code.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSideBySide(!isSideBySide)}
            className="border border-gray-300 bg-white hover:border-[#e60049] text-gray-700 font-bold text-xs px-3.5 py-2 rounded-sm transition"
          >
            {isSideBySide ? 'Ẩn Xem trước' : '👁️ Xem trước Trang Chủ'}
          </button>
          <button
            type="button"
            onClick={handleSaveAllLayout}
            disabled={saving}
            className="bg-[#e60049] hover:bg-[#cc0041] disabled:opacity-50 text-white font-bold text-xs px-5 py-2 rounded-sm transition shadow-sm"
          >
            {saving ? 'Đang lưu...' : '💾 Lưu Cấu Hình Khối'}
          </button>
        </div>
      </div>

      {/* Xem trước Live Preview */}
      {isSideBySide && (
        <div className="bg-gray-100 border-2 border-dashed border-pink-300 rounded-md p-4">
          <div className="text-xs font-bold text-[#e60049] uppercase mb-3 flex items-center justify-between">
            <span>Live Preview: Giao diện Trang Chủ thực tế</span>
            <span className="text-[10px] text-gray-500 font-normal">Cập nhật tức thời theo cấu hình bên dưới</span>
          </div>
          <div className="bg-white rounded border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
            <UniversalBlockRenderer
              blocks={blocks}
              context={{
                pageType: 'homepage',
                siteConfigs,
              }}
            />
          </div>
        </div>
      )}

      {/* Block Repeater & Universal Picker */}
      <UniversalBlockCardRepeater
        pageTitle="Trang Chủ"
        pageRouteLabel="/"
        blocks={blocks}
        onBlocksChange={(newBlocks) => setBlocks(newBlocks)}
        context={{
          pageType: 'homepage',
          siteConfigs,
        }}
        quickAddTypes={[
          { type: 'hero', label: 'Hero Đầu Trang' },
          { type: 'top_banner', label: 'Top Banner' },
          { type: 'categories_grid', label: 'Danh Mục Sản Phẩm' },
          { type: 'section_groups', label: 'Nhóm Tài Liệu' },
          { type: 'notice_text', label: 'Thông Báo CTA' },
          { type: 'bottom_banner', label: 'Bottom Banner' },
          { type: 'custom_html', label: 'Mã HTML' },
        ]}
      />
    </div>
  );
};