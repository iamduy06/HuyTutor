"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Paintbrush2, Eye, EyeOff, Type, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getClientErrorMessage, parseApiErrorMessage } from "@/lib/errorHandler";

interface GroupBranding {
  allow_custom_branding: boolean;
  show_header: boolean;
  show_footer: boolean;
  header_logo_text: string | null;
}

interface GroupItem {
  id: string;
  name: string;
  branding: GroupBranding | null;
}

async function fetchBranding(): Promise<{ groups: GroupItem[]; isAdmin: boolean }> {
  const res = await fetch("/api/subadmin/branding");
  if (!res.ok) throw new Error("Không thể tải dữ liệu branding");
  return res.json();
}

export default function SubAdminBrandingClient() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ["subadmin-branding"],
    queryFn: fetchBranding,
  });

  const groups = data?.groups ?? [];
  const [localBrandings, setLocalBrandings] = useState<Record<string, GroupBranding>>({});

  function getBranding(group: GroupItem): GroupBranding {
    const b = localBrandings[group.id] ?? group.branding;
    return {
      allow_custom_branding: b?.allow_custom_branding ?? false,
      show_header: b?.show_header ?? true,
      show_footer: b?.show_footer ?? true,
      header_logo_text: b?.header_logo_text ?? null,
    };
  }

  function patchLocal(groupId: string, patch: Partial<GroupBranding>) {
    setLocalBrandings(prev => ({
      ...prev,
      [groupId]: { ...getBranding(groups.find(g => g.id === groupId)!), ...prev[groupId], ...patch },
    }));
  }

  const saveMutation = useMutation({
    mutationFn: async ({ groupId, branding }: { groupId: string; branding: GroupBranding }) => {
      const res = await fetch("/api/subadmin/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_id: groupId,
          show_header: branding.show_header,
          show_footer: branding.show_footer,
          header_logo_text: branding.header_logo_text,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(parseApiErrorMessage(data, "Lưu cài đặt Branding thất bại"));
      }
      return res.json().catch(() => ({}));
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["subadmin-branding"] });
      setLocalBrandings(prev => {
        const next = { ...prev };
        delete next[vars.groupId];
        return next;
      });
      toast({ title: "Đã lưu cài đặt Branding thành công" });
    },
    onError: (e: any) => toast({ title: getClientErrorMessage(e, "Lưu cài đặt Branding thất bại"), variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 font-semibold">
        Lỗi: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-[#1a1a2e] flex items-center gap-2">
          <Paintbrush2 className="w-6 h-6 text-purple-600" />
          Branding theo Nhóm
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tuỳ chỉnh giao diện Header / Footer hiển thị với học viên trong nhóm của bạn.
          Chỉ áp dụng nếu Admin đã cấp quyền cho nhóm đó.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center text-gray-400">
          Bạn chưa được phân quyền quản lý nhóm nào.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => {
            const branding = getBranding(group);
            const isLocked = !(group.branding?.allow_custom_branding ?? false);
            const isDirty = localBrandings[group.id] !== undefined;

            return (
              <div key={group.id} className={`bg-white rounded-2xl border-2 ${isLocked ? "border-gray-200 opacity-75" : "border-purple-200"} overflow-hidden`}>
                {/* Card Header */}
                <div className={`px-5 py-4 flex items-center justify-between ${isLocked ? "bg-gray-50" : "bg-purple-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isLocked ? "bg-gray-200" : "bg-purple-100"}`}>
                      {isLocked
                        ? <Lock className="w-5 h-5 text-gray-500" />
                        : <Paintbrush2 className="w-5 h-5 text-purple-600" />
                      }
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${isLocked ? "text-red-500" : "text-purple-600"}`}>
                        {isLocked
                          ? "🔒 Chưa được Admin cấp quyền Branding"
                          : "Đã được Admin cấp quyền Branding"}
                      </p>
                    </div>
                  </div>
                  {!isLocked && isDirty && (
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                      Chưa lưu
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="px-5 py-4 space-y-4">
                  {isLocked ? (
                    <p className="text-sm text-gray-500 italic py-2">
                      Admin chưa bật tính năng Branding cho nhóm này. Liên hệ Admin để được kích hoạt.
                    </p>
                  ) : (
                    <>
                      {/* Toggle Header */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                          {branding.show_header
                            ? <Eye className="w-4 h-4 text-green-600" />
                            : <EyeOff className="w-4 h-4 text-gray-400" />
                          }
                          <div>
                            <p className="text-sm font-bold text-[#1a1a2e]">Hiển thị SiteHeader</p>
                            <p className="text-xs text-muted-foreground">Thanh điều hướng phía trên cùng</p>
                          </div>
                        </div>
                        <button
                          onClick={() => patchLocal(group.id, { show_header: !branding.show_header })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.show_header ? "bg-brand" : "bg-gray-300"}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${branding.show_header ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>

                      {/* Toggle Footer */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-3">
                          {branding.show_footer
                            ? <Eye className="w-4 h-4 text-green-600" />
                            : <EyeOff className="w-4 h-4 text-gray-400" />
                          }
                          <div>
                            <p className="text-sm font-bold text-[#1a1a2e]">Hiển thị SiteFooter</p>
                            <p className="text-xs text-muted-foreground">Thanh thông tin phía dưới trang</p>
                          </div>
                        </div>
                        <button
                          onClick={() => patchLocal(group.id, { show_footer: !branding.show_footer })}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${branding.show_footer ? "bg-brand" : "bg-gray-300"}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${branding.show_footer ? "translate-x-6" : "translate-x-1"}`} />
                        </button>
                      </div>

                      {/* Logo Text */}
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <Type className="w-4 h-4 text-brand" />
                          <Label className="text-sm font-bold text-[#1a1a2e]">Thay Logo bằng Text</Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Nếu điền vào, logo ảnh sẽ được thay thế bằng dòng text này trên Header.
                        </p>
                        <Input
                          placeholder="Để trống = dùng logo mặc định"
                          value={branding.header_logo_text ?? ""}
                          onChange={e => patchLocal(group.id, { header_logo_text: e.target.value || null })}
                          className="bg-white"
                        />
                        {branding.header_logo_text && (
                          <div className="mt-2 p-2 rounded-lg bg-brand-light border border-brand/20">
                            <span className="text-xs text-brand font-semibold">
                              Xem trước: <strong className="text-base">{branding.header_logo_text}</strong>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Save Button */}
                      <Button
                        variant="brand"
                        className="w-full h-11 text-base font-bold"
                        disabled={saveMutation.isPending || !isDirty}
                        onClick={() => saveMutation.mutate({ groupId: group.id, branding })}
                      >
                        {saveMutation.isPending
                          ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          : <Paintbrush2 className="w-4 h-4 mr-2" />
                        }
                        {isDirty ? "Lưu thay đổi Branding" : "Chưa có thay đổi"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
