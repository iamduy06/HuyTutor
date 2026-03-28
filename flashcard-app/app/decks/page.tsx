import { createClient } from "@/services/supabase/server";
import { SiteHeader } from "@/components/common/SiteHeader";
import Link from "next/link";
import { countWords } from "@/types";
import { cefrColor } from "@/lib/utils";
import { BookOpen, ChevronRight } from "lucide-react";

async function getAllDecks() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("decks")
    .select("id, title, description, level, flashcards(content)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((d) => ({
    id: d.id as string,
    title: d.title as string,
    description: d.description as string | null,
    level: d.level as string | null,
    word_count: Array.isArray(d.flashcards)
      ? d.flashcards.reduce((acc, fc) => acc + countWords(fc.content), 0)
      : 0,
  }));
}

export default async function DecksPage() {
  const decks = await getAllDecks();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-brand-red">📚 Tất cả bộ đề</h1>
          <p className="mt-1 text-gray-500">Chọn bộ đề và học thử miễn phí ngay hôm nay</p>
        </div>

        {decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 text-6xl">📭</div>
            <p className="text-gray-400">Chưa có bộ đề nào. Quay lại sau nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => (
              <Link
                key={deck.id}
                href={`/decks/${deck.id}`}
                className="group block rounded-2xl border-2 border-gray-100 bg-white p-5 transition-all hover:-translate-y-1 hover:border-brand-red hover:shadow-lg"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red-light transition-colors group-hover:bg-brand-red">
                    <BookOpen className="h-5 w-5 text-brand-red group-hover:text-white transition-colors" />
                  </div>
                  {deck.level && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${cefrColor(deck.level)}`}>
                      {deck.level}
                    </span>
                  )}
                </div>
                <h3 className="mb-1 font-bold text-gray-900 group-hover:text-brand-red transition-colors line-clamp-2">
                  {deck.title}
                </h3>
                {deck.description && (
                  <p className="mb-3 text-sm text-gray-400 line-clamp-2">{deck.description}</p>
                )}
                <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                  <span className="text-xs font-medium text-gray-400">📝 {deck.word_count} từ</span>
                  <span className="flex items-center gap-1 text-xs font-bold text-brand-red">
                    Học thử <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <footer className="border-t bg-white py-5 text-center text-xs text-gray-400">
        © Bản quyền thuộc về <strong>Huy Tutor</strong>
      </footer>
    </div>
  );
}
