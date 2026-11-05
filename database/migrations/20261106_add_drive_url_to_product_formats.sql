-- ====================================================================
-- MIGRATION: 20261106_add_drive_url_to_product_formats.sql
-- MỤC TIÊU: Bổ sung cột drive_url vào bảng public.product_formats
--           để lưu trữ link Google Drive file gốc cho từng định dạng tài liệu
-- ====================================================================

-- 1. Bổ sung cột drive_url vào bảng public.product_formats
ALTER TABLE public.product_formats 
  ADD COLUMN IF NOT EXISTS drive_url TEXT DEFAULT '';

-- 2. Ghi chú thích cho cột drive_url
COMMENT ON COLUMN public.product_formats.drive_url IS 'Đường link Google Drive chứa file gốc tương ứng với định dạng sản phẩm';
