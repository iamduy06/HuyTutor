import Link from "next/link";
import { createClient } from "@/services/supabase/server";
import { SiteHeader } from "@/components/common/SiteHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { countWords } from "@/types";
import { cefrColor } from "@/lib/utils";
import { BookOpen, ChevronRight } from "lucide-react";

async function getPublicDecks() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("decks")
    .select("id, title, description, level, flashcards(content)")
    .order("created_at", { ascending: false })
    .limit(6);

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

export default async function HomePage() {
  const decks = await getPublicDecks();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-red-light via-white to-white py-20 px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-block rounded-full bg-brand-red-light px-4 py-1.5 text-sm font-bold text-brand-red">
            🎓 Nền tảng học từ vựng tiếng Anh
          </div>
          <h1 className="mb-5 text-5xl font-extrabold leading-tight text-gray-900 sm:text-6xl">
            Học tiếng Anh<br />
            <span className="text-brand-red">hiệu quả hơn</span> mỗi ngày
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-lg text-gray-500 leading-relaxed">
            Flashcard thông minh với phát âm chuẩn, ví dụ thực tế và theo dõi tiến độ cá nhân hoá.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/decks">
              <Button size="lg">Xem bộ đề ngay →</Button>
            </Link>
            <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg">💬 Liên hệ đăng ký</Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-3xl font-extrabold">
            Tại sao chọn <span className="text-brand-red">Huy Tutor</span>?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              { icon: "🎯", title: "Học theo CEFR", desc: "Lộ trình từ A1 đến C2 phù hợp mọi trình độ." },
              { icon: "🔊", title: "Phát âm chuẩn", desc: "Âm thanh thực từ Oxford & Merriam-Webster." },
              { icon: "📊", title: "Theo dõi tiến độ", desc: "Streak, % hoàn thành và thống kê chi tiết." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-brand-red-light p-6 text-center">
                <div className="mb-3 text-4xl">{f.icon}</div>
                <h3 className="mb-2 font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deck preview */}
      {decks.length > 0 && (
        <section className="bg-gray-50 py-16 px-6">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold">Bộ đề nổi bật</h2>
              <Link href="/decks" className="text-sm font-bold text-brand-red hover:underline">
                Xem tất cả →
              </Link>
            </div>
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
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand-red py-16 px-6 text-center text-white">
        <h2 className="mb-3 text-3xl font-extrabold">Sẵn sàng bắt đầu?</h2>
        <p className="mx-auto mb-6 max-w-md opacity-90">
          Đăng ký miễn phí hoặc liên hệ Huy Tutor để được tư vấn bộ đề phù hợp.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="bg-white text-brand-red hover:bg-white/90">
              Bắt đầu học ngay
            </Button>
          </Link>
          <a href="https://web.facebook.com/huytutor" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              Liên hệ tư vấn
            </Button>
          </a>
        </div>
      </section>

      <footer className="border-t bg-white py-5 text-center text-xs text-gray-400">
        © Bản quyền thuộc về <strong>Huy Tutor</strong> &nbsp;|&nbsp;
        <a href="https://www.huytutor.io.vn/" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-red hover:underline">
          www.huytutor.io.vn
        </a>
      </footer>
    </div>
  );
}
