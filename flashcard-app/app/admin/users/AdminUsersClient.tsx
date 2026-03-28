"use client";

import { useState } from "react";
import { AppUser, Deck } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/Dialog";
import { toast } from "@/hooks/useToast";
import { formatDate } from "@/lib/utils";
import { Plus, Key, BookOpen, Loader2, Upload, AlertCircle } from "lucide-react";
import Papa from "papaparse";

interface Props {
  initialUsers: AppUser[];
  decks: Pick<Deck, "id" | "title" | "level">[];
}

export function AdminUsersClient({ initialUsers, decks }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"USER" | "ADMIN">("USER");
  const [assignDeckId, setAssignDeckId] = useState("");
  const [assignExpiry, setAssignExpiry] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function callAdmin(path: string, body: object) {
    const res = await fetch(`/api/admin/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { error?: string; [key: string]: unknown };
    if (!res.ok) throw new Error(data.error ?? "Lỗi server");
    return data;
  }

  async function handleCreate() {
    if (!newEmail) return;
    setInlineError(null);
    setLoading(true);
    try {
      const data = await callAdmin("users/create", { email: newEmail, role: newRole });
      toast({ title: "✅ Đã tạo user", description: `Mật khẩu: ${data.password as string}` });
      setUsers((prev) => [data.user as AppUser, ...prev]);
      setCreateOpen(false);
      setNewEmail("");
    } catch (e) {
      setInlineError(e instanceof Error ? e.message : "Thất bại");
    } finally { setLoading(false); }
  }

  async function handleResetPassword(userId: string, email: string) {
    if (!confirm(`Reset mật khẩu cho ${email}?`)) return;
    setLoading(true);
    try {
      const data = await callAdmin("users/reset-password", { userId });
      toast({ title: "✅ Đã reset", description: `Mật khẩu mới: ${data.password as string}` });
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Thất bại" });
    } finally { setLoading(false); }
  }

  async function handleAssignDeck() {
    if (!assignOpen || !assignDeckId || !assignExpiry) return;
    setLoading(true);
    try {
      await callAdmin("users/assign-deck", {
        userId: assignOpen,
        deckId: assignDeckId,
        expiredAt: new Date(assignExpiry).toISOString(),
      });
      toast({ title: "✅ Đã gán deck" });
      setAssignOpen(null); setAssignDeckId(""); setAssignExpiry("");
    } catch (e) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Thất bại" });
    } finally { setLoading(false); }
  }

  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<{ email?: string; role?: string }>(file, {
      header: true,
      complete: async (results) => {
        setLoading(true);
        let created = 0;
        for (const row of results.data) {
          if (!row.email?.trim()) continue;
          try {
            const data = await callAdmin("users/create", { email: row.email.trim(), role: row.role ?? "USER" });
            setUsers((prev) => [data.user as AppUser, ...prev]);
            created++;
          } catch { /* skip failed rows */ }
        }
        toast({ title: `✅ Đã tạo ${created} users từ CSV` });
        setLoading(false);
      },
    });
    e.target.value = "";
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">👥 Quản lý người dùng</h1>
        <div className="flex gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-full border-2 border-gray-200 px-4 py-2 text-sm font-bold transition-colors hover:bg-gray-50">
            <Upload className="h-4 w-4" /> CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </label>
          <Button onClick={() => { setInlineError(null); setCreateOpen(true); }}>
            <Plus className="mr-1 h-4 w-4" /> Tạo user
          </Button>
        </div>
      </div>

      <Input placeholder="Tìm theo email..." value={search}
        onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />

      <div className="overflow-hidden rounded-2xl border-2 border-gray-100 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-bold">Email</th>
              <th className="hidden px-4 py-3 text-left font-bold sm:table-cell">Role</th>
              <th className="hidden px-4 py-3 text-left font-bold md:table-cell">Ngày tạo</th>
              <th className="px-4 py-3 text-right font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>{u.role}</span>
                </td>
                <td className="hidden px-4 py-3 text-gray-400 md:table-cell">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" disabled={loading}
                      onClick={() => handleResetPassword(u.id, u.email)} title="Reset mật khẩu">
                      <Key className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={loading}
                      onClick={() => setAssignOpen(u.id)} title="Gán deck">
                      <BookOpen className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="py-10 text-center text-gray-400">Không tìm thấy user</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create user */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo user mới</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {inlineError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />{inlineError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="user@example.com"
                value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value as "USER" | "ADMIN")}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-brand-red focus:outline-none">
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Huỷ</Button>
            <Button onClick={handleCreate} disabled={loading || !newEmail}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign deck */}
      <Dialog open={!!assignOpen} onOpenChange={() => setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gán bộ đề</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Bộ đề</Label>
              <select value={assignDeckId} onChange={(e) => setAssignDeckId(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2 text-sm font-medium focus:border-brand-red focus:outline-none">
                <option value="">Chọn bộ đề...</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>{d.title}{d.level ? ` (${d.level})` : ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Hết hạn</Label>
              <Input type="datetime-local" value={assignExpiry}
                onChange={(e) => setAssignExpiry(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(null)}>Huỷ</Button>
            <Button onClick={handleAssignDeck} disabled={loading || !assignDeckId || !assignExpiry}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Gán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
