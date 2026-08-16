import { Router, Request, Response } from "express";
import { requireAuth, requireAdmin } from "../../middleware/auth";
import { createAdminClient } from "../../lib/supabase";
import { extractTabs, computeLevelStr, FlashcardRow, Tab } from "../../lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VocabItem = any;

const router = Router();

/**
 * GET /api/admin/decks
 */
router.get("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("decks")
      .select("id, title, description, level, level_min, level_max, access_level, group_id, created_at")
      .order("created_at", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const { data: cards } = await supabase.from("flashcards").select("deck_id, content");
    const wordCountMap: Record<string, number> = {};
    (cards ?? []).forEach((c: any) => {
      const tabs = extractTabs((c as unknown as FlashcardRow).content);
      const count = tabs.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0);
      wordCountMap[c.deck_id] = (wordCountMap[c.deck_id] ?? 0) + count;
    });

    const decks = (data ?? []).map((d: any) => ({
      ...d,
      word_count: wordCountMap[d.id] ?? 0,
      level: computeLevelStr(d.level_min, d.level_max) ?? d.level,
    }));

    return res.json({ decks });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * POST /api/admin/decks
 */
router.post("/", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, level_min, level_max, access_level, group_id } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const levels = access_level || {};
    if (levels.preview === true && (!levels.preview_word_limit || levels.preview_word_limit <= 0)) {
      return res.status(400).json({ error: "preview_word_limit must be > 0 when preview access is enabled" });
    }

    const supabase = createAdminClient();
    const levelStr = computeLevelStr(level_min ?? null, level_max ?? null);
    const { data, error } = await supabase
      .from("decks")
      .insert({
        title, description, level: levelStr,
        level_min: level_min ?? null, level_max: level_max ?? null,
        group_id: group_id === undefined ? undefined : (group_id || null),
        ...(access_level ? { access_level } : {}),
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ deck: data });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * GET /api/admin/decks/:id
 */
router.get("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { data: deck } = await supabase.from("decks").select("*").eq("id", req.params.id).single();
    const { data: rows } = await supabase
      .from("flashcards").select("*").eq("deck_id", req.params.id)
      .order("created_at", { ascending: true });

    const tabs: Tab[] = (rows ?? []).flatMap((r: any) =>
      extractTabs((r as unknown as FlashcardRow).content)
    );
    const cards = tabs.flatMap((tab, tabIdx) =>
      (tab.vocabulary ?? []).map((v) => ({
        _rowId: rows?.[0]?.id ?? "",
        _tabIndex: tabIdx,
        _tabLabel: tab.label ?? `Unit ${tabIdx + 1}`,
        content: v,
      }))
    );

    return res.json({ deck, tabs, cards });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * PUT /api/admin/decks/:id
 */
router.put("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, description, level_min, level_max, access_level, group_id } = req.body;
    const levelStr = computeLevelStr(req.body.level_min ?? null, req.body.level_max ?? null);
    const levels = access_level || {};
    if (levels.preview === true && (!levels.preview_word_limit || levels.preview_word_limit <= 0)) {
      return res.status(400).json({ error: "preview_word_limit must be > 0 when preview access is enabled" });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("decks")
      .update({
        title, description,
        level: levelStr, level_min: level_min ?? null, level_max: level_max ?? null,
        group_id: group_id === undefined ? undefined : (group_id || null),
        ...(access_level ? { access_level } : {}),
      })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ deck: data });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * DELETE /api/admin/decks/:id
 */
router.delete("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("decks").delete().eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Shared helpers for Tab/Word CRUD ─────────────────────────────────────────

async function getTabsAndRow(supabase: ReturnType<typeof createAdminClient>, deckId: string) {
  const { data: rows } = await supabase
    .from("flashcards").select("id, content").eq("deck_id", deckId)
    .order("created_at", { ascending: true });
  const allTabs: Tab[] = (rows ?? []).flatMap(r =>
    extractTabs((r as unknown as FlashcardRow).content)
  );
  return {
    rowId: (rows?.[0]?.id as string) ?? null,
    tabs: allTabs,
    extraRowIds: (rows ?? []).slice(1).map(r => r.id as string),
  };
}

async function saveTabs(supabase: ReturnType<typeof createAdminClient>, deckId: string, rowId: string | null, tabs: Tab[], extraIds: string[]) {
  const content = { tabs };
  if (rowId) await supabase.from("flashcards").update({ content }).eq("id", rowId);
  else await supabase.from("flashcards").insert({ deck_id: deckId, content });
  if (extraIds.length) await supabase.from("flashcards").delete().in("id", extraIds);
}

// ── POST /api/admin/decks/:id/tabs — Add tab or bulk import tabs ─────────────
router.post("/:id/tabs", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const supabase = createAdminClient();
    const { rowId, tabs: current, extraRowIds } = await getTabsAndRow(supabase, req.params.id as string);
    const body = req.body;

    const incomingTabs: Tab[] | null = Array.isArray(body) ? body as Tab[]
      : (body?.tabs && Array.isArray(body.tabs)) ? body.tabs as Tab[] : null;

    if (incomingTabs !== null) {
      if (!incomingTabs.length) return res.status(400).json({ error: "Không có tab nào trong JSON" });
      for (const tab of incomingTabs) {
        if (!tab.label && !tab.id) return res.status(400).json({ error: "Mỗi tab cần có label hoặc id" });
        if (!Array.isArray(tab.vocabulary)) tab.vocabulary = [];
      }
      const merged = [...current, ...incomingTabs];
      await saveTabs(supabase, req.params.id as string, rowId, merged, extraRowIds);
      return res.json({ success: true, tabsAdded: incomingTabs.length, totalTabs: merged.length, totalWords: merged.reduce((s, t) => s + (t.vocabulary?.length ?? 0), 0) });
    }

    if (!body.label?.trim()) return res.status(400).json({ error: "label là bắt buộc" });
    const newTab: Tab = { id: body.id?.trim() || `tab-${Date.now()}`, label: body.label.trim(), desc: body.desc?.trim() || undefined, vocabulary: [] };
    current.push(newTab);
    await saveTabs(supabase, req.params.id as string, rowId, current, extraRowIds);
    return res.json({ success: true, tabIndex: current.length - 1 });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── PUT /api/admin/decks/:id/tabs/:tabIndex ───────────────────────────────────
router.put("/:id/tabs/:tabIndex", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tabIdx = parseInt(req.params.tabIndex as string);
    if (isNaN(tabIdx)) return res.status(400).json({ error: "Invalid tabIndex" });
    const supabase = createAdminClient();
    const { rowId, tabs, extraRowIds } = await getTabsAndRow(supabase, req.params.id as string);
    if (!tabs[tabIdx]) return res.status(404).json({ error: "Tab not found" });
    const body = req.body;
    if (body.label !== undefined) tabs[tabIdx].label = body.label;
    if (body.id !== undefined) tabs[tabIdx].id = body.id;
    if (body.desc !== undefined) tabs[tabIdx].desc = body.desc;
    await saveTabs(supabase, req.params.id as string, rowId, tabs, extraRowIds);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── DELETE /api/admin/decks/:id/tabs/:tabIndex ────────────────────────────────
router.delete("/:id/tabs/:tabIndex", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tabIdx = parseInt(req.params.tabIndex as string);
    if (isNaN(tabIdx)) return res.status(400).json({ error: "Invalid tabIndex" });
    const supabase = createAdminClient();
    const { rowId, tabs, extraRowIds } = await getTabsAndRow(supabase, req.params.id as string);
    tabs.splice(tabIdx, 1);
    await saveTabs(supabase, req.params.id as string, rowId, tabs, extraRowIds);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── POST /api/admin/decks/:id/tabs/:tabIndex/words ────────────────────────────
router.post("/:id/tabs/:tabIndex/words", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tabIdx = parseInt(req.params.tabIndex as string);
    if (isNaN(tabIdx)) return res.status(400).json({ error: "Invalid tabIndex" });
    const word = req.body as VocabItem;
    if (!word.word?.trim() || !word.meaning?.trim()) return res.status(400).json({ error: "word và meaning là bắt buộc" });
    const supabase = createAdminClient();
    const { rowId, tabs, extraRowIds } = await getTabsAndRow(supabase, req.params.id as string);
    if (tabIdx < 0 || tabIdx >= tabs.length) return res.status(404).json({ error: "Tab not found" });
    tabs[tabIdx].vocabulary = [...(tabs[tabIdx].vocabulary ?? []), word];
    await saveTabs(supabase, req.params.id as string, rowId, tabs, extraRowIds);
    return res.json({ success: true, wordIndex: tabs[tabIdx].vocabulary.length - 1 });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── PUT /api/admin/decks/:id/tabs/:tabIndex/words/:wordIndex ──────────────────
router.put("/:id/tabs/:tabIndex/words/:wordIndex", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tabIdx = parseInt(req.params.tabIndex as string);
    const wordIdx = parseInt(req.params.wordIndex as string);
    if (isNaN(tabIdx) || isNaN(wordIdx)) return res.status(400).json({ error: "Invalid index" });
    const word = req.body as VocabItem;
    if (!word.word?.trim() || !word.meaning?.trim()) return res.status(400).json({ error: "word và meaning là bắt buộc" });
    const supabase = createAdminClient();
    const { rowId, tabs, extraRowIds } = await getTabsAndRow(supabase, req.params.id as string);
    if (!tabs[tabIdx] || !tabs[tabIdx].vocabulary?.[wordIdx]) return res.status(404).json({ error: "Not found" });
    tabs[tabIdx].vocabulary[wordIdx] = word;
    await saveTabs(supabase, req.params.id as string, rowId, tabs, extraRowIds);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── DELETE /api/admin/decks/:id/tabs/:tabIndex/words/:wordIndex ───────────────
router.delete("/:id/tabs/:tabIndex/words/:wordIndex", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tabIdx = parseInt(req.params.tabIndex as string);
    const wordIdx = parseInt(req.params.wordIndex as string);
    if (isNaN(tabIdx) || isNaN(wordIdx)) return res.status(400).json({ error: "Invalid index" });
    const supabase = createAdminClient();
    const { rowId, tabs, extraRowIds } = await getTabsAndRow(supabase, req.params.id as string);
    if (!tabs[tabIdx]) return res.status(404).json({ error: "Tab not found" });
    tabs[tabIdx].vocabulary.splice(wordIdx, 1);
    await saveTabs(supabase, req.params.id as string, rowId, tabs, extraRowIds);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── POST /api/admin/decks/:id/tabs/:tabIndex/words/bulk ──────────────────────
router.post("/:id/tabs/:tabIndex/words/bulk", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const tabIdx = parseInt(req.params.tabIndex as string);
    if (isNaN(tabIdx)) return res.status(400).json({ error: "Invalid tabIndex" });
    const { words } = req.body;
    if (!Array.isArray(words)) return res.status(400).json({ error: "words must be an array" });
    const supabase = createAdminClient();
    const { rowId, tabs, extraRowIds } = await getTabsAndRow(supabase, req.params.id as string);
    if (tabIdx < 0 || tabIdx >= tabs.length) return res.status(404).json({ error: "Tab not found" });
    tabs[tabIdx].vocabulary = [...(tabs[tabIdx].vocabulary ?? []), ...words];
    await saveTabs(supabase, req.params.id as string, rowId, tabs, extraRowIds);
    return res.json({ success: true, wordsAdded: words.length });
  } catch (err: any) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
