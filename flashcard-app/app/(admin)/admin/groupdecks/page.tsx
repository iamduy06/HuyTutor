"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight,
  Loader2, FolderPlus, BookOpen, MoreVertical,
  ArrowRightLeft, FileJson, Upload
} from "lucide-react";
import { CEFR_LEVELS } from "@/types";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import type { Deck, DeckGroup } from "@/types";

// ─── API ──────────────────────────────────────────────────────────────────────
async function fetchAdminDecks(): Promise<Deck[]> {
  const res = await fetch("/api/admin/decks");
  return (await res.json()).decks ?? [];
}

async function fetchDeckGroups(): Promise<DeckGroup[]> {
  const res = await fetch("/api/admin/deck-groups");
  const data = await res.json();
  return data.groups ?? [];
}

export default function GroupDecksPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: decks = [], isLoading: decksLoading } = useQuery({
    queryKey: ["admin-decks"], queryFn: fetchAdminDecks,
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["admin-deck-groups"], queryFn: fetchDeckGroups,
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "none": true });

  // ── Dialogs ──
  const [showGroupDlg, setShowGroupDlg] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DeckGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: "", description: "" });

  const [showMoveDlg, setShowMoveDlg] = useState<{ deckId: string; currentGroupId: string | null } | null>(null);
  const [moveGroupId, setMoveGroupId] = useState<string>("__none__");

  const [showDeckDlg, setShowDeckDlg] = useState(false);
  const [showBulkTabsDlg, setShowBulkTabsDlg] = useState<string | null>(null); // deckId
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);

  const [deckForm, setDeckForm] = useState({
    title: "",
    description: "",
    level_min: "",
    level_max: "",
    access_level: {
      public: false,
      auth: false,
      paid: true,
      preview: false,
      preview_word_limit: 10
    },
    group_id: "" as string
  });

  const [bulkTabsText, setBulkTabsText] = useState("");
  const [bulkTabsFile, setBulkTabsFile] = useState<File | null>(null);
  const [bulkTabsMode, setBulkTabsMode] = useState<"file" | "paste">("file");

  // ── Group CRUD ─────────────────────────────────────────────────────────────
  const saveGroup = useMutation({
    mutationFn: async () => {
      const url = editingGroup ? `/api/admin/deck-groups/${editingGroup.id}` : "/api/admin/deck-groups";
      const method = editingGroup ? "PATCH" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(groupForm),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-deck-groups"] });
      setShowGroupDlg(false); setEditingGroup(null);
      toast({ title: editingGroup ? "Cập nhật Nhóm thành công" : "Tạo Nhóm thành công" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/deck-groups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ["admin-deck-groups"] });
      qc.invalidateQueries({ queryKey: ["admin-decks"] });
      toast({ title: "Đã xóa Nhóm" }); 
    },
  });

  // ── Deck Group Assignment ──────────────────────────────────────────────────
  const moveDeck = useMutation({
    mutationFn: async ({ deckId, groupId }: { deckId: string; groupId: string | null }) => {
      const res = await fetch(`/api/admin/decks/${deckId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group_id: groupId }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-decks"] });
      setShowMoveDlg(null);
      toast({ title: "Đã chuyển bộ đề" });
    },
  });

  const saveDeck = useMutation({
    mutationFn: async () => {
      const url = editingDeck ? `/api/admin/decks/${editingDeck.id}` : "/api/admin/decks";
      const method = editingDeck ? "PUT" : "POST";
      const payload = {
        title: deckForm.title,
        description: deckForm.description,
        level_min: deckForm.level_min || null,
        level_max: deckForm.level_max || null,
        access_level: deckForm.access_level,
        preview_word_limit: (deckForm.access_level as any).preview ? deckForm.preview_word_limit : null,
        group_id: deckForm.group_id || null,
      };
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-decks"] });
      setShowDeckDlg(false); setEditingDeck(null);
      toast({ title: editingDeck ? "Cập nhật Flashcard thành công" : "Tạo Flashcard thành công" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteDeck = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/decks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-decks"] }); toast({ title: "Đã xóa Flashcard" }); },
  });

  async function handleBulkTabsImport(deckId: string) {
    let jsonStr = bulkTabsText.trim();
    if (bulkTabsMode === "file" && bulkTabsFile) {
      jsonStr = await bulkTabsFile.text();
    }
    if (!jsonStr) {
      toast({ title: "Chưa có dữ liệu JSON", variant: "destructive" }); return;
    }
    let parsed: any;
    try { parsed = JSON.parse(jsonStr); }
    catch { toast({ title: "JSON không hợp lệ", variant: "destructive" }); return; }

    const res = await fetch(`/api/admin/decks/${deckId}/tabs`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const data = await res.json();
    if (res.ok) {
      toast({ title: `✅ Import thành công ${data.tabsAdded} tab(s)` });
      qc.invalidateQueries({ queryKey: ["admin-decks"] });
      setShowBulkTabsDlg(null);
    } else {
      toast({ title: data.error ?? "Import thất bại", variant: "destructive" });
    }
  }

  // ── Helpers ──
  function toggleGroup(id: string) {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function openCreateGroup() {
    setEditingGroup(null);
    setGroupForm({ name: "", description: "" });
    setShowGroupDlg(true);
  }

  function openEditGroup(group: DeckGroup) {
    setEditingGroup(group);
    setGroupForm({ name: group.name, description: group.description ?? "" });
    setShowGroupDlg(true);
  }

  function openEditDeck(deck: Deck) {
    setEditingDeck(deck);
    
    let al = deck.access_level as any;
    // Migration helper: if it's still a string in old data
    if (typeof al === "string") {
      al = {
        public: al === "public",
        authenticated: al === "authenticated",
        authorized: al === "authorized" || al === "preview",
        preview: al === "preview"
      };
    }

    setDeckForm({
      title: deck.title,
      description: deck.description ?? "",
      level_min: deck.level_min ?? "",
      level_max: deck.level_max ?? "",
      access_level: al,
      group_id: deck.group_id ?? ""
    });
    setShowDeckDlg(true);
  }

  function openBulkImport(deckId: string) {
    setBulkTabsText(""); setBulkTabsFile(null); setBulkTabsMode("file");
    setShowBulkTabsDlg(deckId);
  }

  const groupedDecks = groups.reduce((acc, group) => {
    acc[group.id] = decks.filter(d => d.group_id === group.id);
    return acc;
  }, {} as Record<string, Deck[]>);

  const uncategorizedDecks = decks.filter(d => !d.group_id);

  if (decksLoading || groupsLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-[#1a1a2e]">🏷️ Nhóm Bộ Đề</h1>
        <Button variant="brand" onClick={openCreateGroup}><FolderPlus className="w-4 h-4" /> Tạo Nhóm Mới</Button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Render Groups */}
        {groups.map(group => (
          <div key={group.id} className="bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-[#f8f9fa]">
              <div className="flex items-center gap-3">
                <button onClick={() => toggleGroup(group.id)} className="text-muted-foreground hover:text-brand transition-colors">
                  {expandedGroups[group.id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                <div>
                  <h3 className="font-bold text-[#1a1a2e]">{group.name}</h3>
                  {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                </div>
                <span className="text-xs bg-brand-light text-brand px-2 py-0.5 rounded-full font-semibold">
                  {groupedDecks[group.id]?.length ?? 0} bộ đề
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="w-4 h-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEditGroup(group)}>
                    <Pencil className="w-4 h-4 mr-2" /> Sửa Tên / Mô tả
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-500"
                    onClick={() => { if(confirm("Xóa nhóm này? Các bộ đề bên trong sẽ được chuyển về nhóm 'Chưa phân loại'.")) deleteGroup.mutate(group.id); }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Xóa nhóm
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {expandedGroups[group.id] && (
              <div className="p-2 divide-y divide-[#f0e0e7]">
                {groupedDecks[group.id]?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nhóm này chưa có bộ đề nào.</p>
                ) : (
                  groupedDecks[group.id]?.map(deck => (
                    <DeckRow 
                      key={deck.id} 
                      deck={deck} 
                      onMove={() => {
                        setMoveGroupId(deck.group_id ?? "__none__");
                        setShowMoveDlg({ deckId: deck.id, currentGroupId: deck.group_id ?? null });
                      }}
                      onEdit={() => openEditDeck(deck)}
                      onDelete={() => { if (confirm("Xóa bộ Flashcard này?")) deleteDeck.mutate(deck.id); }}
                      onImport={() => openBulkImport(deck.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}

        {/* Uncategorized Section */}
        <div className="bg-white rounded-2xl border-2 border-dashed border-[#f0e0e7] overflow-hidden">
          <div className="flex items-center gap-3 p-4 bg-gray-50/50">
            <button onClick={() => toggleGroup("none")} className="text-muted-foreground hover:text-brand transition-colors">
              {expandedGroups["none"] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            <h3 className="font-bold text-[#6b7280]">📦 Chưa phân loại</h3>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-semibold">
              {uncategorizedDecks.length} bộ đề
            </span>
          </div>
          {expandedGroups["none"] && (
            <div className="p-2 divide-y divide-[#f0e0e7]">
              {uncategorizedDecks.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Tất cả bộ đề đều đã được phân loại.</p>
              ) : (
                uncategorizedDecks.map(deck => (
                  <DeckRow 
                  key={deck.id} 
                  deck={deck} 
                  onMove={() => {
                    setMoveGroupId("__none__");
                    setShowMoveDlg({ deckId: deck.id, currentGroupId: null });
                  }} 
                  onEdit={() => openEditDeck(deck)}
                  onDelete={() => { if (confirm("Xóa bộ Flashcard này?")) deleteDeck.mutate(deck.id); }}
                  onImport={() => openBulkImport(deck.id)}
                />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ════ Dialog: Tạo/Sửa Nhóm ════ */}
      <Dialog open={showGroupDlg} onOpenChange={setShowGroupDlg}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingGroup ? "Sửa Nhóm" : "Tạo Nhóm Mới"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Tên Nhóm *</Label>
              <Input value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} className="mt-1" placeholder="Ví dụ: Đề thi thử THPT Quốc Gia" />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Textarea value={groupForm.description} onChange={e => setGroupForm({ ...groupForm, description: e.target.value })} className="mt-1" placeholder="Nhóm này chứa các bộ đề ôn luyện..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupDlg(false)}>Hủy</Button>
            <Button variant="brand" disabled={saveGroup.isPending || !groupForm.name} onClick={() => saveGroup.mutate()}>
              {saveGroup.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Chuyển Nhóm ════ */}
      <Dialog open={!!showMoveDlg} onOpenChange={() => setShowMoveDlg(null)}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Chuyển vào Nhóm</DialogTitle></DialogHeader>
          <div className="py-4">
            <Select value={moveGroupId} onValueChange={setMoveGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhóm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">📦 Chưa phân loại</SelectItem>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDlg(null)}>Hủy</Button>
            <Button variant="brand" 
              disabled={moveDeck.isPending} 
              onClick={() => showMoveDlg && moveDeck.mutate({ deckId: showMoveDlg.deckId, groupId: moveGroupId === "__none__" ? null : moveGroupId })}
            >
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Sửa Deck ════ */}
      <Dialog open={showDeckDlg} onOpenChange={setShowDeckDlg}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Sửa Flashcard</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Tên Flashcard *</Label>
              <Input value={deckForm.title} onChange={e => setDeckForm({ ...deckForm, title: e.target.value })} className="mt-1" />
            </div>
            <div><Label>Mô tả</Label>
              <Textarea value={deckForm.description} onChange={e => setDeckForm({ ...deckForm, description: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Nhóm bộ đề</Label>
              <Select value={deckForm.group_id || "__none__"} onValueChange={v => setDeckForm({ ...deckForm, group_id: v === "__none__" ? "" : v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Không phân loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Không phân loại</SelectItem>
                  {groups.map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4 p-4 bg-[#f8f9fa] rounded-xl border border-[#f0e0e7]">
              <div>
                <Label className="text-[#1a1a2e] font-bold block mb-3">Quyền truy cập</Label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-brand"
                      checked={(deckForm.access_level as any).public}
                      onChange={e => setDeckForm({ ...deckForm, access_level: { ...deckForm.access_level as any, public: e.target.checked } })}
                    />
                    <span className="text-sm font-medium">🌐 Public</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-brand"
                      checked={(deckForm.access_level as any).auth}
                      onChange={e => setDeckForm({ ...deckForm, access_level: { ...deckForm.access_level as any, auth: e.target.checked } })}
                    />
                    <span className="text-sm font-medium">🔑 Auth</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-brand"
                      checked={(deckForm.access_level as any).paid}
                      onChange={e => setDeckForm({ ...deckForm, access_level: { ...deckForm.access_level as any, paid: e.target.checked } })}
                    />
                    <span className="text-sm font-medium">💰 Paid</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 accent-brand"
                      checked={(deckForm.access_level as any).preview}
                      onChange={e => setDeckForm({ ...deckForm, access_level: { ...deckForm.access_level as any, preview: e.target.checked } })}
                    />
                    <span className="text-sm font-medium">👁️ Preview</span>
                  </label>
                </div>
              </div>
              {(deckForm.access_level as any).preview && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <Label>Giới hạn từ xem trước</Label>
                  <Input type="number" value={deckForm.preview_word_limit} onChange={e => setDeckForm({ ...deckForm, preview_word_limit: parseInt(e.target.value) || 1 })} className="mt-1 bg-white" />
                </div>
              )}
            </div>
            <div>
              <Label>Cấp độ CEFR</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Select value={deckForm.level_min || "__none__"} onValueChange={v => setDeckForm({ ...deckForm, level_min: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Từ" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không</SelectItem>
                    {CEFR_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={deckForm.level_max || "__none__"} onValueChange={v => setDeckForm({ ...deckForm, level_max: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Đến" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không</SelectItem>
                    {CEFR_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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

      {/* ════ Dialog: Import JSON ════ */}
      <Dialog open={!!showBulkTabsDlg} onOpenChange={() => setShowBulkTabsDlg(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Import JSON (Nhiều Tabs)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={bulkTabsMode === "file" ? "brand" : "outline"} className="flex-1" onClick={() => setBulkTabsMode("file")}>File</Button>
              <Button variant={bulkTabsMode === "paste" ? "brand" : "outline"} className="flex-1" onClick={() => setBulkTabsMode("paste")}>Dán mã</Button>
            </div>
            {bulkTabsMode === "file" ? (
              <Input type="file" accept=".json" onChange={e => setBulkTabsFile(e.target.files?.[0] ?? null)} />
            ) : (
              <Textarea value={bulkTabsText} onChange={e => setBulkTabsText(e.target.value)} placeholder="Dán JSON vào đây..." className="min-h-[200px]" />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkTabsDlg(null)}>Hủy</Button>
            <Button variant="brand" onClick={() => showBulkTabsDlg && handleBulkTabsImport(showBulkTabsDlg)}>Import</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeckRow({ deck, onMove, onEdit, onDelete, onImport }: { 
  deck: Deck; 
  onMove: () => void; 
  onEdit: () => void;
  onDelete: () => void;
  onImport: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-3 hover:bg-[#f8f9fa] transition-colors">
      <div className="flex items-center gap-3">
        <BookOpen className="w-4 h-4 text-brand/60" />
        <div>
          <span className="font-semibold text-sm text-[#1a1a2e]">{deck.title}</span>
          <div className="flex gap-1 items-center mt-1 flex-wrap">
            <span className="text-[10px] text-muted-foreground mr-1">{deck.word_count ?? 0} từ</span>
            {(deck.access_level as any).public && <span className="text-[8px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-bold">🌐 PUBLIC</span>}
            {(deck.access_level as any).auth && <span className="text-[8px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold">🔑 AUTH</span>}
            {(deck.access_level as any).paid && <span className="text-[8px] bg-red-100 text-red-700 px-1 py-0.5 rounded font-bold">💰 PAID</span>}
            {(deck.access_level as any).preview && <span className="text-[8px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-bold">👁️ PREVIEW</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 font-sans">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Chuyển nhóm" onClick={onMove}>
           <ArrowRightLeft className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Import JSON" onClick={onImport}>
           <FileJson className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" title="Sửa" onClick={onEdit}>
           <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500" title="Xóa" onClick={onDelete}>
           <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
