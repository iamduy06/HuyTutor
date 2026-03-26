-- ============================================================
-- Huy Tutor Flashcard — Full Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users table (mirrors auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Decks
CREATE TABLE IF NOT EXISTS public.decks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT NOT NULL,
  description TEXT,
  level       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Flashcards
CREATE TABLE IF NOT EXISTS public.flashcards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id     UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  content     JSONB NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User–Deck assignments
CREATE TABLE IF NOT EXISTS public.user_decks (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  deck_id          UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  learned_count    INTEGER NOT NULL DEFAULT 0,
  streak           INTEGER NOT NULL DEFAULT 0,
  expired_at       TIMESTAMPTZ,
  last_studied_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, deck_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_flashcards_deck_id     ON public.flashcards(deck_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_order       ON public.flashcards(deck_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_decks_user_id     ON public.user_decks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_deck_id     ON public.user_decks(deck_id);
CREATE INDEX IF NOT EXISTS idx_user_decks_expired     ON public.user_decks(expired_at);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_decks ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────
-- Helper function: check if caller is admin
-- ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- ──────────────────────────────────────────
-- users policies
-- ──────────────────────────────────────────
DROP POLICY IF EXISTS "Users: view own profile" ON public.users;
CREATE POLICY "Users: view own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users: insert own profile" ON public.users;
CREATE POLICY "Users: insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users: update own profile" ON public.users;
CREATE POLICY "Users: update own profile"
  ON public.users FOR UPDATE
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Users: admin delete" ON public.users;
CREATE POLICY "Users: admin delete"
  ON public.users FOR DELETE
  USING (public.is_admin());

-- ──────────────────────────────────────────
-- decks policies (public read, admin write)
-- ──────────────────────────────────────────
DROP POLICY IF EXISTS "Decks: public read" ON public.decks;
CREATE POLICY "Decks: public read"
  ON public.decks FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Decks: admin insert" ON public.decks;
CREATE POLICY "Decks: admin insert"
  ON public.decks FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Decks: admin update" ON public.decks;
CREATE POLICY "Decks: admin update"
  ON public.decks FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Decks: admin delete" ON public.decks;
CREATE POLICY "Decks: admin delete"
  ON public.decks FOR DELETE
  USING (public.is_admin());

-- ──────────────────────────────────────────
-- flashcards policies
-- Public can read (for demo); full access via service_role in API
-- ──────────────────────────────────────────
DROP POLICY IF EXISTS "Flashcards: public read" ON public.flashcards;
CREATE POLICY "Flashcards: public read"
  ON public.flashcards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Flashcards: admin write" ON public.flashcards;
CREATE POLICY "Flashcards: admin write"
  ON public.flashcards FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Flashcards: admin update" ON public.flashcards;
CREATE POLICY "Flashcards: admin update"
  ON public.flashcards FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Flashcards: admin delete" ON public.flashcards;
CREATE POLICY "Flashcards: admin delete"
  ON public.flashcards FOR DELETE
  USING (public.is_admin());

-- ──────────────────────────────────────────
-- user_decks policies
-- ──────────────────────────────────────────
DROP POLICY IF EXISTS "UserDecks: own read" ON public.user_decks;
CREATE POLICY "UserDecks: own read"
  ON public.user_decks FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "UserDecks: own insert" ON public.user_decks;
CREATE POLICY "UserDecks: own insert"
  ON public.user_decks FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "UserDecks: own update" ON public.user_decks;
CREATE POLICY "UserDecks: own update"
  ON public.user_decks FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "UserDecks: admin delete" ON public.user_decks;
CREATE POLICY "UserDecks: admin delete"
  ON public.user_decks FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (NEW.id, NEW.email, 'USER')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (password: Admin@123 — set via Supabase Auth dashboard or CLI)
-- After running this SQL, go to Supabase Auth > Users > "Invite user"
-- OR use: supabase auth create-user --email admin@example.com --password Admin@123

-- Sample deck
INSERT INTO public.decks (id, title, description, level)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Academic Vocabulary B2–C2',
  'Bộ từ vựng học thuật trình độ cao, phù hợp cho IELTS 7.0+',
  'Upper-Intermediate'
) ON CONFLICT (id) DO NOTHING;

-- Sample flashcards
INSERT INTO public.flashcards (deck_id, content, order_index) VALUES
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "word": "exacerbate",
    "phonetic": "/ɪɡˈzæs.ə.beɪt/",
    "meaning": "làm trầm trọng thêm, làm tệ hơn",
    "type": "Verb",
    "example": "The drought was exacerbated by poor water management policies.",
    "translation": "Hạn hán bị làm trầm trọng thêm bởi các chính sách quản lý nước kém.",
    "synonyms": ["aggravate", "worsen", "intensify"],
    "antonyms": ["alleviate", "mitigate", "improve"],
    "cefr": "C1"
  }',
  0
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "word": "unprecedented",
    "phonetic": "/ʌnˈpres.ɪ.den.tɪd/",
    "meaning": "chưa từng có tiền lệ, chưa từng xảy ra",
    "type": "Adjective",
    "example": "The pandemic caused unprecedented disruption to global supply chains.",
    "translation": "Đại dịch gây ra sự gián đoạn chưa từng có đối với chuỗi cung ứng toàn cầu.",
    "synonyms": ["unparalleled", "extraordinary", "unmatched"],
    "antonyms": ["common", "ordinary", "familiar"],
    "cefr": "C1"
  }',
  1
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "word": "proliferate",
    "phonetic": "/prəˈlɪf.ər.eɪt/",
    "meaning": "sinh sôi nảy nở nhanh chóng, lan rộng",
    "type": "Verb",
    "example": "Social media platforms have proliferated rapidly over the past decade.",
    "translation": "Các nền tảng mạng xã hội đã lan rộng nhanh chóng trong thập kỷ qua.",
    "synonyms": ["multiply", "expand", "burgeon"],
    "antonyms": ["decline", "diminish", "dwindle"],
    "cefr": "C1"
  }',
  2
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "word": "ambiguous",
    "phonetic": "/æmˈbɪɡ.ju.əs/",
    "meaning": "mơ hồ, có nhiều nghĩa, không rõ ràng",
    "type": "Adjective",
    "example": "The contract contained several ambiguous clauses that led to disputes.",
    "translation": "Hợp đồng chứa một số điều khoản mơ hồ dẫn đến tranh chấp.",
    "synonyms": ["vague", "unclear", "equivocal"],
    "antonyms": ["clear", "unambiguous", "explicit"],
    "cefr": "B2"
  }',
  3
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "word": "pragmatic",
    "phonetic": "/præɡˈmæt.ɪk/",
    "meaning": "thực dụng, thực tiễn, thiết thực",
    "type": "Adjective",
    "example": "We need a pragmatic approach to solving the housing crisis.",
    "translation": "Chúng ta cần một cách tiếp cận thực dụng để giải quyết cuộc khủng hoảng nhà ở.",
    "synonyms": ["practical", "realistic", "sensible"],
    "antonyms": ["idealistic", "impractical", "unrealistic"],
    "cefr": "C1"
  }',
  4
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "word": "ephemeral",
    "phonetic": "/ɪˈfem.ər.əl/",
    "meaning": "phù du, thoáng qua, tồn tại trong thời gian ngắn",
    "type": "Adjective",
    "example": "Fame in the social media age is often ephemeral.",
    "translation": "Danh tiếng trong thời đại mạng xã hội thường rất phù du.",
    "synonyms": ["transient", "fleeting", "short-lived"],
    "antonyms": ["permanent", "enduring", "lasting"],
    "cefr": "C2"
  }',
  5
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "word": "corroborate",
    "phonetic": "/kəˈrɒb.ər.eɪt/",
    "meaning": "xác nhận, củng cố (bằng chứng, tuyên bố)",
    "type": "Verb",
    "example": "The witness testimony helped corroborate the defendant apos s alibi.",
    "translation": "Lời khai của nhân chứng đã giúp xác nhận bằng chứng ngoại phạm của bị cáo.",
    "synonyms": ["confirm", "substantiate", "verify"],
    "antonyms": ["contradict", "refute", "undermine"],
    "cefr": "C1"
  }',
  6
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "word": "meticulous",
    "phonetic": "/məˈtɪk.jʊ.ləs/",
    "meaning": "tỉ mỉ, cẩn thận từng chi tiết",
    "type": "Adjective",
    "example": "Her meticulous attention to detail made her an outstanding researcher.",
    "translation": "Sự chú ý tỉ mỉ đến từng chi tiết đã giúp cô ấy trở thành nhà nghiên cứu xuất sắc.",
    "synonyms": ["thorough", "painstaking", "scrupulous"],
    "antonyms": ["careless", "sloppy", "negligent"],
    "cefr": "C1"
  }',
  7
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "word": "pervasive",
    "phonetic": "/pəˈveɪ.sɪv/",
    "meaning": "lan rộng khắp nơi, thấm nhuần",
    "type": "Adjective",
    "example": "The pervasive influence of technology has transformed modern workplaces.",
    "translation": "Ảnh hưởng lan rộng của công nghệ đã chuyển đổi nơi làm việc hiện đại.",
    "synonyms": ["widespread", "ubiquitous", "omnipresent"],
    "antonyms": ["rare", "limited", "confined"],
    "cefr": "C1"
  }',
  8
),
(
  'a1b2c3d4-0000-0000-0000-000000000001',
  '{
    "word": "zealous",
    "phonetic": "/ˈzel.əs/",
    "meaning": "nhiệt tình, hăng hái, cuồng nhiệt",
    "type": "Adjective",
    "example": "She was a zealous advocate for environmental protection.",
    "translation": "Cô ấy là một người ủng hộ nhiệt tình cho việc bảo vệ môi trường.",
    "synonyms": ["enthusiastic", "fervent", "passionate"],
    "antonyms": ["apathetic", "indifferent", "unenthusiastic"],
    "cefr": "B2"
  }',
  9
)
ON CONFLICT DO NOTHING;
