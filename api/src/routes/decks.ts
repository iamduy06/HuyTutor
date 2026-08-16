import { Router, Request, Response } from "express";
import { createAdminClient } from "../lib/supabase";
import { requireAuth } from "../middleware/auth";
import { verifyToken } from "../lib/supabase";
import { extractTabs, getDeckAccess, computeLevelStr, FlashcardRow, Tab } from "../lib/utils";

const router = Router();

/**
 * GET /api/decks
 * Public: list public/preview decks
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data: decks, error } = await supabase
      .from("decks")
      .select("id, title, description, level, level_min, level_max, access_level, created_at")
      .in("access_level->public", [true])
      .order("created_at", { ascending: true });

    // Fallback: use a raw filter for jsonb
    const { data: decksAll, error: err2 } = await supabase
      .from("decks")
      .select("id, title, description, level, level_min, level_max, access_level, created_at")
      .order("created_at", { ascending: true });

    if (err2) return res.status(500).json({ error: err2.message });

    // Filter public or preview
    const filtered = (decksAll ?? []).filter((d: any) => {
      const al = d.access_level || {};
      return al.public === true || al.preview === true;
    });

    const { data: cards } = await supabase.from("flashcards").select("deck_id, content");
    const wordCountMap: Record<string, number> = {};
    (cards ?? []).forEach((c: any) => {
      const tabs = extractTabs((c as unknown as FlashcardRow).content);
      const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
      wordCountMap[c.deck_id] = (wordCountMap[c.deck_id] ?? 0) + count;
    });

    const result = filtered.map((d: any) => ({
      ...d,
      word_count: wordCountMap[d.id] ?? 0,
      level: computeLevelStr(d.level_min, d.level_max) ?? d.level,
    }));

    return res.json({ decks: result });
  } catch (err: any) {
    console.error("[GET /api/decks]", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /api/decks/:id
 * Public: get deck info
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data: deck, error } = await supabase
      .from("decks")
      .select("id, title, description, level, access_level")
      .eq("id", req.params.id)
      .single();

    if (error || !deck) return res.status(404).json({ error: "Not found" });
    return res.json({ deck });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /api/decks/:id/content
 * Auth optional — returns content based on access level
 */
router.get("/:id/content", async (req: Request, res: Response) => {
  try {
    const adminSupabase = createAdminClient();

    // Auth optional
    let user: any = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      user = await verifyToken(authHeader.slice(7));
    }

    const { data: deck } = await adminSupabase
      .from("decks")
      .select("id, title, description, access_level")
      .eq("id", req.params.id)
      .single();

    if (!deck) return res.status(404).json({ error: "Not found" });

    const [{ data: userProfile }, { data: userDeck }] = await Promise.all([
      user
        ? adminSupabase.from("users").select("role").eq("id", user.id).single()
        : Promise.resolve({ data: null }),
      user
        ? adminSupabase
            .from("user_decks")
            .select("expired_at")
            .eq("user_id", user.id)
            .eq("deck_id", req.params.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const access = getDeckAccess(userProfile as any, deck as any, userDeck);

    if (!access.canLearnFull && !access.isPreview) {
      return res.status(403).json({ error: "Forbidden: Access required" });
    }

    const { data: rows } = await adminSupabase
      .from("flashcards")
      .select("content, created_at")
      .eq("deck_id", req.params.id)
      .order("created_at", { ascending: true });

    const allTabs: Tab[] = (rows ?? []).flatMap((r: any) =>
      extractTabs((r as unknown as FlashcardRow).content)
    );

    let finalTabs = allTabs;
    let isDemo = false;

    if (!access.canLearnFull && access.isPreview) {
      const limit = access.previewLimit || 10;
      let seen = 0;
      finalTabs = allTabs
        .map((tab) => {
          const remaining = limit - seen;
          if (remaining <= 0) return null;
          const vocab = (tab.vocabulary ?? []).slice(0, remaining);
          seen += vocab.length;
          return { ...tab, vocabulary: vocab };
        })
        .filter((t): t is Tab => t !== null && t.vocabulary.length > 0);
      isDemo = true;
    }

    return res.json({
      deck: { id: deck.id, title: deck.title, description: deck.description },
      tabs: finalTabs,
      isDemo,
      previewLimit: access.previewLimit,
      totalWords: allTabs.reduce((s, t) => s + t.vocabulary.length, 0),
    });
  } catch (err: any) {
    console.error("[GET /api/decks/:id/content]", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /api/decks/:id/preview
 * Public: preview deck
 */
router.get("/:id/preview", async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data: deck } = await supabase
      .from("decks")
      .select("id, title, description, level, access_level")
      .eq("id", req.params.id)
      .single();

    if (!deck) return res.status(404).json({ error: "Not found" });

    const access = getDeckAccess(null, deck as any, null);
    if (!access.canView && !access.isPreview) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { data: rows } = await supabase
      .from("flashcards")
      .select("content")
      .eq("deck_id", req.params.id)
      .order("created_at", { ascending: true });

    const allTabs: Tab[] = (rows ?? []).flatMap((r: any) =>
      extractTabs((r as unknown as FlashcardRow).content)
    );

    const limit = (deck as any).access_level?.preview_word_limit ?? 10;
    let seen = 0;
    const previewTabs = allTabs
      .map((tab) => {
        const remaining = limit - seen;
        if (remaining <= 0) return null;
        const vocab = (tab.vocabulary ?? []).slice(0, remaining);
        seen += vocab.length;
        return { ...tab, vocabulary: vocab };
      })
      .filter((t): t is Tab => t !== null && t.vocabulary.length > 0);

    return res.json({ deck, tabs: previewTabs, isDemo: true, previewLimit: limit });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
