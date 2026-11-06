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
  if (Array.isArray(existingBlocks) && existingBlocks.length > 0) {
    return [...existingBlocks].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  return [
    {
      id: 'fc-block-hero',
      type: 'flashcard_hero',
      title_label: 'Tiêu đề & Video giới thiệu',
      is_active: true,
      sort_order: 1,
      config: {
        title: '',
        subtitle: '',
        badge_text: '',
        video_type: 'cover_only',
        youtube_url_or_id: '',
        r2_video_url: '',
        cover_image_url: '',
        video_title: '',
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
          unit_title: '',
          word: '',
          phonetic: '',
          meaning: '',
          image_url: '',
        },
        cta_button: {
          text: '',
          action_type: 'buy_package',
          package_price: 0,
          package_title: '',
        },
        features: [],
      } as FlashcardFeaturesBlockConfig,
    },
    {
      id: 'fc-block-free-tier',
      type: 'flashcard_free_tier',
      title_label: 'Chính sách Gói Miễn phí',
      is_active: true,
      sort_order: 3,
      config: {
        title: '',
        description: '',
        rules_title: '',
        rules: [],
      } as FlashcardFreeTierBlockConfig,
    },
    {
      id: 'fc-block-pricing',
      type: 'flashcard_pricing_packages',
      title_label: 'Bốn Gói Trả phí Cá nhân',
      is_active: true,
      sort_order: 4,
      config: {
        title: '',
        benefit_text: '',
        packages: [],
      } as FlashcardPricingBlockConfig,
    },
    {
      id: 'fc-block-group-pricing',
      type: 'flashcard_group_pricing',
      title_label: 'Bảng giá Quy mô Nhóm & CTA',
      is_active: true,
      sort_order: 5,
      config: {
        columns: [],
        tiers: [],
        cta_button_text: '',
        default_price: 0,
        default_title: '',
      } as FlashcardGroupPricingBlockConfig,
    },
    {
      id: 'fc-block-contact',
      type: 'flashcard_contact_notice',
      title_label: 'Hướng dẫn & Kênh Hỗ trợ',
      is_active: true,
      sort_order: 6,
      config: {
        bulk_order_text: '',
        delivery_notice_text: '',
      } as FlashcardContactNoticeBlockConfig,
    },
  ];
}

// 1. HERO BLOCK COMPONENT
export const FlashcardHeroBlock: React.FC<{
  config: FlashcardHeroBlockConfig;
}> = ({ config }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  if (!config) return null;

  const ytId = extractYoutubeId(config.youtube_url_or_id);
  const hasTitle = Boolean(config.title?.trim());
  const hasSubtitle = Boolean(config.subtitle?.trim());
  const hasYoutube = config.video_type === 'youtube' && Boolean(ytId);
  const hasR2Video = config.video_type === 'r2_video' && Boolean(config.r2_video_url?.trim());
  const hasCoverImage = Boolean(config.cover_image_url?.trim());
  const hasMedia = hasYoutube || hasR2Video || hasCoverImage;

  if (!hasTitle && !hasSubtitle && !hasMedia) {
    return null;
  }

  return (
    <section className="max-w-[760px] mx-auto px-4 pt-8 pb-8 text-center">
      {hasTitle && (
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#e60049] mb-1">
          {config.title}
        </h1>
      )}
      {hasSubtitle && (
        <p className="text-[11px] text-gray-600 font-medium mb-5">{config.subtitle}</p>
      )}

      {hasMedia && (
        <div className="aspect-video w-full max-w-[560px] mx-auto rounded-sm overflow-hidden bg-gradient-to-br from-[#3b0014] via-[#7a0028] to-[#b3003b] relative flex flex-col items-center justify-center text-white shadow-md border border-gray-200">
          {hasYoutube && (isPlaying || !hasCoverImage) ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0${isPlaying ? '&autoplay=1' : ''}`}
              title={config.video_title || config.title || ''}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : hasR2Video && (isPlaying || !hasCoverImage) ? (
            <video
              src={config.r2_video_url}
              controls
              autoPlay={isPlaying}
              className="w-full h-full object-cover"
            />
          ) : hasCoverImage ? (
            <div
              className="relative w-full h-full cursor-pointer group"
              onClick={() => {
                if (hasYoutube || hasR2Video) {
                  setIsPlaying(true);
                }
              }}
            >
              <img
                src={config.cover_image_url}
                alt={config.title || ''}
                className="w-full h-full object-contain bg-black/5"
              />
              {(hasYoutube || hasR2Video) && (
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition flex items-center justify-center">
                  <div className="w-14 h-10 bg-[#ff0000] rounded-md flex items-center justify-center text-white text-lg font-bold shadow-lg group-hover:scale-110 transition">
                    ▶
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
};

// 2. FEATURES BLOCK COMPONENT
export const FlashcardFeaturesBlock: React.FC<{
  config: FlashcardFeaturesBlockConfig;
  onCtaClick?: () => void;
}> = ({ config, onCtaClick }) => {
  if (!config) return null;

  const demo_card = config.demo_card || {
    unit_title: '',
    word: '',
    phonetic: '',
    meaning: '',
    image_url: '',
  };
  const cta_button = config.cta_button || {
    text: '',
    action_type: 'buy_package',
  };
  const validFeatures = (config.features || []).filter((f) => f && f.trim().length > 0);

  const hasDemoImage = Boolean(demo_card.image_url?.trim());
  const hasDemoWord = Boolean(
    demo_card.unit_title?.trim() ||
      demo_card.word?.trim() ||
      demo_card.phonetic?.trim() ||
      demo_card.meaning?.trim()
  );
  const hasCta = Boolean(cta_button.text?.trim());
  const hasLeftCol = hasDemoImage || hasDemoWord || hasCta;

  if (!hasLeftCol && validFeatures.length === 0) {
    return null;
  }

  return (
    <section
      style={{ backgroundColor: config.bg_color || '#e60049' }}
      className="text-white py-9 px-4"
    >
      <div className="max-w-[760px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {hasLeftCol && (
          <div className={validFeatures.length > 0 ? 'md:col-span-6 space-y-2.5' : 'md:col-span-12 max-w-md mx-auto w-full space-y-2.5'}>
            {hasDemoImage ? (
              <div className="rounded-sm overflow-hidden shadow-md border border-white/20 bg-white">
                <img
                  src={demo_card.image_url}
                  alt=""
                  className="w-full h-auto object-contain"
                />
              </div>
            ) : hasDemoWord ? (
              <div className="bg-white text-gray-800 rounded-sm p-3 shadow-md">
                {demo_card.unit_title?.trim() && (
                  <div className="text-center font-bold text-[#e60049] text-xs mb-2">
                    {demo_card.unit_title}
                  </div>
                )}
                <div className="border border-gray-200 rounded-sm p-6 text-center bg-gray-50">
                  {demo_card.word?.trim() && (
                    <div className="text-[#e60049] font-extrabold text-sm">
                      {demo_card.word}
                    </div>
                  )}
                  {demo_card.phonetic?.trim() && (
                    <div className="text-[10px] text-gray-500 mt-0.5">{demo_card.phonetic}</div>
                  )}
                  {demo_card.meaning?.trim() && (
                    <div className="text-[10px] text-gray-600 mt-1">{demo_card.meaning}</div>
                  )}
                </div>
              </div>
            ) : null}

            {hasCta && (
              <button
                type="button"
                onClick={onCtaClick}
                className="block w-full bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs py-2 rounded-sm text-center transition shadow-sm"
              >
                {cta_button.text}
              </button>
            )}
          </div>
        )}

        {validFeatures.length > 0 && (
          <div className={hasLeftCol ? 'md:col-span-6' : 'md:col-span-12'}>
            <ul className="space-y-1.5 text-[11px] leading-relaxed font-medium">
              {validFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-white/80">•</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
};

// 3. FREE TIER BLOCK COMPONENT
export const FlashcardFreeTierBlock: React.FC<{
  config: FlashcardFreeTierBlockConfig;
}> = ({ config }) => {
  if (!config) return null;
  const validRules = (config.rules || []).filter((r) => r && r.trim().length > 0);
  if (
    !config.title?.trim() &&
    !config.description?.trim() &&
    !config.rules_title?.trim() &&
    validRules.length === 0
  ) {
    return null;
  }

  return (
    <section className="space-y-2">
      {config.title?.trim() && (
        <h2 className="text-[#e60049] font-extrabold text-sm mb-2">{config.title}</h2>
      )}
      <div className="text-[11px] text-gray-700 leading-relaxed space-y-1.5">
        {config.description?.trim() && (
          <p>
            <strong>{config.description}</strong>
          </p>
        )}
        {config.rules_title?.trim() && (
          <p className="font-bold text-gray-800 pt-1">{config.rules_title}</p>
        )}
        {validRules.length > 0 && (
          <ul className="space-y-1 pl-3">
            {validRules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#e60049]">•</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

// 4. PRICING PACKAGES BLOCK COMPONENT
export const FlashcardPricingBlock: React.FC<{
  config: FlashcardPricingBlockConfig;
  onSelectPackage?: (pkg: FlashcardIndividualPackageItem) => void;
}> = ({ config, onSelectPackage }) => {
  if (!config) return null;
  const validPackages = config.packages || [];
  if (
    !config.title?.trim() &&
    !config.benefit_text?.trim() &&
    validPackages.length === 0
  ) {
    return null;
  }

  return (
    <section>
      {config.title?.trim() && (
        <h2 className="text-[#e60049] font-extrabold text-sm mb-2">{config.title}</h2>
      )}
      {config.benefit_text?.trim() && (
        <p className="text-[11px] text-gray-700 mb-5">{config.benefit_text}</p>
      )}

      {validPackages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {validPackages.map((pkg) => (
            <div
              key={pkg.id || pkg.label}
              onClick={() => onSelectPackage && onSelectPackage(pkg)}
              className="text-center cursor-pointer group"
            >
              <div className="bg-[#e60049] p-2.5 rounded-sm shadow-sm group-hover:opacity-95 transition">
                <div className="bg-white rounded-sm p-3 h-32 flex flex-col justify-between items-center relative">
                  {pkg.cover_image ? (
                    <img
                      src={pkg.cover_image}
                      alt={pkg.label}
                      className="w-20 h-16 object-contain my-auto"
                    />
                  ) : (
                    <div className="w-20 h-12 bg-gradient-to-r from-[#e60049] to-pink-600 rounded-sm text-white text-[8px] font-bold flex items-center justify-center shadow my-auto">
                      {pkg.label}
                    </div>
                  )}

                  <div className="w-full bg-[#b30038] text-white text-[9px] font-extrabold py-1 px-1.5 rounded-sm flex items-center justify-between">
                    <span>{pkg.label}</span>
                    {pkg.badge_text && (
                      <span className="text-[7px] font-normal opacity-90">
                        {pkg.badge_text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-xs font-extrabold text-[#e60049] mt-2">
                {pkg.price_text || formatVnd(pkg.price)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

// 5. GROUP PRICING BLOCK COMPONENT
export const FlashcardGroupPricingBlock: React.FC<{
  config: FlashcardGroupPricingBlockConfig;
  onRegisterGroup?: () => void;
}> = ({ config, onRegisterGroup }) => {
  if (!config) return null;
  const columns = (config.columns || []).filter((c) => c && c.trim().length > 0);
  const tiers = (config.tiers || []).filter((t) => t && t.tier_name?.trim());
  const ctaText = config.cta_button_text?.trim();

  if (columns.length === 0 && tiers.length === 0 && !ctaText) {
    return null;
  }

  return (
    <section>
      {(columns.length > 0 || tiers.length > 0) && (
        <div className="max-w-[560px] mx-auto overflow-x-auto mb-5">
          <table className="w-full text-[11px] text-center border-collapse border border-[#e60049]/40">
            {columns.length > 0 && (
              <thead>
                <tr className="bg-[#e60049] text-white font-bold">
                  <th className="border border-[#e60049]/30 py-1.5 px-2">Quy mô nhóm</th>
                  {columns.map((col, idx) => (
                    <th key={idx} className="border border-[#e60049]/30 py-1.5 px-2">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="text-gray-700">
              {tiers.map((tier, rIdx) => (
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
      )}

      {ctaText && (
        <div className="text-center mb-6">
          <button
            type="button"
            onClick={onRegisterGroup}
            className="inline-block bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-8 py-2.5 rounded-sm transition shadow-sm"
          >
            {ctaText}
          </button>
        </div>
      )}
    </section>
  );
};

// 6. CONTACT & NOTICE BLOCK COMPONENT
export const FlashcardContactNoticeBlock: React.FC<{
  config: FlashcardContactNoticeBlockConfig;
}> = ({ config }) => {
  const { siteConfigs } = useStore();
  if (!config || (!config.bulk_order_text?.trim() && !config.delivery_notice_text?.trim())) {
    return null;
  }

  const fanpage =
    siteConfigs?.footer_social_links?.find(
      (s) => s.platform.toLowerCase().includes('facebook') || s.label.toLowerCase().includes('facebook')
    )?.url || config.custom_fanpage_url || '';

  const email =
    config.custom_email ||
    siteConfigs?.business_info?.email ||
    '';

  return (
    <section className="text-[11px] text-gray-700 leading-relaxed space-y-4">
      {config.bulk_order_text?.trim() && (
        <p>
          {config.bulk_order_text}
          {fanpage && (
            <>
              {' '}
              <a
                href={fanpage}
                target="_blank"
                rel="noreferrer"
                className="underline font-medium hover:text-[#e60049] text-[#e60049]"
              >
                Fanpage
              </a>
            </>
          )}
          {email && (
            <>
              {' '}
              ({email})
            </>
          )}
        </p>
      )}
      {config.bulk_order_text?.trim() && config.delivery_notice_text?.trim() && (
        <hr className="border-gray-200" />
      )}
      {config.delivery_notice_text?.trim() && (
        <p>{config.delivery_notice_text}</p>
      )}
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
        className="w-full h-auto object-contain"
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

