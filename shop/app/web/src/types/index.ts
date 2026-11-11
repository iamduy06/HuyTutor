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

export const CUSTOMER_GROUP_OPTIONS = [
  'Giáo viên công lập',
  'Giáo viên ngoài công lập',
  'Gia sư',
  'Học sinh',
  'Phụ huynh',
  'Chủ trung tâm',
] as const;

export type CustomerGroupType = (typeof CUSTOMER_GROUP_OPTIONS)[number];

export interface CheckoutConfig {
  enable_vat_invoice: boolean;
}

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
  icon_url?: string;
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
  | 'bottom_banner'
  | 'custom_html';

export interface HomepageBlockItem {
  id: string;
  type: HomepageBlockType;
  title_label?: string;
  is_active: boolean;
  sort_order: number;
  config: any;
}

/**
 * ============================================================================
 * CẤU HÌNH KHUNG HÌNH (IMAGE FRAME) & KHUNG ĐÈ CHIẾN DỊCH (CAMPAIGN OVERLAY)
 * ============================================================================
 */
export type AspectRatioMode = 'preset' | 'custom' | 'auto';
export type PresetAspectRatio = '3:4' | '4:3' | '1:1' | '16:9' | '3:1' | '1:1.414';

export interface ImageFrameConfig {
  ratio_mode?: AspectRatioMode;
  preset_ratio?: PresetAspectRatio;
  custom_ratio_w?: number;
  custom_ratio_h?: number;
  max_width_px?: number;
  object_fit?: 'cover' | 'contain';
  border_rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  show_border?: boolean;
  show_shadow?: boolean;
}

export type CampaignFramePreset = 'tet' | 'sale' | 'exam' | 'christmas';

export interface CampaignFrameBlockConfig {
  title?: string;
  subtitle?: string;
  is_active?: boolean;
  frame_type: 'preset' | 'custom';
  preset_name?: CampaignFramePreset;
  custom_frame_url?: string;
  scope: 'global' | 'specific';
  applied_product_ids?: string[];
  banner_text?: string;
  cta_label?: string;
  cta_url?: string;
  show_sample_products?: boolean;
  aspect_ratio?: PresetAspectRatio;
}

export interface CampaignFrameConfig {
  is_enabled: boolean;
  frame_type: 'preset' | 'custom';
  preset_name?: CampaignFramePreset;
  custom_frame_url?: string;
  scope: 'global' | 'specific';
  applied_product_ids?: string[];
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
  flashcard_page_blocks?: FlashcardPageBlockItem[];
  gift_page_blocks?: CategoryBlockItem[];
  terms_page_config?: TermsPageConfig;
  privacy_policy_config?: PolicyPageConfig;
  payment_delivery_policy_config?: PolicyPageConfig;
  refund_policy_config?: PolicyPageConfig;
  copyright_policy_config?: PolicyPageConfig;
  custom_pages_config?: CustomPagesConfig;
  faq_page_config?: FaqPageConfig;
  hc_rewards_page_config?: HcRewardsPageConfig;
  soan_tai_lieu_page_config?: SoanTaiLieuPageConfig;
  donate_page_config?: DonatePageConfig;
  campaign_frame?: CampaignFrameConfig;
  checkout_config?: CheckoutConfig;
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
  | 'category_notice'
  | 'gift_hero_anchors'
  | 'gift_form_embed'
  | 'gift_donate_cta'
  | 'custom_html';

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
  price: number | '';
  is_active: boolean;
  drive_url?: string;
}

export interface CascadeDeleteProductReport {
  deletedProduct: {
    id: string;
    slug: string;
    title: string;
    category_slug: string;
  };
  autoDeleted: {
    database: string[];
    cmsCleaned: string[];
    r2FilesDeleted: string[];
    r2TotalFiles: number;
  };
  manualAttention: {
    ordersCount: number;
    ordersNotice: string;
    libraryCount: number;
    libraryNotice: string;
    marketingNotice: string;
  };
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
  ratio_mode?: AspectRatioMode;
  preset_ratio?: PresetAspectRatio;
  custom_ratio_w?: number;
  custom_ratio_h?: number;
  max_width_px?: number;
  object_fit?: 'cover' | 'contain';
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
  default_open?: boolean; // Mặc định mở rộng (true) hay thu gọn (false) nhóm này
  is_active: boolean;
  sort_order: number;
}

export interface SampleGroupsBlockConfig {
  section_heading?: string; // Tiêu đề lớn của cả khối (tùy chọn)
  default_open?: boolean; // Mặc định mở rộng (true) hay thu gọn (false) cả khối lớn
  show_collapse_all_buttons?: boolean; // Hiển thị nút bấm Thu gọn / Mở rộng tất cả
  show_quick_anchor_nav?: boolean; // Hiển thị thanh nút nhảy nhanh giữa các nhóm demo (Demo đề thi, Demo đáp án...)
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
  | 'related_products'
  | 'gift_preview_download'
  | 'gift_cross_sell'
  | 'gift_donate_cta'
  | 'custom_html';

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
  | 'combo_notice'
  | 'custom_html';

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

export interface ComboFormatPricing {
  format_code: UiFormatCode;
  is_enabled: boolean;
  combo_price: number | '';
}

export interface ComboPackageItem {
  id: string;
  title: string;
  discount_badge: string;
  format_badge: string;
  tag_text: string;
  product_ids: string[];
  thumbnail_url?: string;
  format_pricings?: ComboFormatPricing[];
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


/**
 * ============================================================================
 * CẤU HÌNH CÁC KHỐI ĐỘNG CHO TRANG FLASHCARD (FLASHCARD PAGE BUILDER)
 * ============================================================================
 */

export type FlashcardBlockType =
  | 'flashcard_hero'
  | 'flashcard_features'
  | 'flashcard_free_tier'
  | 'flashcard_pricing_packages'
  | 'flashcard_group_pricing'
  | 'flashcard_contact_notice'
  | 'flashcard_banner'
  | 'custom_html';

export interface FlashcardHeroBlockConfig {
  title: string;
  subtitle?: string;
  badge_text?: string;
  video_type: 'youtube' | 'r2_video' | 'cover_only';
  youtube_url_or_id?: string;
  r2_video_url?: string;
  cover_image_url?: string;
  video_title?: string;
}

export interface FlashcardFeaturesBlockConfig {
  bg_color?: string;
  demo_card: {
    unit_title: string;
    word: string;
    phonetic: string;
    meaning: string;
    image_url?: string;
  };
  cta_button: {
    text: string;
    action_type: 'link' | 'buy_package';
    target_url?: string;
    package_price?: number;
    package_title?: string;
  };
  features: string[];
}

export interface FlashcardFreeTierBlockConfig {
  title: string;
  description: string;
  rules_title?: string;
  rules: string[];
}

export interface FlashcardIndividualPackageItem {
  id: string;
  label: string;
  price: number;
  price_text?: string;
  badge_text?: string;
  cover_image?: string;
  is_popular?: boolean;
}

export interface FlashcardPricingBlockConfig {
  title: string;
  benefit_text: string;
  packages: FlashcardIndividualPackageItem[];
}

export interface FlashcardGroupTierRow {
  tier_name: string;
  prices: string[];
}

export interface FlashcardGroupPricingBlockConfig {
  columns: string[];
  tiers: FlashcardGroupTierRow[];
  cta_button_text?: string;
  default_price?: number;
  default_title?: string;
}

export interface FlashcardContactNoticeBlockConfig {
  bulk_order_text: string;
  delivery_notice_text: string;
  custom_email?: string;
  custom_fanpage_url?: string;
}

export interface FlashcardBannerBlockConfig {
  banner_url: string;
  link_url?: string;
  alt_text?: string;
}

export interface FlashcardPageBlockItem {
  id: string;
  type: FlashcardBlockType;
  title_label: string;
  is_active: boolean;
  sort_order: number;
  config:
    | FlashcardHeroBlockConfig
    | FlashcardFeaturesBlockConfig
    | FlashcardFreeTierBlockConfig
    | FlashcardPricingBlockConfig
    | FlashcardGroupPricingBlockConfig
    | FlashcardContactNoticeBlockConfig
    | FlashcardBannerBlockConfig;
}


/**
 * ============================================================================
 * CẤU HÌNH CÁC KHỐI DÒNG TRANG TẶNG QUÀ (GIFTS BUILDER)
 * ============================================================================
 */

export interface GiftAnchorItem {
  id: string;
  label: string;
  target_url: string;
}

export interface GiftHeroAnchorsConfig {
  title: string;
  subtitle?: string;
  anchors: GiftAnchorItem[];
}

export interface GiftFormEmbedConfig {
  form_title?: string;
  form_url: string;
  iframe_height?: number;
}

export interface GiftDonateCtaConfig {
  prompt_text: string;
  button_text: string;
  target_url: string;
  is_active: boolean;
}

export interface GiftCrossSellConfig {
  heading: string;
  product_ids: string[];
}

/**
 * ============================================================================
 * CẤU HÌNH 5 TRANG TIỆN ÍCH (UTILITY PAGES BUILDER)
 * ============================================================================
 */

export interface PolicySectionItem {
  id: string;
  title: string;
  content: string;
}

export type UtilityPageRenderMode = 'legacy' | 'hybrid' | 'blocks';
export type RenderMode = UtilityPageRenderMode;

export interface PolicyPageConfig {
  title: string;
  description: string;
  last_updated?: string;
  render_mode?: UtilityPageRenderMode;
  sections: PolicySectionItem[];
  blocks?: CustomPageBlock[];
}

export interface TermsSectionItem {
  id: string;
  title: string;
  content: string;
}

export interface TermsPageConfig {
  title: string;
  description: string;
  render_mode?: UtilityPageRenderMode;
  sections: TermsSectionItem[];
  blocks?: CustomPageBlock[];
}

export type CustomBlockType =
  | 'rich_text'
  | 'banner_hero'
  | 'accordion_faq'
  | 'cards_grid'
  | 'cta_box'
  | 'image_only'
  | 'custom_html';

export interface CustomHtmlBlockConfig {
  html_content?: string;
  container_mode?: 'boxed' | 'full_width';
  no_padding?: boolean;
  admin_label?: string;
}

export interface CustomPageBlockItem {
  id: string;
  title: string;
  desc?: string;
  icon?: string;
  link?: string;
}

export interface CustomPageBlock {
  id: string;
  type: CustomBlockType;
  title?: string;
  subtitle?: string;
  content?: string;
  image_url?: string;
  link_url?: string;
  caption?: string;
  items?: CustomPageBlockItem[];
  is_active?: boolean;
  html_content?: string;
  container_mode?: 'boxed' | 'full_width';
  no_padding?: boolean;
  admin_label?: string;
}

export interface CustomPageItem {
  id: string;
  title: string;
  slug: string;
  meta_description?: string;
  is_active: boolean;
  blocks: CustomPageBlock[];
  created_at?: string;
  updated_at?: string;
}

export interface CustomPagesConfig {
  pages: CustomPageItem[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FaqPageConfig {
  title: string;
  description: string;
  render_mode?: UtilityPageRenderMode;
  faqs: FaqItem[];
  blocks?: CustomPageBlock[];
}

export interface HcRewardBenefitItem {
  id: string;
  title: string;
  desc: string;
}

export interface HcRewardsPageConfig {
  title: string;
  description: string;
  benefits: HcRewardBenefitItem[];
  lookup_title?: string;
  render_mode?: UtilityPageRenderMode;
  blocks?: CustomPageBlock[];
}

export interface SoanTaiLieuCommitmentItem {
  id: string;
  title: string;
  desc: string;
}

export interface SoanTaiLieuPageConfig {
  title: string;
  description: string;
  commitments: SoanTaiLieuCommitmentItem[];
  form_title?: string;
  render_mode?: UtilityPageRenderMode;
  blocks?: CustomPageBlock[];
}

export interface DonatePageConfig {
  title: string;
  message: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
  default_amount?: number;
  render_mode?: UtilityPageRenderMode;
  blocks?: CustomPageBlock[];
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
  is_free?: boolean;
  download_url?: string;
  cross_sell_product_ids?: string[];
  formats: ProductFormat[];
  detail_blocks?: ProductDetailBlockItem[];
  image_frame_config?: ImageFrameConfig;
  custom_campaign_frame_url?: string;
  disable_campaign_frame?: boolean;
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
  isUpgrade?: boolean;
  upgradeFromFormat?: UiFormatCode;
  upgradeOffset?: number;
  originalPrice?: number;
  comboPackageId?: string;
  comboPackageTitle?: string;
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
  customer_group: CustomerGroupType | 'Giáo viên' | 'Khác';
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
  view_token?: string;
  google_form_submitted: boolean;
  consent_order_processing?: boolean;
  consent_marketing_emails?: boolean;
  consent_timestamp?: string;
  consent_policy_version?: string;
  client_ip?: string;
  client_user_agent?: string;
  created_at: string;
  items: OrderItemRecord[];
}

export interface UpgradeQuote {
  eligible: boolean;
  code?: 'ELIGIBLE' | 'ALREADY_OWNS_WORD' | 'NO_PDF_OWNED' | 'INVALID_FORMAT';
  message?: string;
  formatFrom?: UiFormatCode;
  formatTo?: UiFormatCode;
  paidAmount?: number;
  wordPrice?: number;
  offsetAmount?: number;
  amountToPay?: number;
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

export function formatVnd(amount: number | string | undefined | null): string {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return `${Math.round(num).toLocaleString('vi-VN')}đ`;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: 'user' | 'admin' | 'subadmin';
  customerGroup: CustomerGroupType | 'Giáo viên' | 'Khác';
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
  paid_amount?: number;
  thumbnail_url?: string;
  cover_tag?: string;
  code?: string;
  sample_pdf_url?: string;
  preview_images?: string[];
}

export interface AdminUserRecord extends UserProfile {
  activeSessions: number;
}

/**
 * ============================================================================
 * UNIVERSAL BLOCK BUILDER (CROSS-PAGE BLOCK SHARING SYSTEM)
 * ============================================================================
 */
export type UniversalBlockCategory =
  | 'hero_banner'
  | 'products'
  | 'content'
  | 'pricing'
  | 'cta';

export interface UniversalBlockMeta {
  type: string;
  category: UniversalBlockCategory;
  categoryLabel: string;
  label: string;
  badgeColor: string;
  desc: string;
  originPage: string;
}

export interface UniversalBlockItem {
  id: string;
  type: string;
  title_label?: string;
  is_active: boolean;
  sort_order: number;
  config: Record<string, any>;
}

export interface UniversalPageContext {
  pageType: 'homepage' | 'category' | 'product_detail' | 'combo' | 'flashcard' | 'utility' | 'gift';
  product?: Product;
  category?: CategoryItem;
  allProducts?: Product[];
  allCategories?: CategoryItem[];
  siteConfigs?: any;
}

export interface ClientRegion {
  country: string;
  isVietnam: boolean;
  allowedGateways: ('sepay' | 'paypal')[];
  defaultGateway: 'sepay';
  usdExchangeRate: number;
  usdLiveRate?: number;
}

// ==========================================
// Media Management Types & API Interfaces (Milestone 2)
// ==========================================

export interface MediaItem {
  key: string;
  name: string;
  folder: string;
  size: number;
  uploadedAt: string;
  modifiedAt: string;
  uploadTimeSource: 'filename' | 'r2_fallback';
  publicUrl: string;
  fileType: 'image' | 'pdf' | 'other';
}

export interface MediaPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface MediaFolder {
  name: string;
  count: number;
}

export interface ListMediaParams {
  folder?: string;
  fileType?: 'all' | 'image' | 'pdf' | 'other';
  search?: string;
  sortBy?: 'name' | 'uploadedAt' | 'modifiedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ListMediaResult {
  ok: boolean;
  items: MediaItem[];
  pagination: MediaPagination;
  folders: MediaFolder[];
  error?: string;
  details?: string;
}

export interface MediaUsage {
  key: string;
  location: string;
  details: string;
}

export interface CheckMediaUsageResult {
  ok: boolean;
  inUse: boolean;
  usages: MediaUsage[];
  error?: string;
  details?: string;
}

export interface MediaDeleteError {
  key: string;
  error: string;
}

export interface DeleteMediaResult {
  ok: boolean;
  deletedKeys: string[];
  errors: MediaDeleteError[];
  message?: string;
  error?: string;
  details?: string;
}

export interface UploadMediaResult {
  ok: boolean;
  uploaded: MediaItem[];
  message?: string;
  error?: string;
  details?: string;
}

