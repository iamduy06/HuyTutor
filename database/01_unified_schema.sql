-- ====================================================================
-- HUY TUTOR UNIFIED SCHEMA (DATABASE: tovtzqbjfijoctarfwfn)
-- HỆ THỐNG XÁC THỰC TỰ CHỦ 100% & BẢO TOÀN CẤU TRÚC FLASHCARD + SHOP
-- ====================================================================

-- ── 0. TIỆN ÍCH MỞ RỘNG ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



-- ── 1. BẢNG USERS TỰ CHỦ (MASTER IDENTITY - KHÔNG DÙNG AUTH.USERS)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,                     -- Chuỗi băm Bcrypt 60 ký tự ($2a$ / $2b$)
  role TEXT NOT NULL DEFAULT 'USER' 
    CHECK (role IN ('USER', 'SUBADMIN', 'ADMIN')), -- 3 cấp quyền Flashcard
  max_devices INTEGER DEFAULT 3,                   -- Giới hạn riêng từng học viên (NULL = dùng nhóm/hệ thống)
  
  -- Thông tin hồ sơ mở rộng (phục vụ cả Shop & Flashcard)
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  customer_group TEXT DEFAULT 'Học sinh',          -- 'Giáo viên', 'Học sinh', 'Phụ huynh', 'Khác'
  school_or_org TEXT DEFAULT '',
  default_tax_cccd TEXT DEFAULT '',
  default_invoice_address TEXT DEFAULT '',
  
  is_active BOOLEAN NOT NULL DEFAULT true,
  reset_password_token TEXT DEFAULT NULL,
  reset_password_expires_at TIMESTAMPTZ DEFAULT NULL,
  last_login_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ── 2. BẢNG QUẢN LÝ PHIÊN ĐĂNG NHẬP (USER_SESSIONS) ─────────────
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,      -- JWT hoặc Session ID
  app_source VARCHAR(50) DEFAULT 'shop',           -- 'shop' | 'flashcard' | 'sso'
  device_id TEXT DEFAULT '',
  device_name TEXT DEFAULT '',
  ip_address VARCHAR(64) DEFAULT '',
  user_agent TEXT DEFAULT '',
  is_revoked BOOLEAN NOT NULL DEFAULT false,       -- Thu hồi phiên khi logout
  expires_at TIMESTAMPTZ NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON public.user_sessions(user_id, is_revoked);

-- ── 3. BẢNG THIẾT BỊ FLASHCARD (USER_DEVICES) ───────────────────
-- QUY TẮC: Khi người dùng logout, record này VẪN ĐƯỢC GIỮ NGUYÊN để bảo toàn quota 3 máy
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT DEFAULT '',
  ip_address TEXT DEFAULT '',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_uid ON public.user_devices(user_id);

-- ── 4. CÁC BẢNG NGHIỆP VỤ FLASHCARD (GIỮ NGUYÊN 100% CẤU TRÚC GỐC) ─
CREATE TABLE IF NOT EXISTS public.deck_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  level TEXT,
  level_min TEXT DEFAULT NULL,
  level_max TEXT DEFAULT NULL,
  access_level JSONB NOT NULL DEFAULT '{"public": false, "auth": false, "paid": true, "preview": false, "preview_word_limit": 10}',
  group_id UUID REFERENCES public.deck_groups(id) ON DELETE SET NULL,
  word_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  learned_count INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  expired_at TIMESTAMPTZ DEFAULT NULL,
  last_studied_word TEXT DEFAULT NULL,
  last_studied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, deck_id)
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  max_users INTEGER NOT NULL DEFAULT 10,
  max_device_per_user INTEGER NOT NULL DEFAULT 3,
  is_system BOOLEAN NOT NULL DEFAULT false,
  system_type TEXT,
  branding JSONB NOT NULL DEFAULT '{"allow_custom_branding": false, "show_header": true, "show_footer": true, "header_logo_text": null}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_subadmin BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.group_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  expired_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (group_id, deck_id)
);

-- Indexes cho Flashcard
CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id ON public.user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_deck_id ON public.user_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_group_users_uid ON public.group_users(user_id);
CREATE INDEX IF NOT EXISTS idx_group_users_gid ON public.group_users(group_id);
CREATE INDEX IF NOT EXISTS idx_group_decks_gid ON public.group_decks(group_id);
CREATE INDEX IF NOT EXISTS idx_group_decks_did ON public.group_decks(deck_id);

-- ── 5. CÁC BẢNG CỦA SHOP (HUYTUTOR COMMERCE) ─────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  blocks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category_slug TEXT DEFAULT '',
  category_name TEXT DEFAULT '',
  sub_section TEXT DEFAULT '',
  code TEXT DEFAULT '',
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  google_form_product_name TEXT DEFAULT '',
  badge_text TEXT DEFAULT '',
  short_desc TEXT DEFAULT '',
  cover_tag TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  preview_type VARCHAR(20) DEFAULT 'pdf',
  sample_pdf_source VARCHAR(20) DEFAULT 'drive',
  sample_pdf_url TEXT DEFAULT '',
  watermark_enabled BOOLEAN DEFAULT true,
  watermark_text TEXT DEFAULT 'Huy Tutor',
  preview_images JSONB DEFAULT '[]'::jsonb,
  specs JSONB DEFAULT '[]'::jsonb,
  topics JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  is_combo_eligible BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  detail_blocks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_formats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  format_code VARCHAR(50) NOT NULL,
  price INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  order_code VARCHAR(50) NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  customer_note TEXT DEFAULT '',
  need_invoice BOOLEAN DEFAULT false,
  invoice_company TEXT DEFAULT '',
  invoice_tax_code TEXT DEFAULT '',
  invoice_address TEXT DEFAULT '',
  total_amount INT NOT NULL DEFAULT 0,
  discount_amount INT DEFAULT 0,
  final_amount INT NOT NULL DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) DEFAULT 'vietqr',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL,
  google_form_product_name TEXT DEFAULT '',
  format_code VARCHAR(50) NOT NULL,
  unit_price INT NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1,
  subtotal INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  order_code VARCHAR(50),
  product_slug TEXT NOT NULL,
  product_title TEXT NOT NULL,
  format_code TEXT NOT NULL,
  access_drive_url TEXT DEFAULT '',
  watermarked_pdf_url TEXT DEFAULT '',
  download_count INT NOT NULL DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.menus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.menus(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  children JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homepage_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_type VARCHAR(50) NOT NULL,
  title TEXT DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_configs (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes cho Shop
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_uid ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_user_library_uid ON public.user_library(user_id);

-- ── 6. CÁC HÀM BẢO MẬT & TÍNH TOÁN NGHIỆP VỤ ─────────────────────
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id AND role = 'ADMIN'
  );
$$;

-- Overload tương thích hàm is_admin() không tham số
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_subadmin(p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_users 
    WHERE user_id = p_user_id AND is_subadmin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_subadmin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_users 
    WHERE is_subadmin = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_subadmin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_users
    WHERE group_id = p_group_id AND user_id = p_user_id AND is_subadmin = true
  );
$$;

-- Hàm tự động đếm số từ vựng trong bộ thẻ Flashcard
CREATE OR REPLACE FUNCTION public.calculate_deck_words(target_deck_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(
    jsonb_array_length(
      CASE 
        WHEN jsonb_typeof(tab->'vocabulary') = 'array' THEN tab->'vocabulary'
        ELSE '[]'::jsonb
      END
    )
  ), 0)
  INTO total
  FROM public.flashcards f,
       LATERAL (
         SELECT value as tab 
         FROM jsonb_array_elements(
           CASE 
             WHEN jsonb_typeof(f.content->'tabs') = 'array' THEN f.content->'tabs'
             WHEN jsonb_typeof(f.content) = 'array' THEN f.content
             ELSE '[]'::jsonb
           END
         )
       ) tabs
  WHERE f.deck_id = target_deck_id;

  RETURN total;
END;
$$;

-- Trigger tự động cập nhật word_count khi thêm/sửa/xóa thẻ flashcards
CREATE OR REPLACE FUNCTION public.trg_update_deck_word_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  d_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    d_id := OLD.deck_id;
  ELSE
    d_id := NEW.deck_id;
  END IF;

  IF d_id IS NOT NULL THEN
    UPDATE public.decks
    SET word_count = public.calculate_deck_words(d_id)
    WHERE id = d_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_flashcards_word_count ON public.flashcards;
CREATE TRIGGER trg_flashcards_word_count
AFTER INSERT OR UPDATE OR DELETE ON public.flashcards
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_deck_word_count();

