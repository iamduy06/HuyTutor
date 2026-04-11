"use client";

import { useState, useRef } from "react";
import { Upload, CheckCircle, XCircle, Loader2, Copy, Check } from "lucide-react";
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

export default function ImportPage() {
  const { toast } = useToast();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);
  const [copiedIdx,    setCopiedIdx]    = useState<number | null>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    let parsed: unknown;
    try { parsed = JSON.parse(await file.text()); }
    catch { toast({ title: "File JSON không hợp lệ", variant: "destructive" }); return; }

    setImporting(true); setImportResult(null);
    try {
      const res  = await fetch("/api/admin/import", {
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
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-2">📥 Import Dữ liệu</h1>
      <p className="text-muted-foreground text-sm mb-8">Tạo người dùng hàng loạt và gán Flashcard bằng file JSON.</p>

      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Upload className="w-5 h-5 text-brand" />
          <h2 className="font-bold text-lg">Chọn bản ghi để Import</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Định dạng JSON mẫu:</p>
        <pre className="text-xs bg-gray-50 border rounded-lg p-3 mb-4 overflow-x-auto whitespace-pre">{`[
  {
    "email": "user@email.com",
    "password": "optional_password",
    "deck": ["deck_id_1", "deck_id_2"],
    "role": "USER",
    "expired_at": "2025-12-31"
  }
]`}</pre>
        <label className="cursor-pointer block">
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} disabled={importing} />
          <div className={`flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl font-semibold text-sm transition-all
            ${importing ? "border-gray-200 text-gray-400" : "border-brand text-brand hover:bg-brand-light"}`}>
            {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý dữ liệu…</>
                       : <><Upload className="w-4 h-4" /> Bấm để chọn file JSON từ máy tính</>}
          </div>
        </label>
      </div>

      {importResult && (
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-6 animate-in fade-in slide-in-from-bottom-2">
          <h2 className="font-bold text-lg mb-4 text-[#1a1a2e]">📊 Kết quả Import</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Tổng", value: importResult.summary.total, cls: "bg-gray-50 text-gray-700 border-gray-100" },
              { label: "Tạo mới", value: importResult.summary.created, cls: "bg-green-50 text-green-700 border-green-100" },
              { label: "Bỏ qua", value: importResult.summary.skipped, cls: "bg-yellow-50 text-yellow-700 border-yellow-100" },
              { label: "Lỗi", value: importResult.summary.errors, cls: "bg-red-50 text-red-700 border-red-100" },
            ].map(s => (
              <div key={s.label} className={`${s.cls} border-2 rounded-xl p-3 text-center`}>
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-xs font-semibold opacity-70 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto border-2 border-[#f0e0e7] rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#f0e0e7] bg-[#f8f9fa] text-[#495057]">
                  <th className="text-left p-3 font-bold">Email</th>
                  <th className="text-left p-3 font-bold">Trạng thái</th>
                  <th className="text-left p-3 font-bold">Mật khẩu tạm</th>
                </tr>
              </thead>
              <tbody>
                {importResult.results.map((r, i) => (
                  <tr key={i} className="border-b border-[#f0e0e7] last:border-0 hover:bg-[#f8f9fa] transition-colors">
                    <td className="p-3 font-medium text-[#1a1a2e]">{r.email}</td>
                    <td className="p-3">
                      {r.status === "created" && <span className="flex items-center gap-1.5 text-green-700 font-semibold text-xs"><CheckCircle className="w-4 h-4" /> TẠO MỚI</span>}
                      {r.status === "skipped" && <span className="text-yellow-600 font-semibold text-xs">ĐÃ TỒN TẠI</span>}
                      {r.status === "error"   && <span className="flex items-center gap-1.5 text-red-600 font-semibold text-xs"><XCircle className="w-4 h-4" /> {r.error}</span>}
                    </td>
                    <td className="p-3">
                      {r.tempPassword && (
                        <div className="flex items-center gap-1">
                          <code className="font-mono text-brand text-xs bg-brand-light px-2 py-1 rounded-lg font-bold">{r.tempPassword}</code>
                          <button onClick={() => copyPw(r.tempPassword!, i)} title="Copy mật khẩu" className="p-1.5 text-muted-foreground hover:text-brand transition-colors">
                            {copiedIdx === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
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
            <Button variant="brand-outline" size="sm" className="mt-4 gap-2"
              onClick={() => {
                const lines = importResult.results.filter(r => r.tempPassword).map(r => `${r.email}: ${r.tempPassword}`).join("\n");
                navigator.clipboard.writeText(lines);
                toast({ title: "Đã copy tất cả mật khẩu" });
              }}>
              <Copy className="w-4 h-4" /> Sao chép tất cả mật khẩu tạm
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
