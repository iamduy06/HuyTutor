import React, { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, MediaItem, MediaFolder, MediaUsage } from '../api/client';
import { useStore } from '../context/StoreContext';

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i] || 'MB'}`;
}

function formatVietnamDateTime(isoString: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return isoString;
  }
}

export const AdminMediaManager: React.FC = () => {
  const { showToast } = useStore();

  // Dữ liệu danh sách & Phân trang
  const [items, setItems] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    totalItems: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Bộ lọc, Tìm kiếm & Sắp xếp
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [filterFileType, setFilterFileType] = useState<'all' | 'image' | 'pdf' | 'other'>('all');
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'uploadedAt' | 'modifiedAt' | 'name' | 'size'>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Thao tác hàng loạt (Multi-select)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Modal Upload Tệp tin
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [uploadSubfolder, setUploadSubfolder] = useState<string>('');
  const [uploadQueue, setUploadQueue] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Lightbox Preview
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  // Modal Xóa an toàn kèm Quét tham chiếu (Check-Usage Safe Deletion)
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    keys: string[];
    isChecking: boolean;
    isDeleting: boolean;
    inUse: boolean;
    usages: MediaUsage[];
    checkError?: string;
  }>({
    isOpen: false,
    keys: [],
    isChecking: false,
    isDeleting: false,
    inUse: false,
    usages: [],
    checkError: undefined,
  });

  // Debounce tìm kiếm
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchInput.trim());
      setPagination((p) => ({ ...p, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Tải danh sách tệp từ API
  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.listMedia({
        folder: filterFolder !== 'all' ? filterFolder : undefined,
        fileType: filterFileType !== 'all' ? filterFileType : undefined,
        search: activeSearch || undefined,
        sortBy,
        sortOrder,
        page: pagination.page,
        limit: pagination.limit,
      });

      setItems(res.items || []);
      setFolders(res.folders || []);
      setPagination({
        page: res.pagination?.page || 1,
        limit: res.pagination?.limit || pagination.limit,
        totalItems: res.pagination?.totalItems || 0,
        totalPages: res.pagination?.totalPages || 1,
      });
    } catch (err: any) {
      console.error('[AdminMediaManager] Lỗi tải media:', err);
      showToast('Lỗi khi tải danh sách Media R2: ' + (err?.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [filterFolder, filterFileType, activeSearch, sortBy, sortOrder, pagination.page, pagination.limit, showToast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Chọn / Bỏ chọn từng tệp tin
  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Chọn tất cả / Bỏ chọn tất cả trang hiện tại
  const toggleSelectAllCurrentPage = () => {
    const currentKeys = items.map((i) => i.key);
    const isAllSelected = currentKeys.length > 0 && currentKeys.every((k) => selectedKeys.has(k));
    if (isAllSelected) {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        for (const k of currentKeys) next.delete(k);
        return next;
      });
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        for (const k of currentKeys) next.add(k);
        return next;
      });
    }
  };

  // Sao chép Link CDN vào Clipboard (bảo vệ lỗi từ chối quyền Clipboard)
  const handleCopyLink = async (url: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        showToast('Đã sao chép link CDN: ' + url);
      } else {
        throw new Error('Trình duyệt không hỗ trợ Clipboard API');
      }
    } catch (err: any) {
      console.warn('[AdminMediaManager] Lỗi sao chép:', err);
      showToast('Không thể sao chép vào clipboard: ' + (err?.message || String(err)));
    }
  };

  // Thực hiện quét kiểm tra tham chiếu media (Hỗ trợ gọi lần đầu & Thử lại)
  const performCheckUsage = async (keys: string[]) => {
    setDeleteModal((prev) => ({
      ...prev,
      isChecking: true,
      checkError: undefined,
    }));

    try {
      const res = await apiClient.checkMediaUsage(keys);
      setDeleteModal((prev) => ({
        ...prev,
        isChecking: false,
        inUse: res.inUse,
        usages: res.usages || [],
        checkError: undefined,
      }));
    } catch (err: any) {
      console.error('[AdminMediaManager] Lỗi kiểm tra tham chiếu:', err);
      const errMsg = err?.message || String(err);
      showToast('Lỗi khi kiểm tra tham chiếu media: ' + errMsg);
      setDeleteModal((prev) => ({
        ...prev,
        isChecking: false,
        checkError: errMsg,
      }));
    }
  };

  // Bắt đầu quy trình Xóa an toàn (Kiểm tra tham chiếu)
  const initiateDelete = (keys: string[]) => {
    if (keys.length === 0) return;
    setDeleteModal({
      isOpen: true,
      keys,
      isChecking: true,
      isDeleting: false,
      inUse: false,
      usages: [],
      checkError: undefined,
    });
    performCheckUsage(keys);
  };

  // Thử kiểm tra lại tham chiếu khi gặp lỗi
  const handleRetryCheckUsage = () => {
    if (deleteModal.keys.length > 0 && !deleteModal.isChecking && !deleteModal.isDeleting) {
      performCheckUsage(deleteModal.keys);
    }
  };

  // Xác nhận Xóa vĩnh viễn trên R2
  const handleConfirmDelete = async () => {
    setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await apiClient.deleteMediaFiles(deleteModal.keys);
      if (res.errors && res.errors.length > 0) {
        showToast(
          `Xóa một phần: Đã xóa ${res.deletedKeys.length} tệp, thất bại ${res.errors.length} tệp: ${res.errors
            .map((e) => `${e.key}: ${e.error}`)
            .join('; ')}`
        );
      } else {
        showToast(
          res.message ||
            `Đã xóa thành công ${res.deletedKeys.length} tệp tin vĩnh viễn trên Cloudflare R2 bucket!`
        );
      }

      // Xóa các key đã xóa khỏi selectedKeys
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        for (const k of res.deletedKeys) next.delete(k);
        return next;
      });

      setDeleteModal({
        isOpen: false,
        keys: [],
        isChecking: false,
        isDeleting: false,
        inUse: false,
        usages: [],
        checkError: undefined,
      });

      await fetchMedia();
    } catch (err: any) {
      console.error('[AdminMediaManager] Lỗi xóa tệp:', err);
      showToast('Lỗi khi xóa tệp trên R2: ' + (err?.message || String(err)));
    } finally {
      setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Thêm tệp vào danh sách chờ tải lên
  const handleFilesAdded = (files: FileList | File[]) => {
    const newFiles = Array.from(files);
    setUploadQueue((prev) => [...prev, ...newFiles]);
  };

  // Xóa tệp khỏi danh sách chờ
  const removeQueueFile = (index: number) => {
    setUploadQueue((prev) => prev.filter((_, i) => i !== index));
  };

  // Bắt đầu tải lên toàn bộ queue
  const handleExecuteUpload = async () => {
    if (uploadQueue.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 tệp tin để tải lên.');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: uploadQueue.length });

    try {
      const subfolder = uploadSubfolder.trim() ? uploadSubfolder.trim() : undefined;
      const res = await apiClient.uploadMediaFiles(uploadQueue, subfolder);

      showToast(res.message || `Đã tải lên thành công ${res.uploaded.length} tệp tin vào R2!`);
      setUploadQueue([]);
      setIsUploadModalOpen(false);
      setPagination((p) => ({ ...p, page: 1 }));
      await fetchMedia();
    } catch (err: any) {
      console.error('[AdminMediaManager] Upload error:', err);
      showToast('Lỗi khi tải tệp lên R2: ' + (err?.message || String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-sm p-4 sm:p-5 shadow-xs space-y-4">
      {/* 1. Header Khối Tiêu chuẩn theo GEMINI.md Rule 5 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-xs bg-[#e60049] text-white tracking-wider">
              QUẢN LÝ MEDIA R2
            </span>
            <h2 className="text-sm font-black text-gray-900 uppercase">
              [QUẢN LÝ MEDIA R2] - Quản lý, tải lên, duyệt tìm và xóa tệp tin đa phương tiện trên Cloudflare R2 bucket
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Lưu trữ đám mây R2 với định dạng tên file 12 số thời gian (YYMMDDHHmmss), kiểm tra tham chiếu an toàn trước khi xóa vĩnh viễn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-pink-50 text-[#e60049] font-bold px-2.5 py-1 rounded-xs border border-pink-100">
            Tổng: {pagination.totalItems} tệp tin
          </span>
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3.5 py-2 rounded-xs transition shadow-xs flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            + Tải tệp mới
          </button>
          <button
            type="button"
            onClick={fetchMedia}
            disabled={isLoading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-3 py-2 rounded-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Làm mới
          </button>
        </div>
      </div>

      {/* 2. Thanh Công cụ (Toolbar & Filters) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xs border border-gray-200">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Folder Dropdown */}
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] font-bold text-gray-600">Thư mục:</label>
            <select
              value={filterFolder}
              onChange={(e) => {
                setFilterFolder(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 bg-white text-gray-800 focus:outline-none focus:border-[#e60049]"
            >
              <option value="all">Tất cả thư mục ({pagination.totalItems})</option>
              {folders.map((f) => (
                <option key={f.name} value={f.name}>
                  📁 {f.name} ({f.count})
                </option>
              ))}
            </select>
          </div>

          {/* File Type Filter Pills */}
          <div className="flex items-center gap-1 border-l border-gray-300 pl-2.5">
            {(['all', 'image', 'pdf', 'other'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setFilterFileType(type);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`text-xs px-2.5 py-1 rounded-xs font-semibold transition ${
                  filterFileType === type
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type === 'all' && 'Tất cả'}
                {type === 'image' && '🖼️ Ảnh'}
                {type === 'pdf' && '📄 PDF'}
                {type === 'other' && '📦 Khác'}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm tên tệp hoặc key..."
              className="w-full text-xs pl-7 pr-7 py-1.5 bg-white border border-gray-300 rounded-xs focus:outline-none focus:border-[#e60049] text-gray-800"
            />
            <svg
              className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="text-gray-400 hover:text-gray-600 absolute right-2 top-1.5 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Controls: Sort, View Switcher, Items Per Page */}
        <div className="flex items-center gap-2">
          {/* Sort Field & Direction */}
          <div className="flex items-center border border-gray-300 rounded-xs bg-white overflow-hidden">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs px-2 py-1.5 bg-transparent text-gray-700 border-r border-gray-200 focus:outline-none"
            >
              <option value="uploadedAt">Thời gian tải lên</option>
              <option value="modifiedAt">Thời gian sửa đổi</option>
              <option value="name">Tên tệp</option>
              <option value="size">Dung lượng</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? 'Tăng dần (A-Z, Cũ -> Mới)' : 'Giảm dần (Z-A, Mới -> Cũ)'}
              className="px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 font-bold"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* View Switcher: Grid vs List */}
          <div className="flex items-center border border-gray-300 rounded-xs bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition ${
                viewMode === 'grid' ? 'bg-[#e60049] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Xem dạng Lưới"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 transition ${
                viewMode === 'list' ? 'bg-[#e60049] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Xem dạng Danh sách bảng"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Items Per Page */}
          <select
            value={pagination.limit}
            onChange={(e) => {
              const newLimit = Number(e.target.value);
              setPagination((p) => ({ ...p, limit: newLimit, page: 1 }));
            }}
            className="text-xs border border-gray-300 rounded-xs px-2 py-1.5 bg-white text-gray-700 focus:outline-none"
          >
            <option value={24}>24 / trang</option>
            <option value={48}>48 / trang</option>
            <option value={96}>96 / trang</option>
          </select>
        </div>
      </div>

      {/* 3. Thanh Hành động Hàng loạt (Batch Action Bar) */}
      {selectedKeys.size > 0 && (
        <div className="flex items-center justify-between bg-pink-50 border border-pink-200 px-4 py-2 rounded-xs animate-fade-in text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#e60049]">Đã chọn {selectedKeys.size} tệp tin</span>
            <button
              type="button"
              onClick={() => setSelectedKeys(new Set())}
              className="text-gray-500 hover:text-gray-700 underline text-[11px]"
            >
              Bỏ chọn tất cả
            </button>
          </div>
          <button
            type="button"
            onClick={() => initiateDelete(Array.from(selectedKeys))}
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded-xs transition flex items-center gap-1 shadow-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Xóa {selectedKeys.size} tệp đã chọn
          </button>
        </div>
      )}

      {/* 4. Nội dung Danh sách Tệp tin: Grid hoặc List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <div className="w-8 h-8 border-3 border-gray-300 border-t-[#e60049] rounded-full animate-spin mb-2" />
          <span className="text-xs font-medium">Đang tải danh sách tệp từ Cloudflare R2...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-300 rounded-sm">
          <span className="text-4xl block mb-2">📁</span>
          <p className="text-sm font-bold text-gray-700">Không tìm thấy tệp tin nào</p>
          <p className="text-xs text-gray-500 mt-1">
            Thử thay đổi bộ lọc thư mục, loại tệp, từ khóa tìm kiếm hoặc bấm &quot;+ Tải tệp mới&quot; để tải lên.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item) => {
            const isSelected = selectedKeys.has(item.key);
            return (
              <div
                key={item.key}
                className={`group relative bg-white border rounded-sm overflow-hidden transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#e60049] ring-2 ring-[#e60049]/30 shadow-md'
                    : 'border-gray-200 hover:border-gray-400 hover:shadow-xs'
                }`}
              >
                {/* Thumbnail & Select Checkbox */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center">
                  {item.fileType === 'image' ? (
                    <img
                      src={item.publicUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : item.fileType === 'pdf' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-600 font-bold text-xs p-2 text-center">
                      <span className="text-3xl mb-1">📄</span>
                      <span className="text-[10px] tracking-wider uppercase">PDF Document</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-600 font-bold text-xs p-2 text-center">
                      <span className="text-3xl mb-1">📦</span>
                      <span className="text-[10px] tracking-wider uppercase">
                        {item.name.split('.').pop() || 'FILE'}
                      </span>
                    </div>
                  )}

                  {/* Checkbox overlay top-left */}
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.key)}
                      className="w-4 h-4 rounded-xs text-[#e60049] focus:ring-[#e60049] bg-white/90 border-gray-300 cursor-pointer shadow-xs"
                    />
                  </div>

                  {/* Badge upload time source top-right */}
                  <div className="absolute top-1.5 right-1.5 z-10">
                    {item.uploadTimeSource === 'r2_fallback' ? (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-amber-100/90 text-amber-800 border border-amber-300 shadow-2xs backdrop-blur-xs"
                        title="Thời gian lấy từ metadata LastModified của R2 (file cũ)"
                      >
                        [R2 Fallback]
                      </span>
                    ) : (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-xs bg-emerald-100/90 text-emerald-800 border border-emerald-300 shadow-2xs backdrop-blur-xs"
                        title="Thời gian trích xuất từ 12 chữ số YYMMDDHHmmss (UTC+7)"
                      >
                        12 số
                      </span>
                    )}
                  </div>
                </div>

                {/* Metadata & Actions */}
                <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <p className="text-xs font-bold text-gray-800 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mt-0.5">
                      <span className="font-semibold">{formatBytes(item.size)}</span>
                      <span className="truncate max-w-[80px] bg-gray-100 px-1 rounded-xs" title={item.folder}>
                        📁 {item.folder}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 truncate" title={item.uploadedAt}>
                      📅 {formatVietnamDateTime(item.uploadedAt)}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-gray-100 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="p-1 text-center font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xs transition"
                      title="Xem chi tiết"
                    >
                      👁️ Xem
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.publicUrl)}
                      className="p-1 text-center font-bold bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xs transition"
                      title="Sao chép link CDN"
                    >
                      📋 Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => initiateDelete([item.key])}
                      className="p-1 text-center font-bold bg-red-50 hover:bg-red-100 text-red-600 rounded-xs transition"
                      title="Xóa tệp"
                    >
                      🗑️ Xóa
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW TABLE */
        <div className="border border-gray-200 rounded-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && items.every((i) => selectedKeys.has(i.key))}
                    onChange={toggleSelectAllCurrentPage}
                    className="w-3.5 h-3.5 rounded-xs text-[#e60049] focus:ring-[#e60049]"
                  />
                </th>
                <th className="p-3 w-12">Preview</th>
                <th className="p-3">Tên Tệp Tin / Object Key</th>
                <th className="p-3">Thư mục</th>
                <th className="p-3">Loại</th>
                <th className="p-3">Dung lượng</th>
                <th className="p-3">Ngày Tải Lên (UTC+7)</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {items.map((item) => {
                const isSelected = selectedKeys.has(item.key);
                return (
                  <tr
                    key={item.key}
                    className={`hover:bg-gray-50/80 transition ${isSelected ? 'bg-pink-50/30' : ''}`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.key)}
                        className="w-3.5 h-3.5 rounded-xs text-[#e60049] focus:ring-[#e60049]"
                      />
                    </td>
                    <td className="p-3">
                      <div className="w-9 h-9 rounded-xs bg-gray-100 overflow-hidden flex items-center justify-center border border-gray-200">
                        {item.fileType === 'image' ? (
                          <img src={item.publicUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : item.fileType === 'pdf' ? (
                          <span className="text-base">📄</span>
                        ) : (
                          <span className="text-base">📦</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-mono truncate max-w-xs">{item.key}</p>
                    </td>
                    <td className="p-3">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-xs text-[11px] font-medium">
                        {item.folder}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] uppercase font-bold text-gray-500">{item.fileType}</span>
                    </td>
                    <td className="p-3 font-semibold text-gray-700">{formatBytes(item.size)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{formatVietnamDateTime(item.uploadedAt)}</span>
                        {item.uploadTimeSource === 'r2_fallback' ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-xs bg-amber-100 text-amber-800 border border-amber-200">
                            [R2 Fallback]
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                            12 số
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xs font-bold text-xs"
                        >
                          Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyLink(item.publicUrl)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xs font-bold text-xs"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => initiateDelete([item.key])}
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-xs font-bold text-xs"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Phân trang (Pagination) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3 text-xs text-gray-600">
        <div>
          Hiển thị <span className="font-bold text-gray-900">{items.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</span> -{' '}
          <span className="font-bold text-gray-900">
            {Math.min(pagination.page * pagination.limit, pagination.totalItems)}
          </span>{' '}
          trong tổng số <span className="font-bold text-gray-900">{pagination.totalItems}</span> tệp tin
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            className="px-2.5 py-1 border border-gray-300 rounded-xs bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none font-semibold text-gray-700"
          >
            ← Trước
          </button>
          <span className="px-3 py-1 font-bold text-gray-800">
            Trang {pagination.page} / {pagination.totalPages || 1}
          </span>
          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            className="px-2.5 py-1 border border-gray-300 rounded-xs bg-white hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none font-semibold text-gray-700"
          >
            Sau →
          </button>
        </div>
      </div>

      {/* 6. Modal Tải tệp mới (Upload Modal) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-sm shadow-2xl border border-gray-200 max-w-xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase">
                  Tải Lên Tệp Tin Mới Vào Cloudflare R2
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tên file tự động chuẩn hóa 12 số <code>YYMMDDHHmmss</code> (UTC+7) chống trùng lặp.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isUploading) {
                    setIsUploadModalOpen(false);
                    setUploadQueue([]);
                  }
                }}
                disabled={isUploading}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-500"
              >
                ✕
              </button>
            </div>

            {/* Subfolder input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Thư mục đích trên R2:
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-gray-100 px-2.5 py-2 border rounded-xs text-gray-600">
                  media-library/
                </span>
                <input
                  type="text"
                  value={uploadSubfolder}
                  onChange={(e) => setUploadSubfolder(e.target.value)}
                  placeholder="subfolder tùy chọn (ví dụ: banners, categories...)"
                  className="flex-1 text-xs border border-gray-300 rounded-xs px-3 py-2 focus:outline-none focus:border-[#e60049]"
                />
              </div>
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files) handleFilesAdded(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 hover:border-[#e60049] hover:bg-pink-50/20 rounded-xs p-6 text-center cursor-pointer transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesAdded(e.target.files);
                }}
              />
              <span className="text-3xl block mb-1">☁️</span>
              <p className="text-xs font-bold text-gray-800">
                Kéo &amp; thả tệp tin vào đây, hoặc click để chọn tệp từ máy tính
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                Hỗ trợ ảnh (PNG, JPG, WEBP, GIF, SVG), tài liệu (PDF). Tối đa 50MB/tệp, 50 tệp/lượt.
              </p>
            </div>

            {/* Queue List */}
            {uploadQueue.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 rounded-xs p-2 bg-gray-50">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-700 pb-1 border-b border-gray-200">
                  <span>Danh sách chờ tải ({uploadQueue.length} tệp):</span>
                  <button
                    type="button"
                    onClick={() => setUploadQueue([])}
                    className="text-red-600 hover:underline"
                  >
                    Xóa tất cả
                  </button>
                </div>
                {uploadQueue.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white px-2 py-1.5 rounded-xs border border-gray-100 text-xs"
                  >
                    <div className="truncate max-w-[340px]">
                      <span className="font-semibold text-gray-800">{f.name}</span>{' '}
                      <span className="text-[10px] text-gray-500">({formatBytes(f.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeQueueFile(idx);
                      }}
                      className="text-gray-400 hover:text-red-600 font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Progress bar */}
            {isUploading && (
              <div className="bg-pink-50 border border-pink-200 rounded-xs p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#e60049]">
                  <span>Đang tải tệp tin lên R2...</span>
                  <span>{uploadQueue.length} tệp</span>
                </div>
                <div className="w-full bg-pink-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#e60049] h-full animate-pulse w-full" />
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  setUploadQueue([]);
                }}
                disabled={isUploading}
                className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xs disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteUpload}
                disabled={isUploading || uploadQueue.length === 0}
                className="px-4 py-2 text-xs font-bold text-white bg-[#e60049] hover:bg-[#cc0041] rounded-xs shadow-xs disabled:opacity-50"
              >
                {isUploading ? 'Đang tải lên...' : `Bắt đầu tải lên (${uploadQueue.length} tệp)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Lightbox Xem chi tiết / Phóng to (Preview Lightbox) */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-sm shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="truncate max-w-lg">
                <h4 className="text-xs font-bold text-gray-900 truncate">{previewItem.name}</h4>
                <p className="text-[10px] text-gray-500 font-mono truncate">{previewItem.publicUrl}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center font-bold text-xs text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center p-4 min-h-[300px]">
              {previewItem.fileType === 'image' ? (
                <img
                  src={previewItem.publicUrl}
                  alt={previewItem.name}
                  className="max-h-[70vh] max-w-full object-contain"
                />
              ) : previewItem.fileType === 'pdf' ? (
                <iframe
                  src={previewItem.publicUrl}
                  title={previewItem.name}
                  className="w-full h-[70vh] bg-white rounded-xs"
                />
              ) : (
                <div className="text-center text-white space-y-2 py-10">
                  <span className="text-5xl block">📦</span>
                  <p className="text-sm font-bold">{previewItem.name}</p>
                  <p className="text-xs text-gray-400">Định dạng tệp tin: {previewItem.fileType}</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-[11px] text-gray-600 space-x-3">
                <span>Dung lượng: <strong>{formatBytes(previewItem.size)}</strong></span>
                <span>Thư mục: <strong>{previewItem.folder}</strong></span>
                <span>Tải lên: <strong>{formatVietnamDateTime(previewItem.uploadedAt)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyLink(previewItem.publicUrl)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xs font-bold text-xs"
                >
                  📋 Sao chép Link
                </button>
                <button
                  type="button"
                  onClick={() => window.open(previewItem.publicUrl, '_blank')}
                  className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xs font-bold text-xs"
                >
                  🌐 Mở tab mới
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Xác nhận Xóa an toàn & Kiểm tra Tham chiếu (Check-Usage Modal) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-sm shadow-2xl border border-gray-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black text-red-600 uppercase flex items-center gap-1.5">
                <span>⚠️</span> XÁC NHẬN XÓA VĨNH VIỄN TRÊN R2
              </h3>
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    keys: [],
                    isChecking: false,
                    isDeleting: false,
                    inUse: false,
                    usages: [],
                    checkError: undefined,
                  })
                }
                disabled={deleteModal.isDeleting}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-xs text-gray-500"
              >
                ✕
              </button>
            </div>

            {deleteModal.isChecking ? (
              <div className="py-8 flex flex-col items-center justify-center text-gray-600 space-y-2">
                <div className="w-8 h-8 border-3 border-gray-300 border-t-red-600 rounded-full animate-spin" />
                <span className="text-xs font-semibold">
                  Đang quét kiểm tra tham chiếu trong Database và cấu hình hệ thống...
                </span>
              </div>
            ) : deleteModal.checkError ? (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-300 p-3 rounded-xs text-xs text-amber-900 space-y-2">
                  <p className="font-extrabold text-amber-800 uppercase flex items-center gap-1.5">
                    <span>⚠️</span> LỖI KIỂM TRA THAM CHIẾU AN TOÀN
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Không thể kiểm tra tham chiếu của tệp tin do lỗi kết nối:{' '}
                    <span className="font-mono text-red-700 font-semibold">{deleteModal.checkError}</span>.
                  </p>
                  <p className="text-[11px] font-bold text-amber-900">
                    Để đảm bảo an toàn cho website, hành động xóa vĩnh viễn bị tạm khóa.
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleRetryCheckUsage}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xs font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Thử kiểm tra lại
                  </button>
                </div>
              </div>
            ) : deleteModal.inUse ? (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 p-3 rounded-xs text-xs text-red-800 space-y-1">
                  <p className="font-extrabold text-red-700 uppercase">
                    🚨 CẢNH BÁO: TỆP TIN ĐANG ĐƯỢC SỬ DỤNG TRÊN WEBSITE!
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Có <strong>{deleteModal.usages.length} vị trí</strong> đang liên kết trực tiếp tới các tệp tin này. Nếu xóa vĩnh viễn trên R2, website sẽ bị lỗi hiển thị ảnh hoặc hỏng liên kết!
                  </p>
                </div>

                <div className="max-h-48 overflow-y-auto border border-red-100 rounded-xs divide-y divide-red-100 text-xs">
                  {deleteModal.usages.map((u, idx) => (
                    <div key={idx} className="p-2 bg-red-50/40">
                      <p className="font-bold text-gray-900 text-[11px]">{u.location}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Trường/Chi tiết: <span className="font-mono text-red-700">{u.details}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono truncate">{u.key}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-700 space-y-2">
                <p>
                  Hệ thống đã quét kiểm tra toàn bộ Database &amp; cấu hình: <strong>Không phát hiện tệp tin nào đang được sử dụng.</strong>
                </p>
                <p className="text-gray-500">
                  Bạn có chắc chắn muốn xóa vĩnh viễn <strong>{deleteModal.keys.length} tệp tin</strong> trên Cloudflare R2 bucket? Thao tác này sẽ giải phóng dung lượng và không thể hoàn tác.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 text-xs font-bold">
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    keys: [],
                    isChecking: false,
                    isDeleting: false,
                    inUse: false,
                    usages: [],
                    checkError: undefined,
                  })
                }
                disabled={deleteModal.isDeleting}
                className="px-3.5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xs"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteModal.isChecking || deleteModal.isDeleting || !!deleteModal.checkError}
                className={`px-4 py-2 text-white rounded-xs shadow-xs transition ${
                  deleteModal.inUse
                    ? 'bg-red-700 hover:bg-red-800'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {deleteModal.isDeleting
                  ? 'Đang xóa trên R2...'
                  : deleteModal.checkError
                  ? 'Không thể xóa (Lỗi kiểm tra)'
                  : deleteModal.inUse
                  ? 'Vẫn tiếp tục xóa vĩnh viễn'
                  : 'Xác nhận xóa vĩnh viễn'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMediaManager;
