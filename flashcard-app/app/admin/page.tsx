import { createClient } from "@/services/supabase/server";
import Link from "next/link";
import { Users, BookOpen, TrendingUp, CheckCircle } from "lucide-react";

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

  const avgProgress = userDecks?.length
    ? Math.round(userDecks.reduce((a, b) => a + (b.progress_percent ?? 0), 0) / userDecks.length)
    : 0;
  const totalLearned = userDecks?.reduce((a, b) => a + (b.learned_count ?? 0), 0) ?? 0;

  const stats = [
    { label: "Người dùng", value: userCount ?? 0, icon: Users, href: "/admin/users", color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Bộ đề", value: deckCount ?? 0, icon: BookOpen, href: "/admin/decks", color: "text-brand-red", bg: "bg-brand-red-light" },
    { label: "Tiến độ TB", value: `${avgProgress}%`, icon: TrendingUp, href: "/admin/analytics", color: "text-green-500", bg: "bg-green-50" },
    { label: "Từ đã học", value: totalLearned, icon: CheckCircle, href: "/admin/analytics", color: "text-purple-500", bg: "bg-purple-50" },
  ];

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-6 text-2xl font-extrabold">🛠️ Admin Dashboard</h1>
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="rounded-2xl border-2 border-gray-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-red">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.bg}`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-extrabold">{s.value}</div>
            <div className="mt-0.5 text-sm text-gray-400">{s.label}</div>
          </Link>
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {[
          { title: "Quản lý người dùng", desc: "Tạo user, reset mật khẩu, gán deck.", href: "/admin/users" },
          { title: "Quản lý bộ đề", desc: "CRUD decks, upload JSON flashcards.", href: "/admin/decks" },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border-2 border-gray-100 bg-white p-6">
            <h3 className="mb-1 text-lg font-bold">{c.title}</h3>
            <p className="mb-4 text-sm text-gray-400">{c.desc}</p>
            <Link href={c.href} className="text-sm font-bold text-brand-red hover:underline">Đi đến →</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
