import React from 'react';
import { CascadeDeleteProductReport, Product } from '../types';

export interface ProductDeleteReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirmDelete: () => Promise<void>;
  report: CascadeDeleteProductReport | null;
  isDeleting: boolean;
}

export const ProductDeleteReportModal: React.FC<ProductDeleteReportModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirmDelete,
  report,
  isDeleting,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fade-in">
      <div className="bg-white rounded-md border border-gray-300 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-gray-800">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                report ? 'bg-emerald-600 text-white' : 'bg-[#e60049] text-white'
              }`}
            >
              {report ? 'BÁO CÁO CASCADE CLEANUP' : 'XÁC NHẬN XÓA TÀI LIỆU'}
            </span>
            <h3 className="text-sm sm:text-base font-black text-gray-900 truncate max-w-md">
              {product.title}
            </h3>
          </div>
          {!isDeleting && (
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-lg font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed flex-1">
          {!report ? (
            /* ============================================================== */
            /* BƯỚC 1: XÁC NHẬN TRƯỚC KHI XÓA                                */
            /* ============================================================== */
            <div className="space-y-4">
              <div className="flex items-start gap-3.5 bg-red-50 border border-red-200 rounded p-3 text-red-900">
                <span className="text-xl">⚠️</span>
                <div className="space-y-1">
                  <p className="font-extrabold text-xs">Cảnh báo hành động xóa vĩnh viễn tài liệu:</p>
                  <p className="text-[11px] text-red-700">
                    Khi bạn xóa sản phẩm này, hệ thống sẽ thực hiện <strong>Cascade Cleanup tự động</strong>{' '}
                    để bảo vệ tính toàn vẹn dữ liệu và loại bỏ hoàn toàn các thẻ ma trên website.
                  </p>
                </div>
              </div>

              {/* Thông tin sản phẩm sắp xóa */}
              <div className="border border-gray-200 rounded p-3 bg-gray-50 flex items-center gap-3">
                {product.thumbnail_url ? (
                  <img
                    src={product.thumbnail_url}
                    alt={product.title}
                    className="w-12 h-16 object-contain bg-white rounded border border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center font-bold text-gray-500 text-[10px]">
                    Sách
                  </div>
                )}
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="font-bold text-gray-900 truncate">{product.title}</div>
                  <div className="text-[11px] text-gray-500 font-mono">
                    /{product.category_slug}/{product.slug}
                  </div>
                </div>
              </div>

              {/* Danh sách hành động tự động hệ thống sẽ làm */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <p className="font-bold text-gray-800 text-[11px]">Hệ thống sẽ tự động thực hiện:</p>
                <ul className="list-disc pl-5 space-y-1 text-gray-600 text-[11px]">
                  <li>
                    Xóa sạch dữ liệu sản phẩm trong Database và cấu hình bố cục cấp 2 (
                    <code>product_detail_blocks</code>).
                  </li>
                  <li>
                    Quét và tự động gỡ bỏ thẻ sản phẩm khỏi toàn bộ các nhóm trên{' '}
                    <strong>Trang cấp 1 (THPT, THCS, ...)</strong> để chống thẻ ma (Ghost Cards).
                  </li>
                  <li>
                    Loại bỏ ID sản phẩm khỏi các gói ưu đãi trên <strong>Trang Combo THPT</strong> và{' '}
                    <strong>Trang chủ</strong>.
                  </li>
                  <li>
                    Xóa vật lý vĩnh viễn các file liên quan (ảnh bìa, PDF đọc thử, demo pages) trên{' '}
                    <strong>Cloudflare R2</strong> theo đúng quy chuẩn Rule 2.
                  </li>
                  <li>
                    <strong>Bảo lưu an toàn</strong> lịch sử các đơn hàng cũ và Tủ sách của khách hàng đã mua
                    trước đây.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            /* ============================================================== */
            /* BƯỚC 2: BÁO CÁO CHI TIẾT SAU KHI XÓA & CASCADE CLEANUP         */
            /* ============================================================== */
            <div className="space-y-4">
              {/* KHỐI 1: ĐÃ TỰ ĐỘNG XÓA & DỌN DẸP (XANH LÁ) */}
              <div className="border border-emerald-200 bg-emerald-50/60 rounded p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-emerald-200 pb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </span>
                  <span className="font-black text-emerald-900 text-xs uppercase tracking-wide">
                    1. Đã tự động xóa &amp; Dọn dẹp liên kết (Auto-Cleaned)
                  </span>
                </div>

                <div className="space-y-2 text-[11px] text-emerald-950">
                  <div>
                    <span className="font-bold text-emerald-900">Cơ sở dữ liệu Database:</span>
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                      {report.autoDeleted.database.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-emerald-900">Liên kết CMS Trang cấp 1, Combo, Trang chủ:</span>
                    {report.autoDeleted.cmsCleaned.length > 0 ? (
                      <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                        {report.autoDeleted.cmsCleaned.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="italic text-emerald-700 pl-4 mt-0.5">
                        Không có liên kết thừa nào cần gỡ bỏ trên các khối CMS.
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="font-bold text-emerald-900">
                      Bộ nhớ Cloudflare R2 ({report.autoDeleted.r2TotalFiles} file đã xóa vĩnh viễn):
                    </span>
                    {report.autoDeleted.r2FilesDeleted.length > 0 ? (
                      <div className="max-h-24 overflow-y-auto border border-emerald-200 bg-white rounded p-1.5 mt-1 font-mono text-[10px] space-y-0.5">
                        {report.autoDeleted.r2FilesDeleted.map((url, idx) => (
                          <div key={idx} className="truncate text-gray-700">
                            • {url.split('/').pop()}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="italic text-emerald-700 pl-4 mt-0.5">
                        Không có file R2 nào liên kết với tài liệu này.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* KHỐI 2: CẦN LƯU Ý & TỰ KIỂM TRA TAY (VÀNG / CAM) */}
              <div className="border border-amber-300 bg-amber-50/70 rounded p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-amber-200 pb-2">
                  <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                    !
                  </span>
                  <span className="font-black text-amber-900 text-xs uppercase tracking-wide">
                    2. Cần lưu ý &amp; Tự kiểm tra tay (Manual Action Required)
                  </span>
                </div>

                <div className="space-y-2 text-[11px] text-amber-950">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-900 shrink-0">• Đơn hàng lịch sử:</span>
                    <span>{report.manualAttention.ordersNotice}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-900 shrink-0">• Tủ sách cá nhân:</span>
                    <span>{report.manualAttention.libraryNotice}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-900 shrink-0">• Kênh truyền thông ngoài:</span>
                    <span>{report.manualAttention.marketingNotice}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2.5">
          {!report ? (
            <>
              <button
                type="button"
                disabled={isDeleting}
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-100 font-bold rounded-sm text-xs text-gray-700 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirmDelete}
                className="px-4 py-2 bg-[#e60049] hover:bg-[#cc0041] disabled:opacity-50 text-white font-extrabold rounded-sm text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isDeleting ? 'Đang Cascade Cleanup...' : 'Xác nhận Xóa & Cascade Cleanup'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-sm text-xs transition cursor-pointer shadow-sm"
            >
              Đã hiểu &amp; Đóng báo cáo
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
