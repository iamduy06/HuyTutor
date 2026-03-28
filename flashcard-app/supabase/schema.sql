-- ============================================================
-- Huy Tutor Flashcard App — Full Schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── Tables ─────────────────────────────────────────────────────────────────

create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  role        text not null default 'USER' check (role in ('USER', 'ADMIN')),
  created_at  timestamptz not null default now()
);

create table if not exists public.decks (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  level       text,
  created_at  timestamptz not null default now()
);

-- content is JSONB — can be a single unit object OR array of units
create table if not exists public.flashcards (
  id          uuid primary key default uuid_generate_v4(),
  deck_id     uuid not null references public.decks(id) on delete cascade,
  content     jsonb not null,
  created_at  timestamptz not null default now()
);

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

-- ── Indexes ─────────────────────────────────────────────────────────────────

create index if not exists idx_flashcards_deck_id on public.flashcards(deck_id);
create index if not exists idx_user_decks_user_id on public.user_decks(user_id);
create index if not exists idx_user_decks_deck_id on public.user_decks(deck_id);
create index if not exists idx_user_decks_expiry  on public.user_decks(expired_at);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.users      enable row level security;
alter table public.decks      enable row level security;
alter table public.flashcards enable row level security;
alter table public.user_decks enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (select 1 from public.users where id = auth.uid() and role = 'ADMIN');
$$;

-- users
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_admin_all"  on public.users;
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_admin_all"  on public.users for all    using (public.is_admin());

-- decks (public read)
drop policy if exists "decks_public_read" on public.decks;
drop policy if exists "decks_admin_all"   on public.decks;
create policy "decks_public_read" on public.decks for select using (true);
create policy "decks_admin_all"   on public.decks for all    using (public.is_admin());

-- flashcards (public read — limit enforced in API layer, not RLS)
drop policy if exists "flashcards_public_read" on public.flashcards;
drop policy if exists "flashcards_admin_all"   on public.flashcards;
create policy "flashcards_public_read" on public.flashcards for select using (true);
create policy "flashcards_admin_all"   on public.flashcards for all    using (public.is_admin());

-- user_decks
drop policy if exists "ud_select_own" on public.user_decks;
drop policy if exists "ud_update_own" on public.user_decks;
drop policy if exists "ud_admin_all"  on public.user_decks;
create policy "ud_select_own" on public.user_decks for select using (auth.uid() = user_id);
create policy "ud_update_own" on public.user_decks for update using (auth.uid() = user_id);
create policy "ud_admin_all"  on public.user_decks for all    using (public.is_admin());

-- ── Trigger: auto-create public.users on auth signup ────────────────────────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'USER'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Seed: admin account ──────────────────────────────────────────────────────
-- Step 1: Create user in Supabase Auth Dashboard
--   Email: admin@example.com  |  Password: Admin@123  |  ✅ Auto-confirm
-- Step 2: Run this after signup:
-- update public.users set role = 'ADMIN' where email = 'admin@example.com';

-- ── Sample deck ──────────────────────────────────────────────────────────────

do $$
declare v_deck_id uuid;
begin
  insert into public.decks (title, description, level)
  values ('IELTS Academic Vocabulary', 'Từ vựng học thuật B2–C1 dành cho IELTS Academic', 'B2')
  returning id into v_deck_id;

  -- content as a single OBJECT (not array) — app handles both
  insert into public.flashcards (deck_id, content) values (v_deck_id, '{
    "id": "unit-1",
    "label": "Unit 1 — Academic Word List",
    "desc": "10 từ học thuật phổ biến nhất trong IELTS",
    "vocabulary": [
      {"word":"exacerbate","phonetic":"/ɪɡˈzæs.ə.beɪt/","meaning":"làm trầm trọng thêm","type":"Verb","example":"The drought was exacerbated by poor water management.","translation":"Hạn hán bị làm trầm trọng thêm bởi quản lý nước kém.","synonyms":["aggravate","worsen"],"antonyms":["alleviate","improve"],"cefr":"C1"},
      {"word":"unprecedented","phonetic":"/ʌnˈpres.ɪ.den.tɪd/","meaning":"chưa từng có tiền lệ","type":"Adjective","example":"The pandemic caused unprecedented disruption.","translation":"Đại dịch gây ra sự gián đoạn chưa từng có.","synonyms":["unparalleled","extraordinary"],"antonyms":["common","ordinary"],"cefr":"C1"},
      {"word":"proliferate","phonetic":"/prəˈlɪf.ər.eɪt/","meaning":"lan rộng nhanh chóng","type":"Verb","example":"Social media platforms have proliferated rapidly.","translation":"Mạng xã hội đã lan rộng nhanh chóng.","synonyms":["multiply","expand"],"antonyms":["decline","diminish"],"cefr":"C1"},
      {"word":"ambiguous","phonetic":"/æmˈbɪɡ.ju.əs/","meaning":"mơ hồ, không rõ ràng","type":"Adjective","example":"The contract contained ambiguous clauses.","translation":"Hợp đồng chứa điều khoản mơ hồ.","synonyms":["vague","unclear"],"antonyms":["clear","explicit"],"cefr":"B2"},
      {"word":"pragmatic","phonetic":"/præɡˈmæt.ɪk/","meaning":"thực dụng, thiết thực","type":"Adjective","example":"We need a pragmatic approach.","translation":"Chúng ta cần cách tiếp cận thực dụng.","synonyms":["practical","realistic"],"antonyms":["idealistic","impractical"],"cefr":"C1"},
      {"word":"ephemeral","phonetic":"/ɪˈfem.ər.əl/","meaning":"phù du, thoáng qua","type":"Adjective","example":"Fame in social media is often ephemeral.","translation":"Danh tiếng trên mạng xã hội thường rất phù du.","synonyms":["transient","fleeting"],"antonyms":["permanent","lasting"],"cefr":"C2"},
      {"word":"corroborate","phonetic":"/kəˈrɒb.ər.eɪt/","meaning":"xác nhận, củng cố bằng chứng","type":"Verb","example":"The witness helped corroborate the alibi.","translation":"Nhân chứng giúp xác nhận bằng chứng ngoại phạm.","synonyms":["confirm","verify"],"antonyms":["contradict","refute"],"cefr":"C1"},
      {"word":"meticulous","phonetic":"/məˈtɪk.jʊ.ləs/","meaning":"tỉ mỉ, cẩn thận","type":"Adjective","example":"Her meticulous attention to detail was impressive.","translation":"Sự tỉ mỉ của cô ấy rất ấn tượng.","synonyms":["thorough","painstaking"],"antonyms":["careless","sloppy"],"cefr":"C1"},
      {"word":"pervasive","phonetic":"/pəˈveɪ.sɪv/","meaning":"lan rộng khắp nơi","type":"Adjective","example":"The pervasive influence of technology transformed workplaces.","translation":"Ảnh hưởng lan rộng của công nghệ đã thay đổi nơi làm việc.","synonyms":["widespread","ubiquitous"],"antonyms":["rare","limited"],"cefr":"C1"},
      {"word":"zealous","phonetic":"/ˈzel.əs/","meaning":"nhiệt tình, hăng hái","type":"Adjective","example":"She was a zealous advocate for environmental protection.","translation":"Cô ấy là người ủng hộ nhiệt tình bảo vệ môi trường.","synonyms":["enthusiastic","fervent"],"antonyms":["apathetic","indifferent"],"cefr":"B2"}
    ]
  }'::jsonb);

  raise notice 'Sample deck created: %', v_deck_id;
end;
$$;
