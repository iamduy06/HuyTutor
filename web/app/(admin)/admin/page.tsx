export const dynamic = "force-dynamic";

import { createAdminClient } from "@/services/supabase/admin";
import { Users, BookOpen, TrendingUp, Award } from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalDecks },
    { data: progressData },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("decks").select("*", { count: "exact", head: true }),
    supabase.from("user_decks").select("progress_percent"),
  ]);

  const avgProgress = progressData?.length
    ? Math.round(progressData.reduce((s, r: any) => s + (r.progress_percent || 0), 0) / progressData.length)
    : 0;

  const { data: recentUsers } = await supabase
    .from("users")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-6">🛡️ Tổng quan Admin</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng người dùng", value: totalUsers ?? 0, icon: <Users className="w-5 h-5" />, color: "text-blue-500", bg: "bg-blue-50" },
          { label: "Flashcard", value: totalDecks ?? 0, icon: <BookOpen className="w-5 h-5" />, color: "text-brand", bg: "bg-brand-light" },
          { label: "Tiến độ TB", value: `${avgProgress}%`, icon: <TrendingUp className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50" },
          { label: "Lượt giao Flashcard", value: progressData?.length ?? 0, icon: <Award className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5 flex flex-col gap-2">
            <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>{s.icon}</div>
            <div className="text-2xl font-extrabold text-[#1a1a2e]">{s.value}</div>
            <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1a1a2e]">Người dùng mới nhất</h2>
            <Link href="/admin/users" className="text-brand text-sm font-semibold hover:underline">Xem tất cả →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {(recentUsers ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-[#f0e0e7] last:border-0">
                <div>
                  <div className="font-semibold text-sm text-[#1a1a2e] truncate max-w-[200px]">{u.email}</div>
                  <div className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("vi-VN")}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  u.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-brand-light text-brand"
                }`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5">
          <h2 className="font-bold text-[#1a1a2e] mb-4">Thao tác nhanh</h2>
          <div className="flex flex-col gap-3">
            {[
              { href: "/admin/users", label: "➕ Tạo người dùng mới", desc: "Thêm tài khoản và giao Flashcard" },
              { href: "/admin/decks", label: "📚 Quản lý Flashcard", desc: "Thêm, sửa, xóa bộ và flashcard" },
              { href: "/admin/analytics", label: "📊 Xem thống kê chi tiết", desc: "Phân tích tiến độ học tập" },
            ].map((item) => (
              <Link key={item.href} href={item.href}
                className="p-3 rounded-xl border-2 border-[#f0e0e7] hover:border-brand hover:bg-brand-light transition-all group">
                <div className="font-semibold text-sm text-[#1a1a2e] group-hover:text-brand">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
