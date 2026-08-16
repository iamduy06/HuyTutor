import { Router, Request, Response } from "express";
import { requireAuth, requireSubAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";
import { extractTabs, FlashcardRow } from "../../lib/utils";

const router = Router();

/**
 * GET /api/subadmin/decks
 */
router.get("/", requireAuth, requireSubAdmin, async (req: Request, res: Response) => {
  try {
    const me = req.userProfile;
    const admin = createAdminClient();

    if (me.role === "ADMIN") {
      const { data } = await admin
        .from("decks")
        .select("id, title, description, level, access_level, flashcards(count)")
        .order("created_at", { ascending: true });
      const formatted = (data ?? []).map((d: any) => ({
        ...d, word_count: d.flashcards?.[0]?.count ?? 0, flashcards: undefined,
      }));
      return res.json({ decks: formatted });
    }

    const { data: managedGroups } = await admin
      .from("group_users").select("group_id").eq("user_id", me.id).eq("is_subadmin", true);

    const groupIds = (managedGroups ?? []).map((g: any) => g.group_id);
    if (groupIds.length === 0) return res.json({ decks: [] });

    const { data: groupDecks } = await admin
      .from("group_decks")
      .select("deck_id, expired_at, deck:decks(id, title, description, level, access_level)")
      .in("group_id", groupIds);

    const deckIds = Array.from(new Set((groupDecks ?? []).map((gd: any) => gd.deck?.id).filter(Boolean)));
    if (deckIds.length === 0) return res.json({ decks: [] });

    const { data: cards } = await admin.from("flashcards").select("deck_id, content").in("deck_id", deckIds);
    const wordMap: Record<string, number> = {};
    (cards ?? []).forEach((c: any) => {
      const tabs = extractTabs((c as unknown as FlashcardRow).content);
      const count = tabs.reduce((s: number, t) => s + (t.vocabulary?.length ?? 0), 0);
      wordMap[c.deck_id] = (wordMap[c.deck_id] ?? 0) + count;
    });

    const decks = (groupDecks ?? []).map((gd: any) => ({
      ...(gd.deck ?? {}),
      word_count: wordMap[gd.deck?.id] ?? 0,
      group_expired_at: gd.expired_at,
    })).filter((d: any) => d.id);

    return res.json({ decks });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
