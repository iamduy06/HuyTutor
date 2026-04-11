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
  const [showGeneralGuide, setShowGeneralGuide] = useState(true);
  const [showSpecificGuide, setShowSpecificGuide] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [decksRef, setDecksRef] = useState<any[]>([]);
  const [groupsRef, setGroupsRef] = useState<any[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);

  useEffect(() => {
    async function loadData() {
      console.log("[IMPORT_PAGE] loadData started via API");
      const timeout = setTimeout(() => {
        if (loadingRef) {
          console.warn("[IMPORT_PAGE] API load timed out (10s)");
          setLoadingRef(false);
          toast({ title: "Lỗi kết nối", description: "Không thể lấy dữ liệu từ server. Vui lòng thử lại.", variant: "destructive" });
        }
      }, 10000);

      try {
        const res = await fetch("/api/admin/references");
        if (!res.ok) throw new Error("API call failed");
        
        const data = await res.json();
        console.log("[IMPORT_PAGE] API results:", { decks: data.decks?.length, groups: data.groups?.length });
        
        if (data.error) console.error("[IMPORT_PAGE] API Data error:", data.error);

        setDecksRef(data.decks ?? []);
        setGroupsRef(data.groups ?? []);
      } catch (err) {
        console.error("[IMPORT_PAGE] API Fetch Error:", err);
        toast({ title: "Lỗi đồng bộ", description: "Không thể tải danh sách gợi ý từ server.", variant: "destructive" });
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
        <h1 className="text-xl md:text-2xl font-extrabold text-[#1a1a2e]">Nhập dữ liệu nâng cao</h1>
      </div>
      <p className="text-muted-foreground text-xs md:text-sm mb-6 md:mb-8">Hỗ trợ gán dữ liệu hàng loạt cho Nhóm, Bộ đề và Người dùng.</p>

      <Tabs defaultValue="groups" onValueChange={(v) => { setActiveTab(v as ImportType); setIsNavOpen(false); }} className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] lg:grid-cols-[200px_1fr_1fr] gap-8 items-start">
          
          {/* ────── COLUMN 1: SIDEBAR (TABS ONLY) ────── */}
          <aside className="w-full md:w-[200px] shrink-0 sticky top-24">
            <div className="mb-4">
               <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4 mb-2">Loại dữ liệu</h3>
               {/* Mobile Toggle */}
               <button 
                 onClick={() => setIsNavOpen(!isNavOpen)}
                 className="md:hidden w-full flex items-center justify-between p-3 bg-brand-light/50 rounded-xl font-bold text-brand shadow-sm border border-brand/10"
               >
                 <div className="flex items-center gap-2 text-xs">
                   <Menu className="w-4 h-4" />
                   <span>{activeTab.toUpperCase()}</span>
                 </div>
                 <ChevronDown className={cn("w-4 h-4 transition-transform", isNavOpen && "rotate-180")} />
               </button>

               {/* Nav Menu */}
               <div className={cn(
                  "md:block bg-white border-2 border-[#f0e0e7] rounded-2xl p-1.5 shadow-sm transition-all overflow-hidden",
                  !isNavOpen && "hidden md:block"
               )}>
                 <TabsList className="flex flex-col w-full bg-transparent h-auto p-0 gap-1">
                   <TabNavItem value="groups" icon="📁" label="Nhóm (Groups)" active={activeTab === "groups"} />
                   <TabNavItem value="decks" icon="🎴" label="Bộ đề (Decks)" active={activeTab === "decks"} />
                   <TabNavItem value="users" icon="👥" label="Người dùng (Users)" active={activeTab === "users"} />
                 </TabsList>
               </div>
            </div>

            {/* 2. TEMPLATE DOWNLOADS */}
            <div className="mt-8 space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-4">Tải bản mẫu</h4>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start h-10 gap-2.5 border-[#f0e0e7] text-brand hover:bg-brand-light font-bold text-[10px] rounded-xl px-4" 
                  onClick={() => downloadTemplate("csv")}
                >
                  <FileSpreadsheet className="w-4 h-4" /> MẪU FILE CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start h-10 gap-2.5 border-[#f0e0e7] text-brand hover:bg-brand-light font-bold text-[10px] rounded-xl px-4" 
                  onClick={() => downloadTemplate("json")}
                >
                  <FileJson className="w-4 h-4" /> MẪU FILE JSON
                </Button>
              </div>
            </div>
          </aside>

          {/* ────── COLUMN 2: DOCUMENTATION & REFERENCES ────── */}
          <div className="flex flex-col space-y-6 min-w-0">
            {/* 1. DOCUMENTATION HEADER (Title replaced by action context if needed) */}

            {/* 2. GENERAL GUIDE (OPEN) */}
            <div className="bg-white rounded-2xl border border-[#f0e0e7] shadow-sm overflow-hidden">
               <div className="bg-gray-50/50 p-3 border-b border-[#f0e0e7] flex items-center justify-between">
                  <h3 className="font-bold text-[11px] flex items-center gap-2 text-[#1a1a2e] uppercase tracking-wider">
                     <Info className="w-3.5 h-3.5 text-brand" /> Hướng dẫn chung
                  </h3>
               </div>
               <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-[10px] text-muted-foreground">
                    <div className="flex flex-col gap-1 p-2 rounded-lg bg-blue-50/30 border border-blue-100/20">
                       <span className="font-bold text-blue-800">📅 Ngày</span>
                       <span>Dạng <b>DD/MM/YYYY</b></span>
                    </div>
                    <div className="flex flex-col gap-1 p-2 rounded-lg bg-orange-50/30 border border-orange-100/20">
                       <span className="font-bold text-orange-800">🔗 Phân cách</span>
                       <span>Dùng <b>dấu phẩy (,)</b></span>
                    </div>
                    <div className="flex flex-col gap-1 p-2 rounded-lg bg-purple-50/30 border border-purple-100/20">
                       <span className="font-bold text-purple-800">🔘 Boolean</span>
                       <span><b>TRUE</b> / <b>FALSE</b></span>
                    </div>
                    <div className="flex flex-col gap-1 p-2 rounded-lg bg-emerald-50/30 border border-emerald-100/20">
                       <span className="font-bold text-emerald-800">📄 File</span>
                       <span><b>.csv</b> hoặc <b>.json</b></span>
                    </div>
                  </div>
               </div>
            </div>

            {/* 3. SPECIFIC CONTEXTUAL GUIDE (COLLAPSED) */}
            <div className="bg-white rounded-2xl border border-[#f0e0e7] shadow-sm overflow-hidden">
               <button 
                 onClick={() => setShowSpecificGuide(!showSpecificGuide)}
                 className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
               >
                 <h3 className="font-bold text-[11px] flex items-center gap-2 text-[#1a1a2e] uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5 text-brand" /> Quy tắc trường
                 </h3>
                 <ChevronDown className={cn("w-4 h-4 text-brand transition-transform", showSpecificGuide && "rotate-180")} />
               </button>
               {showSpecificGuide && (
                 <div className="p-4 border-t border-[#f0e0e7] animate-in fade-in slide-in-from-top-2">
                    {activeTab === "groups" && (
                      <div className="space-y-4">
                        <h5 className="font-black text-[10px] text-brand border-b pb-1 border-brand/10 uppercase tracking-widest flex items-center gap-2">
                           <List className="w-3 h-3" /> NHÓM (GROUPS) - Định dạng & Ví dụ
                        </h5>
                        <div className="grid gap-2">
                          <InstructionItem 
                            label="id" badge="BẮT BUỘC" 
                            desc="ID định danh của Nhóm." 
                            format="Dạng chuỗi UUID"
                            example="93b18f1-f6de-4567-b83a-6cffcc287438" 
                          />
                          <InstructionItem 
                            label="users" badge="TÙY CHỌN" 
                            desc="Danh sách người dùng muốn thêm vào nhóm." 
                            format="Email/ID ngăn cách bởi dấu phẩy HOẶC mảng JSON"
                            example='user@test.com, id_002  HOẶC  ["user1@a.com", "user2@a.com"]' 
                          />
                          <InstructionItem 
                            label="decks" badge="TÙY CHỌN" 
                            desc="Danh sách bộ đề cung cấp cho nhóm." 
                            format="Danh sách ID ngăn cách bởi dấu phẩy"
                            example="deck_01, deck_uuid_2" 
                          />
                          <InstructionItem 
                            label="expire_at" badge="TÙY CHỌN" 
                            desc="Hạn sử dụng của các bộ đề trong nhóm." 
                            format="DD/MM/YYYY hoặc DD-MM-YYYY"
                            example="31/12/2025 hoặc 31-12-2025" 
                          />
                          <InstructionItem 
                            label="assign_all" badge="TIPS" 
                            desc="Cấp quyền truy cập Decks cho toàn bộ Users." 
                            format="Chuỗi: TRUE / FALSE"
                            example="TRUE (Để lấy dữ liệu tự động cho tất cả thành viên)" 
                            color="amber" 
                          />
                        </div>
                      </div>
                    )}
                    {activeTab === "decks" && (
                      <div className="space-y-4">
                        <h5 className="font-black text-[10px] text-brand border-b pb-1 border-brand/10 uppercase tracking-widest flex items-center gap-2">
                           <Search className="w-3 h-3" /> BỘ ĐỀ (DECKS) - Định dạng & Ví dụ
                        </h5>
                        <div className="grid gap-2">
                          <InstructionItem 
                            label="id" badge="BẮT BUỘC" 
                            desc="ID của Bộ đề cần gán quyền." 
                            format="Dạng chuỗi ID hoặc UUID"
                            example="flashcard_n3_pro" 
                          />
                          <InstructionItem 
                            label="user" badge="BẮT BUỘC" 
                            desc="Người dùng nhận bộ đề này." 
                            format="Email/ID đơn lẻ HOẶC danh sách ngăn cách bởi dấu phẩy"
                            example='user1@gmail.com, user2@gmail.com' 
                          />
                          <InstructionItem 
                            label="expire_at" badge="TÙY CHỌN" 
                            desc="Ngày hết hạn truy cập bộ đề." 
                            format="DD/MM/YYYY"
                            example="01/01/2026" 
                          />
                        </div>
                      </div>
                    )}
                    {activeTab === "users" && (
                      <div className="space-y-4">
                        <h5 className="font-black text-[10px] text-brand border-b pb-1 border-brand/10 uppercase tracking-widest flex items-center gap-2">
                           <Menu className="w-3 h-3" /> NGƯỜI DÙNG (USERS) - Định dạng & Ví dụ
                        </h5>
                        <div className="grid gap-3">
                          <InstructionItem 
                            label="email" badge="BẮT BUỘC" 
                            desc="Email tài khoản (Sử dụng để đăng nhập)." 
                            format="Email hợp lệ (chuỗi có chứa @)"
                            example="sinhvien01@gmail.com" 
                          />
                          <InstructionItem 
                            label="password" badge="TÙY CHỌN" 
                            desc="Mật khẩu khởi tạo." 
                            format="Độ dài tối thiểu 6 ký tự"
                            example="Pass123456" 
                          />
                          <InstructionItem 
                            label="group_id" badge="TÙY CHỌN" 
                            desc="Gán User vào nhóm cụ thể." 
                            format="ID của nhóm sẵn có"
                            example="159b18f1-f6de-4567-b83a-6cffcc287438" 
                          />
                          <InstructionItem 
                            label="role" badge="TÙY CHỌN" 
                            desc="Quyền hạn trên hệ thống." 
                            format="USER (Mặc định), ADMIN, hoặc SUBADMIN"
                            example="USER" 
                          />
                          <InstructionItem 
                            label="deck" badge="TÙY CHỌN" 
                            desc="Bộ đề riêng được gán thẳng cho User." 
                            format="Danh sách ID ngăn cách bởi dấu phẩy"
                            example="deck_pro_01, deck_premium_02" 
                          />
                          <InstructionItem 
                            label="expire_at" badge="TÙY CHỌN" 
                            desc="Ngày hết hạn bộ đề riêng." 
                            format="DD/MM/YYYY"
                            example="20/10/2025" 
                          />
                        </div>
                      </div>
                    )}
                 </div>
               )}
            </div>

            {/* 4. REFERENCE LISTS */}
            <div className="space-y-4">
               <ReferenceList title="Bộ Flashcard" data={decksRef} loading={loadingRef} icon={<Search className="w-4 h-4" />} />
               <ReferenceList title="Danh sách Nhóm" data={groupsRef} loading={loadingRef} icon={<List className="w-4 h-4" />} />
            </div>
          </div>

          {/* ────── COLUMN 3: ACTION AREA ────── */}
          <div className="flex flex-col space-y-6">
            <div className="bg-white/50 p-2 rounded-2xl border border-dashed border-brand/30 flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand px-3">CHẾ ĐỘ NHẬP LIỆU</span>
              <Button 
                variant={manualMode ? "default" : "outline"} 
                size="sm" 
                className={cn("h-8 gap-2 font-bold text-[10px] rounded-xl px-4", manualMode ? "bg-brand" : "border-brand/40 text-brand")} 
                onClick={() => setManualMode(!manualMode)}
              >
                {manualMode ? "DÁN TRỰC TIẾP" : "TẢI TỆP LÊN"}
              </Button>
            </div>

            <div className={cn(
              "bg-white rounded-[32px] border-2 p-8 shadow-sm flex flex-col items-center transition-all min-h-[400px] sticky top-24",
              manualMode ? "border-brand-light ring-8 ring-brand-light/5" : "border-brand/30"
            )}>
              {!manualMode ? (
                <div className="w-full flex flex-col items-center text-center justify-center h-full">
                  <div className="w-20 h-20 rounded-[28px] bg-brand-light flex items-center justify-center mb-6 rotate-6 shadow-sm border border-brand/10">
                    <Upload className="w-10 h-10 text-brand" />
                  </div>
                  <h4 className="font-bold text-xl text-[#1a1a2e] mb-2 font-black">Nhập tệp dữ liệu</h4>
                  <p className="text-xs text-muted-foreground mb-10 max-w-[200px]">Chọn file <b>.CSV</b> hoặc <b>.JSON</b> cho <b>{activeTab.toUpperCase()}</b></p>
                  <label className="w-full cursor-pointer group">
                    <input ref={fileRef} type="file" accept=".json,.csv" className="hidden" onChange={handleFileUpload} disabled={importing} />
                    <div className={cn(
                      "py-5 px-6 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-3 tracking-widest uppercase",
                      importing ? "bg-gray-100 text-gray-400" : "bg-brand text-white group-hover:bg-brand-dark shadow-xl shadow-brand/20 group-active:scale-95"
                    )}>
                      {importing ? <><Loader2 className="w-5 h-5 animate-spin" /> Xử lý...</> : <><Upload className="w-5 h-5" /> CHỌN TỆP TIN</>}
                    </div>
                  </label>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col gap-6 animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                    <button onClick={() => setManualType("json")} className={cn("flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all", manualType === "json" ? "bg-white text-brand shadow-md" : "text-gray-400")}>JSON</button>
                    <button onClick={() => setManualType("csv")} className={cn("flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all", manualType === "csv" ? "bg-white text-brand shadow-md" : "text-gray-400")}>CSV</button>
                  </div>
                  <textarea 
                    className="flex-1 w-full min-h-[250px] p-6 text-xs font-mono border-2 border-gray-100 rounded-2xl focus:border-brand focus:ring-0 resize-none bg-gray-50/50"
                    placeholder={manualType === "json" ? '[{ "id": "...", ... }]' : "id,users,decks..."}
                    value={manualData}
                    onChange={(e) => setManualData(e.target.value)}
                  />
                  <Button className="w-full bg-brand hover:bg-brand-dark text-white rounded-2xl h-16 font-black shadow-xl shadow-brand/20 tracking-widest text-xs" disabled={!manualData.trim() || importing} onClick={() => processData(manualData, manualType)}>
                    {importing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "THỰC HIỆN IMPORT"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ────── BOTTOM: RESULTS (FULL WIDTH) ────── */}
        {results && (
          <div className="mt-12 bg-white rounded-[32px] border-2 border-[#f0e0e7] p-8 shadow-xl animate-in fade-in slide-in-from-bottom-12 overflow-hidden">
             <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 border-b pb-6">
                <div>
                  <h3 className="font-black text-2xl tracking-tighter text-[#1a1a2e]">KẾT QUẢ XỬ LÝ DỮ LIỆU</h3>
                  <p className="text-xs text-muted-foreground mt-1">Chi tiết kết quả thực hiện cho Tab <b>{activeTab.toUpperCase()}</b></p>
                </div>
                <div className="flex gap-3">
                   <div className="flex flex-col items-center px-6 py-2 rounded-2xl bg-green-50 text-green-700 ring-1 ring-green-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Thành công</span>
                      <span className="text-xl font-black">{results.filter(r => r.status === "success").length}</span>
                   </div>
                   <div className="flex flex-col items-center px-6 py-2 rounded-2xl bg-red-50 text-red-700 ring-1 ring-red-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest">Thất bại</span>
                      <span className="text-xl font-black">{results.filter(r => r.status === "error").length}</span>
                   </div>
                </div>
             </div>
             <div className="overflow-x-auto rounded-3xl border border-[#f0e0e7] shadow-inner bg-gray-50/20">
                <table className="w-full text-sm">
                   <thead className="bg-[#1a1a2e] text-white">
                      <tr className="text-left font-black uppercase text-[10px] tracking-widest">
                         <th className="p-6">Định danh xử lý</th>
                         <th className="p-6">Trạng thái</th>
                         <th className="p-6">Thông báo chi tiết</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100 bg-white">
                      {results.map((r, i) => (
                        <tr key={i} className="hover:bg-brand-light/5 transition-colors group">
                           <td className="p-6 font-black text-[#1a1a2e] text-sm group-hover:text-brand transition-colors">{r.id || r.email || "—"}</td>
                           <td className="p-6">
                              {r.status === "success" ? (
                                <span className="inline-flex items-center gap-2 text-green-700 font-black text-[9px] bg-green-50 px-4 py-1.5 rounded-full border border-green-100 shadow-sm"><CheckCircle className="w-3.5 h-3.5" /> SUCCESS</span>
                              ) : (
                                <span className="inline-flex items-center gap-2 text-red-700 font-black text-[9px] bg-red-50 px-4 py-1.5 rounded-full border border-red-100 shadow-sm"><XCircle className="w-3.5 h-3.5" /> FAILED</span>
                              )}
                           </td>
                           <td className="p-6"><span className="text-[11px] font-bold text-muted-foreground/80 block max-w-md">{r.message || r.error || "Xử lý thành công vào hệ thống"}</span></td>
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

function TabNavItem({ value, icon, label, active }: any) {
  return (
    <TabsTrigger value={value} className={cn(
      "w-full justify-start gap-2.5 px-3.5 py-2.5 rounded-xl transition-all border-2",
      active ? "bg-brand text-white border-brand shadow-lg" : "bg-white border-transparent text-[#495057] hover:bg-brand-light hover:text-brand"
    )}>
      <span className="text-sm">{icon}</span>
      <span className="font-black text-[10px] uppercase tracking-wider">{label}</span>
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

function InstructionItem({ label, badge, desc, format, example, color = "blue" }: any) {
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
        <div className="flex items-center gap-2 mb-1">
          <b className="text-[#1a1a2e] text-xs underline decoration-brand/20 underline-offset-4">{label}</b>
          <span className="text-[10px] text-muted-foreground font-medium italic">({format})</span>
        </div>
        <div className="text-xs text-muted-foreground/90">{desc}</div>
        {example && (
          <div className="text-[9px] text-brand/80 mt-2 flex items-center gap-1 bg-brand-light/20 p-1.5 rounded-lg border border-brand/10 w-fit">
            <span className="font-black">VD:</span> <code>{example}</code>
          </div>
        )}
      </div>
    </div>
  );
}
