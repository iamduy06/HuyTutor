import React from 'react';
import { useStore } from '../context/StoreContext';
import {
  AspectRatioMode,
  PresetAspectRatio,
  CampaignFramePreset,
} from '../types';

export interface ProductImageFrameProps {
  src?: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  // Aspect ratio configuration
  ratioMode?: AspectRatioMode;
  presetRatio?: PresetAspectRatio;
  customRatioW?: number;
  customRatioH?: number;
  // Dimension & fit
  maxWidthPx?: number;
  objectFit?: 'cover' | 'contain';
  // Styling
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  showBorder?: boolean;
  borderColor?: string;
  showShadow?: boolean;
  hoverEffect?: boolean;
  // Campaign overlay override
  productId?: string;
  customCampaignFrameUrl?: string;
  disableCampaignFrame?: boolean;
  forcePresetOverlay?: CampaignFramePreset;
  // Fallbacks & extras
  fallbackText?: string;
  badgeText?: string;
  children?: React.ReactNode;
}

/**
 * 4 Khung đè SVG Preset chuẩn hóa (Hi-Res Vector, không mờ vỡ, không cần load ảnh ngoài)
 */
const TetOverlaySvg: React.FC = () => (
  <svg
    viewBox="0 0 600 800"
    className="absolute inset-0 w-full h-full pointer-events-none z-10 select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Góc trên bên trái: Cành hoa mai vàng & hoa đào */}
    <g opacity="0.95">
      <path
        d="M -10 120 C 50 110, 110 70, 140 -10"
        stroke="#78350F"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="14" fill="#F59E0B" />
      <circle cx="50" cy="50" r="7" fill="#DC2626" />
      <circle cx="100" cy="35" r="12" fill="#FBBF24" />
      <circle cx="100" cy="35" r="5" fill="#EF4444" />
      <circle cx="30" cy="95" r="13" fill="#F43F5E" />
      <circle cx="30" cy="95" r="6" fill="#FFFBEB" />
      <circle cx="85" cy="85" r="11" fill="#FBBF24" />
      <circle cx="85" cy="85" r="5" fill="#B91C1C" />
    </g>

    {/* Góc trên bên phải: Dải ruy băng Tết may mắn */}
    <g transform="translate(430, -10)">
      <polygon points="20,0 180,0 180,110 15,110" fill="#DC2626" />
      <polygon points="20,0 35,55 15,110" fill="#991B1B" />
      <rect x="35" y="8" width="135" height="4" fill="#FDE047" />
      <rect x="35" y="96" width="135" height="4" fill="#FDE047" />
      <text
        x="105"
        y="50"
        fill="#FEF08A"
        fontSize="17"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="sans-serif"
        letterSpacing="2"
      >
        TẾT 2026
      </text>
      <text
        x="105"
        y="78"
        fill="#FFFFFF"
        fontSize="12"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        MỪNG XUÂN
      </text>
    </g>

    {/* Viền kim tuyến vàng lượn quanh 4 góc */}
    <rect
      x="10"
      y="10"
      width="580"
      height="780"
      rx="20"
      stroke="#F59E0B"
      strokeWidth="2.5"
      strokeDasharray="14 10"
      opacity="0.8"
    />

    {/* Góc dưới: Nơ và thỏi vàng may mắn */}
    <g transform="translate(240, 740)">
      <rect x="0" y="5" width="120" height="28" rx="14" fill="#DC2626" />
      <rect x="2" y="7" width="116" height="24" rx="12" stroke="#FDE047" strokeWidth="1.5" />
      <text
        x="60"
        y="24"
        fill="#FEF08A"
        fontSize="12"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        LÌ XÌ MAY MẮN
      </text>
    </g>
  </svg>
);

const SaleOverlaySvg: React.FC = () => (
  <svg
    viewBox="0 0 600 800"
    className="absolute inset-0 w-full h-full pointer-events-none z-10 select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Viền Neon phát sáng đỏ - cam */}
    <rect
      x="8"
      y="8"
      width="584"
      height="784"
      rx="22"
      stroke="#FF0055"
      strokeWidth="3.5"
      opacity="0.9"
    />

    {/* Nhãn HOT DEAL góc trên bên phải */}
    <g transform="translate(430, -5)">
      <path d="M 0 0 L 175 0 L 175 110 L 25 110 Z" fill="#E11D48" />
      <rect x="15" y="8" width="150" height="92" stroke="#FEF08A" strokeWidth="2" strokeDasharray="6 4" />
      <text
        x="95"
        y="42"
        fill="#FFFFFF"
        fontSize="16"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="sans-serif"
        letterSpacing="1"
      >
        HOT DEAL
      </text>
      <text
        x="95"
        y="82"
        fill="#FEF08A"
        fontSize="28"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        -25%
      </text>
    </g>

    {/* Dải chân viền FLASH SALE */}
    <g transform="translate(160, 750)">
      <rect x="0" y="0" width="280" height="34" rx="8" fill="#FF0055" />
      <text
        x="140"
        y="23"
        fill="#FFFFFF"
        fontSize="14"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="sans-serif"
        letterSpacing="2"
      >
        ⚡ SIÊU KHUYẾN MÃI
      </text>
    </g>
  </svg>
);

const ExamOverlaySvg: React.FC = () => (
  <svg
    viewBox="0 0 600 800"
    className="absolute inset-0 w-full h-full pointer-events-none z-10 select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Viền xanh học thuật & vàng danh dự */}
    <rect
      x="8"
      y="8"
      width="584"
      height="784"
      rx="22"
      stroke="#2563EB"
      strokeWidth="3"
      opacity="0.85"
    />

    {/* Góc trên bên phải: Huy hiệu cúp vàng & ma trận 2026 */}
    <g transform="translate(420, 10)">
      <rect x="0" y="0" width="165" height="60" rx="10" fill="#1E40AF" />
      <rect x="3" y="3" width="159" height="54" rx="8" stroke="#FDE047" strokeWidth="1.5" />
      <text
        x="82"
        y="26"
        fill="#FDE047"
        fontSize="13"
        fontWeight="900"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        ★ BỨT PHÁ ĐIỂM 9+ ★
      </text>
      <text
        x="82"
        y="47"
        fill="#FFFFFF"
        fontSize="11"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        CHUẨN FORM 2026
      </text>
    </g>

    {/* Góc dưới bên trái: Cúp vinh quang mini */}
    <g transform="translate(20, 735)">
      <rect x="0" y="0" width="150" height="36" rx="8" fill="#2563EB" />
      <text
        x="75"
        y="23"
        fill="#FFFFFF"
        fontSize="12"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        🏆 BẢN QUYỀN HUY TUTOR
      </text>
    </g>
  </svg>
);

const ChristmasOverlaySvg: React.FC = () => (
  <svg
    viewBox="0 0 600 800"
    className="absolute inset-0 w-full h-full pointer-events-none z-10 select-none"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Viền đỏ - xanh Giáng Sinh */}
    <rect
      x="8"
      y="8"
      width="584"
      height="784"
      rx="22"
      stroke="#15803D"
      strokeWidth="3"
      strokeDasharray="20 10"
      opacity="0.85"
    />

    {/* Bông tuyết trắng nhẹ rơi */}
    <g opacity="0.85">
      <circle cx="80" cy="120" r="4" fill="#FFFFFF" />
      <circle cx="520" cy="200" r="5" fill="#FFFFFF" />
      <circle cx="120" cy="400" r="3" fill="#FFFFFF" />
      <circle cx="480" cy="550" r="4" fill="#FFFFFF" />
      <circle cx="70" cy="650" r="5" fill="#FFFFFF" />
    </g>

    {/* Cành thông & chuông vàng góc trên trái */}
    <g transform="translate(10, 10)">
      <path d="M 0 0 L 80 0 L 0 80 Z" fill="#166534" opacity="0.9" />
      <circle cx="35" cy="35" r="12" fill="#EAB308" />
      <circle cx="35" cy="35" r="6" fill="#DC2626" />
    </g>

    {/* Nơ Giáng sinh góc trên phải */}
    <g transform="translate(440, 10)">
      <rect x="0" y="0" width="145" height="50" rx="10" fill="#DC2626" />
      <text
        x="72"
        y="31"
        fill="#FFFFFF"
        fontSize="13"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        ❄️ XMAS SALE
      </text>
    </g>
  </svg>
);

export const ProductImageFrame: React.FC<ProductImageFrameProps> = ({
  src,
  alt = 'Sản phẩm',
  className = '',
  imageClassName = '',
  ratioMode = 'preset',
  presetRatio = '3:4',
  customRatioW,
  customRatioH,
  maxWidthPx,
  objectFit = 'cover',
  rounded = '2xl',
  showBorder = true,
  borderColor = 'border-gray-200',
  showShadow = true,
  hoverEffect = true,
  productId,
  customCampaignFrameUrl,
  disableCampaignFrame = false,
  forcePresetOverlay,
  fallbackText = 'Tài liệu',
  badgeText,
  children,
}) => {
  const { siteConfigs } = useStore();
  const campaignConfig = siteConfigs?.campaign_frame;

  // 1. Tính toán Aspect Ratio CSS
  let computedAspectRatio: string | undefined = undefined;
  if (ratioMode === 'auto') {
    computedAspectRatio = 'auto';
  } else if (ratioMode === 'custom' && customRatioW && customRatioH && customRatioW > 0 && customRatioH > 0) {
    computedAspectRatio = `${customRatioW} / ${customRatioH}`;
  } else {
    // Preset
    switch (presetRatio) {
      case '4:3':
        computedAspectRatio = '4 / 3';
        break;
      case '1:1':
        computedAspectRatio = '1 / 1';
        break;
      case '16:9':
        computedAspectRatio = '16 / 9';
        break;
      case '3:1':
        computedAspectRatio = '3 / 1';
        break;
      case '1:1.414':
        computedAspectRatio = '1 / 1.414';
        break;
      case '3:4':
      default:
        computedAspectRatio = '3 / 4';
        break;
    }
  }

  // 2. Tính toán bo góc
  const roundedMap: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
    full: 'rounded-full',
  };
  const roundedClass = roundedMap[rounded] || 'rounded-2xl';

  // 3. Kiểm tra xem có hiển thị Khung Đè Chiến Dịch (Campaign Frame Overlay) không
  let isOverlayActive = false;
  let overlayType: 'preset' | 'custom_url' | null = null;
  let activePreset: CampaignFramePreset = 'tet';
  let customOverlayUrl: string | undefined = undefined;

  if (forcePresetOverlay) {
    isOverlayActive = true;
    overlayType = 'preset';
    activePreset = forcePresetOverlay;
  } else if (!disableCampaignFrame && customCampaignFrameUrl) {
    isOverlayActive = true;
    overlayType = 'custom_url';
    customOverlayUrl = customCampaignFrameUrl;
  } else if (!disableCampaignFrame && campaignConfig?.is_enabled) {
    const isGlobal = campaignConfig.scope !== 'specific';
    const isTargeted =
      campaignConfig.scope === 'specific' &&
      productId &&
      Array.isArray(campaignConfig.applied_product_ids) &&
      campaignConfig.applied_product_ids.includes(productId);

    if (isGlobal || isTargeted) {
      isOverlayActive = true;
      if (campaignConfig.frame_type === 'custom' && campaignConfig.custom_frame_url) {
        overlayType = 'custom_url';
        customOverlayUrl = campaignConfig.custom_frame_url;
      } else {
        overlayType = 'preset';
        activePreset = campaignConfig.preset_name || 'tet';
      }
    }
  }

  // Render Overlay
  const renderOverlay = () => {
    if (!isOverlayActive) return null;
    if (overlayType === 'custom_url' && customOverlayUrl) {
      return (
        <img
          src={customOverlayUrl}
          alt="Campaign Overlay Frame"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10 select-none block"
          loading="lazy"
        />
      );
    }
    switch (activePreset) {
      case 'sale':
        return <SaleOverlaySvg />;
      case 'exam':
        return <ExamOverlaySvg />;
      case 'christmas':
        return <ChristmasOverlaySvg />;
      case 'tet':
      default:
        return <TetOverlaySvg />;
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-white ${roundedClass} ${
        showBorder ? `border ${borderColor}` : ''
      } ${
        showShadow ? 'shadow-md' : ''
      } ${
        hoverEffect ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg' : ''
      } ${className}`}
      style={{
        aspectRatio: computedAspectRatio,
        maxWidth: maxWidthPx ? `${maxWidthPx}px` : undefined,
      }}
    >
      {/* Badge đè nếu có */}
      {badgeText && (
        <span className="absolute top-2.5 right-2.5 z-20 bg-[#e60049] text-white text-[10px] font-bold px-2 py-0.5 rounded-xs shadow-xs pointer-events-none">
          {badgeText}
        </span>
      )}

      {/* Lớp 1: Ảnh gốc sản phẩm */}
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full block ${
            objectFit === 'contain' ? 'object-contain' : 'object-cover'
          } ${imageClassName}`}
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full min-h-[140px] bg-gray-50 flex flex-col items-center justify-center p-3 text-center text-gray-400">
          <svg className="w-8 h-8 mb-1 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[11px] font-medium">{fallbackText}</span>
        </div>
      )}

      {/* Lớp 2: Khung Đè Chiến Dịch (Campaign Overlay) */}
      {renderOverlay()}

      {/* Các thành phần bổ sung truyền vào children */}
      {children}
    </div>
  );
};

