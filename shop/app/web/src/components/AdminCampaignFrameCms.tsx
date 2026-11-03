import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { apiClient } from '../api/client';
import {
  CampaignFrameConfig,
  CampaignFramePreset,
  AspectRatioMode,
  PresetAspectRatio,
} from '../types';
import { ProductImageFrame } from './ProductImageFrame';
import { R2ImageUploader } from './R2ImageUploader';

export const AdminCampaignFrameCms: React.FC = () => {
  const { siteConfigs, updateSiteConfig, products, showToast } = useStore();

  // State cấu hình chiến dịch
  const [config, setConfig] = useState<CampaignFrameConfig>(() => {
    return (
      siteConfigs?.campaign_frame || {
        is_enabled: false,
        frame_type: 'preset',
        preset_name: 'tet',
        custom_frame_url: '',
        scope: 'global',
        applied_product_ids: [],
      }
    );
  });

  // State sandbox xem trước trực tiếp
  const [testRatioMode, setTestRatioMode] = useState<AspectRatioMode>('preset');
  const [testPresetRatio, setTestPresetRatio] = useState<PresetAspectRatio>('3:4');
  const [testCustomW, setTestCustomW] = useState<number>(5);
  const [testCustomH, setTestCustomH] = useState<number>(7);
  const [testMaxWidth, setTestMaxWidth] = useState<number>(360);
  const [testObjectFit, setTestObjectFit] = useState<'cover' | 'contain'>('cover');
  const [testProductId, setTestProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [customTestImgUrl, setCustomTestImgUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Đồng bộ khi siteConfigs từ database tải về
  useEffect(() => {
    if (siteConfigs?.campaign_frame) {
      setConfig(siteConfigs.campaign_frame);
    }
  }, [siteConfigs?.campaign_frame]);

  // Cập nhật trường trong config
  const updateField = <K extends keyof CampaignFrameConfig>(
    field: K,
    val: CampaignFrameConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [field]: val }));
  };

  // Upload file PNG khung đè riêng lên Cloudflare R2 (Đặt tên ngẫu nhiên 12 số)
  const handleUploadCustomFrame = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png')) {
      showToast('Khung đè chiến dịch nên dùng file PNG trong suốt (Transparent PNG)');
    }

    try {
      setIsUploading(true);
      const oldUrl = config.custom_frame_url;
      const res = await apiClient.uploadFile(file, { folder: 'campaign' });
      if (res && res.url) {
        updateField('custom_frame_url', res.url);
        updateField('frame_type', 'custom');
        showToast('Đã tải lên khung đè với tên 12 số ngẫu nhiên lên R2 thành công!');
        if (oldUrl && oldUrl !== res.url) {
          apiClient.deleteR2File(oldUrl).catch(() => {});
        }
      } else {
        showToast('Lỗi tải ảnh lên Cloudflare R2');
      }
    } catch (err: any) {
      showToast('Lỗi kết nối khi tải ảnh: ' + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Xóa vĩnh viễn file khung đè khỏi Cloudflare R2 (không chỉ là bỏ link)
  const handleDeleteCustomFrame = async () => {
    if (!config.custom_frame_url) return;
    const oldUrl = config.custom_frame_url;
    try {
      await apiClient.deleteR2File(oldUrl);
      updateField('custom_frame_url', '');
      showToast('Đã xóa vĩnh viễn file khung đè khỏi Cloudflare R2!');
    } catch (err: any) {
      showToast('Lỗi xóa file trên R2: ' + err.message);
    }
  };

  // Lưu cấu hình
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSiteConfig('campaign_frame', config);
      showToast('Đã lưu cấu hình Khung Chiến Dịch thành công!');
    } catch (err: any) {
      showToast('Lỗi khi lưu cấu hình: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Lấy ảnh mẫu để preview
  const selectedProduct = products.find((p) => p.id === testProductId) || products[0];
  const sampleImg = customTestImgUrl.trim() || selectedProduct?.thumbnail_url || '';

  return (
    <div className="space-y-6">
      {/* Top Action Bar chuẩn: Title trang - Mô tả trang */}
      <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e60049] animate-pulse"></span>
            <h2 className="text-sm font-extrabold text-[#e60049] uppercase tracking-wide">
              Quản Trị Khung Hình & Khung Đè Chiến Dịch (Campaign Overlay CMS)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
            Quy chuẩn khung hình bo tròn 16px, viền xám, đổ bóng 3D, hỗ trợ thiết kế full tấm.
            Bật/tắt lớp khung đè sự kiện (Tết, Sale, Mùa thi, Giáng Sinh) tức thì cho toàn bộ website
            mà không cần phải sửa hàng trăm ảnh sản phẩm gốc. Tự do tùy biến tỷ lệ và độ phân giải.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-white hover:bg-gray-100 text-[#e60049] font-bold text-xs px-5 py-2.5 rounded-lg shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer disabled:opacity-70"
        >
          {isSaving ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <span>💾</span>
          )}
          <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột Trái (7 cols): Cấu hình Khung Chiến Dịch */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Công tắc Kích hoạt Master */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-[#e60049] text-white">
                    KHỐI 1
                  </span>
                  <h3 className="text-sm font-black text-gray-900">
                    Kích Hoạt Khung Đè Chiến Dịch (Campaign Master Switch)
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Gạt công tắc để bật hoặc tắt lớp khung chiến dịch trên toàn bộ website hoặc từng sản phẩm.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.is_enabled}
                  onChange={(e) => updateField('is_enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e60049]"></div>
              </label>
            </div>

            {config.is_enabled && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                <span className="font-bold">Đang BẬT:</span> Khung chiến dịch đang được áp dụng
                trực tiếp trên các trang web cho khách hàng.
              </div>
            )}
          </div>

          {/* Card 2: Lựa chọn Khung Chiến Dịch */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-blue-600 text-white">
                  KHỐI 2
                </span>
                <h3 className="text-sm font-black text-gray-900">
                  Chọn Loại Khung Chiến Dịch & Tải File PNG Lên R2
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lựa chọn một trong 4 mẫu thiết kế có sẵn hoặc tải file ảnh PNG trong suốt riêng lên Cloudflare R2.
              </p>
            </div>

            {/* Radio Mode */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="frame_type"
                  checked={config.frame_type === 'preset'}
                  onChange={() => updateField('frame_type', 'preset')}
                  className="text-[#e60049] focus:ring-[#e60049]"
                />
                <span>Sử dụng 4 Khung Preset Sẵn Có (Vector Hi-Res)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="frame_type"
                  checked={config.frame_type === 'custom'}
                  onChange={() => updateField('frame_type', 'custom')}
                  className="text-[#e60049] focus:ring-[#e60049]"
                />
                <span>Tải Khung PNG Riêng (Custom Upload)</span>
              </label>
            </div>

            {/* Khung Preset */}
            {config.frame_type === 'preset' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {[
                  { id: 'tet', label: 'Tết & Năm Mới', icon: '🌸', desc: 'Hoa mai, hoa đào, ruy băng vàng' },
                  { id: 'sale', label: 'Mega Sale / Hot Deal', icon: '🔥', desc: 'Viền Neon, nhãn -25%' },
                  { id: 'exam', label: 'Mùa Thi & Ôn Luyện', icon: '🎓', desc: 'Cúp vàng, ma trận 2026' },
                  { id: 'christmas', label: 'Giáng Sinh / Đông', icon: '❄️', desc: 'Bông tuyết, nơ đỏ, thông' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateField('preset_name', item.id as CampaignFramePreset)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between h-28 cursor-pointer ${
                      config.preset_name === item.id
                        ? 'border-[#e60049] bg-pink-50/50 shadow-xs ring-2 ring-[#e60049]/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-xl mb-1">{item.icon}</div>
                      <div className="text-xs font-bold text-gray-900 leading-tight">
                        {item.label}
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">{item.desc}</div>
                  </button>
                ))}
              </div>
            ) : (
              /* Custom Upload PNG */
              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <label className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold px-4 py-2 rounded-lg border border-gray-300 cursor-pointer transition flex items-center gap-2">
                    <span>📤 Tải file PNG khung đè</span>
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleUploadCustomFrame}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                  {isUploading && (
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full" />
                      Đang tải file lên Cloudflare R2...
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-semibold text-gray-600">
                      URL file PNG khung đè (Cloudflare R2 - 12 chữ số):
                    </label>
                    {config.custom_frame_url && (
                      <button
                        type="button"
                        onClick={handleDeleteCustomFrame}
                        className="text-[10px] text-red-600 hover:text-red-700 font-bold underline cursor-pointer"
                      >
                        🗑️ Xóa vĩnh viễn file khỏi R2
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={config.custom_frame_url || ''}
                    onChange={(e) => updateField('custom_frame_url', e.target.value)}
                    placeholder="https://media.huytutor.edu.vn/campaign/123456789012.png"
                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#e60049]"
                  />
                </div>

                <p className="text-[11px] text-gray-500 italic">
                  💡 <strong>Gợi ý thiết kế:</strong> Tạo khung PNG trong suốt 600x800 px (hoặc cùng tỉ lệ với ảnh sản phẩm).
                  Chỉ vẽ họa tiết ở 4 cạnh viền ngoài, để rỗng 100% vùng giữa để nhìn thấy sách bên dưới.
                </p>
              </div>
            )}
          </div>

          {/* Card 3: Phạm vi áp dụng */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm bg-emerald-600 text-white">
                  KHỐI 3
                </span>
                <h3 className="text-sm font-black text-gray-900">
                  Phạm Vi Áp Dụng Khung Chiến Dịch
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Áp dụng toàn bộ hệ thống (Global) hoặc chỉ định đích danh từng tài liệu được hiển thị khung đè.
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={config.scope === 'global'}
                  onChange={() => updateField('scope', 'global')}
                  className="text-[#e60049] focus:ring-[#e60049]"
                />
                <div>
                  <strong>Áp dụng Toàn Hệ Thống (Global Campaign):</strong> Tất cả sản phẩm trên Trang chủ, Trang Cấp 1, Cấp 2, Combo, Quà tặng đều tự động hiển thị khung.
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-gray-800 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  checked={config.scope === 'specific'}
                  onChange={() => updateField('scope', 'specific')}
                  className="text-[#e60049] focus:ring-[#e60049]"
                />
                <div>
                  <strong>Áp dụng cho Nhóm Sản Phẩm Chọn Lọc:</strong> Chỉ những sản phẩm được đánh dấu bên dưới mới hiển thị khung đè.
                </div>
              </label>
            </div>

            {config.scope === 'specific' && (
              <div className="pt-2 border-t border-gray-100">
                <label className="text-xs font-semibold text-gray-700 block mb-2">
                  Chọn các sản phẩm được gắn khung chiến dịch:
                </label>
                <div className="max-h-56 overflow-y-auto space-y-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                  {products.map((p) => {
                    const isChecked = (config.applied_product_ids || []).includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 hover:bg-white p-1 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = config.applied_product_ids || [];
                            if (e.target.checked) {
                              updateField('applied_product_ids', [...cur, p.id]);
                            } else {
                              updateField(
                                'applied_product_ids',
                                cur.filter((id) => id !== p.id)
                              );
                            }
                          }}
                          className="text-[#e60049] rounded"
                        />
                        <span className="font-medium text-gray-900">{p.title}</span>
                        <span className="text-[10px] text-gray-400">({p.code})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải (5 cols): Sandbox Kiểm Thử Trực Quan (Live Interactive Tester) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs sticky top-4 space-y-5">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <span>👁️</span> Sandbox Xem Trước & Thử Nghiệm Tỷ Lệ
              </h3>
              <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                Live Preview
              </span>
            </div>

            {/* Bộ điều khiển Tỷ lệ (Ratio Controller) */}
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  1. Chế độ Tỷ lệ Khung hình (Aspect Ratio Mode):
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: 'preset', label: 'Preset Chuẩn' },
                    { id: 'custom', label: 'Custom W:H' },
                    { id: 'auto', label: 'Auto Gốc' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTestRatioMode(m.id as AspectRatioMode)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                        testRatioMode === m.id
                          ? 'bg-[#e60049] text-white shadow-xs'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {testRatioMode === 'preset' && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Chọn Tỉ lệ Chuẩn:
                  </label>
                  <select
                    value={testPresetRatio}
                    onChange={(e) => setTestPresetRatio(e.target.value as PresetAspectRatio)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-none"
                  >
                    <option value="3:4">3 : 4 (Bìa sách dọc chuẩn 600x800)</option>
                    <option value="4:3">4 : 3 (Thẻ Combo / Flashcard 800x600)</option>
                    <option value="1:1">1 : 1 (Khung vuông 800x800)</option>
                    <option value="16:9">16 : 9 (Banner ngang 1280x720)</option>
                    <option value="3:1">3 : 1 (Banner rộng full-width 1200x400)</option>
                    <option value="1:1.414">1 : 1.414 (Khổ A4 đọc thử watermark)</option>
                  </select>
                </div>
              )}

              {testRatioMode === 'custom' && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                    Nhập Tỉ lệ Tự Do (W : H):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={testCustomW}
                      onChange={(e) => setTestCustomW(Number(e.target.value) || 1)}
                      className="w-20 text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-center font-bold"
                      placeholder="W"
                    />
                    <span className="font-bold text-gray-500">:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={testCustomH}
                      onChange={(e) => setTestCustomH(Number(e.target.value) || 1)}
                      className="w-20 text-xs px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-center font-bold"
                      placeholder="H"
                    />
                    <span className="text-[10px] text-gray-400">
                      (VD: 5:7, 2:3, 7:10...)
                    </span>
                  </div>
                </div>
              )}

              {testRatioMode === 'auto' && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  ✓ <strong>Chế độ Tự động:</strong> Khung tự động ôm sát chính xác theo tỷ lệ thật của file ảnh tải lên mà không bị crop hay co giãn!
                </div>
              )}

              {/* Điều khiển Độ Phân Giải / Chiều rộng hiển thị */}
              <div className="pt-2 border-t border-gray-200/60 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-semibold text-gray-700">
                  <span>Chiều rộng hiển thị (Max-Width):</span>
                  <span className="text-[#e60049] font-bold">{testMaxWidth} px</span>
                </div>
                <input
                  type="range"
                  min="160"
                  max="600"
                  step="10"
                  value={testMaxWidth}
                  onChange={(e) => setTestMaxWidth(Number(e.target.value))}
                  className="w-full accent-[#e60049] cursor-pointer"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold text-gray-700">Chế độ Co giãn (Object Fit):</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTestObjectFit('cover')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        testObjectFit === 'cover'
                          ? 'bg-[#e60049] text-white'
                          : 'bg-white border text-gray-600'
                      }`}
                    >
                      Cover (Tràn đầy)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTestObjectFit('contain')}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                        testObjectFit === 'contain'
                          ? 'bg-[#e60049] text-white'
                          : 'bg-white border text-gray-600'
                      }`}
                    >
                      Contain (Giữ trọn)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chọn Sản phẩm mẫu để test */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-700">
                2. Chọn Sản phẩm mẫu thử nghiệm:
              </label>
              <select
                value={testProductId}
                onChange={(e) => setTestProductId(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Khung Hiển Thị Trực Quan (Interactive Render Canvas) */}
            <div className="bg-gray-100 rounded-xl p-4 flex flex-col items-center justify-center min-h-[340px] border border-dashed border-gray-300">
              <div className="w-full flex justify-center">
                <ProductImageFrame
                  src={sampleImg}
                  alt={selectedProduct?.title || 'Ảnh thử nghiệm'}
                  ratioMode={testRatioMode}
                  presetRatio={testPresetRatio}
                  customRatioW={testCustomW}
                  customRatioH={testCustomH}
                  maxWidthPx={testMaxWidth}
                  objectFit={testObjectFit}
                  rounded="2xl"
                  showBorder={true}
                  showShadow={true}
                  hoverEffect={true}
                  productId={selectedProduct?.id}
                  forcePresetOverlay={
                    config.is_enabled && config.frame_type === 'preset'
                      ? config.preset_name
                      : undefined
                  }
                  customCampaignFrameUrl={
                    config.is_enabled && config.frame_type === 'custom'
                      ? config.custom_frame_url
                      : undefined
                  }
                  badgeText={selectedProduct?.badge_text || 'Mới'}
                  fallbackText="Chưa có ảnh"
                />
              </div>

              <div className="mt-3 text-center">
                <div className="text-[11px] font-bold text-gray-800">
                  {selectedProduct?.title || 'Sản phẩm demo'}
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Tỷ lệ:{' '}
                  {testRatioMode === 'preset'
                    ? testPresetRatio
                    : testRatioMode === 'custom'
                    ? `${testCustomW}:${testCustomH}`
                    : 'Auto (Theo ảnh gốc)'}{' '}
                  • Chiều rộng: {testMaxWidth}px • Fit: {testObjectFit}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition text-center cursor-pointer disabled:opacity-70"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu & Áp Dụng Ngay Cho Toàn Website'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
