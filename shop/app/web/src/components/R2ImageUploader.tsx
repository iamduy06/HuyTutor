import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';

export interface R2ImageUploaderProps {
  label?: string;
  helperText?: string;
  imageUrl?: string;
  onUrlChange: (newUrl: string) => void;
  folder?: string;
  pageLevel1?: string;
  pageLevel2?: string;
  aspectRatioHint?: string;
  maxPreviewHeight?: string;
  fitMode?: 'contain' | 'cover';
  className?: string;
}

export const R2ImageUploader: React.FC<R2ImageUploaderProps> = ({
  label,
  helperText,
  imageUrl,
  onUrlChange,
  folder = 'general',
  pageLevel1,
  pageLevel2,
  aspectRatioHint,
  maxPreviewHeight = 'max-h-36',
  fitMode = 'contain',
  className = '',
}) => {
  const { showToast } = useStore();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const oldUrl = imageUrl;
      const res = await apiClient.uploadFile(file, {
        folder,
        pageLevel1,
        pageLevel2,
      });

      // Nếu đang thay thế ảnh cũ, tự động xóa ảnh cũ khỏi R2
      if (oldUrl && oldUrl !== res.url) {
        apiClient.deleteR2File(oldUrl).catch((err) => {
          console.warn('Lỗi xóa file R2 cũ:', err);
        });
      }

      onUrlChange(res.url);
      showToast('Tải ảnh lên Cloudflare R2 thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải ảnh lên R2.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteImage = async () => {
    if (!imageUrl) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteR2File(imageUrl);
      onUrlChange('');
      showToast('Đã xóa vĩnh viễn hình ảnh khỏi Cloudflare R2.');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi xóa file trên R2. Đã bỏ liên kết ảnh.');
      onUrlChange('');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-gray-800">
          {label} {aspectRatioHint && <span className="text-gray-400 font-normal">({aspectRatioHint})</span>}
        </label>
      )}

      {imageUrl ? (
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Preview Container với Nút X ở góc trên bên phải */}
          <div className="relative inline-block border border-gray-200 rounded-md p-2 bg-gray-50 shadow-xs group">
            {/* Nút X xoá ảnh ở góc trên bên phải */}
            <button
              type="button"
              title="Xóa hình ảnh này khỏi Cloudflare R2"
              onClick={handleDeleteImage}
              disabled={isDeleting}
              className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 border-white transition cursor-pointer"
            >
              {isDeleting ? '...' : '✕'}
            </button>

            <img
              src={imageUrl}
              alt="Preview R2"
              className={`rounded ${fitMode === 'cover' ? 'object-cover' : 'object-contain'} ${maxPreviewHeight} max-w-full block bg-white`}
            />

            <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] text-gray-500 px-0.5">
              <span className="font-mono truncate max-w-[180px]" title={imageUrl}>
                {imageUrl.split('/').pop()}
              </span>
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#e60049] hover:underline font-bold shrink-0"
              >
                Mở link ↗
              </a>
            </div>
          </div>

          {/* Nút thay đổi ảnh khác */}
          <div className="flex flex-col gap-1.5 text-xs">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:border-[#e60049] text-gray-700 font-bold rounded-sm cursor-pointer shadow-2xs transition">
              <span>🔄 Thay ảnh khác</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={isUploading || isDeleting}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-gray-400">
              Hệ thống tự động xóa file cũ khi thay ảnh mới.
            </span>
          </div>
        </div>
      ) : (
        /* Khi chưa có ảnh: Nút tải ảnh lên R2 */
        <div className="flex flex-wrap items-center gap-3">
          <label
            className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 hover:border-[#e60049] rounded-md text-xs font-bold text-gray-700 hover:text-[#e60049] cursor-pointer transition bg-gray-50/50 hover:bg-pink-50/30 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? (
              <span className="flex items-center gap-1.5 text-[#e60049]">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Đang tải lên Cloudflare R2...
              </span>
            ) : (
              <span>📤 Chọn ảnh tải lên Cloudflare R2</span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
            />
          </label>
          {aspectRatioHint && (
            <span className="text-[11px] text-gray-500">Khuyến nghị: {aspectRatioHint}</span>
          )}
        </div>
      )}

      {helperText && <p className="text-[11px] text-gray-400 mt-1">{helperText}</p>}
    </div>
  );
};
