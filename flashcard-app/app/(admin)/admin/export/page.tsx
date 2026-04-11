"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ExportPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ content: string; type: string; format: string } | null>(null);

  async function handleExport(type: string, format: string, isPreview = false) {
    const loaderKey = isPreview ? `prev-${type}-${format}` : `${type}-${format}`;
    setLoading(loaderKey);
    try {
      const res = await fetch(`/api/admin/export?type=${type}&format=${format}`);
      if (!res.ok) throw new Error("Export failed");

      if (isPreview) {
        const text = await res.text();
        setPreviewData({ content: text, type, format });
        toast({ title: "Đã tải dữ liệu xem trước" });
        return;
      }

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
      toast({ title: "Thao tác thất bại", variant: "destructive" });
    } finally {
      setLoading(null);
    }
  }

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
          </TabsList>
        </div>

        {/* Categories rendering */}
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
                      loading={loading === "groups-csv"} 
                      prevLoading={loading === "prev-groups-csv"}
                      onExport={() => handleExport("groups", "csv")} 
                      onPreview={() => handleExport("groups", "csv", true)} 
                      icon={<FileSpreadsheet className="w-5 h-5" />}
                      title="CSV Format" desc="Bảng chuẩn (.csv)" />
                    <ExportButton 
                      loading={loading === "groups-json_full"} 
                      prevLoading={loading === "prev-groups-json_full"}
                      onExport={() => handleExport("groups", "json_full")} 
                      onPreview={() => handleExport("groups", "json_full", true)} 
                      icon={<FileJson className="w-5 h-5 text-brand" />}
                      title="Full JSON" desc="Dữ liệu chi tiết" />
                    <ExportButton 
                      loading={loading === "groups-json_mini"} 
                      prevLoading={loading === "prev-groups-json_mini"}
                      onExport={() => handleExport("groups", "json_mini")} 
                      onPreview={() => handleExport("groups", "json_mini", true)} 
                      icon={<FileJson className="w-5 h-5 text-muted-foreground" />}
                      title="Mini JSON" desc="Cấu trúc rút gọn" />
                  </>
                )}
                {cat === "decks" && (
                  <>
                    <ExportButton loading={loading === "decks-csv"} prevLoading={loading === "prev-decks-csv"} onExport={() => handleExport("decks", "csv")} onPreview={() => handleExport("decks", "csv", true)} icon={<FileSpreadsheet className="w-5 h-5" />} title="CSV Format" desc="Định dạng cột" />
                    <ExportButton loading={loading === "decks-json_full"} prevLoading={loading === "prev-decks-json_full"} onExport={() => handleExport("decks", "json_full")} onPreview={() => handleExport("decks", "json_full", true)} icon={<FileJson className="w-5 h-5 text-brand" />} title="Full JSON" desc="Mô tả & access" />
                    <ExportButton loading={loading === "decks-json_mini"} prevLoading={loading === "prev-decks-json_mini"} onExport={() => handleExport("decks", "json_mini")} onPreview={() => handleExport("decks", "json_mini", true)} icon={<FileJson className="w-5 h-5 text-muted-foreground" />} title="Mini JSON" desc="Chỉ ID & Tên" />
                  </>
                )}
                {cat === "users" && (
                  <>
                    <ExportButton loading={loading === "users-csv"} prevLoading={loading === "prev-users-csv"} onExport={() => handleExport("users", "csv")} onPreview={() => handleExport("users", "csv", true)} icon={<FileSpreadsheet className="w-5 h-5" />} title="CSV" desc="Hồ sơ người dùng" />
                    <ExportButton loading={loading === "users-json_full"} prevLoading={loading === "prev-users-json_full"} onExport={() => handleExport("users", "json_full")} onPreview={() => handleExport("users", "json_full", true)} icon={<FileJson className="w-5 h-5 text-indigo-500" />} title="Full JSON" desc="Profiles & Decks" />
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        ))}

        {/* Inline Preview Section */}
        {previewData && (
          <div className="mt-8 bg-[#1a1a2e] text-white rounded-2xl p-4 md:p-6 shadow-xl border-t-4 border-brand animate-in fade-in slide-in-from-top-4 overflow-hidden relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-sm font-bold">📄</div>
                <div>
                  <h4 className="font-bold text-sm">Xem trước: {previewData.type.toUpperCase()} ({previewData.format})</h4>
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
