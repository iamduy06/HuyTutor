-- ====================================================================
-- FILE: shop/app/api/sql/08_user_carts.sql
-- DỰ ÁN: HUY TUTOR (huytutor.edu.vn)
-- MỤC ĐÍCH: BẢNG USER_CARTS LƯU TRỮ GIỎ HÀNG ĐỒNG BỘ ĐA THIẾT BỊ (CROSS-DEVICE CART SYNC)
--           VỚI COMPACT PAYLOAD & CART HASH TỐI ƯU HÓA EGRESS CSDL
-- QUY ĐỊNH BẢO MẬT & RETENTION:
--   - RLS BẬT, CHỈ SERVICE_ROLE ĐƯỢC PHÉP TRUY VẤN/GHI (CHẶN ANON TOÀN DIỆN)
--   - RÀNG BUỘC TTL 30 NGÀY QUA HÀM CLEANUP_EXPIRED_USER_CARTS()
-- ====================================================================

-- 1. Tạo bảng lưu trữ giỏ hàng người dùng
CREATE TABLE IF NOT EXISTS public.user_carts (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_hash TEXT DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Chỉ mục hỗ trợ sắp xếp và truy vấn thời gian cập nhật & dọn dẹp TTL
CREATE INDEX IF NOT EXISTS idx_user_carts_updated_at ON public.user_carts(updated_at);

-- 3. Bật Row Level Security (RLS)
ALTER TABLE public.user_carts ENABLE ROW LEVEL SECURITY;

-- 4. Phân quyền RLS: Chặn truy cập từ anon, chỉ service_role có toàn quyền
DROP POLICY IF EXISTS "Deny anon access to user_carts" ON public.user_carts;
CREATE POLICY "Deny anon access to user_carts" ON public.user_carts 
  FOR ALL TO anon 
  USING (false);

DROP POLICY IF EXISTS "Service role full access on user_carts" ON public.user_carts;
CREATE POLICY "Service role full access on user_carts" ON public.user_carts 
  FOR ALL TO service_role 
  USING (true) 
  WITH CHECK (true);

-- 5. Trigger tự động cập nhật updated_at khi có thao tác UPDATE
CREATE OR REPLACE FUNCTION public.set_user_carts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_carts_updated_at ON public.user_carts;
CREATE TRIGGER trigger_user_carts_updated_at
  BEFORE UPDATE ON public.user_carts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_carts_updated_at();

-- 6. Hàm dọn dẹp giỏ hàng hết hạn lưu trữ (Mặc định 30 ngày theo quyết định người dùng)
CREATE OR REPLACE FUNCTION public.cleanup_expired_user_carts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_carts
  WHERE updated_at < (NOW() - INTERVAL '30 days');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
