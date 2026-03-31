"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Loader2, Upload, FolderPlus, BookOpen, ListPlus
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
import type { Deck, Tab, VocabItem } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatCard {
  _rowId:    string;   // flashcard row id
  _tabIndex: number;   // which tab this word belongs to
  _tabLabel: string;
  content:   VocabItem;
}

interface DeckDetail {
  deck:  Deck;
  tabs:  Tab[];           // normalized tabs
  cards: FlatCard[];      // flattened for display
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchAdminDecks(): Promise<Deck[]> {
  const res = await fetch("/api/admin/decks");
  return (await res.json()).decks ?? [];
}

async function fetchDeckDetail(deckId: string): Promise<DeckDetail> {
  const res  = await fetch(`/api/admin/decks/${deckId}`);
  const data = await res.json();
  return { deck: data.deck, tabs: data.tabs ?? [], cards: data.cards ?? [] };
}

// ─── Word form default ────────────────────────────────────────────────────────

const EMPTY_WORD = {
  word: "", phonetic: "", meaning: "", type: "Noun",
  example: "", translation: "", synonyms: "", antonyms: "", cefr: "B1",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminDecksPage() {
  const qc      = useQueryClient();
  const { toast } = useToast();

  // Decks list
  const { data: decks = [], isLoading } = useQuery({
    queryKey: ["admin-decks"], queryFn: fetchAdminDecks,
  });

  // Which deck is expanded
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);
  const [deckDetail,   setDeckDetail]   = useState<Record<string, DeckDetail>>({});

  // Dialogs
  const [showDeckDlg,  setShowDeckDlg]  = useState(false);
  const [showTabDlg,   setShowTabDlg]   = useState<string | null>(null); // deckId
  const [showWordDlg,  setShowWordDlg]  = useState<{ deckId: string; tabIndex: number } | null>(null);

  // Editing targets
  const [editingDeck,  setEditingDeck]  = useState<Deck | null>(null);
  const [editingWord,  setEditingWord]  = useState<FlatCard | null>(null);

  // Forms
  const [deckForm, setDeckForm] = useState({ title: "", description: "", level: "" });
  const [tabForm,  setTabForm]  = useState({ id: "", label: "", desc: "" });
  const [wordForm, setWordForm] = useState(EMPTY_WORD);

  // JSON file upload
  const [jsonFile, setJsonFile]         = useState<File | null>(null);
  const [jsonTarget, setJsonTarget]     = useState<{ deckId: string; tabIndex: number } | null>(null);

  // ── Load deck detail ────────────────────────────────────────────────────────
  async function loadDetail(deckId: string) {
    const detail = await fetchDeckDetail(deckId);
    setDeckDetail(prev => ({ ...prev, [deckId]: detail }));
  }

  function toggleExpand(deckId: string) {
    if (expandedDeck === deckId) {
      setExpandedDeck(null);
    } else {
      setExpandedDeck(deckId);
      if (!deckDetail[deckId]) loadDetail(deckId);
    }
  }

  // ── Deck CRUD ───────────────────────────────────────────────────────────────
  const saveDeck = useMutation({
    mutationFn: async () => {
      const url    = editingDeck ? `/api/admin/decks/${editingDeck.id}` : "/api/admin/decks";
      const method = editingDeck ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(deckForm) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-decks"] });
      setShowDeckDlg(false); setEditingDeck(null);
      toast({ title: editingDeck ? "Cập nhật bộ đề thành công" : "Tạo bộ đề thành công" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const deleteDeck = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/decks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-decks"] });
      toast({ title: "Đã xóa bộ đề" });
    },
  });

  // ── Tab CRUD ────────────────────────────────────────────────────────────────
  const saveTab = useMutation({
    mutationFn: async (deckId: string) => {
      const res = await fetch(`/api/admin/decks/${deckId}/tabs`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tabForm),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    },
    onSuccess: (_: unknown, deckId: string) => {
      loadDetail(deckId); setShowTabDlg(null);
      toast({ title: "Đã thêm tab/unit mới" });
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

  // ── Word CRUD ───────────────────────────────────────────────────────────────
  const saveWord = useMutation({
    mutationFn: async ({ deckId, tabIndex, wordIndex }: { deckId: string; tabIndex: number; wordIndex?: number }) => {
      const vocabItem = {
        ...wordForm,
        synonyms: wordForm.synonyms.split(",").map(s => s.trim()).filter(Boolean),
        antonyms: wordForm.antonyms.split(",").map(s => s.trim()).filter(Boolean),
      };
      const url    = wordIndex !== undefined
        ? `/api/admin/decks/${deckId}/tabs/${tabIndex}/words/${wordIndex}`
        : `/api/admin/decks/${deckId}/tabs/${tabIndex}/words`;
      const method = wordIndex !== undefined ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(vocabItem) });
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

  // ── JSON bulk import ────────────────────────────────────────────────────────
  async function handleJsonUpload(deckId: string, tabIndex: number) {
    if (!jsonFile) return;
    let parsed: unknown;
    try { parsed = JSON.parse(await jsonFile.text()); }
    catch { toast({ title: "JSON không hợp lệ", variant: "destructive" }); return; }

    const words = Array.isArray(parsed) ? parsed : [parsed];
    const res = await fetch(`/api/admin/decks/${deckId}/tabs/${tabIndex}/words/bulk`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ words }),
    });
    if (res.ok) {
      toast({ title: `Import ${words.length} từ thành công!` });
      loadDetail(deckId); setJsonFile(null); setJsonTarget(null);
    } else {
      toast({ title: "Import thất bại", variant: "destructive" });
    }
  }

  // ── Open helpers ────────────────────────────────────────────────────────────
  function openCreateDeck() {
    setEditingDeck(null); setDeckForm({ title: "", description: "", level: "" }); setShowDeckDlg(true);
  }
  function openEditDeck(deck: Deck) {
    setEditingDeck(deck);
    setDeckForm({ title: deck.title, description: deck.description ?? "", level: deck.level ?? "" });
    setShowDeckDlg(true);
  }
  function openCreateTab(deckId: string) {
    setTabForm({ id: `tab-${Date.now()}`, label: "", desc: "" });
    setShowTabDlg(deckId);
  }
  function openCreateWord(deckId: string, tabIndex: number) {
    setEditingWord(null); setWordForm(EMPTY_WORD);
    setShowWordDlg({ deckId, tabIndex });
  }
  function openEditWord(deckId: string, card: FlatCard) {
    setEditingWord(card);
    const v = card.content;
    setWordForm({
      word:        v.word,
      phonetic:    v.phonetic ?? "",
      meaning:     v.meaning,
      type:        v.type ?? "Noun",
      example:     v.example ?? "",
      translation: v.translation ?? "",
      synonyms:    Array.isArray(v.synonyms) ? v.synonyms.join(", ") : (v.synonyms ?? ""),
      antonyms:    Array.isArray(v.antonyms) ? v.antonyms.join(", ") : (v.antonyms ?? ""),
      cefr:        v.cefr ?? "B1",
    });
    setShowWordDlg({ deckId, tabIndex: card._tabIndex });
  }

  // ── Render ──────────────────────────────────────────────────────────────────
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
                {/* Deck header */}
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => toggleExpand(deck.id)} className="text-muted-foreground hover:text-brand transition-colors">
                    {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#1a1a2e]">{deck.title}</span>
                      {deck.level && <span className="text-xs bg-brand-light text-brand px-2 py-0.5 rounded-full font-semibold">{deck.level}</span>}
                      <span className="text-xs text-muted-foreground">({deck.word_count ?? 0} từ)</span>
                    </div>
                    {deck.description && <p className="text-sm text-muted-foreground mt-0.5 truncate">{deck.description}</p>}
                  </div>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openEditDeck(deck)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-2 text-red-500"
                      onClick={() => { if (confirm("Xóa bộ đề này và tất cả flashcard?")) deleteDeck.mutate(deck.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded content */}
                {expanded && (
                  <div className="border-t-2 border-[#f0e0e7] p-4">
                    {!detail ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
                    ) : (
                      <>
                        {/* Tabs/Units section */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-sm text-[#1a1a2e]">
                            📂 Units / Tabs ({detail.tabs.length})
                          </span>
                          <Button size="sm" variant="brand" className="h-8 text-xs gap-1" onClick={() => openCreateTab(deck.id)}>
                            <FolderPlus className="w-3.5 h-3.5" /> Thêm Tab
                          </Button>
                        </div>

                        {detail.tabs.length === 0 ? (
                          <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-[#f0e0e7] rounded-xl mb-4">
                            Chưa có tab nào. Tạo tab để bắt đầu thêm từ vựng.
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3 mb-4">
                            {detail.tabs.map((tab, tabIdx) => {
                              const tabWords = detail.cards.filter(c => c._tabIndex === tabIdx);
                              return (
                                <div key={tab.id ?? tabIdx} className="border-2 border-[#f0e0e7] rounded-xl overflow-hidden">
                                  {/* Tab header */}
                                  <div className="flex items-center gap-2 p-3 bg-[#f8f9fa]">
                                    <BookOpen className="w-4 h-4 text-brand flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="font-semibold text-sm text-[#1a1a2e]">
                                        {tab.label ?? `Unit ${tabIdx + 1}`}
                                      </span>
                                      {tab.id && <span className="text-xs text-muted-foreground ml-2">id: {tab.id}</span>}
                                      {tab.desc && <p className="text-xs text-muted-foreground truncate">{tab.desc}</p>}
                                    </div>
                                    <span className="text-xs text-muted-foreground">{tabWords.length} từ</span>
                                    <div className="flex gap-1 flex-shrink-0">
                                      {/* JSON bulk import for this tab */}
                                      <label className="cursor-pointer">
                                        <input type="file" accept=".json" className="hidden"
                                          onChange={e => {
                                            setJsonFile(e.target.files?.[0] ?? null);
                                            setJsonTarget({ deckId: deck.id, tabIndex: tabIdx });
                                          }} />
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#f0e0e7] text-xs font-semibold hover:border-brand hover:text-brand transition-all cursor-pointer">
                                          <Upload className="w-3 h-3" /> Import JSON
                                        </span>
                                      </label>
                                      {jsonFile && jsonTarget?.deckId === deck.id && jsonTarget?.tabIndex === tabIdx && (
                                        <Button size="sm" variant="brand" className="h-6 text-xs px-2"
                                          onClick={() => handleJsonUpload(deck.id, tabIdx)}>
                                          Upload
                                        </Button>
                                      )}
                                      <Button size="sm" variant="brand" className="h-7 text-xs gap-1"
                                        onClick={() => openCreateWord(deck.id, tabIdx)}>
                                        <ListPlus className="w-3.5 h-3.5" /> Thêm từ
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
                                  <div className="max-h-64 overflow-y-auto divide-y divide-[#f0e0e7]">
                                    {tabWords.length === 0 ? (
                                      <p className="text-xs text-muted-foreground text-center py-3">Chưa có từ nào trong tab này.</p>
                                    ) : tabWords.map((card, wi) => (
                                      <div key={`${card._rowId}-${wi}`} className="flex items-center gap-2 px-3 py-2 hover:bg-[#f8f9fa]">
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
              <p>Chưa có bộ đề nào.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Dialog: Deck ── */}
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
            <div><Label>Cấp độ</Label>
              <Select value={deckForm.level} onValueChange={v => setDeckForm({ ...deckForm, level: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn cấp độ" /></SelectTrigger>
                <SelectContent>{DECK_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
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

      {/* ── Dialog: Add Tab ── */}
      <Dialog open={!!showTabDlg} onOpenChange={() => setShowTabDlg(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Thêm Tab / Unit mới</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>ID (tùy chọn, ví dụ: unit-1)</Label>
              <Input value={tabForm.id} placeholder="unit-1" onChange={e => setTabForm({ ...tabForm, id: e.target.value })} className="mt-1" />
            </div>
            <div><Label>Tên Tab *</Label>
              <Input value={tabForm.label} placeholder="Unit 1 — Academic Vocabulary" onChange={e => setTabForm({ ...tabForm, label: e.target.value })} className="mt-1" />
            </div>
            <div><Label>Mô tả</Label>
              <Input value={tabForm.desc} placeholder="Mô tả ngắn về unit này" onChange={e => setTabForm({ ...tabForm, desc: e.target.value })} className="mt-1" />
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

      {/* ── Dialog: Add/Edit Word ── */}
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
              <Input value={wordForm.word} onChange={e => setWordForm({ ...wordForm, word: e.target.value })} className="mt-1" placeholder="exacerbate" />
            </div>
            <div>
              <Label>Phiên âm</Label>
              <Input value={wordForm.phonetic} onChange={e => setWordForm({ ...wordForm, phonetic: e.target.value })} className="mt-1" placeholder="/ɪɡˈzæs.ə.beɪt/" />
            </div>
            <div>
              <Label>Loại từ</Label>
              <Select value={wordForm.type} onValueChange={v => setWordForm({ ...wordForm, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Noun","Verb","Adjective","Adverb","Phrase","Expression"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Nghĩa *</Label>
              <Input value={wordForm.meaning} onChange={e => setWordForm({ ...wordForm, meaning: e.target.value })} className="mt-1" placeholder="làm trầm trọng thêm" />
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
              <Label>Đồng nghĩa (cách nhau bằng dấu phẩy)</Label>
              <Input value={wordForm.synonyms} onChange={e => setWordForm({ ...wordForm, synonyms: e.target.value })} className="mt-1" placeholder="aggravate, worsen" />
            </div>
            <div>
              <Label>Trái nghĩa (cách nhau bằng dấu phẩy)</Label>
              <Input value={wordForm.antonyms} onChange={e => setWordForm({ ...wordForm, antonyms: e.target.value })} className="mt-1" placeholder="alleviate, improve" />
            </div>
            <div className="col-span-2">
              <Label>CEFR</Label>
              <Select value={wordForm.cefr} onValueChange={v => setWordForm({ ...wordForm, cefr: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["A1","A2","B1","B2","C1","C2"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
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
                      .findIndex(c => c === editingWord)
                  : undefined;
                saveWord.mutate({ deckId: showWordDlg.deckId, tabIndex: showWordDlg.tabIndex, wordIndex: wordIndex ?? undefined });
              }}>
              {saveWord.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu từ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
