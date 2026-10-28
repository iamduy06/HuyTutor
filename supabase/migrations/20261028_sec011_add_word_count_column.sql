-- Migration: SEC-011 Add word_count to decks table and create trigger to keep it updated

-- 1. Add word_count column if not exists
ALTER TABLE IF EXISTS public.decks 
ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;

-- 2. Function to compute total words from flashcards JSON content
CREATE OR REPLACE FUNCTION public.calculate_deck_words(target_deck_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(
    jsonb_array_length(
      CASE 
        WHEN jsonb_typeof(tab->'vocabulary') = 'array' THEN tab->'vocabulary'
        ELSE '[]'::jsonb
      END
    )
  ), 0)
  INTO total
  FROM public.flashcards f,
       LATERAL (
         SELECT value as tab 
         FROM jsonb_array_elements(
           CASE 
             WHEN jsonb_typeof(f.content->'tabs') = 'array' THEN f.content->'tabs'
             WHEN jsonb_typeof(f.content) = 'array' THEN f.content
             ELSE '[]'::jsonb
           END
         )
       ) tabs
  WHERE f.deck_id = target_deck_id;

  RETURN total;
END;
$$;

-- 3. Trigger function to auto-update word_count on decks table
CREATE OR REPLACE FUNCTION public.trg_update_deck_word_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  d_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    d_id := OLD.deck_id;
  ELSE
    d_id := NEW.deck_id;
  END IF;

  IF d_id IS NOT NULL THEN
    UPDATE public.decks
    SET word_count = public.calculate_deck_words(d_id)
    WHERE id = d_id;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_flashcards_word_count ON public.flashcards;
CREATE TRIGGER trg_flashcards_word_count
AFTER INSERT OR UPDATE OR DELETE ON public.flashcards
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_deck_word_count();

-- 4. Initial backfill of word_count for existing decks
UPDATE public.decks d
SET word_count = public.calculate_deck_words(d.id);
