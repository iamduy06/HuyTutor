"use client";

import { useState, useRef } from "react";
import { Upload, Download, FileJson, CheckCircle, XCircle, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  email: string;
  status: "created" | "skipped" | "error";
  tempPassword?: string;
  error?: string;
}
interface ImportResponse {
  summary: { total: number; created: number; skipped: number; errors: number };
  results: ImportResult[];
}

export default function ImportExportPage() {
  const { toast } = useToast();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [copiedIdx,    setCopiedIdx]    = useState<number | null>(null);

  async function handleExport(type: "users" | "decks" | "all") {
    const res  = await fetch(`/api/admin/import-export?type=${type}`);
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = type === "all" ? "flashcard-export.json" : `${type}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: `Đã xuất ${type}.json` });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    let parsed: unknown;
    try { parsed = JSON.parse(await file.text()); }
    catch { toast({ title: "File JSON không hợp lệ", variant: "destructive" }); return; }

    setImporting(true); setImportResult(null);
    try {
      const res  = await fetch("/api/admin/import-export", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json() as ImportResponse;
      setImportResult(data);
      toast({ title: `✅ Xong — ${data.summary.created} tạo mới, ${data.summary.skipped} bỏ qua` });
    } catch {
      toast({ title: "Import thất bại", variant: "destructive" });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function copyPw(pw: string, idx: number) {
    navigator.clipboard.writeText(pw);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-2">📦 Import / Export</h1>
      <p className="text-muted-foreground text-sm mb-8">Quản lý người dùng và Flashcard hàng loạt bằng file JSON.</p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* EXPORT */}
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-brand" />
            <h2 className="font-bold text-lg">Xuất dữ liệu</h2>
          </div>
          <div className="flex flex-col gap-3">
            <Button variant="brand-outline" className="w-full justify-start gap-2" onClick={() => handleExport("users")}>
              <FileJson className="w-4 h-4" /> Xuất người dùng (users.json)
            </Button>
            <Button variant="brand-outline" className="w-full justify-start gap-2" onClick={() => handleExport("decks")}>
              <FileJson className="w-4 h-4" /> Xuất Flashcard (decks.json)
            </Button>
            <Button variant="brand" className="w-full justify-start gap-2" onClick={() => handleExport("all")}>
              <Download className="w-4 h-4" /> Xuất tất cả
            </Button>
          </div>
        </div>

        {/* IMPORT */}
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6">
          <div className="flex items-center gap-2 mb-3">
            <Upload className="w-5 h-5 text-brand" />
            <h2 className="font-bold text-lg">Import người dùng</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Format JSON được hỗ trợ:</p>
          <pre className="text-xs bg-gray-50 border rounded-lg p-3 mb-4 overflow-x-auto">{`[
  {
    "username": "user@email.com",
    "password": "optional",
    "deck": ["id1", "id2"],
    "role": "USER",
    "expired_at": "2025-12-31"
  }
]`}</pre>
          <label className="cursor-pointer block">
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
            <div className={`flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed rounded-xl font-semibold text-sm transition-all
              ${importing ? "border-gray-200 text-gray-400" : "border-brand text-brand hover:bg-brand-light"}`}>
              {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang import…</>
                         : <><Upload className="w-4 h-4" /> Chọn file JSON</>}
            </div>
          </label>
        </div>
      </div>

      {/* Results */}
      {importResult && (
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6">
          <h2 className="font-bold text-lg mb-4">Kết quả import</h2>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: "Tổng", value: importResult.summary.total, cls: "bg-gray-50 text-gray-700" },
              { label: "Tạo mới", value: importResult.summary.created, cls: "bg-green-50 text-green-700" },
              { label: "Bỏ qua", value: importResult.summary.skipped, cls: "bg-yellow-50 text-yellow-700" },
              { label: "Lỗi", value: importResult.summary.errors, cls: "bg-red-50 text-red-700" },
            ].map(s => (
              <div key={s.label} className={`${s.cls} rounded-xl p-3 text-center`}>
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#f0e0e7] bg-[#f8f9fa]">
                  <th className="text-left p-2 font-bold">Email</th>
                  <th className="text-left p-2 font-bold">Trạng thái</th>
                  <th className="text-left p-2 font-bold">Mật khẩu tạm</th>
                </tr>
              </thead>
              <tbody>
                {importResult.results.map((r, i) => (
                  <tr key={i} className="border-b border-[#f0e0e7] hover:bg-[#f8f9fa]">
                    <td className="p-2 font-medium">{r.email}</td>
                    <td className="p-2">
                      {r.status === "created" && <span className="flex items-center gap-1 text-green-700"><CheckCircle className="w-3.5 h-3.5" /> Tạo mới</span>}
                      {r.status === "skipped" && <span className="text-yellow-600 text-xs">Đã tồn tại</span>}
                      {r.status === "error"   && <span className="flex items-center gap-1 text-red-600"><XCircle className="w-3.5 h-3.5" /> {r.error}</span>}
                    </td>
                    <td className="p-2">
                      {r.tempPassword && (
                        <div className="flex items-center gap-1">
                          <code className="font-mono text-brand text-xs bg-brand-light px-2 py-0.5 rounded">{r.tempPassword}</code>
                          <button onClick={() => copyPw(r.tempPassword!, i)} className="p-1 text-muted-foreground hover:text-brand">
                            {copiedIdx === i ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {importResult.results.some(r => r.tempPassword) && (
            <Button variant="brand-outline" size="sm" className="mt-4"
              onClick={() => {
                const lines = importResult.results.filter(r => r.tempPassword).map(r => `${r.email}: ${r.tempPassword}`).join("\n");
                navigator.clipboard.writeText(lines);
                toast({ title: "Đã copy tất cả mật khẩu" });
              }}>
              <Copy className="w-4 h-4" /> Copy tất cả mật khẩu
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
