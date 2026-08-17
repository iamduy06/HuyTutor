import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import { createAdminClient, verifyToken } from "../lib/supabase";
import { extractTabs, getDeckAccess, FlashcardRow } from "../lib/utils";

const router = Router();

/**
 * GET /api/me/profile
 * Auth required — get current user's profile + subadmin status
 */
router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const admin = createAdminClient();

    const [{ data: profile }, { data: groupSub }] = await Promise.all([
      admin.from("users").select("*").eq("id", req.user.id).single(),
      admin
        .from("group_users")
        .select("id")
        .eq("user_id", req.user.id)
        .eq("is_subadmin", true)
        .limit(1)
        .maybeSingle(),
    ]);

    if (!profile) return res.status(404).json({ error: "Profile not found" });

    return res.json({
      profile: {
        ...profile,
        is_subadmin: !!groupSub,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /api/me/dashboard
 * Auth required — all data needed for the user dashboard page.
 * Returns profile, assigned userDecks, public decks, and word counts.
 */
router.get("/dashboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const admin = createAdminClient();

    const [{ data: profile }, { data: userDecks }, { data: publicDecks }] = await Promise.all([
      admin.from("users").select("*").eq("id", req.user.id).single(),
      admin
        .from("user_decks")
        .select("id, deck_id, progress_percent, learned_count, streak, expired_at, deck:decks(id, title, description, level, access_level)")
        .eq("user_id", req.user.id)
        .order("deck_id"),
      admin
        .from("decks")
        .select("id, title, description, level, access_level")
        .or("access_level->public.eq.true,access_level->auth.eq.true")
        .order("created_at", { ascending: true }),
    ]);

    // Filter userDecks to those with valid access_level
    const filteredUserDecks = (userDecks ?? []).filter((ud: any) => {
      const levels = ud.deck?.access_level ?? {};
      return levels.public === true || levels.auth === true || levels.paid === true;
    });

    // Assigned deck IDs for deduplication
    const assignedDeckIds = new Set(filteredUserDecks.map((ud: any) => ud.deck_id as string));
    const extraPublicDecks = (publicDecks ?? []).filter((d: any) => !assignedDeckIds.has(d.id));

    // Word count for all needed decks
    const allDeckIds = [
      ...filteredUserDecks.map((ud: any) => ud.deck_id as string),
      ...extraPublicDecks.map((d: any) => d.id),
    ];

    let wordCounts: Record<string, number> = {};
    if (allDeckIds.length > 0) {
      const { data: flashcardRows } = await admin
        .from("flashcards")
        .select("deck_id, content")
        .in("deck_id", allDeckIds);

      (flashcardRows ?? []).forEach((r: any) => {
        const tabs = extractTabs((r as unknown as FlashcardRow).content);
        const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
        wordCounts[r.deck_id as string] = (wordCounts[r.deck_id as string] ?? 0) + count;
      });
    }

    return res.json({
      profile: profile ?? null,
      userDecks: filteredUserDecks,
      extraPublicDecks,
      wordCounts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /api/me/deck-access/:deckId
 * Auth required — check current user's access to a specific deck.
 * Used by SSR pages to decide what to render/redirect.
 */
router.get("/deck-access/:deckId", requireAuth, async (req: Request, res: Response) => {
  try {
    const admin = createAdminClient();
    const deckId = req.params.deckId as string;

    const [{ data: deck }, { data: userProfile }, { data: userDeck }] = await Promise.all([
      admin.from("decks").select("id, access_level").eq("id", deckId).single(),
      admin.from("users").select("role").eq("id", req.user.id).single(),
      admin.from("user_decks").select("expired_at").eq("user_id", req.user.id).eq("deck_id", deckId).maybeSingle(),
    ]);

    if (!deck) return res.status(404).json({ error: "Deck not found" });

    const access = getDeckAccess(userProfile as any, deck as any, userDeck);

    return res.json({
      canLearnFull: access.canLearnFull,
      isPreview: access.isPreview,
      previewLimit: access.previewLimit,
      canView: access.canView,
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /api/me/game-decks
 * Auth required — return accessible decks with word counts and tab info for game pages.
 */
router.get("/game-decks", requireAuth, async (req: Request, res: Response) => {
  try {
    const admin = createAdminClient();

    const { data: userDecks, error: udErr } = await admin
      .from("user_decks")
      .select("deck_id, expired_at, deck:decks(id, title, access_level)")
      .eq("user_id", req.user.id);

    if (udErr) return res.status(500).json({ error: udErr.message });

    const accessible = (userDecks ?? []).filter((ud: any) => {
      const levels = ud.deck?.access_level ?? {};
      if (levels.public || levels.auth) return true;
      if (levels.paid) {
        if (!ud.expired_at) return true;
        return new Date(ud.expired_at) > new Date();
      }
      return false;
    });

    if (accessible.length === 0) {
      return res.json({ decks: [] });
    }

    const deckIds = accessible.map((ud: any) => ud.deck_id as string);

    const { data: flashcards } = await admin
      .from("flashcards")
      .select("deck_id, content")
      .in("deck_id", deckIds);

    const wordCountMap: Record<string, number> = {};
    const tabsMap: Record<string, { id: string; label: string; wordCount: number }[]> = {};

    (flashcards ?? []).forEach((r: any) => {
      const tabs = extractTabs((r as unknown as FlashcardRow).content);
      const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
      wordCountMap[r.deck_id] = (wordCountMap[r.deck_id] ?? 0) + count;

      if (!tabsMap[r.deck_id]) tabsMap[r.deck_id] = [];
      tabs.forEach(t => {
        const vCount = t.vocabulary?.length ?? 0;
        if (vCount > 0 && t.id) {
          tabsMap[r.deck_id].push({ id: t.id, label: t.label || t.id, wordCount: vCount });
        }
      });
    });

    const decks = accessible.map((ud: any) => ({
      deck_id: ud.deck_id as string,
      title: (ud.deck as any)?.title ?? ud.deck_id,
      wordCount: wordCountMap[ud.deck_id as string] ?? 0,
      tabs: tabsMap[ud.deck_id as string] ?? [],
    }));

    return res.json({ decks });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /api/me/branding
 * Auth required — get branding for user's group
 */
router.get("/branding", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.json({ branding: null });
    }
    const token = authHeader.slice(7);
    const user = await verifyToken(token);
    if (!user) {
      return res.json({ branding: null });
    }

    const admin = createAdminClient();

    const { data: groupUsers } = await admin
      .from("group_users")
      .select("group_id")
      .eq("user_id", user.id);

    if (!groupUsers || groupUsers.length === 0) {
      return res.json({ branding: null });
    }

    const groupIds = groupUsers.map((g: any) => g.group_id);
    const { data: groups } = await admin.from("groups").select("branding").in("id", groupIds);

    if (!groups) return res.json({ branding: null });

    const activeBranding = groups
      .map((g: any) => g.branding)
      .find((b: any) => b && b.allow_custom_branding === true);

    return res.json({ branding: activeBranding ?? null });
  } catch (err: any) {
    return res.json({ branding: null });
  }
});

export default router;
