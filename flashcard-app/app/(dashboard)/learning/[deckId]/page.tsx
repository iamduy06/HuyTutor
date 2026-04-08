import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Workspace } from "@/components/flashcard/Workspace";

interface Props { params: { deckId: string } }

export default async function LearningPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Workspace fetches deck data client-side via React Query
  return <Workspace deckId={params.deckId} />;
}
