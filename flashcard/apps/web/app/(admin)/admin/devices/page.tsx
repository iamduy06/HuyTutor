"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2, Monitor, Smartphone, Trash2, RefreshCw,
  Settings, Users, Shield, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getClientErrorMessage, parseApiErrorMessage } from "@/lib/errorHandler";
import { PaginationControls } from "@/components/common/PaginationControls";
import type { PaginationMeta } from "@huytutor/shared";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

// ─── Types ───────────────────────────────────────────────────────────────────
interface UserDevice {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string | null;
  ip_address: string | null;
  last_seen: string;
  created_at: string;
}

interface UserRow {
  id: string;
  email: string;
  role: string;
  max_devices: number | null;
  device_count?: number;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function AdminDevicesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [selectedUser,    setSelectedUser]    = useState<UserRow | null>(null);
  const [showDevicesDlg,  setShowDevicesDlg]  = useState(false);
  const [showLimitDlg,    setShowLimitDlg]    = useState(false);
  const [limitValue,      setLimitValue]      = useState("");
  const [globalLimitVal,  setGlobalLimitVal]  = useState("");
  const [searchEmail,     setSearchEmail]     = useState("");
  const [page,            setPage]            = useState(1);
  const [pageSize,        setPageSize]        = useState(20);

  // ── Fetch global setting ──
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin-devices-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/devices");
      return res.json() as Promise<{ global_max_devices: number }>;
    },
  });

  // ── Fetch users + device counts ──
  const { data: userData, isLoading: usersLoading, isFetching: usersFetching } = useQuery({
    queryKey: ["admin-device-users", page, pageSize, searchEmail],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
      });
      if (searchEmail.trim()) {
        params.set("search", searchEmail.trim());
      }
      const res = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await res.json();
      return {
        users: (data.users ?? []) as UserRow[],
        pagination: data.pagination as PaginationMeta | undefined,
      };
    },
    placeholderData: (prev) => prev,
  });

  const users = userData?.users ?? [];
  const pagination = userData?.pagination;

  // ── Fetch devices of selected user ──
  const { data: devices = [], isLoading: devicesLoading, refetch: refetchDevices } = useQuery({
    queryKey: ["admin-user-devices", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const res = await fetch(`/api/admin/devices?user_id=${selectedUser.id}`);
      const data = await res.json();
      return (data.devices ?? []) as UserDevice[];
    },
    enabled: !!selectedUser,
  });

  // ── Mutations ──
  const setGlobalLimit = useMutation({
    mutationFn: async (val: number) => {
      const res = await fetch("/api/admin/devices", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ global_max_devices: val }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(parseApiErrorMessage(d, "Đặt giới hạn toàn cục thất bại"));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-devices-settings"] });
      toast({ title: `✅ Đã đặt giới hạn toàn cục: ${globalLimitVal} thiết bị` });
      setGlobalLimitVal("");
    },
    onError: (e: any) => toast({ title: getClientErrorMessage(e, "Đặt giới hạn toàn cục thất bại"), variant: "destructive" }),
  });

  const setUserLimit = useMutation({
    mutationFn: async ({ userId, limit }: { userId: string; limit: number | null }) => {
      const res = await fetch("/api/admin/devices", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, max_devices: limit }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(parseApiErrorMessage(d, "Cập nhật giới hạn thiết bị thất bại"));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-device-users"] });
      toast({ title: "✅ Đã cập nhật giới hạn thiết bị" });
      setShowLimitDlg(false);
    },
    onError: (e: any) => toast({ title: getClientErrorMessage(e, "Cập nhật giới hạn thiết bị thất bại"), variant: "destructive" }),
  });

  const deleteDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      const res = await fetch("/api/admin/devices", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(parseApiErrorMessage(d, "Xoá thiết bị thất bại"));
      }
    },
    onSuccess: () => {
      refetchDevices();
      toast({ title: "✅ Đã xóa thiết bị" });
    },
    onError: (e: any) => toast({ title: getClientErrorMessage(e, "Xoá thiết bị thất bại"), variant: "destructive" }),
  });

  const deleteAllDevices = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/admin/devices", {
        method: "DELETE", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(parseApiErrorMessage(d, "Xoá tất cả thiết bị thất bại"));
      }
    },
    onSuccess: () => {
      refetchDevices();
      toast({ title: "✅ Đã xóa tất cả thiết bị" });
    },
    onError: (e: any) => toast({ title: getClientErrorMessage(e, "Xoá tất cả thiết bị thất bại"), variant: "destructive" }),
  });

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  function openDevices(user: UserRow) {
    setSelectedUser(user);
    setShowDevicesDlg(true);
  }

  function openSetLimit(user: UserRow) {
    setSelectedUser(user);
    setLimitValue(user.max_devices !== null ? String(user.max_devices) : "");
    setShowLimitDlg(true);
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  function deviceIcon(name: string | null) {
    if (!name) return <Monitor className="w-4 h-4" />;
    const n = name.toLowerCase();
    if (n.includes("mobile") || n.includes("android") || n.includes("iphone") || n.includes("ios"))
      return <Smartphone className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-6">🖥️ Quản lý thiết bị</h1>

      {/* ── Global setting ── */}
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-5 h-5 text-brand" />
          <h2 className="font-bold text-[#1a1a2e]">Giới hạn thiết bị toàn cục</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Áp dụng cho tất cả tài khoản <strong>USER</strong> không có giới hạn riêng.
          Tài khoản <strong>ADMIN</strong> không bị giới hạn.
        </p>
        {settingsLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-brand" />
        ) : (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-brand-light border-2 border-brand-mid rounded-xl px-5 py-3 text-center">
              <div className="text-3xl font-extrabold text-brand">{settings?.global_max_devices ?? 3}</div>
              <div className="text-xs text-muted-foreground mt-0.5">thiết bị hiện tại</div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number" min={1} max={20}
                value={globalLimitVal}
                onChange={e => setGlobalLimitVal(e.target.value)}
                placeholder="Số mới..."
                className="w-28"
              />
              <Button variant="brand" disabled={!globalLimitVal || setGlobalLimit.isPending}
                onClick={() => setGlobalLimit.mutate(parseInt(globalLimitVal))}>
                {setGlobalLimit.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Cập nhật
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Thay đổi này sẽ áp dụng ngay cho lần đăng nhập tiếp theo.
            </p>
          </div>
        )}
      </div>

      {/* ── User list ── */}
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] overflow-hidden">
        <div className="p-4 border-b border-[#f0e0e7] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            <h2 className="font-bold text-[#1a1a2e]">Người dùng</h2>
          </div>
          <Input
            placeholder="🔍 Tìm theo email..."
            value={searchEmail}
            onChange={e => { setSearchEmail(e.target.value); setPage(1); }}
            className="max-w-xs"
          />
        </div>

        {usersLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
        ) : (
          <>
            <div className={`overflow-x-auto transition-opacity duration-150 ${usersFetching && !usersLoading ? 'opacity-60' : ''}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#f0e0e7] bg-[#f8f9fa]">
                  <th className="text-left p-3 font-bold text-[#1a1a2e]">Email</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e]">Role</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e]">Giới hạn thiết bị</th>
                  <th className="text-left p-3 font-bold text-[#1a1a2e]">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-[#f0e0e7] hover:bg-[#f8f9fa]">
                    <td className="p-3 font-medium text-[#1a1a2e] max-w-[220px] truncate">{u.email}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-brand-light text-brand"
                      }`}>{u.role}</span>
                    </td>
                    <td className="p-3">
                      {u.role === "ADMIN" ? (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Shield className="w-3.5 h-3.5" /> Không giới hạn
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            u.max_devices !== null
                              ? "bg-orange-100 text-orange-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {u.max_devices !== null
                              ? `${u.max_devices} thiết bị (riêng)`
                              : `${settings?.global_max_devices ?? 3} thiết bị (mặc định)`}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1.5 flex-wrap">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1"
                          onClick={() => openDevices(u)}>
                          <Monitor className="w-3.5 h-3.5" /> Thiết bị
                        </Button>
                        {u.role !== "ADMIN" && (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1"
                            onClick={() => openSetLimit(u)}>
                            <Settings className="w-3.5 h-3.5" /> Đặt giới hạn
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Không tìm thấy</td></tr>
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
              isLoading={usersFetching}
              itemName="người dùng"
            />
          </div>
          </>
        )}
      </div>

      {/* ════ Dialog: Xem thiết bị ════ */}
      <Dialog open={showDevicesDlg} onOpenChange={setShowDevicesDlg}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              🖥️ Thiết bị của {selectedUser?.email}
            </DialogTitle>
          </DialogHeader>

          {devicesLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Chưa có thiết bị nào đăng ký.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{devices.length} thiết bị</span>
                <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 gap-1"
                  onClick={() => { if (confirm("Xóa tất cả thiết bị?")) selectedUser && deleteAllDevices.mutate(selectedUser.id); }}>
                  <Trash2 className="w-3 h-3" /> Xóa tất cả
                </Button>
              </div>
              {devices.map(d => (
                <div key={d.id} className="flex items-start gap-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#f0e0e7]">
                  <div className="mt-0.5 text-brand">{deviceIcon(d.device_name)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-[#1a1a2e] truncate">
                      {d.device_name ?? "Thiết bị không xác định"}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                      {d.ip_address && <div>🌐 IP: {d.ip_address}</div>}
                      <div>🕒 Lần cuối: {formatDate(d.last_seen)}</div>
                      <div>📅 Đăng ký: {formatDate(d.created_at)}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 flex-shrink-0"
                    onClick={() => { if (confirm("Xóa thiết bị này?")) deleteDevice.mutate(d.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDevicesDlg(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════ Dialog: Đặt giới hạn riêng ════ */}
      <Dialog open={showLimitDlg} onOpenChange={setShowLimitDlg}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>⚙️ Giới hạn thiết bị riêng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Đặt giới hạn riêng cho <strong>{selectedUser?.email}</strong>.
              Để trống = dùng giới hạn toàn cục ({settings?.global_max_devices ?? 3}).
            </p>
            {selectedUser?.max_devices !== null && selectedUser?.max_devices !== undefined && (
              <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Đang có giới hạn riêng: <strong>{selectedUser.max_devices} thiết bị</strong>
              </div>
            )}
            <div>
              <Label>Số thiết bị tối đa (để trống = mặc định toàn cục)</Label>
              <Input
                type="number" min={1} max={50}
                value={limitValue}
                onChange={e => setLimitValue(e.target.value)}
                placeholder={`Mặc định: ${settings?.global_max_devices ?? 3}`}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {selectedUser?.max_devices !== null && (
              <Button variant="outline" className="text-orange-600 border-orange-300 flex-1"
                disabled={setUserLimit.isPending}
                onClick={() => selectedUser && setUserLimit.mutate({ userId: selectedUser.id, limit: null })}>
                Xóa giới hạn riêng (dùng toàn cục)
              </Button>
            )}
            <Button variant="brand" className="flex-1"
              disabled={setUserLimit.isPending}
              onClick={() => {
                if (!selectedUser) return;
                const val = limitValue.trim() ? parseInt(limitValue) : null;
                setUserLimit.mutate({ userId: selectedUser.id, limit: val });
              }}>
              {setUserLimit.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
