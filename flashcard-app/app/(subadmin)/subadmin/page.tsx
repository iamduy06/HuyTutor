"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, UserPlus, BookOpen, Search, Loader2, 
  Trash2, ShieldCheck, Calendar, Info, LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// ── Types ─────────────────────────────────────────────────────────────────────
interface UserDeck {
  id: string; deck_id: string; expired_at: string | null;
  deck: { title: string };
}
interface GroupMember {
  id: string; email: string; role: string; created_at: string;
  user_decks: UserDeck[];
  is_subadmin_in_group: boolean;
}
interface GroupData {
  id: string; name: string; description: string; max_users: number;
  users: GroupMember[];
}
interface GlobalDeck { id: string; title: string; }

// ── API ───────────────────────────────────────────────────────────────────────
async function fetchSubadminData(): Promise<{ groups: GroupData[] }> {
  const res = await fetch("/api/subadmin/users");
  if (!res.ok) throw new Error("Failed to fetch subadmin data");
  return res.json();
}

async function fetchInternalDecks(): Promise<{ decks: GlobalDeck[] }> {
  // Use public decks API but subadmins might need a filtered list? 
  // For now, let's assume all decks or add a specific pool API later.
  const res = await fetch("/api/decks");
  if (!res.ok) throw new Error("Failed to fetch decks");
  return res.json();
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function SubadminDashboard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  // Assignment states
  const [assignUser, setAssignUser] = useState<{ uid: string; gid: string } | null>(null);
  const [selDeck, setSelDeck] = useState("");
  const [selExpiry, setSelExpiry] = useState("");

  // Queries
  const { data, isLoading } = useQuery({ queryKey: ["subadmin-groups"], queryFn: fetchSubadminData });
  const groups = data?.groups ?? [];
  const { data: deckData } = useQuery({ queryKey: ["decks-pool"], queryFn: fetchInternalDecks });
  const decksPool = deckData?.decks ?? [];

  // Mutations
  const assignDeckMutation = useMutation({
    mutationFn: async (vars: any) => {
      const res = await fetch("/api/subadmin/assign-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars)
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error ?? "Assignment failed");
      return d;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subadmin-groups"] });
      setAssignUser(null);
      toast({ title: "Giao đề thành công", description: "Thời hạn đã được kiểm tra và thiết lập." });
    },
    onError: (e: any) => {
      toast({ title: "Lỗi giao đề", description: e.message, variant: "destructive" });
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#ed0046]" />
        <p className="text-muted-foreground font-bold tracking-tight">Đang tải dữ liệu nhóm...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-[#ed0046]" />
            <h1 className="text-2xl font-black text-[#1a1a2e] uppercase tracking-tight">Quản lý <span className="text-[#ed0046]">Nhóm Hội Viên</span></h1>
          </div>
          <p className="text-muted-foreground text-sm font-medium">Bảng điều khiển dành cho Subadmin để quản lý thành viên và giao đề.</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tìm kiếm thành viên..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-2 border-[#f0e0e7] focus-visible:ring-[#ed0046]"
          />
        </div>
      </header>

      {groups.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#f0e0e7] rounded-3xl p-12 text-center space-y-4">
          <div className="bg-[#fff0f4] w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <Info className="text-[#ed0046] w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold">Chưa có nhóm nào được quản lý</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">Bạn hiện không phụ trách quản lý nhóm chuyên sâu nào. Hãy liên hệ ADMIN để được phân quyền.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {groups.map(group => {
            const groupMembers = group.users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));
            const isFull = group.users.length >= group.max_users;

            return (
              <section key={group.id} className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 border-b-2 border-[#f0e0e7] pb-4">
                  <div>
                    <h2 className="text-xl font-black text-[#1a1a2e] flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-green-600" /> {group.name}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium">{group.description || "Quản lý học viên chuyên sâu"}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className={`px-4 py-1.5 rounded-xl border-2 flex items-center gap-2 ${isFull ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                      <Users className="w-4 h-4" />
                      <span className="font-black">{group.users.length} / {group.max_users}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groupMembers.map(member => (
                    <div key={member.id} className="bg-white border-2 border-[#f0e0e7] rounded-2xl p-5 hover:border-[#ed0046] transition-all shadow-sm group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <p className="font-black text-sm text-[#1a1a2e] truncate max-w-[150px]">{member.email}</p>
                          <div className="flex items-center gap-2">
                             {member.is_subadmin_in_group && <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">QUẢN LÝ</span>}
                             <span className="text-[10px] text-muted-foreground">Tham gia: {new Date(member.created_at).toLocaleDateString("vi-VN")}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-3 mb-4">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Bộ đề đang gán ({member.user_decks.length})</p>
                        <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                          {member.user_decks.map(ud => (
                            <div key={ud.id} className="bg-[#fff0f4] text-[#ed0046] text-[10px] px-2 py-1 rounded-lg border border-[#f0e0e7] font-bold">
                              {ud.deck.title}
                            </div>
                          ))}
                          {member.user_decks.length === 0 && <span className="text-[11px] text-muted-foreground italic">Chưa được giao đề</span>}
                        </div>
                      </div>

                      <Button 
                        onClick={() => setAssignUser({ uid: member.id, gid: group.id })}
                        className="w-full bg-[#1a1a2e] hover:bg-[#ed0046] text-white rounded-xl h-10 font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:-translate-y-1"
                      >
                        <BookOpen className="w-4 h-4" /> Giao đề mới
                      </Button>
                    </div>
                  ))}
                  
                  {/* Add User placeholder */}
                  {!isFull && (
                    <button className="border-2 border-dashed border-[#f0e0e7] rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-[#ed0046] hover:text-[#ed0046] transition-all group h-[200px]">
                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#f0e0e7] flex items-center justify-center group-hover:border-[#ed0046]">
                          <UserPlus className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm">Thêm học viên mới</span>
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Dialog: Assign Deck */}
      <Dialog open={!!assignUser} onOpenChange={() => setAssignUser(null)}>
        <DialogContent className="max-w-md rounded-3xl overflow-hidden p-0">
           <div className="bg-[#fff0f4] p-6 border-b relative">
              <DialogTitle className="text-xl font-black text-[#1a1a2e] flex items-center gap-2">
                 <BookOpen className="text-[#ed0046]" /> Giao bộ đề mới
              </DialogTitle>
              <div className="absolute top-6 right-6 opacity-10">
                 <BookOpen className="w-16 h-16" />
              </div>
           </div>
           
           <div className="p-6 space-y-6">
              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Chọn bộ đề</Label>
                    <Select value={selDeck} onValueChange={setSelDeck}>
                      <SelectTrigger className="rounded-2xl h-12 border-2 border-[#f0e0e7] font-bold">
                        <SelectValue placeholder="-- Chọn từ kho đề của nhóm --" />
                      </SelectTrigger>
                      <SelectContent>
                        {decksPool.map(d => (
                          <SelectItem key={d.id} value={d.id} className="font-semibold">{d.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <Calendar className="w-3.5 h-3.5" /> Hạn sử dụng (Học viên)
                    </Label>
                    <Input 
                       type="datetime-local" 
                       value={selExpiry} 
                       onChange={e => setSelExpiry(e.target.value)}
                       className="rounded-2xl h-12 border-2 border-[#f0e0e7] font-bold"
                    />
                    <p className="text-[10px] text-[#ed0046] font-bold italic px-2">* Tuyệt đối không được vượt quá thời hạn bộ đề của Nhóm.</p>
                 </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3">
                 <Info className="w-5 h-5 text-orange-500 flex-shrink-0" />
                 <p className="text-[10px] font-bold text-orange-800 leading-relaxed">
                    Hệ thống sẽ tự động kiểm tra thời hạn của Nhóm trước khi gán. Nếu bạn gán ngày xa hơn hạn mức cho phép, giao dịch sẽ bị huỷ.
                 </p>
              </div>
           </div>

           <DialogFooter className="p-6 bg-gray-50 flex items-center justify-between border-t gap-4">
              <Button variant="ghost" className="flex-1 font-bold rounded-2xl" onClick={() => setAssignUser(null)}>Huỷ bỏ</Button>
              <Button 
                onClick={() => assignDeckMutation.mutate({ 
                   user_id: assignUser?.uid, 
                   group_id: assignUser?.gid, 
                   deck_id: selDeck, 
                   expired_at: selExpiry 
                })}
                disabled={!selDeck || assignDeckMutation.isPending}
                className="flex-[2] bg-[#ed0046] hover:bg-[#c0003a] text-white font-black rounded-2xl h-12 shadow-lg shadow-[#ed0046]/20 transition-all hover:-translate-y-1"
              >
                {assignDeckMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Xác nhận giao đề"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
