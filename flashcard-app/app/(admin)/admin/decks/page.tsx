"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DECK_LEVELS } from "@/lib/constants";
import type { Deck } from "@/types";

async function fetchAdminDecks() {
  const res = await fetch("/api/admin/decks");
  const data = await res.json();
  return data.decks ?? [];
}

export default function AdminDecksPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);
  const [deckCards, setDeckCards] = useState<Record<string, any[]>>({});
  const [showDeckDialog, setShowDeckDialog] = useState(false);
  const [showCardDialog, setShowCardDialog] = useState<string | null>(null);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [deckForm, setDeckForm] = useState({ title: "", description: "", level: "" });
  const [cardForm, setCardForm] = useState({
    word: "", phonetic: "", meaning: "", type: "Noun",
    example: "", translation: "", synonyms: "", antonyms: "", cefr: "B1",
  });

  const { data: decks = [], isLoading } = useQuery({ queryKey: ["admin-decks"], queryFn: fetchAdminDecks });

  const saveDeck = useMutation({
    mutationFn: async () => {
      const url = editingDeck ? `/api/admin/decks/${editingDeck.id}` : "/api/admin/decks";
      const method = editingDeck ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(deckForm) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-decks"] });
      setShowDeckDialog(false);
      setEditingDeck(null);
      toast({ title: editingDeck ? "Cập nhật thành công" : "Tạo bộ đề thành công" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const deleteDeck = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/decks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-decks"] }); toast({ title: "Đã xóa bộ đề" }); },
  });

  const saveCard = useMutation({
    mutationFn: async ({ deckId, cardId }: { deckId: string; cardId?: string }) => {
      const content = {
        ...cardForm,
        synonyms: cardForm.synonyms.split(",").map((s) => s.trim()).filter(Boolean),
        antonyms: cardForm.antonyms.split(",").map((s) => s.trim()).filter(Boolean),
      };
      const url = cardId
        ? `/api/admin/decks/${deckId}/cards/${cardId}`
        : `/api/admin/decks/${deckId}/cards`;
      const method = cardId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(content) });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_, vars) => {
      loadDeckCards(vars.deckId);
      setShowCardDialog(null);
      setEditingCard(null);
      toast({ title: "Đã lưu flashcard" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const deleteCard = useMutation({
    mutationFn: async ({ deckId, cardId }: { deckId: string; cardId: string }) => {
      await fetch(`/api/admin/decks/${deckId}/cards/${cardId}`, { method: "DELETE" });
    },
    onSuccess: (_, vars) => { loadDeckCards(vars.deckId); toast({ title: "Đã xóa flashcard" }); },
  });

  async function loadDeckCards(deckId: string) {
    const res = await fetch(`/api/admin/decks/${deckId}`);
    const data = await res.json();
    setDeckCards((prev) => ({ ...prev, [deckId]: data.cards ?? [] }));
  }

  async function handleJsonUpload(deckId: string) {
    if (!jsonFile) return;
    const text = await jsonFile.text();
    const cards = JSON.parse(text);
    const res = await fetch(`/api/admin/decks/${deckId}/cards`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards: Array.isArray(cards) ? cards : [cards] }),
    });
    if (res.ok) {
      toast({ title: "Import JSON thành công!" });
      loadDeckCards(deckId);
      setJsonFile(null);
    }
  }

  function openCreateDeck() {
    setEditingDeck(null);
    setDeckForm({ title: "", description: "", level: "" });
    setShowDeckDialog(true);
  }

  function openEditDeck(deck: Deck) {
    setEditingDeck(deck);
    setDeckForm({ title: deck.title, description: deck.description ?? "", level: deck.level ?? "" });
    setShowDeckDialog(true);
  }

  function openCreateCard(deckId: string) {
    setEditingCard(null);
    setCardForm({ word: "", phonetic: "", meaning: "", type: "Noun", example: "", translation: "", synonyms: "", antonyms: "", cefr: "B1" });
    setShowCardDialog(deckId);
  }

  function openEditCard(deckId: string, card: any) {
    setEditingCard(card);
    const c = card.content;
    setCardForm({
      word: c.word, phonetic: c.phonetic, meaning: c.meaning, type: c.type,
      example: c.example, translation: c.translation,
      synonyms: Array.isArray(c.synonyms) ? c.synonyms.join(", ") : c.synonyms,
      antonyms: Array.isArray(c.antonyms) ? c.antonyms.join(", ") : c.antonyms,
      cefr: c.cefr,
    });
    setShowCardDialog(deckId);
  }

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
          {(decks as Deck[]).map((deck) => (
            <div key={deck.id} className="bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden">
              {/* Deck header */}
              <div className="flex items-center gap-3 p-4">
                <button
                  onClick={() => {
                    if (expandedDeck === deck.id) { setExpandedDeck(null); }
                    else { setExpandedDeck(deck.id); if (!deckCards[deck.id]) loadDeckCards(deck.id); }
                  }}
                  className="text-muted-foreground hover:text-brand transition-colors"
                >
                  {expandedDeck === deck.id ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#1a1a2e]">{deck.title}</span>
                    {deck.level && <span className="text-xs bg-brand-light text-brand px-2 py-0.5 rounded-full font-semibold">{deck.level}</span>}
                    <span className="text-xs text-muted-foreground">({(deck as any).flashcard_count ?? 0} từ)</span>
                  </div>
                  {deck.description && <p className="text-sm text-muted-foreground mt-0.5 truncate">{deck.description}</p>}
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => openEditDeck(deck)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 px-2 text-red-500"
                    onClick={() => { if (confirm("Xóa bộ đề này?")) deleteDeck.mutate(deck.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Cards list */}
              {expandedDeck === deck.id && (
                <div className="border-t-2 border-[#f0e0e7] p-4">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <span className="font-semibold text-sm text-[#1a1a2e]">Flashcards</span>
                    <div className="flex gap-2 flex-wrap">
                      <label className="cursor-pointer">
                        <input type="file" accept=".json" className="hidden"
                          onChange={(e) => setJsonFile(e.target.files?.[0] || null)} />
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-[#f0e0e7] text-xs font-semibold hover:border-brand hover:text-brand transition-all cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Import JSON
                        </span>
                      </label>
                      {jsonFile && (
                        <Button size="sm" variant="brand" className="h-7 text-xs" onClick={() => handleJsonUpload(deck.id)}>
                          Upload
                        </Button>
                      )}
                      <Button size="sm" variant="brand" className="h-8 text-xs" onClick={() => openCreateCard(deck.id)}>
                        <Plus className="w-3.5 h-3.5" /> Thêm từ
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                    {(deckCards[deck.id] ?? []).map((card) => (
                      <div key={card.id} className="flex items-center gap-3 p-2.5 bg-[#f8f9fa] rounded-xl border border-[#f0e0e7]">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-sm text-[#1a1a2e]">{card.content.word}</span>
                          <span className="text-xs text-muted-foreground ml-2">{card.content.meaning}</span>
                          {card.content.cefr && (
                            <span className="ml-2 text-xs bg-brand-light text-brand px-1.5 py-0.5 rounded font-semibold">{card.content.cefr}</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditCard(deck.id, card)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500"
                            onClick={() => { if (confirm("Xóa từ này?")) deleteCard.mutate({ deckId: deck.id, cardId: card.id }); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(deckCards[deck.id] ?? []).length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">Chưa có từ nào</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Deck dialog */}
      <Dialog open={showDeckDialog} onOpenChange={setShowDeckDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingDeck ? "Sửa bộ đề" : "Tạo bộ đề mới"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tên bộ đề *</Label><Input value={deckForm.title} onChange={(e) => setDeckForm({ ...deckForm, title: e.target.value })} className="mt-1" /></div>
            <div><Label>Mô tả</Label><Textarea value={deckForm.description} onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })} className="mt-1" /></div>
            <div>
              <Label>Cấp độ</Label>
              <Select value={deckForm.level} onValueChange={(v) => setDeckForm({ ...deckForm, level: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn cấp độ" /></SelectTrigger>
                <SelectContent>{DECK_LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeckDialog(false)}>Hủy</Button>
            <Button variant="brand" onClick={() => saveDeck.mutate()} disabled={saveDeck.isPending || !deckForm.title}>
              {saveDeck.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Card dialog */}
      <Dialog open={!!showCardDialog} onOpenChange={() => { setShowCardDialog(null); setEditingCard(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingCard ? "Sửa flashcard" : "Thêm flashcard"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Từ *</Label><Input value={cardForm.word} onChange={(e) => setCardForm({ ...cardForm, word: e.target.value })} className="mt-1" /></div>
            <div><Label>Phiên âm</Label><Input value={cardForm.phonetic} onChange={(e) => setCardForm({ ...cardForm, phonetic: e.target.value })} className="mt-1" placeholder="/ˈwɜːrd/" /></div>
            <div>
              <Label>Loại từ</Label>
              <Select value={cardForm.type} onValueChange={(v) => setCardForm({ ...cardForm, type: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Noun", "Verb", "Adjective", "Adverb", "Phrase"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>Nghĩa *</Label><Input value={cardForm.meaning} onChange={(e) => setCardForm({ ...cardForm, meaning: e.target.value })} className="mt-1" /></div>
            <div className="col-span-2"><Label>Ví dụ</Label><Textarea value={cardForm.example} onChange={(e) => setCardForm({ ...cardForm, example: e.target.value })} className="mt-1" rows={2} /></div>
            <div className="col-span-2"><Label>Dịch ví dụ</Label><Textarea value={cardForm.translation} onChange={(e) => setCardForm({ ...cardForm, translation: e.target.value })} className="mt-1" rows={2} /></div>
            <div><Label>Đồng nghĩa (dấu phẩy)</Label><Input value={cardForm.synonyms} onChange={(e) => setCardForm({ ...cardForm, synonyms: e.target.value })} className="mt-1" /></div>
            <div><Label>Trái nghĩa (dấu phẩy)</Label><Input value={cardForm.antonyms} onChange={(e) => setCardForm({ ...cardForm, antonyms: e.target.value })} className="mt-1" /></div>
            <div className="col-span-2">
              <Label>CEFR</Label>
              <Select value={cardForm.cefr} onValueChange={(v) => setCardForm({ ...cardForm, cefr: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{["A1","A2","B1","B2","C1","C2"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCardDialog(null)}>Hủy</Button>
            <Button variant="brand"
              onClick={() => saveCard.mutate({ deckId: showCardDialog!, cardId: editingCard?.id })}
              disabled={saveCard.isPending || !cardForm.word || !cardForm.meaning}>
              {saveCard.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
