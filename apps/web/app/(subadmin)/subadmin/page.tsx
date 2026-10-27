import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Users, BookOpen, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SubAdminPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) redirect("/login");

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://flashcard-api.huytutor.edu.vn/api/v1";
  const res = await fetch(`${apiUrl}/subadmin/overview`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/dashboard");
  }

  const { me, managedGroups, managedCount, myDecks, totalMaxUsers } = await res.json();
  const isAdmin = me.role === "ADMIN";

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1a1a2e]">
          🛡️ Sub Admin — {me.email}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isAdmin ? "Bạn đang xem giao diện SubAdmin với quyền ADMIN đầy đủ." : "Quản lý người dùng và Flashcard trong phạm vi được cấp."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5">
          <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-[#1a1a2e]">
            {managedCount ?? 0}
            {!isAdmin && <span className="text-base font-medium text-muted-foreground"> / {totalMaxUsers}</span>}
          </div>
          <div className="text-xs text-muted-foreground font-medium mt-1">
            {isAdmin ? "Tổng người dùng" : "Người dùng trong nhóm"}
          </div>
          {!isAdmin && (
            <div className="mt-2 h-1.5 bg-[#f0e0e7] rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full"
                style={{ width: `${Math.min(100, ((managedCount ?? 0) / totalMaxUsers) * 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5">
          <div className="w-10 h-10 bg-brand-light text-brand rounded-xl flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="text-2xl font-extrabold text-[#1a1a2e]">
            {(myDecks as any[])?.length ?? 0}
          </div>
          <div className="text-xs text-muted-foreground font-medium mt-1">
            Flashcard {isAdmin ? "trong hệ thống" : "của các nhóm"}
          </div>
        </div>

        {!isAdmin && (
          <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-3">
              <UserPlus className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-[#1a1a2e]">
              {Math.max(0, totalMaxUsers - (managedCount ?? 0))}
            </div>
            <div className="text-xs text-muted-foreground font-medium mt-1">Slot còn lại</div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border-2 border-[#f0e0e7] p-5">
        <h2 className="font-bold text-[#1a1a2e] mb-4">Thao tác nhanh</h2>
        <div className="flex flex-col gap-3">
          <Link href="/subadmin/users"
            className="p-3 rounded-xl border-2 border-[#f0e0e7] hover:border-brand hover:bg-brand-light transition-all group">
            <div className="font-semibold text-sm text-[#1a1a2e] group-hover:text-brand">
              👥 Quản lý người dùng
            </div>
            <div className="text-xs text-muted-foreground">
              Tạo, giao đề, reset mật khẩu trong nhóm của bạn
            </div>
          </Link>

          {/* My assigned decks preview */}
          {!isAdmin && (myDecks as any[])?.length > 0 && (
            <div className="p-3 rounded-xl border-2 border-[#f0e0e7]">
              <div className="font-semibold text-sm text-[#1a1a2e] mb-2">📚 Flashcard bạn được phân quyền:</div>
              <div className="flex flex-wrap gap-1.5">
                {(myDecks as any[]).map((ud: any) => (
                  <span key={ud.deck?.id ?? ud.id}
                    className="text-xs bg-brand-light text-brand px-2.5 py-1 rounded-full font-semibold">
                    {ud.deck?.title ?? ud.title ?? "?"}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
