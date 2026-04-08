-- Migration: Add access_mode to decks table
-- Run this in Supabase SQL Editor

-- 1. Add access_mode column với default = 'assigned_only'
ALTER TABLE public.decks
  ADD COLUMN IF NOT EXISTS access_mode TEXT NOT NULL DEFAULT 'assigned_only'
  CONSTRAINT decks_access_mode_check
    CHECK (access_mode IN ('assigned_only', 'login_full', 'public_full', 'public_demo'));

-- 2. Migrate existing data: is_public=true → 'login_full'
UPDATE public.decks
  SET access_mode = 'login_full'
  WHERE is_public = true AND access_mode = 'assigned_only';

-- 3. Add comment for documentation
COMMENT ON COLUMN public.decks.access_mode IS
  'assigned_only: only assigned users; login_full: any login; public_full: everyone full; public_demo: everyone demo only';

-- 4. Create index for faster filtering
CREATE INDEX IF NOT EXISTS decks_access_mode_idx ON public.decks(access_mode);
