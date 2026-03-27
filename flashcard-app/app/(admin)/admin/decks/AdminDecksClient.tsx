"use client";

import { useState } from "react";
import { Deck } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Plus, Pencil, Trash2, Upload, Loader2 } from "lucide-react";
import { LEVELS } from "@/lib/constants";
import Link from "next/link";

type DeckRow = Deck & { flashcard_count: number };

interface Props { initialDecks: DeckRow[] }

export function AdminDecksClient({ initialDecks }: Props) {
  const [decks, setDecks] = useState(initialDecks);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DeckRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [uploadDeckId, setUploadDeckId] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const { toast } = useToast();

  async function callAdmin(path: string, body: object) {
    const res = await fetch(`/api/admin/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Lỗi");
    return data;
  }

  function openCreate() { setEditing(null); setTitle(""); setDescription(""); setLevel(""); setOpen(true); }
  function openEdit(d: DeckRow) { setEditing(d); setTitle(d.title); setDescription(d.description ?? ""); setLevel(d.level ?? ""); setOpen(true); }

  async function handleSave() {
    if (!title.trim()) return;
    setLoading(true);
    try {
      const data = await callAdmin("decks/save", { id: editing?.id, title, description, level });
      if (editing) {
        setDecks((prev) => prev.map((d) => d.id === editing.id ? { ...d, ...data.deck } : d));
      } else {
        setDecks((prev) => [{ ...data.deck, flashcard_count: 0 }, ...prev]);
      }
      toast({ title: editing ? "✅ Đã cập nhật" : "✅ Đã tạo deck" });
      setOpen(false);
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Thất bại", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function handleDelete(id: string, t: string) {
    if (!confirm(`Xoá deck "${t}"? Toàn bộ flashcard cũng bị xoá.`)) return;
    setLoading(true);
    try {
      await callAdmin("decks/delete", { id });
      setDecks((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "✅ Đã xoá deck" });
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Thất bại", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function handleJSONUpload() {
    if (!jsonFile || !uploadDeckId) return;
    setLoading(true);
    try {
      const text = await jsonFile.text();
      const units = JSON.parse(text);
      await callAdmin("decks/upload-flashcards", { deckId: uploadDeckId, units });
      toast({ title: "✅ Upload thành công" });
      setUploadOpen(false);
      setJsonFile(null);
      // Refresh count
      setDecks((prev) => prev.map((d) =>
        d.id === uploadDeckId ? { ...d, flashcard_count: d.flashcard_count + units.length } : d
      ));
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "JSON không hợp lệ", variant: "destructive" });
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">📚 Quản lý bộ đề</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Upload JSON
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Tạo deck
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-bold">Tên bộ đề</th>
              <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Level</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Units</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Ngày tạo</th>
              <th className="text-right px-4 py-3 font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {decks.map((d) => (
              <tr key={d.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-semibold">{d.title}</div>
                  {d.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{d.description}</div>}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {d.level && <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-bold">{d.level}</span>}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{d.flashcard_count}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{formatDate(d.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => openEdit(d)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(d.id, d.title)} disabled={loading}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {decks.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">Chưa có bộ đề nào</div>
        )}
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Chỉnh sửa deck" : "Tạo deck mới"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên bộ đề *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: IELTS Vocabulary B2-C1" />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn..." />
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue placeholder="Chọn level..." /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button onClick={handleSave} disabled={loading || !title.trim()}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? "Cập nhật" : "Tạo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* JSON Upload dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Upload Flashcards (JSON)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Deck</Label>
              <Select value={uploadDeckId} onValueChange={setUploadDeckId}>
                <SelectTrigger><SelectValue placeholder="Chọn deck..." /></SelectTrigger>
                <SelectContent>
                  {decks.map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File JSON</Label>
              <Input type="file" accept=".json" onChange={(e) => setJsonFile(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">Format: Array of FlashcardContent objects</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Huỷ</Button>
            <Button onClick={handleJSONUpload} disabled={loading || !jsonFile || !uploadDeckId}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
