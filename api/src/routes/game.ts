import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { createAdminClient } from "../lib/supabase";
import { extractTabs, shuffle, deduplicateVocab, FlashcardRow, VocabItem } from "../lib/utils";

const router = Router();

/**
 * GET /api/game/vocab?deckId=<id|all>&limit=<n>&tabIds=<id1,id2>
 * Auth required
 */
router.get("/vocab", requireAuth, async (req: Request, res: Response) => {
  try {
    const deckId = (req.query.deckId as string) ?? "all";
    const limitParam = req.query.limit as string;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const tabIdsParam = req.query.tabIds as string;
    const selectedTabIds = tabIdsParam ? tabIdsParam.split(",") : [];

    const admin = createAdminClient();

    const { data: userDecks, error: udErr } = await admin
      .from("user_decks")
      .select("deck_id, expired_at, deck:decks(id, title, access_level)")
      .eq("user_id", req.user.id);

    if (udErr) return res.status(500).json({ error: udErr.message });

    const accessibleDecks = (userDecks ?? []).filter((ud: any) => {
      const levels = ud.deck?.access_level ?? {};
      if (levels.public || levels.auth) return true;
      if (levels.paid) {
        if (!ud.expired_at) return true;
        return new Date(ud.expired_at) > new Date();
      }
      return false;
    });

    if (accessibleDecks.length === 0) {
      return res.json({ vocab: [], deckTitle: "Tất cả", totalCount: 0 });
    }

    let targetDeckIds: string[];
    let deckTitle = "Tất cả deck";

    if (deckId === "all") {
      targetDeckIds = accessibleDecks.map((ud: any) => ud.deck_id as string);
    } else {
      const found = accessibleDecks.find((ud: any) => ud.deck_id === deckId);
      if (!found) return res.status(403).json({ error: "Forbidden: deck not accessible" });
      targetDeckIds = [deckId];
      deckTitle = (found as any).deck?.title ?? deckId;
    }

    const { data: flashcards, error: fcErr } = await admin
      .from("flashcards")
      .select("deck_id, content")
      .in("deck_id", targetDeckIds);

    if (fcErr) return res.status(500).json({ error: fcErr.message });

    const allVocab: VocabItem[] = (flashcards ?? []).flatMap((row: any) => {
      let tabs = extractTabs((row as unknown as FlashcardRow).content);
      if (selectedTabIds.length > 0) {
        tabs = tabs.filter((t) => selectedTabIds.includes(t.id!));
      }
      return tabs.flatMap((t) => t.vocabulary ?? []);
    });

    const deduped = deduplicateVocab(allVocab);
    const totalCount = deduped.length;
    const shuffled = shuffle(deduped);
    const vocab = limit ? shuffled.slice(0, limit) : shuffled;

    return res.json({ vocab, deckTitle, totalCount });
  } catch (err: any) {
    console.error("[GET /api/game/vocab]", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
