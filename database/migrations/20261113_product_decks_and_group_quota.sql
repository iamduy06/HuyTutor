-- ====================================================================
-- MIGRATION: 20261113_product_decks_and_group_quota.sql
-- MỤC TIÊU:
-- 1. BỔ SUNG LIÊN KẾT ĐA BỘ THẺ FLASHCARD CHO SẢN PHẨM SHOP (LINKED_DECK_IDS & PRODUCT_DECKS)
-- 2. TÁI CẤU TRÚC HẠN NGẠCH THEO TỪNG BỘ THẺ TRONG NHÓM (GROUP_DECKS.MAX_USERS & GROUP_USER_DECKS)
-- 3. CHUYỂN ĐỔI DỮ LIỆU CŨ AN TOÀN (IDEMPOTENT 3-STEP DATA BACKFILL)
-- ====================================================================

-- ── 1. PHÂN HỆ SHOP: LIÊN KẾT BỘ THẺ FLASHCARD VÀO SẢN PHẨM ─────────

-- 1.1 Bổ sung cột linked_deck_ids vào public.products (dạng JSONB mảng UUID)
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS linked_deck_ids JSONB DEFAULT '[]'::jsonb;

-- 1.2 Tạo bảng quan hệ phụ trợ nhiều - nhiều public.product_decks
CREATE TABLE IF NOT EXISTS public.product_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_deck UNIQUE (product_id, deck_id)
);

-- 1.3 Tạo chỉ mục tối ưu truy vấn cho public.product_decks
CREATE INDEX IF NOT EXISTS idx_product_decks_pid ON public.product_decks(product_id);
CREATE INDEX IF NOT EXISTS idx_product_decks_did ON public.product_decks(deck_id);

-- 1.4 Kích hoạt Row Level Security (RLS) bảo vệ truy cập
ALTER TABLE public.product_decks ENABLE ROW LEVEL SECURITY;


-- ── 2. PHÂN HỆ FLASHCARD: HẠN NGẠCH DECK VÀ GÁN HỌC SINH ─────────────

-- 2.1 Tạo bảng chi tiết gán học sinh ↔ bộ thẻ trong nhóm (public.group_user_decks)
CREATE TABLE IF NOT EXISTS public.group_user_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_group_user_deck UNIQUE (group_id, user_id, deck_id)
);

-- 2.2 Tạo chỉ mục tối ưu truy vấn cho public.group_user_decks
CREATE INDEX IF NOT EXISTS idx_gud_group_deck ON public.group_user_decks(group_id, deck_id);
CREATE INDEX IF NOT EXISTS idx_gud_user ON public.group_user_decks(user_id);

-- 2.3 Kích hoạt Row Level Security (RLS) cho public.group_user_decks
ALTER TABLE public.group_user_decks ENABLE ROW LEVEL SECURITY;


-- ── 3. CHUYỂN ĐỔI DỮ LIỆU CŨ AN TOÀN (IDEMPOTENT 3-STEP BACKFILL) ───
-- Chống tái thực thi (idempotency guard) để ngăn chặn hiện tượng nhân đôi / lũy tiến
-- tổng hạn ngạch groups.max_users khi chạy lại migration script.

DO $$
DECLARE
  v_column_added BOOLEAN := false;
BEGIN
  -- 3.1 Kiểm tra sự tồn tại của cột max_users trên public.group_decks
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'group_decks' 
      AND column_name = 'max_users'
  ) THEN
    ALTER TABLE public.group_decks 
      ADD COLUMN max_users INTEGER NOT NULL DEFAULT 10;
    v_column_added := true;
  END IF;

  -- 3.2 Chỉ thực hiện Bước 1 và Bước 3 nếu cột max_users vừa được thêm mới
  -- (ngăn chặn việc tính lại SUM trên dữ liệu đã được gán giá trị SUM ở lần chạy trước)
  IF v_column_added THEN
    -- Bước 1: Gán max_users của group_decks hiện có = groups.max_users của nhóm đó (Quyết định 6)
    UPDATE public.group_decks gd
    SET max_users = COALESCE(g.max_users, 10)
    FROM public.groups g
    WHERE gd.group_id = g.id;

    -- Bước 2: Đồng bộ các liên kết user_decks đã có sẵn của thành viên nhóm vào group_user_decks
    INSERT INTO public.group_user_decks (group_id, user_id, deck_id, assigned_at)
    SELECT gu.group_id, ud.user_id, ud.deck_id, COALESCE(ud.created_at, NOW())
    FROM public.group_users gu
    JOIN public.user_decks ud ON gu.user_id = ud.user_id
    JOIN public.group_decks gd ON gu.group_id = gd.group_id AND ud.deck_id = gd.deck_id
    ON CONFLICT (group_id, user_id, deck_id) DO NOTHING;

    -- Bước 3: Cập nhật lại groups.max_users = Tổng max_users của các decks trong nhóm (Quyết định 3)
    UPDATE public.groups g
    SET max_users = COALESCE((
      SELECT SUM(gd.max_users) 
      FROM public.group_decks gd 
      WHERE gd.group_id = g.id
    ), g.max_users, 10);
  ELSE
    -- Nếu cột max_users đã tồn tại từ trước, chỉ thực hiện đồng bộ bổ sung Bước 2 (idempotent an toàn)
    INSERT INTO public.group_user_decks (group_id, user_id, deck_id, assigned_at)
    SELECT gu.group_id, ud.user_id, ud.deck_id, COALESCE(ud.created_at, NOW())
    FROM public.group_users gu
    JOIN public.user_decks ud ON gu.user_id = ud.user_id
    JOIN public.group_decks gd ON gu.group_id = gd.group_id AND ud.deck_id = gd.deck_id
    ON CONFLICT (group_id, user_id, deck_id) DO NOTHING;
  END IF;
END $$;
