"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Settings, BookOpen, UserMinus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface SubAdminUser {
  id: string; email: string; role: string; created_at: string;
  max_managed_users: number;
  managed_count: number;
  user_decks?: { id: string; deck_id: string; expired_at: string | null; deck?: { title: string } }[];
}
interface DeckItem { id: string; title: string; level?: string; word_count?: number }

async function fetchSubAdmins(): Promise<{ subadmins: SubAdminUser[]; decks: DeckItem[] }> {
  const [saRes, dRes] = await Promise.all([
    fetch("/api/admin/subadmins"),
    fetch("/api/admin/decks"),
  ]);
  const saJson = await saRes.json();
  const dJson  = await dRes.json();
  return {
    subadmins: saJson.subadmins ?? [],
    decks:     dJson.decks ?? [],
  };
}

export default function AdminSubAdminsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [showSettings, setShowSettings] = useState<SubAdminUser | null>(null);
  const [maxUsers,     setMaxUsers]     = useState("10");
  const [showDecks,    setShowDecks]    = useState<SubAdminUser | null>(null);
  const [deckIds,      setDeckIds]      = useState<Set<string>>(new Set());
  const [expiry,       setExpiry]       = useState("");
  const [search,       setSearch]       = useState("");
  const [showDelete,   setShowDelete]   = useState<SubAdminUser | null>(null);
  const [deleteUserIds, setDeleteUserIds] = useState<Set<string>>(new Set());
  const [managedUsers, setManagedUsers]  = useState<{ id: string; email: string; role: string }[]>([]);

  // Fetch managed users when delete dialog opens
  async function openDeleteDialog(sa: SubAdminUser) {
    const res = await fetch(`/api/admin/subadmins/${sa.id}/managed`);
    let managed: { id: string; email: string; role: string }[] = [];
    if (res.ok) {
      const d = await res.json();
      managed = d.users ?? [];
    }
    setManagedUsers(managed);
    setDeleteUserIds(new Set());
    setShowDelete(sa);
  }

  const deleteSubAdmin = useMutation({
    mutationFn: async ({ saId, deleteIds }: { saId: string; deleteIds: string[] }) => {
      const res = await fetch(`/api/admin/subadmins/${saId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteUserIds: deleteIds }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subadmins"] });
      setShowDelete(null);
      toast({ title: "Đã xóa SubAdmin" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subadmins"],
    queryFn: fetchSubAdmins,
  });
  const subadmins = data?.subadmins ?? [];
  const decks     = data?.decks ?? [];

  // Set max_managed_users
  const updateLimit = useMutation({
    mutationFn: async ({ userId, max }: { userId: string; max: number }) => {
      const res = await fetch(`/api/admin/subadmins/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_limit", max_managed_users: max }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subadmins"] });
      setShowSettings(null);
      toast({ title: "Đã cập nhật giới hạn tài khoản" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  // Assign deck to subadmin
  const assignDeck = useMutation({
    mutationFn: async ({ userId, dIds, exp }: { userId: string; dIds: string[]; exp: string }) => {
      for (const deckId of dIds) {
        const res = await fetch(`/api/admin/subadmins/${userId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "assign_deck", deck_id: deckId, expired_at: exp || null }),
        });
        if (!res.ok) throw new Error("Failed");
      }
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["admin-subadmins"] });
      setShowDecks(null); setDeckIds(new Set()); setExpiry("");
      toast({ title: `Giao ${v.dIds.length} bộ đề cho SubAdmin thành công!` });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  // Revoke deck from subadmin
  const revokeDeck = useMutation({
    mutationFn: async ({ userId, deckId }: { userId: string; deckId: string }) => {
      const res = await fetch(`/api/admin/subadmins/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_deck", deck_id: deckId }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subadmins"] });
      toast({ title: "Đã thu hồi bộ đề" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const filtered = subadmins.filter(s => s.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-[#1a1a2e]">🛡️ Quản lý SubAdmin</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Thiết lập quyền hạn và bộ đề cho từng SubAdmin
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-5">
          💡 SubAdmin quản lý giao diện tại <strong>/subadmin</strong>. Chỉ có thể thấy và giao những bộ đề bạn đã phân quyền cho họ.
        </div>

        <Input placeholder="🔍 Tìm SubAdmin..." value={search}
          onChange={e => setSearch(e.target.value)} className="mb-4 max-w-sm" />

        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-[#f0e0e7] p-10 text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="font-bold text-[#1a1a2e] mb-2">Chưa có SubAdmin nào</h3>
            <p className="text-muted-foreground text-sm">
              Tạo tài khoản với role SUBADMIN trong{" "}
              <a href="/admin/users" className="text-brand font-semibold hover:underline">Quản lý người dùng</a>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map(sa => (
              <div key={sa.id}
                className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-[#1a1a2e]">{sa.email}</span>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                        SUBADMIN
                      </span>
                    </div>
                    {/* Progress */}
                    <div className="flex items-center gap-3 mt-2">
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        Tài khoản: <strong className="text-[#1a1a2e]">{sa.managed_count}</strong> / {sa.max_managed_users ?? 10}
                      </div>
                      <div className="flex-1 h-1.5 bg-[#f0e0e7] rounded-full overflow-hidden max-w-[120px]">
                        <div className="h-full bg-brand rounded-full"
                          style={{ width: `${Math.min(100, (sa.managed_count / (sa.max_managed_users ?? 10)) * 100)}%` }} />
                      </div>
                    </div>
                    {/* Decks */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(sa.user_decks ?? []).length === 0
                        ? <span className="text-xs text-muted-foreground">Chưa có bộ đề</span>
                        : (sa.user_decks ?? []).map(ud => {
                          const isExp = ud.expired_at ? new Date(ud.expired_at) < new Date() : false;
                          return (
                            <span key={ud.id}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${isExp ? "bg-red-100 text-red-600" : "bg-brand-light text-brand"}`}>
                              {ud.deck?.title ?? "?"}
                              {ud.expired_at && (
                                <span className="text-[10px] opacity-70 ml-0.5">
                                  ({new Date(ud.expired_at).toLocaleDateString("vi-VN")})
                                </span>
                              )}
                              <button
                                onClick={() => revokeDeck.mutate({ userId: sa.id, deckId: ud.deck_id })}
                                className="hover:text-red-500 transition-colors ml-0.5" title="Thu hồi">×</button>
                            </span>
                          );
                        })
                      }
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap flex-shrink-0">
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                      onClick={() => { setShowDecks(sa); setDeckIds(new Set()); setExpiry(""); }}>
                      <BookOpen className="w-3.5 h-3.5" /> Giao bộ đề
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs"
                      onClick={() => { setShowSettings(sa); setMaxUsers(String(sa.max_managed_users ?? 10)); }}>
                      <Settings className="w-3.5 h-3.5" /> Giới hạn
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs text-red-500 hover:text-red-700"
                      onClick={() => openDeleteDialog(sa)}>
                      <UserMinus className="w-3.5 h-3.5" /> Xóa
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ Dialog: Set limit ════ */}
        <Dialog open={!!showSettings} onOpenChange={() => setShowSettings(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>⚙️ Giới hạn tài khoản</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                SubAdmin: <strong>{showSettings?.email}</strong>
              </p>
              <div>
                <Label>Số tài khoản tối đa SubAdmin này có thể tạo</Label>
                <Input type="number" min={1} max={9999}
                  value={maxUsers} onChange={e => setMaxUsers(e.target.value)} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  Hiện đang quản lý <strong>{showSettings?.managed_count ?? 0}</strong> tài khoản
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSettings(null)}>Hủy</Button>
              <Button variant="brand"
                disabled={updateLimit.isPending || !maxUsers}
                onClick={() => updateLimit.mutate({ userId: showSettings!.id, max: parseInt(maxUsers) })}>
                {updateLimit.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ════ Dialog: Assign Decks to SubAdmin ════ */}
        <Dialog open={!!showDecks} onOpenChange={() => setShowDecks(null)}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>📚 Giao bộ đề cho — {showDecks?.email}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 overflow-y-auto flex-1 pr-1">
              {(showDecks?.user_decks ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">Đã có:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(showDecks?.user_decks ?? []).map(ud => (
                      <span key={ud.id} className="text-xs bg-brand-light text-brand px-2 py-0.5 rounded-full font-semibold">
                        {ud.deck?.title ?? "?"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <AdminAssignDeckList
                decks={decks}
                assignedUser={showDecks}
                deckIds={deckIds}
                setDeckIds={setDeckIds}
              />
              <div>
                <Label>Ngày hết hạn quyền truy cập</Label>
                <Input type="datetime-local" value={expiry}
                  onChange={e => setExpiry(e.target.value)} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Để trống = không giới hạn thời gian</p>
              </div>
            </div>
            <DialogFooter className="mt-3">
              <Button variant="outline" onClick={() => setShowDecks(null)}>Hủy</Button>
              <Button variant="brand"
                disabled={deckIds.size === 0 || assignDeck.isPending}
                onClick={() => assignDeck.mutate({ userId: showDecks!.id, dIds: Array.from(deckIds), exp: expiry })}>
                {assignDeck.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Giao {deckIds.size > 0 ? `${deckIds.size} đề` : ""}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ════ Dialog: Xóa SubAdmin ════ */}
      <Dialog open={!!showDelete} onOpenChange={() => setShowDelete(null)}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>🗑️ Xóa SubAdmin — {showDelete?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <p className="text-sm text-muted-foreground">
              SubAdmin này đang quản lý <strong>{managedUsers.length}</strong> người dùng.
              Chọn những tài khoản sẽ bị <strong className="text-red-500">xóa theo</strong>.
              Các tài khoản không được chọn sẽ được chuyển về quản lý trực tiếp bởi Admin.
            </p>
            {managedUsers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Tài khoản do SubAdmin quản lý</Label>
                  <button type="button"
                    className="text-xs font-semibold text-red-500 hover:underline"
                    onClick={() => {
                      if (deleteUserIds.size === managedUsers.length) {
                        setDeleteUserIds(new Set());
                      } else {
                        setDeleteUserIds(new Set(managedUsers.map(u => u.id)));
                      }
                    }}>
                    {deleteUserIds.size === managedUsers.length ? "☐ Bỏ chọn tất cả" : "☑ Xóa tất cả"}
                  </button>
                </div>
                <div className="max-h-52 overflow-y-auto border-2 border-[#f0e0e7] rounded-xl divide-y divide-[#f0e0e7]">
                  {managedUsers.map(u => (
                    <label key={u.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-red-50 ${
                        deleteUserIds.has(u.id) ? "bg-red-50" : ""
                      }`}>
                      <input type="checkbox"
                        checked={deleteUserIds.has(u.id)}
                        onChange={e => {
                          const next = new Set(deleteUserIds);
                          if (e.target.checked) next.add(u.id);
                          else next.delete(u.id);
                          setDeleteUserIds(next);
                        }}
                        className="w-4 h-4 accent-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold truncate ${deleteUserIds.has(u.id) ? "text-red-600" : "text-[#1a1a2e]"}`}>
                          {u.email}
                        </div>
                        <div className="text-xs text-muted-foreground">{u.role}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {deleteUserIds.size > 0 && (
                  <p className="text-xs text-red-500 font-semibold mt-1.5">
                    ⚠️ Sẽ xóa vĩnh viễn {deleteUserIds.size} tài khoản
                  </p>
                )}
                {deleteUserIds.size < managedUsers.length && managedUsers.length > 0 && (
                  <p className="text-xs text-green-600 font-semibold mt-1">
                    ✓ {managedUsers.length - deleteUserIds.size} tài khoản sẽ được giữ lại (chuyển về Admin)
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setShowDelete(null)}>Hủy</Button>
            <Button variant="destructive"
              disabled={deleteSubAdmin.isPending}
              onClick={() => deleteSubAdmin.mutate({ saId: showDelete!.id, deleteIds: Array.from(deleteUserIds) })}>
              {deleteSubAdmin.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Xóa SubAdmin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Deck checkbox list ─────────────────────────────────────────────────────────
interface AdminAssignDeckListProps {
  decks: DeckItem[];
  assignedUser: SubAdminUser | null;
  deckIds: Set<string>;
  setDeckIds: (s: Set<string>) => void;
}

function AdminAssignDeckList({ decks, assignedUser, deckIds, setDeckIds }: AdminAssignDeckListProps) {
  const assignable = decks.filter(d =>
    !assignedUser?.user_decks?.some(ud => ud.deck_id === d.id)
  );
  const allSelected = assignable.length > 0 && assignable.every(d => deckIds.has(d.id));

  function toggleAll() {
    const next = new Set(deckIds);
    if (allSelected) { assignable.forEach(d => next.delete(d.id)); }
    else             { assignable.forEach(d => next.add(d.id)); }
    setDeckIds(next);
  }
  function toggleOne(id: string, checked: boolean) {
    const next = new Set(deckIds);
    if (checked) next.add(id); else next.delete(id);
    setDeckIds(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label>Chọn bộ đề <span className="font-normal text-muted-foreground">(nhiều)</span></Label>
        {assignable.length > 0 && (
          <button type="button" onClick={toggleAll}
            className="text-xs font-semibold text-brand hover:underline">
            {allSelected ? "✕ Bỏ chọn tất cả" : "✓ Chọn tất cả"}
          </button>
        )}
      </div>
      <div className="max-h-52 overflow-y-auto border-2 border-[#f0e0e7] rounded-xl divide-y divide-[#f0e0e7]">
        {decks.map(d => {
          const alreadyHas = assignedUser?.user_decks?.some(ud => ud.deck_id === d.id);
          const checked    = deckIds.has(d.id);
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
      {deckIds.size > 0 && (
        <p className="text-xs text-brand font-semibold mt-1.5">Đã chọn {deckIds.size} bộ đề</p>
      )}
    </div>
  );
}
