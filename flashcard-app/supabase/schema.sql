-- ============================================================
-- Huy Tutor Flashcard — Full Database Schema v3
-- Run entirely in Supabase SQL Editor (idempotent)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLES ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT NOT NULL UNIQUE,
  -- USER | SUBADMIN | ADMIN
  role              TEXT NOT NULL DEFAULT 'USER'
                      CHECK (role IN ('USER', 'SUBADMIN', 'ADMIN')),
  -- NULL = created by ADMIN or self-registered, uuid = created by a SUBADMIN
  created_by        UUID REFERENCES public.users(id) ON DELETE SET NULL DEFAULT NULL,
  -- max users a SUBADMIN can create (ignored for ADMIN/USER)
  max_managed_users INTEGER NOT NULL DEFAULT 10,
  -- max devices per user (NULL = use global app_settings)
  max_devices       INTEGER DEFAULT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.decks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  level       TEXT,
  level_min   TEXT DEFAULT NULL,
  level_max   TEXT DEFAULT NULL,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Each deck has one flashcard row; content = { tabs: [...] }
CREATE TABLE IF NOT EXISTS public.flashcards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id     UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_decks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deck_id          UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  learned_count    INTEGER NOT NULL DEFAULT 0,
  streak           INTEGER NOT NULL DEFAULT 0,
  expired_at       TIMESTAMPTZ DEFAULT NULL,   -- NULL = unlimited
  last_studied_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, deck_id)
);

CREATE TABLE IF NOT EXISTS public.user_devices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_id   TEXT NOT NULL,
  device_name TEXT,
  ip_address  TEXT,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO public.app_settings (key, value)
VALUES ('global_max_devices', '3')
ON CONFLICT (key) DO NOTHING;

-- ── INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id  ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id  ON public.user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_deck_id  ON public.user_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_expired  ON public.user_decks(expired_at);
CREATE INDEX IF NOT EXISTS idx_decks_is_public     ON public.decks(is_public);
CREATE INDEX IF NOT EXISTS idx_users_created_by    ON public.users(created_by);
CREATE INDEX IF NOT EXISTS idx_devices_user_id     ON public.user_devices(user_id);

-- ── ENABLE RLS ───────────────────────────────────────────────

ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_decks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ── HELPER FUNCTIONS (SECURITY DEFINER = bypass RLS, no recursion) ──────────
-- IMPORTANT: These functions use auth.uid() and directly query users table
-- with SECURITY DEFINER so they run as the function owner (bypassing RLS).
-- This prevents the infinite recursion problem.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER   -- runs as owner, bypasses RLS on public.users
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_subadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'SUBADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_subadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUBADMIN')
  );
$$;

-- ── RLS POLICIES ─────────────────────────────────────────────
-- Drop ALL old policy names first to avoid conflicts

-- users
DROP POLICY IF EXISTS "users_select_own"        ON public.users;
DROP POLICY IF EXISTS "users_admin_all"          ON public.users;
DROP POLICY IF EXISTS "Users: view own profile"  ON public.users;
DROP POLICY IF EXISTS "Users: insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users: update own profile" ON public.users;
DROP POLICY IF EXISTS "Users: admin delete"       ON public.users;
DROP POLICY IF EXISTS "users_select_all"         ON public.users;
DROP POLICY IF EXISTS "users_insert"             ON public.users;
DROP POLICY IF EXISTS "users_update"             ON public.users;
DROP POLICY IF EXISTS "users_delete"             ON public.users;

-- A user can always SELECT their own row (for profile fetch)
-- Admin can see ALL users
-- SubAdmin can see users they created (created_by = their id)
CREATE POLICY "users_select" ON public.users FOR SELECT USING (
  auth.uid() = id
  OR public.is_admin()
  OR (public.is_subadmin() AND created_by = auth.uid())
);

-- Any authenticated user can insert their own profile (signup trigger)
-- Admin and subadmin can also insert (create users)
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (
  auth.uid() = id
  OR public.is_admin()
  OR public.is_subadmin()
);

-- User can update own profile; admin/subadmin can update users they manage
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (
  auth.uid() = id
  OR public.is_admin()
  OR (public.is_subadmin() AND created_by = auth.uid())
);

-- Only admin can delete users
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (
  public.is_admin()
  OR (public.is_subadmin() AND created_by = auth.uid())
);

-- decks: public read, admin write
DROP POLICY IF EXISTS "decks_public_read" ON public.decks;
DROP POLICY IF EXISTS "decks_admin_all"   ON public.decks;
CREATE POLICY "decks_public_read" ON public.decks FOR SELECT USING (true);
CREATE POLICY "decks_admin_write" ON public.decks FOR ALL   USING (public.is_admin());

-- flashcards: public read, admin write
DROP POLICY IF EXISTS "flashcards_public_read" ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_admin_all"   ON public.flashcards;
CREATE POLICY "flashcards_public_read" ON public.flashcards FOR SELECT USING (true);
CREATE POLICY "flashcards_admin_write" ON public.flashcards FOR ALL   USING (public.is_admin());

-- user_decks: user sees own, admin sees all, subadmin sees for users they manage
DROP POLICY IF EXISTS "ud_select_own" ON public.user_decks;
DROP POLICY IF EXISTS "ud_update_own" ON public.user_decks;
DROP POLICY IF EXISTS "ud_admin_all"  ON public.user_decks;
DROP POLICY IF EXISTS "ud_select"     ON public.user_decks;
DROP POLICY IF EXISTS "ud_write"      ON public.user_decks;

CREATE POLICY "ud_select" ON public.user_decks FOR SELECT USING (
  auth.uid() = user_id
  OR public.is_admin()
  OR (
    public.is_subadmin()
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = user_decks.user_id AND u.created_by = auth.uid()
    )
  )
);

CREATE POLICY "ud_update_own" ON public.user_decks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ud_write_admin" ON public.user_decks FOR ALL USING (public.is_admin());

-- user_devices
DROP POLICY IF EXISTS "devices_own" ON public.user_devices;
CREATE POLICY "devices_own" ON public.user_devices
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- app_settings
DROP POLICY IF EXISTS "settings_public_read" ON public.app_settings;
DROP POLICY IF EXISTS "settings_admin_write" ON public.app_settings;
CREATE POLICY "settings_public_read" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_write" ON public.app_settings FOR ALL   USING (public.is_admin());

-- ── TRIGGER: auto-create profile on signup ────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role       TEXT;
  v_created_by UUID;
BEGIN
  -- Read role and created_by from metadata passed by the API
  v_role       := COALESCE(NEW.raw_user_meta_data->>'role', 'USER');
  v_created_by := NULLIF(NEW.raw_user_meta_data->>'created_by', '')::UUID;

  INSERT INTO public.users (id, email, role, created_by)
  VALUES (NEW.id, NEW.email, v_role, v_created_by)
  ON CONFLICT (id) DO UPDATE
    SET role       = EXCLUDED.role,
        created_by = COALESCE(EXCLUDED.created_by, public.users.created_by);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── SAMPLE DATA ───────────────────────────────────────────────
-- Set admin: UPDATE public.users SET role = 'ADMIN' WHERE email = 'admin@example.com';

DO $$
DECLARE v_deck_id UUID;
BEGIN
  -- Only insert if no decks exist
  IF (SELECT COUNT(*) FROM public.decks) = 0 THEN
    INSERT INTO public.decks (title, description, level, is_public)
    VALUES ('IELTS Academic Vocabulary', 'Từ vựng học thuật B2–C1 cho IELTS Academic', 'B2', false)
    RETURNING id INTO v_deck_id;

    INSERT INTO public.flashcards (deck_id, content) VALUES (
      v_deck_id,
      jsonb_build_object(
        'tabs', jsonb_build_array(
          jsonb_build_object(
            'id', 'unit-1',
            'label', 'Unit 1 — Academic Word List',
            'desc', '10 từ học thuật phổ biến nhất trong IELTS',
            'vocabulary', '[
              {"word":"exacerbate","phonetic":"/ɪɡˈzæs.ə.beɪt/","meaning":"làm trầm trọng thêm","type":"Verb","example":"The drought was exacerbated by poor water management.","translation":"Hạn hán bị làm trầm trọng thêm bởi chính sách quản lý nước kém.","synonyms":["aggravate","worsen"],"antonyms":["alleviate","mitigate"],"cefr":"C1"},
              {"word":"unprecedented","phonetic":"/ʌnˈpres.ɪ.den.tɪd/","meaning":"chưa từng có tiền lệ","type":"Adjective","example":"The pandemic caused unprecedented disruption.","translation":"Đại dịch gây ra sự gián đoạn chưa từng có.","synonyms":["unparalleled","extraordinary"],"antonyms":["common","ordinary"],"cefr":"C1"},
              {"word":"ambiguous","phonetic":"/æmˈbɪɡ.ju.əs/","meaning":"mơ hồ, không rõ ràng","type":"Adjective","example":"The clause was ambiguous and led to disputes.","translation":"Điều khoản mơ hồ dẫn đến tranh chấp.","synonyms":["vague","unclear"],"antonyms":["clear","explicit"],"cefr":"B2"},
              {"word":"pragmatic","phonetic":"/præɡˈmæt.ɪk/","meaning":"thực dụng","type":"Adjective","example":"We need a pragmatic approach.","translation":"Chúng ta cần cách tiếp cận thực dụng.","synonyms":["practical","realistic"],"antonyms":["idealistic","impractical"],"cefr":"C1"},
              {"word":"meticulous","phonetic":"/məˈtɪk.jʊ.ləs/","meaning":"tỉ mỉ, cẩn thận","type":"Adjective","example":"Her meticulous research impressed everyone.","translation":"Nghiên cứu tỉ mỉ của cô ấy gây ấn tượng.","synonyms":["thorough","painstaking"],"antonyms":["careless","sloppy"],"cefr":"C1"}
            ]'::jsonb
          )
        )
      )
    );
    RAISE NOTICE 'Sample deck created: %', v_deck_id;
  END IF;
END;
$$;
