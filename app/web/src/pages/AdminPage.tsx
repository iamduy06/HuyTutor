import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';
import {
  CategoryItem,
  FORMAT_TO_GOOGLE_FORM_MAP,
  formatVnd,
  OrderRecord,
  Product,
  ProductFormat,
  ProductSpec,
  UI_FORMATS,
  UiFormatCode,
} from '../types';

const DEFAULT_FORMATS: ProductFormat[] = [
  { format_code: 'Word', price: 229000, is_active: true },
  { format_code: 'PDF', price: 150000, is_active: true },
  { format_code: 'Flashcard', price: 100000, is_active: true },
  { format_code: 'Trang tính', price: 120000, is_active: false },
  { format_code: 'Thiết kế', price: 180000, is_active: false },
];

export const AdminPage: React.FC = () => {
  const { refreshCatalog, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'mapping'>('products');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    syncedFormCount: 0,
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [inspectedPayload, setInspectedPayload] = useState<Record<string, string> | null>(null);

  // State cho Form Thêm mới / Chỉnh sửa Sản phẩm
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({
    title: '',
    code: '',
    slug: '',
    category_slug: 'high-school',
    sub_section: 'Đề thi thử THPT/ĐGNL',
    badge_text: 'Mới',
    google_form_product_name: '',
    cover_tag: 'Dành cho\nKỳ thi THPTQG\ntừ năm 2027',
    short_desc: '',
    thumbnail_url: '',
    preview_type: 'images',
    sample_pdf_source: 'r2',
    sample_pdf_url: '',
    watermark_enabled: true,
    watermark_text: 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
    preview_images: [],
    specs: [
      { label: 'Số lượng', val: '30 đề chuẩn cấu trúc mới nhất' },
      { label: 'Độ khó', val: 'B2 - C2 (tương đương 8.0 - 10 điểm)' },
    ],
    topics: ['Chủ đề đọc hiểu bám sát định hướng ra đề mới nhất của Bộ GD&ĐT'],
    features: ['Giải thích chi tiết từng câu hỏi và bảng từ vựng mở rộng phong phú'],
    is_combo_eligible: true,
    is_active: true,
    formats: DEFAULT_FORMATS,
  });

  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [newPreviewImageUrl, setNewPreviewImageUrl] = useState('');

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getAdminOverview();
      setStats(data.stats);
      setProducts(data.products);
      setCategories(data.categories);
      setOrders(data.orders);
    } catch (err: any) {
      showToast(err?.message || 'Lỗi tải dữ liệu Admin từ Backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleSelectProductToEdit = (prod: Product) => {
    const mergedFormats: ProductFormat[] = UI_FORMATS.map((code) => {
      const found = prod.formats.find((f) => f.format_code === code);
      return found || { format_code: code, price: 150000, is_active: false };
    });

    setEditingProduct({
      ...prod,
      formats: mergedFormats,
      specs: prod.specs?.length ? [...prod.specs] : [{ label: 'Số lượng', val: '30 đề' }],
      topics: prod.topics?.length ? [...prod.topics] : ['Chủ đề trọng tâm'],
      features: prod.features?.length ? [...prod.features] : ['Giải thích chi tiết'],
      preview_images: prod.preview_images ? [...prod.preview_images] : [],
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetNewProduct = () => {
    setEditingProduct({
      id: undefined,
      title: '',
      code: '',
      slug: '',
      category_slug: 'high-school',
      sub_section: 'Đề thi thử THPT/ĐGNL',
      badge_text: 'Mới',
      google_form_product_name: '',
      cover_tag: 'Dành cho\nKỳ thi THPTQG\ntừ năm 2027',
      short_desc: '',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
      preview_images: [],
      specs: [{ label: 'Số lượng', val: '30 đề chuẩn cấu trúc' }],
      topics: ['Chủ đề trọng tâm bám sát đề thi chính thức'],
      features: ['Giải thích chi tiết kèm bảng từ vựng mở rộng'],
      is_combo_eligible: true,
      is_active: true,
      formats: DEFAULT_FORMATS.map((f) => ({ ...f })),
    });
  };

  // Upload file ảnh bìa Thumbnail trực tiếp lên Cloudflare R2 qua Backend API
  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingThumb(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'thumbnails');

      const res = await apiClient.uploadFileDirect(formData);

      setEditingProduct((prev) => ({
        ...prev,
        thumbnail_url: res.publicUrl,
      }));
      showToast(`Tải ảnh lên Cloudflare R2 thành công! Link: ${res.publicUrl}`);
    } catch (err: any) {
      showToast(err?.message || 'Lỗi upload ảnh bìa lên R2.');
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleFormatChange = (
    formatCode: UiFormatCode,
    field: 'price' | 'is_active',
    value: number | boolean
  ) => {
    setEditingProduct((prev) => {
      const current = prev.formats || DEFAULT_FORMATS;
      const updated = current.map((fmt) =>
        fmt.format_code === formatCode ? { ...fmt, [field]: value } : fmt
      );
      return { ...prev, formats: updated };
    });
  };

  // Quản lý Repeater Specs
  const handleSpecChange = (idx: number, key: keyof ProductSpec, val: string) => {
    setEditingProduct((prev) => {
      const list = [...(prev.specs || [])];
      list[idx] = { ...list[idx], [key]: val };
      return { ...prev, specs: list };
    });
  };

  const handleAddSpec = () => {
    setEditingProduct((prev) => ({
      ...prev,
      specs: [...(prev.specs || []), { label: 'Thông số mới', val: 'Nội dung thông số' }],
    }));
  };

  const handleRemoveSpec = (idx: number) => {
    setEditingProduct((prev) => ({
      ...prev,
      specs: (prev.specs || []).filter((_, i) => i !== idx),
    }));
  };

  // Quản lý Repeater Topics
  const handleTopicChange = (idx: number, val: string) => {
    setEditingProduct((prev) => {
      const list = [...(prev.topics || [])];
      list[idx] = val;
      return { ...prev, topics: list };
    });
  };

  const handleAddTopic = () => {
    setEditingProduct((prev) => ({
      ...prev,
      topics: [...(prev.topics || []), 'Chủ đề mới trong bộ tài liệu'],
    }));
  };

  const handleRemoveTopic = (idx: number) => {
    setEditingProduct((prev) => ({
      ...prev,
      topics: (prev.topics || []).filter((_, i) => i !== idx),
    }));
  };

  // Quản lý Repeater Features
  const handleFeatureChange = (idx: number, val: string) => {
    setEditingProduct((prev) => {
      const list = [...(prev.features || [])];
      list[idx] = val;
      return { ...prev, features: list };
    });
  };

  const handleAddFeature = () => {
    setEditingProduct((prev) => ({
      ...prev,
      features: [...(prev.features || []), 'Đặc điểm nổi bật mới'],
    }));
  };

  const handleRemoveFeature = (idx: number) => {
    setEditingProduct((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== idx),
    }));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct.title?.trim()) {
      showToast('Vui lòng nhập Tên tài liệu.');
      return;
    }

    setSaving(true);
    try {
      const res = await apiClient.upsertProduct(editingProduct);
      showToast(res.message);
      await loadOverview();
      await refreshCatalog();
      setEditingProduct(res.product);
    } catch (err: any) {
      showToast(err?.message || 'Lỗi lưu sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (slug: string) => {
    try {
      const res = await apiClient.deleteProduct(slug);
      showToast(res.message);
      await loadOverview();
      await refreshCatalog();
    } catch (err: any) {
      showToast(err?.message || 'Lỗi xóa sản phẩm.');
    }
  };

  const handleResyncOrderForm = async (orderCode: string) => {
    try {
      const res = await apiClient.resyncOrderGoogleForm(orderCode);
      const firstSub = res.syncResult.submissions[0];
      if (firstSub) {
        setInspectedPayload(firstSub.payload);
      }
      showToast(`Đã bắn lại 14 entry đơn ${orderCode} vào Google Form thành công.`);
      await loadOverview();
    } catch (err: any) {
      showToast(err?.message || 'Lỗi bắn lại Google Form.');
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-14">
      {/* Top Admin Header */}
      <div className="bg-[#e60049] text-white py-5 px-4 shadow-sm">
        <div className="max-w-[1220px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider opacity-90">
              HỆ THỐNG QUẢN TRỊ TRUNG TÂM • HUYTUTOR.EDU.VN
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold mt-0.5">
              Trang Quản trị Hệ thống Huy Tutor
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="bg-white text-[#e60049] font-bold text-xs px-3.5 py-1.5 rounded-sm hover:bg-gray-100 transition"
            >
              Xem Trang chủ Storefront
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1220px] mx-auto px-4 pt-6 space-y-6">
        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
            <div className="text-[11px] text-gray-500 font-semibold">Tổng sản phẩm trong DB</div>
            <div className="text-xl font-black text-gray-900 mt-1">
              {stats.totalProducts}{' '}
              <span className="text-xs font-semibold text-emerald-600">
                ({stats.activeProducts} đang hiển thị)
              </span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
            <div className="text-[11px] text-gray-500 font-semibold">Tổng đơn hàng</div>
            <div className="text-xl font-black text-gray-900 mt-1">
              {stats.totalOrders}{' '}
              <span className="text-xs font-semibold text-[#e60049]">
                ({stats.paidOrders} đã thanh toán)
              </span>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
            <div className="text-[11px] text-gray-500 font-semibold">Doanh thu đã đối soát</div>
            <div className="text-xl font-black text-[#e60049] mt-1">
              {formatVnd(stats.totalRevenue)}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
            <div className="text-[11px] text-gray-500 font-semibold">
              Đồng bộ 14 Entry Google Form
            </div>
            <div className="text-xl font-black text-emerald-700 mt-1">
              {stats.syncedFormCount}/{stats.totalOrders} đơn
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-sm text-xs font-bold transition ${
              activeTab === 'products'
                ? 'bg-[#e60049] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-[#e60049]'
            }`}
          >
            1. Quản lý Sản phẩm, 5 Định dạng &amp; Đọc thử Watermark
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-sm text-xs font-bold transition ${
              activeTab === 'orders'
                ? 'bg-[#e60049] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-[#e60049]'
            }`}
          >
            2. Quản lý Đơn hàng &amp; Nhật ký 14 Entry Google Form
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('mapping')}
            className={`px-4 py-2 rounded-sm text-xs font-bold transition ${
              activeTab === 'mapping'
                ? 'bg-[#e60049] text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-[#e60049]'
            }`}
          >
            3. Bảng Đối soát Đơn hàng &amp; Tự động hóa
          </button>
        </div>

        {/* TAB 1: QUẢN LÝ SẢN PHẨM & 5 ĐỊNH DẠNG */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cột trái: Danh sách sản phẩm trong DB */}
            <div className="lg:col-span-5 bg-white border border-gray-200 rounded-md p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-xs font-extrabold text-[#e60049] uppercase">
                  Danh sách tài liệu ({products.length})
                </h2>
                <button
                  type="button"
                  onClick={handleResetNewProduct}
                  className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-[11px] px-3 py-1.5 rounded-sm"
                >
                  Thêm tài liệu mới
                </button>
              </div>

              {loading ? (
                <div className="text-xs text-gray-500 py-8 text-center">
                  Đang tải dữ liệu...
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[820px] overflow-y-auto pr-1">
                  {products.map((prod) => (
                    <div
                      key={prod.id}
                      className={`p-3 rounded-md border transition ${
                        editingProduct.slug === prod.slug
                          ? 'border-[#e60049] bg-[#fff5f7]'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block bg-[#e60049] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm mr-1.5">
                            {prod.badge_text || 'Mới'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold">
                            {prod.category_name} • {prod.sub_section}
                          </span>
                          <h3 className="text-xs font-bold text-gray-900 mt-1">{prod.title}</h3>
                          <div className="text-[10px] text-gray-500 mt-0.5">
                            Slug: <code>/{prod.category_slug}/{prod.slug}</code> • Đọc thử:{' '}
                            <strong>{prod.preview_type.toUpperCase()}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-2">
                        {prod.formats
                          .filter((f) => f.is_active)
                          .map((f) => (
                            <span
                              key={f.format_code}
                              className="text-[10px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-sm font-medium text-gray-700"
                            >
                              {f.format_code}: {formatVnd(f.price)}
                            </span>
                          ))}
                      </div>

                      <div className="flex items-center justify-end gap-2 mt-2.5 pt-2 border-t border-gray-100">
                        <Link
                          to={`/${prod.category_slug}/${prod.slug}`}
                          className="text-[11px] text-gray-600 hover:text-[#e60049] font-semibold"
                        >
                          Xem trang
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleSelectProductToEdit(prod)}
                          className="px-2.5 py-1 bg-[#e60049] text-white text-[10px] font-bold rounded-sm"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.slug)}
                          className="px-2 py-1 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-[#e60049] text-[10px] font-bold rounded-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cột phải: Form cấu hình chi tiết Sản phẩm */}
            <form
              onSubmit={handleSaveProduct}
              className="lg:col-span-7 bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-5"
            >
              <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
                    {editingProduct.id
                      ? `Chỉnh sửa: ${editingProduct.title}`
                      : 'Tạo tài liệu mới vào Database'}
                  </h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Mọi thay đổi sẽ được cập nhật trực tiếp vào hệ thống
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-2 rounded-sm transition"
                >
                  {saving ? 'Đang lưu...' : 'Lưu cấu hình sản phẩm'}
                </button>
              </div>

              {/* 1. Thông tin cơ bản */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Tên hiển thị tài liệu (Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        title: e.target.value,
                        google_form_product_name:
                          prev.google_form_product_name || e.target.value,
                      }))
                    }
                    className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#e60049] mb-1">
                    Tên sản phẩm chuẩn gửi vào Google Form (`entry.2088729906`) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.google_form_product_name || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        google_form_product_name: e.target.value,
                      }))
                    }
                    className="w-full border border-[#e60049]/50 bg-[#fff5f7]/30 rounded-sm px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Mã sách (Code) &amp; Đường dẫn Slug
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Mã: B2C2-30"
                      value={editingProduct.code || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, code: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="slug-tai-lieu"
                      value={editingProduct.slug || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({ ...prev, slug: e.target.value }))
                      }
                      className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Danh mục &amp; Nhóm con (Sub-section)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={editingProduct.category_slug || 'high-school'}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          category_slug: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-sm px-2 py-1.5 text-xs bg-white"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Đề thi thử THPT/ĐGNL"
                      value={editingProduct.sub_section || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          sub_section: e.target.value,
                        }))
                      }
                      className="w-full border border-gray-300 rounded-sm px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Link Ảnh bìa Thumbnail (Cloudflare R2): Cho phép Paste Link hoặc Upload trực tiếp lên R2 */}
              <div className="bg-[#fff5f7] border border-pink-200 rounded-md p-4 space-y-2.5">
                <label className="block text-xs font-extrabold text-[#e60049]">
                  Link Ảnh bìa Thumbnail (Cloudflare R2 - media.huytutor.edu.vn)
                </label>
                <p className="text-[11px] text-gray-600">
                  Hỗ trợ dán trực tiếp link ảnh có sẵn hoặc chọn ảnh từ máy tính để tải thẳng lên
                  lưu trữ Cloudflare R2:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={editingProduct.thumbnail_url || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        thumbnail_url: e.target.value,
                      }))
                    }
                    placeholder="https://media.huytutor.edu.vn/thumbnails/bia-sach.png"
                    className="flex-1 border border-gray-300 rounded-sm px-3 py-2 text-xs bg-white"
                  />
                  <label className="shrink-0 bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3.5 py-2 rounded-sm cursor-pointer text-center">
                    {uploadingThumb ? 'Đang tải lên R2...' : 'Tải ảnh lên R2'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                {editingProduct.thumbnail_url && (
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={editingProduct.thumbnail_url}
                      alt="Preview Thumbnail"
                      className="w-12 h-16 object-cover rounded-sm border border-gray-300"
                    />
                    <span className="text-[11px] text-emerald-700 font-semibold break-all">
                      Đang sử dụng: {editingProduct.thumbnail_url}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Bảng cấu hình 5 Định dạng & Giá riêng biệt + Ánh xạ Google Form tự động */}
              <div className="border border-gray-200 rounded-md p-4 space-y-3">
                <div className="text-xs font-extrabold text-gray-900 uppercase">
                  Cấu hình 5 Định dạng hiển thị &amp; Giá bán riêng biệt (`product_formats`)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100 text-gray-800 font-bold">
                        <th className="border border-gray-200 p-2 text-left">Bật bán</th>
                        <th className="border border-gray-200 p-2 text-left">
                          Định dạng trên Web
                        </th>
                        <th className="border border-gray-200 p-2 text-left">
                          Ánh xạ sang Ghi chú Google Form (`entry.906534887`)
                        </th>
                        <th className="border border-gray-200 p-2 text-left">Giá bán (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(editingProduct.formats || DEFAULT_FORMATS).map((fmt) => (
                        <tr key={fmt.format_code}>
                          <td className="border border-gray-200 p-2 text-center">
                            <input
                              type="checkbox"
                              checked={fmt.is_active}
                              onChange={(e) =>
                                handleFormatChange(
                                  fmt.format_code,
                                  'is_active',
                                  e.target.checked
                                )
                              }
                              className="accent-[#e60049] w-4 h-4"
                            />
                          </td>
                          <td className="border border-gray-200 p-2 font-bold text-gray-900">
                            {fmt.format_code}
                          </td>
                          <td className="border border-gray-200 p-2 text-[#e60049] font-bold">
                            {FORMAT_TO_GOOGLE_FORM_MAP[fmt.format_code]}
                          </td>
                          <td className="border border-gray-200 p-2">
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={fmt.price}
                              onChange={(e) =>
                                handleFormatChange(
                                  fmt.format_code,
                                  'price',
                                  Number(e.target.value)
                                )
                              }
                              className="w-32 border border-gray-300 rounded-sm px-2 py-1 text-xs font-bold"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Cấu hình Chế độ Đọc thử (PDF hoặc Ảnh dọc) & Watermark Bắt buộc */}
              <div className="border border-gray-200 rounded-md p-4 space-y-3 bg-gray-50/60">
                <div className="text-xs font-extrabold text-[#e60049] uppercase">
                  Chế độ Đọc thử (Chỉ hiển thị 1 chế độ duy nhất) &amp; Watermark Bản quyền
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { code: 'images', label: 'Hiển thị các trang Ảnh A4 dọc' },
                    { code: 'pdf', label: 'Nhúng trình đọc PDF trực tiếp' },
                    { code: 'none', label: 'Ẩn khu vực đọc thử' },
                  ].map((mode) => (
                    <label
                      key={mode.code}
                      className={`p-2.5 border rounded-sm text-xs font-bold cursor-pointer flex items-center gap-2 ${
                        editingProduct.preview_type === mode.code
                          ? 'border-[#e60049] bg-[#fff5f7] text-[#e60049]'
                          : 'border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="preview_type"
                        checked={editingProduct.preview_type === mode.code}
                        onChange={() =>
                          setEditingProduct((prev) => ({
                            ...prev,
                            preview_type: mode.code as 'pdf' | 'images' | 'none',
                          }))
                        }
                        className="accent-[#e60049]"
                      />
                      {mode.label}
                    </label>
                  ))}
                </div>

                {editingProduct.preview_type === 'pdf' && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-700">
                      <span>Nguồn file PDF đọc thử:</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={editingProduct.sample_pdf_source === 'r2'}
                          onChange={() =>
                            setEditingProduct((prev) => ({
                              ...prev,
                              sample_pdf_source: 'r2',
                            }))
                          }
                          className="accent-[#e60049]"
                        />
                        Tải file PDF lên Cloudflare R2 (Tự động đóng dấu Watermark pdf-lib)
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={editingProduct.sample_pdf_source === 'drive'}
                          onChange={() =>
                            setEditingProduct((prev) => ({
                              ...prev,
                              sample_pdf_source: 'drive',
                            }))
                          }
                          className="accent-[#e60049]"
                        />
                        Link Google Drive Preview
                      </label>
                    </div>
                    <input
                      type="text"
                      value={editingProduct.sample_pdf_url || ''}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          sample_pdf_url: e.target.value,
                        }))
                      }
                      placeholder="https://media.huytutor.edu.vn/samples/de-doc-thu-watermarked.pdf"
                      className="w-full border border-gray-300 rounded-sm px-3 py-1.5 text-xs bg-white"
                    />
                  </div>
                )}

                {editingProduct.preview_type === 'images' && (
                  <div className="space-y-2 pt-2">
                    <label className="block text-[11px] font-bold text-gray-700">
                      Danh sách Link Ảnh đọc thử trên Cloudflare R2 (`preview_images`):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newPreviewImageUrl}
                        onChange={(e) => setNewPreviewImageUrl(e.target.value)}
                        placeholder="https://media.huytutor.edu.vn/previews/trang-1.png"
                        className="flex-1 border border-gray-300 rounded-sm px-3 py-1.5 text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newPreviewImageUrl.trim()) return;
                          setEditingProduct((prev) => ({
                            ...prev,
                            preview_images: [
                              ...(prev.preview_images || []),
                              newPreviewImageUrl.trim(),
                            ],
                          }));
                          setNewPreviewImageUrl('');
                        }}
                        className="bg-[#e60049] text-white font-bold text-xs px-3 py-1.5 rounded-sm"
                      >
                        Thêm trang ảnh
                      </button>
                    </div>
                    {(editingProduct.preview_images || []).length > 0 && (
                      <div className="space-y-1">
                        {(editingProduct.preview_images || []).map((url, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white border border-gray-200 px-2.5 py-1 rounded-sm text-[11px]"
                          >
                            <span className="truncate max-w-md">
                              Trang {idx + 1}: {url}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  preview_images: (prev.preview_images || []).filter(
                                    (_, i) => i !== idx
                                  ),
                                }))
                              }
                              className="text-[#e60049] font-bold ml-2"
                            >
                              Xóa
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Watermark Text */}
                <div className="pt-2 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-800 shrink-0">
                    <input
                      type="checkbox"
                      checked={editingProduct.watermark_enabled ?? true}
                      onChange={(e) =>
                        setEditingProduct((prev) => ({
                          ...prev,
                          watermark_enabled: e.target.checked,
                        }))
                      }
                      className="accent-[#e60049] w-4 h-4"
                    />
                    Bật lớp phủ Watermark bắt buộc:
                  </label>
                  <input
                    type="text"
                    value={editingProduct.watermark_text || ''}
                    onChange={(e) =>
                      setEditingProduct((prev) => ({
                        ...prev,
                        watermark_text: e.target.value,
                      }))
                    }
                    className="flex-1 border border-gray-300 rounded-sm px-2.5 py-1 text-xs bg-white"
                  />
                </div>
              </div>

              {/* 5. Ba khối Dynamic Repeaters: Specs, Topics, Features */}
              <div className="space-y-4">
                {/* Repeater 1: Specs */}
                <div className="border border-gray-200 rounded-md p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-800">
                      Thông số kỹ thuật (`specs` JSONB)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="px-2.5 py-1 bg-[#fff0f3] text-[#e60049] border border-[#e60049]/30 text-[11px] font-bold rounded-sm"
                    >
                      Thêm dòng thông số
                    </button>
                  </div>
                  {(editingProduct.specs || []).map((sp, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={sp.label}
                        onChange={(e) => handleSpecChange(idx, 'label', e.target.value)}
                        placeholder="Nhãn (VD: Số lượng)"
                        className="w-1/3 border border-gray-300 rounded-sm px-2.5 py-1 text-xs"
                      />
                      <input
                        type="text"
                        value={sp.val}
                        onChange={(e) => handleSpecChange(idx, 'val', e.target.value)}
                        placeholder="Giá trị (VD: 30 đề chuẩn cấu trúc)"
                        className="flex-1 border border-gray-300 rounded-sm px-2.5 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(idx)}
                        className="text-xs font-bold text-gray-500 hover:text-[#e60049] px-1.5"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>

                {/* Repeater 2: Topics */}
                <div className="border border-gray-200 rounded-md p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-800">
                      Các chủ đề trọng tâm (`topics` JSONB)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddTopic}
                      className="px-2.5 py-1 bg-[#fff0f3] text-[#e60049] border border-[#e60049]/30 text-[11px] font-bold rounded-sm"
                    >
                      Thêm chủ đề
                    </button>
                  </div>
                  {(editingProduct.topics || []).map((tp, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={tp}
                        onChange={(e) => handleTopicChange(idx, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-sm px-2.5 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTopic(idx)}
                        className="text-xs font-bold text-gray-500 hover:text-[#e60049] px-1.5"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>

                {/* Repeater 3: Features */}
                <div className="border border-gray-200 rounded-md p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-gray-800">
                      Đặc điểm nổi bật (`features` JSONB)
                    </span>
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="px-2.5 py-1 bg-[#fff0f3] text-[#e60049] border border-[#e60049]/30 text-[11px] font-bold rounded-sm"
                    >
                      Thêm đặc điểm
                    </button>
                  </div>
                  {(editingProduct.features || []).map((ft, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={ft}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        className="flex-1 border border-gray-300 rounded-sm px-2.5 py-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(idx)}
                        className="text-xs font-bold text-gray-500 hover:text-[#e60049] px-1.5"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs py-2.5 rounded-sm transition"
              >
                {saving ? 'Đang lưu vào Database qua Backend...' : 'Lưu cấu hình sản phẩm'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ ĐƠN HÀNG & BẮN LẠI 14 ENTRY GOOGLE FORM */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
              Danh sách Đơn hàng &amp; Trạng thái Đồng bộ 14 Entry Google Form
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-gray-800 font-bold">
                    <th className="border border-gray-200 p-2.5 text-left">Mã đơn</th>
                    <th className="border border-gray-200 p-2.5 text-left">Khách hàng / Gmail</th>
                    <th className="border border-gray-200 p-2.5 text-left">
                      Định dạng &rarr; Ghi chú Form
                    </th>
                    <th className="border border-gray-200 p-2.5 text-left">Xuất HĐ VAT</th>
                    <th className="border border-gray-200 p-2.5 text-left">Tổng tiền</th>
                    <th className="border border-gray-200 p-2.5 text-left">Trạng thái</th>
                    <th className="border border-gray-200 p-2.5 text-left">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2.5 font-extrabold text-[#e60049]">
                        {ord.order_code}
                      </td>
                      <td className="border border-gray-200 p-2.5">
                        <div className="font-bold text-gray-900">{ord.customer_name}</div>
                        <div className="text-[11px] text-gray-500">
                          {ord.customer_email} • {ord.customer_group}
                        </div>
                      </td>
                      <td className="border border-gray-200 p-2.5">
                        <span className="font-bold">{ord.selected_format}</span> &rarr;{' '}
                        <span className="text-[#e60049] font-bold">
                          {FORMAT_TO_GOOGLE_FORM_MAP[ord.selected_format]}
                        </span>
                      </td>
                      <td className="border border-gray-200 p-2.5 text-[11px]">
                        {ord.need_invoice ? (
                          <span className="text-gray-800">
                            MST/CCCD: {ord.invoice_tax_or_cccd}
                            <br />
                            Đ/c: {ord.invoice_address}
                          </span>
                        ) : (
                          <span className="text-gray-400">Không (Gửi trống "")</span>
                        )}
                      </td>
                      <td className="border border-gray-200 p-2.5 font-extrabold text-gray-900">
                        {formatVnd(ord.total_amount)}
                      </td>
                      <td className="border border-gray-200 p-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                            ord.payment_status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {ord.payment_status.toUpperCase()}
                        </span>
                        <div className="text-[10px] mt-1">
                          Form:{' '}
                          <strong>
                            {ord.google_form_submitted ? 'Đã gửi 14 Entry' : 'Chưa gửi'}
                          </strong>
                        </div>
                      </td>
                      <td className="border border-gray-200 p-2.5">
                        <button
                          type="button"
                          onClick={() => handleResyncOrderForm(ord.order_code)}
                          className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-[11px] px-2.5 py-1 rounded-sm"
                        >
                          Bắn lại Google Form
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {inspectedPayload && (
              <div className="bg-gray-900 text-emerald-400 p-4 rounded-md text-xs font-mono overflow-x-auto">
                <div className="text-white font-sans font-bold mb-2">
                  Payload 14 Entry vừa gửi tới Google Form (`formResponse`):
                </div>
                <pre>{JSON.stringify(inspectedPayload, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: BẢNG ĐỐI SOÁT 14 ENTRY GOOGLE FORM */}
        {activeTab === 'mapping' && (
          <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
              Bảng đối soát 14 Entry IDs Google Form (`1FAIpQLSdz1BLDnkEDLz0fWfhkLhB6SknNSVFUI6UDsLU2cEvIKTVN2Q`)
            </h2>
            <p className="text-xs text-gray-600">
              Hệ thống tự động đồng bộ đơn hàng vào Google Form ngay sau khi xác nhận thanh toán thành công:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-[#e60049] text-white font-bold">
                    <th className="border border-gray-200 p-2 text-left">STT</th>
                    <th className="border border-gray-200 p-2 text-left">Entry ID</th>
                    <th className="border border-gray-200 p-2 text-left">Tên trường trên Form</th>
                    <th className="border border-gray-200 p-2 text-left">Quy tắc điền tự động</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr>
                    <td className="border p-2">1</td>
                    <td className="border p-2 font-mono font-bold">entry.528749633</td>
                    <td className="border p-2 font-bold">Tên khách hàng</td>
                    <td className="border p-2">Lấy từ `order.customer_name`</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border p-2">2</td>
                    <td className="border p-2 font-mono font-bold">entry.598112260</td>
                    <td className="border p-2 font-bold">Ngày bán</td>
                    <td className="border p-2">Tự động chuẩn `YYYY-MM-DD` (Múi giờ VN)</td>
                  </tr>
                  <tr>
                    <td className="border p-2">3</td>
                    <td className="border p-2 font-mono font-bold">entry.1044261621</td>
                    <td className="border p-2 font-bold">Giờ bán</td>
                    <td className="border p-2">Tự động chuẩn `HH:mm` (Múi giờ VN)</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border p-2">4</td>
                    <td className="border p-2 font-mono font-bold">entry.681163783</td>
                    <td className="border p-2 font-bold">Địa chỉ</td>
                    <td className="border p-2">
                      Chỉ điền khi khách tích chọn `need_invoice = true`, ngược lại gửi trống `""`
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">5</td>
                    <td className="border p-2 font-mono font-bold">entry.575498379</td>
                    <td className="border p-2 font-bold">MST / CCCD</td>
                    <td className="border p-2">
                      Chỉ điền khi khách tích chọn `need_invoice = true`, ngược lại gửi trống `""`
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border p-2">6</td>
                    <td className="border p-2 font-mono font-bold">entry.2088729906</td>
                    <td className="border p-2 font-bold">Sản phẩm</td>
                    <td className="border p-2">Lấy từ `product.google_form_product_name`</td>
                  </tr>
                  <tr>
                    <td className="border p-2">7</td>
                    <td className="border p-2 font-mono font-bold">entry.801296064</td>
                    <td className="border p-2 font-bold">Số tiền</td>
                    <td className="border p-2">Số tiền thực thu sau chiết khấu Combo</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border p-2">8</td>
                    <td className="border p-2 font-mono font-bold">entry.906534887</td>
                    <td className="border p-2 font-bold">Ghi chú</td>
                    <td className="border p-2 font-bold text-[#e60049]">
                      Word &rarr; Word dài | PDF &rarr; PDF dài | Flashcard &rarr; Flashcard | Trang
                      tính &rarr; Trang tính | Thiết kế &rarr; Thiết kế
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">9</td>
                    <td className="border p-2 font-mono font-bold">entry.1610762805</td>
                    <td className="border p-2 font-bold">Gmail</td>
                    <td className="border p-2">Gmail khách hàng đã xác thực 2 lớp</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border p-2">10</td>
                    <td className="border p-2 font-mono font-bold">entry.1680953650</td>
                    <td className="border p-2 font-bold">Nhóm khách hàng</td>
                    <td className="border p-2">Giáo viên / Học sinh / Phụ huynh / Khác</td>
                  </tr>
                  <tr>
                    <td className="border p-2">11</td>
                    <td className="border p-2 font-mono font-bold">entry.112780521</td>
                    <td className="border p-2 font-bold">Trừ điểm tích lũy</td>
                    <td className="border p-2">Luôn gửi chuỗi rỗng `""`</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border p-2">12</td>
                    <td className="border p-2 font-mono font-bold">entry.242891304</td>
                    <td className="border p-2 font-bold">Số lượng</td>
                    <td className="border p-2">
                      Chỉ điền số lượng tài khoản khi định dạng là `Flashcard`, còn lại để trống `""`
                    </td>
                  </tr>
                  <tr>
                    <td className="border p-2">13</td>
                    <td className="border p-2 font-mono font-bold">entry.317416358</td>
                    <td className="border p-2 font-bold">Đơn vị khác</td>
                    <td className="border p-2">Luôn gửi chuỗi rỗng `""`</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border p-2">14</td>
                    <td className="border p-2 font-mono font-bold">entry.118891792</td>
                    <td className="border p-2 font-bold">Người bán</td>
                    <td className="border p-2 font-bold text-[#e60049]">Luôn mặc định là "Website"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

