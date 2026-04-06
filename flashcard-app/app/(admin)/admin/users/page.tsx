"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, RefreshCw, Trash2, BookOpen, Loader2,
  Copy, Check, ChevronDown, Shield, Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generatePassword } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DeckItem {
  id: string; title: string; level?: string; word_count?: number;
}
interface UserDeckItem {
  id: string; deck_id: string; expired_at: string | null; deck?: { title: string };
}
interface UserData {
  id: string; email: string; role: string; created_at: string;
  created_by?: string | null;
  max_managed_users?: number;
  user_decks?: UserDeckItem[];
  creator?: { id: string; email: string; role: string } | null;
}

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchUsers(): Promise<UserData[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed");
  const data = await res.json();
  return data.users ?? [];
}

async function fetchDecks(): Promise<DeckItem[]> {
  const res = await fetch("/api/admin/decks");
  const data = await res.json();
  return data.decks ?? [];
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc      = useQueryClient();
  const { toast } = useToast();

  const [search,       setSearch]       = useState("");
  const [showCreate,   setShowCreate]   = useState(false);
  const [newEmail,     setNewEmail]     = useState("");
  const [newPassword,  setNewPassword]  = useState("");
  const [newRole,      setNewRole]      = useState("USER");
  const [tempPw,       setTempPw]       = useState("");
  const [copied,       setCopied]       = useState(false);

  const [showDecks,    setShowDecks]    = useState<UserData | null>(null);
  const [showAssign,   setShowAssign]   = useState<string | null>(null);
  const [assignDeckIds, setAssignDeckIds] = useState<Set<string>>(new Set());
  const [assignExpiry, setAssignExpiry] = useState("");

  const [showResetDlg, setShowResetDlg] = useState(false);
  const [resetResult,  setResetResult]  = useState<{ email: string; pw: string } | null>(null);
  const [resetCopied,  setResetCopied]  = useState(false);
  const [csvFile,      setCsvFile]      = useState<File | null>(null);

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"], queryFn: fetchUsers,
  });
  const { data: decks = [] } = useQuery({
    queryKey: ["admin-decks-list"], queryFn: fetchDecks,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createUser = useMutation({
    mutationFn: async ({ email, role, password }: { email: string; role: string; password: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, password }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: d => {
      setTempPw(d.tempPassword);
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Tạo người dùng thành công!" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const resetPw = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password" }),
      });
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      return { pw: d.tempPassword as string, email };
    },
    onSuccess: ({ pw, email }) => {
      setResetResult({ pw, email });
      setShowResetDlg(true);
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_role", role }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Đã cập nhật quyền" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Đã xóa người dùng" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const assignDeck = useMutation({
    mutationFn: async ({ userId, deckIds, expiredAt }: { userId: string; deckIds: string[]; expiredAt: string }) => {
      for (const deckId of deckIds) {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "assign_deck", deck_id: deckId, expired_at: expiredAt || null }),
        });
        if (!res.ok) throw new Error("Failed");
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowAssign(null); setAssignDeckIds(new Set()); setAssignExpiry("");
      toast({ title: `Giao ${vars.deckIds.length} bộ đề thành công!` });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const revokeDeck = useMutation({
    mutationFn: async ({ userId, deckId }: { userId: string; deckId: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_deck", deck_id: deckId }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setShowDecks(prev =>
        prev ? { ...prev, user_decks: prev.user_decks?.filter(ud => ud.deck_id !== revokeDeck.variables?.deckId) } : prev
      );
      toast({ title: "Đã thu hồi bộ đề" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    const Papa = (await import("papaparse")).default;
    Papa.parse(csvFile, {
      header: true,
      complete: async (results) => {
        const rows = results.data as { email?: string; role?: string }[];
        for (const row of rows) {
          if (row.email) {
            await fetch("/api/admin/users", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: row.email, role: row.role || "USER" }),
            });
          }
        }
        qc.invalidateQueries({ queryKey: ["admin-users"] });
        toast({ title: `Đã import ${rows.filter(r => r.email).length} người dùng` });
        setCsvFile(null);
      },
    });
  };

  function openAssign(userId: string) {
    setAssignDeckIds(new Set());
    setAssignExpiry("");
    setShowAssign(userId);
  }

  const assignedUser = users.find(u => u.id === showAssign);
  const filtered     = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  // ── Group users by subadmin ───────────────────────────────────────────────
  // Admin-managed: no created_by (or created by admin directly), not a subadmin
  const adminDirectUsers = filtered.filter(u => !u.created_by && u.role !== "SUBADMIN");

  // All subadmins
  const allSubadmins = users.filter(u => u.role === "SUBADMIN");

  // Build map: subadmin_id → { subadmin, managed users }
  const subadminGroups: Array<{ subadmin: UserData; managed: UserData[] }> = allSubadmins.map(sa => ({
    subadmin: sa,
    managed: filtered.filter(u => u.created_by === sa.id),
  }));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold text-[#1a1a2e]">👥 Quản lý người dùng</h1>
        <div className="flex gap-2 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden"
              onChange={e => setCsvFile(e.target.files?.[0] ?? null)} />
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-[#f0e0e7] text-sm font-semibold hover:border-brand hover:text-brand transition-all cursor-pointer">
              📂 Import CSV
            </span>
          </label>
          {csvFile && (
            <Button variant="brand" size="sm" onClick={handleCsvUpload}>
              Upload {csvFile.name}
            </Button>
          )}
          <Button variant="brand"
            onClick={() => { setShowCreate(true); setTempPw(""); setNewEmail(""); setNewPassword(""); setNewRole("USER"); }}>
            <Plus className="w-4 h-4" /> Tạo user
          </Button>
        </div>
      </div>

      <Input placeholder="🔍 Tìm theo email..." value={search}
        onChange={e => setSearch(e.target.value)} className="mb-5 max-w-sm" />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* ── Admin-managed users ── */}
          {adminDirectUsers.length > 0 && (
            <UserGroupTable
              title="👑 Quản lý trực tiếp bởi Admin"
              titleColor="text-purple-700"
              bgColor="bg-purple-50 border-b border-purple-100"
              users={adminDirectUsers}
              decks={decks}
              onAssign={openAssign}
              onViewDecks={setShowDecks}
              onResetPw={u => resetPw.mutate({ userId: u.id, email: u.email })}
              onDelete={u => { if (confirm(`Xóa ${u.email}?`)) deleteUser.mutate(u.id); }}
              onChangeRole={(u, role) => { if (confirm(`Đổi quyền ${u.email} → ${role}?`)) changeRole.mutate({ userId: u.id, role }); }}
            />
          )}

          {/* ── SubAdmin groups ── */}
          {subadminGroups.map(({ subadmin, managed }) => (
            <div key={subadmin.id}
              className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden">
              {/* SubAdmin header bar */}
              <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border-b border-orange-100 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                    SUBADMIN
                  </span>
                  <span className="font-bold text-[#1a1a2e] text-sm">{subadmin.email}</span>
                  <span className="text-xs text-muted-foreground">
                    ({managed.length} / {subadmin.max_managed_users ?? 10} users)
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                    onClick={() => openAssign(subadmin.id)}>
                    <BookOpen className="w-3 h-3" /> Giao đề
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                    disabled={resetPw.isPending}
                    onClick={() => resetPw.mutate({ userId: subadmin.id, email: subadmin.email })}>
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-500"
                    onClick={() => { if (confirm(`Xóa SubAdmin ${subadmin.email}?`)) deleteUser.mutate(subadmin.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {/* Managed users */}
              {managed.length === 0 ? (
                <div className="px-4 py-3 text-xs text-muted-foreground italic">
                  Chưa có người dùng nào trong nhóm này.
                </div>
              ) : (
                <UserGroupTable
                  title=""
                  users={managed}
                  decks={decks}
                  compact
                  onAssign={openAssign}
                  onViewDecks={setShowDecks}
                  onResetPw={u => resetPw.mutate({ userId: u.id, email: u.email })}
                  onDelete={u => { if (confirm(`Xóa ${u.email}?`)) deleteUser.mutate(u.id); }}
                  onChangeRole={(u, role) => { if (confirm(`Đổi quyền ${u.email} → ${role}?`)) changeRole.mutate({ userId: u.id, role }); }}
                />
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-8 text-center text-muted-foreground">
              Không tìm thấy người dùng nào
            </div>
          )}
        </div>
      )}

      {/* ════ Dialog: Tạo user ════ */}
      <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) { setTempPw(""); setNewPassword(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo người dùng mới</DialogTitle></DialogHeader>
          {tempPw ? (
            <div className="space-y-3">
              <p className="text-sm text-green-700 font-semibold">✅ Tạo thành công! Mật khẩu tạm thời:</p>
              <div className="bg-[#f8f9fa] border-2 border-[#f0e0e7] rounded-xl p-4 flex items-center gap-3">
                <code className="flex-1 font-mono text-brand font-bold text-xl tracking-wider select-all cursor-text"
                  onClick={e => {
                    const r = document.createRange();
                    r.selectNodeContents(e.currentTarget);
                    window.getSelection()?.removeAllRanges();
                    window.getSelection()?.addRange(r);
                  }}>{tempPw}</code>
                <Button variant="outline" size="sm"
                  onClick={() => { navigator.clipboard.writeText(tempPw); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">💡 Bấm vào mật khẩu để chọn, hoặc dùng nút Copy.</p>
              <Button className="w-full" variant="brand"
                onClick={() => { setShowCreate(false); setTempPw(""); }}>Đóng</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  placeholder="user@example.com" className="mt-1" />
              </div>
              <div>
                <Label>Mật khẩu (để trống = tự tạo ngẫu nhiên)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Để trống hoặc nhập mật khẩu"
                    className="flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Tạo mật khẩu ngẫu nhiên"
                    onClick={() => setNewPassword(generatePassword(10))}
                    className="flex-shrink-0 gap-1.5"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Mật khẩu sẽ hiển thị sau khi tạo xong
                </p>
              </div>
              <div>
                <Label>Quyền</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER — Học viên</SelectItem>
                    <SelectItem value="SUBADMIN">SUBADMIN — Quản lý nhóm</SelectItem>
                    <SelectItem value="ADMIN">ADMIN — Quản trị viên</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                <Button variant="brand"
                  disabled={!newEmail || createUser.isPending}
                  onClick={() => createUser.mutate({ email: newEmail, role: newRole, password: newPassword })}>
                  {createUser.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Tạo
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Chi tiết bộ đề user ════ */}
      <Dialog open={!!showDecks} onOpenChange={() => setShowDecks(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📚 Bộ đề — {showDecks?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(showDecks?.user_decks ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có bộ đề nào.</p>
            ) : (
              (showDecks?.user_decks ?? []).map(ud => {
                const isExp = ud.expired_at ? new Date(ud.expired_at) < new Date() : false;
                return (
                  <div key={ud.id}
                    className="flex items-center justify-between p-3 bg-[#f8f9fa] rounded-xl border border-[#f0e0e7]">
                    <div>
                      <div className="font-semibold text-sm text-[#1a1a2e]">{ud.deck?.title ?? "?"}</div>
                      {ud.expired_at && (
                        <div className={`text-xs mt-0.5 ${isExp ? "text-red-500" : "text-green-600"}`}>
                          {isExp ? "⛔" : "✅"} Hạn: {new Date(ud.expired_at).toLocaleDateString("vi-VN")}
                        </div>
                      )}
                      {!ud.expired_at && <div className="text-xs text-green-600 mt-0.5">♾️ Không giới hạn</div>}
                    </div>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-500"
                      onClick={() => revokeDeck.mutate({ userId: showDecks!.id, deckId: ud.deck_id })}>
                      <Trash2 className="w-3 h-3" /> Thu hồi
                    </Button>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="brand" onClick={() => { setShowDecks(null); openAssign(showDecks!.id); }}>
              + Giao thêm bộ đề
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Giao bộ đề ════ */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>📚 Giao bộ đề — {assignedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            {(assignedUser?.user_decks ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Đã có:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(assignedUser?.user_decks ?? []).map(ud => (
                    <span key={ud.id}
                      className="text-xs bg-brand-light text-brand px-2 py-0.5 rounded-full font-semibold">
                      {ud.deck?.title ?? "?"}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <AssignDeckList
              decks={decks}
              assignedUser={assignedUser}
              assignDeckIds={assignDeckIds}
              setAssignDeckIds={setAssignDeckIds}
            />
            <div>
              <Label>Ngày hết hạn</Label>
              <Input type="datetime-local" value={assignExpiry}
                onChange={e => setAssignExpiry(e.target.value)} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Để trống = không giới hạn thời gian</p>
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setShowAssign(null)}>Hủy</Button>
            <Button variant="brand"
              disabled={assignDeckIds.size === 0 || assignDeck.isPending}
              onClick={() => assignDeck.mutate({ userId: showAssign!, deckIds: Array.from(assignDeckIds), expiredAt: assignExpiry })}>
              {assignDeck.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Giao {assignDeckIds.size > 0 ? `${assignDeckIds.size} đề` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Reset PW result ════ */}
      <Dialog open={showResetDlg} onOpenChange={v => { setShowResetDlg(v); if (!v) setResetResult(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>🔑 Mật khẩu đã reset</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Mật khẩu mới cho <strong>{resetResult?.email}</strong>:
            </p>
            <div className="bg-[#f8f9fa] border-2 border-[#f0e0e7] rounded-xl p-4 flex items-center gap-3">
              <code className="flex-1 font-mono text-brand font-bold text-xl tracking-wider select-all cursor-text"
                onClick={e => {
                  const r = document.createRange();
                  r.selectNodeContents(e.currentTarget);
                  window.getSelection()?.removeAllRanges();
                  window.getSelection()?.addRange(r);
                }}>{resetResult?.pw}</code>
              <Button variant="outline" size="sm"
                onClick={() => {
                  if (resetResult) {
                    navigator.clipboard.writeText(resetResult.pw);
                    setResetCopied(true);
                    setTimeout(() => setResetCopied(false), 2000);
                  }
                }}>
                {resetCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">💡 Bấm vào mật khẩu để chọn.</p>
            <Button className="w-full" variant="brand"
              onClick={() => { setShowResetDlg(false); setResetResult(null); }}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── UserGroupTable ─────────────────────────────────────────────────────────────
interface UserGroupTableProps {
  title: string;
  titleColor?: string;
  bgColor?: string;
  users: UserData[];
  decks: DeckItem[];
  compact?: boolean;
  onAssign: (userId: string) => void;
  onViewDecks: (u: UserData) => void;
  onResetPw: (u: UserData) => void;
  onDelete: (u: UserData) => void;
  onChangeRole: (u: UserData, role: string) => void;
}

function UserGroupTable({
  title, titleColor = "text-[#1a1a2e]", bgColor = "",
  users, compact,
  onAssign, onViewDecks, onResetPw, onDelete, onChangeRole,
}: UserGroupTableProps) {
  return (
    <div className={`bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden ${compact ? "rounded-t-none border-t-0" : ""}`}>
      {title && (
        <div className={`px-4 py-2.5 ${bgColor}`}>
          <h3 className={`text-sm font-bold ${titleColor}`}>{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {!compact && (
            <thead>
              <tr className="border-b-2 border-[#f0e0e7] bg-[#f8f9fa]">
                <th className="text-left p-3 font-bold text-[#1a1a2e]">Email</th>
                <th className="text-left p-3 font-bold text-[#1a1a2e]">Role</th>
                <th className="text-left p-3 font-bold text-[#1a1a2e]">Ngày tạo</th>
                <th className="text-left p-3 font-bold text-[#1a1a2e]">Bộ đề</th>
                <th className="text-left p-3 font-bold text-[#1a1a2e]">Thao tác</th>
              </tr>
            </thead>
          )}
          <tbody>
            {users.map(u => {
              const deckCount = u.user_decks?.length ?? 0;
              const nextRole  = u.role === "USER" ? "SUBADMIN" : u.role === "SUBADMIN" ? "ADMIN" : "USER";
              const roleLabel = u.role === "USER" ? "→Sub" : u.role === "SUBADMIN" ? "→Adm" : "→User";
              return (
                <tr key={u.id} className="border-b border-[#f0e0e7] hover:bg-[#f8f9fa]">
                  <td className="p-3 font-medium text-[#1a1a2e] max-w-[200px]">
                    <div className="truncate" title={u.email}>{u.email}</div>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      u.role === "ADMIN"    ? "bg-purple-100 text-purple-700" :
                      u.role === "SUBADMIN" ? "bg-orange-100 text-orange-700" :
                                             "bg-brand-light text-brand"
                    }`}>{u.role}</span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(u.created_at).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="p-3">
                    {deckCount === 0 ? (
                      <span className="text-xs text-muted-foreground">Chưa có</span>
                    ) : (
                      <button onClick={() => onViewDecks(u)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand-light px-2.5 py-1 rounded-full hover:bg-brand hover:text-white transition-all">
                        <BookOpen className="w-3 h-3" />
                        {deckCount} bộ đề
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                        onClick={() => onAssign(u.id)}>
                        <BookOpen className="w-3 h-3" /> Giao đề
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                        onClick={() => onResetPw(u)}>
                        <RefreshCw className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                        title={`Đổi → ${nextRole}`}
                        onClick={() => onChangeRole(u, nextRole)}>
                        <Shield className="w-3 h-3" /> {roleLabel}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-500"
                        onClick={() => onDelete(u)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── AssignDeckList ─────────────────────────────────────────────────────────────
interface AssignDeckListProps {
  decks: DeckItem[];
  assignedUser: UserData | undefined;
  assignDeckIds: Set<string>;
  setAssignDeckIds: (s: Set<string>) => void;
}

function AssignDeckList({ decks, assignedUser, assignDeckIds, setAssignDeckIds }: AssignDeckListProps) {
  const assignable = decks.filter(d =>
    !assignedUser?.user_decks?.some(ud => ud.deck_id === d.id)
  );
  const allSelected = assignable.length > 0 && assignable.every(d => assignDeckIds.has(d.id));

  function toggleAll() {
    const next = new Set(assignDeckIds);
    if (allSelected) { assignable.forEach(d => next.delete(d.id)); }
    else             { assignable.forEach(d => next.add(d.id)); }
    setAssignDeckIds(next);
  }

  function toggleOne(id: string, checked: boolean) {
    const next = new Set(assignDeckIds);
    if (checked) next.add(id); else next.delete(id);
    setAssignDeckIds(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>
          Chọn bộ đề{" "}
          <span className="font-normal text-muted-foreground">(có thể chọn nhiều)</span>
        </Label>
        {assignable.length > 0 && (
          <button type="button" onClick={toggleAll}
            className="text-xs font-semibold text-brand hover:underline flex-shrink-0">
            {allSelected ? "✕ Bỏ chọn tất cả" : "✓ Chọn tất cả"}
          </button>
        )}
      </div>
      {decks.length === 0 ? (
        <p className="text-xs text-muted-foreground">Chưa có bộ đề nào trong hệ thống.</p>
      ) : (
        <div className="max-h-52 overflow-y-auto border-2 border-[#f0e0e7] rounded-xl divide-y divide-[#f0e0e7]">
          {decks.map(d => {
            const alreadyHas = assignedUser?.user_decks?.some(ud => ud.deck_id === d.id);
            const checked    = assignDeckIds.has(d.id);
            return (
              <label key={d.id} className={[
                "flex items-center gap-3 px-3 py-2.5 transition-colors",
                alreadyHas ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-brand-light",
                checked && !alreadyHas ? "bg-brand-light" : "",
              ].join(" ")}>
                <input type="checkbox" disabled={!!alreadyHas} checked={checked}
                  onChange={e => toggleOne(d.id, e.target.checked)}
                  className="w-4 h-4 accent-brand flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold truncate ${checked ? "text-brand" : "text-[#1a1a2e]"}`}>
                    {alreadyHas ? "✓ " : ""}{d.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {[d.level, d.word_count ? `${d.word_count} từ` : ""].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
      {assignDeckIds.size > 0 && (
        <p className="text-xs text-brand font-semibold mt-1.5">
          Đã chọn {assignDeckIds.size} bộ đề
        </p>
      )}
    </div>
  );
}
