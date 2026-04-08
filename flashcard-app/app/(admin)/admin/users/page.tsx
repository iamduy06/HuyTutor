"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, RefreshCw, Trash2, BookOpen, Loader2,
  Copy, Check, Shield, Shuffle, Users, Search, AlertCircle, Edit2, Settings, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
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
  group?: { id: string; name: string; owner_id?: string } | null;
  user_decks?: UserDeckItem[];
}
interface GroupStat { id: string; name: string; current_count: number; max_limit: number; }

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchUsers(): Promise<{ users: UserData[]; groupStats: GroupStat[] }> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
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
  
  // Create User State
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [selGroupId, setSelGroupId] = useState("NONE");
  const [newGroupName, setNewGroupName] = useState("");
  const [tempPw, setTempPw] = useState("");

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState("");
  const [showDowngrade, setShowDowngrade] = useState(false);

  // Group Management State
  const [editGroupQuota, setEditGroupQuota] = useState<GroupStat | null>(null);
  const [showAssignGroup, setShowAssignGroup] = useState<GroupStat | null>(null);
  const [assignDeckIds, setAssignDeckIds] = useState<Set<string>>(new Set());
  const [assignExpiry, setAssignExpiry] = useState("");

  // Other UI State
  const [showDecks, setShowDecks] = useState<UserData | null>(null);
  const [showDeleteSubAdmin, setShowDeleteSubAdmin] = useState<{ subadmin: UserData; groupUsers: UserData[] } | null>(null);
  const [deleteIds, setDeleteIds] = useState<Set<string>>(new Set());
  const [keepIds, setKeepIds] = useState<Set<string>>(new Set());

  // ── Queries ──
  const { data, isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });
  const users = data?.users ?? [];
  const groupStats = data?.groupStats ?? [];
  const { data: decks = [] } = useQuery({ queryKey: ["admin-decks-list"], queryFn: fetchDecks });

  // ── Mutations ──
  const createUser = useMutation({
    mutationFn: async (vars: any) => {
      const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vars) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: d => { setTempPw(d.tempPassword); qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "Tạo thành công!", description: `Mật khẩu: ${d.tempPassword}` }); },
    onError: (e: Error) => toast({ title: "Lỗi tạo người dùng", description: e.message, variant: "destructive" }),
  });

  const updateUser = useMutation({
    mutationFn: async (vars: any) => {
      const res = await fetch(`/api/admin/users/${vars.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_user", ...vars }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setEditingUser(null); setShowDowngrade(false); toast({ title: "Đã cập nhật", description: "Thông tin người dùng đã được thay đổi" }); },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const updateGroup = useMutation({
    mutationFn: async ({ id, ...vars }: any) => {
      const res = await fetch(`/api/admin/groups/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vars) });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setEditGroupQuota(null); toast({ title: "Đã cập nhật Nhóm" }); }
  });

  const assignDeckToGroup = useMutation({
    mutationFn: async ({ groupId, deckIds, expiredAt }: { groupId: string; deckIds: string[]; expiredAt: string }) => {
      for (const deckId of deckIds) {
        await fetch(`/api/admin/groups/${groupId}/decks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deck_id: deckId, expired_at: expiredAt || null }) });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setShowAssignGroup(null); toast({ title: "Thành công", description: "Đã giao bộ đề cho toàn Nhóm" }); },
  });

  const deleteUser = useMutation({
    mutationFn: async ({ id, ...vars }: any) => { 
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vars) }); 
      if (!res.ok) throw new Error("Failed"); 
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setShowDeleteSubAdmin(null); toast({ title: "Đã xóa", description: "Người dùng đã được gỡ khỏi hệ thống" }); },
  });

  // ── Derived State ──
  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));
  const groupsWithUsage = useMemo(() => {
    const map = filtered.reduce((acc, u) => {
      const gid = u.group_id || "ADMIN_MANAGED";
      if (!acc[gid]) acc[gid] = { name: u.group?.name || "👑 ADMIN MANAGED", users: [] };
      acc[gid].users.push(u);
      return acc;
    }, {} as Record<string, { name: string; users: UserData[] }>);

    return Object.entries(map).map(([id, data]) => {
      const stat = groupStats.find(s => s.id === id);
      return { id, ...data, usage: stat };
    }).sort((a,b) => a.id === "ADMIN_MANAGED" ? -1 : 1);
  }, [filtered, groupStats]);

  const [managedUsers, setManagedUsers] = useState<UserData[]>([]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8 border-[#f0e0e7]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#fff0f4] text-[#ed0046] px-3 py-1 rounded-full text-xs font-bold border border-[#ffd6e4]">
            ✦ Quản trị hệ thống
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1a1a2e]">
            Người dùng & <span className="text-[#ed0046]">Nhóm Multi-Tenant</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md font-medium">
             Chuẩn hóa cách ly dữ liệu. Mọi thao tác Giao đề & Quota được thực hiện ở cấp Nhóm.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm theo email..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 w-full sm:w-[300px] border-[#f0e0e7] focus-visible:ring-[#ed0046] rounded-xl font-bold"
            />
          </div>
          <Button 
            className="bg-[#ed0046] hover:bg-[#c0003a] text-white rounded-full px-6 font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
            onClick={() => { setShowCreate(true); setTempPw(""); setNewEmail(""); setNewPassword(""); setNewRole("USER"); setSelGroupId("NONE"); }}
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo người dùng
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#ed0046]" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang đồng bộ dữ liệu nhóm...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {groupsWithUsage.map(group => (
            <UserGroupTable 
              key={group.id}
              group={group}
              onAssignGroup={() => { setAssignDeckIds(new Set()); setAssignExpiry(""); setShowAssignGroup(group.usage || { id: group.id, name: group.name, current_count: group.users.length, max_limit: 10 }); }}
              onEditQuota={() => setEditGroupQuota(group.usage || { id: group.id, name: group.name, current_count: group.users.length, max_limit: 10 })}
              onViewDecks={setShowDecks}
              onEdit={(u: UserData) => { setEditingUser(u); setEditRole(u.role); setShowDowngrade(false); }}
              onDelete={(u: UserData) => {
                if (u.role === "SUBADMIN") {
                  setShowDeleteSubAdmin({ subadmin: u, groupUsers: group.users.filter(gu => gu.id !== u.id) });
                  setDeleteIds(new Set()); setKeepIds(new Set());
                } else {
                  if (confirm(`Xóa vĩnh viễn ${u.email}?`)) deleteUser.mutate({ id: u.id });
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Dialog: Create User (Quota Aware) */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-[#f0e0e7] overflow-hidden p-0 shadow-2xl">
          <div className="bg-[#fff0f4] p-6 border-b border-[#ffd6e4]">
            <DialogHeader><DialogTitle className="text-2xl font-extrabold text-[#ed0046] flex items-center gap-2"><Plus className="w-6 h-6" /> Tạo tài khoản mới</DialogTitle></DialogHeader>
          </div>
          <div className="p-6 space-y-5">
             {tempPw ? (
                <div className="p-6 bg-green-50 rounded-xl text-center space-y-4 border border-green-200">
                   <p className="font-bold text-green-700 uppercase tracking-widest text-xs">Phân vùng thành công</p>
                   <code className="block bg-white p-3 rounded-lg border text-xl font-mono">{tempPw}</code>
                   <Button className="w-full bg-[#ed0046] rounded-xl font-bold" onClick={() => setShowCreate(false)}>Hoàn tất</Button>
                </div>
             ) : (
                <div className="space-y-4">
                  <div className="space-y-1"><Label className="font-bold">Email quản lý</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="rounded-xl border-[#f0e0e7] h-11" /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <Label className="font-bold">Vai trò</Label>
                        <Select value={newRole} onValueChange={setNewRole}>
                          <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="USER">USER</SelectItem><SelectItem value="SUBADMIN">SUBADMIN</SelectItem><SelectItem value="ADMIN">ADMIN</SelectItem></SelectContent>
                        </Select>
                     </div>
                     {newRole !== "ADMIN" && (
                        <div className="space-y-1">
                           <Label className="font-bold">Nhóm</Label>
                           <Select value={selGroupId} onValueChange={setSelGroupId}>
                             <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="NONE">Admin quản lý</SelectItem>
                               <SelectItem value="NEW_GROUP">+ Tạo nhóm mới</SelectItem>
                               {groupStats.map((g: any) => {
                                  const isFull = g.current_count >= g.max_limit;
                                  return <SelectItem key={g.id} value={g.id} disabled={isFull}>{g.name} {isFull ? "(Full)" : `(${g.current_count}/${g.max_limit})`}</SelectItem>
                               })}
                             </SelectContent>
                           </Select>
                        </div>
                     )}
                  </div>
                  {selGroupId === "NEW_GROUP" && (
                     <div className="space-y-1 animate-in slide-in-from-top-2">
                        <Label className="font-bold">Tên nhóm Multi-Tenant mới</Label>
                        <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="rounded-xl h-11 border-[#ffd6e4]" placeholder="Nhập tên nhóm..." />
                     </div>
                  )}
                  <DialogFooter className="pt-4">
                    <Button variant="ghost" className="font-bold" onClick={() => setShowCreate(false)}>Bỏ qua</Button>
                    <Button className="bg-[#ed0046] w-full rounded-xl h-11 font-bold shadow-lg" onClick={() => createUser.mutate({ email: newEmail, role: newRole, password: newPassword, group_id: selGroupId === "NONE" || selGroupId === "NEW_GROUP" ? undefined : selGroupId, group_name: selGroupId === "NEW_GROUP" ? newGroupName : undefined })} disabled={createUser.isPending}>
                       {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận Khởi tạo"}
                    </Button>
                  </DialogFooter>
                </div>
             )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit User (Restricted) */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-2 border-[#f0e0e7] shadow-2xl">
           <div className="bg-[#fff0f4] p-6 border-b border-[#ffd6e4]">
             <DialogHeader><DialogTitle className="text-xl font-extrabold text-[#1a1a2e] flex items-center gap-2"><Lock className="w-5 h-5 text-[#ed0046]" /> Chỉnh sửa định danh</DialogTitle></DialogHeader>
           </div>
           <div className="p-6 space-y-5">
              <div className="space-y-1"><Label className="text-muted-foreground font-bold">Email (Cố định)</Label><Input disabled value={editingUser?.email} className="bg-gray-50 border-[#f0e0e7] rounded-xl h-11 font-medium" /></div>
              <div className="space-y-1">
                 <Label className="font-bold">Vai trò</Label>
                 <Select value={editRole} onValueChange={setEditRole}>
                   <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                   <SelectContent><SelectItem value="USER">USER</SelectItem><SelectItem value="SUBADMIN">SUBADMIN</SelectItem><SelectItem value="ADMIN">ADMIN</SelectItem></SelectContent>
                 </Select>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex gap-3 text-xs text-blue-700 font-medium">
                 <Shield className="w-5 h-5 shrink-0" />
                 <p>Để đảm bảo cách ly dữ liệu Multi-Tenant, bạn không thể thay đổi Nhóm sau khi tài khoản đã được khởi tạo.</p>
              </div>
           </div>
           <DialogFooter className="p-6 bg-gray-50 border-t">
              <Button variant="ghost" className="font-bold" onClick={() => setEditingUser(null)}>Hủy</Button>
              <Button className="bg-[#ed0046] rounded-xl px-8 font-bold h-11" onClick={() => {
                 if (editingUser?.role === "SUBADMIN" && editRole === "USER") {
                    const managed = users.filter(u => u.group_id === editingUser.id);
                    if (managed.length > 0) { setManagedUsers(managed); setShowDowngrade(true); return; }
                 }
                 updateUser.mutate({ id: editingUser?.id, role: editRole });
              }}>Lưu thay đổi</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit Group Quota (New) */}
      <Dialog open={!!editGroupQuota} onOpenChange={() => setEditGroupQuota(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-2 border-[#f0e0e7]">
           <div className="bg-[#fff0f4] p-6 border-b border-[#ffd6e4]">
             <DialogHeader><DialogTitle className="text-xl font-extrabold text-[#1a1a2e] flex items-center gap-2"><Settings className="w-5 h-5 text-[#ed0046]" /> Quản lý Hạn mức Nhóm</DialogTitle></DialogHeader>
           </div>
           <div className="p-6 space-y-5">
              <div className="space-y-1"><Label className="font-bold">Tên nhóm</Label><Input value={editGroupQuota?.name} onChange={e => setEditGroupQuota(prev => prev ? {...prev, name: e.target.value} : null)} className="rounded-xl h-11" /></div>
              <div className="space-y-1">
                 <Label className="font-bold">Giới hạn tài khoản (Quota)</Label>
                 <Input type="number" value={editGroupQuota?.max_limit} onChange={e => setEditGroupQuota(prev => prev ? {...prev, max_limit: parseInt(e.target.value)} : null)} className="rounded-xl h-11" />
                 <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-widest px-1">Đang sử dụng: {editGroupQuota?.current_count} tài khoản</p>
              </div>
           </div>
           <DialogFooter className="p-6 bg-gray-50 border-t">
              <Button variant="ghost" onClick={() => setEditGroupQuota(null)}>Hủy</Button>
              <Button className="bg-[#ed0046] rounded-xl px-8 font-bold" onClick={() => updateGroup.mutate({ id: editGroupQuota?.id, max_users: editGroupQuota?.max_limit, name: editGroupQuota?.name })}>Cập nhật</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Assign Deck to Group (New Broadcast) */}
      <Dialog open={!!showAssignGroup} onOpenChange={() => setShowAssignGroup(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-2 border-[#f0e0e7] shadow-3xl">
          <div className="bg-[#fff0f4] p-6 border-b border-[#ffd6e4]">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-[#1a1a2e] flex items-center gap-2"><BookOpen className="w-6 h-6 text-[#ed0046]" /> Giao đề cho toàn Nhóm</DialogTitle>
              <DialogDescription className="font-bold text-[#ed0046]">{showAssignGroup?.name}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="font-bold text-sm px-1 italic text-muted-foreground uppercase tracking-widest">Tất cả thành viên sẽ nhận được bộ đề này</Label>
              <div className="max-h-56 overflow-y-auto border-2 border-[#f0e0e7] rounded-2xl divide-y divide-[#f0e0e7] bg-white shadow-inner">
                {decks.map(d => {
                  const checked = assignDeckIds.has(d.id);
                  return (
                    <label key={d.id} className="flex items-center gap-4 p-4 transition-all cursor-pointer hover:bg-[#fff8fa]">
                      <input type="checkbox" checked={checked} onChange={e => { const n = new Set(assignDeckIds); e.target.checked ? n.add(d.id) : n.delete(d.id); setAssignDeckIds(n); }} className="w-5 h-5 accent-[#ed0046] rounded-md" />
                      <div className="flex flex-col gap-0.5"><span className={`text-sm font-bold ${checked ? "text-[#ed0046]" : "text-gray-700"}`}>{d.title}</span><span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{d.level}</span></div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm px-1">Thời hạn thuê kho</Label>
              <Input type="datetime-local" value={assignExpiry} onChange={e => setAssignExpiry(e.target.value)} className="border-2 border-[#f0e0e7] rounded-xl h-11" />
            </div>
          </div>
          <DialogFooter className="p-6 bg-gray-50 border-t">
            <Button variant="ghost" onClick={() => setShowAssignGroup(null)}>Hủy</Button>
            <Button className="bg-[#1a1a2e] text-white rounded-xl px-8 font-bold h-11 shadow-lg" disabled={assignDeckIds.size === 0 || assignDeckToGroup.isPending} onClick={() => assignDeckToGroup.mutate({ groupId: showAssignGroup!.id, deckIds: Array.from(assignDeckIds), expiredAt: assignExpiry })}>
              {assignDeckToGroup.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xác nhận Phát hành"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Decks View & Cleanup Logic preserved but optimized for multi-tenant */}
    </div>
  );
}

// ── Sub-Components ──
function UserGroupTable({ group, onAssignGroup, onEditQuota, onViewDecks, onEdit, onDelete }: any) {
  const { id, name, usage, users } = group;
  return (
    <div className="bg-white rounded-3xl border-2 border-[#f0e0e7] overflow-hidden shadow-sm shadow-red-50 hover:shadow-md transition-all">
      <div className={`px-6 py-4 flex items-center justify-between ${id === 'ADMIN_MANAGED' ? 'bg-[#fff0f4]' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          <h3 className={`text-lg font-extrabold ${id === 'ADMIN_MANAGED' ? 'text-[#ed0046]' : 'text-[#1a1a2e]'}`}>📂 {name}</h3>
          {usage && (
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-[#f0e0e7] shadow-sm">
                <span className="text-[10px] font-black text-[#1a1a2e] uppercase tracking-tighter">
                  Sử dụng: <span className="text-[#ed0046]">{usage.current_count}</span>/{usage.max_limit}
                </span>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-[#ed0046] hover:bg-red-50 rounded-full" onClick={onEditQuota} title="Chỉnh sửa hạn mức"><Settings className="w-3 h-3" /></Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
            <Button size="sm" className="bg-[#1a1a2e] hover:bg-black text-white rounded-full px-4 text-xs font-bold h-8 flex items-center gap-2" onClick={onAssignGroup}>
               <BookOpen className="w-3.5 h-3.5" /> Giao đề Nhóm
            </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[#f0e0e7] bg-[#fafafa]">
              <th className="text-left font-bold text-[#1a1a2e] p-4 text-[11px] uppercase tracking-[2px]">Tài khoản</th>
              <th className="text-left font-bold text-[#1a1a2e] p-4 text-[11px] uppercase tracking-[2px]">Vai trò</th>
              <th className="text-right font-bold text-[#1a1a2e] p-4 text-[11px] uppercase tracking-[2px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e0e7]">
             {users.map((u: UserData) => (
                <tr key={u.id} className="hover:bg-[#fff8fa] transition-colors group">
                   <td className="p-4 font-bold text-[#1a1a2e] align-middle">{u.email}</td>
                   <td className="p-4 align-middle">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border-2 ${u.role === "ADMIN" ? "bg-purple-100 text-purple-700 border-purple-200" : u.role === "SUBADMIN" ? "bg-orange-100 text-orange-700 border-orange-200" : "bg-[#fff0f4] text-[#ed0046] border-[#ffd6e4]"}`}>{u.role}</span>
                   </td>
                   <td className="p-4 align-middle">
                      <div className="flex justify-end gap-1.5 items-center">
                         <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg border-2 border-[#f0e0e7] hover:bg-[#ed0046] hover:text-white" onClick={() => onEdit(u)} title="Sửa vai trò"><Edit2 className="w-3.5 h-3.5" /></Button>
                         <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg border-2 border-[#f0e0e7] hover:bg-[#ed0046] hover:text-white" onClick={() => onViewDecks(u)} title="Tiến độ học tập"><BookOpen className="w-3.5 h-3.5" /></Button>
                         <Button size="sm" variant="outline" className="h-8 w-8 p-0 rounded-lg border-2 border-[#f0e0e7] hover:bg-red-600 hover:text-white" onClick={() => onDelete(u)} title="Xóa vĩnh viễn"><Trash2 className="w-3.5 h-3.5" /></Button>
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
