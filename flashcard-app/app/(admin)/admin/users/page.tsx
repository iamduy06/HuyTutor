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
interface DeckItem { id: string; title: string; level?: string; word_count?: number; }
interface UserDeckItem { id: string; deck_id: string; expired_at: string | null; deck?: { title: string }; }
interface UserData {
  id: string; email: string; role: string; created_at: string;
  group_id?: string | null;
  group?: { id: string; name: string } | null;
  user_decks?: UserDeckItem[];
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

async function fetchGroups(): Promise<any[]> {
  const res = await fetch("/api/admin/groups");
  const data = await res.json();
  return data.groups ?? [];
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [selGroupId, setSelGroupId] = useState("NONE");
  const [newGroupName, setNewGroupName] = useState("");
  const [tempPw, setTempPw] = useState("");
  const [copied, setCopied] = useState(false);

  const [showDecks, setShowDecks] = useState<UserData | null>(null);
  const [showAssign, setShowAssign] = useState<string | null>(null);
  const [assignDeckIds, setAssignDeckIds] = useState<Set<string>>(new Set());
  const [assignExpiry, setAssignExpiry] = useState("");

  const [showResetDlg, setShowResetDlg] = useState(false);
  const [resetResult, setResetResult] = useState<{ email: string; pw: string } | null>(null);
  
  const [showDeleteSubAdmin, setShowDeleteSubAdmin] = useState<{ subadmin: UserData; groupUsers: UserData[] } | null>(null);
  const [deleteIds, setDeleteIds] = useState<Set<string>>(new Set());
  const [keepIds, setKeepIds] = useState<Set<string>>(new Set());
  const [transferId, setTransferId] = useState<string | null>(null);

  // ── Queries ──
  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });
  const { data: decks = [] } = useQuery({ queryKey: ["admin-decks-list"], queryFn: fetchDecks });
  const { data: groups = [] } = useQuery({ queryKey: ["admin-groups"], queryFn: fetchGroups });

  // ── Mutations ──
  const createUser = useMutation({
    mutationFn: async (vars: any) => {
      const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vars) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: d => { setTempPw(d.tempPassword); qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["admin-groups"] }); toast({ title: "Tạo thành công!" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteSubAdmin = useMutation({
    mutationFn: async (vars: any) => {
      const res = await fetch(`/api/admin/subadmins/${vars.saId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vars) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["admin-groups"] }); setShowDeleteSubAdmin(null); toast({ title: "Đã xóa SubAdmin và cập nhật nhóm" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => { const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "Đã xóa user" }); },
  });

  const resetPw = useMutation({
    mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reset_password" }) });
      const d = await res.json();
      return { pw: d.tempPassword, email };
    },
    onSuccess: d => { setResetResult(d); setShowResetDlg(true); },
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
       await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "change_role", role }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "Đã cập nhật quyền" }); },
  });

  const assignDeck = useMutation({
    mutationFn: async ({ userId, deckIds, expiredAt }: { userId: string; deckIds: string[]; expiredAt: string }) => {
      for (const deckId of deckIds) {
        await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assign_deck", deck_id: deckId, expired_at: expiredAt || null }) });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setShowAssign(null); toast({ title: "Đã giao bộ đề" }); },
  });

  const revokeDeck = useMutation({
    mutationFn: async ({ userId, deckId }: { userId: string; deckId: string }) => {
      await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke_deck", deck_id: deckId }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "Đã thu hồi" }); },
  });

  // ── Derived State ──
  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));
  const groupsMap = filtered.reduce((acc, u) => {
    const gid = u.group_id || "ADMIN_MANAGED";
    if (!acc[gid]) acc[gid] = { name: u.group?.name || "👑 ADMIN MANAGED", users: [] };
    acc[gid].users.push(u);
    return acc;
  }, {} as Record<string, { name: string; users: UserData[] }>);

  const adminManaged = groupsMap["ADMIN_MANAGED"]?.users ?? [];
  const otherGroups = Object.entries(groupsMap).filter(([id]) => id !== "ADMIN_MANAGED");

  const openAssign = (id: string) => { setAssignDeckIds(new Set()); setAssignExpiry(""); setShowAssign(id); };
  const assignedUser = users.find(u => u.id === showAssign);

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold text-[#1a1a2e]">👥 Quản lý người dùng</h1>
        <Button variant="brand" onClick={() => { setShowCreate(true); setTempPw(""); setNewEmail(""); setNewPassword(""); setNewRole("USER"); setSelGroupId("NONE"); }}>
          <Plus className="w-4 h-4" /> Tạo user
        </Button>
      </div>

      <Input placeholder="🔍 Tìm theo email..." value={search} onChange={e => setSearch(e.target.value)} className="mb-5 max-w-sm" />

      {isLoading ? <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div> : (
        <div className="flex flex-col gap-4">
          {adminManaged.length > 0 && (
            <UserGroupTable
              title="👑 Quản lý bởi Admin" titleColor="text-purple-700" bgColor="bg-purple-50 border-b border-purple-100"
              users={adminManaged} decks={decks} onAssign={openAssign} onViewDecks={setShowDecks} 
              onResetPw={(u: UserData) => resetPw.mutate({ userId: u.id, email: u.email })}
              onDelete={(u: UserData) => { if (confirm(`Xóa ${u.email}?`)) deleteUser.mutate(u.id); }}
              onChangeRole={(u: UserData, r: string) => changeRole.mutate({ userId: u.id, role: r })}
            />
          )}

          {otherGroups.map(([gid, { name, users: gUsers }]) => (
            <div key={gid} className="bg-white rounded-2xl border-2 border-orange-200 overflow-hidden">
               <div className="flex items-center justify-between px-4 py-3 bg-orange-50 border-b border-orange-100 flex-wrap gap-2">
                 <h3 className="text-sm font-bold text-orange-700">📁 {name} ({gUsers.length} TV)</h3>
               </div>
               <UserGroupTable 
                title="" users={gUsers} decks={decks} compact onAssign={openAssign} onViewDecks={setShowDecks}
                onResetPw={(u: UserData) => resetPw.mutate({ userId: u.id, email: u.email })}
                onDelete={(u: UserData) => {
                  if (u.role === "SUBADMIN") {
                    setShowDeleteSubAdmin({ subadmin: u, groupUsers: gUsers.filter(gu => gu.id !== u.id) });
                    setDeleteIds(new Set()); setKeepIds(new Set()); setTransferId(null);
                  } else {
                    if (confirm(`Xóa ${u.email}?`)) deleteUser.mutate(u.id);
                  }
                }}
                onChangeRole={(u: UserData, r: string) => changeRole.mutate({ userId: u.id, role: r })}
               />
            </div>
          ))}
        </div>
      )}

      {/* Dialog: Create User */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tạo người dùng mới</DialogTitle></DialogHeader>
          {tempPw ? (
            <div className="space-y-3">
              <p className="text-sm text-green-700 font-semibold">✅ Thành công! Mật khẩu: <code>{tempPw}</code></p>
              <Button className="w-full" variant="brand" onClick={() => setShowCreate(false)}>Đóng</Button>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="space-y-1"><Label>Email</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} /></div>
              <div className="space-y-1"><Label>Password (để trống = auto)</Label><Input value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
              <div className="space-y-1">
                <Label>Quyền</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="USER">USER</SelectItem><SelectItem value="SUBADMIN">SUBADMIN</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Nhóm</Label>
                <Select value={selGroupId} onValueChange={setSelGroupId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Admin quản lý</SelectItem>
                    <SelectItem value="NEW_GROUP">+ Tạo nhóm mới</SelectItem>
                    {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {selGroupId === "NEW_GROUP" && <div className="space-y-1"><Label>Tên nhóm</Label><Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} /></div>}
              <DialogFooter>
                <Button variant="brand" onClick={() => createUser.mutate({ email: newEmail, role: newRole, password: newPassword, group_id: selGroupId === "NONE" || selGroupId === "NEW_GROUP" ? undefined : selGroupId, group_name: selGroupId === "NEW_GROUP" ? newGroupName : undefined })}>Tạo</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Subadmin */}
      <Dialog open={!!showDeleteSubAdmin} onOpenChange={() => setShowDeleteSubAdmin(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>🗑️ Xóa SubAdmin - {showDeleteSubAdmin?.subadmin.email}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Nhóm này còn {showDeleteSubAdmin?.groupUsers.length} thành viên khác.</p>
            <div>
              <Label className="text-xs uppercase text-muted-foreground">Chuyển quyền Root cho SubAdmin khác</Label>
              <Select value={transferId || "NONE"} onValueChange={v => setTransferId(v === "NONE" ? null : v)}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn SubAdmin..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Giữ Admin quản lý (Virtual Group)</SelectItem>
                  {showDeleteSubAdmin?.groupUsers.filter(u => u.role === "SUBADMIN").map(u => (<SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            {!transferId && showDeleteSubAdmin?.groupUsers.length! > 0 && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground">Xử lý thành viên</Label>
                <div className="divide-y border rounded-xl max-h-40 overflow-y-auto">
                  {showDeleteSubAdmin?.groupUsers.map(u => (
                    <div key={u.id} className="p-2 flex items-center justify-between gap-2">
                      <span className="text-xs truncate">{u.email}</span>
                      <div className="flex gap-1">
                        <Button size="sm" variant={deleteIds.has(u.id) ? "destructive" : "outline"} className="h-7 px-2 text-xs" onClick={() => { const n = new Set(deleteIds); if (n.has(u.id)) n.delete(u.id); else n.add(u.id); setDeleteIds(n); const k = new Set(keepIds); k.delete(u.id); setKeepIds(k); }}>Xóa</Button>
                        <Button size="sm" variant={keepIds.has(u.id) ? "brand" : "outline"} className="h-7 px-2 text-xs" onClick={() => { const k = new Set(keepIds); if (k.has(u.id)) k.delete(u.id); else k.add(u.id); setKeepIds(k); const n = new Set(deleteIds); n.delete(u.id); setDeleteIds(n); }}>Giữ</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="destructive" onClick={() => deleteSubAdmin.mutate({ saId: showDeleteSubAdmin!.subadmin.id, new_owner_id: transferId, delete_user_ids: Array.from(deleteIds), keep_user_ids: Array.from(keepIds) })}>Xác nhận Xóa</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Decks View */}
      <Dialog open={!!showDecks} onOpenChange={() => setShowDecks(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>📚 Bộ đề — {showDecks?.email}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {(showDecks?.user_decks ?? []).length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Chưa có bộ đề nào.</p> : (showDecks?.user_decks ?? []).map(ud => (
              <div key={ud.id} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-sm">
                <span>{ud.deck?.title}</span>
                <Button size="sm" variant="outline" className="h-7 px-2 text-red-500" onClick={() => revokeDeck.mutate({ userId: showDecks!.id, deckId: ud.deck_id })}><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
          </div>
          <DialogFooter><Button variant="brand" onClick={() => { const id = showDecks!.id; setShowDecks(null); openAssign(id); }}>+ Giao thêm</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Assign Deck */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>📚 Giao bộ đề — {assignedUser?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="max-h-52 overflow-y-auto border rounded divide-y">
              {decks.map(d => {
                const checked = assignDeckIds.has(d.id);
                return (
                  <label key={d.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={checked} onChange={e => { const n = new Set(assignDeckIds); if (e.target.checked) n.add(d.id); else n.delete(d.id); setAssignDeckIds(n); }} />
                    <span className="text-sm">{d.title}</span>
                  </label>
                );
              })}
            </div>
            <div>
              <Label>Hạn dùng (để trống = vĩnh viễn)</Label>
              <Input type="datetime-local" value={assignExpiry} onChange={e => setAssignExpiry(e.target.value)} />
            </div>
          </div>
          <DialogFooter><Button variant="brand" disabled={assignDeckIds.size === 0} onClick={() => assignDeck.mutate({ userId: showAssign!, deckIds: Array.from(assignDeckIds), expiredAt: assignExpiry })}>Giao {assignDeckIds.size} bộ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-Components ──
function UserGroupTable({ title, titleColor, bgColor, users, compact, onAssign, onViewDecks, onResetPw, onDelete, onChangeRole }: any) {
  return (
    <div className={`bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden ${compact ? "rounded-t-none border-t-0" : ""}`}>
      {title && <div className={`px-4 py-2.5 ${bgColor}`}><h3 className={`text-sm font-bold ${titleColor}`}>{title}</h3></div>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {!compact && (
            <thead>
              <tr className="border-b-2 border-[#f0e0e7] bg-[#f8f9fa]">
                <th className="text-left p-3 font-bold text-[#1a1a2e]">Email</th>
                <th className="text-left p-3 font-bold text-[#1a1a2e]">Role</th>
                <th className="text-left p-3 font-bold text-[#1a1a2e]">Ngày tạo</th>
                <th className="text-left p-3 font-bold text-[#1a1a2e]">Thao tác</th>
              </tr>
            </thead>
          )}
          <tbody>
            {users.map((u: UserData) => (
              <tr key={u.id} className="border-b border-[#f0e0e7] hover:bg-[#f8f9fa]">
                <td className="p-3 font-medium text-[#1a1a2e]">{u.email}</td>
                <td className="p-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === "SUBADMIN" ? "bg-orange-100 text-orange-700" : "bg-brand-light text-brand"}`}>{u.role}</span>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("vi-VN")}</td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onViewDecks(u)}><BookOpen className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onResetPw(u)}><RefreshCw className="w-3 h-3" /></Button>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-red-500" onClick={() => onDelete(u)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
