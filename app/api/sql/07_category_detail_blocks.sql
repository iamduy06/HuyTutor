-- =============================================================================
-- 07_CATEGORY_DETAIL_BLOCKS.SQL - CẤU HÌNH ĐỘNG CÁC KHỐI TRANG CẤP 1 (CATEGORY HUB PAGES)
-- Huy Tutor (huytutor.edu.vn)
-- =============================================================================

-- Bổ sung cột blocks (JSONB) vào bảng public.categories để lưu danh sách
-- các khối giao diện động (category_hero, category_section, category_banner, category_notice)
-- của từng Trang cấp 1 (như /high-school, /secondary-school, /gifts...).
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'::jsonb;
