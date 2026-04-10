import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/services/supabase/admin";
import { getDeckAccess } from "@/lib/utils";
import { Workspace } from "@/components/flashcard/Workspace";
import { AccessDeniedView } from "@/components/flashcard/AccessDeniedView";

interface Props { params: { deckId: string } }

export default async function LearningPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient();

  // 1. Lấy thông tin cần thiết để check access
  // Fetch thêm title để hiện ở trang báo lỗi nếu cần
  const [
    { data: deck },
    { data: userProfile },
    { data: userDeck }
  ] = await Promise.all([
    adminSupabase.from("decks").select("id, title, access_level, preview_word_limit").eq("id", params.deckId).single(),
    adminSupabase.from("users").select("role").eq("id", user.id).single(),
    adminSupabase.from("user_decks").select("expired_at").eq("user_id", user.id).eq("deck_id", params.deckId).maybeSingle()
  ]);

  if (!deck) redirect("/dashboard");

  // 2. Chạy logic check quyền trung tâm
  const access = getDeckAccess(userProfile as any, deck as any, userDeck);

  // Nếu không thể học đầy đủ:
  if (!access.canLearnFull) {
    if (access.isPreview) {
      // Nếu là preview, đẩy ra trang giới thiệu để học thử
      redirect(`/decks/${params.deckId}`);
    } else {
      // HIỂN THỊ THÔNG BÁO LỖI VÀ ĐẾM NGƯỢC 10S
      return (
        <div className="container py-20">
          <AccessDeniedView deckTitle={deck.title} />
        </div>
      );
    }
  }

  // Workspace fetches deck data client-side via React Query
  return <Workspace deckId={params.deckId} />;
}
