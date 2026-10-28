"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, RefreshCw, Trash2, BookOpen, Loader2,
  Copy, Check, Shield, Shuffle, Key,
  ChevronDown, ChevronUp, TrendingUp, BarChart
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
import { PaginationControls } from "@/components/common/PaginationControls";
import type { PaginationMeta } from "@huytutor/shared";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserDevice { id: string; device_id: string; device_name: string | null; ip_address: string | null; last_seen: string; }
interface ManagedGroup { group_id: string; groups: { id: string; name: string; max_users: number; max_device_per_user: number; } }
interface DeckItem { id: string; title: string; level?: string; word_count?: number; group_expired_at?: string | null; }
interface UserDeckItem {
  id: string;
  deck_id: string;
  expired_at: string | null;
  learned_count?: number;
  progress_percent?: number;
  streak?: number;
  deck?: { title: string }
}
interface UserData {
  id: string; email: string; role: string; created_at: string; max_devices?: number;
  user_decks?: UserDeckItem[];
  user_devices?: UserDevice[];
}
interface MeInfo {
  id: string; email: string; role: string;
  max_managed_users: number; current_managed: number;
}

// ── API helpers ───────────────────────────────────────────────────────────────
async function fetchData(page: number, limit: number, search: string) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (search.trim()) {
    params.set("search", search.trim());
  }
  const [usersRes, decksRes] = await Promise.all([
    fetch(`/api/subadmin/users?${params.toString()}`),
    fetch("/api/subadmin/decks"),
  ]);
  const usersJson = await usersRes.json();
  const decksJson = await decksRes.json();
  return {
    users: (usersJson.users ?? []) as UserData[],
    managedGroups: (usersJson.managed_groups ?? []) as ManagedGroup[],
    me: usersJson.me as MeInfo,
    decks: (decksJson.decks ?? []) as DeckItem[],
    pagination: usersJson.pagination as PaginationMeta | undefined,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SubAdminUsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [newPassword, setNewPassword] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [assignAllDecks, setAssignAllDecks] = useState(false);
  const [createAssignExpiry, setCreateAssignExpiry] = useState("");
  const [tempPw, setTempPw] = useState("");
  const [copied, setCopied] = useState(false);

  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [assignDeckIds, setAssignDeckIds] = useState<Set<string>>(new Set());
  const [assignExpiry, setAssignExpiry] = useState("");

  const [showResetDlg, setShowResetDlg] = useState(false);
  const [resetResult, setResetResult] = useState<{ email: string; pw: string } | null>(null);
  const [resetCopied, setResetCopied] = useState(false);

  // Progress & Flashcard Expansion State
  const [expandedProgress, setExpandedProgress] = useState<Set<string>>(new Set());
  const [expandedFlashcards, setExpandedFlashcards] = useState<Set<string>>(new Set());

  const toggleProgress = (userId: string) => {
    const next = new Set(expandedProgress);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setExpandedProgress(next);
  };

  const toggleFlashcards = (userId: string) => {
    const next = new Set(expandedFlashcards);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setExpandedFlashcards(next);
  };

  // Device Management State
  const [showDevices, setShowDevices] = useState<UserData | null>(null);
  const [editMaxDevicesLocal, setEditMaxDevicesLocal] = useState("");

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ["subadmin-data", page, pageSize, search],
    queryFn: () => fetchData(page, pageSize, search),
    placeholderData: (prev) => prev,
  });
  const pagination = data?.pagination;
  const users = data?.users ?? [];
  const decks = data?.decks ?? [];
  const managedGroups = data?.managedGroups ?? [];
  const me = data?.me;

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createUser = useMutation({
    mutationFn: async ({ email, role, password, groupId, assignAllDecks, expiredAt }: {
      email: string; role: string; password?: string; groupId?: string; assignAllDecks?: boolean; expiredAt?: string;
    }) => {
      const res = await fetch("/api/subadmin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role,
          password: password?.trim() || undefined,
          group_id: groupId,
          assign_all_decks: assignAllDecks,
          expired_at: expiredAt ? expiredAt + "T23:59:59Z" : ""
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: d => {
      setTempPw(d.tempPassword);
      qc.invalidateQueries({ queryKey: ["subadmin-data"] });
      toast({ title: "Tạo người dùng thành công!" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const resetPw = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      const res = await fetch(`/api/subadmin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password" }),
      });
      if (!res.ok) throw new Error("Failed");
      const d = await res.json();
      return { pw: d.tempPassword, email };
    },
    onSuccess: ({ pw, email }) => {
      setResetResult({ pw, email });
      setShowResetDlg(true);
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/subadmin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_role", role }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subadmin-data"] });
      toast({ title: "Đã cập nhật quyền" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/subadmin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subadmin-data"] });
      toast({ title: "Đã xóa tài khoản vĩnh viễn" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const assignDeck = useMutation({
    mutationFn: async ({ userId, deckIds, expiredAt }: { userId: string; deckIds: string[]; expiredAt: string }) => {
      for (const deckId of deckIds) {
        const deckInfo = decks.find(d => d.id === deckId);
        if (deckInfo?.group_expired_at && expiredAt) {
          const groupExp = new Date(deckInfo.group_expired_at);
          const userExp = new Date(expiredAt);
          if (userExp > groupExp) {
            throw new Error(`Flashcard "${deckInfo.title}" hết hạn vào ${groupExp.toLocaleString()}. Bạn không thể gán quá hạn này.`);
          }
        }

        const res = await fetch(`/api/subadmin/users/${userId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "assign_deck", deck_id: deckId, expired_at: expiredAt || null }),
        });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["subadmin-data"] });
      setShowAssign(null); setAssignDeckIds(new Set()); setAssignExpiry("");
      toast({ title: `Giao ${vars.deckIds.length} Flashcard thành công!` });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const revokeDeck = useMutation({
    mutationFn: async ({ userId, deckId }: { userId: string; deckId: string }) => {
      const res = await fetch(`/api/subadmin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_deck", deck_id: deckId }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subadmin-data"] });
      toast({ title: "Đã thu hồi Flashcard" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const updateDeviceInfo = useMutation({
    mutationFn: async ({ userId, action, deviceId, maxDevices }: { userId: string, action: string, deviceId?: string, maxDevices?: number | null }) => {
      const res = await fetch(`/api/subadmin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, device_id: deviceId, max_devices: maxDevices })
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["subadmin-data"] });
      if (vars.action === "change_max_devices") {
        toast({ title: "Đã cập nhật giới hạn thiết bị" });
      } else {
        toast({ title: "Thao tác thành công" });
      }
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered: UserData[] = users;
  const assignedUser = users.find(u => u.id === showAssign);
  const maxUsers = me?.max_managed_users ?? 10;
  const isAdmin = me?.role === "ADMIN";
  const atLimit = !isAdmin && (me?.current_managed ?? 0) >= maxUsers;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1a1a2e]">👥 Quản lý người dùng</h1>
          {!isAdmin && me && (
            <p className="text-sm text-muted-foreground mt-0.5">
              Đã tạo <strong className="text-brand">{me.current_managed}</strong> / {maxUsers} tài khoản
              {atLimit && <span className="ml-2 text-red-500 font-semibold">⚠️ Đã đạt giới hạn</span>}
            </p>
          )}
        </div>
        <Button variant="brand"
          disabled={atLimit}
          title={atLimit ? `Đã đạt giới hạn ${maxUsers} tài khoản` : ""}
          onClick={() => {
            setShowCreate(true);
            setTempPw("");
            setNewEmail("");
            setNewRole("USER");
            setSelectedGroup(managedGroups[0]?.group_id || "");
          }}>
          <Plus className="w-4 h-4" /> Tạo user
        </Button>
      </div>

      {/* Limit bar (subadmin only) */}
      {!isAdmin && me && (
        <div className="mb-5 bg-white rounded-xl border-2 border-[#f0e0e7] p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-semibold text-[#1a1a2e]">Hạn mức tài khoản (Tổng các nhóm)</span>
            <span className="text-muted-foreground">{me.current_managed} / {maxUsers}</span>
          </div>
          <div className="h-2 bg-[#f0e0e7] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${atLimit ? "bg-red-500" : "bg-brand"}`}
              style={{ width: `${Math.min(100, (me.current_managed / maxUsers) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <Input placeholder="🔍 Tìm theo email..." value={search}
        onChange={e => { setSearch(e.target.value); setPage(1); }} className="mb-4 max-w-sm" />

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[1050px]">
              <thead>
                <tr className="border-b-2 border-[#f0e0e7] bg-[#f8f9fa]">
                  <th className="text-left p-3 font-bold text-[#1a1a2e] w-[20%]">Email</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e] w-[8%]">Role</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e] w-[10%]">Ngày tạo</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e] w-[12%]">Flashcard</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e] w-[38%]">Tiến độ học tập</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e] w-[12%]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-[#f0e0e7] hover:bg-[#f8f9fa]">
                    <td className="p-3 font-medium text-[#1a1a2e] max-w-[200px] truncate">{u.email}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                        u.role === "SUBADMIN" ? "bg-orange-100 text-orange-700" :
                          "bg-brand-light text-brand"
                        }`}>{u.role}</span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground align-middle">
                      {(() => {
                        const decks = u.user_decks ?? [];
                        const isExpanded = expandedFlashcards.has(u.id);

                        if (decks.length === 0) return <span className="italic opacity-60">Chưa có</span>;

                        return (
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => toggleFlashcards(u.id)}
                              className="flex items-center gap-1.5 text-brand font-bold hover:underline bg-brand-light/50 px-2 py-1 rounded-lg w-fit"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>{decks.length} bộ đề</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            {isExpanded && (
                              <div className="flex flex-wrap gap-1 mt-1 p-2 bg-gray-50 rounded-xl border border-dashed border-brand/30">
                                {decks.map(ud => (
                                  <span key={ud.id}
                                    className="inline-flex items-center gap-1 bg-white text-brand rounded px-1.5 py-0.5 text-[10px] font-bold border border-brand/20 shadow-sm">
                                    <span className="truncate max-w-[90px]">{ud.deck?.title ?? "?"}</span>
                                    <button
                                      onClick={() => revokeDeck.mutate({ userId: u.id, deckId: ud.deck_id })}
                                      className="hover:text-red-500 transition-colors ml-0.5 flex-shrink-0"
                                      title="Thu hồi">×</button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-3 align-middle">
                      {/* Summary Section */}
                      <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-xl border border-gray-100 mb-1">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-brand/10">
                          <BarChart className="w-3.5 h-3.5 text-brand" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground leading-none">Tổng từ học được</span>
                            <span className="text-sm font-extrabold text-brand">
                              {u.user_decks?.reduce((s, ud) => s + (ud.learned_count ?? 0), 0) ?? 0}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-orange-100">
                          <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground leading-none">Streak cao nhất</span>
                            <span className="text-sm font-extrabold text-orange-600">
                              {Math.max(0, ...(u.user_decks?.map(ud => ud.streak ?? 0) ?? [0]))} 🔥
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs font-bold text-brand hover:bg-brand-light ml-auto"
                          onClick={() => toggleProgress(u.id)}
                        >
                          {expandedProgress.has(u.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {expandedProgress.has(u.id) ? "Đóng" : "Chi tiết"}
                        </Button>
                      </div>

                      {/* Expanded Section: Learned Decks (learned_count > 0) */}
                      {expandedProgress.has(u.id) && (
                        <div className="mt-2 space-y-1.5 border-2 border-brand-light/50 p-3 bg-white rounded-2xl shadow-inner animate-in slide-in-from-top-2 duration-200">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart className="w-3 h-3 text-brand" />
                            <h4 className="text-[10px] font-black text-brand uppercase tracking-widest">Tiến độ từng bộ đề</h4>
                          </div>
                          <div className="grid grid-cols-1 gap-1.5">
                            {(u.user_decks ?? []).filter(ud => (ud.learned_count ?? 0) > 0).length > 0 ? (
                              (u.user_decks ?? [])
                                .filter(ud => (ud.learned_count ?? 0) > 0)
                                .map(ud => (
                                  <div key={ud.id} className="text-[11px] flex justify-between items-center p-2 bg-brand-light/20 rounded-lg border border-brand/5">
                                    <span className="font-bold text-[#1a1a2e] truncate">{ud.deck?.title}</span>
                                    <span className="bg-white px-2 py-0.5 rounded-full border border-brand/20 text-brand font-black whitespace-nowrap">
                                      {ud.learned_count} từ · {ud.streak} 🔥
                                    </span>
                                  </div>
                                ))
                            ) : (
                              <p className="text-[10px] italic text-muted-foreground text-center py-2">Chưa có tiến độ học tập nào</p>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5 flex-wrap">
                        {/* Giao đề */}
                        <Button size="sm" variant="outline" className="w-8 h-8 p-0" title="Giao Flashcard"
                          onClick={() => { setShowAssign(u.id); setAssignDeckIds(new Set()); setAssignExpiry(""); }}>
                          <BookOpen className="w-4 h-4" />
                        </Button>
                        {/* Thiết bị */}
                        <Button size="sm" variant="outline" className="w-8 h-8 p-0 text-purple-700 hover:bg-purple-50" title="Quản lý thiết bị"
                          onClick={() => { setEditMaxDevicesLocal(u.max_devices?.toString() || ""); setShowDevices(u); }}>
                          <Shield className="w-4 h-4" />
                        </Button>
                        {/* Toggle role USER ↔ SUBADMIN */}
                        <Button size="sm" variant="outline" className="w-8 h-8 p-0"
                          title={u.role === "SUBADMIN" ? "Hạ xuống USER" : "Nâng lên SubAdmin"}
                          disabled={changeRole.isPending}
                          onClick={() => {
                            const newR = u.role === "SUBADMIN" ? "USER" : "SUBADMIN";
                            if (confirm(`Đổi quyền ${u.email} → ${newR}?`))
                              changeRole.mutate({ userId: u.id, role: newR });
                          }}>
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                        {/* Reset PW */}
                        <Button size="sm" variant="outline" className="w-8 h-8 p-0" title="Reset mật khẩu"
                          disabled={resetPw.isPending}
                          onClick={() => resetPw.mutate({ userId: u.id, email: u.email })}>
                          <Key className="w-4 h-4" />
                        </Button>
                        {/* Delete */}
                        <Button size="sm" variant="outline" className="w-8 h-8 p-0 text-red-500 hover:text-red-600" title="Xóa người dùng"
                          onClick={() => { if (confirm(`Xóa tài khoản ${u.email}?`)) deleteUser.mutate(u.id); }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {users.length === 0 ? "Chưa có người dùng nào. Nhấn \"Tạo user\" để bắt đầu." : "Không tìm thấy."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-[#f0e0e7] px-4 py-2 bg-gray-50/50">
            <PaginationControls
              currentPage={page}
              totalPages={pagination?.totalPages ?? 1}
              pageSize={pageSize}
              totalItems={pagination?.totalItems ?? users.length}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setPage(1);
              }}
              itemName="học viên"
            />
          </div>
        </div>
      )}

      {/* ════ Dialog: Create User ════ */}
      <Dialog open={showCreate} onOpenChange={v => {
        setShowCreate(v);
        if (!v) {
          setTempPw("");
          setAssignAllDecks(false);
          setCreateAssignExpiry("");
        }
      }}>
        <DialogContent className="max-w-sm">
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
              <Button className="w-full" variant="brand" onClick={() => { setShowCreate(false); setTempPw(""); setAssignAllDecks(false); setCreateAssignExpiry(""); }}>Đóng</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  placeholder="user@example.com" className="mt-1" />
              </div>
              <div>
                <Label>Mật khẩu (Mặc định: goidangkyflashcard)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Để trống dùng mặc định"
                    className="flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    title="Tạo mật khẩu ngẫu nhiên"
                    onClick={() => setNewPassword(Math.random().toString(36).slice(-8))}
                    className="flex-shrink-0"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {managedGroups.length > 1 && (
                <div>
                  <Label>Nhóm quản lý</Label>
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {managedGroups.map(mg => (
                        <SelectItem key={mg.group_id} value={mg.group_id}>{mg.groups.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Quyền Phần Mềm</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER — Học viên</SelectItem>
                    <SelectItem value="SUBADMIN">SUBADMIN — Quản lý nhóm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2 border-t space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="assignAllGroupDecks"
                    checked={assignAllDecks}
                    onChange={e => setAssignAllDecks(e.target.checked)}
                    className="w-4 h-4 accent-brand cursor-pointer rounded"
                  />
                  <label htmlFor="assignAllGroupDecks" className="text-sm font-medium cursor-pointer select-none">
                    Gán tất cả Flashcard hiện có của nhóm
                  </label>
                </div>
                {assignAllDecks && (
                  <div className="pl-6 space-y-1">
                    <Label htmlFor="createAssignExpiry" className="text-xs font-medium">Ngày hết hạn Flashcard</Label>
                    <Input
                      id="createAssignExpiry"
                      type="date"
                      value={createAssignExpiry}
                      onChange={e => setCreateAssignExpiry(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-[11px] text-muted-foreground italic">
                      Để trống sẽ dùng thời gian mặc định của Flashcard nhóm được giao. Ngày được chọn là hạn tối đa (không vượt quá hạn nhóm).
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                <Button variant="brand" disabled={!newEmail || createUser.isPending}
                  onClick={() => createUser.mutate({
                    email: newEmail,
                    role: newRole,
                    password: newPassword,
                    groupId: selectedGroup,
                    assignAllDecks,
                    expiredAt: createAssignExpiry,
                  })}>
                  {createUser.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Tạo
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Assign Decks ════ */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>📚 Giao Flashcard — {assignedUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
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
            <SubAssignDeckList
              decks={decks}
              assignedUser={assignedUser}
              assignDeckIds={assignDeckIds}
              setAssignDeckIds={setAssignDeckIds}
            />
            <div>
              <Label>Ngày hết hạn</Label>
              <Input type="date" value={assignExpiry}
                onChange={e => setAssignExpiry(e.target.value)} className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1 text-red-500 font-semibold italic">Không được vượt quá hạn của nhóm (nếu có)</p>
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setShowAssign(null)}>Hủy</Button>
            <Button variant="brand"
              disabled={assignDeckIds.size === 0 || assignDeck.isPending}
              onClick={() => assignDeck.mutate({ userId: showAssign!, deckIds: Array.from(assignDeckIds), expiredAt: assignExpiry ? assignExpiry + "T23:59:59Z" : "" })}>
              {assignDeck.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Giao {assignDeckIds.size > 0 ? `${assignDeckIds.size} đề` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Device Management ════ */}
      <Dialog open={!!showDevices} onOpenChange={() => setShowDevices(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-purple-700">📱 Quản lý thiết bị: {showDevices?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-purple-50 p-3 rounded-lg">
              <Label className="text-purple-800 text-xs font-bold uppercase">Giới hạn Max Devices</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" min="1" value={editMaxDevicesLocal} placeholder="Theo hạn của nhóm" className="h-8 text-sm" onChange={e => setEditMaxDevicesLocal(e.target.value)} />
                <Button variant="brand" size="sm" className="h-8" onClick={() => updateDeviceInfo.mutate({ userId: showDevices!.id, action: "change_max_devices", maxDevices: editMaxDevicesLocal ? parseInt(editMaxDevicesLocal) : null })}>Lưu</Button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {!showDevices?.user_devices?.length ? <p className="text-sm italic text-gray-400 text-center py-4">Chưa có thiết bị nào.</p> : (
                showDevices.user_devices.map(dev => (
                  <div key={dev.device_id} className="p-3 border rounded-lg bg-gray-50 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{dev.device_name || "Thiết bị không tên"}</p>
                      <p className="text-[10px] text-gray-500">Last seen: {new Date(dev.last_seen).toLocaleString()}</p>
                    </div>
                    <Button variant="destructive" size="sm" className="h-7 text-[10px]" onClick={() => updateDeviceInfo.mutate({ userId: showDevices.id, action: "remove_device", deviceId: dev.device_id })}>Khai trừ</Button>
                  </div>
                ))
              )}
            </div>

            <Button variant="destructive" className="w-full" disabled={!showDevices?.user_devices?.length}
              onClick={() => { if (confirm("Đăng xuất user khỏi tất cả thiết bị?")) updateDeviceInfo.mutate({ userId: showDevices!.id, action: "reset_devices" }); }}>
              Reset & Đăng xuất mọi nơi
            </Button>
          </div>
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
                onClick={() => { if (resetResult) { navigator.clipboard.writeText(resetResult.pw); setResetCopied(true); setTimeout(() => setResetCopied(false), 2000); } }}>
                {resetCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button className="w-full" variant="brand"
              onClick={() => { setShowResetDlg(false); setResetResult(null); }}>Đóng</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Deck assign checkbox list ──────────────────────────────────────────────────
interface SubAssignDeckListProps {
  decks: DeckItem[];
  assignedUser: UserData | undefined;
  assignDeckIds: Set<string>;
  setAssignDeckIds: (s: Set<string>) => void;
}

function SubAssignDeckList({ decks, assignedUser, assignDeckIds, setAssignDeckIds }: SubAssignDeckListProps) {
  const assignable = decks.filter(d =>
    !assignedUser?.user_decks?.some(ud => ud.deck_id === d.id)
  );
  const allSelected = assignable.length > 0 && assignable.every(d => assignDeckIds.has(d.id));

  function toggleAll() {
    const next = new Set(assignDeckIds);
    if (allSelected) { assignable.forEach(d => next.delete(d.id)); }
    else { assignable.forEach(d => next.add(d.id)); }
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
        <Label>Chọn Flashcard <span className="font-normal text-muted-foreground">(có thể chọn nhiều)</span></Label>
        {assignable.length > 0 && (
          <button type="button" onClick={toggleAll}
            className="text-xs font-semibold text-brand hover:underline flex-shrink-0">
            {allSelected ? "✕ Bỏ chọn tất cả" : "✓ Chọn tất cả"}
          </button>
        )}
      </div>
      {decks.length === 0 ? (
        <p className="text-xs text-muted-foreground">Bạn chưa được phân quyền Flashcard nào cho nhóm.</p>
      ) : (
        <div className="max-h-52 overflow-y-auto border-2 border-[#f0e0e7] rounded-xl divide-y divide-[#f0e0e7]">
          {decks.map(d => {
            const alreadyHas = assignedUser?.user_decks?.some(ud => ud.deck_id === d.id);
            const checked = assignDeckIds.has(d.id);
            return (
              <label key={d.id} className={[
                "flex items-center gap-3 px-3 py-2.5 transition-colors",
                alreadyHas ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:bg-brand-light",
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
                    {d.level || ""}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}
      {assignDeckIds.size > 0 && (
        <p className="text-xs text-brand font-semibold mt-1.5">Đã chọn {assignDeckIds.size} Flashcard</p>
      )}
    </div>
  );
}
