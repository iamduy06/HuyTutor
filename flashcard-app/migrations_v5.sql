-- ============================================================
-- MIGRATIONS V5: HỆ THỐNG QUẢN LÝ NHÓM VÀ BỘ ĐỀ NÂNG CAO
-- ============================================================

-- 1. Cập nhật bảng groups: Phân biệt nhóm hệ thống
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS is_system BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS system_type TEXT;

-- 2. Đánh dấu các nhóm hệ thống hiện có
UPDATE public.groups 
SET is_system = true, system_type = 'admin_created' 
WHERE name = 'SYSTEM_ADMIN_CREATED';

UPDATE public.groups 
SET is_system = true, system_type = 'registered' 
WHERE name = 'SYSTEM_REGISTERED';

-- 3. Đảm bảo ràng buộc UNIQUE cho group_decks (đã có trong schema nhưng check lại cho chắc)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_decks_group_id_deck_id_key') THEN
        ALTER TABLE public.group_decks ADD CONSTRAINT group_decks_group_id_deck_id_key UNIQUE (group_id, deck_id);
    END IF;
END $$;

-- 4. Thêm Index tối ưu truy vấn group_decks
CREATE INDEX IF NOT EXISTS idx_group_decks_deck_id ON public.group_decks(deck_id);

-- 5. Cập nhật RLS cho group_decks (Nếu chưa có)
ALTER TABLE public.group_decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "GroupDecks: access" ON public.group_decks;
CREATE POLICY "GroupDecks: access" ON public.group_decks FOR SELECT USING (
  public.is_admin() OR 
  EXISTS (SELECT 1 FROM public.group_users WHERE group_id = public.group_decks.group_id AND user_id = auth.uid())
);
