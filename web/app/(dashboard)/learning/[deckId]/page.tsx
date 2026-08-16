import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiClient } from "@/lib/server-api-client";
import { Workspace } from "@/components/flashcard/Workspace";

interface Props { params: { deckId: string } }

interface DeckAccessResponse {
  canLearnFull: boolean;
  isPreview: boolean;
  previewLimit?: number;
  canView: boolean;
}

export default async function LearningPage({ params }: Props) {
  // Auth check only — no DB query
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All DB access goes through the Express API server
  let access: DeckAccessResponse | null = null;
  try {
    access = await serverApiClient.get<DeckAccessResponse>(`/me/deck-access/${params.deckId}`);
  } catch (err: any) {
    const msg = err?.message ?? "";
    if (msg.includes("404")) redirect("/dashboard");
    throw err;
  }

  if (!access) redirect("/dashboard");

  // Nếu không thể học đầy đủ:
  if (!access.canLearnFull) {
    if (access.isPreview) {
      // Nếu là preview, đẩy ra trang giới thiệu để học thử
      redirect(`/decks/${params.deckId}`);
    } else {
      // Nếu không có quyền gì cả, đẩy về dashboard
      redirect("/dashboard");
    }
  }

  // Workspace fetches deck data client-side via React Query
  return <Workspace deckId={params.deckId} />;
}
