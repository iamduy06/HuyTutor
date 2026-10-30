-- ==============================================================================
-- Migration: 20261028_sec001_fix_flashcards_rls.sql
-- Fix SEC-001: RLS Policy trên bảng flashcards cho phép truy xuất 100% nội dung bộ đề qua Supabase Anon Key
-- ==============================================================================

-- 1. Hủy bỏ policy cũ cho phép SELECT tự do dựa trên EXISTS (SELECT 1 FROM decks)
DROP POLICY IF EXISTS "Flashcards: selective view" ON public.flashcards;
DROP POLICY IF EXISTS "Flashcards: authorized full access view" ON public.flashcards;

-- 2. Thiết lập policy mới có điều kiện kiểm tra quyền truy cập thực tế:
-- - Siêu quản trị viên (ADMIN) có toàn quyền xem.
-- - Học viên chỉ có thể SELECT trực tiếp từ Database nếu bộ đề là PUBLIC,
--   hoặc bộ đề yêu cầu AUTH (đã đăng nhập),
--   hoặc học viên sở hữu lượt gán hợp lệ còn hạn trong bảng user_decks.
-- - Quyền xem thử (preview/demo chỉ giới hạn 10 từ) BẮT BUỘC phải đi qua Backend Express API (/api/v1/decks/demo hoặc /api/v1/decks/:id/preview)
--   nơi logic ứng dụng cắt lát mảng JSONB an toàn, ngăn chặn việc tải lậu toàn bộ cột content qua Supabase Anon REST API.
CREATE POLICY "Flashcards: authorized full access view" ON public.flashcards FOR SELECT USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.decks d
    WHERE d.id = deck_id
    AND (
      (d.access_level->>'public')::boolean = true
      OR ((d.access_level->>'auth')::boolean = true AND auth.uid() IS NOT NULL)
      OR EXISTS (
        SELECT 1 FROM public.user_decks ud
        WHERE ud.user_id = auth.uid() AND ud.deck_id = d.id
        AND (ud.expired_at IS NULL OR ud.expired_at > now())
      )
    )
  )
);

