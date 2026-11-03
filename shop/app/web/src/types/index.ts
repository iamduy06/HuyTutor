export type UiFormatCode = 'Word' | 'PDF' | 'Flashcard' | 'Trang tính' | 'Thiết kế';

export type GoogleFormNoteValue =
  | 'Word dài'
  | 'PDF dài'
  | 'Flashcard'
  | 'Trang tính'
  | 'Thiết kế';

export const UI_FORMATS: UiFormatCode[] = [
  'Word',
  'PDF',
  'Flashcard',
  'Trang tính',
  'Thiết kế',
];

export const FORMAT_TO_GOOGLE_FORM_MAP: Record<UiFormatCode, GoogleFormNoteValue> = {
  Word: 'Word dài',
  PDF: 'PDF dài',
  Flashcard: 'Flashcard',
  'Trang tính': 'Trang tính',
  'Thiết kế': 'Thiết kế',
};

export interface MenuItemChild {
  id: string;
  label: string;
  url: string;
  order_index?: number;
  is_highlight?: boolean;
}

export interface MenuItem {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  children?: MenuItemChild[];
}

export interface FooterSocialLink {
  id: string;
  platform: string;
  label: string;
  url: string;
  icon: string;
  is_active: boolean;
}

export interface FooterPolicyLink {
  id: string;
  label: string;
  url: string;
  order_index: number;
  is_active: boolean;
}

export interface HomepageHeroConfig {
  mode: 'custom_html' | 'custom_image' | 'structured';
  custom_html?: string;
  custom_image_url?: string;
  subtitle?: string;
  title?: string;
  bullets?: string[];
  image_url?: string;
  is_active?: boolean;
}

export interface HomepageTopBannerBook {
  title: string;
  badge: string;
  gradient: string;
}

export interface HomepageTopBannerConfig {
  mode: 'custom_html' | 'custom_image' | 'image_text' | 'structured';
  custom_html?: string;
  custom_image_url?: string;
  image_url?: string;
  tag?: string;
  title?: string;
  subtitle?: string;
  cta_badge?: string;
  link_url?: string;
  header_label?: string;
  books?: HomepageTopBannerBook[];
  is_active?: boolean;
}

export interface HomepageCategoryTile {
  id: string;
  category_slug: string;
  label: string;
  icon_code: string;
  image_url: string;
  to: string;
  is_active: boolean;
}

export interface HomepageCategoriesGridConfig {
  title: string;
  items: HomepageCategoryTile[];
  is_active?: boolean;
}

export interface HomepageSectionItem {
  id: string;
  display_title: string;
  image_url: string;
  target_url: string;
  badge_text?: string;
  tag_text?: string;
  price_text?: string;
  is_active: boolean;
  sort_order: number;
}

export interface HomepageSectionGroup {
  id: string;
  category_slug?: string;
  title: string;
  is_active: boolean;
  sort_order: number;
  items: HomepageSectionItem[];
}

export interface HomepageSectionGroupsConfig {
  sections: HomepageSectionGroup[];
  is_active?: boolean;
}

export interface HomepageNoticeTextConfig {
  text: string;
  cta_button_text?: string;
  cta_button_link?: string;
  is_active?: boolean;
}

export interface HomepageBottomBannerBook {
  title: string;
  year: string;
  gradient: string;
}

export interface HomepageBottomBannerConfig {
  mode: 'custom_html' | 'custom_image' | 'structured';
  custom_html?: string;
  custom_image_url?: string;
  image_url?: string;
  link_url?: string;
  tag?: string;
  title?: string;
  badge_text?: string;
  books?: HomepageBottomBannerBook[];
  is_active?: boolean;
}

export type HomepageBlockType =
  | 'hero'
  | 'top_banner'
  | 'categories_grid'
  | 'section_groups'
  | 'notice_text'
  | 'bottom_banner';

export interface HomepageBlockItem {
  id: string;
  type: HomepageBlockType;
  title_label?: string;
  is_active: boolean;
  sort_order: number;
  config: any;
}

export interface SiteConfigs {
  footer_social_links: FooterSocialLink[];
  footer_policy_links: FooterPolicyLink[];
  homepage_hero?: HomepageHeroConfig;
  homepage_top_banner?: HomepageTopBannerConfig;
  homepage_categories_grid?: HomepageCategoriesGridConfig;
  homepage_section_groups?: HomepageSectionGroupsConfig;
  homepage_notice_text?: HomepageNoticeTextConfig;
  homepage_bottom_banner?: HomepageBottomBannerConfig;
  homepage_blocks?: HomepageBlockItem[];
  combo_page_blocks?: ComboPageBlockItem[];
  [key: string]: any;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  blocks?: CategoryBlockItem[];
}

/**
 * ============================================================================
 * CẤU HÌNH CÁC KHỐI ĐỘNG CHO TRANG CẤP 1 (CATEGORY HUB PAGE BUILDER)
 * ============================================================================
 */

export type CategoryBlockType =
  | 'category_hero'
  | 'category_section'
  | 'category_banner'
  | 'category_notice';

export interface CategoryBlockItem {
  id: string;
  type: CategoryBlockType;
  title_label?: string;
  is_active: boolean;
  sort_order: number;
  config: any;
}

export interface CategoryHeroAnchorLink {
  id: string;
  label: string;
  target_url: string;
}

export interface CategoryHeroBlockConfig {
  title?: string;
  subtitle?: string;
  show_pink_glow?: boolean;
  anchor_mode?: 'auto_from_sections' | 'manual' | 'none';
  custom_anchors?: CategoryHeroAnchorLink[];
  is_active?: boolean;
}

export interface CategorySectionCardItem {
  id: string;
  display_title: string;
  image_url: string;
  image_mode?: 'standalone' | 'card_box';
  badge_text?: string;
  tag_text?: string;
  button_text?: string;
  target_url: string;
  is_active: boolean;
}

export interface CategorySectionBlockConfig {
  title: string;
  anchor_id?: string;
  mode?: 'manual' | 'auto_sub_section';
  sub_section_filter?: string;
  items?: CategorySectionCardItem[];
  is_active?: boolean;
}

export interface CategoryBannerBlockConfig {
  header_label?: string;
  image_url: string;
  link_url?: string;
  is_active?: boolean;
}

export interface CategoryNoticeBlockConfig {
  title?: string;
  content: string;
  bg_style?: 'pink' | 'gray' | 'white';
  is_active?: boolean;
}

export interface ComboRule {
  id: string;
  name: string;
  min_quantity: number;
  discount_percent: number;
  is_active: boolean;
}

export interface ProductFormat {
  format_code: UiFormatCode;
  price: number;
  is_active: boolean;
}

export interface ProductSpec {
  label: string;
  val: string;
}

/**
 * ============================================================================
 * CẤU HÌNH 6 LOẠI KHỐI ĐỘNG CHO TRANG CẤP 2 (PRODUCT DETAIL PAGE BUILDER)
 * ============================================================================
 */

// Phần 1: Khối Đầu trang & Mua hàng (product_hero)
export interface ProductHeroBlockConfig {
  image_mode?: 'standalone' | 'card_box';
  image_url?: string;
  badge_text?: string;
  cover_tag?: string;
  title?: string;
  price_override_text?: string;
  show_format_selector?: boolean;
  specs?: ProductSpec[];
  primary_cta_text?: string;
  primary_cta_action?: 'buy_now' | 'add_to_cart' | 'custom_link';
  primary_cta_link?: string;
  show_add_to_cart_button?: boolean;
  secondary_cta_text?: string;
  secondary_cta_link?: string;
  is_active?: boolean;
}

// Phần 2: Khối Giới thiệu & Điểm nổi bật (product_intro)
export interface ProductIntroBulletItem {
  id: string;
  text: string;
  is_highlight?: boolean;
}

export interface ProductIntroBlockConfig {
  bg_style?: 'gray' | 'white';
  paragraphs?: string[];
  bullets_title?: string;
  bullets?: ProductIntroBulletItem[];
  is_active?: boolean;
}

// Phần 3: Khối Tiêu đề Xem thử, Thanh nhảy nhanh & Danh sách chủ đề thu gọn (topic_accordion)
export interface TopicAccordionBox {
  id: string;
  title: string;
  default_open?: boolean;
  items: string[];
}

export interface TopicAccordionBlockConfig {
  section_heading?: string;
  show_quick_anchor_nav?: boolean;
  accordions?: TopicAccordionBox[];
  is_active?: boolean;
}

// Phần 4: Khối Các Nhóm Đọc Thử Đa Phân Mục (sample_groups)
export interface SamplePreviewGroup {
  id: string;
  title: string;
  description?: string;
  media_type: 'images' | 'pdf';
  images: string[];
  pdf_url?: string;
  watermark_enabled?: boolean;
  watermark_text?: string;
  is_active: boolean;
  sort_order: number;
}

export interface SampleGroupsBlockConfig {
  groups: SamplePreviewGroup[];
  is_active?: boolean;
}

// Phần 5: Khối Lời cảm ơn & Đặt hàng cuối trang (bottom_cta)
export interface BottomCtaBlockConfig {
  thank_you_text?: string;
  sub_text?: string;
  primary_button_text?: string;
  primary_button_action?: 'buy_now' | 'add_to_cart' | 'custom_link';
  primary_button_link?: string;
  secondary_link_text?: string;
  secondary_link_url?: string;
  is_active?: boolean;
}

// Phần 6: Khối Sản phẩm gợi ý / Nhiều Thầy/Cô cũng chọn (related_products)
export interface RelatedProductCustomCard {
  id: string;
  display_title: string;
  image_url: string;
  badge_text?: string;
  tag_text?: string;
  button_text?: string;
  target_url: string;
  is_active: boolean;
}

export interface RelatedProductsBlockConfig {
  title?: string;
  mode: 'auto' | 'manual';
  max_items?: number;
  items?: RelatedProductCustomCard[];
  is_active?: boolean;
}

export type ProductDetailBlockType =
  | 'product_hero'
  | 'product_intro'
  | 'topic_accordion'
  | 'sample_groups'
  | 'bottom_cta'
  | 'related_products';

export interface ProductDetailBlockItem {
  id: string;
  type: ProductDetailBlockType;
  title_label?: string;
  is_active: boolean;
  sort_order: number;
  config: any;
}

/**
 * ============================================================================
 * CẤU HÌNH CÁC KHỐI ĐỘNG CHO TRANG COMBO THPT (COMBO PAGE BUILDER)
 * ============================================================================
 */

export type ComboBlockType =
  | 'combo_hero'
  | 'combo_packages'
  | 'combo_sections'
  | 'combo_bottom_cta'
  | 'combo_banner'
  | 'combo_notice';

export interface ComboHeroBlockConfig {
  top_slogan: string;
  bottom_slogan: string;
  mode: 'image_banner' | 'custom_builder';
  banner_image_url?: string;
  headline?: string;
  sub_headline?: string;
  badge_text?: string;
  book_cover_urls?: string[];
  gradient_theme?: 'amber' | 'rose' | 'indigo' | 'emerald';
}

export interface ComboPackageItem {
  id: string;
  title: string;
  discount_badge: string;
  format_badge: string;
  tag_text: string;
  product_ids: string[];
  custom_cover_urls?: string[];
  action_type: 'open_checkout' | 'add_to_cart';
}

export interface ComboPackagesBlockConfig {
  section_title: string;
  sub_text: string;
  packages: ComboPackageItem[];
}

export interface ComboSectionGroupItem {
  id: string;
  title: string;
  description?: string;
  product_ids: string[];
}

export interface ComboSectionsBlockConfig {
  group_header?: string;
  groups: ComboSectionGroupItem[];
}

export interface ComboBottomCtaBlockConfig {
  btn_title: string;
  discount_text: string;
  note_text: string;
  target_package_id?: string;
}

export interface ComboBannerBlockConfig {
  banner_url: string;
  link_url?: string;
  alt_text?: string;
}

export interface ComboNoticeBlockConfig {
  content: string;
  badge_label?: string;
  theme?: 'pink' | 'amber' | 'sky' | 'emerald';
}

export interface ComboPageBlockItem {
  id: string;
  type: ComboBlockType;
  title_label: string;
  is_active: boolean;
  sort_order: number;
  config:
    | ComboHeroBlockConfig
    | ComboPackagesBlockConfig
    | ComboSectionsBlockConfig
    | ComboBottomCtaBlockConfig
    | ComboBannerBlockConfig
    | ComboNoticeBlockConfig;
}

export interface Product {
  id: string;
  category_id: string;
  category_slug: string;
  category_name: string;
  sub_section: string;
  code: string;
  title: string;
  slug: string;
  google_form_product_name: string;
  badge_text: string;
  short_desc: string;
  cover_tag: string;
  thumbnail_url: string;
  preview_type: 'pdf' | 'images' | 'none';
  sample_pdf_source: 'drive' | 'r2';
  sample_pdf_url: string;
  watermark_enabled: boolean;
  watermark_text: string;
  preview_images: string[];
  specs: ProductSpec[];
  topics: string[];
  features: string[];
  is_featured: boolean;
  is_combo_eligible: boolean;
  is_active: boolean;
  formats: ProductFormat[];
  detail_blocks?: ProductDetailBlockItem[];
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  slug: string;
  categorySlug: string;
  code: string;
  title: string;
  googleFormProductName: string;
  formatCode: UiFormatCode;
  unitPrice: number;
  quantity: number;
  selected: boolean;
  isComboEligible: boolean;
}

export interface OrderItemRecord {
  product_id: string;
  product_title: string;
  google_form_product_name: string;
  format_code: UiFormatCode;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderRecord {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_group: 'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác';
  selected_format: UiFormatCode;
  flashcard_quantity: number | null;
  need_invoice: boolean;
  invoice_tax_or_cccd: string;
  invoice_address: string;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  payment_method: 'sepay' | 'paypal';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_ref_id?: string;
  paid_at?: string;
  google_form_submitted: boolean;
  created_at: string;
  items: OrderItemRecord[];
}

export interface PaymentInstruction {
  method: 'sepay' | 'paypal';
  orderCode: string;
  amountVnd: number;
  amountUsd: string;
  sepay?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    transferContent: string;
    qrImageUrl: string;
  };
  paypal?: {
    clientId: string;
    mode: string;
    amountUsd: string;
    currency: 'USD';
  };
}

export function formatVnd(amount: number): string {
  return `${Math.round(amount).toLocaleString('vi-VN')}đ`;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'user' | 'admin' | 'subadmin';
  customerGroup: 'Giáo viên' | 'Học sinh' | 'Phụ huynh' | 'Khác';
  schoolOrOrg: string;
  defaultTaxCccd: string;
  defaultInvoiceAddress: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface UserSessionItem {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface UserLibraryItem {
  id: string;
  user_id: string;
  order_id: string;
  order_code: string;
  product_slug: string;
  product_title: string;
  format_code: UiFormatCode;
  access_drive_url: string;
  watermarked_pdf_url: string;
  download_count: number;
  last_downloaded_at?: string;
  is_active: boolean;
  granted_at: string;
  thumbnail_url?: string;
  cover_tag?: string;
  code?: string;
  sample_pdf_url?: string;
  preview_images?: string[];
}

export interface AdminUserRecord extends UserProfile {
  activeSessions: number;
}
