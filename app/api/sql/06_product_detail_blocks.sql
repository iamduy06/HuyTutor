-- =============================================================================
-- 06_PRODUCT_DETAIL_BLOCKS.SQL - CẤU HÌNH ĐỘNG CÁC KHỐI TRANG CẤP 2 (PRODUCT DETAIL)
-- Huy Tutor (huytutor.edu.vn)
-- =============================================================================

-- Bổ sung cột detail_blocks (JSONB) vào bảng public.products để lưu danh sách
-- các khối giao diện động (Phần 1 -> Phần 6) của từng Trang cấp 2.
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS detail_blocks JSONB DEFAULT '[]'::jsonb;
