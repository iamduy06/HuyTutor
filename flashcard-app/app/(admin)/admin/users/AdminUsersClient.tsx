"use client";

import { useState } from "react";
import { AppUser, Deck } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Plus, Key, BookOpen, Loader2, Upload } from "lucide-react";
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
  const { toast } = useToast();

  const filtered = users.filter(
    (u) => u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function callAdmin(path: string, body: object) {
    const res = await fetch(`/api/admin/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Lỗi server");
    return data;
  }

  async function handleCreate() {
    if (!newEmail) return;
    setLoading(true);
    try {
      const data = await callAdmin("users/create", { email: newEmail, role: newRole });
      toast({ title: "✅ Đã tạo user", description: `Password: ${data.password}` });
      setUsers((prev) => [data.user, ...prev]);
      setCreateOpen(false);
      setNewEmail("");
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Thất bại", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function handleResetPassword(userId: string, email: string) {
    if (!confirm(`Reset mật khẩu cho ${email}?`)) return;
    setLoading(true);
    try {
      const data = await callAdmin("users/reset-password", { userId });
      toast({ title: "✅ Đã reset", description: `Mật khẩu mới: ${data.password}` });
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Thất bại", variant: "destructive" });
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
      setAssignOpen(null);
      setAssignDeckId("");
      setAssignExpiry("");
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Thất bại", variant: "destructive" });
    } finally { setLoading(false); }
  }

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<{ email: string; role?: string }>(file, {
      header: true,
      complete: async (results) => {
        setLoading(true);
        let created = 0;
        for (const row of results.data) {
          if (!row.email) continue;
          try {
            const data = await callAdmin("users/create", { email: row.email, role: row.role ?? "USER" });
            setUsers((prev) => [data.user, ...prev]);
            created++;
          } catch {}
        }
        toast({ title: `✅ Đã tạo ${created} users từ CSV` });
        setLoading(false);
      },
    });
    e.target.value = "";
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold">👥 Quản lý người dùng</h1>
        <div className="flex gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-4 py-2 border-2 border-border rounded-full text-sm font-bold cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload className="h-4 w-4" /> CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
          </label>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Tạo user
          </Button>
        </div>
      </div>

      <Input
        placeholder="Tìm kiếm theo email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="bg-white rounded-2xl border-2 border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-bold">Email</th>
              <th className="text-left px-4 py-3 font-bold hidden sm:table-cell">Role</th>
              <th className="text-left px-4 py-3 font-bold hidden md:table-cell">Ngày tạo</th>
              <th className="text-right px-4 py-3 font-bold">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {formatDate(u.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => handleResetPassword(u.id, u.email)} disabled={loading}>
                      <Key className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setAssignOpen(u.id)} disabled={loading}>
                      <BookOpen className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">Không tìm thấy user</div>
        )}
      </div>

      {/* Create user dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo user mới</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="user@example.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as "USER" | "ADMIN")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER</SelectItem>
                  <SelectItem value="ADMIN">ADMIN</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Huỷ</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Tạo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign deck dialog */}
      <Dialog open={!!assignOpen} onOpenChange={() => setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Gán bộ đề</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Bộ đề</Label>
              <Select value={assignDeckId} onValueChange={setAssignDeckId}>
                <SelectTrigger><SelectValue placeholder="Chọn bộ đề..." /></SelectTrigger>
                <SelectContent>
                  {decks.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.title} {d.level ? `(${d.level})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Hết hạn</Label>
              <Input type="datetime-local" value={assignExpiry} onChange={(e) => setAssignExpiry(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(null)}>Huỷ</Button>
            <Button onClick={handleAssignDeck} disabled={loading || !assignDeckId || !assignExpiry}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Gán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
