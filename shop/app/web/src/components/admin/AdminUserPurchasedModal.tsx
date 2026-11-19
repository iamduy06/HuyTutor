import React, { useState, useEffect, useMemo } from 'react';
import {
  AdminUserRecord,
  UserLibraryItem,
  AdminUserLibrarySummary,
  formatVnd,
} from '../../types';
import { apiClient } from '../../api/client';
import { getClientErrorMessage } from '../../utils/errorHandler';

export interface AdminUserPurchasedModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUserRecord | null;
  showToast: (message: string) => void;
}

const getFormatBadgeColor = (format?: string) => {
  switch (format) {
    case 'Word':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PDF':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'Flashcard':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Trang tính':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'Thiết kế':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const AdminUserPurchasedModal: React.FC<AdminUserPurchasedModalProps> = ({
  isOpen,
  onClose,
  user,
  showToast,
}) => {
  const [items, setItems] = useState<UserLibraryItem[]>([]);
  const [summary, setSummary] = useState<AdminUserLibrarySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFormat, setSelectedFormat] = useState<string>('ALL');

  useEffect(() => {
    if (isOpen && user) {
      loadUserLibrary(user.id);
    } else {
      setItems([]);
      setSummary(null);
      setErrorMsg(null);
      setSearchQuery('');
      setSelectedFormat('ALL');
    }
  }, [isOpen, user]);

  const loadUserLibrary = async (userId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.getAdminUserLibrary(userId);
      const dataItems: UserLibraryItem[] = res.data?.items ?? res.items ?? [];
      const dataSummary: AdminUserLibrarySummary = res.data?.summary ?? res.summary ?? {
        totalDocuments: dataItems.length,
        totalSpent: dataItems.reduce(
          (sum, it) => sum + (it.final_price ?? it.paid_amount ?? 0),
          0
        ),
        totalOrders: new Set(dataItems.map((it) => it.order_code).filter(Boolean)).size,
      };
      setItems(dataItems);
      setSummary(dataSummary);
    } catch (err: any) {
      const detailed = getClientErrorMessage(err, true);
      setErrorMsg(detailed);
      showToast(detailed);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const title = (item.title || item.product_title || '').toLowerCase();
      const code = (item.order_code || '').toLowerCase();
      const format = item.format || item.format_code || '';
      const matchesSearch = !q || title.includes(q) || code.includes(q);
      const matchesFormat = selectedFormat === 'ALL' || format === selectedFormat;
      return matchesSearch && matchesFormat;
    });
  }, [items, searchQuery, selectedFormat]);

  if (!isOpen || !user) return null;

  const userDisplayName = user.fullName
    ? `${user.fullName} (${user.email})`
    : user.email;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs animate-fade-in">
      <div className="bg-white rounded-sm border border-gray-300 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-gray-800">
        {/* Header Khối */}
        <div className="px-5 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm bg-purple-600 text-white">
                TỦ SÁCH THÀNH VIÊN
              </span>
              <h3 className="text-xs sm:text-sm font-black text-gray-900 truncate">
                [TÀI LIỆU ĐÃ MUA] - Khách hàng: {userDisplayName}
              </h3>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Mã tài khoản: <span className="font-mono text-gray-700">{user.id}</span> • Nhóm: {user.customerGroup || 'Giáo viên'} • SĐT: {user.phone || '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-base font-bold px-2 py-1 rounded cursor-pointer transition"
            title="Đóng cửa sổ"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {errorMsg && (
            <div className="bg-red-50 border border-red-300 text-red-800 p-3 rounded-sm font-mono text-[11px]">
              <strong>Lỗi thực thi:</strong> {errorMsg}
            </div>
          )}

          {/* 3 Thẻ thống kê tóm tắt */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-blue-50/60 border border-blue-200 rounded-sm p-3 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-800">
                Tổng tài liệu sở hữu
              </div>
              <div className="text-lg font-black text-blue-700">
                {summary ? `${summary.totalDocuments} tài liệu` : '—'}
              </div>
              <div className="text-[10px] font-medium text-blue-600">
                Số lượng quyền truy cập đã cấp
              </div>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-200 rounded-sm p-3 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Tổng chi tiêu thực tế
              </div>
              <div className="text-lg font-black text-emerald-700">
                {summary ? formatVnd(summary.totalSpent) : '—'}
              </div>
              <div className="text-[10px] font-medium text-emerald-600">
                Doanh thu thực thu sau chiết khấu
              </div>
            </div>

            <div className="bg-purple-50/60 border border-purple-200 rounded-sm p-3 space-y-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-purple-800">
                Tổng đơn hàng phát sinh
              </div>
              <div className="text-lg font-black text-purple-700">
                {summary ? `${summary.totalOrders} đơn hàng` : '—'}
              </div>
              <div className="text-[10px] font-medium text-purple-600">
                Các đơn hàng có trạng thái hoàn tất
              </div>
            </div>
          </div>

          {/* Thanh tìm kiếm & lọc định dạng */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-sm border border-gray-200 text-xs">
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên tài liệu, mã đơn hàng..."
                className="w-full border border-gray-300 rounded-sm px-2.5 py-1 text-xs bg-white focus:outline-none focus:border-[#e60049]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {['ALL', 'Word', 'PDF', 'Flashcard', 'Trang tính', 'Thiết kế'].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setSelectedFormat(fmt)}
                  className={`px-2 py-0.5 rounded-xs text-[11px] font-bold transition cursor-pointer ${
                    selectedFormat === fmt
                      ? 'bg-[#e60049] text-white shadow-2xs'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {fmt === 'ALL' ? 'Tất cả' : fmt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => loadUserLibrary(user.id)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2 py-0.5 rounded-xs text-[11px] transition ml-1"
                title="Làm mới"
              >
                ↻
              </button>
            </div>
          </div>

          {/* Danh sách / Bảng tài liệu */}
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-semibold space-y-2">
              <div className="inline-block w-6 h-6 border-2 border-[#e60049] border-t-transparent rounded-full animate-spin" />
              <div>Đang tải danh sách tài liệu...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-sm p-8 text-center space-y-2 text-gray-500">
              <div className="text-sm font-bold text-gray-700">Không có tài liệu nào</div>
              <p className="text-xs">
                {items.length === 0
                  ? 'Thành viên này chưa có tài liệu nào trong tủ sách.'
                  : 'Không tìm thấy tài liệu phù hợp với bộ lọc hiện tại.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-sm">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-200">
                    <th className="p-2 text-center w-8">#</th>
                    <th className="p-2 text-left">Tài liệu</th>
                    <th className="p-2 text-left">Định dạng</th>
                    <th className="p-2 text-left">Mã đơn</th>
                    <th className="p-2 text-right">Giá thực tế</th>
                    <th className="p-2 text-center">Kích hoạt</th>
                    <th className="p-2 text-center">Lượt tải</th>
                    <th className="p-2 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item, idx) => {
                    const title = item.title || item.product_title || 'Tài liệu không tên';
                    const format = item.format || item.format_code || 'Word';
                    const price = item.final_price ?? item.paid_amount ?? 0;
                    const dateStr = item.activated_at || item.granted_at;
                    const formattedDate = dateStr
                      ? new Date(dateStr).toLocaleDateString('vi-VN')
                      : '—';
                    const driveUrl = item.access_drive_url;

                    return (
                      <tr key={item.id || idx} className="hover:bg-gray-50/80 transition">
                        <td className="p-2 text-center text-gray-500 font-medium">{idx + 1}</td>
                        <td className="p-2">
                          <div className="flex items-center gap-2.5">
                            {item.thumbnail_url ? (
                              <img
                                src={item.thumbnail_url}
                                alt={title}
                                className="w-9 h-9 object-cover rounded-xs border border-gray-200 shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-9 h-9 bg-gray-100 rounded-xs border border-gray-200 flex items-center justify-center font-bold text-gray-400 text-[10px] shrink-0">
                                DOC
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-gray-900 truncate max-w-xs" title={title}>
                                {title}
                              </div>
                              {item.product_slug && (
                                <div className="text-[10px] text-gray-400 font-mono truncate">
                                  {item.product_slug}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-xs border ${getFormatBadgeColor(
                              format
                            )}`}
                          >
                            {format}
                          </span>
                        </td>
                        <td className="p-2">
                          {item.order_code ? (
                            <span className="font-mono font-bold text-[#e60049] text-[11px]">
                              {item.order_code}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-2 text-right font-extrabold text-gray-900">
                          {formatVnd(price)}
                        </td>
                        <td className="p-2 text-center text-gray-600 text-[11px]">
                          {formattedDate}
                        </td>
                        <td className="p-2 text-center font-bold text-gray-700">
                          {item.download_count || 0}
                        </td>
                        <td className="p-2 text-right">
                          {driveUrl ? (
                            <a
                              href={driveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-2.5 py-1 rounded-sm transition shadow-2xs"
                            >
                              <span>Google Drive</span>
                              <span className="text-[9px]">↗</span>
                            </a>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Chưa gắn link</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between shrink-0 text-xs">
          <span className="text-gray-500">
            Hiển thị <strong>{filteredItems.length}</strong> / <strong>{items.length}</strong> tài liệu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold px-4 py-1.5 rounded-sm transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
