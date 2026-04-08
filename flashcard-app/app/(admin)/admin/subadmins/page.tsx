"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Settings, BookOpen, Plus, Shield, 
  ChevronDown, ChevronRight, UserCog, Trash2, 
  Users, ShieldCheck, Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DeckItem { id: string; title: string; }
interface GroupDeck { deck_id: string; expired_at: string | null; deck?: { title: string } }
interface UserDeviceItem { id: string; device_id: string; device_name?: string; ip_address?: string; last_seen: string; }
interface UserDeckItem { deck_id: string; expired_at: string | null; progress_percent: number; learned_count: number; deck?: { title: string } }
interface GroupMember {
  id: string; email: string; role: string; created_at: string; max_devices?: number;
  is_group_subadmin: boolean;
  device_count: number;
  deck_count: number;
  user_devices: UserDeviceItem[];
  user_decks: UserDeckItem[];
  decks: { id: string, title: string }[];
}
interface GroupData {
  id: string; name: string; max_users: number; max_device_per_user: number;
  user_count: number;
  group_decks: GroupDeck[];
  group_users: GroupMember[];
}

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchAdminData(): Promise<{ groups: GroupData[]; decks: DeckItem[]; allUsers: {id:string, email:string}[] }> {
  const [groupsRes, decksRes, usersRes] = await Promise.all([
    fetch("/api/admin/subadmins"),
    fetch("/api/admin/decks"),
    fetch("/api/admin/users"),
  ]);
  const groupsJson = await groupsRes.json();
  const decksJson  = await decksRes.json();
  const usersJson  = await usersRes.json();
  
  return {
    groups: groupsJson.groups ?? [],
    decks: decksJson.decks ?? [],
    allUsers: (usersJson.users ?? []).map((u:any) => ({ id: u.id, email: u.email }))
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminSubAdminsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  // Default: collapsed -> empty set
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group Modals
  const [editGroup, setEditGroup] = useState<GroupData | null>(null);
  const [showGroupDecks, setShowGroupDecks] = useState<GroupData | null>(null);
  const [showAddMember, setShowAddMember] = useState<GroupData | null>(null);
  const [showDeleteGroup, setShowDeleteGroup] = useState<GroupData | null>(null);

  // Member Modals
  const [editingMember, setEditingMember] = useState<{ groupId: string, user: GroupMember } | null>(null);
  
  // Custom Modals
  const [showingUserDecks, setShowingUserDecks] = useState<GroupMember | null>(null);
  const [showingUserDevices, setShowingUserDevices] = useState<GroupMember | null>(null);
  const [manageDecksIds, setManageDecksIds] = useState<Set<string>>(new Set());
  const [manageDecksExpiry, setManageDecksExpiry] = useState("");
  const [editMaxDevicesLocal, setEditMaxDevicesLocal] = useState("");

  // Selectable states for dialogs
  const [selectedUserForGroup, setSelectedUserForGroup] = useState<string>("none");
  const [selectedDeckForGroup, setSelectedDeckForGroup] = useState<string>("none");
  const [deckExpiry, setDeckExpiry] = useState("");

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ["admin-group-dashboard"],
    queryFn: fetchAdminData,
  });
  const groups = data?.groups ?? [];
  const decks = data?.decks ?? [];
  const allUsers = data?.allUsers ?? [];

  // Mutations
  const updateGroup = useMutation({
    mutationFn: async ({ id, name, max_users, max_device_per_user }: { id: string, name: string, max_users: number, max_device_per_user: number }) => {
      const res = await fetch(`/api/admin/subadmins/groups/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, max_users, max_device_per_user }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fail");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-group-dashboard"] }); setEditGroup(null); toast({ title: "Đã cập nhật cấu hình nhóm" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const groupAction = useMutation({
    mutationFn: async ({ groupId, action, payload }: { groupId: string, action: string, payload: any }) => {
      const res = await fetch(`/api/admin/subadmins/groups/${groupId}/actions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fail");
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-group-dashboard"] });
      if (vars.action === "add_member") { setShowAddMember(null); setSelectedUserForGroup("none"); }
      if (vars.action === "assign_group_deck") { setDeckExpiry(""); setSelectedDeckForGroup("none"); }
      toast({ title: "Thành công" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteGroup = useMutation({
    mutationFn: async (id: string) => {
       const res = await fetch(`/api/admin/subadmins/groups/${id}`, { method: "DELETE" });
       if (!res.ok) throw new Error((await res.json()).error ?? "Fail");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-group-dashboard"] }); setShowDeleteGroup(null); toast({ title: "Đã xoá nhóm" }); },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Fail");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-group-dashboard"] }); toast({ title: "Đã xoá tài khoản" }); },
  });

  const updateUserInfo = useMutation({
    mutationFn: async ({ id, role, max_devices }: { id: string, role: string, max_devices: number | null }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_info", role, max_devices })
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-group-dashboard"] });
      setEditingMember(null);
      toast({ title: "Đã cập nhật thông tin cá nhân user" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const assignUserDeck = useMutation({
    mutationFn: async ({ userId, deckIds, expiredAt }: { userId: string; deckIds: string[]; expiredAt: string }) => {
      for (const deckId of deckIds) {
        const res = await fetch(`/api/admin/users/${userId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "assign_deck", deck_id: deckId, expired_at: expiredAt || null }),
        });
        if (!res.ok) throw new Error("Failed");
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-group-dashboard"] }); setManageDecksIds(new Set()); setManageDecksExpiry(""); toast({ title: "Giao thêm đề riêng thành công!" }); },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const revokeUserDeck = useMutation({
    mutationFn: async ({ userId, deckId }: { userId: string; deckId: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_deck", deck_id: deckId }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-group-dashboard"] }); toast({ title: "Đã thu hồi bộ đề cá nhân" }); },
  });

  const updateUserDeckProgress = useMutation({
    mutationFn: async (args: { userId: string, deckId: string, progress_percent?: number, learned_count?: number, expiredAt?: string | null }) => {
      const res = await fetch(`/api/admin/users/${args.userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_deck_progress", deck_id: args.deckId, progress_percent: args.progress_percent, learned_count: args.learned_count, expired_at: args.expiredAt })
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-group-dashboard"] }); toast({ title: "Đã cập nhật bản ghi đề cá nhân" }); },
  });

  const removeDevice = useMutation({
    mutationFn: async ({ userId, device_id }: { userId: string, device_id: string }) => {
       await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_device", device_id })
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-group-dashboard"] }); toast({ title: "Đã xoá thiết bị rác" }); },
  });

  const resetAllDevices = useMutation({
    mutationFn: async (userId: string) => {
       await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_devices" })
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-group-dashboard"] }); toast({ title: "Đã đăng xuất User khỏi mọi nơi" }); },
  });

  // Handlers
  const toggleExpand = (id: string) => {
    const next = new Set(expandedGroups);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedGroups(next);
  };

  const filteredGroups = useMemo(() => {
    let list = groups;
    if (search) {
      list = groups.filter(g => 
        g.name.toLowerCase().includes(search.toLowerCase()) || 
        g.group_users.some(u => u.email.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Prioritize SYSTEM_ADMIN_CREATED and SYSTEM_REGISTERED
    return [...list].sort((a, b) => {
      const systemGroups = ["SYSTEM_ADMIN_CREATED", "SYSTEM_REGISTERED"];
      const aIsSystem = systemGroups.includes(a.name);
      const bIsSystem = systemGroups.includes(b.name);
      if (aIsSystem && !bIsSystem) return -1;
      if (!aIsSystem && bIsSystem) return 1;
      return 0; // maintain original relative order otherwise
    });
  }, [groups, search]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e]">🏷️ Quản Lý Nhóm & SubAdmin</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý thành viên, phân quyền bộ đề và tài khoản theo từng đơn vị nhóm.</p>
        </div>
        <div className="flex gap-3">
          <Input placeholder="🔍 Tìm nhóm hoặc email..." value={search} onChange={e=>setSearch(e.target.value)} className="w-72 bg-white" />
        </div>
      </div>

      <div className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-500">Không tìm thấy nhóm dữ liệu nào.</div>
        ) : filteredGroups.map(group => (
          <div key={group.id} className="bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden transition-all shadow-sm">
            
            {/* ════ GROUP HEADER ════ */}
            <div className={`p-4 flex items-center justify-between flex-wrap gap-3 cursor-pointer hover:bg-gray-50 transition-colors ${expandedGroups.has(group.id) ? "border-b-2 border-[#f0e0e7] bg-gray-50" : ""}`}
              onClick={() => toggleExpand(group.id)}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-light rounded-xl text-brand">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="font-bold text-[#1a1a2e] text-lg flex items-center gap-2">
                     {group.name}
                     {["SYSTEM_ADMIN_CREATED", "SYSTEM_REGISTERED"].includes(group.name) && (
                       <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded font-extrabold flex items-center gap-1 uppercase">
                         <ShieldCheck className="w-2.5 h-2.5" /> Hệ Thống
                       </span>
                     )}
                     <span className="text-xs font-normal text-gray-400">#{group.id.slice(0,8)}</span>
                   </h3>
                   <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                     <span className="bg-white px-2 py-0.5 rounded border">
                       Thành viên: <strong className="text-brand">{group.user_count}</strong> / {group.max_users}
                     </span>
                     <span className="bg-white px-2 py-0.5 rounded border">
                       Bộ đề nhóm: <strong className="text-blue-600">{group.group_decks.length}</strong>
                     </span>
                   </div>
                </div>
              </div>

              {/* Group Actions */}
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="outline" className="h-9 gap-1.5" title="Quản lý bộ đề dùng chung toàn nhóm" onClick={() => { setDeckExpiry(""); setSelectedDeckForGroup("none"); setShowGroupDecks(group); }}>
                  <BookOpen className="w-3.5 h-3.5" /> Quản lý Đề Nhóm
                </Button>
                <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => setShowAddMember(group)}>
                  <Plus className="w-3.5 h-3.5" /> Thêm Thành Viên
                </Button>
                <Button size="icon" variant="outline" className="h-9 w-9" title="Cài đặt Max Users" onClick={() => setEditGroup(group)}>
                  <Settings className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="h-9 w-9 text-red-500 hover:bg-red-50 border-red-200" title="Xoá Nhóm An Toàn" onClick={() => setShowDeleteGroup(group)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                <div className="ml-2 pl-4 border-l border-gray-200 flex items-center">
                  {expandedGroups.has(group.id) ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </div>
              </div>
            </div>

            {/* ════ GROUP MEMBERS (COLLAPSIBLE) ════ */}
            {expandedGroups.has(group.id) && (
              <div className="animate-in fade-in duration-200 bg-white">
                 {group.group_users.length === 0 ? (
                   <div className="p-8 text-center text-gray-400 italic text-sm">Chưa có thành viên nào.</div>
                 ) : (
                   <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                       <thead>
                         <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs uppercase text-gray-500">
                           <th className="px-4 py-3 font-semibold">User / Vai trò</th>
                           <th className="px-4 py-3 font-semibold text-center w-28">Thiết bị</th>
                           <th className="px-4 py-3 font-semibold text-center w-32">Bộ đề cá nhân</th>
                           <th className="px-4 py-3 font-semibold text-center w-[200px]">Thao tác User</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                         {group.group_users.map(u => (
                           <tr key={u.id} className="hover:bg-brand-light/10 transition-colors">
                             <td className="px-4 py-3">
                               <div className="font-semibold text-[#1a1a2e] mb-1">{u.email}</div>
                               <div className="flex items-center gap-1.5 flex-wrap">
                                 <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                   u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : 
                                   u.role === "SUBADMIN" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"
                                 }`}>{u.role}</span>
                                 {u.is_group_subadmin && (
                                   <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200">
                                     <ShieldCheck className="w-3 h-3" /> QUẢN LÝ NHÓM NÀY
                                   </span>
                                 )}
                               </div>
                             </td>
                             <td className="px-4 py-3 text-center">
                               {u.device_count === 0 ? (
                                  <span className="text-gray-400 font-bold">0</span>
                               ): (
                                  <Button variant="ghost" size="sm" className="h-6 text-xs text-purple-700 font-bold bg-purple-100 hover:bg-purple-200 px-2"
                                    onClick={() => { setEditMaxDevicesLocal(u.max_devices?.toString()||""); setShowingUserDevices(u); }}>
                                    Xem ({u.device_count})
                                  </Button>
                               )}
                             </td>
                             <td className="px-4 py-3 text-center">
                               {u.deck_count === 0 ? (
                                 <Button variant="ghost" size="sm" className="h-6 text-xs text-gray-500 bg-gray-100 px-2" onClick={() => setShowingUserDecks(u)}>+ Giao lẻ</Button>
                               ) : (
                                 <Button variant="ghost" size="sm" className="h-6 text-xs text-brand font-bold bg-brand-light/50 hover:bg-brand-light px-2" onClick={() => { setManageDecksIds(new Set()); setShowingUserDecks(u); }}>
                                   QL ({u.deck_count})
                                 </Button>
                               )}
                             </td>
                             <td className="px-4 py-3">
                               <div className="flex gap-1.5 justify-center">
                                 <Button size="icon" variant="ghost" className={`h-8 w-8 ${u.is_group_subadmin ? "bg-blue-100 text-blue-700 hover:bg-blue-200" : "text-gray-400 hover:text-blue-600 hover:bg-blue-50"}`}
                                   title="Gán/Huỷ quyền SubAdmin cho Group" onClick={() => groupAction.mutate({ groupId: group.id, action: "toggle_subadmin", payload: { user_id: u.id, is_subadmin: !u.is_group_subadmin } })}>
                                   <Shield className="w-4 h-4" />
                                 </Button>
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-orange-600 hover:bg-orange-50" title="Sửa thông tin cá nhân (Role/Max Devices)"
                                   onClick={() => setEditingMember({ groupId: group.id, user: u })}>
                                   <UserCog className="w-4 h-4" />
                                 </Button>
                                 <div className="w-px bg-gray-200 mx-1"></div>
                                 <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" title="Xoá vĩnh viễn User"
                                   onClick={() => { if(confirm(`Cảnh báo: Bạn muốn Xoá hoàn toàn tài khoản ${u.email} khỏi hệ thống?`)) deleteUser.mutate(u.id); }}>
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               </div>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ════ MODALS: GROUP ACTIONS ════ */}
      
      <Dialog open={!!editGroup} onOpenChange={() => setEditGroup(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cài đặt Nhóm: {editGroup?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Tên nhóm</Label>
              <Input value={editGroup?.name} onChange={e => setEditGroup(prev => prev ? {...prev, name: e.target.value} : null)} className="mt-1" />
            </div>
            <div>
              <Label>Số thiết bị tối đa mỗi User</Label>
              <Input type="number" min={1} value={editGroup?.max_device_per_user} 
                onChange={e => setEditGroup(prev => prev ? {...prev, max_device_per_user: parseInt(e.target.value)} : null)} className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">Giới hạn số thiết bị tối đa cho mỗi thành viên trong nhóm này.</p>
            </div>
            <DialogFooter>
              <Button variant="brand" className="w-full" disabled={updateGroup.isPending}
                onClick={()=>updateGroup.mutate({id: editGroup!.id, name: editGroup!.name, max_users: editGroup!.max_users, max_device_per_user: editGroup!.max_device_per_user})}>Xác nhận cập nhật</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showGroupDecks} onOpenChange={() => setShowGroupDecks(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tài nguyên Nhóm: {showGroupDecks?.name}</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">Toàn bộ thành viên trong nhóm sẽ có quyền truy cập chung vào các bộ đề này (không thể sửa cho từng người).</p>
          </DialogHeader>
          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label className="uppercase text-xs font-bold text-gray-500 tracking-wider">Đề đã cấp cho nhóm</Label>
              {!showGroupDecks?.group_decks.length ? <p className="text-sm italic text-gray-500 border-2 border-dashed p-4 text-center rounded-xl bg-gray-50">Chưa cấp bộ đề chung nào.</p> : (
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                   {showGroupDecks.group_decks.map(gd => (
                     <div key={gd.deck_id} className="p-3 border rounded-xl flex items-center justify-between bg-white shadow-sm hover:border-brand-light transition">
                       <div>
                         <p className="font-bold text-sm text-[#1a1a2e] flex items-center gap-2">
                           <BookOpen className="w-3.5 h-3.5 text-brand" /> {gd.deck?.title}
                         </p>
                         <p className="text-[10px] font-semibold text-red-500 mt-1">{gd.expired_at ? `⏳ Hết hạn: ${new Date(gd.expired_at).toLocaleString()}` : "∞ Dùng vĩnh viễn"}</p>
                       </div>
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full" title="Rút đề"
                        onClick={() => groupAction.mutate({ groupId: showGroupDecks.id, action: "revoke_group_deck", payload: { deck_id: gd.deck_id }})}><Trash2 className="w-4 h-4"/></Button>
                     </div>
                   ))}
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t space-y-3 bg-brand-light/30 p-4 rounded-xl border border-brand-light">
              <Label className="text-brand font-bold uppercase text-xs tracking-wider">Mở khoá thêm đề nhóm</Label>
              <Select value={selectedDeckForGroup} onValueChange={setSelectedDeckForGroup}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Chọn bộ đề" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Chọn một bộ đề --</SelectItem>
                  {decks.filter(d => !showGroupDecks?.group_decks.some(gd => gd.deck_id === d.id)).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div>
                 <Label className="text-xs">Hết hạn (Tuỳ chọn)</Label>
                 <Input type="datetime-local" value={deckExpiry} onChange={e=>setDeckExpiry(e.target.value)} className="mt-1 bg-white" />
              </div>
              <Button variant="brand" className="w-full" disabled={selectedDeckForGroup === "none" || groupAction.isPending}
                onClick={() => groupAction.mutate({ groupId: showGroupDecks!.id, action: "assign_group_deck", payload: { deck_id: selectedDeckForGroup, expired_at: deckExpiry } })}>Giao cho toàn nhóm</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showAddMember} onOpenChange={() => setShowAddMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Bổ sung Thành Viên</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
             <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm">
                Bạn đang thêm thành viên vào khối <strong>{showAddMember?.name}</strong>. User khi vào nhóm sẽ kế thừa các quyền chung của nhóm.
             </div>
             <div>
               <Label>Kéo User Có Sẵn Vào Nhóm</Label>
               <Select value={selectedUserForGroup} onValueChange={setSelectedUserForGroup}>
                 <SelectTrigger className="mt-1"><SelectValue placeholder="Tìm theo email" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">-- Chọn email người dùng --</SelectItem>
                   {allUsers.filter(u => !showAddMember?.group_users.some(mu => mu.id === u.id)).map(u => (
                     <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Button variant="brand" className="w-full mt-3" disabled={selectedUserForGroup === "none" || groupAction.isPending}
                  onClick={() => groupAction.mutate({ groupId: showAddMember!.id, action: "add_member", payload: { user_id: selectedUserForGroup } })}>Xác nhận Thêm</Button>
             </div>
             
             <div className="relative text-center py-2 text-xs text-gray-400">
                <div className="absolute inset-x-0 top-1/2 border-t border-gray-100"></div>
                <span className="relative z-10 bg-white px-3 font-semibold uppercase">Hoặc</span>
             </div>
             
             <Button variant="outline" className="w-full h-12 text-blue-600 border-blue-200 border-2 hover:bg-blue-50 font-bold" 
               onClick={() => window.location.href="/admin/users"}>Tạo Tài Khoản Mới tại QL.User</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE WIZARD */}
      <Dialog open={!!showDeleteGroup} onOpenChange={() => setShowDeleteGroup(null)}>
        <DialogContent className={`${showDeleteGroup?.group_users.length ? 'max-w-3xl' : 'max-w-sm'}`}>
          <DialogHeader><DialogTitle className="text-red-600 font-extrabold text-xl flex items-center gap-2"><Trash2 className="w-5 h-5"/> Wizard Xoá Nhóm An Toàn</DialogTitle></DialogHeader>
          {showDeleteGroup?.group_users.length ? (
            <div className="space-y-4 py-2">
               <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 text-sm font-semibold">
                 ⚠️ CHẶN: Nhóm <span className="underline">{showDeleteGroup.name}</span> này vẫn còn {showDeleteGroup.group_users.length} thành viên đang hoạt động. 
                 <br/><br/>Hệ thống bắt buộc bạn phải Migrate (Chuyển Nhóm) hoặc Xoá từng người dùng trước khi huỷ cấu trúc nhóm này!
               </div>
               <div className="max-h-[40vh] overflow-y-auto border-2 rounded-xl divide-y">
                  {showDeleteGroup.group_users.map(u => (
                    <div key={u.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
                      <div>
                        <div className="text-sm font-bold text-[#1a1a2e]">{u.email}</div>
                        <div className="text-[10px] text-gray-500">Role: {u.role} | Thiết bị: {u.device_count}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => window.location.href=`/admin/users`}>Chuyển qua nhóm khác</Button>
                        <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => deleteUser.mutate(u.id)}>Xoá vĩnh viễn User</Button>
                      </div>
                    </div>
                  ))}
               </div>
               <p className="text-sm font-bold text-center text-gray-500 bg-gray-100 py-3 rounded-lg">Hãy F5 (Tải lại trang) khi danh sách trống để nút Xoá Nhóm sáng lên.</p>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <p className="text-sm font-medium text-gray-700">Khối nhóm <span className="font-bold text-[#1a1a2e]">{showDeleteGroup?.name}</span> đã "sạch" thành viên.<br/><br/>Xác nhận huỷ toàn bộ dữ liệu (Bao gồm Tên nhóm và Quyền truy cập Đề Nhóm)?</p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteGroup(null)}>Huỷ, giữ lại</Button>
                <Button variant="destructive" onClick={() => deleteGroup.mutate(showDeleteGroup!.id)} disabled={deleteGroup.isPending}>Vâng, Xoá 100%</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════ MODALS: MEMBER ACTIONS ════ */}
      
      {/* 1. Manage User Decks (Specific user) */}
      <Dialog open={!!showingUserDecks} onOpenChange={() => setShowingUserDecks(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader><DialogTitle className="text-brand">Bộ đề cá nhân của: {showingUserDecks?.email}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            
            {/* Existing Decks */}
            <div>
              <Label className="text-xs uppercase text-gray-500 font-bold tracking-wider mb-2 block">Các bộ đề đã cấp lẻ</Label>
              {!showingUserDecks?.user_decks?.length ? (
                <div className="text-sm italic text-gray-500 border border-dashed border-gray-200 p-4 text-center rounded-lg bg-gray-50">Không có bộ đề cá nhân.</div>
              ) : (
                <div className="space-y-2">
                  {showingUserDecks.user_decks.map(ud => (
                    <UserDeckEditor key={ud.deck_id} ud={ud} 
                       onUpdate={(args) => updateUserDeckProgress.mutate({ userId: showingUserDecks.id, deckId: ud.deck_id, ...args })}
                       onRevoke={() => { if(confirm("Thu hồi bộ đề này khỏi user?")) revokeUserDeck.mutate({ userId: showingUserDecks.id, deckId: ud.deck_id }) }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Assign New */}
            <div className="bg-brand-light/30 border border-brand-light rounded-xl p-4 space-y-3">
               <Label className="uppercase text-xs font-bold text-brand tracking-wider">Cấp thêm bộ đề mới</Label>
               <div className="max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg divide-y">
                 {decks.filter(d => !showingUserDecks?.user_decks.some(ud => ud.deck_id === d.id)).length === 0 ? (
                   <p className="p-3 text-xs text-gray-400 italic text-center">User đã có tất cả bộ đề trong hệ thống.</p>
                 ) : decks.filter(d => !showingUserDecks?.user_decks.some(ud => ud.deck_id === d.id)).map(d => {
                    const checked = manageDecksIds.has(d.id);
                    return (
                      <label key={d.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-light transition">
                         <input type="checkbox" checked={checked} onChange={e => {
                           const next = new Set(manageDecksIds);
                           if (e.target.checked) next.add(d.id); else next.delete(d.id);
                           setManageDecksIds(next);
                         }} className="accent-brand flex-shrink-0" />
                         <span className={`text-sm ${checked ? "font-bold text-brand" : "text-gray-700"}`}>{d.title}</span>
                      </label>
                    )
                 })}
               </div>
               <div>
                 <Label className="text-xs">Hết hạn (Tuỳ chọn)</Label>
                 <Input type="datetime-local" value={manageDecksExpiry} onChange={e=>setManageDecksExpiry(e.target.value)} className="mt-1 bg-white" />
               </div>
               <Button className="w-full" variant="brand" disabled={manageDecksIds.size === 0 || assignUserDeck.isPending}
                 onClick={() => assignUserDeck.mutate({ userId: showingUserDecks!.id, deckIds: Array.from(manageDecksIds), expiredAt: manageDecksExpiry })}>
                 Giao {manageDecksIds.size} bộ đề đã chọn
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Manage User Devices */}
      <Dialog open={!!showingUserDevices} onOpenChange={() => setShowingUserDevices(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-purple-700 flex items-center gap-2"><Smartphone className="w-5 h-5"/> Quản lý Thiết bị: {showingUserDevices?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
             <div className="bg-purple-50 border border-purple-100 p-3 rounded-lg flex items-center gap-3">
               <div className="flex-1">
                 <Label className="text-purple-800 text-xs font-bold uppercase tracking-wider">Giới hạn Max Devices</Label>
                 <div className="flex gap-2 mt-1">
                   <Input type="number" min="1" value={editMaxDevicesLocal} placeholder="Mặc định Hệ thống" className="bg-white h-8 text-sm" onChange={e => setEditMaxDevicesLocal(e.target.value)} />
                   <Button variant="outline" size="sm" className="h-8 border-purple-200 text-purple-700 hover:bg-purple-100" onClick={() => updateUserInfo.mutate({ id: showingUserDevices!.id, role: showingUserDevices!.role, max_devices: editMaxDevicesLocal ? parseInt(editMaxDevicesLocal) : null })}>Lưu Max</Button>
                 </div>
               </div>
             </div>

             <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
               {!showingUserDevices?.user_devices.length ? <p className="text-sm italic text-gray-400 text-center py-4">Chưa có thiết bị nào đang sử dụng.</p> : (
                 showingUserDevices.user_devices.map(dev => (
                   <div key={dev.device_id} className="p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-between">
                     <div>
                       <p className="font-semibold text-sm text-[#1a1a2e]">{dev.device_name || "Thiết bị không rõ tên"}</p>
                       <p className="text-[10px] text-gray-500 font-mono mt-0.5">IP: {dev.ip_address || "N/A"}</p>
                       <p className="text-[10px] text-brand font-semibold mt-1">Last seen: {new Date(dev.last_seen).toLocaleString()}</p>
                     </div>
                     <Button variant="destructive" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-wider" 
                       onClick={() => removeDevice.mutate({ userId: showingUserDevices.id, device_id: dev.device_id })}>Xoá Session</Button>
                   </div>
                 ))
               )}
             </div>

             <div className="pt-4 border-t">
               <Button variant="destructive" className="w-full" disabled={!showingUserDevices?.user_devices.length}
                 onClick={() => { if(confirm("Đăng xuất tất cả thiết bị của người dùng này?")) resetAllDevices.mutate(showingUserDevices!.id); }}>
                 Reset & Đăng xuất mọi nơi
               </Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Edit Member Info (Role / Details) */}
      <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Thông tin cá nhân: {editingMember?.user.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
               <Label>Quyền Phẩn Mềm (Role cá nhân)</Label>
               <Select value={editingMember?.user.role} onValueChange={val => setEditingMember(prev => prev ? {...prev, user: {...prev.user, role: val}} : null)}>
                 <SelectTrigger className="mt-1 font-semibold"><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="USER">USER</SelectItem>
                   <SelectItem value="SUBADMIN">SUBADMIN (Hệ thống)</SelectItem>
                   <SelectItem value="ADMIN">ADMIN</SelectItem>
                 </SelectContent>
               </Select>
               <p className="text-[10px] text-gray-500 mt-1">Lưu ý: Role hệ thống khác với quyền Subadmin Quản lý Nhóm.</p>
            </div>
            <div className="border-t pt-3">
               <Label>Max Devices Hiện Tại (Riêng Lẻ)</Label>
               <Input type="number" min="1" value={editingMember?.user.max_devices || ""} placeholder="Trống = Theo Hệ Thống"
                 onChange={e => setEditingMember(prev => prev ? {...prev, user: {...prev.user, max_devices: parseInt(e.target.value) || undefined}} : null)} className="mt-1" />
            </div>
            <DialogFooter className="border-t pt-3">
              <Button variant="brand" className="w-full" disabled={updateUserInfo.isPending}
                onClick={() => updateUserInfo.mutate({ id: editingMember!.user.id, role: editingMember!.user.role, max_devices: editingMember!.user.max_devices || null })}>Lưu thay đổi</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ── Separator component ───────────────────────────────────────────────────
function Separator({ className }: { className?: string }) {
  return <div className={`h-px bg-gray-100 ${className}`} />;
}

// ── User Deck Progress Editor ─────────────────────────────────────────────
function UserDeckEditor({ ud, onUpdate, onRevoke }: { ud: UserDeckItem, onUpdate: (a: any) => void, onRevoke: () => void }) {
  const [editing, setEditing] = useState(false);
  
  const toLocalInput = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [exp, setExp] = useState(toLocalInput(ud.expired_at));
  const [prog, setProg] = useState((ud.progress_percent || 0).toString());
  const [learn, setLearn] = useState((ud.learned_count || 0).toString());

  const isExp = ud.expired_at ? new Date(ud.expired_at) < new Date() : false;

  if (!editing) return (
    <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm flex justify-between items-center group">
      <div>
        <p className="font-bold text-sm text-[#1a1a2e] flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-brand" /> {ud.deck?.title}
        </p>
        <p className="text-[10px] text-gray-500 mt-1">
          Tiến độ: <span className="font-bold text-brand">{ud.progress_percent}%</span> ({ud.learned_count} từ)
        </p>
        <p className={`text-[10px] font-semibold mt-1 flex ${isExp ? "text-red-500" : "text-gray-400"}`}>
          {ud.expired_at ? `⏳ Hạn: ${new Date(ud.expired_at).toLocaleString()}` : "∞ Dùng vĩnh viễn"}
        </p>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="outline" size="sm" className="h-7 text-xs bg-gray-50" onClick={() => setEditing(true)}>Sửa</Button>
        <Button variant="ghost" size="sm" className="h-7 text-red-500 hover:bg-red-50 hover:text-red-600 rounded" onClick={onRevoke} title="Thu hồi"><Trash2 className="w-4 h-4"/></Button>
      </div>
    </div>
  );

  return (
    <div className="p-3 border-2 border-brand-light rounded-lg bg-blue-50/50 space-y-3 shadow-sm">
      <p className="font-bold text-sm text-brand">{ud.deck?.title}</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tiến độ (%)</Label>
          <Input type="number" min="0" max="100" value={prog} onChange={e=>setProg(e.target.value)} className="h-8 max-w-[100px] mt-1 bg-white" />
        </div>
        <div>
          <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Từ đã học</Label>
          <Input type="number" min="0" value={learn} onChange={e=>setLearn(e.target.value)} className="h-8 max-w-[120px] mt-1 bg-white" />
        </div>
      </div>
      <div>
        <Label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Hết hạn</Label>
        <div className="flex items-center gap-2 mt-1">
          <Input type="datetime-local" value={exp} onChange={e=>setExp(e.target.value)} className="flex-1 h-8 bg-white"/>
          <Button variant="outline" size="sm" className="h-8 text-xs bg-white text-gray-500" onClick={()=>setExp("")}>Bỏ hạn</Button>
        </div>
      </div>
      <div className="flex gap-2 pt-2 border-t border-blue-100">
        <Button size="sm" variant="brand" className="h-8 flex-1" onClick={() => {
          onUpdate({ progress_percent: parseInt(prog)||0, learned_count: parseInt(learn)||0, expiredAt: exp||null });
          setEditing(false);
        }}>Lưu thay đổi</Button>
        <Button size="sm" variant="ghost" className="h-8 text-gray-500 hover:bg-gray-200" onClick={() => setEditing(false)}>Hủy</Button>
      </div>
    </div>
  )
}
