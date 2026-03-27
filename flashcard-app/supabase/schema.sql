-- ============================================================
-- Huy Tutor Flashcard App — Full Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- TABLES
-- ──────────────────────────────────────────────────────────────

-- users: mirrors auth.users with role
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'USER' check (role in ('USER', 'ADMIN')),
  created_at  timestamptz not null default now()
);

-- decks
create table if not exists public.decks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  level       text,
  created_at  timestamptz not null default now()
);

-- flashcards: content stored as JSONB (one row = one unit/chapter)
create table if not exists public.flashcards (
  id          uuid primary key default uuid_generate_v4(),
  deck_id     uuid not null references public.decks(id) on delete cascade,
  content     jsonb not null,
  created_at  timestamptz not null default now()
);

-- user_decks: links user ↔ deck with expiry + progress
create table if not exists public.user_decks (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  deck_id          uuid not null references public.decks(id) on delete cascade,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  learned_count    integer not null default 0,
  streak           integer not null default 0,
  expired_at       timestamptz,
  unique (user_id, deck_id)
);

-- ──────────────────────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────────────────────

create index if not exists idx_flashcards_deck_id  on public.flashcards(deck_id);
create index if not exists idx_user_decks_user_id  on public.user_decks(user_id);
create index if not exists idx_user_decks_deck_id  on public.user_decks(deck_id);
create index if not exists idx_user_decks_expiry   on public.user_decks(expired_at);

-- ──────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────

alter table public.users      enable row level security;
alter table public.decks      enable row level security;
alter table public.flashcards enable row level security;
alter table public.user_decks enable row level security;

-- Helper: is caller an admin?
create or replace function public.is_admin()
returns boolean
language sql security definer stable
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

-- ── users policies ──
drop policy if exists "users_select_own"   on public.users;
drop policy if exists "users_admin_all"    on public.users;

create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

create policy "users_admin_all" on public.users
  for all using (public.is_admin());

-- ── decks policies (public read, admin write) ──
drop policy if exists "decks_public_read"  on public.decks;
drop policy if exists "decks_admin_all"    on public.decks;

create policy "decks_public_read" on public.decks
  for select using (true);

create policy "decks_admin_all" on public.decks
  for all using (public.is_admin());

-- ── flashcards policies (public read for demo; full via API logic) ──
drop policy if exists "flashcards_public_read" on public.flashcards;
drop policy if exists "flashcards_admin_all"   on public.flashcards;

create policy "flashcards_public_read" on public.flashcards
  for select using (true);

create policy "flashcards_admin_all" on public.flashcards
  for all using (public.is_admin());

-- ── user_decks policies ──
drop policy if exists "ud_select_own"   on public.user_decks;
drop policy if exists "ud_update_own"   on public.user_decks;
drop policy if exists "ud_admin_all"    on public.user_decks;

create policy "ud_select_own" on public.user_decks
  for select using (auth.uid() = user_id);

create policy "ud_update_own" on public.user_decks
  for update using (auth.uid() = user_id);

create policy "ud_admin_all" on public.user_decks
  for all using (public.is_admin());

-- ──────────────────────────────────────────────────────────────
-- TRIGGER: auto-create public.users on auth signup
-- ──────────────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'USER')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────────────────────────
-- SEED: default admin account
-- NOTE: Create this user via Supabase Auth Dashboard first:
--   Email: admin@example.com | Password: Admin@123
-- Then run the UPDATE below to promote to ADMIN.
-- ──────────────────────────────────────────────────────────────

-- After creating admin@example.com in Auth, run:
-- update public.users set role = 'ADMIN' where email = 'admin@example.com';

-- ──────────────────────────────────────────────────────────────
-- SAMPLE DATA: 1 complete deck
-- ──────────────────────────────────────────────────────────────

do $$
declare
  v_deck_id uuid;
begin
  -- Insert sample deck
  insert into public.decks (title, description, level)
  values (
    'IELTS Academic Vocabulary',
    'Từ vựng học thuật trình độ B2–C1 dành cho IELTS Academic',
    'B2'
  )
  returning id into v_deck_id;

  -- Insert one unit as a flashcard
  insert into public.flashcards (deck_id, content)
  values (
    v_deck_id,
    '{
      "id": "unit-1",
      "label": "Unit 1 — Academic Word List",
      "desc": "10 từ học thuật phổ biến nhất trong IELTS",
      "vocabulary": [
        {
          "word": "exacerbate",
          "phonetic": "/ɪɡˈzæs.ə.beɪt/",
          "meaning": "làm trầm trọng thêm, làm tệ hơn",
          "type": "Verb",
          "example": "The drought was exacerbated by poor water management policies.",
          "translation": "Hạn hán bị làm trầm trọng thêm bởi các chính sách quản lý nước kém.",
          "synonyms": ["aggravate", "worsen", "intensify"],
          "antonyms": ["alleviate", "mitigate", "improve"],
          "cefr": "C1"
        },
        {
          "word": "unprecedented",
          "phonetic": "/ʌnˈpres.ɪ.den.tɪd/",
          "meaning": "chưa từng có tiền lệ, chưa từng xảy ra",
          "type": "Adjective",
          "example": "The pandemic caused unprecedented disruption to global supply chains.",
          "translation": "Đại dịch gây ra sự gián đoạn chưa từng có đối với chuỗi cung ứng toàn cầu.",
          "synonyms": ["unparalleled", "extraordinary", "unmatched"],
          "antonyms": ["common", "ordinary", "familiar"],
          "cefr": "C1"
        },
        {
          "word": "proliferate",
          "phonetic": "/prəˈlɪf.ər.eɪt/",
          "meaning": "sinh sôi nảy nở nhanh chóng, lan rộng",
          "type": "Verb",
          "example": "Social media platforms have proliferated rapidly over the past decade.",
          "translation": "Các nền tảng mạng xã hội đã lan rộng nhanh chóng trong thập kỷ qua.",
          "synonyms": ["multiply", "expand", "burgeon"],
          "antonyms": ["decline", "diminish", "dwindle"],
          "cefr": "C1"
        },
        {
          "word": "ambiguous",
          "phonetic": "/æmˈbɪɡ.ju.əs/",
          "meaning": "mơ hồ, có nhiều nghĩa, không rõ ràng",
          "type": "Adjective",
          "example": "The contract contained several ambiguous clauses that led to disputes.",
          "translation": "Hợp đồng chứa một số điều khoản mơ hồ dẫn đến tranh chấp.",
          "synonyms": ["vague", "unclear", "equivocal"],
          "antonyms": ["clear", "unambiguous", "explicit"],
          "cefr": "B2"
        },
        {
          "word": "pragmatic",
          "phonetic": "/præɡˈmæt.ɪk/",
          "meaning": "thực dụng, thực tiễn, thiết thực",
          "type": "Adjective",
          "example": "We need a pragmatic approach to solving the housing crisis.",
          "translation": "Chúng ta cần một cách tiếp cận thực dụng để giải quyết cuộc khủng hoảng nhà ở.",
          "synonyms": ["practical", "realistic", "sensible"],
          "antonyms": ["idealistic", "impractical", "unrealistic"],
          "cefr": "C1"
        },
        {
          "word": "ephemeral",
          "phonetic": "/ɪˈfem.ər.əl/",
          "meaning": "phù du, thoáng qua, tồn tại trong thời gian ngắn",
          "type": "Adjective",
          "example": "Fame in the social media age is often ephemeral.",
          "translation": "Danh tiếng trong thời đại mạng xã hội thường rất phù du.",
          "synonyms": ["transient", "fleeting", "short-lived"],
          "antonyms": ["permanent", "enduring", "lasting"],
          "cefr": "C2"
        },
        {
          "word": "corroborate",
          "phonetic": "/kəˈrɒb.ər.eɪt/",
          "meaning": "xác nhận, củng cố bằng chứng",
          "type": "Verb",
          "example": "The witness testimony helped corroborate the defendant alibi.",
          "translation": "Lời khai của nhân chứng đã giúp xác nhận bằng chứng ngoại phạm của bị cáo.",
          "synonyms": ["confirm", "substantiate", "verify"],
          "antonyms": ["contradict", "refute", "undermine"],
          "cefr": "C1"
        },
        {
          "word": "meticulous",
          "phonetic": "/məˈtɪk.jʊ.ləs/",
          "meaning": "tỉ mỉ, cẩn thận từng chi tiết",
          "type": "Adjective",
          "example": "Her meticulous attention to detail made her an outstanding researcher.",
          "translation": "Sự chú ý tỉ mỉ đến từng chi tiết đã giúp cô ấy trở thành nhà nghiên cứu xuất sắc.",
          "synonyms": ["thorough", "painstaking", "scrupulous"],
          "antonyms": ["careless", "sloppy", "negligent"],
          "cefr": "C1"
        },
        {
          "word": "pervasive",
          "phonetic": "/pəˈveɪ.sɪv/",
          "meaning": "lan rộng khắp nơi, thấm nhuần",
          "type": "Adjective",
          "example": "The pervasive influence of technology has transformed modern workplaces.",
          "translation": "Ảnh hưởng lan rộng của công nghệ đã chuyển đổi nơi làm việc hiện đại.",
          "synonyms": ["widespread", "ubiquitous", "omnipresent"],
          "antonyms": ["rare", "limited", "confined"],
          "cefr": "C1"
        },
        {
          "word": "zealous",
          "phonetic": "/ˈzel.əs/",
          "meaning": "nhiệt tình, hăng hái, cuồng nhiệt",
          "type": "Adjective",
          "example": "She was a zealous advocate for environmental protection.",
          "translation": "Cô ấy là một người ủng hộ nhiệt tình cho việc bảo vệ môi trường.",
          "synonyms": ["enthusiastic", "fervent", "passionate"],
          "antonyms": ["apathetic", "indifferent", "unenthusiastic"],
          "cefr": "B2"
        }
      ]
    }'::jsonb
  );

  raise notice 'Sample deck created with id: %', v_deck_id;
end;
$$;
