"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/utils";
import { LEVELS } from "@/lib/constants";
import { Plus, Pencil, Trash2, Upload, Loader2, AlertCircle } from "lucide-react";

interface DeckRow {
  id: string;
  title: string;
  description: string | null;
  level: string | null;
  created_at: string;
  unit_count: number;
  word_count: number;
}

export function AdminDecksClient({ initialDecks }: { initialDecks: DeckRow[] }) {
  const [decks, setDecks] = useState(initialDecks);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DeckRow | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadDeckId, setUploadDeckId] = useState("");
  const [jsonFile, setJsonFile] = useState<File | null>(null);

  async function callAdmin(path: string, body: object) {
    const res = await fetch(`/api/admin/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { error?: string; [key: string]: unknown };
    if (!res.ok) throw new Error(data.error ?? "Lỗi");
    return data;
  }

  function openCreate() {
    setEditing(null); setTitle(""); setDescription(""); setLevel(""); setInlineError(null); setOpen(true);
  }
  function openEdit(d: DeckRow) {
    setEditing(d); setTitle(d.title); setDescription(d.description ?? ""); setLevel(d.level ?? ""); setInlineError(null); setOpen(true);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setLoading(true);
    setInlineError(null);
    try {
      const data = await callAdmin("decks/save", { id: editing?.id, title, description, level });
      const deck = data.deck as DeckRow;
      if (editing) {
        setDecks((prev) => prev.map((d) => d.id === editing.id ? { ...d, ...deck } : d));
        toast({ title: "✅ Đã cập nhật deck" });
      } else {
        setDecks((prev) => [{ ...deck, unit_count: 0, word_count: 0 }, ...prev]);
        toast({ title: "✅ Đã tạo deck" });
      }
      setOpen(false);
    } catch (e) {
      setInlineError(e instanceof Error ? e.message : "Thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, t: string) {
    if (!confirm(`Xoá deck "${t}"? Toàn bộ flashcard cũng bị xoá.`)) return;
    setLoading(true);
    try {
      await callAdmin("decks/delete", { id });
      setDecks((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "✅ Đã xoá" });
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Thất bại" });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!jsonFile || !uploadDeckId) return;
    setLoading(true);
    try {
      const text = await jsonFile.text();
      const units: unknown = JSON.parse(text);
      await callAdmin("decks/upload-flashcards", { deckId: uploadDeckId, units });
      toast({ title: "✅ Upload thành công" });
      setUploadOpen(false);
      setJsonFile(null);
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "JSON không hợp lệ" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">📚 Quản lý bộ đề</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload className="mr-1 h-4 w-4" /> Upload JSON
          </Button>
          <Button onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Tạo deck</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border-2 border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold">Tên bộ đề</th>
              <th className="hidden px-4 py-3 text-left font-bold sm:table-cell">Level</th>
              <th className="hidden px-4 py-3 text-left font-bold md:table-cell">Từ</th>
              <th className="hidden px-4 py-3 text-left font-bold lg:table-cell">Ngày tạo</th>
              <th className="px-4 py-3 text-right font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {decks.map((d) => (
              <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-semibold">{d.title}</div>
                  {d.description && <div className="max-w-[200px] truncate text-xs text-gray-400">{d.description}</div>}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  {d.level && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold">{d.level}</span>}
                </td>
                <td className="hidden px-4 py-3 text-gray-400 md:table-cell">{d.word_count}</td>
                <td className="hidden px-4 py-3 text-gray-400 lg:table-cell">{formatDate(d.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(d)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm" disabled={loading} onClick={() => handleDelete(d.id, d.title)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {decks.length === 0 && (
              <tr><td colSpan={5} className="py-10 text-center text-gray-400">Chưa có bộ đề nào</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Chỉnh sửa deck" : "Tạo deck mới"}>
        <div className="space-y-4">
          {inlineError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />{inlineError}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="dt">Tên bộ đề *</Label>
            <Input id="dt" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: IELTS Vocabulary B2-C1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dd">Mô tả</Label>
            <Input id="dd" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dl">Level</Label>
            <Select value={level} onChange={setLevel}>
              <option value="">Chọn level...</option>
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Huỷ</Button>
            <Button onClick={handleSave} disabled={loading || !title.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Cập nhật" : "Tạo"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* JSON Upload dialog */}
      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Flashcards (JSON)">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Deck</Label>
            <Select value={uploadDeckId} onChange={setUploadDeckId}>
              <option value="">Chọn deck...</option>
              {decks.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>File JSON</Label>
            <Input type="file" accept=".json" onChange={(e) => setJsonFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-gray-400">Format: object (1 unit) hoặc array (nhiều units)</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setUploadOpen(false)}>Huỷ</Button>
            <Button onClick={handleUpload} disabled={loading || !jsonFile || !uploadDeckId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Upload
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
