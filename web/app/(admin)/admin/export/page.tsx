"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, FileJson, FileSpreadsheet, Loader2, Mail, Copy, Check, Search, Users, CopyCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserEmailItem {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface GroupEmailItem {
  id: string;
  name: string;
  created_at: string;
  user_count: number;
  emails: string[];
}

interface EmailExportData {
  all_emails: string[];
  users: UserEmailItem[];
  groups: GroupEmailItem[];
}

async function fetchEmailData(): Promise<EmailExportData> {
  return apiClient.get("/admin/export?type=emails&format=json_full");
}

export default function ExportPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ content: string; type: string; format: string } | null>(null);

  // Email state
  const [emailSubTab, setEmailSubTab] = useState<"all_emails" | "group_emails" | "export_files">("all_emails");
  const [emailSearch, setEmailSearch] = useState("");
  const [groupSearch, setGroupSearch] = useState("");
  
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedGroupAll, setCopiedGroupAll] = useState(false);
  const [copiedGroups, setCopiedGroups] = useState<Record<string, boolean>>({});
  const [copiedSingleUser, setCopiedSingleUser] = useState<Record<string, boolean>>({});

  const { data: emailData, isLoading: isLoadingEmails } = useQuery({
    queryKey: ["admin-export-emails"],
    queryFn: fetchEmailData,
  });

  async function handleExport(type: string, format: string, isPreview = false, subtype?: string) {
    const loaderKey = isPreview
      ? `prev-${type}-${subtype || ""}-${format}`
      : `${type}-${subtype || ""}-${format}`;
    setLoading(loaderKey);
    try {
      const path = `/admin/export?type=${type}&format=${format}${subtype ? `&subtype=${subtype}` : ""}`;
      const res = await apiClient.raw(path, { method: "GET" });
      if (!res.ok) throw new Error("Export failed");

      if (isPreview) {
        const text = await res.text();
        const label = subtype ? `${type.toUpperCase()} (${subtype.toUpperCase()})` : type.toUpperCase();
        setPreviewData({ content: text, type: label, format });
        toast({ title: "Đã tải dữ liệu xem trước" });
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = format === "csv" ? "csv" : format === "xlsx" ? "xlsx" : "json";
      a.href = blobUrl;
      const filename = subtype ? `${type}_${subtype}.${ext}` : `${type}_${format}.${ext}`;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(blobUrl);
      toast({ title: `Đã xuất ${filename}` });
    } catch (error) {
      toast({ title: "Thao tác thất bại", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  const handleCopy = (text: string, title: string, key?: { type: "all" | "group_all" | "group" | "user"; id?: string }) => {
    if (!text || text.trim() === "") {
      toast({ title: "Không có dữ liệu email để sao chép", variant: "destructive" });
      return;
    }
    navigator.clipboard.writeText(text);

    if (key?.type === "all") {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } else if (key?.type === "group_all") {
      setCopiedGroupAll(true);
      setTimeout(() => setCopiedGroupAll(false), 2000);
    } else if (key?.type === "group" && key.id) {
      const gid = key.id;
      setCopiedGroups(prev => ({ ...prev, [gid]: true }));
      setTimeout(() => setCopiedGroups(prev => ({ ...prev, [gid]: false })), 2000);
    } else if (key?.type === "user" && key.id) {
      const uid = key.id;
      setCopiedSingleUser(prev => ({ ...prev, [uid]: true }));
      setTimeout(() => setCopiedSingleUser(prev => ({ ...prev, [uid]: false })), 2000);
    }

    toast({ title });
  };

  // Filtered users for Tab 1
  const filteredUsers = (emailData?.users ?? []).filter(u =>
    u.email.toLowerCase().includes(emailSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(emailSearch.toLowerCase())
  );

  // Filtered groups for Tab 2
  const filteredGroups = (emailData?.groups ?? []).filter(g =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.emails.some(e => e.toLowerCase().includes(groupSearch.toLowerCase()))
  );

  // Formatted string for all grouped emails
  const allGroupedEmailsFormattedStr = (emailData?.groups ?? [])
    .map(g => `[ ${g.name} (${g.user_count} email) ]:\n${g.emails.join(", ")}`)
    .join("\n\n");

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Download className="w-8 h-8 text-brand" />
        <h1 className="text-xl md:text-2xl font-extrabold text-[#1a1a2e]">📦 Trình xuất dữ liệu</h1>
      </div>
      <p className="text-muted-foreground text-xs md:text-sm mb-6 md:mb-8">Xuất báo cáo và dữ liệu dự phòng hệ thống.</p>

      <Tabs defaultValue="groups" className="w-full">
        <div className="overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <TabsList className="flex w-max min-w-full bg-[#f0e0e7] p-1 h-auto rounded-xl">
            <TabsTrigger value="groups" className="flex-1 rounded-lg py-2 md:py-3 px-4 md:px-6 font-bold text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-brand whitespace-nowrap">Nhóm (Groups)</TabsTrigger>
            <TabsTrigger value="decks" className="flex-1 rounded-lg py-2 md:py-3 px-4 md:px-6 font-bold text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-brand whitespace-nowrap">Bộ đề (Decks)</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 rounded-lg py-2 md:py-3 px-4 md:px-6 font-bold text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-brand whitespace-nowrap">Người dùng (Users)</TabsTrigger>
            <TabsTrigger value="emails" className="flex-1 rounded-lg py-2 md:py-3 px-4 md:px-6 font-bold text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-brand whitespace-nowrap">📧 Email (Danh sách & Nhóm)</TabsTrigger>
          </TabsList>
        </div>

        {/* Groups / Decks / Users Categories rendering */}
        {["groups", "decks", "users"].map((cat) => (
          <TabsContent key={cat} value={cat} className="space-y-6">
            <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 md:p-8 shadow-sm">
              <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                <span className="bg-brand-light text-brand p-1.5 rounded-lg inline-block">
                  {cat === "groups" ? "📁" : cat === "decks" ? "🎴" : "👥"}
                </span>
                Xuất dữ liệu {cat === "groups" ? "Nhóm" : cat === "decks" ? "Bộ đề" : "Người dùng"}
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cat === "groups" && (
                  <>
                    <ExportButton 
                      loading={loading === "groups--csv"} 
                      prevLoading={loading === "prev-groups--csv"}
                      onExport={() => handleExport("groups", "csv")} 
                      onPreview={() => handleExport("groups", "csv", true)} 
                      icon={<FileSpreadsheet className="w-5 h-5" />}
                      title="CSV Format" desc="Bảng chuẩn (.csv)" />
                    <ExportButton 
                      loading={loading === "groups--json_full"} 
                      prevLoading={loading === "prev-groups--json_full"}
                      onExport={() => handleExport("groups", "json_full")} 
                      onPreview={() => handleExport("groups", "json_full", true)} 
                      icon={<FileJson className="w-5 h-5 text-brand" />}
                      title="Full JSON" desc="Dữ liệu chi tiết" />
                    <ExportButton 
                      loading={loading === "groups--json_mini"} 
                      prevLoading={loading === "prev-groups--json_mini"}
                      onExport={() => handleExport("groups", "json_mini")} 
                      onPreview={() => handleExport("groups", "json_mini", true)} 
                      icon={<FileJson className="w-5 h-5 text-muted-foreground" />}
                      title="Mini JSON" desc="Cấu trúc rút gọn" />
                  </>
                )}
                {cat === "decks" && (
                  <>
                    <ExportButton loading={loading === "decks--csv"} prevLoading={loading === "prev-decks--csv"} onExport={() => handleExport("decks", "csv")} onPreview={() => handleExport("decks", "csv", true)} icon={<FileSpreadsheet className="w-5 h-5" />} title="CSV Format" desc="Định dạng cột" />
                    <ExportButton loading={loading === "decks--json_full"} prevLoading={loading === "prev-decks--json_full"} onExport={() => handleExport("decks", "json_full")} onPreview={() => handleExport("decks", "json_full", true)} icon={<FileJson className="w-5 h-5 text-brand" />} title="Full JSON" desc="Mô tả & access" />
                    <ExportButton loading={loading === "decks--json_mini"} prevLoading={loading === "prev-decks--json_mini"} onExport={() => handleExport("decks", "json_mini")} onPreview={() => handleExport("decks", "json_mini", true)} icon={<FileJson className="w-5 h-5 text-muted-foreground" />} title="Mini JSON" desc="Chỉ ID & Tên" />
                  </>
                )}
                {cat === "users" && (
                  <>
                    <ExportButton loading={loading === "users--csv"} prevLoading={loading === "prev-users--csv"} onExport={() => handleExport("users", "csv")} onPreview={() => handleExport("users", "csv", true)} icon={<FileSpreadsheet className="w-5 h-5" />} title="CSV" desc="Hồ sơ người dùng" />
                    <ExportButton loading={loading === "users--json_full"} prevLoading={loading === "prev-users--json_full"} onExport={() => handleExport("users", "json_full")} onPreview={() => handleExport("users", "json_full", true)} icon={<FileJson className="w-5 h-5 text-indigo-500" />} title="Full JSON" desc="Profiles & Decks" />
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        ))}

        {/* ════════ EMAILS MAIN TAB ════════ */}
        <TabsContent value="emails" className="space-y-6">
          {/* Sub-Tab Navigation Bar */}
          <div className="flex bg-[#f8f9fa] border border-[#f0e0e7] p-1.5 rounded-2xl gap-1 max-w-2xl overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setEmailSubTab("all_emails")}
              className={`flex-1 py-2 px-3.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                emailSubTab === "all_emails"
                  ? "bg-white text-brand shadow-xs border border-brand/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"
              }`}
            >
              <Mail className="w-4 h-4" /> Danh sách tất cả Email
            </button>

            <button
              onClick={() => setEmailSubTab("group_emails")}
              className={`flex-1 py-2 px-3.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                emailSubTab === "group_emails"
                  ? "bg-white text-brand shadow-xs border border-brand/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"
              }`}
            >
              <Users className="w-4 h-4" /> Email theo Nhóm
            </button>

            <button
              onClick={() => setEmailSubTab("export_files")}
              className={`flex-1 py-2 px-3.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                emailSubTab === "export_files"
                  ? "bg-white text-brand shadow-xs border border-brand/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"
              }`}
            >
              <Download className="w-4 h-4" /> Xuất File Dữ liệu
            </button>
          </div>

          {/* ── SUB-TAB 1: Danh sách tất cả Email ── */}
          {emailSubTab === "all_emails" && (
            <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 md:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-gray-100">
                <div>
                  <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-[#1a1a2e]">
                    <span className="bg-brand-light text-brand p-1.5 rounded-lg inline-block">📧</span>
                    Danh sách tất cả Email
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tổng số: <span className="font-bold text-brand">{emailData?.all_emails?.length ?? 0}</span> email người dùng trong hệ thống.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <Button
                    variant="brand"
                    size="sm"
                    className="gap-2 font-bold shadow-sm"
                    onClick={() => handleCopy(
                      (emailData?.all_emails ?? []).join(", "),
                      `Đã sao chép ${emailData?.all_emails?.length ?? 0} email vào Clipboard!`,
                      { type: "all" }
                    )}
                  >
                    {copiedAll ? <Check className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                    {copiedAll ? "Đã chép!" : "Copy tất cả Email"}
                  </Button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo email hoặc quyền..."
                  value={emailSearch}
                  onChange={e => setEmailSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Email Table / List */}
              {isLoadingEmails ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" /> Đang tải danh sách email...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-gray-50 rounded-xl border border-dashed">
                  {emailSearch ? "Không tìm thấy email khớp với từ khóa." : "Chưa có dữ liệu email."}
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-100/80 sticky top-0 font-bold text-[#1a1a2e] uppercase text-[10px] tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="p-3 w-12 text-center">STT</th>
                          <th className="p-3">Email</th>
                          <th className="p-3 w-28">Vai Trò</th>
                          <th className="p-3 w-40">Ngày Tạo</th>
                          <th className="p-3 w-24 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map((u, i) => {
                          const isCopied = !!copiedSingleUser[u.id];
                          return (
                            <tr key={u.id} className="hover:bg-brand-light/10 transition-colors">
                              <td className="p-3 text-center text-muted-foreground font-mono">{i + 1}</td>
                              <td className="p-3 font-semibold text-[#1a1a2e] font-mono">{u.email}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  u.role === "ADMIN"
                                    ? "bg-purple-100 text-purple-700"
                                    : u.role === "SUBADMIN"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-3 text-muted-foreground text-[11px]">
                                {u.created_at ? new Date(u.created_at).toLocaleDateString("vi-VN") : "-"}
                              </td>
                              <td className="p-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-[11px] font-bold gap-1"
                                  onClick={() => handleCopy(u.email, `Đã copy ${u.email}`, { type: "user", id: u.id })}
                                >
                                  {isCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                                  {isCopied ? "Đã chép" : "Copy"}
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SUB-TAB 2: Danh sách Email theo Nhóm ── */}
          {emailSubTab === "group_emails" && (
            <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 md:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-gray-100">
                <div>
                  <h3 className="text-base md:text-lg font-bold flex items-center gap-2 text-[#1a1a2e]">
                    <span className="bg-brand-light text-brand p-1.5 rounded-lg inline-block">👥</span>
                    Danh sách Email theo từng Nhóm
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hiển thị các nhóm và danh sách Email thành viên. Bạn có thể copy từng nhóm hoặc copy toàn bộ.
                  </p>
                </div>

                <Button
                  variant="brand"
                  size="sm"
                  className="gap-2 font-bold shadow-sm flex-shrink-0"
                  onClick={() => handleCopy(
                    allGroupedEmailsFormattedStr,
                    "Đã sao chép toàn bộ danh sách Email phân theo từng nhóm!",
                    { type: "group_all" }
                  )}
                >
                  {copiedGroupAll ? <Check className="w-4 h-4 text-green-300" /> : <CopyCheck className="w-4 h-4" />}
                  {copiedGroupAll ? "Đã chép!" : "Copy tất cả (Chia theo Nhóm)"}
                </Button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm nhóm hoặc email thành viên..."
                  value={groupSearch}
                  onChange={e => setGroupSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Group Cards Grid */}
              {isLoadingEmails ? (
                <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-brand" /> Đang tải danh sách nhóm...
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-gray-50 rounded-xl border border-dashed">
                  {groupSearch ? "Không tìm thấy nhóm khớp với từ khóa." : "Chưa có dữ liệu nhóm nào."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[480px] overflow-y-auto pr-1">
                  {filteredGroups.map(g => {
                    const isCopied = !!copiedGroups[g.id];
                    const emailStr = g.emails.join(", ");
                    return (
                      <div
                        key={g.id}
                        className="bg-gray-50 border border-gray-200 hover:border-brand/40 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 border-b border-gray-200/60 pb-2.5">
                          <div>
                            <div className="font-extrabold text-sm text-[#1a1a2e] flex items-center gap-1.5">
                              <span>📁</span> {g.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                              Số lượng: <span className="text-brand font-bold">{g.user_count}</span> thành viên
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs font-bold gap-1.5 flex-shrink-0"
                            onClick={() => handleCopy(
                              emailStr,
                              `Đã sao chép ${g.emails.length} email của nhóm "${g.name}"!`,
                              { type: "group", id: g.id }
                            )}
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                            {isCopied ? "Đã chép" : "Copy Email Nhóm"}
                          </Button>
                        </div>

                        {g.emails.length > 0 ? (
                          <div className="bg-white border border-gray-200 rounded-xl p-3 max-h-32 overflow-y-auto">
                            <div className="flex flex-wrap gap-1.5">
                              {g.emails.map((em, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-800 text-[11px] font-mono px-2 py-0.5 rounded-md font-medium">
                                  {em}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] italic text-muted-foreground py-2">Nhóm chưa có thành viên nào.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── SUB-TAB 3: Xuất dữ liệu File (CSV & XLSX) ── */}
          {emailSubTab === "export_files" && (
            <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 md:p-8 shadow-sm">
              <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2 uppercase tracking-wide">
                <span className="bg-brand-light text-brand p-1.5 rounded-lg inline-block">📥</span>
                Xuất File Dữ liệu Email (CSV & XLSX Excel)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Button 1: All Emails CSV */}
                <ExportButton
                  loading={loading === "emails-all-csv"}
                  prevLoading={loading === "prev-emails-all-csv"}
                  onExport={() => handleExport("emails", "csv", false, "all")}
                  onPreview={() => handleExport("emails", "csv", true, "all")}
                  icon={<FileSpreadsheet className="w-5 h-5 text-blue-600" />}
                  title="Tất cả Email (CSV)"
                  desc="Bảng CSV toàn bộ email"
                />

                {/* Button 2: All Emails XLSX */}
                <ExportButton
                  loading={loading === "emails-all-xlsx"}
                  prevLoading={loading === "prev-emails-all-xlsx"}
                  onExport={() => handleExport("emails", "xlsx", false, "all")}
                  onPreview={() => handleExport("emails", "csv", true, "all")}
                  icon={<FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
                  title="Tất cả Email (XLSX)"
                  desc="File Excel (.xlsx) tất cả email"
                />

                {/* Button 3: Group Emails CSV */}
                <ExportButton
                  loading={loading === "emails-by_group-csv"}
                  prevLoading={loading === "prev-emails-by_group-csv"}
                  onExport={() => handleExport("emails", "csv", false, "by_group")}
                  onPreview={() => handleExport("emails", "csv", true, "by_group")}
                  icon={<FileSpreadsheet className="w-5 h-5 text-purple-600" />}
                  title="Email theo Nhóm (CSV)"
                  desc="Phân loại theo Nhóm (.csv)"
                />

                {/* Button 4: Group Emails XLSX */}
                <ExportButton
                  loading={loading === "emails-by_group-xlsx"}
                  prevLoading={loading === "prev-emails-by_group-xlsx"}
                  onExport={() => handleExport("emails", "xlsx", false, "by_group")}
                  onPreview={() => handleExport("emails", "csv", true, "by_group")}
                  icon={<FileSpreadsheet className="w-5 h-5 text-teal-600" />}
                  title="Email theo Nhóm (XLSX)"
                  desc="File Excel (.xlsx) theo Nhóm"
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Inline Preview Section */}
        {previewData && (
          <div className="mt-8 bg-[#1a1a2e] text-white rounded-2xl p-4 md:p-6 shadow-xl border-t-4 border-brand animate-in fade-in slide-in-from-top-4 overflow-hidden relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-sm font-bold">📄</div>
                <div>
                  <h4 className="font-bold text-sm">Xem trước: {previewData.type} ({previewData.format})</h4>
                  <p className="text-[10px] text-gray-400">Dữ liệu thô đang hiển thị dưới đây</p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewData(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-lg">ĐÓNG XEM TRƯỚC</span>
              </button>
            </div>
            <pre className="text-[11px] md:text-xs font-mono bg-black/30 p-4 rounded-xl overflow-x-auto max-h-[400px] scrollbar-thin scrollbar-thumb-brand scrollbar-track-transparent">
              {previewData.content}
            </pre>
          </div>
        )}
      </Tabs>
    </div>
  );
}

function ExportButton({ onExport, onPreview, loading, prevLoading, icon, title, desc }: any) {
  return (
    <div className="group relative bg-gray-50 rounded-2xl border-2 border-gray-100 hover:border-brand hover:bg-brand-light/10 transition-all p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-brand transition-colors">
          {icon}
        </div>
        <div>
          <div className="font-bold text-xs text-[#1a1a2e]">{title}</div>
          <div className="text-[9px] uppercase font-bold text-muted-foreground">{desc}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <button 
          onClick={onPreview} 
          disabled={loading || prevLoading}
          className="flex-1 py-2 text-[10px] font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 transition-colors uppercase"
        >
          {prevLoading ? <Loader2 className="w-3 h-3 animate-spin mx-auto text-brand" /> : "Xem trước"}
        </button>
        <button 
          onClick={onExport} 
          disabled={loading || prevLoading}
          className="flex-1 py-2 text-[10px] font-bold rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50 transition-all shadow-sm uppercase"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Tải về"}
        </button>
      </div>
    </div>
  );
}
