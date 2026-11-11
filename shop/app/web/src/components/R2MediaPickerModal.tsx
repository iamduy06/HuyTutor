import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, MediaItem, MediaFolder } from '../api/client';
import { useStore } from '../context/StoreContext';

export interface R2MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertMedia: (markupOrUrl: string) => void;
  initialFolder?: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] || 'MB'}`;
}

export const R2MediaPickerModal: React.FC<R2MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onInsertMedia,
  initialFolder = 'media-library',
}) => {
  const { showToast } = useStore();
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');

  // Trạng thái Tab Thư viện
  const [items, setItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>(initialFolder);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Trạng thái Tab Tải ảnh
  const [uploadSubfolder, setUploadSubfolder] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tải danh sách ảnh từ R2 qua API
  const fetchMediaList = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.listMedia({
        fileType: 'image',
        folder: selectedFolder && selectedFolder !== 'all' ? selectedFolder : undefined,
        search: searchQuery.trim() || undefined,
        sortBy: 'uploadedAt',
        sortOrder: 'desc',
        page,
        limit: 24,
      });

      setItems(res.items || []);
      setFolders(res.folders || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalItems(res.pagination?.totalItems || 0);
    } catch (err: any) {
      console.error('[R2MediaPickerModal] Lỗi tải thư viện ảnh:', err);
      showToast(err?.message || 'Lỗi khi tải danh sách ảnh từ Cloudflare R2.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolder, searchQuery, page, showToast]);

  useEffect(() => {
    if (isOpen) {
      fetchMediaList();
    } else {
      setSelectedItem(null);
    }
  }, [isOpen, fetchMediaList]);

  if (!isOpen) return null;

  // Xử lý upload file kéo thả / chọn file (Hỗ trợ Windows DnD khi file.type là rỗng)
  const handleUploadFiles = async (files: FileList | File[]) => {
    const isImageFile = (f: File): boolean => {
      if (f.type && f.type.startsWith('image/')) return true;
      return /\.(png|jpe?g|webp|gif|svg|bmp|ico|avif|jfif)$/i.test(f.name);
    };

    const fileArray = Array.from(files).filter(isImageFile);
    if (fileArray.length === 0) {
      showToast('Vui lòng chọn tệp tin hình ảnh hợp lệ (PNG, JPG, WEBP, GIF, SVG, AVIF).');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: fileArray.length });

    try {
      const subfolder = uploadSubfolder.trim() ? uploadSubfolder.trim() : undefined;
      const res = await apiClient.uploadMediaFiles(fileArray, subfolder);

      if (res.uploaded && res.uploaded.length > 0) {
        showToast(`Đã tải lên thành công ${res.uploaded.length} hình ảnh vào kho R2!`);
        setSelectedItem(res.uploaded[0]);
        setActiveTab('library');
        setPage(1);
        await fetchMediaList();
      }
    } catch (err: any) {
      console.error('[R2MediaPickerModal] Upload error:', err);
      showToast(err?.message || 'Lỗi tải ảnh lên Cloudflare R2.');
    } finally {
      setIsUploading(false);
    }
  };

  // Hành động Chèn thẻ <img>
  const handleInsertImgTag = () => {
    if (!selectedItem) return;
    const tag = `<img src="${selectedItem.publicUrl}" alt="" style="max-width: 100%; height: auto;" />`;
    onInsertMedia(tag);
    showToast('Đã chèn thẻ <img> vào mã nguồn HTML!');
    onClose();
  };

  // Hành động Chèn URL CDN
  const handleInsertUrl = () => {
    if (!selectedItem) return;
    onInsertMedia(selectedItem.publicUrl);
    showToast('Đã chèn đường dẫn Cloudflare R2!');
    onClose();
  };

  // Hành động Sao chép link
  const handleCopyLink = () => {
    if (!selectedItem) return;
    navigator.clipboard.writeText(selectedItem.publicUrl);
    showToast('Đã sao chép liên kết ảnh R2 vào clipboard: ' + selectedItem.publicUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-sm shadow-2xl border border-gray-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4 bg-gray-50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-[#e60049] uppercase tracking-wide">
                Kho Ảnh Đa Phương Tiện Cloudflare R2
              </h2>
              <span className="text-[10px] bg-pink-100 text-[#e60049] font-black px-2 py-0.5 rounded-xs">
                {totalItems} ẢNH KHẢ DỤNG
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Chọn ảnh sẵn có trong thư viện hoặc tải ảnh mới để chèn nhanh vào mã nguồn HTML/CSS.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center font-bold text-sm transition"
            title="Đóng modal"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-gray-200 bg-white px-4">
          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'library'
                ? 'border-[#e60049] text-[#e60049]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📚 Thư Viện Ảnh ({totalItems})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'upload'
                ? 'border-[#e60049] text-[#e60049]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📤 Tải Ảnh Nhanh Vào R2
          </button>
        </div>

        {/* Nội dung Tab */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {activeTab === 'library' ? (
            <div className="space-y-4">
              {/* Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 border border-gray-200 rounded-sm">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Thư mục R2:
                  </label>
                  <select
                    value={selectedFolder}
                    onChange={(e) => {
                      setSelectedFolder(e.target.value);
                      setPage(1);
                    }}
                    className="w-full text-xs border border-gray-300 rounded-sm px-2.5 py-1.5 focus:border-[#e60049] outline-none"
                  >
                    <option value="all">-- Tất cả thư mục --</option>
                    {folders.map((f) => (
                      <option key={f.name} value={f.name}>
                        📁 {f.name} ({f.count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Tìm kiếm theo tên ảnh:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Nhập tên tệp cần tìm..."
                      className="w-full text-xs border border-gray-300 rounded-sm pl-8 pr-7 py-1.5 focus:border-[#e60049] outline-none"
                    />
                    <span className="absolute left-2.5 top-1.5 text-gray-400 text-xs">🔍</span>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setPage(1);
                        }}
                        className="absolute right-2 top-1.5 text-xs text-gray-400 hover:text-gray-600 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Lưới Danh sách Ảnh */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                  <div className="w-8 h-8 border-3 border-gray-300 border-t-[#e60049] rounded-full animate-spin mb-2" />
                  <span className="text-xs font-medium">Đang tải danh sách ảnh từ R2...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-sm">
                  <span className="text-3xl block mb-2">🖼️</span>
                  <p className="text-xs font-bold text-gray-700">Không tìm thấy hình ảnh nào</p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Thử chọn thư mục khác, đổi từ khóa tìm kiếm hoặc chuyển sang tab Tải Ảnh Nhanh.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {items.map((item) => {
                    const isSelected = selectedItem?.key === item.key;
                    return (
                      <div
                        key={item.key}
                        onClick={() => setSelectedItem(item)}
                        className={`group relative bg-white border rounded-sm overflow-hidden cursor-pointer transition flex flex-col ${
                          isSelected
                            ? 'border-[#e60049] ring-2 ring-[#e60049]/30 shadow-md'
                            : 'border-gray-200 hover:border-gray-400 hover:shadow-xs'
                        }`}
                      >
                        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
                          <img
                            src={item.publicUrl}
                            alt={item.name}
                            className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#e60049] text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">
                              ✓
                            </div>
                          )}
                        </div>
                        <div className="p-2 flex-1 flex flex-col justify-between">
                          <p
                            className="text-[11px] font-semibold text-gray-800 truncate"
                            title={item.name}
                          >
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 mt-1">
                            <span>{formatBytes(item.size)}</span>
                            <span className="truncate max-w-[60px]" title={item.folder}>
                              {item.folder}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 bg-white p-3 rounded-sm">
                  <span className="text-xs text-gray-600">
                    Trang {page} / {totalPages} (Tổng {totalItems} ảnh)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ← Trước
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Sau →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab 2: Tải Ảnh Nhanh */
            <div className="max-w-xl mx-auto py-6 space-y-4">
              <div className="bg-white p-5 border border-gray-200 rounded-sm shadow-xs space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Thư mục lưu trữ trên R2:
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2.5 py-2 border rounded-sm">
                      media-library/
                    </span>
                    <input
                      type="text"
                      value={uploadSubfolder}
                      onChange={(e) => setUploadSubfolder(e.target.value)}
                      placeholder="subfolder tùy chọn (ví dụ: banners, icons...)"
                      className="flex-1 text-xs border border-gray-300 rounded-sm px-3 py-2 focus:border-[#e60049] outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Tất cả ảnh tải qua modal này được lưu trữ an toàn trong <code>media-library/</code>.
                  </p>
                </div>

                {/* Dropzone Kéo Thả */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files) handleUploadFiles(e.dataTransfer.files);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-[#e60049] hover:bg-pink-50/20 rounded-sm p-8 text-center cursor-pointer transition"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.webp,.svg,.avif,.jfif"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleUploadFiles(e.target.files);
                    }}
                  />
                  <span className="text-4xl block mb-2">☁️</span>
                  <p className="text-sm font-bold text-gray-800">
                    Kéo &amp; thả hình ảnh vào đây, hoặc bấm để chọn tệp
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Hỗ trợ PNG, JPG, WEBP, GIF, SVG, AVIF (Tối đa 50MB/tệp). Tự động đặt tên 12 số <code>YYMMDDHHmmss</code>.
                  </p>
                </div>

                {/* Thanh tiến độ Upload */}
                {isUploading && (
                  <div className="bg-pink-50 border border-pink-200 rounded-sm p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#e60049]">
                      <span>Đang tải ảnh lên Cloudflare R2...</span>
                      <span>
                        {uploadProgress.current} / {uploadProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-pink-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#e60049] h-full transition-all duration-300"
                        style={{
                          width: `${
                            uploadProgress.total > 0
                              ? (uploadProgress.current / uploadProgress.total) * 100
                              : 50
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Thanh Hành động Đáy Modal (Bottom Insertion Bar) khi đã chọn ảnh */}
        <div className="p-3 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          {selectedItem ? (
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <img
                src={selectedItem.publicUrl}
                alt={selectedItem.name}
                className="w-10 h-10 object-cover rounded-xs border border-gray-300"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate" title={selectedItem.name}>
                  {selectedItem.name}
                </p>
                <p className="text-[10px] text-gray-500 truncate">{selectedItem.publicUrl}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">
              Vui lòng nhấp chọn 1 hình ảnh từ danh sách phía trên để thực hiện chèn.
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!selectedItem}
              onClick={handleCopyLink}
              className="px-3 py-1.5 text-xs font-bold border border-gray-300 hover:bg-gray-100 text-gray-700 rounded-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              📋 Sao chép Link
            </button>
            <button
              type="button"
              disabled={!selectedItem}
              onClick={handleInsertUrl}
              className="px-3 py-1.5 text-xs font-bold bg-gray-800 hover:bg-gray-900 text-white rounded-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🔗 Chèn URL CDN
            </button>
            <button
              type="button"
              disabled={!selectedItem}
              onClick={handleInsertImgTag}
              className="px-4 py-1.5 text-xs font-bold bg-[#e60049] hover:bg-[#c4003e] text-white rounded-sm shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ⚡ Chèn thẻ &lt;img&gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default R2MediaPickerModal;
