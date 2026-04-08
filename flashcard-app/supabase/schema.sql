-- ============================================================
-- Huy Tutor Flashcard — Full Database Schema v5
-- Consolidated, Idempotent & Anti-Recursion
-- Run entirely in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. TABLES ───────────────────────────────────────────────────

-- 1.1 GROUPS
CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  owner_id    UUID, -- FK added later to avoid circular dependency
  max_users   INTEGER NOT NULL DEFAULT 10,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 USERS
CREATE TABLE IF NOT EXISTS public.users (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT NOT NULL UNIQUE,
  role              TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'SUBADMIN', 'ADMIN')),
  created_by        UUID REFERENCES public.users(id) ON DELETE SET NULL DEFAULT NULL,
  max_managed_users INTEGER NOT NULL DEFAULT 10,
  max_devices       INTEGER DEFAULT NULL,
  group_id          UUID REFERENCES public.groups(id) ON DELETE SET NULL DEFAULT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 Add owner_id FK to groups
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'groups_owner_id_fkey') THEN
    ALTER TABLE public.groups ADD CONSTRAINT groups_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 1.4 DECKS
CREATE TABLE IF NOT EXISTS public.decks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  level       TEXT,
  level_min   TEXT DEFAULT NULL,
  level_max   TEXT DEFAULT NULL,
  is_public   BOOLEAN NOT NULL DEFAULT false,
  access_mode TEXT NOT NULL DEFAULT 'assigned_only' CHECK (access_mode IN ('assigned_only', 'login_full', 'public_full', 'public_demo')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 FLASHCARDS
CREATE TABLE IF NOT EXISTS public.flashcards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id     UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  content     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 USER_DECKS
CREATE TABLE IF NOT EXISTS public.user_decks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deck_id          UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  learned_count    INTEGER NOT NULL DEFAULT 0,
  streak           INTEGER NOT NULL DEFAULT 0,
  expired_at       TIMESTAMPTZ DEFAULT NULL,
  last_studied_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, deck_id)
);

-- 1.6.1 GROUP_DECKS (New)
CREATE TABLE IF NOT EXISTS public.group_decks (
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  deck_id     UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  expired_at  TIMESTAMPTZ DEFAULT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (group_id, deck_id)
);

-- 1.7 USER_DEVICES
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

-- 1.8 APP_SETTINGS
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO public.app_settings (key, value) VALUES ('global_max_devices', '3') ON CONFLICT (key) DO NOTHING;

-- ── 2. INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id  ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id  ON public.user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_deck_id  ON public.user_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_users_group_id      ON public.users(group_id);
CREATE INDEX IF NOT EXISTS idx_users_role          ON public.users(role);

-- ── 3. ENABLE RLS ───────────────────────────────────────────────

ALTER TABLE public.groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_decks   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ── 4. HELPER FUNCTIONS (SECURITY DEFINER to avoid RLS recursion) ─────────────────

CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_my_group_id() RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT group_id FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN');
$$;

CREATE OR REPLACE FUNCTION public.is_subadmin() RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'SUBADMIN');
$$;

CREATE OR REPLACE FUNCTION public.get_group_deck_expiry(p_group_id UUID, p_deck_id UUID) RETURNS TIMESTAMPTZ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT expired_at FROM public.group_decks WHERE group_id = p_group_id AND deck_id = p_deck_id;
$$;

-- ── 5. RLS POLICIES ─────────────────────────────────────────────

-- 5.1 GROUPS
DROP POLICY IF EXISTS "groups_select" ON public.groups;
CREATE POLICY "groups_select" ON public.groups FOR SELECT USING (
  public.is_admin() OR id = public.get_my_group_id()
);
DROP POLICY IF EXISTS "groups_admin_all" ON public.groups;
CREATE POLICY "groups_admin_all" ON public.groups FOR ALL USING (public.is_admin());

-- 5.2 USERS
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (
  auth.uid() = id 
  OR public.is_admin() 
  OR (public.is_subadmin() AND group_id = public.get_my_group_id())
);

DROP POLICY IF EXISTS "users_insert" ON public.users;
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (
  auth.uid() = id 
  OR public.is_admin() 
  OR (public.is_subadmin() AND group_id = public.get_my_group_id())
);

DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (
  auth.uid() = id 
  OR public.is_admin() 
  OR (public.is_subadmin() AND group_id = public.get_my_group_id())
);

DROP POLICY IF EXISTS "users_delete" ON public.users;
CREATE POLICY "users_delete" ON public.users FOR DELETE USING (
  public.is_admin() 
  OR (public.is_subadmin() AND group_id = public.get_my_group_id())
);

-- 5.3 DECKS
DROP POLICY IF EXISTS "decks_public_read" ON public.decks;
CREATE POLICY "decks_public_read" ON public.decks FOR SELECT USING (true);
DROP POLICY IF EXISTS "decks_admin_write" ON public.decks;
CREATE POLICY "decks_admin_write" ON public.decks FOR ALL USING (public.is_admin());

-- 5.4 FLASHCARDS
DROP POLICY IF EXISTS "flashcards_public_read" ON public.flashcards;
CREATE POLICY "flashcards_public_read" ON public.flashcards FOR SELECT USING (true);
DROP POLICY IF EXISTS "flashcards_admin_write" ON public.flashcards;
CREATE POLICY "flashcards_admin_write" ON public.flashcards FOR ALL USING (public.is_admin());

-- 5.5 USER_DECKS
DROP POLICY IF EXISTS "ud_select" ON public.user_decks;
CREATE POLICY "ud_select" ON public.user_decks FOR SELECT USING (
  auth.uid() = user_id 
  OR public.is_admin() 
  OR (
    public.is_subadmin() 
    AND EXISTS (
      -- Check if the deck owner (user_id) belongs to the subadmin's group
      SELECT 1 FROM public.users u 
      WHERE u.id = user_decks.user_id AND u.group_id = public.get_my_group_id()
    )
  )
);
DROP POLICY IF EXISTS "ud_update_own" ON public.user_decks;
CREATE POLICY "ud_update_own" ON public.user_decks FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "ud_write_admin" ON public.user_decks;
CREATE POLICY "ud_write_admin" ON public.user_decks FOR ALL USING (public.is_admin() OR public.is_subadmin());

-- 5.5.1 GROUP_DECKS (New Policies)
DROP POLICY IF EXISTS "gd_select" ON public.group_decks;
CREATE POLICY "gd_select" ON public.group_decks FOR SELECT USING (
  public.is_admin() OR group_id = public.get_my_group_id()
);
DROP POLICY IF EXISTS "gd_admin_all" ON public.group_decks;
CREATE POLICY "gd_admin_all" ON public.group_decks FOR ALL USING (public.is_admin());

-- 5.6 DEVICES & SETTINGS
DROP POLICY IF EXISTS "devices_own" ON public.user_devices;
CREATE POLICY "devices_own" ON public.user_devices FOR ALL USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS "settings_public_read" ON public.app_settings;
CREATE POLICY "settings_public_read" ON public.app_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "settings_admin_write" ON public.app_settings;
CREATE POLICY "settings_admin_write" ON public.app_settings FOR ALL USING (public.is_admin());

-- ── 6. TRIGGER: auto-create profile on signup ────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role       TEXT;
  v_created_by UUID;
  v_group_id   UUID;
BEGIN
  v_role       := COALESCE(NEW.raw_user_meta_data->>'role', 'USER');
  v_created_by := NULLIF(NEW.raw_user_meta_data->>'created_by', '')::UUID;
  v_group_id   := NULLIF(NEW.raw_user_meta_data->>'group_id', '')::UUID;

  INSERT INTO public.users (id, email, role, created_by, group_id)
  VALUES (NEW.id, NEW.email, v_role, v_created_by, v_group_id)
  ON CONFLICT (id) DO UPDATE
    SET role       = EXCLUDED.role,
        created_by = COALESCE(EXCLUDED.created_by, public.users.created_by),
        group_id   = COALESCE(EXCLUDED.group_id, public.users.group_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 7. DATA MIGRATION & SAMPLE DATA ───────────────────────────────────────────

DO $$
BEGIN
  -- 7.1 Sync is_public → access_mode
  UPDATE public.decks SET access_mode = 'login_full' WHERE is_public = true AND access_mode = 'assigned_only';

  -- 7.2 Create missing groups for existing SUBADMINs
  INSERT INTO public.groups (id, name, owner_id)
  SELECT id, 'Nhóm của ' || email, id
  FROM public.users WHERE role = 'SUBADMIN'
  ON CONFLICT (id) DO NOTHING;

  -- 7.3 Sample Deck if empty
  IF (SELECT COUNT(*) FROM public.decks) = 0 THEN
    INSERT INTO public.decks (title, description, level, is_public, access_mode)
    VALUES ('Demo Vocabulary', 'Bộ từ vựng mẫu', 'B2', true, 'login_full');
  END IF;
END;
$$;
