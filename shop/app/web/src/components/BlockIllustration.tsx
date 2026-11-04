import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

interface BlockIllustrationProps {
  type: string;
  className?: string;
  enableZoom?: boolean;
}

// In-memory cache for authorized blob URLs to prevent redundant network fetches
const blobCache = new Map<string, string>();

export const BlockIllustration: React.FC<BlockIllustrationProps> = ({
  type,
  className = 'w-full h-28',
  enableZoom = true,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(blobCache.get(type) || null);
  const [imgError, setImgError] = useState(false);
  const [isLoading, setIsLoading] = useState(!blobCache.has(type));
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (blobCache.has(type)) {
      setImageSrc(blobCache.get(type)!);
      setIsLoading(false);
      setImgError(false);
      return;
    }

    setIsLoading(true);
    setImgError(false);

    // Call secure, role-restricted admin endpoint (/api/admin/block-previews/:type)
    apiClient
      .getBlockPreviewImageUrl(type)
      .then((url) => {
        if (!isMounted) return;
        blobCache.set(type, url);
        setImageSrc(url);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setImgError(true);
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [type]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`rounded border border-gray-200 bg-gray-50 flex items-center justify-center animate-pulse ${className}`}>
        <span className="text-[10px] text-gray-400 font-bold">Đang tải ảnh xem trước...</span>
      </div>
    );
  }

  // Render authorized static image preview from backend
  if (imageSrc && !imgError) {
    return (
      <>
        <div
          className={`relative group cursor-pointer overflow-hidden rounded border border-gray-200 bg-gray-100 flex items-center justify-center ${className}`}
          onClick={() => enableZoom && setIsZoomed(true)}
          title="Nhấn để phóng to xem ảnh thiết kế từ Plan (Chỉ Admin)"
        >
          <img
            src={imageSrc}
            alt={`Ảnh thiết kế khối ${type}`}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top transition duration-200 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition flex items-center justify-center pointer-events-none">
            <span className="opacity-0 group-hover:opacity-100 transition bg-black/75 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
              🔍 Xem phóng to
            </span>
          </div>
        </div>

        {/* Modal phóng to chi tiết khi bấm vào */}
        {isZoomed && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in"
            onClick={() => setIsZoomed(false)}
          >
            <div
              className="bg-white rounded-md p-2 max-w-3xl max-h-[90vh] flex flex-col items-center overflow-hidden shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between pb-2 border-b border-gray-100 px-2">
                <span className="text-xs font-black text-[#e60049] uppercase">
                  Ảnh Minh Họa Thiết Kế Từ Plan: Khối #{type} (Quyền Admin)
                </span>
                <button
                  type="button"
                  onClick={() => setIsZoomed(false)}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="overflow-auto max-h-[80vh] p-2">
                <img
                  src={imageSrc}
                  alt={`Khối ${type}`}
                  className="max-w-full h-auto rounded border border-gray-200 shadow-md"
                />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ==========================================
  // Vector Wireframe Fallback if not authorized or missing
  // ==========================================
  switch (type) {
    case 'hero':
      return (
        <div className={`bg-gradient-to-br from-rose-50 to-pink-100 rounded border border-rose-200 p-2.5 flex items-center justify-between overflow-hidden relative ${className}`}>
          <div className="space-y-1 z-10 max-w-[65%]">
            <div className="w-16 h-1.5 bg-rose-300 rounded-full"></div>
            <div className="w-28 h-3 bg-[#e60049] rounded-sm flex items-center px-1">
              <span className="text-[7px] text-white font-black">THẦY HUY TUTOR</span>
            </div>
            <div className="space-y-0.5 pt-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[7px] text-emerald-600 font-bold">✓</span>
                <div className="w-20 h-1 bg-gray-400 rounded-full"></div>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[7px] text-emerald-600 font-bold">✓</span>
                <div className="w-24 h-1 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full border-2 border-[#e60049] bg-white shadow-sm flex items-center justify-center overflow-hidden">
              <svg className="w-9 h-9 text-[#e60049]/80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
        </div>
      );

    case 'combo_hero':
      return (
        <div className={`bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded border border-red-700 p-2.5 flex items-center justify-between text-white overflow-hidden relative ${className}`}>
          <div className="space-y-1 z-10">
            <span className="text-[7px] uppercase tracking-wider bg-white/20 px-1 py-0.5 rounded font-bold">COMBO THPT ĐẶC BIỆT</span>
            <div className="text-[11px] font-black leading-tight tracking-tight drop-shadow-xs">
              MUA NHIỀU. GIẢM SÂU.<br />
              <span className="text-amber-300">TÍCH ĐIỂM CAO.</span>
            </div>
          </div>
        </div>
      );

    case 'flashcard_hero':
      return (
        <div className={`bg-gray-900 rounded border border-gray-700 p-2 flex flex-col items-center justify-center relative overflow-hidden text-white ${className}`}>
          <div className="w-full h-full bg-gray-800 rounded border border-gray-600 flex flex-col items-center justify-center relative">
            <div className="w-9 h-9 rounded-full bg-[#e60049] flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      );

    case 'campaign_frame':
      return (
        <div className={`bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 rounded border border-red-700 p-2 flex items-center justify-between text-white overflow-hidden relative ${className}`}>
          <div className="space-y-1 z-10">
            <span className="text-[6px] bg-white/20 px-1 py-0.2 rounded font-black uppercase">KHUNG CHIẾN DỊCH</span>
            <div className="text-[8px] font-black">KHUNG ĐÈ SẢN PHẨM & LỄ TẾT</div>
            <div className="w-24 h-1 bg-white/40 rounded-full"></div>
          </div>
          <div className="w-10 h-14 bg-white/30 border border-white rounded-xs flex items-center justify-center text-[5px] font-black relative">
            <div className="absolute top-0 right-0 bg-amber-400 text-red-950 px-0.5 text-[4px] font-black">TẾT</div>
            ẢNH SP
          </div>
        </div>
      );

    default:
      return (
        <div className={`bg-gray-100 rounded border border-dashed border-gray-300 p-2 flex items-center justify-center text-gray-500 text-xs ${className}`}>
          <span>Khối #{type}</span>
        </div>
      );
  }
};
