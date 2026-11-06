import React, { useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';

// Cấu hình worker cho pdfjs-dist
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export interface R2MultiImageUploaderProps {
  label?: string;
  helperText?: string;
  images: string[];
  onImagesChange: (newImages: string[]) => void;
  folder?: string;
  pageLevel1?: string;
  pageLevel2?: string;
  aspectRatioHint?: string;
  className?: string;
}

/**
 * Hàm phân tích file PDF và tự động render toàn bộ các trang sang File ảnh WebP độ nét cao
 */
const convertPdfFileToImages = async (
  pdfFile: File,
  onPageProgress: (current: number, total: number) => void
): Promise<File[]> => {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true,
  });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const imageFiles: File[] = [];

  const baseName = pdfFile.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_\-]/g, '_');

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    onPageProgress(pageNum, numPages);
    const page = await pdfDoc.getPage(pageNum);

    // Scale 2.0 đảm bảo độ phân giải A4 siêu nét (~1600 x 2260px)
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.92);
    });

    if (blob) {
      const pageIndexStr = String(pageNum).padStart(2, '0');
      const pageFile = new File([blob], `${baseName}_trang_${pageIndexStr}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
      });
      imageFiles.push(pageFile);
    }
  }

  return imageFiles;
};

export const R2MultiImageUploader: React.FC<R2MultiImageUploaderProps> = ({
  label,
  helperText,
  images = [],
  onImagesChange,
  folder = 'samples/pages',
  pageLevel1,
  pageLevel2,
  aspectRatioHint = 'Khổ A4 dọc tỉ lệ 1:1.414',
  className = '',
}) => {
  const { showToast } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [pdfRenderingStatus, setPdfRenderingStatus] = useState<{
    fileName: string;
    current: number;
    total: number;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    percent: number;
  } | null>(null);
  const [isDeletingUrl, setIsDeletingUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Xử lý tải lên nhiều file cùng một lúc (hỗ trợ cả File PDF tự động render & File ảnh)
  const uploadFiles = async (fileList: FileList | File[]) => {
    const rawList = Array.from(fileList);
    const pdfFiles = rawList.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    const imageFiles = rawList.filter(
      (f) => f.type.startsWith('image/') && !f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0 && imageFiles.length === 0) {
      showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP...) hoặc file PDF.');
      return;
    }

    setIsUploading(true);
    const allImagesToUpload: File[] = [...imageFiles];

    // 1. Nếu có file PDF, tự động phân tích & render toàn bộ trang sang ảnh WebP độ nét cao
    if (pdfFiles.length > 0) {
      for (let pIdx = 0; pIdx < pdfFiles.length; pIdx++) {
        const pdfFile = pdfFiles[pIdx];
        setPdfRenderingStatus({
          fileName: pdfFile.name,
          current: 0,
          total: 0,
        });

        try {
          const renderedPages = await convertPdfFileToImages(pdfFile, (curr, total) => {
            setPdfRenderingStatus({
              fileName: pdfFile.name,
              current: curr,
              total,
            });
          });
          allImagesToUpload.push(...renderedPages);
          showToast(`Đã render ${renderedPages.length} trang từ file PDF "${pdfFile.name}"!`);
        } catch (err: any) {
          console.error(`Lỗi render file PDF ${pdfFile.name}:`, err);
          showToast(`Lỗi render file PDF "${pdfFile.name}": ${err?.message || 'Không thể đọc PDF'}`);
        }
      }
      setPdfRenderingStatus(null);
    }

    if (allImagesToUpload.length === 0) {
      setIsUploading(false);
      return;
    }

    // 2. Tự động sắp xếp tự nhiên theo tên file chuẩn Windows Explorer (1, 2, ..., 9, 10, A-Z)
    const files = [...allImagesToUpload].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );

    setUploadProgress({ current: 0, total: files.length, percent: 0 });
    const newUrls: string[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await apiClient.uploadFile(file, {
          folder,
          pageLevel1,
          pageLevel2,
        });
        newUrls.push(res.url);
        successCount++;
      } catch (err: any) {
        console.error(`Lỗi tải file ${file.name}:`, err);
        failCount++;
      }
      const current = i + 1;
      setUploadProgress({
        current,
        total: files.length,
        percent: Math.round((current / files.length) * 100),
      });
    }

    if (newUrls.length > 0) {
      onImagesChange([...images, ...newUrls]);
    }

    setIsUploading(false);
    setUploadProgress(null);

    if (failCount === 0) {
      showToast(`Đã tải thành công ${successCount} trang ảnh lên Cloudflare R2!`);
    } else {
      showToast(
        `Đã tải lên ${successCount} trang thành công (${failCount} trang thất bại, vui lòng thử lại).`
      );
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  // Xóa vĩnh viễn 1 ảnh trên Cloudflare R2 (Tuân thủ Quy chuẩn 2 trong GEMINI.md)
  const handleDeleteImage = async (url: string, index: number) => {
    setIsDeletingUrl(url);
    try {
      await apiClient.deleteR2File(url);
      const next = images.filter((_, idx) => idx !== index);
      onImagesChange(next);
      showToast(`Đã xóa vĩnh viễn trang ${index + 1} khỏi Cloudflare R2.`);
    } catch (err: any) {
      console.warn('Lỗi xóa file trên R2, gỡ khỏi danh sách:', err);
      const next = images.filter((_, idx) => idx !== index);
      onImagesChange(next);
      showToast(`Đã gỡ trang ${index + 1} khỏi danh sách.`);
    } finally {
      setIsDeletingUrl(null);
    }
  };

  // Di chuyển thứ tự trang
  const handleMovePage = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const next = [...images];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onImagesChange(next);
  };

  // Đảo ngược toàn bộ thứ tự trang (1 ⇄ N)
  const handleReverseOrder = () => {
    if (images.length <= 1) return;
    onImagesChange([...images].reverse());
    showToast('Đã đảo ngược thứ tự các trang ảnh.');
  };

  // Xóa toàn bộ ảnh
  const handleDeleteAll = async () => {
    if (images.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tất cả ${images.length} trang ảnh khỏi Cloudflare R2?`)) {
      return;
    }

    setIsUploading(true);
    for (const u of images) {
      if (u) {
        apiClient.deleteR2File(u).catch(() => {});
      }
    }
    onImagesChange([]);
    setIsUploading(false);
    showToast('Đã xóa toàn bộ các trang ảnh.');
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Tiêu đề & Gợi ý */}
      {(label || helperText) && (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          {label && (
            <label className="block text-xs font-bold text-gray-800">
              {label}{' '}
              {aspectRatioHint && (
                <span className="text-gray-400 font-normal">({aspectRatioHint})</span>
              )}
            </label>
          )}
          {helperText && <span className="text-[11px] text-gray-500">{helperText}</span>}
        </div>
      )}

      {/* Khu vực Dropzone Kéo Thả / Bấm Chọn File PDF hoặc Nhiều Ảnh Cùng Lúc */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-md p-5 text-center cursor-pointer transition ${
          isDragging
            ? 'border-[#e60049] bg-pink-50/70 scale-[1.005]'
            : 'border-gray-300 hover:border-[#e60049] bg-gray-50/50 hover:bg-gray-50'
        } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-2.5 py-2">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#e60049]">
              <svg className="animate-spin h-5 w-5 text-[#e60049]" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>
                {pdfRenderingStatus
                  ? `Đang tự động render file PDF "${pdfRenderingStatus.fileName}": Trang ${pdfRenderingStatus.current}/${pdfRenderingStatus.total}...`
                  : `Đang tải lên Cloudflare R2 (${uploadProgress?.current}/${uploadProgress?.total} trang - ${uploadProgress?.percent}%)...`}
              </span>
            </div>

            {uploadProgress && (
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#e60049] h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress.percent}%` }}
                />
              </div>
            )}
            <p className="text-[11px] text-gray-500">
              Vui lòng giữ nguyên trang đến khi hoàn tất tải lên.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 py-1">
            <div className="flex justify-center text-gray-400">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div className="text-xs font-bold text-gray-700">
              Kéo thả <span className="text-[#e60049] font-black">file PDF</span> hoặc các ảnh vào đây, hoặc{' '}
              <span className="text-[#e60049] underline font-bold">bấm để chọn file PDF/Ảnh</span>
            </div>
            <p className="text-[11px] text-gray-500">
              🔥 Hỗ trợ file PDF (tự động render toàn bộ trang sang ảnh A4 độ nét cao) hoặc chọn nhiều ảnh (PNG, JPG, WEBP).
            </p>
          </div>
        )}
      </div>

      {/* Thanh công cụ quản lý khi đã có ảnh */}
      {images.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-b border-gray-100 pb-2">
          <div className="text-xs font-bold text-gray-800 flex items-center gap-2">
            <span>Danh sách đã tải ({images.length} trang A4):</span>
            <span className="text-[10px] bg-pink-100 text-[#e60049] px-2 py-0.5 rounded-xs font-extrabold">
              Đúng chuẩn R2
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReverseOrder}
              title="Đảo ngược thứ tự các trang ảnh hiện có"
              className="text-[11px] font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 px-2.5 py-1 rounded-xs transition cursor-pointer flex items-center gap-1"
            >
              <span>⇄ Đảo ngược thứ tự</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-bold text-[#e60049] bg-pink-50 hover:bg-pink-100 border border-pink-200 px-2.5 py-1 rounded-xs transition cursor-pointer"
            >
              + Chọn thêm file PDF / Ảnh
            </button>
            <button
              type="button"
              onClick={handleDeleteAll}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 px-2.5 py-1 rounded-xs transition cursor-pointer"
            >
              Xóa tất cả ({images.length})
            </button>
          </div>
        </div>
      )}

      {/* Grid Danh Sách Ảnh Đọc Thử A4 Đã Tải Lên */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
          {images.map((url, idx) => (
            <div
              key={`${url}-${idx}`}
              className="relative bg-white border border-gray-200 rounded-sm p-1.5 shadow-2xs group hover:border-[#e60049] transition"
            >
              {/* Badge số trang góc trên bên trái */}
              <span className="absolute top-2 left-2 z-10 bg-black/75 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-2xs pointer-events-none">
                Trang {idx + 1}
              </span>

              {/* Nút Xóa ảnh góc trên bên phải (Tuân thủ Quy chuẩn 2: Dấu X màu đỏ hình tròn) */}
              <button
                type="button"
                title={`Xóa vĩnh viễn trang ${idx + 1} khỏi Cloudflare R2`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteImage(url, idx);
                }}
                disabled={isDeletingUrl === url}
                className="absolute -top-2.5 -right-2.5 z-20 w-6 h-6 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 border-white transition cursor-pointer disabled:opacity-50"
              >
                {isDeletingUrl === url ? '…' : '✕'}
              </button>

              {/* Thumbnail ảnh A4 */}
              <div className="w-full aspect-[1/1.414] bg-gray-50 rounded-xs overflow-hidden flex items-center justify-center border border-gray-100">
                <img
                  src={url}
                  alt={`Trang đọc thử ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Thanh điều khiển thứ tự trang (Di chuyển Trước / Sau) */}
              <div className="flex items-center justify-between gap-1 mt-1.5 pt-1 border-t border-gray-100 text-[10px]">
                <button
                  type="button"
                  title="Di chuyển lên trước"
                  disabled={idx === 0}
                  onClick={() => handleMovePage(idx, 'prev')}
                  className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-2xs font-bold text-gray-700 transition"
                >
                  ◀
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-[#e60049] truncate max-w-[60px] text-center underline font-medium"
                  title="Mở ảnh gốc trong tab mới"
                >
                  Xem ảnh
                </a>
                <button
                  type="button"
                  title="Di chuyển ra sau"
                  disabled={idx === images.length - 1}
                  onClick={() => handleMovePage(idx, 'next')}
                  className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-2xs font-bold text-gray-700 transition"
                >
                  ▶
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
