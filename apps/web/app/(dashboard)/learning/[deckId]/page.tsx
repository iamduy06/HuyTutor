import { Workspace } from "@/components/flashcard/Workspace";

interface PageProps {
  params: Promise<{ deckId: string }>;
}

// Next.js 15 chuẩn: params là Promise cần await
export default async function LearningPage({ params }: PageProps) {
  const { deckId } = await params;
  return <Workspace deckId={deckId} />;
}
