-- ============================================================
-- Huy Tutor Flashcard — Perfect Unified Schema (Final)
-- Consolidated from all migrations and logic refinements
-- ============================================================

-- ── 0. SETUP ────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. TABLES ──────────────────────────────────────────────────

-- Bảng users (Người dùng và Phân quyền hệ thống)
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL UNIQUE,
  role         TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'SUBADMIN', 'ADMIN')),
  max_devices  INTEGER DEFAULT NULL, -- NULL = dùng global setting hoặc group setting
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng deck_groups (Danh mục các bộ đề)
CREATE TABLE IF NOT EXISTS public.deck_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng decks (Bộ thẻ Flashcard)
CREATE TABLE IF NOT EXISTS public.decks (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title              TEXT NOT NULL,
  description        TEXT,
  level              TEXT,                -- CEFR display string
  level_min          TEXT DEFAULT NULL,   -- CEFR min
  level_max          TEXT DEFAULT NULL,   -- CEFR max
  -- Cấu trúc JSONB mới nhất: { public, auth, paid, preview, preview_word_limit }
  access_level       JSONB NOT NULL DEFAULT '{"public": false, "auth": false, "paid": true, "preview": false, "preview_word_limit": 10}',
  group_id           UUID REFERENCES public.deck_groups(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng flashcards (Nội dung dữ liệu của bộ thẻ)
CREATE TABLE IF NOT EXISTS public.flashcards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id     UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  content     JSONB NOT NULL, -- Theo cấu trúc Tabs/Vocab
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng user_decks (Quyền sở hữu và tiến độ học tập cá nhân)
CREATE TABLE IF NOT EXISTS public.user_decks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deck_id           UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  progress_percent  INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  learned_count     INTEGER NOT NULL DEFAULT 0,
  streak            INTEGER NOT NULL DEFAULT 0,
  expired_at        TIMESTAMPTZ DEFAULT NULL, -- NULL = vĩnh viễn
  last_studied_word TEXT DEFAULT NULL,
  last_studied_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, deck_id)
);

-- Bảng user_devices (Quản lý thiết bị đăng nhập)
CREATE TABLE IF NOT EXISTS public.user_devices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id   TEXT NOT NULL,
  device_name TEXT,
  ip_address  TEXT,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

-- Bảng app_settings (Cấu hình hệ thống global)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Bảng groups (Nhóm học viên do Subadmin quản lý)
CREATE TABLE IF NOT EXISTS public.groups (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  description          TEXT,
  max_users            INTEGER NOT NULL DEFAULT 10,
  max_device_per_user  INTEGER NOT NULL DEFAULT 3,
  is_system           BOOLEAN NOT NULL DEFAULT false,
  system_type         TEXT, -- 'admin_created', 'registered'
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng group_users (Phân định thành viên và Subadmin của nhóm)
CREATE TABLE IF NOT EXISTS public.group_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_subadmin BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (group_id, user_id)
);

-- Bảng group_decks (Bộ đề được gán cho toàn bộ nhóm)
CREATE TABLE IF NOT EXISTS public.group_decks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  deck_id    UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  expired_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT group_decks_group_id_deck_id_key UNIQUE (group_id, deck_id)
);

-- ── 2. INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id      ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id      ON public.user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_deck_id      ON public.user_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_group_users_user_id     ON public.group_users(user_id);
CREATE INDEX IF NOT EXISTS idx_group_users_group_id    ON public.group_users(group_id);
CREATE INDEX IF NOT EXISTS idx_group_decks_group_id    ON public.group_decks(group_id);
CREATE INDEX IF NOT EXISTS idx_group_decks_deck_id     ON public.group_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_decks_group_id          ON public.decks(group_id);

-- ── 3. SECURITY HELPER FUNCTIONS (Optimized to avoid recursion) ──

-- Xóa các function cũ để viết lại
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_subadmin() CASCADE;
DROP FUNCTION IF EXISTS public.is_group_subadmin(UUID) CASCADE;

-- Is Admin? (SECURITY DEFINER + search_path protection)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;
ALTER FUNCTION public.is_admin() OWNER TO postgres;

-- Is SubAdmin of ANY group?
CREATE OR REPLACE FUNCTION public.is_subadmin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_users 
    WHERE user_id = auth.uid() AND is_subadmin = true
  );
$$;
ALTER FUNCTION public.is_subadmin() OWNER TO postgres;

-- Is SubAdmin of a SPECIFIC group?
CREATE OR REPLACE FUNCTION public.is_group_subadmin(group_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_users
    WHERE group_id = group_uuid AND user_id = auth.uid() AND is_subadmin = true
  );
$$;
ALTER FUNCTION public.is_group_subadmin(UUID) OWNER TO postgres;

-- ── 4. RLS ENABLE ───────────────────────────────────────────────

ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_groups   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_decks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_decks  ENABLE ROW LEVEL SECURITY;

-- ── 5. RLS POLICIES (Bypass Recursion) ───────────────────────────

-- 5.1 USERS Policies
DROP POLICY IF EXISTS "Users: view" ON public.users;
DROP POLICY IF EXISTS "Users: view own" ON public.users;
DROP POLICY IF EXISTS "Admin All: view users" ON public.users;
DROP POLICY IF EXISTS "Subadmin: view group users" ON public.users;
DROP POLICY IF EXISTS "Users: update" ON public.users;

CREATE POLICY "Users: view own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admin All: view users" ON public.users FOR SELECT USING (public.is_admin());
CREATE POLICY "Subadmin: view group users" ON public.users FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.group_users gu1
    JOIN public.group_users gu2 ON gu1.group_id = gu2.group_id
    WHERE gu1.user_id = auth.uid() AND gu1.is_subadmin = true AND gu2.user_id = public.users.id
  )
);
CREATE POLICY "Users: update" ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- 5.2 DECKS Policies
DROP POLICY IF EXISTS "Decks: access control" ON public.decks;
CREATE POLICY "Decks: access control" ON public.decks FOR SELECT USING (
  ((access_level->>'public')::boolean = true)                                       -- Public
  OR ((access_level->>'auth')::boolean = true AND auth.uid() IS NOT NULL)           -- Auth
  OR ((access_level->>'preview')::boolean = true)                                   -- Preview
  OR public.is_admin()                                                              -- Admin
  OR EXISTS (                                                                       -- Paid/Gán
     SELECT 1 FROM public.user_decks 
     WHERE user_id = auth.uid() AND deck_id = id 
     AND (expired_at IS NULL OR expired_at > now())
  )
);

-- 5.3 FLASHCARDS Policies
DROP POLICY IF EXISTS "Flashcards: selective view" ON public.flashcards;
CREATE POLICY "Flashcards: selective view" ON public.flashcards FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.decks WHERE id = deck_id)
);

-- 5.4 GROUPS & MEMBERSHIPS
DROP POLICY IF EXISTS "Groups: access" ON public.groups;
DROP POLICY IF EXISTS "GroupUsers: view own" ON public.group_users;
DROP POLICY IF EXISTS "GroupUsers: admin access" ON public.group_users;
DROP POLICY IF EXISTS "GroupUsers: subadmin access" ON public.group_users;

CREATE POLICY "Groups: access" ON public.groups FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.group_users WHERE group_id = id AND user_id = auth.uid())
);

CREATE POLICY "GroupUsers: view own" ON public.group_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "GroupUsers: admin access" ON public.group_users FOR SELECT USING (public.is_admin());
CREATE POLICY "GroupUsers: subadmin access" ON public.group_users FOR SELECT USING (public.is_group_subadmin(group_id));

-- 5.5 DECK GROUPS & MISC
DROP POLICY IF EXISTS "DeckGroups: view all" ON public.deck_groups;
CREATE POLICY "DeckGroups: view all" ON public.deck_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "GroupDecks: access" ON public.group_decks;
CREATE POLICY "GroupDecks: access" ON public.group_decks FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.group_users WHERE group_id = group_id AND user_id = auth.uid())
);

-- 5.6 ADMIN Full-Access (Catch-all)
CREATE POLICY "Admin: global control" ON public.users FOR ALL USING (public.is_admin());
CREATE POLICY "Admin: decks global" ON public.decks FOR ALL USING (public.is_admin());
CREATE POLICY "Admin: flashcards global" ON public.flashcards FOR ALL USING (public.is_admin());
CREATE POLICY "Admin: group_decks global" ON public.group_decks FOR ALL USING (public.is_admin());
CREATE POLICY "Admin: groups global" ON public.groups FOR ALL USING (public.is_admin());
CREATE POLICY "Admin: deck_groups global" ON public.deck_groups FOR ALL USING (public.is_admin());
CREATE POLICY "Admin: user_devices global" ON public.user_devices FOR ALL USING (public.is_admin());

-- ── 6. TRIGGERS ────────────────────────────────────────────────

-- Tự động xử lý user mới
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_group_id UUID;
  v_role TEXT;
  v_is_admin_created BOOLEAN;
  v_skip_system BOOLEAN;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'USER');
  v_is_admin_created := (NEW.raw_user_meta_data->>'created_by_admin')::BOOLEAN;
  v_skip_system := (NEW.raw_user_meta_data->>'skip_system_group')::BOOLEAN;

  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, v_role)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  IF v_skip_system IS NOT TRUE THEN
    IF v_is_admin_created IS TRUE THEN
      SELECT id INTO v_group_id FROM public.groups WHERE name = 'SYSTEM_ADMIN_CREATED' LIMIT 1;
    ELSE
      SELECT id INTO v_group_id FROM public.groups WHERE name = 'SYSTEM_REGISTERED' LIMIT 1;
    END IF;

    IF v_group_id IS NOT NULL THEN
      INSERT INTO public.group_users (group_id, user_id, is_subadmin)
      VALUES (v_group_id, NEW.id, false)
      ON CONFLICT (group_id, user_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 7. SEED DATA ───────────────────────────────────────────────

INSERT INTO public.app_settings (key, value)
VALUES ('global_max_devices', '3')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.groups (name, description, max_users, is_system, system_type)
VALUES 
  ('SYSTEM_ADMIN_CREATED', 'Nhóm hệ thống chứa người dùng do Admin tạo', 999999, true, 'admin_created'),
  ('SYSTEM_REGISTERED', 'Nhóm hệ thống chứa người dùng tự đăng ký', 999999, true, 'registered')
ON CONFLICT (name) DO NOTHING;
