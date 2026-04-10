-- ============================================================
-- SQL Migration: Add Deck Groups Categorization
-- ============================================================

-- 1. Create deck_groups table
CREATE TABLE IF NOT EXISTS public.deck_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add group_id to decks table
ALTER TABLE public.decks 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.deck_groups(id) ON DELETE SET NULL;

-- 3. Enable RLS
ALTER TABLE public.deck_groups ENABLE ROW LEVEL SECURITY;

-- 4. Set RLS Policies
DROP POLICY IF EXISTS "Admin All: deck_groups" ON public.deck_groups;
CREATE POLICY "Admin All: deck_groups" ON public.deck_groups 
FOR ALL USING (public.is_admin());

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_decks_group_id ON public.decks(group_id);
