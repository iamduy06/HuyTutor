"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, RefreshCw, Trash2, BookOpen, Loader2,
  Copy, Check, ChevronDown, Shield, Shuffle,
  UserCog, Users, Smartphone, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { generatePassword } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DeckItem { id: string; title: string; level?: string; word_count?: number; }
interface GroupItem { id: string; name: string; }
interface UserDeckItem {
  id: string; deck_id: string; expired_at: string | null;
  progress_percent: number; learned_count: number;
  deck?: { title: string };
}
interface UserDeviceItem {
  id: string; device_id: string; device_name?: string; ip_address?: string; last_seen: string;
}
interface GroupUserItem {
  group_id: string; is_subadmin: boolean;
  group?: { name: string };
}

interface UserData {
  id: string; email: string; role: string; created_at: string;
  max_devices?: number;
  user_decks?: UserDeckItem[];
  group_users?: GroupUserItem[];
  user_devices?: UserDeviceItem[];
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
  if (!res.ok) return [];
  const data = await res.json();
  return data.decks ?? [];
}
async function fetchGroups(): Promise<GroupItem[]> {
  const res = await fetch("/api/admin/groups");
  if (!res.ok) return [];
  const data = await res.json();
  return data.groups ?? [];
}
async function fetchGlobalSettings(): Promise<string> {
  const res = await fetch("/api/admin/app-settings");
  if (!res.ok) return "3";
  const data = await res.json();
  return data.global_max_devices ?? "3";
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  // Global Settings Modal
  const [showSettings, setShowSettings] = useState(false);
  const [globalMaxDevices, setGlobalMaxDevices] = useState("");

  // Create User Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("USER");
  const [newGroupId, setNewGroupId] = useState("none");
  const [newMaxDevices, setNewMaxDevices] = useState("");
  const [tempPw, setTempPw] = useState("");

  // Create Group Input State
  const [newGroupName, setNewGroupName] = useState("");

  const [csvFile, setCsvFile] = useState<File | null>(null);

  // Edit Modals State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [activeDialog, setActiveDialog] = useState<"INFO" | "GROUP" | "DECKS" | "DEVICES" | null>(null);

  // Info Dialog State
  const [editRole, setEditRole] = useState("USER");
  const [editMaxDevices, setEditMaxDevices] = useState("");
  const [resetResult, setResetResult] = useState<{ email: string; pw: string } | null>(null);
  const [resetCopied, setResetCopied] = useState(false);

  // Group Dialog State
  const [editGroupId, setEditGroupId] = useState<string>("none");

  // Decks Dialog State
  const [assignDeckIds, setAssignDeckIds] = useState<Set<string>>(new Set());
  const [assignExpiry, setAssignExpiry] = useState("");

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });
  const { data: decks = [] } = useQuery({ queryKey: ["admin-decks-list"], queryFn: fetchDecks });
  const { data: groups = [] } = useQuery({ queryKey: ["admin-groups-list"], queryFn: fetchGroups });
  const { data: globalSettingsValue = "3" } = useQuery({ queryKey: ["admin-global-settings"], queryFn: fetchGlobalSettings });


  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateSettings = useMutation({
    mutationFn: async (val: string) => {
      const res = await fetch("/api/admin/app-settings", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ global_max_devices: val }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-global-settings"] });
      toast({ title: "Đã cập nhật cấu hình hệ thống" });
      setShowSettings(false);
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const createGroup = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/admin/groups", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: "" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Failed");
      return d.group;
    },
    onSuccess: (newGroup) => {
      qc.invalidateQueries({ queryKey: ["admin-groups-list"] });
      setNewGroupName("");
      // Support assigning new group to either Create User or Assign Group dialog
      if (showCreate) setNewGroupId(newGroup.id);
      if (activeDialog === "GROUP") setEditGroupId(newGroup.id);
      toast({ title: "Đã tạo nhóm mới!" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const createUser = useMutation({
    mutationFn: async (params: { email: string; role: string; password: string; group_id: string; max_devices: string }) => {
      const payload: any = { email: params.email, role: params.role, password: params.password };
      if (params.group_id !== "none") payload.group_id = params.group_id;
      if (params.max_devices) payload.max_devices = params.max_devices;

      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  // Action Mutations
  const updateInfo = useMutation({
    mutationFn: async ({ id, role, max_devices }: { id: string, role: string, max_devices: number | null }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change_info", role, max_devices })
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Đã cập nhật thông tin" });
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
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const assignGroup = useMutation({
    mutationFn: async ({ id, group_id }: { id: string, group_id: string | null }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign_group", group_id })
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Đã cập nhật nhóm" });
      closeDialogs();
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
      setAssignDeckIds(new Set()); setAssignExpiry("");
      toast({ title: `Giao ${vars.deckIds.length} Flashcard thành công!` });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const updateDeckProgress = useMutation({
    mutationFn: async (args: { userId: string, deckId: string, progress_percent?: number, learned_count?: number, expiredAt?: string | null }) => {
      const res = await fetch(`/api/admin/users/${args.userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_deck_progress", deck_id: args.deckId, progress_percent: args.progress_percent, learned_count: args.learned_count, expired_at: args.expiredAt })
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Đã cập nhật bản ghi" });
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
      toast({ title: "Đã thu hồi Flashcard" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const removeDevice = useMutation({
    mutationFn: async ({ userId, device_id }: { userId: string, device_id: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove_device", device_id })
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Đã xoá thiết bị (Người dùng sẽ bị văng ra)" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const resetDevices = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_devices" })
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Đã reset toàn bộ thiết bị và đăng xuất" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });
  const bulkUpdateExpiry = useMutation({
    mutationFn: async ({ userId, expiredAt }: { userId: string; expiredAt: string }) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_update_expiry", expired_at: expiredAt || null }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "Đã cập nhật hạn dùng cho tất cả Flashcards" });
    },
    onError: () => toast({ title: "Thất bại", variant: "destructive" }),
  });

  const [bulkExp, setBulkExp] = useState("");

  // ── CSV Upload ─────────────
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

  // ── Handlers ─────────────────
  const openDialog = (type: typeof activeDialog, user: UserData) => {
    setEditingUser(user);
    setActiveDialog(type);
    
    // Prep states
    if (type === "INFO") {
      setEditRole(user.role);
      setEditMaxDevices(user.max_devices?.toString() || "");
      setResetResult(null);
    }
    if (type === "GROUP") {
      setEditGroupId(user.group_users?.[0]?.group_id || "none");
      setNewGroupName("");
    }
    if (type === "DECKS") {
      setAssignDeckIds(new Set());
      setAssignExpiry("");
      setBulkExp("");
    }
    if (type === "DEVICES") {
      setEditMaxDevices(user.max_devices?.toString() || "");
    }
  };

  const closeDialogs = () => {
    setActiveDialog(null);
    setEditingUser(null);
    setResetResult(null);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));
  }, [users, search]);

  const getFreshEditingUser = () => {
    if (!editingUser) return null;
    return users.find(u => u.id === editingUser.id) || editingUser;
  };

  const currentUserData = getFreshEditingUser();

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-3xl font-extrabold text-[#1a1a2e]">👥 Hệ Thống Người Dùng</h1>
        <div className="flex gap-3 flex-wrap items-center">
          <Input placeholder="🔍 Tìm theo email..." value={search}
            onChange={e => setSearch(e.target.value)} className="w-64" />
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden"
              onChange={e => setCsvFile(e.target.files?.[0] ?? null)} />
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-[#f0e0e7] text-sm font-semibold hover:border-brand hover:text-brand transition-all">
              📂 Import CSV
            </span>
          </label>
          {csvFile && (
            <Button variant="brand" size="sm" onClick={handleCsvUpload}>Upload {csvFile.name}</Button>
          )}

          <Button variant="outline" className="text-gray-600 hover:text-brand px-3" onClick={() => { setGlobalMaxDevices(globalSettingsValue); setShowSettings(true); }} title="Cấu hình hệ thống">
            <Settings className="w-4 h-4" />
          </Button>

          <Button variant="brand"
            onClick={() => { setShowCreate(true); setTempPw(""); setNewEmail(""); setNewPassword(""); setNewRole("USER"); setNewGroupId("none"); setNewMaxDevices(""); setNewGroupName(""); }}>
            <Plus className="w-4 h-4 mr-1.5" /> Tạo user
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#f0e0e7] bg-[#f8f9fa] text-left">
                  <th className="p-3 font-bold text-[#1a1a2e]">Email</th>
                  <th className="p-3 font-bold text-[#1a1a2e]">Role</th>
                  <th className="p-3 font-bold text-[#1a1a2e]">Group</th>
                  <th className="p-3 font-bold text-[#1a1a2e]">Thiết bị</th>
                  <th className="p-3 font-bold text-[#1a1a2e]">Đề được giao</th>
                  <th className="p-3 font-bold text-[#1a1a2e] text-center w-56">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Không tìm thấy người dùng nào.</td></tr>
                ) : filteredUsers.map(u => {
                  const devCount = u.user_devices?.length || 0;
                  const deckCount = u.user_decks?.length || 0;
                  const groupName = u.group_users?.[0]?.group?.name || "Chưa có";
                  return (
                    <tr key={u.id} className="border-b border-[#f0e0e7] hover:bg-[#f8f9fa]">
                      <td className="p-3 font-medium text-[#1a1a2e]">
                        <div className="truncate max-w-[200px]" title={u.email}>{u.email}</div>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          u.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                          u.role === "SUBADMIN" ? "bg-orange-100 text-orange-700" :
                          "bg-brand-light text-brand"
                        }`}>{u.role}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-semibold bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                          {groupName}
                        </span>
                      </td>
                      <td className="p-3 text-xs">
                        <span className="font-semibold text-gray-800">{devCount}</span>
                        {u.max_devices ? ` / ${u.max_devices}` : ` / ${globalSettingsValue} (Hệ thống)`}
                      </td>
                      <td className="p-3 text-xs">
                         <span className="font-semibold text-brand bg-brand-light px-2.5 py-0.5 rounded-full">
                           {deckCount}
                         </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5 justify-center">
                          <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            onClick={() => openDialog("INFO", u)} title="Thông tin chung & Mật khẩu">
                            <UserCog className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-orange-600 hover:bg-orange-50"
                            onClick={() => openDialog("GROUP", u)} title="Quản lý Nhóm">
                            <Users className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-green-600 hover:bg-green-50"
                            onClick={() => openDialog("DECKS", u)} title="Quản lý Flashcard">
                            <BookOpen className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-purple-600 hover:bg-purple-50"
                            onClick={() => openDialog("DEVICES", u)} title="Quản lý Thiết bị">
                            <Smartphone className="w-4 h-4" />
                          </Button>
                          <div className="w-px bg-gray-200 mx-1"></div>
                          <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-200"
                            onClick={() => { if(confirm(`Xóa hoàn toàn tài khoản ${u.email}? Hành động không thể hoàn tác.`)) deleteUser.mutate(u.id); }} title="Xóa tài khoản">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════ Dialog: Global Settings ════ */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cấu Hình Toàn Hệ Thống</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Max Devices Mặc Định (Cho mọi user không set rỗng)</Label>
              <Input type="number" min="1" value={globalMaxDevices} onChange={e => setGlobalMaxDevices(e.target.value)} className="mt-1" />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Huỷ</Button></DialogClose>
              <Button variant="brand" onClick={() => updateSettings.mutate(globalMaxDevices)} disabled={updateSettings.isPending || !globalMaxDevices}>Lưu cấu hình</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Tạo user ════ */}
      <Dialog open={showCreate} onOpenChange={v => { setShowCreate(v); if (!v) { setTempPw(""); setNewPassword(""); setNewGroupName(""); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tạo người dùng mới</DialogTitle></DialogHeader>
          {tempPw ? (
            <div className="space-y-3">
              <p className="text-sm text-green-700 font-semibold">✅ Tạo thành công! Mật khẩu tạm thời:</p>
              <div className="bg-[#f8f9fa] border-2 border-[#f0e0e7] rounded-xl p-4 flex items-center gap-3">
                <code className="flex-1 font-mono text-brand font-bold text-xl tracking-wider select-all cursor-text"
                  onClick={e => {
                    const r = document.createRange(); r.selectNodeContents(e.currentTarget);
                    window.getSelection()?.removeAllRanges(); window.getSelection()?.addRange(r);
                  }}>{tempPw}</code>
                <Button variant="outline" size="sm"
                  onClick={() => { navigator.clipboard.writeText(tempPw); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button className="w-full" variant="brand" onClick={() => { setShowCreate(false); setTempPw(""); }}>Đóng</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div><Label>Email</Label><Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="user@example.com" className="mt-1" /></div>
              <div>
                <Label>Mật khẩu</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Mặc định: goidangkyflashcard" className="flex-1 font-mono" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setNewPassword("goidangkyflashcard")}><Shuffle className="w-4 h-4" /></Button>
                </div>
              </div>
              <div>
                <Label>Quyền</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">USER — Học viên</SelectItem>
                    <SelectItem value="SUBADMIN">SUBADMIN — Quản lý</SelectItem>
                    <SelectItem value="ADMIN">ADMIN — Quản trị</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-3 border-t">
                <Label>Nhóm (Group)</Label>
                <Select value={newGroupId} onValueChange={setNewGroupId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn nhóm" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Không thuộc nhóm nào --</SelectItem>
                    {groups.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 bg-gray-50 border border-gray-200 rounded p-3 flex gap-2 items-end">
                   <div className="flex-1">
                     <Label className="text-xs text-muted-foreground mb-1 block">Tạo nhóm trống mới & Chọn ngay</Label>
                     <Input placeholder="Tên nhóm mới..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="h-8 text-sm" />
                   </div>
                   <Button variant="outline" size="sm" className="h-8" disabled={!newGroupName || createGroup.isPending} onClick={() => createGroup.mutate(newGroupName)}>Tạo Nhóm</Button>
                </div>
              </div>

              <div>
                <Label>Max Devices (Thiết bị tối đa)</Label>
                <Input type="number" min="1" value={newMaxDevices} onChange={e => setNewMaxDevices(e.target.value)} placeholder={`Bỏ trống để dùng mặc định (${globalSettingsValue})`} className="mt-1" />
              </div>

              <DialogFooter className="pt-2 border-t">
                <Button variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
                <Button variant="brand" disabled={!newEmail || createUser.isPending}
                  onClick={() => createUser.mutate({ email: newEmail, role: newRole, password: newPassword, group_id: newGroupId, max_devices: newMaxDevices })}>
                  {createUser.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo Tài Khoản"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ════ EDIT DIALOG 1: INFO ════ */}
      <Dialog open={activeDialog === "INFO"} onOpenChange={closeDialogs}>
        <DialogContent>
          <DialogHeader><DialogTitle>Chỉnh sửa Thông tin: {editingUser?.email}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Quyền (Role)</Label>
              <Select value={editRole} onValueChange={setEditRole}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">USER — Học viên</SelectItem>
                  <SelectItem value="SUBADMIN">SUBADMIN — Quản lý</SelectItem>
                  <SelectItem value="ADMIN">ADMIN — Quản trị</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max Devices (Thiết bị tối đa)</Label>
              <Input type="number" min="1" value={editMaxDevices} onChange={e => setEditMaxDevices(e.target.value)} placeholder={`Bỏ trống để dùng mặc định toàn HT (${globalSettingsValue})`} className="mt-1" />
            </div>
            
            <div className="pt-4 border-t border-[#f0e0e7] mt-4">
              <div className="flex items-center justify-between">
                <Label className="text-red-600">Đổi mật khẩu người dùng này?</Label>
                <Button variant="destructive" size="sm" onClick={() => editingUser && resetPw.mutate({ userId: editingUser.id, email: editingUser.email })} disabled={resetPw.isPending}>
                  {resetPw.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Reset Password
                </Button>
              </div>
              {resetResult && (
                <div className="mt-3 bg-[#f8f9fa] border-2 border-red-100 rounded-xl p-3 flex flex-col gap-2">
                  <span className="text-sm">Đã khởi tạo mật khẩu mới. Vui lòng copy gửi cho người dùng:</span>
                  <div className="flex gap-2">
                    <code className="flex-1 font-mono font-bold text-red-600 bg-red-50 px-3 py-2 rounded text-lg text-center select-all cursor-text">{resetResult.pw}</code>
                    <Button variant="outline" onClick={() => { navigator.clipboard.writeText(resetResult.pw); setResetCopied(true); setTimeout(() => setResetCopied(false), 2000); }}>
                      {resetCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Đóng</Button></DialogClose>
            <Button variant="brand" onClick={() => {
              updateInfo.mutate({ id: editingUser!.id, role: editRole, max_devices: editMaxDevices ? parseInt(editMaxDevices) : null });
            }} disabled={updateInfo.isPending}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ EDIT DIALOG 2: GROUP ════ */}
      <Dialog open={activeDialog === "GROUP"} onOpenChange={closeDialogs}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gán Nhóm: {editingUser?.email}</DialogTitle>
            <DialogDescription>Một người dùng chỉ thuộc tối đa 1 nhóm.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
               <Label>Chọn nhóm hiện có</Label>
               <Select value={editGroupId} onValueChange={setEditGroupId}>
                 <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn nhóm" /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="none">-- Không thuộc nhóm nào --</SelectItem>
                   {groups.map(g => (
                     <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded p-3 flex gap-2 items-end">
               <div className="flex-1">
                 <Label className="text-xs text-muted-foreground mb-1 block">Tạo nhóm trống mới & Gán ngay</Label>
                 <Input placeholder="Tên nhóm mới..." value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="h-8 text-sm" />
               </div>
               <Button variant="outline" size="sm" className="h-8" disabled={!newGroupName || createGroup.isPending} onClick={() => createGroup.mutate(newGroupName)}>Tạo Nhóm</Button>
            </div>
          </div>
          <DialogFooter className="mt-4 border-t pt-4">
            <DialogClose asChild><Button variant="outline">Hủy</Button></DialogClose>
            <Button variant="brand" onClick={() => assignGroup.mutate({ id: editingUser!.id, group_id: editGroupId === "none" ? null : editGroupId })} disabled={assignGroup.isPending}>Cập Nhật Nhóm (Lưu)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ EDIT DIALOG 3: DECKS ════ */}
      <Dialog open={activeDialog === "DECKS"} onOpenChange={closeDialogs}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Quản lý Flashcard: {editingUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            
            {/* List existing decks */}
            <div>
              <h3 className="font-semibold mb-3 border-b pb-2 text-[#1a1a2e]">Flashcard đã được giao</h3>
              {!currentUserData?.user_decks?.length ? (
                <p className="text-sm text-muted-foreground italic">Chưa giao Flashcard nào.</p>
              ) : (
                <div className="space-y-3">
                  {currentUserData.user_decks.map(ud => (
                    <DeckProgressEditor key={ud.id} ud={ud}
                      onUpdate={(args) => updateDeckProgress.mutate({ userId: currentUserData.id, deckId: ud.deck_id, ...args })}
                      onRevoke={() => { if(confirm("Thu hồi Flashcard này? Tiến trình học sẽ mất.")) revokeDeck.mutate({ userId: currentUserData.id, deckId: ud.deck_id }) }}
                    />
                  ))}

                  {/* Bulk Action: Expiry */}
                  {currentUserData.user_decks.length > 1 && (
                    <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                      <Label className="text-orange-800 text-xs font-bold uppercase mb-2 block">Thao tác tập trung (Bulk Edit)</Label>
                      <div className="flex gap-2">
                        <Input type="datetime-local" className="flex-1 bg-white" 
                          value={bulkExp} onChange={e => setBulkExp(e.target.value)} />
                        <Button variant="brand" size="sm" 
                           className="flex-shrink-0"
                          onClick={() => { if(confirm("Cập nhật hạn mới cho TẤT CẢ các bộ Flashcard đã gán?")) bulkUpdateExpiry.mutate({ userId: currentUserData.id, expiredAt: bulkExp }) }}>
                          Cập nhật tất cả
                        </Button>
                      </div>
                      <p className="text-[10px] text-orange-600 mt-1.5">* Sẽ ghi đè hạn dùng của mọi bộ thẻ hiện tại của người dùng này.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Assign new deck */}
            <div className="bg-[#f8f9fa] border-2 border-[#f0e0e7] rounded-xl p-4">
               <h3 className="font-semibold mb-3">Giao Flashcard mới</h3>
               <AdminAssignDeckList 
                decks={decks} 
                currentUserData={currentUserData} 
                assignDeckIds={assignDeckIds} 
                setAssignDeckIds={setAssignDeckIds} 
               />
               <div className="mt-4">
                 <Label>Ngày hết hạn (Tuỳ chọn)</Label>
                 <Input type="datetime-local" value={assignExpiry} onChange={e => setAssignExpiry(e.target.value)} className="mt-1" />
               </div>
               <Button className="mt-4 w-full" variant="brand" disabled={assignDeckIds.size === 0 || assignDeck.isPending}
                 onClick={() => assignDeck.mutate({ userId: currentUserData!.id, deckIds: Array.from(assignDeckIds), expiredAt: assignExpiry })}>
                 {assignDeck.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                 Xác nhận giao {assignDeckIds.size} Flashcard đã chọn
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ════ EDIT DIALOG 4: DEVICES ════ */}
      <Dialog open={activeDialog === "DEVICES"} onOpenChange={closeDialogs}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quản lý Thiết bị: {editingUser?.email}</DialogTitle>
            <DialogDescription>
              Người dùng đang đăng nhập trên {(currentUserData?.user_devices || []).length} / {currentUserData?.max_devices || `${globalSettingsValue} (Hệ thống)`} thiết bị.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-2 pt-2 pb-4 border-b border-gray-100">
             <Label>Giới hạn Thiết Bị Riêng (Max Devices)</Label>
             <div className="flex gap-2">
                 <Input type="number" min="1" value={editMaxDevices} onChange={e => setEditMaxDevices(e.target.value)} placeholder={`Mặc định HT là ${globalSettingsValue}`} className="flex-1" />
                 <Button variant="outline" disabled={updateInfo.isPending} onClick={() => updateInfo.mutate({ id: currentUserData!.id, role: currentUserData!.role, max_devices: editMaxDevices ? parseInt(editMaxDevices) : null })}>
                   Lưu Max Devices
                 </Button>
             </div>
          </div>

          <div className="mt-2 space-y-3 max-h-[40vh] overflow-y-auto">
             {currentUserData?.user_devices?.length === 0 ? (
               <p className="text-sm italic text-gray-500 text-center py-4">Chưa có thiết bị nào đang hoạt động.</p>
             ) : (
               currentUserData?.user_devices?.map(dev => (
                 <div key={dev.id} className="p-3 border rounded-xl flex items-center justify-between bg-gray-50">
                   <div>
                     <p className="font-semibold text-sm">{dev.device_name || "Thiết bị Không tên"}</p>
                     <p className="text-xs text-gray-500">IP: {dev.ip_address || "N/A"}</p>
                     <p className="text-xs text-brand mt-1">Lần cuối: {new Date(dev.last_seen).toLocaleString()}</p>
                   </div>
                   <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50"
                     onClick={() => { if(confirm("Xoá thiết bị này? Người dùng sẽ văng ra trang Login.")) removeDevice.mutate({ userId: currentUserData!.id, device_id: dev.device_id })}}>
                     Xoá (Logout)
                   </Button>
                 </div>
               ))
             )}
          </div>
          <div className="mt-4 pt-4 border-t flex flex-col gap-2">
            <Button variant="destructive" onClick={() => { if(confirm("Bạn có chắc muốn đăng xuất người dùng khỏi toàn bộ các thiết bị?")) resetDevices.mutate(currentUserData!.id) }} disabled={!currentUserData?.user_devices?.length}>
               Reset Toàn Bộ & Đăng Xuất Mọi Nơi
            </Button>
            <DialogClose asChild><Button variant="outline">Đóng</Button></DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helper Component for Deck Progress Editor ─────────────────────────────
function DeckProgressEditor({ ud, onUpdate, onRevoke }: { ud: UserDeckItem, onUpdate: (a: any) => void, onRevoke: () => void }) {
  const [editing, setEditing] = useState(false);
  
  const toLocalInput = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [exp, setExp] = useState(toLocalInput(ud.expired_at));
  const [prog, setProg] = useState(ud.progress_percent.toString());
  const [learn, setLearn] = useState(ud.learned_count.toString());

  const isExp = ud.expired_at ? new Date(ud.expired_at) < new Date() : false;

  if (!editing) return (
    <div className="p-3 border border-gray-200 rounded-xl bg-white flex justify-between items-center group">
      <div>
        <p className="font-semibold text-[#1a1a2e]">{ud.deck?.title}</p>
        <p className="text-xs text-gray-500 mt-1">
          Tiến độ: <span className="font-bold text-brand">{ud.progress_percent}%</span> ({ud.learned_count} từ)
        </p>
        <p className={`text-xs mt-1 ${isExp ? "text-red-500" : "text-green-600"}`}>
          {ud.expired_at ? `Hạn: ${new Date(ud.expired_at).toLocaleString()}` : "Không giới hạn thời gian"}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Sửa</Button>
        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={onRevoke} title="Thu hồi"><Trash2 className="w-4 h-4"/></Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 border-2 border-brand-light rounded-xl bg-blue-50/50 space-y-3">
      <p className="font-bold text-brand">{ud.deck?.title}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Tiến độ (%)</Label>
          <Input type="number" min="0" max="100" value={prog} onChange={e=>setProg(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Số từ đã học</Label>
          <Input type="number" min="0" value={learn} onChange={e=>setLearn(e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Thời hạn truy cập</Label>
        <div className="flex items-center gap-2">
          <Input type="datetime-local" value={exp} onChange={e=>setExp(e.target.value)} className="flex-1"/>
          <Button variant="outline" size="sm" onClick={()=>setExp("")}>Bỏ hạn</Button>
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" variant="brand" className="flex-1" onClick={() => {
          onUpdate({ progress_percent: parseInt(prog)||0, learned_count: parseInt(learn)||0, expiredAt: exp||null });
          setEditing(false);
        }}>Lưu thay đổi</Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Hủy</Button>
      </div>
    </div>
  )
}

function AdminAssignDeckList({ decks, currentUserData, assignDeckIds, setAssignDeckIds }: any) {
  const assignable = decks.filter((d: any) =>
    !currentUserData?.user_decks?.some((ud: any) => ud.deck_id === d.id)
  );
  const allSelected = assignable.length > 0 && assignable.every((d: any) => assignDeckIds.has(d.id));

  function toggleAll() {
    const next = new Set(assignDeckIds);
    if (allSelected) { assignable.forEach((d: any) => next.delete(d.id)); }
    else             { assignable.forEach((d: any) => next.add(d.id)); }
    setAssignDeckIds(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs text-muted-foreground">Danh sách chưa giao</Label>
        {assignable.length > 0 && (
          <button type="button" onClick={toggleAll}
            className="text-xs font-bold text-brand hover:underline">
            {allSelected ? "✕ Bỏ chọn tất cả" : "✓ Chọn tất cả"}
          </button>
        )}
      </div>
      <div className="max-h-48 overflow-y-auto border-2 border-[#f0e0e7] rounded-xl bg-white divide-y divide-[#f0e0e7]">
        {assignable.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 text-center italic">Đã giao toàn bộ bộ thẻ hiện có.</p>
        ) : assignable.map((d: any) => {
          const checked = assignDeckIds.has(d.id);
          return (
            <label key={d.id} className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors hover:bg-brand-light ${checked ? "bg-brand-light/50" : ""}`}>
              <input type="checkbox" checked={checked} onChange={e => {
                const next = new Set(assignDeckIds);
                if (e.target.checked) next.add(d.id); else next.delete(d.id);
                setAssignDeckIds(next);
              }} className="w-4 h-4 accent-brand flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${checked ? "font-bold text-brand" : "text-[#1a1a2e]"}`}>{d.title}</div>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  );
}
