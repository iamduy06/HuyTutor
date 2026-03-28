"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Trash2, UserPlus, BookOpen, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";

interface UserData {
  id: string; email: string; role: string; created_at: string;
  user_decks?: { id: string; deck_id: string; expired_at: string | null; deck?: { title: string } }[];
}

async function fetchUsers(): Promise<UserData[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed");
  const data = await res.json();
  return data.users ?? [];
}

async function fetchDecks() {
  const res = await fetch("/api/decks");
  const data = await res.json();
  return data.decks ?? [];
}

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [tempPw, setTempPw] = useState("");
  const [copied, setCopied] = useState(false);
  const [assignDeckId, setAssignDeckId] = useState("");
  const [assignExpiry, setAssignExpiry] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });
  const { data: decks = [] } = useQuery({ queryKey: ["decks"], queryFn: fetchDecks });

  const createUser = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: (data) => {
      setTempPw(data.tempPassword);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Tạo người dùng thành công!" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const resetPw = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: `Mật khẩu mới: ${data.tempPassword}`, description: "Hãy copy và gửi cho người dùng" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "Đã xóa người dùng" }); },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const assignDeck = useMutation({
    mutationFn: async ({ userId, deckId, expiredAt }: any) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_deck", deck_id: deckId, expired_at: expiredAt || null }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowAssign(null); setAssignDeckId(""); setAssignExpiry("");
      toast({ title: "Giao bộ đề thành công!" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    const Papa = (await import("papaparse")).default;
    Papa.parse(csvFile, {
      header: true,
      complete: async (results) => {
        const rows = results.data as any[];
        for (const row of rows) {
          if (row.email) {
            await fetch("/api/admin/users", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: row.email, role: row.role || "USER" }),
            });
          }
        }
        qc.invalidateQueries({ queryKey: ["admin-users"] });
        toast({ title: `Đã import ${rows.length} người dùng` });
        setCsvFile(null);
      },
    });
  };

  const filtered = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold text-[#1a1a2e]">👥 Quản lý người dùng</h1>
        <div className="flex gap-2 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden"
              onChange={(e) => { setCsvFile(e.target.files?.[0] || null); }} />
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-[#f0e0e7] text-sm font-semibold hover:border-brand hover:text-brand transition-all cursor-pointer">
              📂 Import CSV
            </span>
          </label>
          {csvFile && (
            <Button variant="brand" size="sm" onClick={handleCsvUpload}>
              Upload {csvFile.name}
            </Button>
          )}
          <Button variant="brand" onClick={() => { setShowCreate(true); setTempPw(""); setNewEmail(""); }}>
            <Plus className="w-4 h-4" /> Tạo user
          </Button>
        </div>
      </div>

      <Input placeholder="🔍 Tìm theo email..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#f0e0e7] bg-[#f8f9fa]">
                  <th className="text-left p-3 font-bold text-[#1a1a2e]">Email</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e]">Role</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e]">Ngày tạo</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e]">Bộ đề</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-[#f0e0e7] hover:bg-[#f8f9fa]">
                    <td className="p-3 font-medium text-[#1a1a2e] max-w-[200px] truncate">{u.email}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-brand-light text-brand"
                      }`}>{u.role}</span>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString("vi-VN")}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {(u.user_decks ?? []).length > 0
                        ? (u.user_decks ?? []).map((ud) => (
                          <span key={ud.id} className="inline-block bg-brand-light text-brand rounded px-1.5 py-0.5 mr-1 mb-1 text-xs font-semibold">
                            {ud.deck?.title ?? "?"}
                            {ud.expired_at && <span className="text-[10px] ml-1 opacity-70">({new Date(ud.expired_at).toLocaleDateString("vi-VN")})</span>}
                          </span>
                        ))
                        : <span className="text-muted-foreground">Chưa có</span>
                      }
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setShowAssign(u.id)}>
                          <BookOpen className="w-3 h-3" /> Giao đề
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => resetPw.mutate(u.id)}
                          disabled={resetPw.isPending}>
                          <RefreshCw className="w-3 h-3" /> Reset PW
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                          onClick={() => { if (confirm("Xóa user này?")) deleteUser.mutate(u.id); }}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Không tìm thấy người dùng</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create user dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo người dùng mới</DialogTitle></DialogHeader>
          {tempPw ? (
            <div className="space-y-3">
              <p className="text-sm text-green-700 font-semibold">✅ Tạo thành công! Mật khẩu tạm thời:</p>
              <div className="flex items-center gap-2 bg-[#f8f9fa] border rounded-lg p-3">
                <code className="flex-1 font-mono text-brand font-bold">{tempPw}</code>
                <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(tempPw); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Gửi mật khẩu này cho người dùng để đăng nhập lần đầu.</p>
              <Button className="w-full" variant="brand" onClick={() => { setShowCreate(false); setTempPw(""); }}>Đóng</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div><Label>Email</Label><Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="user@example.com" className="mt-1" /></div>
              <div>
                <Label>Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="USER">USER</SelectItem><SelectItem value="ADMIN">ADMIN</SelectItem></SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                <Button variant="brand" onClick={() => createUser.mutate({ email: newEmail, role: newRole })} disabled={createUser.isPending || !newEmail}>
                  {createUser.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Tạo
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign deck dialog */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Giao bộ đề</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Bộ đề</Label>
              <Select value={assignDeckId} onValueChange={setAssignDeckId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn bộ đề" /></SelectTrigger>
                <SelectContent>
                  {decks.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ngày hết hạn (để trống = không hết hạn)</Label>
              <Input type="datetime-local" value={assignExpiry} onChange={(e) => setAssignExpiry(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(null)}>Hủy</Button>
            <Button variant="brand" disabled={!assignDeckId || assignDeck.isPending}
              onClick={() => assignDeck.mutate({ userId: showAssign, deckId: assignDeckId, expiredAt: assignExpiry })}>
              {assignDeck.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Giao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
