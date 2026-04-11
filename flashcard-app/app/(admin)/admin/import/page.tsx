"use client";

import { useState, useRef } from "react";
import { 
  Upload, Download, FileJson, FileSpreadsheet, 
  CheckCircle, XCircle, AlertCircle, Loader2, 
  Copy, Check, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { csvToObjects } from "@/lib/import-utils";

type ImportType = "groups" | "decks" | "users";

export default function ImportPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<ImportType>("groups");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const templates = {
    groups: {
      csv: "id,users,decks,expire_at,assign_all\nGROUP_ID_HERE,\"email1, email2\",\"deck_id_1, deck_id_2\",31/12/2025,TRUE",
      json: [{ id: "GROUP_ID", users: ["email1", "id2"], decks: ["id1", "id2"], expire_at: "31/12/2025", assign_all: true }]
    },
    decks: {
      csv: "id,user,expire_at\nDECK_ID_HERE,\"email1, id2\",31/12/2025",
      json: [{ id: "DECK_ID", user: ["email1", "id2"], expire_at: "31/12/2025" }]
    },
    users: {
      csv: "email,password,group_id,role,deck,expire_at\nuser@test.com,goidangkyflashcard,GROUP_ID,USER,\"deck1, deck2\",31/12/2025",
      json: [{ email: "user@test.com", password: "goidangkyflashcard", group_id: "GID", role: "USER", deck: ["d1", "d2"], expire_at: "31/12/2025" }]
    }
  };

  function downloadTemplate(format: "csv" | "json") {
    const content = format === "csv" 
      ? templates[activeTab].csv 
      : JSON.stringify(templates[activeTab].json, null, 2);
    
    const blob = new Blob([content], { type: format === "csv" ? "text/csv" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${activeTab}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function processData(text: string, format: "json" | "csv") {
    setImporting(true);
    setResults(null);
    try {
      let data: any[] = [];
      if (format === "json") {
        data = JSON.parse(text);
      } else {
        data = csvToObjects(text);
      }
      if (!Array.isArray(data)) data = [data];

      const res = await fetch(`/api/admin/import/${activeTab}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resultData = await res.json();
      setResults(resultData);
      const successCount = resultData.filter((r: any) => r.status === "success").length;
      toast({ title: `✅ Xong. ${successCount}/${resultData.length} thành công.` });
      if (manualMode) setManualData(""); 
    } catch (err: any) {
      toast({ title: "Lỗi Import", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const format = file.name.endsWith(".json") ? "json" : "csv";
    const text = await file.text();
    await processData(text, format);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Upload className="w-8 h-8 text-brand" />
        <h1 className="text-xl md:text-2xl font-extrabold text-[#1a1a2e]">📦 Nhập dữ liệu nâng cao</h1>
      </div>
      <p className="text-muted-foreground text-xs md:text-sm mb-6 md:mb-8">Hỗ trợ gán dữ liệu hàng loạt cho Nhóm, Bộ đề và Người dùng.</p>

      <Tabs defaultValue="groups" onValueChange={(v) => setActiveTab(v as ImportType)} className="w-full">
        <div className="overflow-x-auto pb-2 mb-6 scrollbar-hide">
          <TabsList className="flex w-max min-w-full bg-[#f0e0e7] p-1 h-auto rounded-xl">
            <TabsTrigger value="groups" className="flex-1 rounded-lg py-2 md:py-3 px-4 md:px-6 font-bold text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-brand whitespace-nowrap">1. Nhóm (Groups)</TabsTrigger>
            <TabsTrigger value="decks" className="flex-1 rounded-lg py-2 md:py-3 px-4 md:px-6 font-bold text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-brand whitespace-nowrap">2. Bộ đề (Decks)</TabsTrigger>
            <TabsTrigger value="users" className="flex-1 rounded-lg py-2 md:py-3 px-4 md:px-6 font-bold text-xs md:text-sm data-[state=active]:bg-white data-[state=active]:text-brand whitespace-nowrap">3. Người dùng (Users)</TabsTrigger>
          </TabsList>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Instructions Card */}
          <div className="md:col-span-2 bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 md:p-6 shadow-sm">
             <h3 className="font-bold text-base md:text-lg mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-brand" /> Hướng dẫn Import
             </h3>
             <div className="space-y-3 text-xs md:text-sm text-[#495057]">
                {activeTab === "groups" && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li><b>ID:</b> Phải là ID của nhóm đã tồn tại.</li>
                    <li><b>users & decks:</b> Email hoặc ID, ngăn cách bằng dấu phẩy.</li>
                    <li><b>assign_all:</b> TRUE để tự động gán.</li>
                  </ul>
                )}
                {activeTab === "decks" && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li><b>ID:</b> ID của Bộ đề đã tồn tại.</li>
                    <li><b>user:</b> Danh sách Email hoặc ID người dùng.</li>
                  </ul>
                )}
                {activeTab === "users" && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li><b>email:</b> Bắt buộc.</li>
                    <li><b>password:</b> Trống = <code>goidangkyflashcard</code></li>
                  </ul>
                )}
             </div>

             <div className="flex flex-wrap gap-2 mt-6">
                <Button variant="outline" size="sm" className="gap-2 border-brand text-brand hover:bg-brand-light text-xs" onClick={() => downloadTemplate("csv")}>
                  <FileSpreadsheet className="w-4 h-4" /> Mẫu CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-2 border-brand text-brand hover:bg-brand-light text-xs" onClick={() => downloadTemplate("json")}>
                  <FileJson className="w-4 h-4" /> Mẫu JSON
                </Button>
                <Button 
                  variant={manualMode ? "default" : "outline"} 
                  size="sm" 
                  className={`gap-2 text-xs ${manualMode ? "bg-brand" : "border-brand text-brand"}`} 
                  onClick={() => setManualMode(!manualMode)}
                >
                  {manualMode ? "Đóng nhập liệu" : "Dán dữ liệu trực tiếp"}
                </Button>
             </div>
          </div>

          {/* Upload Card / Manual Input */}
          <div className={`bg-white rounded-2xl border-2 p-6 shadow-md flex flex-col items-center transition-all ${manualMode ? "border-brand-light ring-2 ring-brand-light/20" : "border-brand"}`}>
            {!manualMode ? (
              <>
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-brand-light flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 md:w-8 md:h-8 text-brand" />
                </div>
                <h4 className="font-bold mb-2 text-sm md:text-base">Tải tệp lên</h4>
                <p className="text-[10px] md:text-xs text-muted-foreground mb-6">Chọn file CSV hoặc JSON.</p>
                
                <label className="w-full cursor-pointer">
                  <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFileUpload} disabled={importing} />
                  <div className={`py-2.5 px-4 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2
                    ${importing ? "bg-gray-100 text-gray-400" : "bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/20"}`}>
                    {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> ...</> : "Chọn tệp tin"}
                  </div>
                </label>
              </>
            ) : (
              <div className="w-full h-full flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-brand">CHỌN ĐỊNH DẠNG:</span>
                  <div className="flex bg-gray-100 rounded-lg p-0.5">
                    <button 
                      onClick={() => setManualType("json")}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${manualType === "json" ? "bg-white text-brand shadow-sm" : "text-gray-500"}`}
                    >JSON</button>
                    <button 
                      onClick={() => setManualType("csv")}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${manualType === "csv" ? "bg-white text-brand shadow-sm" : "text-gray-500"}`}
                    >CSV</button>
                  </div>
                </div>
                <textarea 
                  className="flex-1 w-full min-h-[120px] p-3 text-xs font-mono border-2 border-gray-100 rounded-xl focus:border-brand focus:ring-0 resize-none bg-gray-50"
                  placeholder={manualType === "json" ? '[{ "id": "...", ... }]' : "id,users,decks..."}
                  value={manualData}
                  onChange={(e) => setManualData(e.target.value)}
                />
                <Button 
                  className="w-full mt-4 bg-brand hover:bg-brand-dark text-white rounded-xl py-5"
                  disabled={!manualData.trim() || importing}
                  onClick={() => processData(manualData, manualType)}
                >
                  {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Thực hiện Import"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 md:p-6 shadow-sm overflow-hidden auto-scroll-mt">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
                <h3 className="font-bold text-base md:text-lg">📊 Kết quả xử lý ({results.length})</h3>
                <div className="flex gap-4 text-[10px] md:text-xs font-bold">
                   <span className="text-green-600">THÀNH CÔNG: {results.filter(r => r.status === "success").length}</span>
                   <span className="text-red-600">LỖI: {results.filter(r => r.status === "error").length}</span>
                </div>
             </div>

             <div className="overflow-x-auto rounded-xl border border-[#f0e0e7]">
                <table className="w-full text-sm">
                   <thead className="bg-gray-50 border-b border-[#f0e0e7]">
                      <tr>
                         <th className="text-left p-4 font-bold text-[#1a1a2e]">Định danh</th>
                         <th className="text-left p-4 font-bold text-[#1a1a2e]">Trạng thái</th>
                         <th className="text-left p-4 font-bold text-[#1a1a2e]">Chi tiết / Mật khẩu</th>
                      </tr>
                   </thead>
                   <tbody>
                      {results.map((r, i) => (
                        <tr key={i} className="border-b border-[#f0e0e7] last:border-0 hover:bg-gray-50 transition-colors">
                           <td className="p-4 font-medium">{r.id || r.email || "N/A"}</td>
                           <td className="p-4">
                              {r.status === "success" && (
                                <span className="flex items-center gap-1.5 text-green-700 font-bold text-[10px] bg-green-50 px-2 py-1 rounded-full uppercase">
                                  <CheckCircle className="w-3.5 h-3.5" /> Thành công
                                </span>
                              )}
                              {r.status === "partial" && (
                                <span className="flex items-center gap-1.5 text-yellow-700 font-bold text-[10px] bg-yellow-50 px-2 py-1 rounded-full uppercase">
                                  <AlertCircle className="w-3.5 h-3.5" /> Một phần
                                </span>
                              )}
                              {r.status === "error" && (
                                <span className="flex items-center gap-1.5 text-red-700 font-bold text-[10px] bg-red-50 px-2 py-1 rounded-full uppercase">
                                  <XCircle className="w-3.5 h-3.5" /> Thất bại
                                </span>
                              )}
                           </td>
                           <td className="p-4">
                              <div className="flex flex-col gap-1">
                                <span className={`text-xs ${r.status === "error" ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                                  {r.message || r.error || "—"}
                                </span>
                                {r.tempPassword && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <code className="bg-brand-light text-brand font-mono text-[10px] px-2 py-0.5 rounded-md font-bold">
                                      {r.tempPassword}
                                    </code>
                                    <button 
                                      onClick={() => {
                                        navigator.clipboard.writeText(r.tempPassword);
                                        toast({ title: "Đã copy mật khẩu" });
                                      }}
                                       className="text-brand hover:text-brand-dark"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </Tabs>
    </div>
  );
}
