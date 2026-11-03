import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  FlashcardBannerBlockConfig,
  FlashcardContactNoticeBlockConfig,
  FlashcardFeaturesBlockConfig,
  FlashcardFreeTierBlockConfig,
  FlashcardGroupPricingBlockConfig,
  FlashcardHeroBlockConfig,
  FlashcardIndividualPackageItem,
  FlashcardPageBlockItem,
  FlashcardPricingBlockConfig,
  formatVnd,
} from '../types';

export function extractYoutubeId(urlOrId?: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : '';
}

export function buildInitialFlashcardBlocks(
  existingBlocks?: FlashcardPageBlockItem[]
): FlashcardPageBlockItem[] {
  if (existingBlocks && existingBlocks.length > 0) {
    return existingBlocks;
  }

  return [
    {
      id: 'fc-block-hero',
      type: 'flashcard_hero',
      title_label: 'Tiêu đề & Video giới thiệu',
      is_active: true,
      sort_order: 1,
      config: {
        title: 'Flashcard Huy Tutor',
        subtitle: 'Chủ động - Mọi lúc - Mọi nơi',
        badge_text: 'Học từ vựng hiệu quả cùng flashcard của Huy Tutor',
        video_type: 'cover_only',
        youtube_url_or_id: '',
        r2_video_url: '',
        cover_image_url: '',
        video_title: 'Học từ vựng hiệu quả cùng flashcard của Huy Tutor',
      } as FlashcardHeroBlockConfig,
    },
    {
      id: 'fc-block-features',
      type: 'flashcard_features',
      title_label: 'Banner Giới thiệu Tính năng',
      is_active: true,
      sort_order: 2,
      config: {
        bg_color: '#e60049',
        demo_card: {
          unit_title: 'Đề 1',
          word: 'groundbreaking',
          phonetic: '/ˈɡraʊndbreɪkɪŋ/',
          meaning: 'mang tính đột phá, tiên phong (adj)',
          image_url: '',
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
          'Truy cập nhiều bài học nhanh chóng - không cần tải lại trang',
          'Nghe phát âm của từ/cụm từ không giới hạn số lần',
          '4 chế độ luyện tập từ vựng',
          'Dễ dàng chọn nhanh từ/cụm từ thông qua bảng chọn (không cần bấm thủ công từ đầu đến cuối)',
          'Có tính năng nhập số thứ tự của thẻ để chuyển đến nhanh chóng',
          'Bổ sung từ đồng nghĩa, trái nghĩa cho đa số từ đơn',
          'Bổ sung ví dụ và bản dịch ví dụ để hiểu cách áp dụng từ/cụm từ đã học',
        ],
      } as FlashcardFeaturesBlockConfig,
    },
    {
      id: 'fc-block-free-tier',
      type: 'flashcard_free_tier',
      title_label: 'Chính sách Gói Miễn phí',
      is_active: true,
      sort_order: 3,
      config: {
        title: '1. Gói miễn phí',
        description:
          'Chỉ áp dụng cho quý Thầy/Cô và các bạn đã mua tài liệu của Huy Tutor (cấp quyền truy cập tương ứng với tài liệu đã mua).',
        rules_title: 'Số lượng tài khoản:',
        rules: [
          '1 tài khoản Gmail chính (đã dùng để mua tài liệu) - không giới hạn thời gian truy cập.',
          'Đối với Thầy/Cô đã mua file Word: được hỗ trợ miễn phí tối đa 20 tài khoản (để học sinh luyện tập). Từ tài khoản thứ 21, đăng ký với mức giá trên hệ thống Flashcard - thời gian truy cập là 1 năm (kể từ ngày hệ thống cấp quyền).',
        ],
      } as FlashcardFreeTierBlockConfig,
    },
    {
      id: 'fc-block-pricing',
      type: 'flashcard_pricing_packages',
      title_label: 'Bốn Gói Trả phí Cá nhân',
      is_active: true,
      sort_order: 4,
      config: {
        title: '2. Gói trả phí',
        benefit_text:
          'Quyền lợi: Truy cập trọn bộ flashcard của các chủ đề từ vựng, cụm động từ, từ vựng của đề thi do Huy Tutor biên soạn và đề thi của các trường, sở.',
        packages: [
          {
            id: 'pkg-6m',
            label: 'GÓI 6 THÁNG',
            price: 60000,
            price_text: '60.000đ',
            badge_text: '1 tài khoản cá nhân',
          },
          {
            id: 'pkg-1y',
            label: 'GÓI 1 NĂM',
            price: 100000,
            price_text: '100.000đ',
            badge_text: '1 tài khoản cá nhân',
            is_popular: true,
          },
          {
            id: 'pkg-2y',
            label: 'GÓI 2 NĂM',
            price: 150000,
            price_text: '150.000đ',
            badge_text: '1 tài khoản cá nhân',
          },
          {
            id: 'pkg-3y',
            label: 'GÓI 3 NĂM',
            price: 200000,
            price_text: '200.000đ',
            badge_text: '1 tài khoản cá nhân',
          },
        ],
      } as FlashcardPricingBlockConfig,
    },
    {
      id: 'fc-block-group-pricing',
      type: 'flashcard_group_pricing',
      title_label: 'Bảng giá Quy mô Nhóm & CTA',
      is_active: true,
      sort_order: 5,
      config: {
        columns: ['Gói 1 năm', 'Gói 2 năm', 'Gói 3 năm'],
        tiers: [
          { tier_name: 'Cá nhân', prices: ['100.000 đ', '150.000 đ', '200.000 đ'] },
          { tier_name: 'Nhóm 2-10', prices: ['72.000 đ/tài khoản', '104.000 đ/tài khoản', '140.000 đ/tài khoản'] },
          { tier_name: 'Nhóm 11-50', prices: ['64.000 đ/tài khoản', '92.000 đ/tài khoản', '124.000 đ/tài khoản'] },
          { tier_name: 'Nhóm 51-100', prices: ['56.000 đ/tài khoản', '80.000 đ/tài khoản', '108.000 đ/tài khoản'] },
          { tier_name: 'Trên 100', prices: ['44.000 đ/tài khoản', '64.000 đ/tài khoản', '84.000 đ/tài khoản'] },
        ],
        cta_button_text: 'Đăng ký ngay 1 tài khoản',
        default_price: 100000,
        default_title: 'Flashcard từ vựng - tổng hợp mọi tài liệu',
      } as FlashcardGroupPricingBlockConfig,
    },
    {
      id: 'fc-block-contact',
      type: 'flashcard_contact_notice',
      title_label: 'Hướng dẫn & Kênh Hỗ trợ',
      is_active: true,
      sort_order: 6,
      config: {
        bulk_order_text:
          'Thầy/Cô cần đăng ký trọn bộ hệ thống cho số lượng lớn học sinh vui lòng liên hệ về fanpage hoặc địa chỉ email để nhận báo giá cụ thể.',
        delivery_notice_text:
          'Sau khi đăng ký, Huy Tutor sẽ cấp quyền truy cập và thông báo qua email. Quý Thầy/Cô và các bạn vui lòng kiểm tra mục Hộp thư đến và cả mục Thư rác. Mọi thắc mắc vui lòng gửi về fanpage hoặc email của chúng tôi.',
      } as FlashcardContactNoticeBlockConfig,
    },
  ];
}

// 1. HERO BLOCK COMPONENT
export const FlashcardHeroBlock: React.FC<{
  config: FlashcardHeroBlockConfig;
}> = ({ config }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const ytId = extractYoutubeId(config.youtube_url_or_id);

  return (
    <section className="max-w-[760px] mx-auto px-4 pt-8 pb-8 text-center">
      <h1 className="text-xl sm:text-2xl font-extrabold text-[#e60049] mb-1">
        {config.title || 'Flashcard Huy Tutor'}
      </h1>
      {config.subtitle && (
        <p className="text-[11px] text-gray-600 font-medium mb-5">{config.subtitle}</p>
      )}

      <div className="aspect-video w-full max-w-[560px] mx-auto rounded-sm overflow-hidden bg-gradient-to-br from-[#3b0014] via-[#7a0028] to-[#b3003b] relative flex flex-col items-center justify-center text-white shadow-md border border-gray-200">
        {/* If user clicked play or video_type is active YouTube */}
        {config.video_type === 'youtube' && ytId && isPlaying ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0`}
            title={config.video_title || config.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : config.video_type === 'r2_video' && config.r2_video_url && isPlaying ? (
          <video
            src={config.r2_video_url}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : config.cover_image_url ? (
          <div className="relative w-full h-full cursor-pointer group" onClick={() => setIsPlaying(true)}>
            <img
              src={config.cover_image_url}
              alt={config.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition flex items-center justify-center">
              <div className="w-14 h-10 bg-[#ff0000] rounded-md flex items-center justify-center text-white text-lg font-bold shadow-lg group-hover:scale-110 transition">
                ▶
              </div>
            </div>
          </div>
        ) : (
          /* Polished Custom Video Banner mockup */
          <div
            className="w-full h-full flex flex-col items-center justify-center relative p-4 cursor-pointer group select-none"
            onClick={() => {
              if (ytId || config.r2_video_url) {
                setIsPlaying(true);
              }
            }}
          >
            <div className="absolute top-3 left-3 flex items-center gap-2 text-left">
              <div className="w-6 h-6 rounded-full bg-white p-0.5 border border-white/50 flex items-center justify-center font-bold text-[#e60049] text-[9px]">
                HT
              </div>
              <div>
                <div className="text-[11px] font-bold leading-none">
                  {config.video_title || 'Học từ vựng hiệu quả cùng flashcard của Huy Tutor'}
                </div>
                <div className="text-[9px] text-white/75">Huy Tutor</div>
              </div>
            </div>

            <div className="text-6xl font-black leading-none mb-2">4</div>
            <div className="w-12 h-8 bg-[#ff0000] rounded-md flex items-center justify-center text-white text-sm font-bold shadow mb-2 group-hover:scale-110 transition">
              ▶
            </div>
            <div className="text-lg sm:text-xl font-extrabold tracking-wide uppercase">
              CHẾ ĐỘ LUYỆN TẬP
            </div>

            <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-semibold px-2.5 py-1 rounded-sm">
              Watch on YouTube
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// 2. FEATURES BLOCK COMPONENT
export const FlashcardFeaturesBlock: React.FC<{
  config: FlashcardFeaturesBlockConfig;
  onCtaClick?: () => void;
}> = ({ config, onCtaClick }) => {
  const { demo_card, cta_button, features } = config;

  return (
    <section
      style={{ backgroundColor: config.bg_color || '#e60049' }}
      className="text-white py-9 px-4"
    >
      <div className="max-w-[760px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Cột trái: Demo Flashcard */}
        <div className="md:col-span-6 space-y-2.5">
          {demo_card.image_url ? (
            <div className="rounded-sm overflow-hidden shadow-md border border-white/20 bg-white">
              <img
                src={demo_card.image_url}
                alt="Flashcard demo"
                className="w-full h-auto object-cover"
              />
            </div>
          ) : (
            <div className="bg-white text-gray-800 rounded-sm p-3 shadow-md">
              <div className="text-center font-bold text-[#e60049] text-xs mb-2">
                {demo_card.unit_title || 'Đề 1'}
              </div>
              <div className="border border-gray-200 rounded-sm p-6 text-center bg-gray-50">
                <div className="text-[#e60049] font-extrabold text-sm">
                  {demo_card.word || 'groundbreaking'}
                </div>
                {demo_card.phonetic && (
                  <div className="text-[10px] text-gray-500 mt-0.5">{demo_card.phonetic}</div>
                )}
                {demo_card.meaning && (
                  <div className="text-[10px] text-gray-600 mt-1">{demo_card.meaning}</div>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onCtaClick}
            className="block w-full bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs py-2 rounded-sm text-center transition shadow-sm"
          >
            {cta_button.text || 'Trải nghiệm ngay'}
          </button>
        </div>

        {/* Cột phải: 9+ Tính năng nổi bật */}
        <div className="md:col-span-6">
          <ul className="space-y-1.5 text-[11px] leading-relaxed font-medium">
            {(features || []).map((feat, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-white/80">•</span>
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

// 3. FREE TIER BLOCK COMPONENT
export const FlashcardFreeTierBlock: React.FC<{
  config: FlashcardFreeTierBlockConfig;
}> = ({ config }) => {
  return (
    <section className="space-y-2">
      <h2 className="text-[#e60049] font-extrabold text-sm mb-2">{config.title}</h2>
      <div className="text-[11px] text-gray-700 leading-relaxed space-y-1.5">
        <p>
          <strong>{config.description}</strong>
        </p>
        {config.rules_title && (
          <p className="font-bold text-gray-800 pt-1">{config.rules_title}</p>
        )}
        <ul className="space-y-1 pl-3">
          {(config.rules || []).map((rule, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-[#e60049]">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

// 4. PRICING PACKAGES BLOCK COMPONENT
export const FlashcardPricingBlock: React.FC<{
  config: FlashcardPricingBlockConfig;
  onSelectPackage?: (pkg: FlashcardIndividualPackageItem) => void;
}> = ({ config, onSelectPackage }) => {
  return (
    <section>
      <h2 className="text-[#e60049] font-extrabold text-sm mb-2">{config.title}</h2>
      {config.benefit_text && (
        <p className="text-[11px] text-gray-700 mb-5">
          <strong>Quyền lợi:</strong>{' '}
          <span className="text-[#e60049] font-bold underline">trọn bộ</span>{' '}
          {config.benefit_text.replace(/^Quyền lợi:\s*/i, '').replace(/trọn bộ\s*/i, '')}
        </p>
      )}

      {/* Grid các gói cá nhân */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {(config.packages || []).map((pkg) => (
          <div
            key={pkg.id || pkg.label}
            onClick={() => onSelectPackage && onSelectPackage(pkg)}
            className="text-center cursor-pointer group"
          >
            <div className="bg-[#e60049] p-2.5 rounded-sm shadow-sm group-hover:opacity-95 transition">
              <div className="bg-white rounded-sm p-3 h-32 flex flex-col justify-between items-center relative">
                <span className="text-[8px] font-extrabold text-[#e60049] uppercase">
                  HUY TUTOR
                </span>

                {pkg.cover_image ? (
                  <img
                    src={pkg.cover_image}
                    alt={pkg.label}
                    className="w-20 h-12 object-contain"
                  />
                ) : (
                  <div className="w-20 h-12 bg-gradient-to-r from-[#e60049] to-pink-600 rounded-sm text-white text-[8px] font-bold flex items-center justify-center shadow">
                    Flashcard
                  </div>
                )}

                <div className="w-full bg-[#b30038] text-white text-[9px] font-extrabold py-1 px-1.5 rounded-sm flex items-center justify-between">
                  <span>{pkg.label}</span>
                  <span className="text-[7px] font-normal opacity-90">
                    {pkg.badge_text || '1 tài khoản cá nhân'}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-xs font-extrabold text-[#e60049] mt-2">
              {pkg.price_text || formatVnd(pkg.price)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// 5. GROUP PRICING BLOCK COMPONENT
export const FlashcardGroupPricingBlock: React.FC<{
  config: FlashcardGroupPricingBlockConfig;
  onRegisterGroup?: () => void;
}> = ({ config, onRegisterGroup }) => {
  const { columns, tiers, cta_button_text } = config;

  return (
    <section>
      {/* Bảng giá ma trận */}
      <div className="max-w-[560px] mx-auto overflow-x-auto mb-5">
        <table className="w-full text-[11px] text-center border-collapse border border-[#e60049]/40">
          <thead>
            <tr className="bg-[#e60049] text-white font-bold">
              <th className="border border-[#e60049]/30 py-1.5 px-2">Quy mô nhóm</th>
              {(columns || []).map((col, idx) => (
                <th key={idx} className="border border-[#e60049]/30 py-1.5 px-2">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {(tiers || []).map((tier, rIdx) => (
              <tr
                key={rIdx}
                className={rIdx % 2 === 0 ? 'bg-white' : 'bg-pink-50/40'}
              >
                <td className="border border-pink-200 py-1 px-2 text-left font-medium">
                  {tier.tier_name}
                </td>
                {(tier.prices || []).map((pVal, cIdx) => (
                  <td key={cIdx} className="border border-pink-200 py-1 px-2">
                    {pVal}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center mb-6">
        <button
          type="button"
          onClick={onRegisterGroup}
          className="inline-block bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-8 py-2.5 rounded-sm transition shadow-sm"
        >
          {cta_button_text || 'Đăng ký ngay 1 tài khoản'}
        </button>
      </div>
    </section>
  );
};

// 6. CONTACT & NOTICE BLOCK COMPONENT
export const FlashcardContactNoticeBlock: React.FC<{
  config: FlashcardContactNoticeBlockConfig;
}> = ({ config }) => {
  const { siteConfigs } = useStore();
  const fanpage =
    siteConfigs?.footer_social_links?.find(
      (s) => s.platform.toLowerCase().includes('facebook') || s.label.toLowerCase().includes('facebook')
    )?.url || config.custom_fanpage_url || 'https://facebook.com';

  const email =
    config.custom_email ||
    siteConfigs?.business_info?.email ||
    'huymdcc@gmail.com';

  return (
    <section className="text-[11px] text-gray-700 leading-relaxed space-y-4">
      <p>
        {config.bulk_order_text}{' '}
        <a
          href={fanpage}
          target="_blank"
          rel="noreferrer"
          className="underline font-medium hover:text-[#e60049] text-[#e60049]"
        >
          Huy Tutor - Tài Liệu Tiếng Anh
        </a>{' '}
        hoặc địa chỉ email <span className="underline font-medium">{email}</span> để nhận báo giá cụ thể.
      </p>
      <hr className="border-gray-200" />
      <p>
        {config.delivery_notice_text}{' '}
        <a
          href={fanpage}
          target="_blank"
          rel="noreferrer"
          className="underline font-medium hover:text-[#e60049] text-[#e60049]"
        >
          Huy Tutor - Tài Liệu Tiếng Anh
        </a>{' '}
        hoặc địa chỉ email <span className="underline font-medium">{email}</span>.
      </p>
    </section>
  );
};

// 7. BANNER BLOCK COMPONENT
export const FlashcardBannerBlock: React.FC<{
  config: FlashcardBannerBlockConfig;
}> = ({ config }) => {
  if (!config.banner_url) return null;

  const content = (
    <div className="w-full rounded-sm overflow-hidden shadow-sm">
      <img
        src={config.banner_url}
        alt={config.alt_text || 'Flashcard Banner'}
        className="w-full h-auto object-cover"
      />
    </div>
  );

  if (config.link_url) {
    return (
      <a href={config.link_url} className="block transition hover:opacity-95">
        {content}
      </a>
    );
  }

  return content;
};
