"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, RefreshCw, Trash2, BookOpen, Loader2,
  Copy, Check, Shield, Shuffle, Users, Search, AlertCircle
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
  group?: { id: string; name: string } | null;
  user_decks?: UserDeckItem[];
}

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchUsers(): Promise<UserData[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) throw new Error("Failed to fetch users");
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
    onSuccess: d => { setTempPw(d.tempPassword); qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["admin-groups"] }); toast({ title: "Tạo thành công!", description: `Mật khẩu: ${d.tempPassword}` }); },
    onError: (e: Error) => toast({ title: "Lỗi tạo người dùng", description: e.message, variant: "destructive" }),
  });

  const deleteSubAdmin = useMutation({
    mutationFn: async (vars: any) => {
      const res = await fetch(`/api/admin/subadmins/${vars.saId}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vars) });
      if (!res.ok) throw new Error("Failed to delete subadmin");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["admin-groups"] }); setShowDeleteSubAdmin(null); toast({ title: "Thành công", description: "Đã xóa SubAdmin và cập nhật nhóm" }); },
    onError: (e: Error) => toast({ title: "Lỗi", description: e.message, variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => { const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" }); if (!res.ok) throw new Error("Failed"); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "Thành công", description: "Đã xóa người dùng" }); },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "Thành công", description: "Đã cập nhật vai trò" }); },
  });

  const assignDeck = useMutation({
    mutationFn: async ({ userId, deckIds, expiredAt }: { userId: string; deckIds: string[]; expiredAt: string }) => {
      for (const deckId of deckIds) {
        await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "assign_deck", deck_id: deckId, expired_at: expiredAt || null }) });
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); setShowAssign(null); toast({ title: "Thành công", description: "Đã giao bộ đề cho người dùng" }); },
  });

  const revokeDeck = useMutation({
    mutationFn: async ({ userId, deckId }: { userId: string; deckId: string }) => {
      await fetch(`/api/admin/users/${userId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke_deck", deck_id: deckId }) });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast({ title: "Thành công", description: "Đã thu hồi bộ đề" }); },
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

  // ── Password Logic ──
  const handleShufflePassword = () => {
    const pw = generatePassword(10);
    setNewPassword(pw);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-8 border-[#f0e0e7]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#fff0f4] text-[#ed0046] px-3 py-1 rounded-full text-xs font-bold border border-[#ffd6e4]">
            ✦ Quản trị hệ thống
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1a1a2e]">
            Người dùng <span className="text-[#ed0046]">Hệ thống</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-md">
            Quản lý danh sách học viên, Subadmin và phân chia nhóm học tập linh hoạt theo chuẩn Huy Tutor.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm theo email..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9 w-full sm:w-[300px] border-[#f0e0e7] focus-visible:ring-[#ed0046] rounded-xl"
            />
          </div>
          <Button 
            className="bg-[#ed0046] hover:bg-[#c0003a] text-white rounded-full px-6 font-bold shadow-lg shadow-red-100 transition-all hover:scale-105 active:scale-95"
            onClick={() => { setShowCreate(true); setTempPw(""); setNewEmail(""); setNewPassword(""); setNewRole("USER"); setSelGroupId("NONE"); }}
          >
            <Plus className="w-4 h-4 mr-2" /> Tạo người dùng
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#ed0046]" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Đang tải danh sách...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {/* Admin Managed Group */}
          {adminManaged.length > 0 && (
            <div className="space-y-4">
              <UserGroupTable
                title="Quản lý bởi Admin" 
                titleColor="text-[#ed0046]" 
                bgColor="bg-[#fff0f4] border-b border-[#ffd6e4]"
                users={adminManaged} 
                decks={decks} 
                onAssign={openAssign} 
                onViewDecks={setShowDecks} 
                onResetPw={(u: UserData) => resetPw.mutate({ userId: u.id, email: u.email })}
                onDelete={(u: UserData) => { if (confirm(`Xóa ${u.email}?`)) deleteUser.mutate(u.id); }}
                onChangeRole={(u: UserData, r: string) => changeRole.mutate({ userId: u.id, role: r })}
              />
            </div>
          )}

          {/* Subadmin Groups */}
          {otherGroups.map(([gid, { name, users: gUsers }]) => (
            <div key={gid} className="space-y-4">
              <UserGroupTable 
                title={name} 
                titleColor="text-[#1a1a2e]"
                bgColor="bg-gray-50 border-b border-[#f0e0e7]"
                users={gUsers} 
                decks={decks} 
                onAssign={openAssign} 
                onViewDecks={setShowDecks}
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

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#f0e0e7] rounded-3xl bg-gray-50/50">
              <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Không tìm thấy người dùng nào phù hợp</p>
            </div>
          )}
        </div>
      )}

      {/* Dialog: Create User */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-[#f0e0e7] overflow-hidden p-0">
          <div className="bg-[#fff0f4] p-6 border-b border-[#ffd6e4]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-extrabold text-[#ed0046] flex items-center gap-3">
                <Plus className="w-6 h-6" /> Tạo người dùng mới
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">Nhập thông tin chi tiết để cấp quyền truy cập hệ thống.</DialogDescription>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-5">
            {tempPw ? (
              <div className="bg-[#f8f9fa] border-2 border-[#f0e0e7] rounded-xl p-6 text-center space-y-4 animate-in zoom-in duration-300">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-bold text-gray-700">Tạo tài khoản thành công!</p>
                <div className="relative group">
                  <Input 
                    readOnly 
                    value={tempPw} 
                    className="text-center font-mono text-xl font-bold py-6 bg-white border-2 border-[#f0e0e7] text-[#ed0046]"
                  />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-[#ed0046]"
                    onClick={() => { navigator.clipboard.writeText(tempPw); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <Button className="w-full bg-[#1a1a2e] text-white hover:bg-black rounded-xl font-bold" onClick={() => setShowCreate(false)}>Đóng</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5 text-sm">
                  <Label className="font-bold text-[#1a1a2e]">Email đăng nhập</Label>
                  <Input 
                    placeholder="example@gmail.com"
                    value={newEmail} 
                    onChange={e => setNewEmail(e.target.value)} 
                    className="border-[#f0e0e7] focus-visible:ring-[#ed0046] rounded-xl h-11"
                  />
                </div>
                <div className="space-y-1.5 text-sm">
                  <Label className="font-bold text-[#1a1a2e]">Mật khẩu</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Để trống = Tự động tạo"
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      className="border-[#f0e0e7] focus-visible:ring-[#ed0046] rounded-xl h-11 font-mono"
                    />
                    <Button 
                      type="button"
                      variant="outline" 
                      className="h-11 border-2 border-[#f0e0e7] hover:bg-[#fff0f4] hover:text-[#ed0046] rounded-xl transition-colors"
                      onClick={handleShufflePassword}
                      title="Tạo mật khẩu ngẫu nhiên"
                    >
                      <Shuffle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-sm">
                    <Label className="font-bold text-[#1a1a2e]">Cấp bậc quyền</Label>
                    <Select value={newRole} onValueChange={setNewRole}>
                      <SelectTrigger className="border-[#f0e0e7] focus:ring-[#ed0046] rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USER">Học viên (USER)</SelectItem>
                        <SelectItem value="SUBADMIN">Quản lý (SUBADMIN)</SelectItem>
                        <SelectItem value="ADMIN">Quản trị (ADMIN)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Only show Group selection if not ADMIN */}
                  {newRole !== "ADMIN" && (
                    <div className="space-y-1.5 text-sm animate-in slide-in-from-top-2 duration-300">
                      <Label className="font-bold text-[#1a1a2e]">Phân vào nhóm</Label>
                      <Select value={selGroupId} onValueChange={setSelGroupId}>
                        <SelectTrigger className="border-[#f0e0e7] focus:ring-[#ed0046] rounded-xl h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">Admin quản lý</SelectItem>
                          <SelectItem value="NEW_GROUP">+ Tạo nhóm mới</SelectItem>
                          {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {selGroupId === "NEW_GROUP" && newRole !== "ADMIN" && (
                  <div className="space-y-1.5 text-sm animate-in slide-in-from-top-2">
                    <Label className="font-bold text-[#1a1a2e]">Tên nhóm học tập mới</Label>
                    <Input 
                      placeholder="VD: Luyện thi khối D01..."
                      value={newGroupName} 
                      onChange={e => setNewGroupName(e.target.value)} 
                      className="border-[#f0e0e7] focus-visible:ring-[#ed0046] rounded-xl h-11"
                    />
                  </div>
                )}
                
                <DialogFooter className="pt-4 border-t border-[#f0e0e7] mt-6">
                  <Button 
                    variant="ghost" 
                    className="rounded-xl font-bold text-muted-foreground mr-auto"
                    onClick={() => setShowCreate(false)}
                  >
                    Hủy bỏ
                  </Button>
                  <Button 
                    className="bg-[#ed0046] hover:bg-[#c0003a] text-white rounded-xl px-8 font-bold h-11 shadow-md"
                    onClick={() => createUser.mutate({ 
                      email: newEmail, 
                      role: newRole, 
                      password: newPassword, 
                      group_id: (newRole === "ADMIN" || selGroupId === "NONE" || selGroupId === "NEW_GROUP") ? undefined : selGroupId, 
                      group_name: (newRole !== "ADMIN" && selGroupId === "NEW_GROUP") ? newGroupName : undefined 
                    })}
                    disabled={createUser.isPending || !newEmail}
                  >
                    {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Xác nhận Tạo
                  </Button>
                </DialogFooter>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Delete Subadmin */}
      <Dialog open={!!showDeleteSubAdmin} onOpenChange={() => setShowDeleteSubAdmin(null)}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-[#f0e0e7] p-0 overflow-hidden">
          <div className="bg-red-50 p-6 border-b border-red-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" /> Ngắt quyền quản lý SubAdmin
              </DialogTitle>
              <DialogDescription className="text-red-600 font-medium">Bạn đang xóa quyền quản trị của {showDeleteSubAdmin?.subadmin.email}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-700 leading-relaxed">
                Nhóm này hiện đang có <strong className="text-[#ed0046]">{showDeleteSubAdmin?.groupUsers.length} thành viên</strong>. 
                Vui lòng chọn phương án chuyển giao quyền Root hoặc xử lý thành viên mồ côi.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">1. Chuyển giao quyền Group Owner</Label>
                <Select value={transferId || "NONE"} onValueChange={v => setTransferId(v === "NONE" ? null : v)}>
                  <SelectTrigger className="border-[#f0e0e7] rounded-xl h-11">
                    <SelectValue placeholder="Chọn SubAdmin thay thế..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Chuyển thành Nhóm ảo (Admin HL)</SelectItem>
                    {showDeleteSubAdmin?.groupUsers.filter(u => u.role === "SUBADMIN").map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!transferId && showDeleteSubAdmin?.groupUsers.length! > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">2. Xử trị cá nhân thành viên</Label>
                  <div className="divide-y border-2 border-[#f0e0e7] rounded-2xl max-h-48 overflow-y-auto bg-white shadow-inner">
                    {showDeleteSubAdmin?.groupUsers.map(u => (
                      <div key={u.id} className="p-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                        <span className="text-xs font-semibold text-gray-700 truncate">{u.email}</span>
                        <div className="flex gap-2 shrink-0">
                          <Button 
                            size="sm" 
                            variant={deleteIds.has(u.id) ? "destructive" : "outline"} 
                            className="h-8 px-3 text-[10px] font-bold uppercase rounded-lg" 
                            onClick={() => { const n = new Set(deleteIds); n.has(u.id) ? n.delete(u.id) : n.add(u.id); setDeleteIds(n); keepIds.delete(u.id); setKeepIds(new Set(keepIds)); }}
                          >
                            Xóa
                          </Button>
                          <Button 
                            size="sm" 
                            variant={keepIds.has(u.id) ? "brand" : "outline"} 
                            className={`h-8 px-3 text-[10px] font-bold uppercase rounded-lg ${keepIds.has(u.id) ? "bg-[#ed0046] text-white hover:bg-[#c0003a]" : ""}`}
                            onClick={() => { const k = new Set(keepIds); k.has(u.id) ? k.delete(u.id) : k.add(u.id); setKeepIds(k); deleteIds.delete(u.id); setDeleteIds(new Set(deleteIds)); }}
                          >
                            Giữ
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-6 bg-gray-50 border-t">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setShowDeleteSubAdmin(null)}>Hủy bỏ</Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6 font-bold h-11 shadow-md shadow-red-100" 
              onClick={() => deleteSubAdmin.mutate({ 
                saId: showDeleteSubAdmin!.subadmin.id, 
                new_owner_id: transferId, 
                delete_user_ids: Array.from(deleteIds), 
                keep_user_ids: Array.from(keepIds) 
              })}
              disabled={deleteSubAdmin.isPending}
            >
              {deleteSubAdmin.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Xác nhận Xử lý
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog: Decks View */}
      <Dialog open={!!showDecks} onOpenChange={() => setShowDecks(null)}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-[#f0e0e7] p-0 overflow-hidden shadow-2xl">
          <div className="bg-[#fff0f4] p-6 border-b border-[#ffd6e4]">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-[#1a1a2e] flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#ed0046]" /> Danh mục bộ đề
              </DialogTitle>
              <DialogDescription className="font-medium text-[#ed0046]">{showDecks?.email}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6">
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {(showDecks?.user_decks ?? []).length === 0 ? (
                <div className="text-center py-10 space-y-3 bg-gray-50 rounded-2xl border-2 border-dashed border-[#f0e0e7]">
                  <p className="text-sm text-muted-foreground font-medium">Người dùng này chưa có bộ đề nào.</p>
                </div>
              ) : (showDecks?.user_decks ?? []).map(ud => (
                <div key={ud.id} className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-[#f0e0e7] hover:border-[#ffd6e4] transition-all group shadow-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-[#1a1a2e]">{ud.deck?.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Hết hạn: {ud.expired_at ? new Date(ud.expired_at).toLocaleDateString("vi-VN") : "Vĩnh viễn"}</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100" 
                    onClick={() => revokeDeck.mutate({ userId: showDecks!.id, deckId: ud.deck_id })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t">
            <Button 
              className="w-full bg-[#ed0046] hover:bg-[#c0003a] text-white rounded-xl font-bold h-11 shadow-sm" 
              onClick={() => { const id = showDecks!.id; setShowDecks(null); openAssign(id); }}
            >
              + Giao quyền thêm bộ đề
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Assign Deck */}
      <Dialog open={!!showAssign} onOpenChange={() => setShowAssign(null)}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden border-2 border-[#f0e0e7]">
          <div className="bg-[#fff0f4] p-6 border-b border-[#ffd6e4]">
            <DialogHeader>
              <DialogTitle className="text-xl font-extrabold text-[#1a1a2e] flex items-center gap-2">
                <Plus className="w-6 h-6 text-[#ed0046]" /> Cấp quyền bộ đề
              </DialogTitle>
              <DialogDescription className="font-medium text-[#ed0046]">{assignedUser?.email}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <Label className="font-bold text-[#1a1a2e] text-sm px-1">Chọn danh sách bộ đề</Label>
              <div className="max-h-56 overflow-y-auto border-2 border-[#f0e0e7] rounded-2xl divide-y divide-[#f0e0e7] bg-white shadow-inner">
                {decks.map(d => {
                  const checked = assignDeckIds.has(d.id);
                  const alreadyHas = assignedUser?.user_decks?.some(ud => ud.deck_id === d.id);
                  return (
                    <label 
                      key={d.id} 
                      className={`flex items-center gap-4 p-4 transition-all cursor-pointer ${alreadyHas ? "opacity-40 cursor-not-allowed bg-gray-50" : "hover:bg-[#fff8fa]"}`}
                    >
                      <input 
                        type="checkbox" 
                        disabled={alreadyHas}
                        checked={checked} 
                        onChange={e => { const n = new Set(assignDeckIds); e.target.checked ? n.add(d.id) : n.delete(d.id); setAssignDeckIds(n); }} 
                        className="w-5 h-5 accent-[#ed0046] rounded-md"
                      />
                      <div className="flex flex-col gap-0.5">
                        <span className={`text-sm font-bold ${checked ? "text-[#ed0046]" : "text-gray-700"}`}>{alreadyHas ? "✓ " : ""}{d.title}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">{d.level}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-[#1a1a2e] text-sm px-1">Thời hạn sử dụng</Label>
              <Input 
                type="datetime-local" 
                value={assignExpiry} 
                onChange={e => setAssignExpiry(e.target.value)} 
                className="border-2 border-[#f0e0e7] rounded-xl h-11"
              />
              <p className="text-[10px] text-muted-foreground font-bold italic px-1 uppercase tracking-widest leading-none">(*) Bỏ trống nếu muốn cấp quyền vĩnh viễn</p>
            </div>
          </div>
          <DialogFooter className="p-6 bg-gray-50 border-t">
            <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setShowAssign(null)}>Đóng</Button>
            <Button 
              className="bg-[#1a1a2e] hover:bg-black text-white rounded-xl px-8 font-bold h-11 shadow-lg" 
              disabled={assignDeckIds.size === 0 || assignDeck.isPending} 
              onClick={() => assignDeck.mutate({ userId: showAssign!, deckIds: Array.from(assignDeckIds), expiredAt: assignExpiry })}
            >
              {assignDeck.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Xác nhận Giao {assignDeckIds.size} bộ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-Components ──
function UserGroupTable({ title, titleColor, bgColor, users, decks, onAssign, onViewDecks, onResetPw, onDelete, onChangeRole }: any) {
  return (
    <div className="bg-white rounded-3xl border-2 border-[#f0e0e7] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {title && (
        <div className={`px-6 py-4 flex items-center justify-between ${bgColor}`}>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full bg-current" style={{ backgroundColor: "currentColor" }} />
            <h3 className={`text-lg font-extrabold flex items-center gap-2 ${titleColor}`}>
             {title}
             <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-white/50 border border-current opacity-60">{users.length}</span>
            </h3>
          </div>
        </div>
      )}
      <div className="overflow-x-auto min-h-[100px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[#f0e0e7] bg-[#fafafa]">
              <th className="text-left py-4 px-6 font-bold text-[#1a1a2e] uppercase text-[11px] tracking-[2px]">Tài khoản email</th>
              <th className="text-left py-4 px-6 font-bold text-[#1a1a2e] uppercase text-[11px] tracking-[2px]">Vai trò</th>
              <th className="text-left py-4 px-6 font-bold text-[#1a1a2e] uppercase text-[11px] tracking-[2px]">Ngày kích hoạt</th>
              <th className="text-right py-4 px-6 font-bold text-[#1a1a2e] uppercase text-[11px] tracking-[2px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0e0e7]">
            {users.map((u: UserData) => (
              <tr key={u.id} className="hover:bg-[#fff8fa] group transition-colors">
                <td className="py-4 px-6 font-bold text-[#1a1a2e] align-middle">{u.email}</td>
                <td className="py-4 px-6 align-middle">
                  <div className="flex items-center">
                    <span className={`text-[10px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-full border-2 ${
                      u.role === "ADMIN" ? "bg-purple-100 text-purple-700 border-purple-200" :
                      u.role === "SUBADMIN" ? "bg-orange-100 text-orange-700 border-orange-200" : 
                      "bg-[#fff0f4] text-[#ed0046] border-[#ffd6e4]"
                    }`}>
                      {u.role}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-xs text-muted-foreground font-semibold align-middle">
                  {new Date(u.created_at).toLocaleDateString("vi-VN")}
                </td>
                <td className="py-4 px-6 align-middle">
                  <div className="flex justify-end gap-1.5 items-center">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 rounded-lg border-2 border-[#f0e0e7] hover:bg-[#ed0046] hover:text-white hover:border-[#ed0046] transition-all" 
                      onClick={() => onViewDecks(u)}
                      title="Danh bạ bộ đề"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 rounded-lg border-2 border-[#f0e0e7] hover:bg-[#1a1a2e] hover:text-white hover:border-[#1a1a2e] transition-all" 
                      onClick={() => onResetPw(u)}
                      title="Làm mới mật khẩu"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 w-8 p-0 rounded-lg border-2 border-[#f0e0e7] hover:bg-red-600 hover:text-white hover:border-red-600 transition-all" 
                      onClick={() => onDelete(u)}
                      title="Xóa tài khoản"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
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
