import React, { useRef, useState } from 'react';
import { IsolatedHtmlBlock } from './IsolatedHtmlBlock';
import { R2MediaPickerModal } from './R2MediaPickerModal';

export interface CustomHtmlBlockConfig {
  html_content?: string;
  container_mode?: 'boxed' | 'full_width';
  no_padding?: boolean;
  admin_label?: string;
}

export interface CustomHtmlBlockEditorProps {
  config: CustomHtmlBlockConfig;
  onChange: (newConfig: CustomHtmlBlockConfig) => void;
}

export const CustomHtmlBlockEditor: React.FC<CustomHtmlBlockEditorProps> = ({
  config,
  onChange,
}) => {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSelectionRef = useRef<{ start: number; end: number } | null>(null);

  // Lưu vị trí con trỏ chuột / vùng bôi đen đang chọn
  const saveSelection = () => {
    if (textareaRef.current) {
      lastSelectionRef.current = {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      };
    }
  };

  // Mở modal media và ghi nhớ vị trí con trỏ
  const handleOpenMediaPicker = () => {
    saveSelection();
    setIsMediaPickerOpen(true);
  };

  // Xử lý phím Tab thụt lề 2 khoảng trắng (bảo vệ Shift+Tab)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) return; // Không chèn khoảng trắng khi nhấn Shift+Tab

      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const val = textarea.value || '';
      const newVal = val.substring(0, start) + '  ' + val.substring(end);

      onChange({
        ...config,
        html_content: newVal,
      });

      const newPos = start + 2;
      lastSelectionRef.current = { start: newPos, end: newPos };

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = newPos;
      });
    }
  };

  // Chèn nội dung thẻ <img> hoặc URL vào vị trí con trỏ đã lưu (hoặc nối vào cuối nếu chưa focus)
  const handleInsertMedia = (markupOrUrl: string) => {
    const textarea = textareaRef.current;
    const currentVal = config.html_content || '';

    let start = currentVal.length;
    let end = currentVal.length;

    // Ưu tiên vị trí con trỏ đã lưu trước khi mở modal
    if (lastSelectionRef.current) {
      start = Math.min(lastSelectionRef.current.start, currentVal.length);
      end = Math.min(lastSelectionRef.current.end, currentVal.length);
    } else if (textarea && (textarea.selectionStart !== 0 || textarea.selectionEnd !== 0)) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
    } else if (currentVal.length === 0) {
      start = 0;
      end = 0;
    }

    // Nếu nối vào cuối văn bản đã có sẵn nội dung mà không phải thay thế vùng chọn
    const insertionText =
      start === end && start === currentVal.length && currentVal.length > 0 && !currentVal.endsWith('\n')
        ? `\n${markupOrUrl}`
        : markupOrUrl;

    const newVal = currentVal.substring(0, start) + insertionText + currentVal.substring(end);

    onChange({
      ...config,
      html_content: newVal,
    });

    const nextCursorPos = start + insertionText.length;
    lastSelectionRef.current = { start: nextCursorPos, end: nextCursorPos };

    requestAnimationFrame(() => {
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = nextCursorPos;
      }
    });
  };

  return (
    <div className="space-y-5 bg-white border border-gray-200 rounded-sm p-5 shadow-xs">
      {/* 1. Nhãn Định danh Admin */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
          Nhãn định danh khối (Admin Label)
        </label>
        <input
          type="text"
          value={config.admin_label || ''}
          onChange={(e) => onChange({ ...config, admin_label: e.target.value })}
          placeholder="Ví dụ: Banner Khuyến mãi Mùa thi 2026, Khối Video giới thiệu..."
          className="w-full text-xs border border-gray-300 rounded-sm px-3 py-2 focus:ring-1 focus:ring-[#e60049] focus:border-[#e60049] outline-none transition"
        />
        <p className="text-[11px] text-gray-500 mt-1">
          Nhãn này chỉ hiển thị trong trang quản trị CMS giúp bạn dễ nhận diện khối giữa danh sách.
        </p>
      </div>

      {/* 2. Cấu hình Chế độ Khung & Padding */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-gray-100">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Chế độ khung chứa (Container Mode)
          </label>
          <div className="space-y-2">
            <label
              className={`flex items-start gap-3 p-3 border rounded-sm cursor-pointer transition ${
                (config.container_mode || 'boxed') === 'boxed'
                  ? 'border-[#e60049] bg-pink-50/40 text-gray-900'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <input
                type="radio"
                name="container_mode"
                value="boxed"
                checked={(config.container_mode || 'boxed') === 'boxed'}
                onChange={() => onChange({ ...config, container_mode: 'boxed' })}
                className="mt-0.5 text-[#e60049] focus:ring-[#e60049]"
              />
              <div>
                <span className="block text-xs font-bold">Khung chuẩn (Boxed 1200px)</span>
                <span className="block text-[11px] text-gray-500 mt-0.5">
                  Giới hạn chiều rộng 1200px ở giữa trang, phù hợp nội dung văn bản, bảng biểu, ảnh minh họa.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 border rounded-sm cursor-pointer transition ${
                config.container_mode === 'full_width'
                  ? 'border-[#e60049] bg-pink-50/40 text-gray-900'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <input
                type="radio"
                name="container_mode"
                value="full_width"
                checked={config.container_mode === 'full_width'}
                onChange={() => onChange({ ...config, container_mode: 'full_width' })}
                className="mt-0.5 text-[#e60049] focus:ring-[#e60049]"
              />
              <div>
                <span className="block text-xs font-bold">Tràn màn hình (Full-width)</span>
                <span className="block text-[11px] text-gray-500 mt-0.5">
                  Chiều rộng 100% toàn màn hình, phù hợp dải màu nền, hero banner tràn viền.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Khoảng cách lề (Vertical Padding)
          </label>
          <label className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-sm cursor-pointer hover:bg-gray-100 transition">
            <input
              type="checkbox"
              checked={!!config.no_padding}
              onChange={(e) => onChange({ ...config, no_padding: e.target.checked })}
              className="mt-0.5 w-4 h-4 text-[#e60049] rounded-xs focus:ring-[#e60049]"
            />
            <div>
              <span className="block text-xs font-bold text-gray-800">
                Bỏ khoảng cách đệm trên / dưới (py-0)
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                Loại bỏ khoảng đệm mặc định (py-6) để khối HTML dính liền với khối phía trên hoặc khối phía dưới không tạo khoảng hở.
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 3. Textarea Soạn thảo Mã nguồn Monospace */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs font-black text-gray-800 uppercase tracking-wider">
              Mã Nguồn HTML &amp; CSS Tùy Biến
            </label>
            <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-xs">
              Shadow DOM Isolate
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenMediaPicker}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e60049] hover:bg-[#c4003e] text-white text-xs font-bold rounded-sm shadow-xs transition"
            >
              <span>🖼️</span>
              <span>Chọn / Upload nhanh ảnh R2</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-sm transition"
            >
              <span>{showPreview ? 'Ẩn Preview' : 'Hiện Preview'}</span>
            </button>
          </div>
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={config.html_content || ''}
            onChange={(e) => {
              saveSelection();
              onChange({ ...config, html_content: e.target.value });
            }}
            onSelect={saveSelection}
            onClick={saveSelection}
            onKeyUp={saveSelection}
            onKeyDown={handleKeyDown}
            rows={12}
            placeholder={`<!-- Ví dụ cấu trúc HTML tùy biến -->\n<style>\n  .custom-promo-box {\n    background: #18181b;\n    color: #ffffff;\n    padding: 32px 24px;\n    text-align: center;\n    border-radius: 4px;\n  }\n  .custom-promo-box h3 {\n    color: #e60049;\n    font-size: 22px;\n    font-weight: 800;\n    margin-bottom: 8px;\n  }\n</style>\n\n<div class="custom-promo-box">\n  <h3>CHƯƠNG TRÌNH KHUYẾN MÃI ĐẶC BIỆT</h3>\n  <p>Nhận ngay bộ tài liệu bổ trợ ôn thi khi đăng ký hôm nay!</p>\n</div>`}
            className="w-full font-mono text-xs leading-relaxed bg-[#18181b] text-[#f4f4f5] border border-gray-700 rounded-sm p-4 focus:ring-1 focus:ring-[#e60049] focus:border-[#e60049] outline-none transition selection:bg-[#e60049]/30"
            spellCheck={false}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
          <span>💡 Phím <strong>Tab</strong> tự động thụt lề 2 khoảng trắng. Thẻ <code>&lt;style&gt;</code> được cô lập tuyệt đối, không rò rỉ ra ngoài.</span>
          <span>{config.html_content?.length || 0} ký tự</span>
        </div>
      </div>

      {/* 4. Live Preview Trực Tiếp */}
      {showPreview && (
        <div className="border border-gray-200 rounded-sm bg-gray-50 overflow-hidden mt-4">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-100 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-700 uppercase">Live Preview Trực Tiếp</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-xs">
                Realtime
              </span>
            </div>

            <div className="flex items-center gap-1 bg-white p-0.5 border border-gray-300 rounded-xs">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`text-xs font-bold px-3 py-1 rounded-xs transition ${
                  previewDevice === 'desktop'
                    ? 'bg-[#e60049] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🖥️ Desktop (100%)
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`text-xs font-bold px-3 py-1 rounded-xs transition ${
                  previewDevice === 'mobile'
                    ? 'bg-[#e60049] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📱 Mobile (375px)
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-200/50 flex justify-center min-h-[160px] items-center">
            {!config.html_content || !config.html_content.trim() ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <span className="text-2xl mb-1.5">👁️</span>
                <p className="text-xs font-semibold">Chưa có mã nguồn để xem trước</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Nhập mã HTML/CSS ở trên hoặc bấm &quot;Chọn / Upload nhanh ảnh R2&quot; để xem hiển thị trực tiếp.
                </p>
              </div>
            ) : previewDevice === 'desktop' ? (
              <div className="w-full bg-white shadow-sm border border-gray-200 overflow-hidden min-h-[100px]">
                <IsolatedHtmlBlock
                  htmlContent={config.html_content}
                  containerMode={config.container_mode}
                  noPadding={config.no_padding}
                />
              </div>
            ) : (
              <div className="w-[375px] max-w-full bg-white shadow-xl border-4 border-gray-800 rounded-3xl overflow-hidden min-h-[380px] flex flex-col">
                <div className="h-6 bg-gray-800 w-full flex items-center justify-center">
                  <div className="w-16 h-3 bg-black rounded-full" />
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <IsolatedHtmlBlock
                    htmlContent={config.html_content}
                    containerMode={config.container_mode}
                    noPadding={config.no_padding}
                  />
                </div>
                <div className="h-4 bg-gray-800 w-full flex items-center justify-center">
                  <div className="w-24 h-1 bg-gray-400 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Chọn / Upload nhanh Media R2 */}
      <R2MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onInsertMedia={handleInsertMedia}
        initialFolder="media-library"
      />
    </div>
  );
};

export default CustomHtmlBlockEditor;
