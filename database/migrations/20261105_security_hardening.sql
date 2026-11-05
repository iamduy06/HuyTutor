-- ====================================================================
-- MIGRATION: 20261105_security_hardening.sql
-- MỤC TIÊU: 
-- 1. XÓA BỎ HÀM NGUY HIỂM PUBLIC.EXEC_SQL (SEC-01)
-- 2. BỔ SUNG CỘT VIEW_TOKEN ĐỂ BẢO VỆ PII ĐƠN HÀNG (SEC-05)
-- ====================================================================

-- 1. Thu hồi toàn bộ quyền thực thi hàm exec_sql và xóa vĩnh viễn khỏi public schema
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'exec_sql' AND pronamespace = 'public'::regnamespace
  ) THEN
    REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC, anon, authenticated;
    DROP FUNCTION IF EXISTS public.exec_sql(text);
  END IF;
END $$;

-- 2. Bổ sung cột view_token cho bảng public.orders để chống IDOR và rò rỉ dữ liệu PII
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS view_token VARCHAR(64) DEFAULT '';

-- 3. Tạo chỉ mục tối ưu tìm kiếm theo view_token
CREATE INDEX IF NOT EXISTS idx_orders_view_token 
  ON public.orders(view_token);
