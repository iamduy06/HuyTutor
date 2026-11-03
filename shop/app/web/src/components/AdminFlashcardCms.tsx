import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';
import {
  buildInitialFlashcardBlocks,
  extractYoutubeId,
} from './DynamicFlashcardBlocks';
import {
  FlashcardBannerBlockConfig,
  FlashcardBlockType,
  FlashcardContactNoticeBlockConfig,
  FlashcardFeaturesBlockConfig,
  FlashcardFreeTierBlockConfig,
  FlashcardGroupPricingBlockConfig,
  FlashcardGroupTierRow,
  FlashcardHeroBlockConfig,
  FlashcardIndividualPackageItem,
  FlashcardPageBlockItem,
  FlashcardPricingBlockConfig,
  formatVnd,
} from '../types';

import { R2ImageUploader } from './R2ImageUploader';

const FLASHCARD_BLOCK_META: Record<
  FlashcardBlockType,
  { label: string; desc: string; badgeColor: string }
> = {
  flashcard_hero: {
    label: 'Video Giới thiệu & Slogan Đầu Trang',
    desc: 'Tiêu đề, phụ đề và nhúng video YouTube hoặc ảnh bìa giới thiệu phương pháp học Flashcard thông minh.',
    badgeColor: 'bg-[#e60049] text-white',
  },
  flashcard_features: {
    label: 'Tính Năng & Điểm Nổi Bật',
    desc: 'Danh sách các tính năng nổi bật (Âm thanh bản xứ, thuật toán lặp lại ngắt quãng, theo dõi tiến độ).',
    badgeColor: 'bg-blue-600 text-white',
  },
  flashcard_free_tier: {
    label: 'Gói Trải Nghiệm Học Thử Miễn Phí',
    desc: 'Khu vực cho phép học sinh hoặc giáo viên trải nghiệm flashcard miễn phí mà không cần thanh toán.',
    badgeColor: 'bg-emerald-600 text-white',
  },
  flashcard_pricing_packages: {
    label: 'Gói Trả Phí Cá Nhân',
    desc: 'Cấu hình các gói tài khoản cá nhân (1 năm, 2 năm, 3 năm) kèm giá niêm yết và quyền lợi chi tiết.',
    badgeColor: 'bg-amber-600 text-white',
  },
  flashcard_group_pricing: {
    label: 'Bảng Giá Quy Mô Nhóm & Nút Đăng Ký',
    desc: 'Ma trận giá chiết khấu theo số lượng tài khoản (Nhóm 2-10, 11-50, >50) và nút bấm thanh toán nhanh.',
    badgeColor: 'bg-purple-600 text-white',
  },
  flashcard_contact_notice: {
    label: 'Hướng Dẫn & Kênh Hỗ Trợ Đăng Ký Lớn',
    desc: 'Ghi chú gửi quyền qua email và thông tin liên hệ báo giá trường học cho số lượng lớn học sinh.',
    badgeColor: 'bg-zinc-700 text-white',
  },
  flashcard_banner: {
    label: 'Banner Quảng Cáo / Sự Kiện',
    desc: 'Banner hình ảnh full-width chèn vào giữa các phần trên trang Flashcard.',
    badgeColor: 'bg-sky-600 text-white',
  },
};

export const AdminFlashcardCms: React.FC = () => {
  const { siteConfigs, updateSiteConfig, showToast } = useStore();

  const [blocks, setBlocks] = useState<FlashcardPageBlockItem[]>(() => {
    return buildInitialFlashcardBlocks(siteConfigs?.flashcard_page_blocks);
  });

  const [saving, setSaving] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Sắp xếp khối lên / xuống
  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const next = [...blocks];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    // Cập nhật lại sort_order
    next.forEach((b, idx) => {
      b.sort_order = idx + 1;
    });

    setBlocks(next);
  };

  // Ẩn / hiện khối
  const handleToggleActive = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_active: !b.is_active } : b))
    );
  };

  // Xóa khối
  const handleDeleteBlock = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khối này khỏi Trang Flashcard?')) {
      setBlocks((prev) => prev.filter((b) => b.id !== id));
      if (activeBlockId === id) setActiveBlockId(null);
    }
  };

  // Cập nhật cấu hình của 1 khối
  const handleUpdateBlockConfig = (id: string, newConfig: any) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, config: { ...newConfig } } : b))
    );
  };

  // Thêm khối mới
  const handleAddBlock = (type: FlashcardBlockType) => {
    const id = `fc-block-${Date.now()}`;
    let newBlock: FlashcardPageBlockItem;

    switch (type) {
      case 'flashcard_hero':
        newBlock = {
          id,
          type,
          title_label: 'Tiêu đề & Video giới thiệu',
          is_active: true,
          sort_order: blocks.length + 1,
          config: {
            title: 'Flashcard Huy Tutor',
            subtitle: 'Chủ động - Mọi lúc - Mọi nơi',
            video_type: 'cover_only',
            video_title: 'Học từ vựng hiệu quả cùng flashcard của Huy Tutor',
          } as FlashcardHeroBlockConfig,
        };
        break;

      case 'flashcard_features':
        newBlock = {
          id,
          type,
          title_label: 'Banner Giới thiệu Tính năng',
          is_active: true,
          sort_order: blocks.length + 1,
          config: {
            bg_color: '#e60049',
            demo_card: {
              unit_title: 'Đề 1',
              word: 'groundbreaking',
              phonetic: '/ˈɡraʊndbreɪkɪŋ/',
              meaning: 'mang tính đột phá, tiên phong (adj)',
            },
            cta_button: {
              text: 'Trải nghiệm ngay',
              action_type: 'buy_package',
              package_price: 100000,
              package_title: 'Flashcard Huy Tutor - Gói 1 Năm',
            },
            features: [
              'Giao diện hiện đại',
              'Phân loại B1/B2/C1/C2 rõ ràng',
              '4 chế độ luyện tập từ vựng',
            ],
          } as FlashcardFeaturesBlockConfig,
        };
        break;

      case 'flashcard_free_tier':
        newBlock = {
          id,
          type,
          title_label: 'Chính sách Gói Miễn phí',
          is_active: true,
          sort_order: blocks.length + 1,
          config: {
            title: '1. Gói miễn phí',
            description:
              'Chỉ áp dụng cho quý Thầy/Cô và các bạn đã mua tài liệu của Huy Tutor.',
            rules_title: 'Số lượng tài khoản:',
            rules: [
              '1 tài khoản Gmail chính - không giới hạn thời gian truy cập.',
              'Đối với Thầy/Cô mua file Word: tặng tối đa 20 tài khoản học sinh.',
            ],
          } as FlashcardFreeTierBlockConfig,
        };
        break;

      case 'flashcard_pricing_packages':
        newBlock = {
          id,
          type,
          title_label: 'Gói Trả phí Cá nhân',
          is_active: true,
          sort_order: blocks.length + 1,
          config: {
            title: '2. Gói trả phí',
            benefit_text:
              'Quyền lợi: Truy cập trọn bộ flashcard của các chủ đề từ vựng.',
            packages: [
              {
                id: 'pkg-1y',
                label: 'GÓI 1 NĂM',
                price: 100000,
                price_text: '100.000đ',
                badge_text: '1 tài khoản cá nhân',
              },
            ],
          } as FlashcardPricingBlockConfig,
        };
        break;

      case 'flashcard_group_pricing':
        newBlock = {
          id,
          type,
          title_label: 'Bảng giá Quy mô Nhóm & CTA',
          is_active: true,
          sort_order: blocks.length + 1,
          config: {
            columns: ['Gói 1 năm', 'Gói 2 năm', 'Gói 3 năm'],
            tiers: [
              { tier_name: 'Cá nhân', prices: ['100.000 đ', '150.000 đ', '200.000 đ'] },
              { tier_name: 'Nhóm 2-10', prices: ['72.000 đ/tk', '104.000 đ/tk', '140.000 đ/tk'] },
            ],
            cta_button_text: 'Đăng ký ngay 1 tài khoản',
            default_price: 100000,
          } as FlashcardGroupPricingBlockConfig,
        };
        break;

      case 'flashcard_contact_notice':
        newBlock = {
          id,
          type,
          title_label: 'Hướng dẫn & Kênh Hỗ trợ',
          is_active: true,
          sort_order: blocks.length + 1,
          config: {
            bulk_order_text:
              'Thầy/Cô cần đăng ký trọn bộ hệ thống cho số lượng lớn học sinh vui lòng liên hệ fanpage hoặc email để nhận báo giá cụ thể.',
            delivery_notice_text:
              'Sau khi đăng ký, Huy Tutor sẽ cấp quyền truy cập và thông báo qua email. Vui lòng kiểm tra cả thư mục Spam.',
          } as FlashcardContactNoticeBlockConfig,
        };
        break;

      case 'flashcard_banner':
        newBlock = {
          id,
          type,
          title_label: 'Banner Quảng cáo / Sự kiện',
          is_active: true,
          sort_order: blocks.length + 1,
          config: {
            banner_url: '',
            link_url: '',
            alt_text: 'Flashcard Banner',
          } as FlashcardBannerBlockConfig,
        };
        break;

      default:
        return;
    }

    setBlocks([...blocks, newBlock]);
    setActiveBlockId(id);
    setShowAddModal(false);
  };

  // Khôi phục mặc định
  const handleResetToDefault = () => {
    if (confirm('Khôi phục cấu hình mặc định (6 khối gốc)? Mọi thay đổi chưa lưu sẽ bị xóa.')) {
      const initial = buildInitialFlashcardBlocks();
      setBlocks(initial);
      showToast('Đã khôi phục danh sách khối chuẩn.');
    }
  };

  // Upload ảnh lên R2
  const handleUploadR2 = async (file: File, folder = 'flashcards'): Promise<string> => {
    setUploadingImage(true);
    try {
      const res = await apiClient.uploadFile(file, {
        folder,
        pageLevel1: 'flashcard',
        pageLevel2: 'cms',
      });
      showToast('Đã tải ảnh lên Cloudflare R2 thành công!');
      return res.url;
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải ảnh lên R2.');
      throw err;
    } finally {
      setUploadingImage(false);
    }
  };

  // Lưu toàn bộ cấu hình trang Flashcard vào site_configs
  const handleSaveBlocks = async () => {
    setSaving(true);
    try {
      await updateSiteConfig('flashcard_page_blocks', blocks);
      showToast('Đã lưu cấu hình Trang Flashcard thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CMS */}
      <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e60049] animate-pulse"></span>
            <h2 className="text-sm font-extrabold text-[#e60049] uppercase tracking-wide">
              Trình Quản Trị Trang Flashcard (Flashcard CMS Builder)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Quản lý và tùy biến tất cả các khối trên trang{' '}
            <code className="text-[#e60049] font-mono text-[11px]">/flashcard</code>: Video YouTube, tính năng, gói học và ma trận giá nhóm.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-sm transition"
          >
            Khôi phục mặc định
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-sm transition flex items-center gap-1.5"
          >
            <span>+</span> Thêm khối mới
          </button>
          <button
            type="button"
            onClick={handleSaveBlocks}
            disabled={saving}
            className="px-4 py-1.5 bg-[#e60049] hover:bg-[#cc0041] disabled:opacity-50 text-white text-xs font-bold rounded-sm transition flex items-center gap-2 shadow-sm"
          >
            {saving ? 'Đang lưu...' : 'Lưu Trang Flashcard'}
          </button>
        </div>
      </div>

      {/* DANH SÁCH KHỐI & BẢNG ĐIỀU KHIỂN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: DANH SÁCH KHỐI DẠNG DANH SÁCH THỨ TỰ (5 CỘT) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-700">
              Cấu trúc trang ({blocks.length} khối)
            </span>
            <span className="text-[11px] text-gray-500">
              Nhấn vào khối để tùy chỉnh chi tiết
            </span>
          </div>

          <div className="space-y-2">
            {blocks.map((block, idx) => {
              const isSelected = activeBlockId === block.id;

              return (
                <div
                  key={block.id}
                  onClick={() => setActiveBlockId(block.id)}
                  className={`p-3 rounded-md border transition cursor-pointer select-none ${
                    isSelected
                      ? 'border-[#e60049] bg-pink-50/40 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <div className="truncate">
                        <div className="text-xs font-bold text-gray-800 truncate">
                          {block.title_label || block.type}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {block.type}
                        </div>
                      </div>
                    </div>

                    {/* HÀNH ĐỘNG KHỐI */}
                    <div
                      className="flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(idx, 'up')}
                        disabled={idx === 0}
                        title="Di chuyển lên"
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs rounded"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveBlock(idx, 'down')}
                        disabled={idx === blocks.length - 1}
                        title="Di chuyển xuống"
                        className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-20 text-xs rounded"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(block.id)}
                        title={block.is_active ? 'Đang bật - Nhấn để ẩn' : 'Đang ẩn - Nhấn để bật'}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-sm ${
                          block.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {block.is_active ? 'Bật' : 'Ẩn'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBlock(block.id)}
                        title="Xóa khối"
                        className="p-1 text-gray-400 hover:text-red-600 text-xs rounded"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI: TRÌNH BIÊN TẬP CHI TIẾT KHỐI ĐƯỢC CHỌN (7 CỘT) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-md p-5 shadow-sm">
          {activeBlockId ? (
            (() => {
              const currentBlock = blocks.find((b) => b.id === activeBlockId);
              if (!currentBlock) {
                return (
                  <div className="text-xs text-gray-400 py-12 text-center">
                    Vui lòng chọn một khối từ danh sách bên trái để chỉnh sửa.
                  </div>
                );
              }

              return (
                <div className="space-y-5">
                  {/* Header chuẩn: Title khối - Mô tả của khối đó */}
                  <div className="border-b border-gray-100 pb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-[#e60049] text-white">
                          {currentBlock.type}
                        </span>
                        <h3 className="text-sm font-black text-gray-900">
                          {currentBlock.title_label || FLASHCARD_BLOCK_META[currentBlock.type]?.label}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {FLASHCARD_BLOCK_META[currentBlock.type]?.desc}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={currentBlock.title_label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlocks((prev) =>
                            prev.map((b) =>
                              b.id === currentBlock.id ? { ...b, title_label: val } : b
                            )
                          );
                        }}
                        className="text-xs border border-gray-200 rounded px-2 py-1 focus:border-[#e60049] outline-none"
                        placeholder="Tên gợi nhớ"
                      />
                    </div>
                  </div>

                  {/* RENDER CHI TIẾT THEO LOẠI KHỐI */}
                  {currentBlock.type === 'flashcard_hero' && (
                    <HeroBlockEditor
                      config={currentBlock.config as FlashcardHeroBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(currentBlock.id, cfg)}
                      onUploadR2={handleUploadR2}
                      uploading={uploadingImage}
                    />
                  )}

                  {currentBlock.type === 'flashcard_features' && (
                    <FeaturesBlockEditor
                      config={currentBlock.config as FlashcardFeaturesBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(currentBlock.id, cfg)}
                      onUploadR2={handleUploadR2}
                      uploading={uploadingImage}
                    />
                  )}

                  {currentBlock.type === 'flashcard_free_tier' && (
                    <FreeTierBlockEditor
                      config={currentBlock.config as FlashcardFreeTierBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(currentBlock.id, cfg)}
                    />
                  )}

                  {currentBlock.type === 'flashcard_pricing_packages' && (
                    <PricingBlockEditor
                      config={currentBlock.config as FlashcardPricingBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(currentBlock.id, cfg)}
                      onUploadR2={handleUploadR2}
                      uploading={uploadingImage}
                    />
                  )}

                  {currentBlock.type === 'flashcard_group_pricing' && (
                    <GroupPricingBlockEditor
                      config={currentBlock.config as FlashcardGroupPricingBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(currentBlock.id, cfg)}
                    />
                  )}

                  {currentBlock.type === 'flashcard_contact_notice' && (
                    <ContactNoticeBlockEditor
                      config={currentBlock.config as FlashcardContactNoticeBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(currentBlock.id, cfg)}
                    />
                  )}

                  {currentBlock.type === 'flashcard_banner' && (
                    <BannerBlockEditor
                      config={currentBlock.config as FlashcardBannerBlockConfig}
                      onUpdate={(cfg) => handleUpdateBlockConfig(currentBlock.id, cfg)}
                      onUploadR2={handleUploadR2}
                      uploading={uploadingImage}
                    />
                  )}
                </div>
              );
            })()
          ) : (
            <div className="text-center py-16 text-gray-400">
              <div className="text-2xl mb-2">👈</div>
              <div className="text-xs font-bold text-gray-600">
                Chọn một khối bên trái để bắt đầu chỉnh sửa
              </div>
              <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                Bạn có thể sửa chữ, đổi video YouTube, thêm/xóa tính năng hoặc tùy chỉnh bảng giá nhóm.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL THÊM KHỐI MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-900 uppercase">
                Thêm khối mới vào Trang Flashcard
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleAddBlock('flashcard_hero')}
                className="p-3 text-left border border-gray-200 hover:border-[#e60049] hover:bg-pink-50/30 rounded-md transition"
              >
                <div className="text-xs font-bold text-gray-800">1. Hero &amp; Video Giới thiệu</div>
                <div className="text-[10px] text-gray-500">
                  Tiêu đề lớn, slogan và khung nhúng YouTube / Video R2.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('flashcard_features')}
                className="p-3 text-left border border-gray-200 hover:border-[#e60049] hover:bg-pink-50/30 rounded-md transition"
              >
                <div className="text-xs font-bold text-gray-800">2. Banner Tính năng Nổi bật</div>
                <div className="text-[10px] text-gray-500">
                  Dải màu đỏ giới thiệu thẻ từ vựng mẫu và 9+ tính năng học.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('flashcard_free_tier')}
                className="p-3 text-left border border-gray-200 hover:border-[#e60049] hover:bg-pink-50/30 rounded-md transition"
              >
                <div className="text-xs font-bold text-gray-800">3. Chính sách Gói Miễn phí</div>
                <div className="text-[10px] text-gray-500">
                  Điều khoản tặng tài khoản cho học sinh và người mua file Word.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('flashcard_pricing_packages')}
                className="p-3 text-left border border-gray-200 hover:border-[#e60049] hover:bg-pink-50/30 rounded-md transition"
              >
                <div className="text-xs font-bold text-gray-800">4. Gói Trả phí Cá nhân</div>
                <div className="text-[10px] text-gray-500">
                  Lưới 4 card gói 6 tháng / 1 năm / 2 năm / 3 năm.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('flashcard_group_pricing')}
                className="p-3 text-left border border-gray-200 hover:border-[#e60049] hover:bg-pink-50/30 rounded-md transition"
              >
                <div className="text-xs font-bold text-gray-800">5. Bảng giá Quy mô Nhóm &amp; CTA</div>
                <div className="text-[10px] text-gray-500">
                  Bảng ma trận giá cho các nhóm 2-10, 11-50, 51-100... và nút mua.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('flashcard_contact_notice')}
                className="p-3 text-left border border-gray-200 hover:border-[#e60049] hover:bg-pink-50/30 rounded-md transition"
              >
                <div className="text-xs font-bold text-gray-800">6. Hướng dẫn &amp; Kênh Hỗ trợ</div>
                <div className="text-[10px] text-gray-500">
                  Thông báo cho thầy cô đăng ký số lượng lớn, kiểm tra thư mục spam.
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleAddBlock('flashcard_banner')}
                className="p-3 text-left border border-gray-200 hover:border-[#e60049] hover:bg-pink-50/30 rounded-md transition"
              >
                <div className="text-xs font-bold text-gray-800">7. Banner Hình ảnh</div>
                <div className="text-[10px] text-gray-500">
                  Thêm banner quảng cáo, chương trình khuyến mãi riêng.
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CÁC SUB-COMPONENT SOẠN THẢO RIÊNG BIỆT CHO TỪNG LOẠI KHỐI
// ============================================================================

// 1. SOẠN THẢO KHỐI HERO
const HeroBlockEditor: React.FC<{
  config: FlashcardHeroBlockConfig;
  onUpdate: (cfg: FlashcardHeroBlockConfig) => void;
  onUploadR2: (file: File) => Promise<string>;
  uploading: boolean;
}> = ({ config, onUpdate, onUploadR2, uploading }) => {
  const ytId = extractYoutubeId(config.youtube_url_or_id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">
            Tiêu đề chính
          </label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => onUpdate({ ...config, title: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
            placeholder="Flashcard Huy Tutor"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">
            Slogan / Phụ đề
          </label>
          <input
            type="text"
            value={config.subtitle || ''}
            onChange={(e) => onUpdate({ ...config, subtitle: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
            placeholder="Chủ động - Mọi lúc - Mọi nơi"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          Loại Video hiển thị
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'cover_only', label: 'Bìa minh họa (Mẫu gốc)' },
            { id: 'youtube', label: 'Video YouTube (Embed)' },
            { id: 'r2_video', label: 'Video MP4 R2' },
          ].map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => onUpdate({ ...config, video_type: mode.id as any })}
              className={`py-2 px-2.5 text-xs font-bold rounded-sm border text-center transition ${
                config.video_type === mode.id
                  ? 'border-[#e60049] bg-pink-50 text-[#e60049]'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {config.video_type === 'youtube' && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
          <label className="block text-[11px] font-bold text-gray-700">
            Đường dẫn YouTube hoặc Video ID
          </label>
          <input
            type="text"
            value={config.youtube_url_or_id || ''}
            onChange={(e) => onUpdate({ ...config, youtube_url_or_id: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
            placeholder="Ví dụ: https://www.youtube.com/watch?v=... hoặc dQw4w9WgXcQ"
          />
          {ytId && (
            <div className="text-[10px] text-emerald-600 font-medium">
              ✔ Đã nhận diện YouTube Video ID: <code>{ytId}</code>
            </div>
          )}
        </div>
      )}

      {config.video_type === 'r2_video' && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-2">
          <label className="block text-[11px] font-bold text-gray-700">
            URL Video MP4 (Cloudflare R2)
          </label>
          <input
            type="text"
            value={config.r2_video_url || ''}
            onChange={(e) => onUpdate({ ...config, r2_video_url: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
            placeholder="https://pub-....r2.dev/flashcard-intro.mp4"
          />
        </div>
      )}

      <div>
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          Ảnh bìa Video tùy chỉnh (Tùy chọn)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={config.cover_image_url || ''}
            onChange={(e) => onUpdate({ ...config, cover_image_url: e.target.value })}
            className="flex-1 text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
            placeholder="URL ảnh bìa trên Cloudflare R2"
          />
          <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded cursor-pointer transition">
            {uploading ? 'Đang tải...' : 'Tải ảnh R2'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const url = await onUploadR2(f);
                  onUpdate({ ...config, cover_image_url: url });
                }
              }}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

// 2. SOẠN THẢO KHỐI TÍNH NĂNG (FEATURES)
const FeaturesBlockEditor: React.FC<{
  config: FlashcardFeaturesBlockConfig;
  onUpdate: (cfg: FlashcardFeaturesBlockConfig) => void;
  onUploadR2: (file: File) => Promise<string>;
  uploading: boolean;
}> = ({ config, onUpdate, onUploadR2, uploading }) => {
  const { demo_card, cta_button, features } = config;
  const [newFeatureText, setNewFeatureText] = useState('');

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    onUpdate({
      ...config,
      features: [...(features || []), newFeatureText.trim()],
    });
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx: number) => {
    onUpdate({
      ...config,
      features: features.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-4">
      {/* CỘT TRÁI: DEMO CARD */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-3">
        <span className="text-xs font-bold text-gray-800 block">
          1. Thẻ từ vựng Demo (Cột trái)
        </span>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Tiêu đề bài</label>
            <input
              type="text"
              value={demo_card.unit_title}
              onChange={(e) =>
                onUpdate({
                  ...config,
                  demo_card: { ...demo_card, unit_title: e.target.value },
                })
              }
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
              placeholder="Đề 1"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Từ vựng</label>
            <input
              type="text"
              value={demo_card.word}
              onChange={(e) =>
                onUpdate({
                  ...config,
                  demo_card: { ...demo_card, word: e.target.value },
                })
              }
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
              placeholder="groundbreaking"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Phiên âm</label>
            <input
              type="text"
              value={demo_card.phonetic}
              onChange={(e) =>
                onUpdate({
                  ...config,
                  demo_card: { ...demo_card, phonetic: e.target.value },
                })
              }
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
              placeholder="/ˈɡraʊndbreɪkɪŋ/"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Định nghĩa</label>
            <input
              type="text"
              value={demo_card.meaning}
              onChange={(e) =>
                onUpdate({
                  ...config,
                  demo_card: { ...demo_card, meaning: e.target.value },
                })
              }
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
              placeholder="mang tính đột phá, tiên phong (adj)"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
            Hoặc tải ảnh chụp màn hình App Flashcard thay thế (R2)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={demo_card.image_url || ''}
              onChange={(e) =>
                onUpdate({
                  ...config,
                  demo_card: { ...demo_card, image_url: e.target.value },
                })
              }
              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 outline-none"
              placeholder="URL ảnh chụp ứng dụng"
            />
            <label className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-[11px] font-bold rounded cursor-pointer">
              {uploading ? '...' : 'Tải R2'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    const url = await onUploadR2(f);
                    onUpdate({
                      ...config,
                      demo_card: { ...demo_card, image_url: url },
                    });
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* NÚT CTA */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-2">
        <span className="text-xs font-bold text-gray-800 block">2. Nút Hành động (CTA Button)</span>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Nhãn nút</label>
            <input
              type="text"
              value={cta_button.text}
              onChange={(e) =>
                onUpdate({
                  ...config,
                  cta_button: { ...cta_button, text: e.target.value },
                })
              }
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
              placeholder="Trải nghiệm ngay"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Giá gói đăng ký</label>
            <input
              type="number"
              value={cta_button.package_price || 100000}
              onChange={(e) =>
                onUpdate({
                  ...config,
                  cta_button: { ...cta_button, package_price: Number(e.target.value) },
                })
              }
              className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
            />
          </div>
        </div>
      </div>

      {/* DANH SÁCH TÍNH NĂNG NỔI BẬT */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md space-y-3">
        <span className="text-xs font-bold text-gray-800 block">
          3. Danh sách gạch đầu dòng tính năng ({features?.length || 0})
        </span>

        <div className="space-y-1.5">
          {(features || []).map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-white p-1.5 border border-gray-200 rounded">
              <span className="text-[10px] font-bold text-gray-400 w-4 text-center">{idx + 1}</span>
              <input
                type="text"
                value={feat}
                onChange={(e) => {
                  const val = e.target.value;
                  const next = [...features];
                  next[idx] = val;
                  onUpdate({ ...config, features: next });
                }}
                className="flex-1 text-xs border-0 outline-none text-gray-800"
              />
              <button
                type="button"
                onClick={() => handleRemoveFeature(idx)}
                className="text-gray-400 hover:text-red-600 text-xs px-1"
                title="Xóa"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newFeatureText}
            onChange={(e) => setNewFeatureText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddFeature()}
            className="flex-1 text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
            placeholder="Nhập tính năng mới rồi nhấn Thêm..."
          />
          <button
            type="button"
            onClick={handleAddFeature}
            className="px-3 py-1.5 bg-gray-800 hover:bg-black text-white text-xs font-bold rounded"
          >
            + Thêm
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. SOẠN THẢO KHỐI GÓI MIỄN PHÍ
const FreeTierBlockEditor: React.FC<{
  config: FlashcardFreeTierBlockConfig;
  onUpdate: (cfg: FlashcardFreeTierBlockConfig) => void;
}> = ({ config, onUpdate }) => {
  const [newRule, setNewRule] = useState('');

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    onUpdate({
      ...config,
      rules: [...(config.rules || []), newRule.trim()],
    });
    setNewRule('');
  };

  const handleRemoveRule = (idx: number) => {
    onUpdate({
      ...config,
      rules: config.rules.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          Tiêu đề phần
        </label>
        <input
          type="text"
          value={config.title}
          onChange={(e) => onUpdate({ ...config, title: e.target.value })}
          className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          Mô tả điều kiện áp dụng
        </label>
        <textarea
          rows={2}
          value={config.description}
          onChange={(e) => onUpdate({ ...config, description: e.target.value })}
          className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          Tiêu đề danh sách điều kiện
        </label>
        <input
          type="text"
          value={config.rules_title || ''}
          onChange={(e) => onUpdate({ ...config, rules_title: e.target.value })}
          className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-[11px] font-bold text-gray-700">
          Các điều khoản quy định số lượng tài khoản:
        </label>
        {(config.rules || []).map((rule, idx) => (
          <div key={idx} className="flex items-start gap-2 bg-gray-50 p-2 border border-gray-200 rounded">
            <textarea
              rows={2}
              value={rule}
              onChange={(e) => {
                const next = [...config.rules];
                next[idx] = e.target.value;
                onUpdate({ ...config, rules: next });
              }}
              className="flex-1 text-xs border border-gray-200 rounded p-1 outline-none"
            />
            <button
              type="button"
              onClick={() => handleRemoveRule(idx)}
              className="text-gray-400 hover:text-red-600 text-xs px-1"
            >
              ✕
            </button>
          </div>
        ))}

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 outline-none focus:border-[#e60049]"
            placeholder="Thêm điều khoản mới..."
          />
          <button
            type="button"
            onClick={handleAddRule}
            className="px-3 py-1.5 bg-gray-800 hover:bg-black text-white text-xs font-bold rounded"
          >
            + Thêm
          </button>
        </div>
      </div>
    </div>
  );
};

// 4. SOẠN THẢO KHỐI BỐN GÓI CÁ NHÂN (PRICING)
const PricingBlockEditor: React.FC<{
  config: FlashcardPricingBlockConfig;
  onUpdate: (cfg: FlashcardPricingBlockConfig) => void;
  onUploadR2: (file: File) => Promise<string>;
  uploading: boolean;
}> = ({ config, onUpdate, onUploadR2, uploading }) => {
  const handleAddPackage = () => {
    const newPkg: FlashcardIndividualPackageItem = {
      id: `pkg-${Date.now()}`,
      label: 'GÓI MỚI',
      price: 100000,
      price_text: '100.000đ',
      badge_text: '1 tài khoản cá nhân',
    };
    onUpdate({
      ...config,
      packages: [...(config.packages || []), newPkg],
    });
  };

  const handleRemovePackage = (id: string) => {
    onUpdate({
      ...config,
      packages: config.packages.filter((p) => p.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">
            Tiêu đề phần
          </label>
          <input
            type="text"
            value={config.title}
            onChange={(e) => onUpdate({ ...config, title: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">
            Mô tả quyền lợi
          </label>
          <input
            type="text"
            value={config.benefit_text}
            onChange={(e) => onUpdate({ ...config, benefit_text: e.target.value })}
            className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800">
            Danh sách các gói cá nhân ({config.packages?.length || 0})
          </span>
          <button
            type="button"
            onClick={handleAddPackage}
            className="text-[11px] px-2.5 py-1 bg-[#e60049] text-white font-bold rounded"
          >
            + Thêm gói
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(config.packages || []).map((pkg, idx) => (
            <div key={pkg.id || idx} className="p-3 border border-gray-200 bg-gray-50 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#e60049]">Gói #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemovePackage(pkg.id)}
                  className="text-gray-400 hover:text-red-600 text-xs"
                >
                  ✕ Xóa
                </button>
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold block">Tên gói</label>
                <input
                  type="text"
                  value={pkg.label}
                  onChange={(e) => {
                    const next = [...config.packages];
                    next[idx] = { ...pkg, label: e.target.value };
                    onUpdate({ ...config, packages: next });
                  }}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 font-bold block">Giá (VNĐ)</label>
                  <input
                    type="number"
                    value={pkg.price}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const next = [...config.packages];
                      next[idx] = {
                        ...pkg,
                        price: val,
                        price_text: formatVnd(val),
                      };
                      onUpdate({ ...config, packages: next });
                    }}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-bold block">Badge phụ</label>
                  <input
                    type="text"
                    value={pkg.badge_text || ''}
                    onChange={(e) => {
                      const next = [...config.packages];
                      next[idx] = { ...pkg, badge_text: e.target.value };
                      onUpdate({ ...config, packages: next });
                    }}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. SOẠN THẢO BẢNG GIÁ QUY MÔ NHÓM (GROUP PRICING)
const GroupPricingBlockEditor: React.FC<{
  config: FlashcardGroupPricingBlockConfig;
  onUpdate: (cfg: FlashcardGroupPricingBlockConfig) => void;
}> = ({ config, onUpdate }) => {
  const { columns, tiers, cta_button_text } = config;

  const handleAddTier = () => {
    const newTier: FlashcardGroupTierRow = {
      tier_name: 'Nhóm mới',
      prices: (columns || []).map(() => '0 đ'),
    };
    onUpdate({
      ...config,
      tiers: [...(tiers || []), newTier],
    });
  };

  const handleRemoveTier = (idx: number) => {
    onUpdate({
      ...config,
      tiers: tiers.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          Nhãn nút Đăng ký cuối bảng
        </label>
        <input
          type="text"
          value={cta_button_text || ''}
          onChange={(e) => onUpdate({ ...config, cta_button_text: e.target.value })}
          className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
          placeholder="Đăng ký ngay 1 tài khoản"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-800">
            Ma trận bảng giá theo quy mô nhóm
          </span>
          <button
            type="button"
            onClick={handleAddTier}
            className="text-[11px] px-2.5 py-1 bg-gray-900 text-white font-bold rounded"
          >
            + Thêm dòng nhóm
          </button>
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="p-2 w-32">Quy mô nhóm</th>
                {(columns || []).map((col, idx) => (
                  <th key={idx} className="p-2">
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => {
                        const nextCols = [...columns];
                        nextCols[idx] = e.target.value;
                        onUpdate({ ...config, columns: nextCols });
                      }}
                      className="w-full font-bold bg-transparent border-0 outline-none"
                    />
                  </th>
                ))}
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(tiers || []).map((tier, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50">
                  <td className="p-1.5">
                    <input
                      type="text"
                      value={tier.tier_name}
                      onChange={(e) => {
                        const nextTiers = [...tiers];
                        nextTiers[rIdx] = { ...tier, tier_name: e.target.value };
                        onUpdate({ ...config, tiers: nextTiers });
                      }}
                      className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs outline-none"
                    />
                  </td>
                  {(tier.prices || []).map((pVal, cIdx) => (
                    <td key={cIdx} className="p-1.5">
                      <input
                        type="text"
                        value={pVal}
                        onChange={(e) => {
                          const nextTiers = [...tiers];
                          const nextPrices = [...(tier.prices || [])];
                          nextPrices[cIdx] = e.target.value;
                          nextTiers[rIdx] = { ...tier, prices: nextPrices };
                          onUpdate({ ...config, tiers: nextTiers });
                        }}
                        className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs outline-none"
                      />
                    </td>
                  ))}
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(rIdx)}
                      className="text-gray-400 hover:text-red-600 text-xs"
                      title="Xóa dòng"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 6. SOẠN THẢO KHỐI HƯỚNG DẪN & LIÊN HỆ
const ContactNoticeBlockEditor: React.FC<{
  config: FlashcardContactNoticeBlockConfig;
  onUpdate: (cfg: FlashcardContactNoticeBlockConfig) => void;
}> = ({ config, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          Hướng dẫn đặt số lượng lớn (Dành cho Thầy/Cô)
        </label>
        <textarea
          rows={3}
          value={config.bulk_order_text}
          onChange={(e) => onUpdate({ ...config, bulk_order_text: e.target.value })}
          className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          Thông báo sau khi đăng ký &amp; kiểm tra hộp thư
        </label>
        <textarea
          rows={3}
          value={config.delivery_notice_text}
          onChange={(e) => onUpdate({ ...config, delivery_notice_text: e.target.value })}
          className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
        />
      </div>

      <div className="p-3 bg-pink-50 border border-pink-100 rounded text-[11px] text-pink-800 space-y-1">
        <div className="font-bold">Lưu ý tuân thủ quy chuẩn bảo mật:</div>
        <div>
          Đường link Fanpage và Email hỗ trợ được tự động kế thừa từ mục <strong>Cài đặt hệ thống (SiteConfigs)</strong>. Bạn không cần nhập cứng link hoặc email để tránh lộ hoặc sai lệch thông tin.
        </div>
      </div>
    </div>
  );
};

// 7. SOẠN THẢO BANNER
const BannerBlockEditor: React.FC<{
  config: FlashcardBannerBlockConfig;
  onUpdate: (cfg: FlashcardBannerBlockConfig) => void;
  onUploadR2: (file: File) => Promise<string>;
  uploading: boolean;
}> = ({ config, onUpdate, onUploadR2, uploading }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          URL Ảnh Banner (Cloudflare R2)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={config.banner_url || ''}
            onChange={(e) => onUpdate({ ...config, banner_url: e.target.value })}
            className="flex-1 text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
            placeholder="URL ảnh banner"
          />
          <label className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded cursor-pointer transition">
            {uploading ? 'Đang tải...' : 'Tải ảnh lên R2'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const url = await onUploadR2(f);
                  onUpdate({ ...config, banner_url: url });
                }
              }}
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-bold text-gray-700 mb-1">
          Đường dẫn khi click (Tùy chọn)
        </label>
        <input
          type="text"
          value={config.link_url || ''}
          onChange={(e) => onUpdate({ ...config, link_url: e.target.value })}
          className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 focus:border-[#e60049] outline-none"
          placeholder="/combo-thpt hoặc liên kết ngoài"
        />
      </div>
    </div>
  );
};

