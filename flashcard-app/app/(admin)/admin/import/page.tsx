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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setResults(null);

    try {
      let data: any[] = [];
      const text = await file.text();

      if (file.name.endsWith(".json")) {
        data = JSON.parse(text);
      } else if (file.name.endsWith(".csv")) {
        data = csvToObjects(text);
      } else {
        throw new Error("Định dạng file không hỗ trợ (.csv hoặc .json)");
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
      toast({ title: `✅ Đã xử lý xong. ${successCount}/${resultData.length} thành công.` });
    } catch (err: any) {
      toast({ title: "Lỗi Import", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Upload className="w-8 h-8 text-brand" />
        <h1 className="text-2xl font-extrabold text-[#1a1a2e]">📦 Nhập dữ liệu nâng cao</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-8">Hỗ trợ gán dữ liệu hàng loạt cho Nhóm, Bộ đề và Người dùng.</p>

      <Tabs defaultValue="groups" onValueChange={(v) => setActiveTab(v as ImportType)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#f0e0e7] p-1 h-auto rounded-xl mb-8">
          <TabsTrigger value="groups" className="rounded-lg py-3 font-bold data-[state=active]:bg-white data-[state=active]:text-brand">1. Nhóm (Groups)</TabsTrigger>
          <TabsTrigger value="decks" className="rounded-lg py-3 font-bold data-[state=active]:bg-white data-[state=active]:text-brand">2. Bộ đề (Decks)</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg py-3 font-bold data-[state=active]:bg-white data-[state=active]:text-brand">3. Người dùng (Users)</TabsTrigger>
        </TabsList>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Instructions Card */}
          <div className="md:col-span-2 bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 shadow-sm">
             <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-brand" /> Hướng dẫn Import {activeTab === "groups" ? "Nhóm" : activeTab === "decks" ? "Bộ đề" : "Người dùng"}
             </h3>
             <div className="space-y-3 text-sm text-[#495057]">
                {activeTab === "groups" && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li><b>ID:</b> Phải là ID của nhóm đã tồn tại trong hệ thống.</li>
                    <li><b>users & decks:</b> Hỗ trợ Email hoặc ID, ngăn cách bằng dấu phẩy.</li>
                    <li><b>expire_at:</b> Định dạng dd/mm/yyyy hoặc dd-mm-yyyy.</li>
                    <li><b>assign_all:</b> TRUE để tự động gán bộ đề cho từng user trong nhóm.</li>
                  </ul>
                )}
                {activeTab === "decks" && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li><b>ID:</b> ID của Flashcard (Bộ đề) đã tồn tại.</li>
                    <li><b>user:</b> Danh sách Email hoặc ID người dùng cần gán.</li>
                    <li><b>expire_at:</b> Hạn sử dụng bộ đề (mặc định vĩnh viễn nếu bỏ trống).</li>
                  </ul>
                )}
                {activeTab === "users" && (
                  <ul className="list-disc pl-5 space-y-1">
                    <li><b>email:</b> Bắt buộc. Nếu user đã tồn tại sẽ cập nhật quyền.</li>
                    <li><b>password:</b> Để trống để tự động gán mật khẩu mặc định: <code>goidangkyflashcard</code></li>
                    <li><b>group_id:</b> Mặc định hệ thống gán vào nhóm Guest nếu bỏ trống.</li>
                    <li><b>deck:</b> Danh sách ID bộ đề gán trực tiếp cho người dùng.</li>
                  </ul>
                )}
             </div>

             <div className="flex gap-3 mt-8">
                <Button variant="outline" size="sm" className="gap-2 border-brand text-brand hover:bg-brand-light" onClick={() => downloadTemplate("csv")}>
                  <FileSpreadsheet className="w-4 h-4" /> Tải mẫu CSV
                </Button>
                <Button variant="outline" size="sm" className="gap-2 border-brand text-brand hover:bg-brand-light" onClick={() => downloadTemplate("json")}>
                  <FileJson className="w-4 h-4" /> Tải mẫu JSON
                </Button>
             </div>
          </div>

          {/* Upload Card */}
          <div className="bg-white rounded-2xl border-2 border-brand p-6 shadow-md flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center mb-4">
               <Upload className="w-8 h-8 text-brand" />
            </div>
            <h4 className="font-bold mb-2">Tải tệp lên</h4>
            <p className="text-xs text-muted-foreground mb-6">Chọn file CSV hoặc JSON đã chuẩn bị theo mẫu.</p>
            
            <label className="w-full cursor-pointer">
              <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFileUpload} disabled={importing} />
              <div className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2
                ${importing ? "bg-gray-100 text-gray-400" : "bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/20"}`}>
                {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tải...</> : "Chọn tệp tin"}
              </div>
            </label>
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">📊 Kết quả xử lý ({results.length} bản ghi)</h3>
                <div className="flex gap-4 text-xs font-bold">
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
