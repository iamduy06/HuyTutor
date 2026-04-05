-- ============================================================
-- Huy Tutor Flashcard — Full Database Schema v2
-- ============================================================
-- JSONB structure: mỗi deck có 1 row flashcard duy nhất,
-- content lưu toàn bộ dạng:
-- {
--   "tabs": [
--     {
--       "id": "unit1",
--       "label": "Daily Family Routines",
--       "desc": "...",
--       "vocabulary": [ { word, phonetic, meaning, type, example, translation, synonyms, antonyms, cefr }, ... ]
--     },
--     ...
--   ]
-- }
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── TABLES ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.decks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  level       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mỗi deck có 1 row, content = toàn bộ JSONB { tabs: [...] }
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
  -- NULL = không hết hạn (học mãi mãi), có ngày = hết hạn theo ngày đó
  expired_at       TIMESTAMPTZ DEFAULT NULL,
  last_studied_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, deck_id)
);

-- ── INDEXES ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id ON public.user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_deck_id ON public.user_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_expired ON public.user_decks(expired_at);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_decks ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN');
$$;

-- users
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_all"  ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_admin_all"  ON public.users FOR ALL   USING (public.is_admin());

-- decks: public read, admin write
DROP POLICY IF EXISTS "decks_public_read" ON public.decks;
DROP POLICY IF EXISTS "decks_admin_all"   ON public.decks;
CREATE POLICY "decks_public_read" ON public.decks FOR SELECT USING (true);
CREATE POLICY "decks_admin_all"   ON public.decks FOR ALL   USING (public.is_admin());

-- flashcards: public read (demo giới hạn ở API layer), admin write
DROP POLICY IF EXISTS "flashcards_public_read" ON public.flashcards;
DROP POLICY IF EXISTS "flashcards_admin_all"   ON public.flashcards;
CREATE POLICY "flashcards_public_read" ON public.flashcards FOR SELECT USING (true);
CREATE POLICY "flashcards_admin_all"   ON public.flashcards FOR ALL   USING (public.is_admin());

-- user_decks
DROP POLICY IF EXISTS "ud_select_own" ON public.user_decks;
DROP POLICY IF EXISTS "ud_update_own" ON public.user_decks;
DROP POLICY IF EXISTS "ud_admin_all"  ON public.user_decks;
CREATE POLICY "ud_select_own" ON public.user_decks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ud_update_own" ON public.user_decks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "ud_admin_all"  ON public.user_decks FOR ALL    USING (public.is_admin());

-- ── TRIGGER: auto-create profile on signup ────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, coalesce(NEW.raw_user_meta_data->>'role', 'USER'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── SEED DATA ─────────────────────────────────────────────────
-- Tạo admin@example.com trong Supabase Auth Dashboard trước,
-- sau đó chạy: UPDATE public.users SET role = 'ADMIN' WHERE email = 'admin@example.com';

DO $$
DECLARE v_deck_id UUID;
BEGIN
  INSERT INTO public.decks (title, description, level)
  VALUES ('IELTS Academic Vocabulary', 'Từ vựng học thuật B2–C1 cho IELTS Academic', 'B2')
  RETURNING id INTO v_deck_id;

  -- Toàn bộ content deck lưu trong 1 row duy nhất, dạng { tabs: [...] }
  INSERT INTO public.flashcards (deck_id, content) VALUES (
    v_deck_id,
    jsonb_build_object(
      'tabs', jsonb_build_array(
        jsonb_build_object(
          'id', 'unit-1',
          'label', 'Unit 1 — Academic Word List',
          'desc', '10 từ học thuật phổ biến nhất trong IELTS',
          'vocabulary', '[
            {"word":"exacerbate","phonetic":"/ɪɡˈzæs.ə.beɪt/","meaning":"làm trầm trọng thêm","type":"Verb","example":"The drought was exacerbated by poor water management policies.","translation":"Hạn hán bị làm trầm trọng thêm bởi các chính sách quản lý nước kém.","synonyms":["aggravate","worsen","intensify"],"antonyms":["alleviate","mitigate","improve"],"cefr":"C1"},
            {"word":"unprecedented","phonetic":"/ʌnˈpres.ɪ.den.tɪd/","meaning":"chưa từng có tiền lệ","type":"Adjective","example":"The pandemic caused unprecedented disruption to global supply chains.","translation":"Đại dịch gây ra sự gián đoạn chưa từng có đối với chuỗi cung ứng toàn cầu.","synonyms":["unparalleled","extraordinary","unmatched"],"antonyms":["common","ordinary","familiar"],"cefr":"C1"},
            {"word":"proliferate","phonetic":"/prəˈlɪf.ər.eɪt/","meaning":"sinh sôi nảy nở nhanh chóng","type":"Verb","example":"Social media platforms have proliferated rapidly over the past decade.","translation":"Các nền tảng mạng xã hội đã lan rộng nhanh chóng trong thập kỷ qua.","synonyms":["multiply","expand","burgeon"],"antonyms":["decline","diminish","dwindle"],"cefr":"C1"},
            {"word":"ambiguous","phonetic":"/æmˈbɪɡ.ju.əs/","meaning":"mơ hồ, không rõ ràng","type":"Adjective","example":"The contract contained several ambiguous clauses that led to disputes.","translation":"Hợp đồng chứa một số điều khoản mơ hồ dẫn đến tranh chấp.","synonyms":["vague","unclear","equivocal"],"antonyms":["clear","explicit","unambiguous"],"cefr":"B2"},
            {"word":"pragmatic","phonetic":"/præɡˈmæt.ɪk/","meaning":"thực dụng, thiết thực","type":"Adjective","example":"We need a pragmatic approach to solving the housing crisis.","translation":"Chúng ta cần một cách tiếp cận thực dụng để giải quyết cuộc khủng hoảng nhà ở.","synonyms":["practical","realistic","sensible"],"antonyms":["idealistic","impractical","unrealistic"],"cefr":"C1"},
            {"word":"ephemeral","phonetic":"/ɪˈfem.ər.əl/","meaning":"phù du, thoáng qua","type":"Adjective","example":"Fame in the social media age is often ephemeral.","translation":"Danh tiếng trong thời đại mạng xã hội thường rất phù du.","synonyms":["transient","fleeting","short-lived"],"antonyms":["permanent","enduring","lasting"],"cefr":"C2"},
            {"word":"corroborate","phonetic":"/kəˈrɒb.ər.eɪt/","meaning":"xác nhận, củng cố bằng chứng","type":"Verb","example":"The witness testimony helped corroborate the defendant alibi.","translation":"Lời khai của nhân chứng đã giúp xác nhận bằng chứng ngoại phạm của bị cáo.","synonyms":["confirm","substantiate","verify"],"antonyms":["contradict","refute","undermine"],"cefr":"C1"},
            {"word":"meticulous","phonetic":"/məˈtɪk.jʊ.ləs/","meaning":"tỉ mỉ, cẩn thận từng chi tiết","type":"Adjective","example":"Her meticulous attention to detail made her an outstanding researcher.","translation":"Sự chú ý tỉ mỉ đến từng chi tiết đã giúp cô ấy trở thành nhà nghiên cứu xuất sắc.","synonyms":["thorough","painstaking","scrupulous"],"antonyms":["careless","sloppy","negligent"],"cefr":"C1"},
            {"word":"pervasive","phonetic":"/pəˈveɪ.sɪv/","meaning":"lan rộng khắp nơi","type":"Adjective","example":"The pervasive influence of technology has transformed modern workplaces.","translation":"Ảnh hưởng lan rộng của công nghệ đã chuyển đổi nơi làm việc hiện đại.","synonyms":["widespread","ubiquitous","omnipresent"],"antonyms":["rare","limited","confined"],"cefr":"C1"},
            {"word":"zealous","phonetic":"/ˈzel.əs/","meaning":"nhiệt tình, hăng hái","type":"Adjective","example":"She was a zealous advocate for environmental protection.","translation":"Cô ấy là một người ủng hộ nhiệt tình cho việc bảo vệ môi trường.","synonyms":["enthusiastic","fervent","passionate"],"antonyms":["apathetic","indifferent","unenthusiastic"],"cefr":"B2"}
          ]'::jsonb
        )
      )
    )
  );

  RAISE NOTICE 'Deck created: %', v_deck_id;
END;
$$;

-- ============================================================
-- DEVICE TRACKING (Session management)
-- ============================================================

-- Bảng theo dõi thiết bị đã đăng nhập
CREATE TABLE IF NOT EXISTS public.user_devices (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  -- fingerprint: hash của user-agent + ip (tạo client-side)
  device_id   TEXT NOT NULL,
  device_name TEXT,            -- "Chrome on Windows", "Safari on iPhone", ...
  ip_address  TEXT,
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_seen ON public.user_devices(last_seen);

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "devices_own" ON public.user_devices;
CREATE POLICY "devices_own" ON public.user_devices
  FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Bảng cấu hình giới hạn thiết bị
-- global_max_devices: giới hạn mặc định cho tất cả USER
-- users.max_devices:  override cho từng user cụ thể (NULL = dùng global)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO public.app_settings (key, value)
VALUES ('global_max_devices', '3')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "settings_public_read" ON public.app_settings;
DROP POLICY IF EXISTS "settings_admin_write" ON public.app_settings;
CREATE POLICY "settings_public_read" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "settings_admin_write" ON public.app_settings FOR ALL USING (public.is_admin());

-- Thêm cột max_devices vào users (NULL = dùng global setting)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT NULL;

-- ============================================================
-- MIGRATION: Add CEFR range columns to decks
-- ============================================================
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS level_min TEXT DEFAULT NULL;
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS level_max TEXT DEFAULT NULL;
-- Note: level field kept for backward compat, will display as "level_min - level_max"

-- ============================================================
-- MIGRATION: Add is_public column to decks
-- ============================================================
ALTER TABLE public.decks ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
-- Index for filtering public decks
CREATE INDEX IF NOT EXISTS idx_decks_is_public ON public.decks(is_public);

-- ============================================================
-- SUBADMIN FEATURE (Migration)
-- ============================================================

-- Add SUBADMIN role support
ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (role IN ('USER', 'SUBADMIN', 'ADMIN'));

-- Track which admin/subadmin created a user
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Max users a subadmin can manage (NULL = ADMIN default unlimited)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS max_managed_users INTEGER DEFAULT 10;

-- Index
CREATE INDEX IF NOT EXISTS idx_users_created_by ON public.users(created_by);

-- ── RLS: SUBADMIN can see users they created ──────────────────
-- Update users policy to include subadmin scope
DROP POLICY IF EXISTS "Users: view own profile" ON public.users;
CREATE POLICY "Users: view own profile"
  ON public.users FOR SELECT
  USING (
    id = auth.uid()
    OR public.is_admin()
    OR (
      -- subadmin can see users they created
      EXISTS (
        SELECT 1 FROM public.users me
        WHERE me.id = auth.uid() AND me.role = 'SUBADMIN'
        AND public.users.created_by = auth.uid()
      )
    )
  );

-- Subadmin helper function
CREATE OR REPLACE FUNCTION public.is_subadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'SUBADMIN'
  );
$$;
