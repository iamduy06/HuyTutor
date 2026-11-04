import { UIFormat, GoogleFormNote } from '../constants/formatMapping';

export interface NavItem {
  id: number;
  label: string;
  url: string;
  order_index: number;
  is_highlight?: boolean;
}

export interface NavMenu {
  id: number;
  title: string;
  url: string;
  order_index: number;
  is_active: boolean;
  children: NavItem[];
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  description: string;
  order_index: number;
  anchors?: { label: string; targetId: string }[];
}

export interface ProductFormatRecord {
  ui_format_name: UIFormat;
  form_mapped_note: GoogleFormNote;
  price: number;
  original_price: number;
  gdrive_folder_id: string;
  is_default: boolean;
  is_active: boolean;
}

export interface ProductSpec {
  label: string;
  val: string;
}

export interface ProductRecord {
  id: string;
  category_id: string;
  section_group: string;
  title: string;
  short_title: string;
  slug: string;
  google_form_product_name: string;
  badge: string;
  subtitle: string;
  cefr_level: string;
  grade: string;
  description: string;
  r2_thumbnail_url: string;
  r2_demo_images_urls: string[];
  r2_audio_url?: string;
  preview_type: 'pdf' | 'images' | 'none';
  sample_pdf_source: 'drive' | 'r2';
  sample_pdf_url: string;
  sample_title: string;
  watermark_enabled: boolean;
  watermark_text: string;
  specs: ProductSpec[];
  topics: string[];
  features: string[];
  sample_pages_text: { page: number; header: string; title: string; body: string; note: string }[];
  formats: ProductFormatRecord[];
  is_published: boolean;
  order_index: number;
}

export interface ComboRuleRecord {
  id: string;
  combo_name: string;
  min_items: number;
  discount_percent: number;
  discount_amount: number;
  applicable_format: string;
  badge_text: string;
  description: string;
  is_active: boolean;
}

export interface OrderItemRecord {
  product_id: string;
  product_name: string;
  google_form_product_name: string;
  ui_format: UIFormat;
  form_format: GoogleFormNote;
  unit_price: number;
  final_item_price: number;
  quantity?: number | null;
}

export interface OrderRecord {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_group: string;
  checkout_format: UIFormat;
  mapped_form_note: GoogleFormNote;
  flashcard_quantity?: number | null;
  need_invoice: boolean;
  customer_address: string;
  tax_id_or_cccd: string;
  original_subtotal: number;
  combo_discount: number;
  final_amount: number;
  payment_gateway: 'sepay' | 'paypal';
  status: 'pending' | 'paid' | 'cancelled';
  google_form_submitted: boolean;
  google_form_payload?: Record<string, string>;
  items: OrderItemRecord[];
  paid_at?: string;
  created_at: string;
}

export const INITIAL_MENUS: NavMenu[] = [];

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
  [key: string]: any;
}

export const INITIAL_SITE_CONFIGS: SiteConfigs = {
  footer_social_links: [],
  footer_policy_links: [],
};

export const INITIAL_CATEGORIES: CategoryRecord[] = [];

export const INITIAL_COMBO_RULES: ComboRuleRecord[] = [];

export const INITIAL_PRODUCTS: ProductRecord[] = [];

export const INITIAL_ORDERS: OrderRecord[] = [];
