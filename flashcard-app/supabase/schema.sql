-- ============================================================
-- Huy Tutor Flashcard — Full Database Schema v4
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. TABLES ──────────────────────────────────────────────────

-- Bảng users (Người dùng)
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL UNIQUE,
  role         TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'SUBADMIN', 'ADMIN')),
  max_devices  INTEGER DEFAULT NULL, -- Số thiết bị tối đa user được phép đăng nhập
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng decks (Bộ thẻ)
CREATE TABLE IF NOT EXISTS public.decks (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title              TEXT NOT NULL,
  description        TEXT,
  level              TEXT,
  level_min          TEXT DEFAULT NULL,
  level_max          TEXT DEFAULT NULL,
  access_level       TEXT NOT NULL DEFAULT 'authorized' 
                       CHECK (access_level IN ('public', 'authenticated', 'authorized', 'preview')),
  preview_word_limit INTEGER NOT NULL DEFAULT 10,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng flashcards (Nội dung thẻ)
CREATE TABLE IF NOT EXISTS public.flashcards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id     UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng user_decks (Tiến độ học tập)
CREATE TABLE IF NOT EXISTS public.user_decks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deck_id           UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  progress_percent  INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  learned_count     INTEGER NOT NULL DEFAULT 0,
  streak            INTEGER NOT NULL DEFAULT 0,
  expired_at        TIMESTAMPTZ DEFAULT NULL, -- NULL = vĩnh viễn
  last_studied_word TEXT DEFAULT NULL,        -- Lưu từ cuối cùng mà người dùng học
  last_studied_at   TIMESTAMPTZ,              -- Lần cuối cùng học
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, deck_id)
);

-- Bảng user_devices (Quản lý thiết bị)
CREATE TABLE IF NOT EXISTS public.user_devices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id   TEXT NOT NULL,
  device_name TEXT,
  ip_address  TEXT,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

-- Bảng app_settings (Cấu hình hệ thống)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Bảng groups (Nhóm)
CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  max_users   INTEGER NOT NULL DEFAULT 10,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bảng group_users (Thành viên nhóm)
CREATE TABLE IF NOT EXISTS public.group_users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_subadmin BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (group_id, user_id)
);

-- Bảng group_decks (Bộ đề được giao cho nhóm)
CREATE TABLE IF NOT EXISTS public.group_decks (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  deck_id    UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  expired_at TIMESTAMPTZ DEFAULT NULL,
  UNIQUE (group_id, deck_id)
);

-- ── 2. INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id  ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id  ON public.user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_deck_id  ON public.user_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_group_users_user_id ON public.group_users(user_id);
CREATE INDEX IF NOT EXISTS idx_group_users_group_id ON public.group_users(group_id);
CREATE INDEX IF NOT EXISTS idx_group_decks_group_id ON public.group_decks(group_id);

-- ── 3. HELPER FUNCTIONS ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- Kiểm tra user có phải là SubAdmin của ít nhất một nhóm không
CREATE OR REPLACE FUNCTION public.is_subadmin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_users
    WHERE user_id = auth.uid() AND is_subadmin = true
  );
$$;

-- Kiểm tra user có phải là SubAdmin của một nhóm cụ thể không
CREATE OR REPLACE FUNCTION public.is_group_subadmin(group_uuid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_users
    WHERE group_id = group_uuid AND user_id = auth.uid() AND is_subadmin = true
  );
$$;

-- ── 4. RLS ENABLE ───────────────────────────────────────────────

ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_decks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_users  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_decks  ENABLE ROW LEVEL SECURITY;

-- ── 5. RLS POLICIES ─────────────────────────────────────────────

-- users policies
CREATE POLICY "Users: view own" ON public.users FOR SELECT USING (
  auth.uid() = id OR public.is_admin() OR 
  EXISTS (
    SELECT 1 FROM public.group_users gu1
    JOIN public.group_users gu2 ON gu1.group_id = gu2.group_id
    WHERE gu1.user_id = auth.uid() AND gu1.is_subadmin = true AND gu2.user_id = public.users.id
  )
);

CREATE POLICY "Users: update own" ON public.users FOR UPDATE USING (
  auth.uid() = id OR public.is_admin()
);

-- decks policies
CREATE POLICY "Decks: access control" ON public.decks FOR SELECT USING (
  access_level = 'public' 
  OR (access_level = 'authenticated' AND auth.role() = 'authenticated')
  OR (access_level = 'preview')
  OR public.is_admin()
  OR EXISTS (SELECT 1 FROM public.user_decks WHERE user_id = auth.uid() AND deck_id = id)
);

-- group policies
CREATE POLICY "Groups: access" ON public.groups FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.group_users WHERE group_id = id AND user_id = auth.uid())
);

-- group_users policies
CREATE POLICY "GroupUsers: access" ON public.group_users FOR SELECT USING (
  public.is_admin() OR EXISTS (SELECT 1 FROM public.group_users gu WHERE gu.group_id = group_id AND gu.user_id = auth.uid())
);

-- general write policies for admin
CREATE POLICY "Admin All: decks" ON public.decks FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All: flashcards" ON public.flashcards FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All: group_decks" ON public.group_decks FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All: groups" ON public.groups FOR ALL USING (public.is_admin());
CREATE POLICY "Admin All: users" ON public.users FOR ALL USING (public.is_admin());

-- ── 6. TRIGGER: auto-create user ──────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'role', 'USER'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 7. SEED DATA ──────────────────────────────────────────────

INSERT INTO public.app_settings (key, value)
VALUES ('global_max_devices', '3')
ON CONFLICT (key) DO NOTHING;
