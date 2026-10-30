-- ====================================================================
-- FILE: app/api/sql/03_auth_schema.sql
-- DỰ ÁN: HUY TUTOR (huytutor.edu.vn)
-- MỤC ĐÍCH: BẢNG USERS TỰ CHỦ 100%, PHÂN QUYỀN (ROLE USER & ADMIN) & TỦ SÁCH CÁ NHÂN
-- KIẾN TRÚC: TỰ QUẢN LÝ DỮ LIỆU BẰNG BẢNG PUBLIC.USERS, KHÔNG PHỤ THUỘC VÀO AUTH.USERS
-- ====================================================================

-- 1. Tạo Bảng Users tự chủ 100% trong schema public
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,                  -- Băm một chiều bằng bcryptjs (salt 10)
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'user',     -- 'user' hoặc 'admin'
  customer_group VARCHAR(50) DEFAULT 'Giáo viên', -- Giáo viên, Học sinh, Phụ huynh, Khác
  school_or_org TEXT DEFAULT '',                -- Trường học hoặc Cơ quan công tác
  default_tax_cccd VARCHAR(50) DEFAULT '',      -- Lưu sẵn MST/CCCD khi xuất hóa đơn VAT
  default_invoice_address TEXT DEFAULT '',      -- Lưu sẵn Địa chỉ xuất hóa đơn
  
  -- Các trường phục vụ chức năng Quên mật khẩu qua Email Supabase
  reset_password_token VARCHAR(255) DEFAULT NULL,
  reset_password_expires_at TIMESTAMPTZ DEFAULT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- 2. Cập nhật Bảng Orders liên kết với User ID của public.users
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON public.orders(customer_email);

-- 3. Tạo Bảng Tủ sách cá nhân (User Library - Lưu trữ tài liệu khách đã mua trọn đời)
CREATE TABLE IF NOT EXISTS public.user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_code VARCHAR(32) NOT NULL,
  product_slug TEXT NOT NULL,
  product_title TEXT NOT NULL,
  format_code TEXT NOT NULL, -- Word, PDF, Flashcard, Trang tính, Thiết kế
  access_drive_url TEXT DEFAULT '',
  watermarked_pdf_url TEXT DEFAULT '',
  download_count INT NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON public.user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_product_slug ON public.user_library(product_slug);

-- 4. Trigger tự động cấp tài liệu vào Tủ sách cá nhân khi đơn hàng hoàn tất thanh toán
CREATE OR REPLACE FUNCTION public.handle_order_payment_completed()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_item RECORD;
BEGIN
  -- Chỉ kích hoạt khi đơn hàng chuyển sang 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    
    -- 1. Nếu đơn hàng chưa gắn user_id, tự động tìm kiếm trong bảng public.users theo Email khách mua
    IF NEW.user_id IS NOT NULL THEN
      v_user_id := NEW.user_id;
    ELSE
      SELECT id INTO v_user_id FROM public.users WHERE LOWER(email) = LOWER(NEW.customer_email) LIMIT 1;
      IF v_user_id IS NOT NULL THEN
        UPDATE public.orders SET user_id = v_user_id WHERE id = NEW.id;
      END IF;
    END IF;

    -- 2. Nếu tìm thấy tài khoản người dùng, nạp toàn bộ sản phẩm trong đơn vào Tủ sách cá nhân
    IF v_user_id IS NOT NULL THEN
      FOR v_item IN 
        SELECT product_id, product_title, format_code 
        FROM public.order_items 
        WHERE order_id = NEW.id 
      LOOP
        -- Tránh trùng lặp nếu khách mua lại cùng 1 định dạng
        IF NOT EXISTS (
          SELECT 1 FROM public.user_library 
          WHERE user_id = v_user_id AND product_slug = v_item.product_id AND format_code = v_item.format_code
        ) THEN
          INSERT INTO public.user_library (
            user_id,
            order_id,
            order_code,
            product_slug,
            product_title,
            format_code,
            is_active,
            granted_at
          ) VALUES (
            v_user_id,
            NEW.id,
            NEW.order_code,
            v_item.product_id,
            v_item.product_title,
            v_item.format_code,
            true,
            NOW()
          );
        END IF;
      END LOOP;
    END IF;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_paid_grant_library ON public.orders;
CREATE TRIGGER on_order_paid_grant_library
  AFTER UPDATE OF payment_status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_payment_completed();

-- 5. Kích hoạt RLS (Row Level Security) - Bảo vệ Backend độc quyền
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny anon access to users" ON public.users;
CREATE POLICY "Deny anon access to users" ON public.users FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Deny anon access to user_library" ON public.user_library;
CREATE POLICY "Deny anon access to user_library" ON public.user_library FOR ALL TO anon USING (false);

DROP POLICY IF EXISTS "Service role full access on users" ON public.users;
CREATE POLICY "Service role full access on users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on user_library" ON public.user_library;
CREATE POLICY "Service role full access on user_library" ON public.user_library FOR ALL TO service_role USING (true) WITH CHECK (true);
