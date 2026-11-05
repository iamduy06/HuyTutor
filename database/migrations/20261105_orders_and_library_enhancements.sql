-- ====================================================================
-- MIGRATION: 20261105_orders_and_library_enhancements.sql
-- MỤC TIÊU: CHUẨN HÓA SCHEMA LIVE DATABASE VÀ DATA MIGRATION CHO ORDERS & USER_LIBRARY
-- ĐẶC ĐIỂM: IDEMPOTENT (CHẠY ĐƯỢC NHIỀU LẦN AN TOÀN TRÊN LIVE PRODUCTION)
-- ====================================================================

-- ── BƯỚC 1: DDL - BỔ SUNG CÁC CỘT NGHIỆP VỤ MỚI CHO PUBLIC.ORDERS ──
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS selected_format VARCHAR(50) DEFAULT '',
  ADD COLUMN IF NOT EXISTS flashcard_quantity INT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS customer_group TEXT DEFAULT 'Giáo viên',
  ADD COLUMN IF NOT EXISTS subtotal_amount INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_ref_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_form_submitted BOOLEAN DEFAULT false;

-- ── BƯỚC 2: DML - DATA MIGRATION & BACKFILL DỮ LIỆU ĐƠN HÀNG LỊCH SỬ ─
-- 2.1 Backfill subtotal_amount cho các đơn hàng cũ (tránh bị 0đ khi thống kê)
UPDATE public.orders
SET subtotal_amount = CASE
  WHEN total_amount > 0 THEN total_amount
  WHEN final_amount > 0 THEN (final_amount + COALESCE(discount_amount, 0))
  ELSE 0
END
WHERE (subtotal_amount IS NULL OR subtotal_amount = 0)
  AND (total_amount > 0 OR final_amount > 0);

-- 2.2 Backfill discount_percent nếu có discount_amount > 0
UPDATE public.orders
SET discount_percent = ROUND((discount_amount::NUMERIC / subtotal_amount::NUMERIC) * 100)
WHERE (discount_percent IS NULL OR discount_percent = 0)
  AND discount_amount > 0 
  AND subtotal_amount > 0;

-- 2.3 Bóc tách dữ liệu lịch sử từ chuỗi customer_note vào các cột chính thức
-- Trích xuất selected_format từ cú pháp [Định dạng: ...]
UPDATE public.orders
SET selected_format = SUBSTRING(customer_note FROM '\[Định dạng:\s*([^\]]+)\]')
WHERE (selected_format IS NULL OR selected_format = '')
  AND customer_note ~ '\[Định dạng:\s*[^\]]+\]';

-- Trích xuất customer_group từ cú pháp [Nhóm: ...]
UPDATE public.orders
SET customer_group = SUBSTRING(customer_note FROM '\[Nhóm:\s*([^\]]+)\]')
WHERE (customer_group IS NULL OR customer_group = '' OR customer_group = 'Giáo viên')
  AND customer_note ~ '\[Nhóm:\s*[^\]]+\]';

-- Trích xuất flashcard_quantity từ cú pháp [Số lượng FC: ...]
UPDATE public.orders
SET flashcard_quantity = CAST(SUBSTRING(customer_note FROM '\[Số lượng FC:\s*([0-9]+)\]') AS INT)
WHERE flashcard_quantity IS NULL
  AND customer_note ~ '\[Số lượng FC:\s*[0-9]+\]';

-- ── BƯỚC 3: XỬ LÝ DỮ LIỆU TRÙNG LẶP & RÀNG BUỘC CHO USER_LIBRARY ──
-- 3.1 Xóa bản ghi trùng lặp trong user_library (giữ lại bản ghi tải nhiều nhất / cấp mới nhất)
DELETE FROM public.user_library a
USING public.user_library b
WHERE a.user_id = b.user_id
  AND a.product_slug = b.product_slug
  AND a.format_code = b.format_code
  AND (
    a.download_count < b.download_count
    OR (a.download_count = b.download_count AND a.granted_at < b.granted_at)
    OR (a.download_count = b.download_count AND a.granted_at = b.granted_at AND a.id < b.id)
  );

-- 3.2 Thêm ràng buộc duy nhất UNIQUE (user_id, product_slug, format_code) an toàn
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_user_library_user_product_format'
  ) THEN
    ALTER TABLE public.user_library 
      ADD CONSTRAINT uq_user_library_user_product_format 
      UNIQUE (user_id, product_slug, format_code);
  END IF;
END $$;

-- 3.3 Chỉ mục tối ưu tốc độ tra cứu quyền sở hữu trong Tủ sách
CREATE INDEX IF NOT EXISTS idx_user_library_lookup 
  ON public.user_library(user_id, product_slug, format_code);
