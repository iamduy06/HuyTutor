"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, RefreshCw, Trash2, BookOpen, Loader2,
  Users, Search, Edit2, Shield, Lock, Trash
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
interface UserData {
  id: string; email: string; role: string; created_at: string;
  memberships?: { group: { id: string; name: string }; is_subadmin: boolean }[];
}
interface GroupItem { id: string; name: string; description?: string; }
interface DeckItem { id: string; title: string; level?: string; }

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchUsers(): Promise<{ users: UserData[] }> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

async function fetchGroups(): Promise<{ groups: GroupItem[] }> {
  const res = await fetch("/api/admin/groups");
  if (!res.ok) throw new Error("Failed to fetch groups");
  return res.json();
}

async function fetchDecks(): Promise<{ decks: DeckItem[] }> {
  const res = await fetch("/api/admin/decks");
  if (!res.ok) throw new Error("Failed to fetch decks");
  return res.json();
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  
  // Create User State
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [selGroupId, setSelGroupId] = useState("da000000-0000-0000-0000-000000000000"); // ADMIN_MANAGED
  const [tempPw, setTempPw] = useState("");

  // Edit User State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editGroup, setEditGroup] = useState("");

  // Assign Deck state
  const [showAssign, setShowAssign] = useState<UserData | null>(null);
  const [selectedDeck, setSelectedDeck] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  // ── Queries ──
  const { data, isLoading } = useQuery({ queryKey: ["admin-users-flat"], queryFn: fetchUsers });
  const users = data?.users ?? [];
  const { data: groupData } = useQuery({ queryKey: ["admin-groups-list"], queryFn: fetchGroups });
  const groups = groupData?.groups ?? [];
  const { data: deckData } = useQuery({ queryKey: ["admin-decks-list"], queryFn: fetchDecks });
  const decks = deckData?.decks ?? [];

  // ── Mutations ──
  const createUser = useMutation({
    mutationFn: async (vars: any) => {
      const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vars) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d;
    },
    onSuccess: d => { setTempPw(d.tempPassword); qc.invalidateQueries({ queryKey: ["admin-users-flat"] }); toast({ title: "Tạo thành công!", description: `Mật khẩu: ${d.tempPassword}` }); },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const updateUser = useMutation({
    mutationFn: async (vars: any) => {
      const res = await fetch(`/api/admin/users/${vars.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update_user", ...vars }) });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users-flat"] }); setEditingUser(null); toast({ title: "Đã cập nhật" }); },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const assignDeck = useMutation({
    mutationFn: async (vars: any) => {
      const res = await fetch(`/api/admin/users/${vars.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assign_deck", ...vars }) });
      if (!res.ok) throw new Error("Giao đề thất bại");
    },
    onSuccess: () => { setShowAssign(null); toast({ title: "Đã giao đề", description: "Bộ đề đã được gán trực tiếp cho người dùng." }); }
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => { 
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" }); 
      if (!res.ok) throw new Error("Failed"); 
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users-flat"] }); toast({ title: "Đã xóa tài khoản" }); },
  });

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e]">Quản lý <span className="text-[#ed0046]">Tài khoản</span></h1>
          <p className="text-muted-foreground text-sm font-medium">Danh sách toàn bộ người dùng trong hệ thống.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Tìm email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl border-[#f0e0e7]" />
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-[#ed0046] hover:bg-[#c0003a] text-white rounded-xl px-6 font-bold shadow-sm"><Plus className="w-4 h-4 mr-2" /> Tạo mới</Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#fafafa] border-b-2 border-[#f0e0e7]">
              <th className="text-left font-bold p-4 uppercase tracking-wider text-[11px]">Email</th>
              <th className="text-left font-bold p-4 uppercase tracking-wider text-[11px]">Vai trò</th>
              <th className="text-left font-bold p-4 uppercase tracking-wider text-[11px]">Nhóm</th>
              <th className="text-right font-bold p-4 uppercase tracking-wider text-[11px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e0e7]">
            {isLoading ? (
              <tr><td colSpan={4} className="p-24 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-[#ed0046]" /></td></tr>
            ) : filtered.map(user => {
               const groupNames = user.memberships?.map(m => m.group.name).join(", ") || "-";
               return (
                <tr key={user.id} className="hover:bg-[#fff8fa] transition-colors group">
                  <td className="p-4 font-bold text-[#1a1a2e]">{user.email}</td>
                  <td className="p-4">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : user.role === 'SUBADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-[#fff0f4] text-[#ed0046]'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-xs font-medium text-muted-foreground">{groupNames}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-[#ed0046] hover:text-white" onClick={() => { setEditingUser(user); setEditRole(user.role); setEditGroup(user.memberships?.[0]?.group.id || ""); }} title="Sửa & Phân nhóm"><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-black hover:text-white" onClick={() => setShowAssign(user)} title="Giao đề trực tiếp"><BookOpen className="w-3.5 h-3.5" /></Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-600 hover:text-white" onClick={() => { if(confirm("Xóa vĩnh viễn?")) deleteUser.mutate(user.id); }} title="Xóa tài khoản"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
               )
            })}
          </tbody>
        </table>
      </div>

      {/* Dialog: Create Account */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-2xl overflow-hidden p-0">
          <div className="bg-[#fff0f4] p-6 border-b"><DialogTitle className="text-xl font-bold flex items-center gap-2"><Plus className="text-[#ed0046]" /> Tạo tài khoản hệ thống</DialogTitle></div>
          <div className="p-6 space-y-4">
            {tempPw ? (
               <div className="p-6 bg-green-50 rounded-xl text-center space-y-4 border border-green-200 animate-in zoom-in-95">
                  <p className="font-bold text-green-700 text-xs">KHỞI TẠO THÀNH CÔNG</p>
                  <code className="block bg-white p-3 rounded-lg border text-xl font-mono">{tempPw}</code>
                  <Button className="w-full bg-[#ed0046] rounded-xl font-bold" onClick={() => setShowCreate(false)}>Xong</Button>
               </div>
            ) : (
               <>
                <div className="space-y-1"><Label className="font-bold">Email</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} className="rounded-xl h-11" placeholder="example@gmail.com" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="font-bold">Vai trò</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="USER">USER</SelectItem><SelectItem value="SUBADMIN">SUBADMIN</SelectItem><SelectItem value="ADMIN">ADMIN</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="font-bold">Nhóm</Label>
                    <Select value={selGroupId} onValueChange={setSelGroupId}>
                      <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button className="w-full bg-[#ed0046] rounded-xl h-11 font-bold shadow-lg" onClick={() => createUser.mutate({ email: newEmail, role: newRole, group_id: selGroupId })} disabled={createUser.isPending}>
                  {createUser.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Xác nhận tạo"}
                </Button>
               </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Edit & Reassign Group */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden shadow-2xl">
           <div className="bg-[#fff0f4] p-6 border-b"><DialogTitle className="text-xl font-bold flex items-center gap-2"><Edit2 className="text-[#ed0046]" /> Chỉnh sửa & Phân nhóm</DialogTitle></div>
           <div className="p-6 space-y-5">
              <div className="space-y-1"><Label className="font-bold text-muted-foreground">Tài khoản</Label><Input disabled value={editingUser?.email} className="bg-gray-50 rounded-xl" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <Label className="font-bold">Role</Label>
                   <Select value={editRole} onValueChange={setEditRole}>
                      <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="USER">USER</SelectItem><SelectItem value="SUBADMIN">SUBADMIN</SelectItem><SelectItem value="ADMIN">ADMIN</SelectItem></SelectContent>
                   </Select>
                </div>
                <div className="space-y-1">
                   <Label className="font-bold text-[#ed0046]">Phân lại nhóm</Label>
                   <Select value={editGroup} onValueChange={setEditGroup}>
                      <SelectTrigger className="rounded-xl border-[#ed0046] border-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                         {groups.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-[10px] text-blue-700 font-bold rounded-lg border border-blue-100 uppercase tracking-wider flex items-center gap-2">
                 <Shield className="w-4 h-4" /> Hệ thống sẽ dọn dẹp liên kết nhóm cũ nếu bạn đổi nhóm mới.
              </div>
           </div>
           <DialogFooter className="p-6 bg-gray-50">
              <Button variant="ghost" onClick={() => setEditingUser(null)}>Hủy</Button>
              <Button className="bg-[#1a1a2e] rounded-xl px-8 font-bold" onClick={() => updateUser.mutate({ id: editingUser?.id, role: editRole, group_id: editGroup })}>Lưu thay đổi</Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Direct Assign (Super Admin) */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-2 border-black">
          <div className="bg-black text-white p-6"><DialogTitle className="text-xl font-bold flex items-center gap-2"><BookOpen /> Giao đề Trực tiếp (System)</DialogTitle></div>
          <div className="p-6 space-y-4">
            <div className="space-y-1">
              <Label className="font-bold">Chọn bộ đề</Label>
              <Select value={selectedDeck} onValueChange={setSelectedDeck}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Chọn đề..." /></SelectTrigger>
                <SelectContent>{decks.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Hạn sử dụng</Label>
              <Input type="datetime-local" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="rounded-xl h-11" />
            </div>
          </div>
          <DialogFooter className="p-6 bg-gray-50 border-t">
            <Button variant="ghost" onClick={() => setShowAssign(null)}>Hủy</Button>
            <Button className="bg-black text-white rounded-xl px-10 font-bold" disabled={!selectedDeck} onClick={() => assignDeck.mutate({ id: showAssign?.id, deck_id: selectedDeck, expired_at: expiryDate })}>Kích hoạt</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
