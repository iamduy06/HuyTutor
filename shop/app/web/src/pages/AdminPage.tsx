import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useStore } from '../context/StoreContext';
import { AdminHomepageCms } from '../components/AdminHomepageCms';
import { AdminCategoryCms } from '../components/AdminCategoryCms';
import { AdminComboCms } from '../components/AdminComboCms';
import { AdminFlashcardCms } from '../components/AdminFlashcardCms';
import { AdminUtilityPagesCms } from '../components/AdminUtilityPagesCms';
import { AdminProductDetailBuilder } from '../components/AdminProductDetailBuilder';
import { buildInitialDetailBlocksFromProduct } from '../components/DynamicProductDetailBlocks';
import {
  AdminUserRecord,
  CategoryItem,
  FooterPolicyLink,
  FooterSocialLink,
  FORMAT_TO_GOOGLE_FORM_MAP,
  formatVnd,
  MenuItem,
  MenuItemChild,
  OrderRecord,
  Product,
  ProductDetailBlockItem,
  ProductFormat,
  ProductHeroBlockConfig,
  ProductIntroBlockConfig,
  ProductSpec,
  SampleGroupsBlockConfig,
  TopicAccordionBlockConfig,
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
  const {
    menus: storeMenus,
    siteConfigs,
    updateSiteConfig,
    refreshCatalog,
    showToast,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'homepage_cms' | 'category_cms' | 'combo_cms' | 'flashcard_cms' | 'utility_cms' | 'products' | 'orders' | 'mapping' | 'users' | 'configs'
  >('homepage_cms');
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
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'admin' | 'subadmin' | 'user'>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'active' | 'blocked'>('ALL');
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 20;
  const [inspectedPayload, setInspectedPayload] = useState<Record<string, string> | null>(null);

  // State cho Tab 5: Cấu hình Menu Header & Footer
  const [adminMenus, setAdminMenus] = useState<MenuItem[]>([]);
  const [adminSocials, setAdminSocials] = useState<FooterSocialLink[]>([]);
  const [adminPolicies, setAdminPolicies] = useState<FooterPolicyLink[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    if (storeMenus && storeMenus.length > 0) {
      setAdminMenus(storeMenus);
    }
  }, [storeMenus]);

  useEffect(() => {
    if (siteConfigs?.footer_social_links) {
      setAdminSocials(siteConfigs.footer_social_links);
    }
    if (siteConfigs?.footer_policy_links) {
      setAdminPolicies(siteConfigs.footer_policy_links);
    }
  }, [siteConfigs]);

  const handleSaveMenus = async () => {
    setSavingConfig(true);
    try {
      await apiClient.updateMenus(adminMenus);
      await refreshCatalog();
      showToast('Đã lưu cấu hình danh sách Menu Header thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi lưu cấu hình Menu Header.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSaveSocials = async () => {
    setSavingConfig(true);
    try {
      await updateSiteConfig('footer_social_links', adminSocials);
      showToast('Đã lưu cấu hình Mạng xã hội Footer thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi lưu cấu hình Mạng xã hội.');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleSavePolicies = async () => {
    setSavingConfig(true);
    try {
      await updateSiteConfig('footer_policy_links', adminPolicies);
      showToast('Đã lưu cấu hình Liên kết chính sách Footer thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi lưu cấu hình Chính sách.');
    } finally {
      setSavingConfig(false);
    }
  };

  // State cho Form Thêm mới / Chỉnh sửa Sản phẩm (Không hardcode giá trị mẫu giả)
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({
    title: '',
    code: '',
    slug: '',
    category_slug: 'high-school',
    sub_section: '',
    badge_text: '',
    google_form_product_name: '',
    cover_tag: '',
    short_desc: '',
    thumbnail_url: '',
    preview_type: 'images',
    sample_pdf_source: 'r2',
    sample_pdf_url: '',
    watermark_enabled: false,
    watermark_text: '',
    preview_images: [],
    specs: [],
    topics: [],
    features: [],
    detail_blocks: [],
    is_combo_eligible: true,
    is_active: true,
    formats: DEFAULT_FORMATS,
  });

  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [newPreviewImageUrl, setNewPreviewImageUrl] = useState('');

  const loadOverview = async () => {
    setLoading(true);
    try {
      const [data, usersRes] = await Promise.all([
        apiClient.getAdminOverview(),
        apiClient.getAdminUsers().catch(() => ({ ok: true, users: [] })),
      ]);
      setStats(data.stats);
      setProducts(data.products);
      setCategories(data.categories);
      setOrders(data.orders);
      setAdminUsers(usersRes.users || []);
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

    const initialBlocks: ProductDetailBlockItem[] =
      Array.isArray(prod.detail_blocks) && prod.detail_blocks.length > 0
        ? prod.detail_blocks
        : buildInitialDetailBlocksFromProduct(prod);

    setEditingProduct({
      ...prod,
      formats: mergedFormats,
      specs: prod.specs?.length ? [...prod.specs] : [],
      topics: prod.topics?.length ? [...prod.topics] : [],
      features: prod.features?.length ? [...prod.features] : [],
      preview_images: prod.preview_images ? [...prod.preview_images] : [],
      detail_blocks: initialBlocks,
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
      sub_section: '',
      badge_text: '',
      google_form_product_name: '',
      cover_tag: '',
      short_desc: '',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: false,
      watermark_text: '',
      preview_images: [],
      specs: [],
      topics: [],
      features: [],
      detail_blocks: [],
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
      const oldThumb = editingProduct.thumbnail_url;
      const res = await apiClient.uploadFile(file, {
        folder: 'thumbnails',
        pageLevel1: editingProduct.category_name || 'San pham',
        pageLevel2: editingProduct.title || editingProduct.slug || 'Thumbnail',
      });

      if (oldThumb && oldThumb !== res.url) {
        apiClient.deleteR2File(oldThumb).catch(() => {});
      }

      setEditingProduct((prev) => ({
        ...prev,
        thumbnail_url: res.url,
      }));
      showToast(`Tải ảnh lên Cloudflare R2 thành công!`);
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
      const blocks = Array.isArray(editingProduct.detail_blocks)
        ? editingProduct.detail_blocks
        : [];
      const payloadToSave: Partial<Product> = { ...editingProduct };

      // Đồng bộ ngược từ detail_blocks sang các cột cấp cao nhất để tương thích hoàn toàn
      const heroBlock = blocks.find((b) => b.type === 'product_hero');
      if (heroBlock?.config) {
        const hCfg = heroBlock.config as ProductHeroBlockConfig;
        if (hCfg.image_url) payloadToSave.thumbnail_url = hCfg.image_url;
        if (Array.isArray(hCfg.specs) && hCfg.specs.length > 0) {
          payloadToSave.specs = hCfg.specs;
        }
      }

      const introBlock = blocks.find((b) => b.type === 'product_intro');
      if (introBlock?.config) {
        const iCfg = introBlock.config as ProductIntroBlockConfig;
        if (Array.isArray(iCfg.paragraphs) && iCfg.paragraphs.length > 0) {
          payloadToSave.short_desc = iCfg.paragraphs[0];
        }
        if (Array.isArray(iCfg.bullets) && iCfg.bullets.length > 0) {
          payloadToSave.features = iCfg.bullets.map((b) => b.text).filter(Boolean);
        }
      }

      const topicBlock = blocks.find((b) => b.type === 'topic_accordion');
      if (topicBlock?.config) {
        const tCfg = topicBlock.config as TopicAccordionBlockConfig;
        const firstAcc = (tCfg.accordions || [])[0];
        if (firstAcc && Array.isArray(firstAcc.items) && firstAcc.items.length > 0) {
          payloadToSave.topics = firstAcc.items;
        }
      }

      const sampleBlock = blocks.find((b) => b.type === 'sample_groups');
      if (sampleBlock?.config) {
        const sCfg = sampleBlock.config as SampleGroupsBlockConfig;
        const allImages = (sCfg.groups || []).flatMap((g) => g.images || []).filter(Boolean);
        if (allImages.length > 0) {
          payloadToSave.preview_images = allImages;
        }
      }

      const res = await apiClient.upsertProduct(payloadToSave);
      showToast(res.message);
      await loadOverview();
      await refreshCatalog();
      setEditingProduct({
        ...res.product,
        detail_blocks:
          Array.isArray(res.product.detail_blocks) && res.product.detail_blocks.length > 0
            ? res.product.detail_blocks
            : blocks,
      });
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

  const handleUpdateUserRole = async (
    u: AdminUserRecord,
    nextRole: 'admin' | 'subadmin' | 'user'
  ) => {
    try {
      const res = await apiClient.updateAdminUserRole(u.id, { role: nextRole });
      showToast(res.message);
      setAdminUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, role: nextRole } : item))
      );
    } catch (err: any) {
      showToast(err?.message || 'Lỗi đổi quyền thành viên.');
    }
  };

  const handleToggleUserActive = async (u: AdminUserRecord) => {
    try {
      const nextActive = !u.isActive;
      const res = await apiClient.updateAdminUserRole(u.id, { isActive: nextActive });
      showToast(res.message);
      setAdminUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isActive: nextActive } : item))
      );
    } catch (err: any) {
      showToast(err?.message || 'Lỗi cập nhật trạng thái thành viên.');
    }
  };

  const handleRevokeAllUserSessions = async (u: AdminUserRecord) => {
    try {
      const res = await apiClient.revokeAdminUserSessions(u.id);
      showToast(res.message);
      setAdminUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, activeSessions: 0 } : item))
      );
    } catch (err: any) {
      showToast(err?.message || 'Lỗi thu hồi phiên đăng nhập.');
    }
  };

  const filteredAdminUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return adminUsers.filter((u) => {
      const matchesSearch =
        !q ||
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').includes(q);

      const matchesRole =
        userRoleFilter === 'ALL' || u.role === userRoleFilter;

      const matchesStatus =
        userStatusFilter === 'ALL' ||
        (userStatusFilter === 'active' && u.isActive) ||
        (userStatusFilter === 'blocked' && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [adminUsers, userSearch, userRoleFilter, userStatusFilter]);

  const totalUserPages = Math.max(1, Math.ceil(filteredAdminUsers.length / USERS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USERS_PER_PAGE;
    return filteredAdminUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredAdminUsers, userPage]);

  return (
    <div className="bg-gray-50 min-h-screen pb-14">
      {/* Top Admin Header */}
      <div className="bg-[#e60049] text-white py-5 px-4 shadow-sm">
        <div className="max-w-[1520px] mx-auto flex flex-wrap items-center justify-between gap-4">
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

      <div className="max-w-[1520px] mx-auto px-4 pt-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Menu Quản trị Dọc (Sidebar Nav) */}
          <aside className="w-full lg:w-64 flex-shrink-0 bg-white border border-gray-200 rounded-md p-3 shadow-sm lg:sticky lg:top-4">
            <div className="px-2 py-2 border-b border-gray-100 mb-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-gray-400">
                Menu Quản Trị
              </span>
            </div>

            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('homepage_cms')}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm text-xs transition ${
                  activeTab === 'homepage_cms'
                    ? 'bg-[#e60049] text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span>1. Cấu hình Trang chủ</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'homepage_cms' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  6 khung
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('category_cms')}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm text-xs transition ${
                  activeTab === 'category_cms'
                    ? 'bg-[#e60049] text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span>2. Cấu hình Trang Cấp 1</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'category_cms' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {categories.length} trang
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('combo_cms')}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm text-xs transition ${
                  activeTab === 'combo_cms'
                    ? 'bg-[#e60049] text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span>3. Cấu hình Trang Combo THPT</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'combo_cms' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {siteConfigs?.combo_page_blocks?.length || '6'} khối
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('flashcard_cms')}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm text-xs transition ${
                  activeTab === 'flashcard_cms'
                    ? 'bg-[#e60049] text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span>4. Cấu hình Trang Flashcard</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'flashcard_cms' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {siteConfigs?.flashcard_page_blocks?.length || '6'} khối
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('utility_cms')}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm text-xs transition ${
                  activeTab === 'utility_cms'
                    ? 'bg-[#e60049] text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span>5. Cấu hình Trang Tiện ích</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'utility_cms' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  5 trang
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm text-xs transition ${
                  activeTab === 'products'
                    ? 'bg-[#e60049] text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span>6. Quản lý Sản phẩm</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {products.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm text-xs transition ${
                  activeTab === 'orders'
                    ? 'bg-[#e60049] text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span>7. Quản lý Đơn hàng</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {orders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('mapping')}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm text-xs transition ${
                  activeTab === 'mapping'
                    ? 'bg-[#e60049] text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span>8. Đối soát &amp; Tự động</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'mapping' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  14 Entry
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm text-xs transition ${
                  activeTab === 'users'
                    ? 'bg-[#e60049] text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span>9. Thành viên &amp; Phân quyền</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {adminUsers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('configs')}
                className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-sm text-xs transition ${
                  activeTab === 'configs'
                    ? 'bg-[#e60049] text-white font-bold shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 font-medium'
                }`}
              >
                <span>10. Menu Header &amp; Footer</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeTab === 'configs' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {adminMenus.length}
                </span>
              </button>
            </nav>

            <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center">
              Hệ thống Huy Tutor v2.0
            </div>
          </aside>

          {/* Nội dung bên phải (Main Content) */}
          <main className="flex-1 min-w-0 space-y-6">
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

            {/* TAB HOMEPAGE CMS */}
            {activeTab === 'homepage_cms' && <AdminHomepageCms />}

            {/* TAB CATEGORY CMS */}
            {activeTab === 'category_cms' && <AdminCategoryCms />}

            {/* TAB COMBO CMS */}
            {activeTab === 'combo_cms' && <AdminComboCms />}

            {/* TAB FLASHCARD CMS */}
            {activeTab === 'flashcard_cms' && <AdminFlashcardCms />}

            {/* TAB UTILITY PAGES CMS */}
            {activeTab === 'utility_cms' && <AdminUtilityPagesCms />}

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

              {/* 4. Trình thiết kế Bố cục Động Trang cấp 2 (6 Phần chuẩn huytutor.io.vn) */}
              <AdminProductDetailBuilder
                product={editingProduct}
                allProducts={products}
                onChangeBlocks={(nextBlocks) =>
                  setEditingProduct((prev) => ({
                    ...prev,
                    detail_blocks: nextBlocks,
                  }))
                }
                showToast={showToast}
              />

              {/* 5. Các trường dữ liệu cơ sở mở rộng (Thu gọn mặc định, tự động đồng bộ từ 6 Phần trên) */}
              <details className="border border-gray-200 rounded-md bg-gray-50/40 p-3">
                <summary className="text-xs font-extrabold text-gray-600 cursor-pointer select-none">
                  Cấu hình nâng cao / Trường dữ liệu cơ sở (Tự động đồng bộ từ Trình thiết kế 6 Phần)
                </summary>
                <div className="pt-3 space-y-4">
              {/* 4b. Cấu hình Chế độ Đọc thử (PDF hoặc Ảnh dọc) & Watermark */}
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
                              onClick={() => {
                                if (url) {
                                  apiClient.deleteR2File(url).catch(() => {});
                                }
                                setEditingProduct((prev) => ({
                                  ...prev,
                                  preview_images: (prev.preview_images || []).filter(
                                    (_, i) => i !== idx
                                  ),
                                }));
                              }}
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
                </div>
              </details>

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

        {/* TAB 6: QUẢN LÝ THÀNH VIÊN, PHÂN QUYỀN & SESSION */}
        {activeTab === 'users' && (
          <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
                  Quản lý Thành viên, Phân quyền &amp; Phiên đăng nhập
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Đồng bộ người dùng hệ thống. Quản lý vai trò (Admin / Subadmin / User) và thu hồi phiên làm việc.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-pink-50 text-[#e60049] font-bold px-2.5 py-1 rounded border border-pink-100">
                  Tổng: {adminUsers.length} tài khoản
                </span>
                <button
                  type="button"
                  onClick={loadOverview}
                  className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-3.5 py-1.5 rounded-sm transition shadow-sm"
                >
                  Làm mới danh sách
                </button>
              </div>
            </div>

            {/* Bộ lọc & Tìm kiếm */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50 p-3 rounded border border-gray-200 text-xs">
              <div className="sm:col-span-6">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Tìm kiếm</label>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setUserPage(1);
                  }}
                  placeholder="Tìm theo họ tên, email, số điện thoại..."
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#e60049]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Vai trò</label>
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value as any);
                    setUserPage(1);
                  }}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-[#e60049]"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="subadmin">Quản lý nhóm (Subadmin)</option>
                  <option value="user">Học viên / User</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={userStatusFilter}
                  onChange={(e) => {
                    setUserStatusFilter(e.target.value as any);
                    setUserPage(1);
                  }}
                  className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-[#e60049]"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="blocked">Đã khóa</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 text-gray-800 font-bold">
                    <th className="border border-gray-200 p-2.5 text-left">Họ tên &amp; Email</th>
                    <th className="border border-gray-200 p-2.5 text-left">Nhóm / SĐT</th>
                    <th className="border border-gray-200 p-2.5 text-center">Vai trò hiện tại</th>
                    <th className="border border-gray-200 p-2.5 text-center">Phiên mở</th>
                    <th className="border border-gray-200 p-2.5 text-center">Trạng thái</th>
                    <th className="border border-gray-200 p-2.5 text-right">Phân quyền &amp; Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Không tìm thấy tài khoản nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="border border-gray-200 p-2.5">
                          <div className="font-bold text-gray-900">{u.fullName || 'Chưa đặt tên'}</div>
                          <div className="text-[11px] text-gray-500">{u.email}</div>
                        </td>
                        <td className="border border-gray-200 p-2.5">
                          <div className="font-semibold text-gray-700">{u.customerGroup || 'Giáo viên'}</div>
                          <div className="text-[11px] text-gray-500">{u.phone || '—'}</div>
                        </td>
                        <td className="border border-gray-200 p-2.5 text-center">
                          {u.role === 'admin' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-[#e60049] text-white">
                              ADMIN
                            </span>
                          )}
                          {u.role === 'subadmin' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-600 text-white">
                              SUBADMIN
                            </span>
                          )}
                          {u.role === 'user' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-gray-100 text-gray-700 border border-gray-300">
                              USER
                            </span>
                          )}
                        </td>
                        <td className="border border-gray-200 p-2.5 text-center font-bold text-gray-800">
                          {u.activeSessions} phiên
                        </td>
                        <td className="border border-gray-200 p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                              u.isActive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {u.isActive ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                          </span>
                        </td>
                        <td className="border border-gray-200 p-2.5 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <select
                              value={u.role}
                              onChange={(e) =>
                                handleUpdateUserRole(
                                  u,
                                  e.target.value as 'admin' | 'subadmin' | 'user'
                                )
                              }
                              className="text-[11px] font-bold border border-gray-300 rounded px-2 py-1 bg-white hover:border-[#e60049] cursor-pointer focus:outline-none"
                            >
                              <option value="user">Gán: USER</option>
                              <option value="subadmin">Gán: SUBADMIN</option>
                              <option value="admin">Gán: ADMIN</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleToggleUserActive(u)}
                              className="border border-gray-300 bg-white hover:border-[#e60049] text-gray-700 font-bold text-[11px] px-2.5 py-1 rounded-sm transition"
                            >
                              {u.isActive ? 'Khóa' : 'Mở khóa'}
                            </button>

                            {u.activeSessions > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRevokeAllUserSessions(u)}
                                className="border border-[#e60049] text-[#e60049] hover:bg-[#e60049] hover:text-white font-bold text-[11px] px-2.5 py-1 rounded-sm transition"
                              >
                                Thu hồi Session
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            {totalUserPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-200 text-xs">
                <span className="text-gray-600">
                  Hiển thị {(userPage - 1) * USERS_PER_PAGE + 1} -{' '}
                  {Math.min(userPage * USERS_PER_PAGE, filteredAdminUsers.length)} trong tổng số{' '}
                  <strong>{filteredAdminUsers.length}</strong> thành viên
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={userPage <= 1}
                    onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                    className="border border-gray-300 px-2.5 py-1 rounded disabled:opacity-40 hover:bg-gray-100 font-medium"
                  >
                    ← Trước
                  </button>
                  <span className="px-2 font-bold text-gray-800">
                    {userPage} / {totalUserPages}
                  </span>
                  <button
                    type="button"
                    disabled={userPage >= totalUserPages}
                    onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                    className="border border-gray-300 px-2.5 py-1 rounded disabled:opacity-40 hover:bg-gray-100 font-medium"
                  >
                    Sau →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: CẤU HÌNH MENU HEADER & FOOTER */}
        {activeTab === 'configs' && (
          <div className="space-y-6">
            {/* 1. Cấu hình Menu Header */}
            <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
                    1. Cấu hình Danh sách Menu Header (100% Dynamic)
                  </h2>
                  <p className="text-xs text-gray-600">
                    Toàn bộ menu trên thanh điều hướng chính và mobile nav được đồng bộ động từ cơ sở dữ liệu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newId = String(Date.now());
                      setAdminMenus((prev) => [
                        ...prev,
                        {
                          id: newId,
                          title: 'MENU MỚI',
                          slug: '/new-menu',
                          parent_id: null,
                          sort_order: prev.length + 1,
                          is_active: true,
                          children: [],
                        },
                      ]);
                    }}
                    className="border border-gray-300 bg-white hover:border-[#e60049] text-gray-700 font-bold text-xs px-3 py-1.5 rounded-sm transition"
                  >
                    + Thêm mục Menu
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMenus}
                    disabled={savingConfig}
                    className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-1.5 rounded-sm transition disabled:opacity-50"
                  >
                    {savingConfig ? 'Đang lưu...' : 'Lưu Danh Sách Menu'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200">
                  <thead className="bg-[#fff0f3] text-gray-900 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="border border-gray-200 p-2.5 w-16 text-center">Thứ tự</th>
                      <th className="border border-gray-200 p-2.5">Tiêu đề Menu</th>
                      <th className="border border-gray-200 p-2.5">Đường dẫn (Slug/URL)</th>
                      <th className="border border-gray-200 p-2.5">Menu con (Submenus)</th>
                      <th className="border border-gray-200 p-2.5 w-24 text-center">Hiển thị</th>
                      <th className="border border-gray-200 p-2.5 w-20 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminMenus.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-2 text-center">
                          <input
                            type="number"
                            value={item.sort_order}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setAdminMenus((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, sort_order: val } : m))
                              );
                            }}
                            className="w-12 border border-gray-300 rounded-sm text-center py-1 text-xs"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdminMenus((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, title: val } : m))
                              );
                            }}
                            className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-semibold"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={item.slug}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdminMenus((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, slug: val } : m))
                              );
                            }}
                            className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs text-gray-700 font-mono"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <span className="text-[11px] text-gray-600 font-medium">
                            {item.children && item.children.length > 0
                              ? `${item.children.length} mục con (${item.children.map((c) => c.label).slice(0, 2).join(', ')}${item.children.length > 2 ? '...' : ''})`
                              : 'Không có'}
                          </span>
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.is_active}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAdminMenus((prev) =>
                                prev.map((m, i) => (i === idx ? { ...m, is_active: checked } : m))
                              );
                            }}
                            className="w-4 h-4 text-[#e60049] rounded"
                          />
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminMenus((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-red-600 hover:text-red-800 text-[11px] font-bold"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. Cấu hình Mạng Xã Hội Footer */}
            <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
                    2. Cấu hình Đường dẫn Mạng xã hội Footer
                  </h2>
                  <p className="text-xs text-gray-600">
                    Quản lý liên kết các kênh mạng xã hội chính thức (Facebook, YouTube, TikTok, Zalo) hiển thị ở góc Footer.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newId = String(Date.now());
                      setAdminSocials((prev) => [
                        ...prev,
                        {
                          id: newId,
                          platform: 'custom',
                          label: 'Kênh mới',
                          url: 'https://',
                          icon: '★',
                          is_active: true,
                        },
                      ]);
                    }}
                    className="border border-gray-300 bg-white hover:border-[#e60049] text-gray-700 font-bold text-xs px-3 py-1.5 rounded-sm transition"
                  >
                    + Thêm Kênh MXH
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSocials}
                    disabled={savingConfig}
                    className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-1.5 rounded-sm transition disabled:opacity-50"
                  >
                    {savingConfig ? 'Đang lưu...' : 'Lưu Cấu Hình Mạng Xã Hội'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200">
                  <thead className="bg-[#fff0f3] text-gray-900 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="border border-gray-200 p-2.5 w-28">Nền tảng</th>
                      <th className="border border-gray-200 p-2.5 w-48">Tên hiển thị</th>
                      <th className="border border-gray-200 p-2.5">Đường dẫn (URL chính thức)</th>
                      <th className="border border-gray-200 p-2.5 w-20 text-center">Biểu tượng</th>
                      <th className="border border-gray-200 p-2.5 w-24 text-center">Kích hoạt</th>
                      <th className="border border-gray-200 p-2.5 w-20 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminSocials.map((soc, idx) => (
                      <tr key={soc.id || idx} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={soc.platform}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdminSocials((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, platform: val } : s))
                              );
                            }}
                            className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={soc.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdminSocials((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, label: val } : s))
                              );
                            }}
                            className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={soc.url}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdminSocials((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, url: val } : s))
                              );
                            }}
                            className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <input
                            type="text"
                            value={soc.icon}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdminSocials((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, icon: val } : s))
                              );
                            }}
                            className="w-12 border border-gray-300 rounded-sm text-center py-1 text-xs"
                          />
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <input
                            type="checkbox"
                            checked={soc.is_active}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAdminSocials((prev) =>
                                prev.map((s, i) => (i === idx ? { ...s, is_active: checked } : s))
                              );
                            }}
                            className="w-4 h-4 text-[#e60049] rounded"
                          />
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminSocials((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-red-600 hover:text-red-800 text-[11px] font-bold"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Cấu hình Liên kết Chính sách & Hỗ trợ Footer */}
            <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
                    3. Cấu hình Liên kết Chính sách &amp; Hỗ trợ Footer
                  </h2>
                  <p className="text-xs text-gray-600">
                    Quản lý danh sách các liên kết Điều khoản sử dụng, Chính sách bảo mật, FAQ và Donate hiển thị ở cột 3 Footer.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newId = String(Date.now());
                      setAdminPolicies((prev) => [
                        ...prev,
                        {
                          id: newId,
                          label: 'Chính sách mới',
                          url: '/terms-of-service',
                          order_index: prev.length + 1,
                          is_active: true,
                        },
                      ]);
                    }}
                    className="border border-gray-300 bg-white hover:border-[#e60049] text-gray-700 font-bold text-xs px-3 py-1.5 rounded-sm transition"
                  >
                    + Thêm Liên Kết
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePolicies}
                    disabled={savingConfig}
                    className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-4 py-1.5 rounded-sm transition disabled:opacity-50"
                  >
                    {savingConfig ? 'Đang lưu...' : 'Lưu Cấu Hình Chính Sách'}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-gray-200">
                  <thead className="bg-[#fff0f3] text-gray-900 font-extrabold uppercase text-[10px]">
                    <tr>
                      <th className="border border-gray-200 p-2.5 w-16 text-center">Thứ tự</th>
                      <th className="border border-gray-200 p-2.5 w-60">Tên liên kết (Label)</th>
                      <th className="border border-gray-200 p-2.5">Đường dẫn trang (URL)</th>
                      <th className="border border-gray-200 p-2.5 w-24 text-center">Hiển thị</th>
                      <th className="border border-gray-200 p-2.5 w-20 text-center">Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminPolicies.map((pol, idx) => (
                      <tr key={pol.id || idx} className="hover:bg-gray-50">
                        <td className="border border-gray-200 p-2 text-center">
                          <input
                            type="number"
                            value={pol.order_index}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setAdminPolicies((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, order_index: val } : p))
                              );
                            }}
                            className="w-12 border border-gray-300 rounded-sm text-center py-1 text-xs"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={pol.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdminPolicies((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, label: val } : p))
                              );
                            }}
                            className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-semibold"
                          />
                        </td>
                        <td className="border border-gray-200 p-2">
                          <input
                            type="text"
                            value={pol.url}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAdminPolicies((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, url: val } : p))
                              );
                            }}
                            className="w-full border border-gray-300 rounded-sm px-2 py-1 text-xs font-mono"
                          />
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <input
                            type="checkbox"
                            checked={pol.is_active}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setAdminPolicies((prev) =>
                                prev.map((p, i) => (i === idx ? { ...p, is_active: checked } : p))
                              );
                            }}
                            className="w-4 h-4 text-[#e60049] rounded"
                          />
                        </td>
                        <td className="border border-gray-200 p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setAdminPolicies((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-red-600 hover:text-red-800 text-[11px] font-bold"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
          </main>
        </div>
      </div>
    </div>
  );
};

