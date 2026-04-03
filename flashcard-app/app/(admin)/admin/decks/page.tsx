"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Loader2, Upload, FolderPlus, BookOpen, ListPlus, FileJson
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DECK_LEVELS } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";
import { CEFR_LEVELS, WORD_TYPES } from "@/types";
import type { Deck, Tab, VocabItem } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FlatCard {
  _rowId:    string;
  _tabIndex: number;
  _tabLabel: string;
  content:   VocabItem;
}
interface DeckDetail {
  deck:  Deck;
  tabs:  Tab[];
  cards: FlatCard[];
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function fetchAdminDecks(): Promise<Deck[]> {
  const res = await fetch("/api/admin/decks");
  return (await res.json()).decks ?? [];
}

async function fetchDeckDetail(deckId: string): Promise<DeckDetail> {
  const res  = await fetch(`/api/admin/decks/${deckId}`);
  const data = await res.json();
  return { deck: data.deck, tabs: data.tabs ?? [], cards: data.cards ?? [] };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EMPTY_WORD = {
  word: "", phonetic: "", meaning: "", type: "Noun",
  example: "", translation: "", synonyms: "", antonyms: "", cefr: "B1",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminDecksPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: decks = [], isLoading } = useQuery({
    queryKey: ["admin-decks"], queryFn: fetchAdminDecks,
  });

  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);
  const [deckDetail,   setDeckDetail]   = useState<Record<string, DeckDetail>>({});

  // ── Dialogs ──
  const [showDeckDlg,     setShowDeckDlg]     = useState(false);
  const [showTabDlg,      setShowTabDlg]       = useState<string | null>(null);   // deckId
  const [showWordDlg,     setShowWordDlg]      = useState<{ deckId: string; tabIndex: number } | null>(null);
  const [showBulkTabsDlg, setShowBulkTabsDlg] = useState<string | null>(null);   // deckId
  const [showEditTabDlg,  setShowEditTabDlg]  = useState<{ deckId: string; tabIndex: number } | null>(null);
  const [editTabForm,     setEditTabForm]     = useState({ id: "", label: "", desc: "" });

  // ── Editing targets ──
  const [editingDeck,  setEditingDeck]  = useState<Deck | null>(null);
  const [editingWord,  setEditingWord]  = useState<FlatCard | null>(null);

  // ── Forms ──
  const [deckForm, setDeckForm] = useState({ title: "", description: "", level_min: "", level_max: "", is_public: false });
  const [tabForm,  setTabForm]  = useState({ id: "", label: "", desc: "" });
  const [wordForm, setWordForm] = useState(EMPTY_WORD);

  // ── File uploads ──
  // Per-tab JSON: import words vào 1 tab cụ thể
  const [wordJsonFile,   setWordJsonFile]   = useState<File | null>(null);
  const [wordJsonTarget, setWordJsonTarget] = useState<{ deckId: string; tabIndex: number } | null>(null);

  // Bulk tabs JSON: import nhiều tabs + vocabulary cùng lúc vào 1 deck
  const [bulkTabsText, setBulkTabsText]   = useState("");
  const [bulkTabsFile, setBulkTabsFile]   = useState<File | null>(null);
  const [bulkTabsMode, setBulkTabsMode]   = useState<"file" | "paste">("file");

  // ── Load deck detail ──────────────────────────────────────────────────────
  async function loadDetail(deckId: string) {
    const detail = await fetchDeckDetail(deckId);
    setDeckDetail((prev: Record<string, DeckDetail>) => ({ ...prev, [deckId]: detail }));
  }

  function toggleExpand(deckId: string) {
    if (expandedDeck === deckId) { setExpandedDeck(null); return; }
    setExpandedDeck(deckId);
    if (!deckDetail[deckId]) loadDetail(deckId);
  }

  // ── Deck CRUD ─────────────────────────────────────────────────────────────
  const saveDeck = useMutation({
    mutationFn: async () => {
      const url    = editingDeck ? `/api/admin/decks/${editingDeck.id}` : "/api/admin/decks";
      const method = editingDeck ? "PUT" : "POST";
      const payload = {
        title: deckForm.title,
        description: deckForm.description,
        level_min: deckForm.level_min || null,
        level_max: deckForm.level_max || null,
        is_public: deckForm.is_public,
      };
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-decks"] });
      setShowDeckDlg(false); setEditingDeck(null);
      toast({ title: editingDeck ? "Cập nhật bộ đề thành công" : "Tạo bộ đề thành công" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteDeck = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/decks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-decks"] }); toast({ title: "Đã xóa bộ đề" }); },
  });

  // ── Tab CRUD ──────────────────────────────────────────────────────────────
  const saveTab = useMutation({
    mutationFn: async (deckId: string) => {
      const res = await fetch(`/api/admin/decks/${deckId}/tabs`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(tabForm),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    },
    onSuccess: (_: unknown, deckId: string) => {
      loadDetail(deckId); setShowTabDlg(null);
      toast({ title: "Đã thêm tab mới" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const saveTabEdit = useMutation({
    mutationFn: async ({ deckId, tabIndex }: { deckId: string; tabIndex: number }) => {
      const res = await fetch(`/api/admin/decks/${deckId}/tabs/${tabIndex}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTabForm),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    },
    onSuccess: (_: unknown, { deckId }: { deckId: string }) => {
      loadDetail(deckId); setShowEditTabDlg(null);
      toast({ title: "Đã cập nhật tab" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteTab = useMutation({
    mutationFn: async ({ deckId, tabIndex }: { deckId: string; tabIndex: number }) => {
      const res = await fetch(`/api/admin/decks/${deckId}/tabs/${tabIndex}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: (_: unknown, { deckId }: { deckId: string }) => {
      loadDetail(deckId); toast({ title: "Đã xóa tab" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  // ── Word CRUD ─────────────────────────────────────────────────────────────
  const saveWord = useMutation({
    mutationFn: async ({ deckId, tabIndex, wordIndex }: { deckId: string; tabIndex: number; wordIndex?: number }) => {
      const vocabItem = {
        ...wordForm,
        synonyms: wordForm.synonyms.split(",").map((s: string) => s.trim()).filter(Boolean),
        antonyms: wordForm.antonyms.split(",").map((s: string) => s.trim()).filter(Boolean),
      };
      const url    = wordIndex !== undefined
        ? `/api/admin/decks/${deckId}/tabs/${tabIndex}/words/${wordIndex}`
        : `/api/admin/decks/${deckId}/tabs/${tabIndex}/words`;
      const method = wordIndex !== undefined ? "PUT" : "POST";
      const res    = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(vocabItem),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    },
    onSuccess: (_: unknown, { deckId }: { deckId: string }) => {
      loadDetail(deckId); setShowWordDlg(null); setEditingWord(null);
      toast({ title: "Đã lưu từ vựng" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteWord = useMutation({
    mutationFn: async ({ deckId, tabIndex, wordIndex }: { deckId: string; tabIndex: number; wordIndex: number }) => {
      const res = await fetch(`/api/admin/decks/${deckId}/tabs/${tabIndex}/words/${wordIndex}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: (_: unknown, { deckId }: { deckId: string }) => {
      loadDetail(deckId); toast({ title: "Đã xóa từ vựng" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  // ── Import words vào 1 tab (JSON array) ──────────────────────────────────
  async function handleImportWords(deckId: string, tabIndex: number) {
    if (!wordJsonFile) return;
    let parsed: unknown;
    try { parsed = JSON.parse(await wordJsonFile.text()); }
    catch { toast({ title: "JSON không hợp lệ", variant: "destructive" }); return; }

    const words = Array.isArray(parsed) ? parsed : [parsed];
    const res = await fetch(`/api/admin/decks/${deckId}/tabs/${tabIndex}/words/bulk`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words }),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: `✅ Import ${words.length} từ thành công!` });
      loadDetail(deckId); setWordJsonFile(null); setWordJsonTarget(null);
    } else {
      toast({ title: data.error ?? "Import thất bại", variant: "destructive" });
    }
  }

  // ── Import nhiều tabs (bulk) ──────────────────────────────────────────────
  async function handleBulkTabsImport(deckId: string) {
    let jsonStr = bulkTabsText.trim();

    // Nếu dùng file thì đọc file
    if (bulkTabsMode === "file" && bulkTabsFile) {
      jsonStr = await bulkTabsFile.text();
    }

    if (!jsonStr) {
      toast({ title: "Chưa có dữ liệu JSON", variant: "destructive" }); return;
    }

    let parsed: unknown;
    try { parsed = JSON.parse(jsonStr); }
    catch { toast({ title: "JSON không hợp lệ — kiểm tra cú pháp", variant: "destructive" }); return; }

    const res = await fetch(`/api/admin/decks/${deckId}/tabs`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: `✅ Import ${data.tabsAdded} tab(s), ${data.totalWords} từ!` });
      loadDetail(deckId);
      setShowBulkTabsDlg(null);
      setBulkTabsText(""); setBulkTabsFile(null);
    } else {
      toast({ title: data.error ?? "Import thất bại", variant: "destructive" });
    }
  }

  // ── Open helpers ──────────────────────────────────────────────────────────
  function openCreateDeck() {
    setEditingDeck(null); setDeckForm({ title: "", description: "", level_min: "", level_max: "", is_public: false }); setShowDeckDlg(true);
  }
  function openEditDeck(deck: Deck) {
    setEditingDeck(deck);
    setDeckForm({ title: deck.title, description: deck.description ?? "", level_min: (deck as any).level_min ?? "", level_max: (deck as any).level_max ?? "", is_public: Boolean((deck as any).is_public) });
    setShowDeckDlg(true);
  }
  function openCreateTab(deckId: string) {
    setTabForm({ id: `tab-${Date.now()}`, label: "", desc: "" });
    setShowTabDlg(deckId);
  }
  function openBulkImport(deckId: string) {
    setBulkTabsText(""); setBulkTabsFile(null); setBulkTabsMode("file");
    setShowBulkTabsDlg(deckId);
  }
  function openCreateWord(deckId: string, tabIndex: number) {
    setEditingWord(null); setWordForm(EMPTY_WORD);
    setShowWordDlg({ deckId, tabIndex });
  }
  function openEditWord(deckId: string, card: FlatCard) {
    setEditingWord(card);
    const v = card.content;
    setWordForm({
      word: v.word, phonetic: v.phonetic ?? "", meaning: v.meaning, type: v.type ?? "Noun",
      example: v.example ?? "", translation: v.translation ?? "",
      synonyms: Array.isArray(v.synonyms) ? v.synonyms.join(", ") : (v.synonyms ?? ""),
      antonyms: Array.isArray(v.antonyms) ? v.antonyms.join(", ") : (v.antonyms ?? ""),
      cefr: v.cefr ?? "B1",
    });
    setShowWordDlg({ deckId, tabIndex: card._tabIndex });
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-[#1a1a2e]">📚 Quản lý bộ đề</h1>
        <Button variant="brand" onClick={openCreateDeck}><Plus className="w-4 h-4" /> Tạo bộ đề</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
      ) : (
        <div className="flex flex-col gap-4">
          {(decks as Deck[]).map((deck) => {
            const detail   = deckDetail[deck.id];
            const expanded = expandedDeck === deck.id;
            return (
              <div key={deck.id} className="bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden">
                {/* ── Deck header ── */}
                <div className="flex items-center gap-3 p-4 flex-wrap">
                  <button onClick={() => toggleExpand(deck.id)} className="text-muted-foreground hover:text-brand transition-colors flex-shrink-0">
                    {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1a1a2e]">{deck.title}</span>
                      {deck.level && <span className="text-xs bg-brand-light text-brand px-2 py-0.5 rounded-full font-semibold">{deck.level}</span>}
                      {(deck as any).is_public
                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">🌐 Public</span>
                        : <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">🔒 Private</span>
                      }
                      <span className="text-xs text-muted-foreground">({(deck as any).word_count ?? 0} từ)</span>
                    </div>
                    {deck.description && <p className="text-sm text-muted-foreground mt-0.5 truncate">{deck.description}</p>}
                  </div>
                  <div className="flex gap-1.5 flex-wrap items-center">
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs"
                      onClick={() => openBulkImport(deck.id)}>
                      <FileJson className="w-3.5 h-3.5" /> Import JSON (nhiều tabs)
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openEditDeck(deck)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-2 text-red-500"
                      onClick={() => { if (confirm("Xóa bộ đề này và tất cả flashcard?")) deleteDeck.mutate(deck.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* ── Expanded: tabs + words ── */}
                {expanded && (
                  <div className="border-t-2 border-[#f0e0e7] p-4">
                    {!detail ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-sm text-[#1a1a2e]">
                            📂 Tabs / Units ({detail.tabs.length})
                          </span>
                          <Button size="sm" variant="brand" className="h-8 text-xs gap-1" onClick={() => openCreateTab(deck.id)}>
                            <FolderPlus className="w-3.5 h-3.5" /> Thêm Tab
                          </Button>
                        </div>

                        {detail.tabs.length === 0 ? (
                          <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed border-[#f0e0e7] rounded-xl mb-2">
                            Chưa có tab nào.<br />Tạo tab để thêm từ vựng hoặc dùng nút "Import JSON (nhiều tabs)" ở trên.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {detail.tabs.map((tab, tabIdx) => {
                              const tabWords = detail.cards.filter(c => c._tabIndex === tabIdx);
                              return (
                                <div key={tab.id ?? tabIdx} className="border-2 border-[#f0e0e7] rounded-xl overflow-hidden">
                                  {/* Tab header */}
                                  <div className="flex items-center gap-2 p-3 bg-[#f8f9fa] flex-wrap">
                                    <BookOpen className="w-4 h-4 text-brand flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm text-[#1a1a2e]">{tab.label ?? `Unit ${tabIdx + 1}`}</span>
                                        {tab.id && <span className="text-[10px] text-muted-foreground bg-white border rounded px-1">{tab.id}</span>}
                                      </div>
                                      {tab.desc && <p className="text-xs text-muted-foreground truncate">{tab.desc}</p>}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{tabWords.length} từ</span>
                                    <div className="flex gap-1 flex-shrink-0 flex-wrap">
                                      {/* Import words vào tab này */}
                                      <label className="cursor-pointer">
                                        <input type="file" accept=".json" className="hidden"
                                          onChange={e => {
                                            setWordJsonFile(e.target.files?.[0] ?? null);
                                            setWordJsonTarget({ deckId: deck.id, tabIndex: tabIdx });
                                          }} />
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#f0e0e7] text-xs font-semibold hover:border-brand hover:text-brand cursor-pointer transition-all">
                                          <Upload className="w-3 h-3" /> Import từ
                                        </span>
                                      </label>
                                      {wordJsonFile && wordJsonTarget?.deckId === deck.id && wordJsonTarget?.tabIndex === tabIdx && (
                                        <Button size="sm" variant="brand" className="h-7 text-xs px-2"
                                          onClick={() => handleImportWords(deck.id, tabIdx)}>
                                          Upload
                                        </Button>
                                      )}
                                      <Button size="sm" variant="brand" className="h-7 text-xs gap-1"
                                        onClick={() => openCreateWord(deck.id, tabIdx)}>
                                        <ListPlus className="w-3.5 h-3.5" /> Thêm từ
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                                        title="Sửa tab"
                                        onClick={() => {
                                          setEditTabForm({ id: tab.id ?? "", label: tab.label ?? "", desc: tab.desc ?? "" });
                                          setShowEditTabDlg({ deckId: deck.id, tabIndex: tabIdx });
                                        }}>
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500"
                                        onClick={() => {
                                          if (confirm(`Xóa tab "${tab.label ?? `Unit ${tabIdx + 1}`}"?`))
                                            deleteTab.mutate({ deckId: deck.id, tabIndex: tabIdx });
                                        }}>
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Word list */}
                                  <div className="max-h-60 overflow-y-auto divide-y divide-[#f0e0e7]">
                                    {tabWords.length === 0 ? (
                                      <p className="text-xs text-muted-foreground text-center py-4">Chưa có từ vựng trong tab này.</p>
                                    ) : tabWords.map((card, wi) => (
                                      <div key={wi} className="flex items-center gap-2 px-3 py-2 hover:bg-[#f8f9fa]">
                                        <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                                          <span className="font-bold text-sm text-[#1a1a2e]">{card.content.word}</span>
                                          <span className="text-xs text-muted-foreground truncate">{card.content.meaning}</span>
                                          {card.content.cefr && (
                                            <span className="text-[10px] bg-brand-light text-brand px-1.5 py-0.5 rounded font-semibold">{card.content.cefr}</span>
                                          )}
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                                            onClick={() => openEditWord(deck.id, card)}>
                                            <Pencil className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"
                                            onClick={() => {
                                              if (confirm("Xóa từ này?"))
                                                deleteWord.mutate({ deckId: deck.id, tabIndex: card._tabIndex, wordIndex: wi });
                                            }}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {decks.length === 0 && !isLoading && (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có bộ đề nào. Nhấn "Tạo bộ đề" để bắt đầu.</p>
            </div>
          )}
        </div>
      )}

      {/* ════ Dialog: Tạo/Sửa Deck ════ */}
      <Dialog open={showDeckDlg} onOpenChange={setShowDeckDlg}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingDeck ? "Sửa bộ đề" : "Tạo bộ đề mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tên bộ đề *</Label>
              <Input value={deckForm.title} onChange={e => setDeckForm({ ...deckForm, title: e.target.value })} className="mt-1" />
            </div>
            <div><Label>Mô tả</Label>
              <Textarea value={deckForm.description} onChange={e => setDeckForm({ ...deckForm, description: e.target.value })} className="mt-1" />
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-xl border border-[#f0e0e7]">
              <div>
                <p className="font-semibold text-sm text-[#1a1a2e]">Công khai (Public)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {deckForm.is_public ? "✅ Mọi user đã đăng nhập đều học được full" : "🔒 Chỉ user được cấp quyền mới học được"}
                </p>
              </div>
              <Switch
                checked={deckForm.is_public}
                onCheckedChange={v => setDeckForm({ ...deckForm, is_public: v })}
              />
            </div>
            <div>
              <Label>Cấp độ CEFR (0–2 mức)</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Từ</p>
                  <Select value={deckForm.level_min || "__none__"} onValueChange={v => setDeckForm({ ...deckForm, level_min: v === "__none__" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Không chọn" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Không</SelectItem>
                      {CEFR_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Đến</p>
                  <Select value={deckForm.level_max || "__none__"} onValueChange={v => setDeckForm({ ...deckForm, level_max: v === "__none__" ? "" : v })}>
                    <SelectTrigger><SelectValue placeholder="Không chọn" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Không</SelectItem>
                      {CEFR_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(deckForm.level_min || deckForm.level_max) && (
                <p className="text-xs text-brand font-semibold mt-1">
                  Hiển thị: {deckForm.level_min && deckForm.level_max && deckForm.level_min !== deckForm.level_max
                    ? `${deckForm.level_min} - ${deckForm.level_max}`
                    : (deckForm.level_min || deckForm.level_max)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeckDlg(false)}>Hủy</Button>
            <Button variant="brand" disabled={saveDeck.isPending || !deckForm.title} onClick={() => saveDeck.mutate()}>
              {saveDeck.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Thêm Tab ════ */}
      <Dialog open={!!showTabDlg} onOpenChange={() => setShowTabDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm Tab / Unit mới</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>ID (ví dụ: de1, unit-1)</Label>
              <Input value={tabForm.id} placeholder="de1" onChange={e => setTabForm({ ...tabForm, id: e.target.value })} className="mt-1" />
            </div>
            <div><Label>Tên Tab *</Label>
              <Input value={tabForm.label} placeholder="Đề 1 — Academic Vocabulary" onChange={e => setTabForm({ ...tabForm, label: e.target.value })} className="mt-1" />
            </div>
            <div><Label>Mô tả</Label>
              <Input value={tabForm.desc} placeholder="Mô tả ngắn" onChange={e => setTabForm({ ...tabForm, desc: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTabDlg(null)}>Hủy</Button>
            <Button variant="brand" disabled={saveTab.isPending || !tabForm.label} onClick={() => showTabDlg && saveTab.mutate(showTabDlg)}>
              {saveTab.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Thêm Tab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Import nhiều tabs (Bulk) ════ */}
      <Dialog open={!!showBulkTabsDlg} onOpenChange={() => { setShowBulkTabsDlg(null); setBulkTabsText(""); setBulkTabsFile(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📥 Import JSON — Nhiều Tabs / Units</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Format hướng dẫn */}
            <div className="bg-[#f8f9fa] rounded-xl p-4 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-[#1a1a2e]">📋 Format JSON hỗ trợ:</p>
              <p>✅ <strong>Array nhiều tabs:</strong> <code>{"[ {id, label, desc, vocabulary:[...]}, ... ]"}</code></p>
              <p>✅ <strong>Object wrapper:</strong> <code>{'{ "tabs": [ {...}, {...} ] }'}</code></p>
              <p>✅ <strong>1 tab duy nhất:</strong> <code>{'{ "id":"de1", "label":"Đề 1", "vocabulary":[...] }'}</code></p>
              <p className="text-[#ed0046]">⚠️ Mỗi vocabulary item cần có <code>word</code> và <code>meaning</code>.</p>
            </div>

            {/* Chọn cách import */}
            <div className="flex gap-2">
              <button
                onClick={() => setBulkTabsMode("file")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${bulkTabsMode === "file" ? "border-brand bg-brand-light text-brand" : "border-[#f0e0e7] text-muted-foreground"}`}>
                📁 Upload file .json
              </button>
              <button
                onClick={() => setBulkTabsMode("paste")}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${bulkTabsMode === "paste" ? "border-brand bg-brand-light text-brand" : "border-[#f0e0e7] text-muted-foreground"}`}>
                📋 Dán JSON trực tiếp
              </button>
            </div>

            {bulkTabsMode === "file" ? (
              <div>
                <Label>Chọn file JSON</Label>
                <div className="mt-1 border-2 border-dashed border-[#f0e0e7] rounded-xl p-6 text-center hover:border-brand transition-colors">
                  <input type="file" accept=".json" id="bulk-json-file"
                    className="hidden"
                    onChange={e => setBulkTabsFile(e.target.files?.[0] ?? null)} />
                  <label htmlFor="bulk-json-file" className="cursor-pointer">
                    <FileJson className="w-10 h-10 mx-auto mb-2 text-brand opacity-60" />
                    {bulkTabsFile ? (
                      <p className="font-semibold text-brand">{bulkTabsFile.name}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nhấn để chọn file .json</p>
                    )}
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <Label>Dán JSON vào đây</Label>
                <Textarea
                  value={bulkTabsText}
                  onChange={e => setBulkTabsText(e.target.value)}
                  placeholder={'[\n  {\n    "id": "de1",\n    "label": "Đề 1",\n    "desc": "Mô tả",\n    "vocabulary": [\n      { "word": "...", "meaning": "..." }\n    ]\n  }\n]'}
                  className="mt-1 font-mono text-xs min-h-[200px]"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowBulkTabsDlg(null); setBulkTabsText(""); setBulkTabsFile(null); }}>
              Hủy
            </Button>
            <Button variant="brand"
              disabled={bulkTabsMode === "file" ? !bulkTabsFile : !bulkTabsText.trim()}
              onClick={() => showBulkTabsDlg && handleBulkTabsImport(showBulkTabsDlg)}>
              <Upload className="w-4 h-4" /> Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Sửa Tab ════ */}
      <Dialog open={!!showEditTabDlg} onOpenChange={() => setShowEditTabDlg(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>✏️ Sửa Tab / Unit</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>ID</Label>
              <Input value={editTabForm.id} onChange={e => setEditTabForm({ ...editTabForm, id: e.target.value })} className="mt-1" placeholder="de1" />
            </div>
            <div><Label>Tên Tab *</Label>
              <Input value={editTabForm.label} onChange={e => setEditTabForm({ ...editTabForm, label: e.target.value })} className="mt-1" placeholder="Đề 1" />
            </div>
            <div><Label>Mô tả</Label>
              <Textarea value={editTabForm.desc} onChange={e => setEditTabForm({ ...editTabForm, desc: e.target.value })} className="mt-1" rows={3} placeholder="Mô tả nội dung tab này..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTabDlg(null)}>Hủy</Button>
            <Button variant="brand"
              disabled={saveTabEdit.isPending || !editTabForm.label}
              onClick={() => showEditTabDlg && saveTabEdit.mutate(showEditTabDlg)}>
              {saveTabEdit.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Thêm/Sửa từ vựng ════ */}
      <Dialog open={!!showWordDlg} onOpenChange={() => { setShowWordDlg(null); setEditingWord(null); }}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWord ? "Sửa từ vựng" : "Thêm từ vựng"}
              {showWordDlg && deckDetail[showWordDlg.deckId] && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  → {deckDetail[showWordDlg.deckId].tabs[showWordDlg.tabIndex]?.label ?? `Tab ${showWordDlg.tabIndex + 1}`}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Từ *</Label>
              <Input value={wordForm.word} onChange={e => setWordForm({ ...wordForm, word: e.target.value })} className="mt-1" placeholder="phenomenon" />
            </div>
            <div>
              <Label>Phiên âm</Label>
              <Input value={wordForm.phonetic} onChange={e => setWordForm({ ...wordForm, phonetic: e.target.value })} className="mt-1" placeholder="/fəˈnɒmɪnən/" />
            </div>
            <div>
              <Label>Loại từ</Label>
              <Select value={wordForm.type} onValueChange={v => setWordForm({ ...wordForm, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WORD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Nghĩa *</Label>
              <Input value={wordForm.meaning} onChange={e => setWordForm({ ...wordForm, meaning: e.target.value })} className="mt-1" placeholder="hiện tượng" />
            </div>
            <div className="col-span-2">
              <Label>Ví dụ</Label>
              <Textarea value={wordForm.example} onChange={e => setWordForm({ ...wordForm, example: e.target.value })} className="mt-1" rows={2} />
            </div>
            <div className="col-span-2">
              <Label>Dịch ví dụ</Label>
              <Textarea value={wordForm.translation} onChange={e => setWordForm({ ...wordForm, translation: e.target.value })} className="mt-1" rows={2} />
            </div>
            <div>
              <Label>Đồng nghĩa (phẩy)</Label>
              <Input value={wordForm.synonyms} onChange={e => setWordForm({ ...wordForm, synonyms: e.target.value })} className="mt-1" placeholder="occurrence, event" />
            </div>
            <div>
              <Label>Trái nghĩa (phẩy)</Label>
              <Input value={wordForm.antonyms} onChange={e => setWordForm({ ...wordForm, antonyms: e.target.value })} className="mt-1" />
            </div>
            <div className="col-span-2">
              <Label>CEFR</Label>
              <Select value={wordForm.cefr} onValueChange={v => setWordForm({ ...wordForm, cefr: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["A1","A2","B1","B2","C1","C2"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowWordDlg(null); setEditingWord(null); }}>Hủy</Button>
            <Button variant="brand"
              disabled={saveWord.isPending || !wordForm.word || !wordForm.meaning}
              onClick={() => {
                if (!showWordDlg) return;
                const wordIndex = editingWord
                  ? deckDetail[showWordDlg.deckId]?.cards
                      .filter(c => c._tabIndex === showWordDlg.tabIndex)
                      .indexOf(editingWord)
                  : undefined;
                saveWord.mutate({
                  deckId: showWordDlg.deckId,
                  tabIndex: showWordDlg.tabIndex,
                  wordIndex: wordIndex !== undefined && wordIndex >= 0 ? wordIndex : undefined,
                });
              }}>
              {saveWord.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu từ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
