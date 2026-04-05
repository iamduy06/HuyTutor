"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, RefreshCw, Trash2, BookOpen, Loader2,
  Copy, Check, ChevronDown, X, Calendar, Shuffle, Shield
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

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserDeckItem {
  id: string;
  deck_id: string;
  expired_at: string | null;
  deck?: { title: string };
}

interface UserData {
  id: string;
  email: string;
  role: string;
  created_at: string;
  user_decks?: UserDeckItem[];
}

interface DeckItem {
  id: string;
  title: string;
  level?: string | null;
  word_count?: number;
}

// ─── API helpers ─────────────────────────────────────────────────────────────
async function fetchUsers(): Promise<UserData[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).users ?? [];
}

// Dùng admin route để lấy TẤT CẢ decks kể cả mới thêm
async function fetchDecks(): Promise<DeckItem[]> {
  const res = await fetch("/api/admin/decks");
  if (!res.ok) throw new Error("Failed");
  return (await res.json()).decks ?? [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search,       setSearch]       = useState("");
  const [showCreate,   setShowCreate]   = useState(false);
  const [showAssign,   setShowAssign]   = useState<string | null>(null);  // userId
  const [showDecks,    setShowDecks]    = useState<UserData | null>(null); // user detail
  const [newEmail,     setNewEmail]     = useState("");
  const [newPassword,  setNewPassword]  = useState("");
  const [newRole,      setNewRole]      = useState("USER");
  const [tempPw,       setTempPw]       = useState("");
  const [copied,       setCopied]       = useState(false);
  const [assignDeckIds, setAssignDeckIds] = useState<Set<string>>(new Set());
  const [assignExpiry, setAssignExpiry] = useState("");
  const [csvFile,      setCsvFile]      = useState<File | null>(null);
  const [showResetDlg, setShowResetDlg] = useState(false);
  const [resetResult,  setResetResult]  = useState<{ email: string; pw: string } | null>(null);
  const [resetCopied,  setResetCopied]  = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"], queryFn: fetchUsers,
  });
  const { data: decks = [] } = useQuery({
    queryKey: ["admin-decks-list"], queryFn: fetchDecks,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createUser = useMutation({
    mutationFn: async ({ email, role, password }: { email: string; role: string; password: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, password }),
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
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password" }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      return { pw: data.tempPassword, email };
    },
    onSuccess: (data) => {
      setResetResult({ email: data.email, pw: data.pw });
      setResetCopied(false);
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
      toast({ title: "Đã thay đổi role" });
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
      // Giao từng deck một (sequential để tránh race condition)
      for (const deckId of deckIds) {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "assign_deck", deck_id: deckId, expired_at: expiredAt || null }),
        });
        if (!res.ok) throw new Error("Failed");
      }
    },
    onSuccess: (_: unknown, vars: { userId: string; deckIds: string[]; expiredAt: string }) => {
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
      // Update the showDecks state to reflect removal
      setShowDecks(prev => prev ? {
        ...prev,
        user_decks: prev.user_decks?.filter(ud => ud.deck_id !== revokeDeck.variables?.deckId)
      } : prev);
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
        toast({ title: `Đã import ${rows.filter((r: any) => r.email).length} người dùng` });
        setCsvFile(null);
      },
    });
  };

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  function fmtDate(d: string) {
    return new Date(d).toLocaleDateString("vi-VN");
  }

  function openAssign(userId: string) {
    setAssignDeckIds(new Set()); setAssignExpiry("");
    setShowAssign(userId);
  }

  // Decks đã gán cho user đang xem
  const assignedUser = users.find(u => u.id === showAssign);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl">
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
          <Button variant="brand" onClick={() => { setShowCreate(true); setTempPw(""); setNewEmail(""); setNewPassword(""); }}>
            <Plus className="w-4 h-4" /> Tạo user
          </Button>
        </div>
      </div>

      <Input placeholder="🔍 Tìm theo email..." value={search}
        onChange={e => setSearch(e.target.value)} className="mb-4 max-w-sm" />

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
                {filtered.map(u => {
                  const deckCount = u.user_decks?.length ?? 0;
                  return (
                    <tr key={u.id} className="border-b border-[#f0e0e7] hover:bg-[#f8f9fa]">
                      <td className="p-3 font-medium text-[#1a1a2e] max-w-[200px] truncate">{u.email}</td>
                      <td className="p-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-brand-light text-brand"
                        }`}>{u.role}</span>
                      </td>
                      <td className="p-3 text-muted-foreground text-xs">{fmtDate(u.created_at)}</td>

                      {/* Bộ đề: chỉ hiện số, click để xem chi tiết */}
                      <td className="p-3">
                        {deckCount === 0 ? (
                          <span className="text-xs text-muted-foreground">Chưa có</span>
                        ) : (
                          <button
                            onClick={() => setShowDecks(u)}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand bg-brand-light px-2.5 py-1 rounded-full hover:bg-brand hover:text-white transition-all"
                          >
                            <BookOpen className="w-3 h-3" />
                            {deckCount} bộ đề
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1"
                            onClick={() => openAssign(u.id)}>
                            <BookOpen className="w-3 h-3" /> Giao đề
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1"
                            onClick={() => resetPw.mutate({ userId: u.id, email: u.email })} disabled={resetPw.isPending}>
                            <RefreshCw className="w-3 h-3" /> Reset PW
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1"
                            title={u.role === "ADMIN" ? "Hạ xuống USER" : "Nâng lên ADMIN"}
                            onClick={() => {
                              const newRole = u.role === "ADMIN" ? "USER" : "ADMIN";
                              if (confirm(`Đổi role của ${u.email} thành ${newRole}?`))
                                changeRole.mutate({ userId: u.id, role: newRole });
                            }}>
                            <Shield className="w-3 h-3" /> {u.role === "ADMIN" ? "→USER" : "→ADM"}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-500"
                            onClick={() => { if (confirm("Xóa user này?")) deleteUser.mutate(u.id); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Không tìm thấy người dùng</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ Dialog: Tạo user ════ */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo người dùng mới</DialogTitle></DialogHeader>
          {tempPw ? (
            <div className="space-y-3">
              <p className="text-sm text-green-700 font-semibold">✅ Tạo thành công! Mật khẩu tạm thời:</p>
              <div className="flex items-center gap-2 bg-[#f8f9fa] border rounded-lg p-3">
                <code className="flex-1 font-mono text-brand font-bold text-lg">{tempPw}</code>
                <Button size="sm" variant="ghost" onClick={() => {
                  navigator.clipboard.writeText(tempPw);
                  setCopied(true); setTimeout(() => setCopied(false), 2000);
                }}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Gửi mật khẩu này cho người dùng để đăng nhập lần đầu.</p>
              <Button className="w-full" variant="brand" onClick={() => { setShowCreate(false); setTempPw(""); }}>Đóng</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" className="mt-1" />
              </div>
              <div>
                <Label>Mật khẩu</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Để trống = tạo ngẫu nhiên"
                    className="flex-1 font-mono"
                  />
                  <Button type="button" variant="outline" size="sm" className="px-3 flex-shrink-0"
                    title="Tạo mật khẩu ngẫu nhiên"
                    onClick={() => setNewPassword(generatePassword(10))}>
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Để trống = hệ thống tự tạo 10 ký tự ngẫu nhiên</p>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                <Button variant="brand" disabled={createUser.isPending || !newEmail}
                  onClick={() => createUser.mutate({ email: newEmail, role: newRole, password: newPassword })}>
                  {createUser.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Tạo
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Chi tiết bộ đề của user ════ */}
      <Dialog open={!!showDecks} onOpenChange={() => setShowDecks(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>📚 Bộ đề của {showDecks?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {(showDecks?.user_decks ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Chưa có bộ đề nào</p>
            ) : (showDecks?.user_decks ?? []).map(ud => {
              const expired = ud.expired_at && new Date(ud.expired_at) <= new Date();
              return (
                <div key={ud.id} className="flex items-center gap-2 p-2.5 bg-[#f8f9fa] rounded-xl border border-[#f0e0e7]">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#1a1a2e] truncate">
                      {ud.deck?.title ?? "?"}
                    </div>
                    {ud.expired_at ? (
                      <div className={`flex items-center gap-1 text-xs mt-0.5 ${expired ? "text-red-500" : "text-green-600"}`}>
                        <Calendar className="w-3 h-3" />
                        {expired ? "Hết hạn" : "Hạn"}: {fmtDate(ud.expired_at)}
                      </div>
                    ) : (
                      <div className="text-xs text-green-600 mt-0.5">♾️ Không hết hạn</div>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 flex-shrink-0"
                    title="Thu hồi bộ đề"
                    onClick={() => {
                      if (confirm(`Thu hồi bộ đề "${ud.deck?.title}"?`))
                        revokeDeck.mutate({ userId: showDecks!.id, deckId: ud.deck_id });
                    }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecks(null)}>Đóng</Button>
            <Button variant="brand" onClick={() => { setShowDecks(null); openAssign(showDecks!.id); setAssignDeckIds(new Set()); }}>
              <BookOpen className="w-4 h-4" /> Giao thêm bộ đề
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
            {/* Bộ đề đã có */}
            {(assignedUser?.user_decks ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">Đã có:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(assignedUser?.user_decks ?? []).map(ud => (
                    <span key={ud.id} className="text-xs bg-brand-light text-brand px-2 py-0.5 rounded-full font-semibold">
                      {ud.deck?.title ?? "?"}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Chọn bộ đề * <span className="font-normal text-muted-foreground">(có thể chọn nhiều)</span></Label>
              {decks.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-2">Chưa có bộ đề nào trong hệ thống.</p>
              ) : (
                <>
                  {/* Chọn tất cả */}
                  <div className="flex items-center justify-between mt-2 mb-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const assignable = decks.filter((d: DeckItem) =>
                          !assignedUser?.user_decks?.some(ud => ud.deck_id === d.id)
                        );
                        const allSelected = assignable.every((d: DeckItem) => assignDeckIds.has(d.id));
                        const next = new Set(assignDeckIds);
                        if (allSelected) {
                          assignable.forEach((d: DeckItem) => next.delete(d.id));
                        } else {
                          assignable.forEach((d: DeckItem) => next.add(d.id));
                        }
                        setAssignDeckIds(next);
                      }}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      {(() => {
                        const assignable = decks.filter((d: DeckItem) =>
                          !assignedUser?.user_decks?.some(ud => ud.deck_id === d.id)
                        );
                        return assignable.length > 0 && assignable.every((d: DeckItem) => assignDeckIds.has(d.id))
                          ? "✕ Bỏ chọn tất cả"
                          : "✓ Chọn tất cả";
                      })()}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {decks.filter((d: DeckItem) => !assignedUser?.user_decks?.some(ud => ud.deck_id === d.id)).length} bộ đề có thể giao
                    </span>
                  </div>
                <div className="max-h-52 overflow-y-auto border-2 border-[#f0e0e7] rounded-xl divide-y divide-[#f0e0e7]">
                  {decks.map((d: DeckItem) => {
                    const alreadyHas = assignedUser?.user_decks?.some(ud => ud.deck_id === d.id);
                    const checked    = assignDeckIds.has(d.id);
                    return (
                      <label key={d.id}
                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                          alreadyHas ? "opacity-50 cursor-not-allowed" : "hover:bg-brand-light"
                        } ${checked ? "bg-brand-light" : ""}`}>
                        <input
                          type="checkbox"
                          disabled={alreadyHas}
                          checked={checked}
                          onChange={e => {
                            const next = new Set(assignDeckIds);
                            if (e.target.checked) next.add(d.id);
                            else next.delete(d.id);
                            setAssignDeckIds(next);
                          }}
                          className="w-4 h-4 accent-brand flex-shrink-0"
                        />
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
                </>
              )}
              {assignDeckIds.size > 0 && (
                <p className="text-xs text-brand font-semibold mt-1.5">
                  Đã chọn {assignDeckIds.size} bộ đề
                </p>
              )}
            </div>
            <div>
              <Label>Ngày hết hạn</Label>
              <Input type="datetime-local" value={assignExpiry}
                onChange={e => setAssignExpiry(e.target.value)} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Để trống = không giới hạn thời gian</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(null)}>Hủy</Button>
            <Button variant="brand" disabled={assignDeckIds.size === 0 || assignDeck.isPending}
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
              <code
                className="flex-1 font-mono text-brand font-bold text-xl tracking-wider select-all cursor-text"
                title="Bấm để chọn tất cả"
                onClick={e => {
                  const range = document.createRange();
                  range.selectNodeContents(e.currentTarget);
                  window.getSelection()?.removeAllRanges();
                  window.getSelection()?.addRange(range);
                }}
              >
                {resetResult?.pw}
              </code>
              <Button variant="outline" size="sm" className="flex-shrink-0 gap-1"
                onClick={() => {
                  if (resetResult) {
                    navigator.clipboard.writeText(resetResult.pw);
                    setResetCopied(true);
                    setTimeout(() => setResetCopied(false), 2000);
                  }
                }}>
                {resetCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {resetCopied ? "Đã copy!" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              💡 Bấm vào mật khẩu để chọn, hoặc dùng nút Copy.
            </p>
          </div>
          <DialogFooter>
            <Button variant="brand" className="w-full" onClick={() => { setShowResetDlg(false); setResetResult(null); }}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
