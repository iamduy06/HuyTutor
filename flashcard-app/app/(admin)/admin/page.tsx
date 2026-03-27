import { createClient } from "@/services/supabase/server";
import { Users, BookOpen, TrendingUp, CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  const supabase = await createClient();

  const [
    { count: userCount },
    { count: deckCount },
    { data: userDecks },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("decks").select("*", { count: "exact", head: true }),
    supabase.from("user_decks").select("progress_percent, learned_count"),
  ]);

  const avgProgress = userDecks && userDecks.length > 0
    ? Math.round(userDecks.reduce((a, b) => a + (b.progress_percent ?? 0), 0) / userDecks.length)
    : 0;

  const totalLearned = userDecks?.reduce((a, b) => a + (b.learned_count ?? 0), 0) ?? 0;

  const stats = [
    { label: "Tổng người dùng", value: userCount ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50", href: "/admin/users" },
    { label: "Bộ đề", value: deckCount ?? 0, icon: BookOpen, color: "text-brand-red", bg: "bg-brand-red-light", href: "/admin/decks" },
    { label: "Tiến độ TB", value: `${avgProgress}%`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50", href: "/admin/analytics" },
    { label: "Tổng từ đã học", value: totalLearned, icon: CheckCircle, color: "text-purple-500", bg: "bg-purple-50", href: "/admin/analytics" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold mb-6">🛠️ Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-2xl border-2 border-border p-5 hover:border-brand-red transition-all hover:-translate-y-0.5">
            <div className={`${s.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-extrabold">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[
          { title: "Quản lý người dùng", desc: "Tạo user, reset mật khẩu, gán deck và phân quyền.", href: "/admin/users", cta: "Đến trang người dùng →" },
          { title: "Quản lý bộ đề", desc: "CRUD decks, flashcards và upload JSON hàng loạt.", href: "/admin/decks", cta: "Đến trang bộ đề →" },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-2xl border-2 border-border p-6">
            <h3 className="font-bold text-lg mb-1">{card.title}</h3>
            <p className="text-muted-foreground text-sm mb-4">{card.desc}</p>
            <Link href={card.href} className="text-brand-red font-bold text-sm hover:underline">{card.cta}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
