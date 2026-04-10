-- Di chuyển dữ liệu sang cấu trúc JSON mới
UPDATE public.decks
SET access_level = jsonb_build_object(
    'public',             COALESCE((access_level->>'public')::boolean, false),
    'auth',               COALESCE((access_level->>'authenticated')::boolean, (access_level->>'auth')::boolean, false),
    'paid',               COALESCE((access_level->>'authorized')::boolean, (access_level->>'paid')::boolean, true),
    'preview',            COALESCE((access_level->>'preview')::boolean, false),
    'preview_word_limit', COALESCE(preview_word_limit, 10)
);

-- Xóa cột cũ
ALTER TABLE public.decks DROP COLUMN IF EXISTS preview_word_limit;

-- Cập nhật RLS Policy để khớp với các key mới
DROP POLICY IF EXISTS "Decks: access control" ON public.decks;

CREATE POLICY "Decks: access control" ON public.decks FOR SELECT USING (
  ((access_level->>'public')::boolean = true)                                       -- Public
  OR ((access_level->>'auth')::boolean = true AND auth.uid() IS NOT NULL)           -- Auth
  OR ((access_level->>'preview')::boolean = true)                                   -- Preview
  OR public.is_admin()                                                              -- Admin
  OR EXISTS (                                                                       -- Paid
     SELECT 1 FROM public.user_decks 
     WHERE user_id = auth.uid() AND deck_id = id 
     AND (expired_at IS NULL OR expired_at > now())
  )
);
