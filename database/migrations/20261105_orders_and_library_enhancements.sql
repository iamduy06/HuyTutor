-- ====================================================================
-- MIGRATION: 20261105_orders_and_library_enhancements.sql
-- CHUẨN HÓA SCHEMA BẢNG ORDERS VÀ CHỐNG TRÙNG LẶP DỮ LIỆU USER_LIBRARY
-- ====================================================================

-- 1. Bổ sung các cột nghiệp vụ cho bảng public.orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS selected_format VARCHAR(50),
  ADD COLUMN IF NOT EXISTS flashcard_quantity INT,
  ADD COLUMN IF NOT EXISTS customer_group TEXT DEFAULT 'Giáo viên',
  ADD COLUMN IF NOT EXISTS subtotal_amount INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percent INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_ref_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_form_submitted BOOLEAN DEFAULT false;

-- 2. Xóa các bản ghi trùng lặp (nếu có) trước khi tạo ràng buộc UNIQUE
DELETE FROM public.user_library a USING public.user_library b
WHERE a.id < b.id 
  AND a.user_id = b.user_id 
  AND a.product_slug = b.product_slug 
  AND a.format_code = b.format_code;

-- 3. Thêm ràng buộc UNIQUE (user_id, product_slug, format_code) cho user_library
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

-- 4. Tạo chỉ mục tìm kiếm tối ưu cho user_library
CREATE INDEX IF NOT EXISTS idx_user_library_lookup 
  ON public.user_library(user_id, product_slug, format_code);
