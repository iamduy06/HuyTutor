"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ExportPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleExport(type: string, format: string) {
    setLoading(`${type}-${format}`);
    try {
      const res = await fetch(`/api/admin/export?type=${type}&format=${format}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = format === "csv" ? "csv" : "json";
      
      a.href = url;
      a.download = `${type}_${format}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: `Đã xuất ${type}_${format}.${ext}` });
    } catch (error) {
      toast({ title: "Xuất dữ liệu thất bại", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-2">
        <Download className="w-8 h-8 text-brand" />
        <h1 className="text-2xl font-extrabold text-[#1a1a2e]">📦 Trình xuất dữ liệu</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-8">Xuất báo cáo và dữ liệu dự phòng của hệ thống dưới nhiều định dạng khác nhau.</p>

      <Tabs defaultValue="groups" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#f0e0e7] p-1 h-auto rounded-xl mb-6">
          <TabsTrigger value="groups" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-brand">Nhóm (Groups)</TabsTrigger>
          <TabsTrigger value="decks" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-brand">Bộ đề (Decks)</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-brand">Người dùng (Users)</TabsTrigger>
        </TabsList>

        {/* ── Tab: Groups ── */}
        <TabsContent value="groups" className="space-y-6">
          <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="bg-brand-light text-brand p-1.5 rounded-lg inline-block">📁</span>
              Xuất dữ liệu Nhóm học viên
            </h3>
            <p className="text-sm text-muted-foreground mb-6">Bao gồm thông tin nhóm, danh sách thành viên và các bộ đề được gán cho nhóm.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ExportButton 
                onClick={() => handleExport("groups", "csv")} 
                loading={loading === "groups-csv"}
                icon={<FileSpreadsheet className="w-5 h-5" />}
                title="Xuất CSV"
                desc="ID, Tên, Users, Decks..."
              />
              <ExportButton 
                onClick={() => handleExport("groups", "json_full")} 
                loading={loading === "groups-json_full"}
                icon={<FileJson className="w-5 h-5 text-brand" />}
                title="Full JSON"
                desc="Dữ liệu chi tiết, lồng nhau"
              />
              <ExportButton 
                onClick={() => handleExport("groups", "json_mini")} 
                loading={loading === "groups-json_mini"}
                icon={<FileJson className="w-5 h-5 text-muted-foreground" />}
                title="Mini JSON"
                desc="ID, Users [], Decks []"
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Decks ── */}
        <TabsContent value="decks" className="space-y-6">
          <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="bg-brand-light text-brand p-1.5 rounded-lg inline-block">🎴</span>
              Xuất dữ liệu Flashcards
            </h3>
            <p className="text-sm text-muted-foreground mb-6">Danh sách tất cả các bộ đề hiện có cùng cấu hình phân quyền và cấp độ học tập.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <ExportButton 
                onClick={() => handleExport("decks", "csv")} 
                loading={loading === "decks-csv"}
                icon={<FileSpreadsheet className="w-5 h-5" />}
                title="Xuất CSV"
                desc="Format bảng chuẩn"
              />
              <ExportButton 
                onClick={() => handleExport("decks", "json_full")} 
                loading={loading === "decks-json_full"}
                icon={<FileJson className="w-5 h-5 text-brand" />}
                title="Full JSON"
                desc="Tất cả thuộc tính"
              />
              <ExportButton 
                onClick={() => handleExport("decks", "json_mini")} 
                loading={loading === "decks-json_mini"}
                icon={<FileJson className="w-5 h-5 text-muted-foreground" />}
                title="Mini JSON"
                desc="Chỉ ID và Tên"
              />
              <ExportButton 
                onClick={() => handleExport("decks", "json_ids")} 
                loading={loading === "decks-json_ids"}
                icon={<Download className="w-5 h-5 text-indigo-500" />}
                title="Full IDs"
                desc="Danh sách [ID1, ID2...]"
              />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Users ── */}
        <TabsContent value="users" className="space-y-6">
          <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-8 shadow-sm">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="bg-brand-light text-brand p-1.5 rounded-lg inline-block">👥</span>
              Xuất dữ liệu Người dùng
            </h3>
            <p className="text-sm text-muted-foreground mb-6">Toàn bộ hồ sơ người dùng kèm danh sách thiết bị và các bộ đề cá nhân đã được gán.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ExportButton 
                onClick={() => handleExport("users", "csv")} 
                loading={loading === "users-csv"}
                icon={<FileSpreadsheet className="w-5 h-5" />}
                title="Xuất CSV"
                desc="ID, Email, Role, Decks..."
              />
              <ExportButton 
                onClick={() => handleExport("users", "json_full")} 
                loading={loading === "users-json_full"}
                icon={<FileJson className="w-5 h-5 text-brand" />}
                title="Full JSON"
                desc="Bao gồm Device & Decks"
              />
              <ExportButton 
                onClick={() => handleExport("users", "json_mini")} 
                loading={loading === "users-json_mini"}
                icon={<FileJson className="w-5 h-5 text-muted-foreground" />}
                title="Mini JSON"
                desc="ID, Email, Deck IDs"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExportButton({ onClick, loading, icon, title, desc }: any) {
  return (
    <button 
      onClick={onClick} 
      disabled={loading}
      className="flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-brand hover:bg-brand-light/20 hover:scale-[1.02] active:scale-95 transition-all text-center group disabled:opacity-50 disabled:pointer-events-none"
    >
      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-600 group-hover:text-brand transition-colors">
          {icon}
        </div>
      )}
      <div>
        <div className="font-extrabold text-sm text-[#1a1a2e] mb-1">{title}</div>
        <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}
