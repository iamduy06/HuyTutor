"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Upload, Download, FileJson, FileSpreadsheet, 
  CheckCircle, XCircle, AlertCircle, Loader2, 
  Copy, Info, ChevronDown, ChevronUp, Search, List, 
  Menu, X
} from "lucide-react";
import { getSupabaseClient } from "@/components/common/UserContext";
import { cn } from "@/lib/utils";

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
  const [manualMode, setManualMode] = useState(false);
  const [manualType, setManualType] = useState<"json" | "csv">("json");
  const [manualData, setManualData] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [decksRef, setDecksRef] = useState<any[]>([]);
  const [groupsRef, setGroupsRef] = useState<any[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  useEffect(() => {
    async function loadData() {
      console.log("[IMPORT_PAGE] loadData started");
      const timeout = setTimeout(() => {
        if (loadingRef) {
          console.warn("[IMPORT_PAGE] loadData timed out (5s)");
          setLoadingRef(false);
          toast({ title: "Quá thời gian tải dữ liệu", description: "Vui lòng kiểm tra kết nối mạng hoặc server.", variant: "destructive" });
        }
      }, 5000);

      try {
        const supabase = getSupabaseClient();
        console.log("[IMPORT_PAGE] Fetching decks & groups...");
        const [dRes, gRes] = await Promise.all([
          supabase.from("decks").select("id, title").order("title"),
          supabase.from("groups").select("id, name").order("name")
        ]);
        
        console.log("[IMPORT_PAGE] Fetch results:", { decks: dRes.data?.length, groups: gRes.data?.length });
        
        if (dRes.error) console.error("[IMPORT_PAGE] Decks Error:", dRes.error);
        if (gRes.error) console.error("[IMPORT_PAGE] Groups Error:", gRes.error);

        setDecksRef(dRes.data ?? []);
        setGroupsRef(gRes.data ?? []);
      } catch (err) {
        console.error("[IMPORT_PAGE] Unexpected Error:", err);
        toast({ title: "Lỗi hệ thống", description: "Không thể tải danh sách tham chiếu.", variant: "destructive" });
      } finally {
        clearTimeout(timeout);
        setLoadingRef(false);
        console.log("[IMPORT_PAGE] loadData finished");
      }
    }
    loadData();
  }, []);

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

      <Tabs defaultValue="groups" onValueChange={(v) => { setActiveTab(v as ImportType); setIsNavOpen(false); }} className="w-full">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* ────── LEFT SIDEBAR (TABS) ────── */}
          <aside className="w-full md:w-64 shrink-0">
            {/* Mobile Toggle */}
            <button 
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="md:hidden w-full flex items-center justify-between p-4 bg-[#f0e0e7] rounded-xl font-bold text-brand mb-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Menu className="w-5 h-5" />
                <span>CHỌN LOẠI DỮ LIỆU</span>
              </div>
              <ChevronDown className={cn("w-5 h-5 transition-transform", isNavOpen && "rotate-180")} />
            </button>

            {/* Nav Menu */}
            <div className={cn(
               "md:block bg-white border-2 border-[#f0e0e7] rounded-2xl p-2 shadow-sm transition-all overflow-hidden",
               !isNavOpen && "hidden md:block"
            )}>
              <TabsList className="flex flex-col w-full bg-transparent h-auto p-0 gap-1">
                <TabNavItem value="groups" icon="📁" label="1. Nhóm (Groups)" active={activeTab === "groups"} />
                <TabNavItem value="decks" icon="🎴" label="2. Bộ đề (Decks)" active={activeTab === "decks"} />
                <TabNavItem value="users" icon="👥" label="3. Người dùng (Users)" active={activeTab === "users"} />
              </TabsList>
            </div>

            {/* DESKTOP REFERENCES (Moved to Sidebar bottom if expanded) */}
            <div className="hidden md:block mt-8 space-y-4">
               <ReferenceList title="Bộ Flashcard" data={decksRef} loading={loadingRef} icon={<Search className="w-4 h-4" />} />
               <ReferenceList title="Danh sách Nhóm" data={groupsRef} loading={loadingRef} icon={<List className="w-4 h-4" />} />
            </div>
          </aside>

          {/* ────── MAIN CONTENT ────── */}
          <div className="flex-1 min-w-0 w-full space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
                       <Info className="w-5 h-5 text-brand" /> Hướng dẫn Import
                    </h3>
                    <button 
                      onClick={() => setShowGuide(!showGuide)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-light/50 text-brand text-[10px] font-bold hover:bg-brand-light transition-colors"
                    >
                      {showGuide ? <><ChevronUp className="w-3.5 h-3.5" /> THU GỌN</> : <><ChevronDown className="w-3.5 h-3.5" /> XEM CHI TIẾT</>}
                    </button>
                  </div>

                  {showGuide && (
                    <div className="animate-in fade-in zoom-in-95 duration-300 space-y-6">
                      <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                        <h4 className="text-[11px] font-extrabold text-blue-800 uppercase mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Quy tắc định dạng chung
                        </h4>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-blue-700/80">
                          <li className="flex flex-col gap-1"><span className="font-bold">📅 Ngày tháng</span><span>Dùng Ngày/Tháng/Năm</span></li>
                          <li className="flex flex-col gap-1"><span className="font-bold">🔗 Dấu ngăn cách</span><span>Dùng Dấu phẩy (,)</span></li>
                          <li className="flex flex-col gap-1"><span className="font-bold">🔘 Boolean</span><span>TRUE / FALSE</span></li>
                          <li className="flex flex-col gap-1"><span className="font-bold">📄 Định dạng</span><span>.CSV / .JSON</span></li>
                        </ul>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-brand">📁 1. NHÓM</h4>
                          <div className="space-y-2">
                            <InstructionItem label="id" badge="BẮT BUỘC" desc="ID của Nhóm." example="93b1..." />
                            <InstructionItem label="users" badge="TÙY CHỌN" desc="Emails/IDs." />
                            <InstructionItem label="assign_all" badge="TIPS" desc="Tự động gán." color="amber" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-brand">🎴 2. BỘ ĐỀ</h4>
                          <div className="space-y-2">
                            <InstructionItem label="id" badge="BẮT BUỘC" desc="ID Bộ đề." />
                            <InstructionItem label="user" badge="BẮT BUỘC" desc="Email/ID gán." />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm text-brand">👥 3. USERS</h4>
                          <div className="space-y-2">
                            <InstructionItem label="email" badge="BẮT BUỘC" desc="Email duy nhất." />
                            <InstructionItem label="password" badge="TÙY CHỌN" desc="Để trống = default." />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-6">
                    <Button variant="outline" size="sm" className="gap-2 border-brand text-brand hover:bg-brand-light font-bold" onClick={() => downloadTemplate("csv")}><FileSpreadsheet className="w-4 h-4" /> Mẫu CSV</Button>
                    <Button variant="outline" size="sm" className="gap-2 border-brand text-brand hover:bg-brand-light font-bold" onClick={() => downloadTemplate("json")}><FileJson className="w-4 h-4" /> Mẫu JSON</Button>
                    <Button variant={manualMode ? "default" : "outline"} size="sm" className={`gap-2 ${manualMode ? "bg-brand" : "border-brand text-brand"} font-bold`} onClick={() => setManualMode(!manualMode)}>{manualMode ? "Đóng nhập liệu" : "Dán dữ liệu trực tiếp"}</Button>
                  </div>
              </div>

              <div className={`bg-white rounded-2xl border-2 p-6 shadow-md flex flex-col items-center transition-all ${manualMode ? "border-brand-light ring-2 ring-brand-light/20" : "border-brand"}`}>
                {!manualMode ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-brand-light flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-brand" />
                    </div>
                    <h4 className="font-bold mb-2">Tải tệp lên</h4>
                    <p className="text-xs text-muted-foreground mb-6 text-center">Chọn file CSV hoặc JSON để xử lý ngay.</p>
                    <label className="w-full cursor-pointer">
                      <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFileUpload} disabled={importing} />
                      <div className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${importing ? "bg-gray-100 text-gray-400" : "bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/20"}`}>
                        {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Xử lý...</> : "Chọn tệp tin"}
                      </div>
                    </label>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold text-brand uppercase tracking-widest">ĐỊNH DẠNG DỮ LIỆU</span>
                      <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button onClick={() => setManualType("json")} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${manualType === "json" ? "bg-white text-brand shadow-sm" : "text-gray-500"}`}>JSON</button>
                        <button onClick={() => setManualType("csv")} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${manualType === "csv" ? "bg-white text-brand shadow-sm" : "text-gray-500"}`}>CSV</button>
                      </div>
                    </div>
                    <textarea 
                      className="flex-1 w-full min-h-[160px] p-4 text-xs font-mono border-2 border-gray-100 rounded-xl focus:border-brand focus:ring-0 resize-none bg-gray-50"
                      placeholder={manualType === "json" ? '[{ "id": "...", ... }]' : "id,users,decks..."}
                      value={manualData}
                      onChange={(e) => setManualData(e.target.value)}
                    />
                    <Button className="w-full mt-4 bg-brand hover:bg-brand-dark text-white rounded-xl py-6 font-bold" disabled={!manualData.trim() || importing} onClick={() => processData(manualData, manualType)}>
                      {importing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <><Upload className="w-4 h-4 mr-2" /> THỰC HIỆN IMPORT</>}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {results && (
              <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-4 md:p-6 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                 <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
                    <h3 className="font-bold text-lg">📊 Kết quả xử lý ({results.length})</h3>
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
                             <th className="text-left p-4 font-semibold text-[#1a1a2e]">Trạng thái</th>
                             <th className="text-left p-4 font-semibold text-[#1a1a2e]">Chi tiết</th>
                          </tr>
                       </thead>
                       <tbody>
                          {results.map((r, i) => (
                            <tr key={i} className="border-b border-[#f0e0e7] last:border-0 hover:bg-gray-50 transition-colors">
                               <td className="p-4 font-medium">{r.id || r.email || "N/A"}</td>
                               <td className="p-4">
                                  {r.status === "success" ? <span className="text-green-700 font-bold text-[10px] bg-green-50 px-2 py-1 rounded-full border border-green-100 uppercase">Thành công</span> : <span className="text-red-700 font-bold text-[10px] bg-red-50 px-2 py-1 rounded-full border border-red-100 uppercase">Thất bại</span>}
                               </td>
                               <td className="p-4"><span className="text-xs text-muted-foreground">{r.message || r.error || "—"}</span></td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            )}

            {/* MOBILE REFERENCES (At the bottom on mobile) */}
            <div className="md:hidden space-y-4">
               <ReferenceList title="Bộ Flashcard" data={decksRef} loading={loadingRef} icon={<Search className="w-4 h-4" />} />
               <ReferenceList title="Danh sách Nhóm" data={groupsRef} loading={loadingRef} icon={<List className="w-4 h-4" />} />
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );

}

function TabNavItem({ value, icon, label, active }: any) {
  return (
    <TabsTrigger value={value} className={cn(
      "w-full justify-start gap-3 px-4 py-3 rounded-xl transition-all border-2",
      active ? "bg-brand text-white border-brand shadow-md" : "bg-white border-transparent text-[#495057] hover:bg-brand-light hover:text-brand"
    )}>
      <span className="text-base">{icon}</span>
      <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
    </TabsTrigger>
  );
}

function ReferenceList({ title, data, loading, icon }: any) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = data.filter((item: any) => 
    (item.title || item.name || "").toLowerCase().includes(search.toLowerCase()) ||
    item.id.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((item: any) => item.id));
    }
  };

  const copyBatch = () => {
    if (selectedIds.length === 0) return;
    const text = selectedIds.join(", ");
    navigator.clipboard.writeText(text);
    alert(`Đã copy ${selectedIds.length} ID: ${text.substring(0, 30)}${text.length > 30 ? "..." : ""}`);
    setSelectedIds([]);
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] shadow-sm overflow-hidden flex flex-col">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 font-bold text-xs text-brand uppercase tracking-wider">
          {icon} {title}
          {data.length > 0 && <span className="bg-brand-light text-brand px-1.5 py-0.5 rounded text-[9px]">{data.length}</span>}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-brand transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="p-3 border-t-2 border-[#f0e0e7] space-y-3 animate-in fade-in zoom-in-95 duration-200">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
             <input 
               className="w-full pl-8 pr-3 py-1.5 text-[10px] border rounded-lg focus:ring-1 focus:ring-brand outline-none"
               placeholder="Tìm theo tên hoặc ID..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between p-2 bg-brand-light/40 rounded-lg animate-in slide-in-from-top-2">
              <span className="text-[10px] font-bold text-brand italic">Đã chọn {selectedIds.length} mục</span>
              <button 
                onClick={copyBatch}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-brand text-white text-[10px] font-bold hover:bg-brand-dark transition-all shadow-sm"
              >
                <Copy className="w-3 h-3" /> COPY (ID1, ID2...)
              </button>
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="text-center py-6 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-brand" />
                <span className="text-[10px] text-muted-foreground animate-pulse">Đang tải dữ liệu...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-muted-foreground">Không tìm thấy kết quả nào</div>
            ) : (
               <table className="w-full text-[10px]">
                 <thead className="sticky top-0 bg-white border-b border-gray-100 z-10">
                    <tr className="text-left text-muted-foreground uppercase font-bold text-[8px]">
                       <th className="py-2 px-1 w-8">
                         <input 
                           type="checkbox" 
                           className="rounded border-gray-300 text-brand focus:ring-brand" 
                           checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                           onChange={toggleSelectAll}
                         />
                       </th>
                       <th className="py-2">Tên</th>
                       <th className="py-2">ID</th>
                       <th className="py-2 w-8"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {filtered.map((item: any) => (
                      <tr key={item.id} className={cn(
                        "hover:bg-gray-50 transition-colors group",
                        selectedIds.includes(item.id) && "bg-brand-light/20"
                      )}>
                        <td className="py-2 px-1">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-300 text-brand focus:ring-brand"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>
                        <td className="py-2 pr-2 font-medium truncate max-w-[110px]" title={item.title || item.name}>
                          {item.title || item.name}
                        </td>
                        <td className="py-2 font-mono text-muted-foreground text-[9px] truncate max-w-[60px]" title={item.id}>
                          {item.id}
                        </td>
                        <td className="py-2 text-right">
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(item.id);
                               toast({ title: "Đã copy ID đơn lẻ", description: item.id });
                             }}
                             className="text-brand opacity-0 group-hover:opacity-100 hover:scale-110 transition-all p-1"
                           >
                             <Copy className="w-3.5 h-3.5" />
                           </button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InstructionItem({ label, badge, desc, example, color = "blue" }: any) {
  const badgeColors: any = {
    brand: "bg-brand text-white",
    blue: "bg-blue-500 text-white",
    amber: "bg-amber-500 text-white",
  };
  const bgColors: any = {
    brand: "bg-gray-50 border-gray-100",
    blue: "bg-white border-gray-100",
    amber: "bg-amber-50/50 border-amber-100/50",
  };
  const actualColor = badge === "BẮT BUỘC" ? "brand" : color;
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${bgColors[actualColor]}`}>
      <span className={`${badgeColors[actualColor]} text-[9px] font-bold px-2 py-0.5 rounded-md mt-0.5 shrink-0 uppercase tracking-tighter`}>{badge}</span>
      <div>
        <b className="text-[#1a1a2e] text-xs underline decoration-brand/20 underline-offset-4">{label}:</b> <span className="text-xs">{desc}</span>
        {example && <div className="text-[9px] text-muted-foreground mt-1 flex items-center gap-1 opacity-70 italic">VD: <code>{example}</code></div>}
      </div>
    </div>
  );
}
