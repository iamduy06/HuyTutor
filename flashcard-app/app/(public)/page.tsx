import Link from "next/link";
import { createClient } from "@/services/supabase/server";
import { DeckCard } from "@/components/common/DeckCard";
import { SiteHeader } from "@/components/common/SiteHeader";
import { Button } from "@/components/ui/button";
import { Deck } from "@/types";

async function getPublicDecks(): Promise<Deck[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("decks")
    .select(`*, flashcards(id, content)`)
    .order("created_at", { ascending: false })
    .limit(6);

  return (data ?? []).map((d) => ({
    ...d,
    word_count: Array.isArray(d.flashcards)
      ? d.flashcards.reduce((acc: number, fc: { content?: { vocabulary?: unknown[] } }) =>
          acc + (fc?.content?.vocabulary?.length ?? 0), 0)
      : 0,
  }));
}

export default async function HomePage() {
  const decks = await getPublicDecks();

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-white via-brand-red-light to-white py-20 px-[5%]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-brand-red-light text-brand-red px-4 py-1.5 rounded-full text-sm font-bold mb-5">
            🎓 Nền tảng học từ vựng tiếng Anh #1
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-5 leading-tight">
            Học tiếng Anh<br />
            <span className="text-brand-red">hiệu quả hơn</span> mỗi ngày
          </h1>
          <p className="text-gray-600 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Flashcard thông minh với phát âm chuẩn, ví dụ thực tế và hệ thống theo dõi tiến độ cá nhân hoá.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/decks">
              <Button size="lg" className="text-base px-8">Xem bộ đề ngay →</Button>
            </Link>
            <a
              href="https://web.facebook.com/huytutor"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="text-base px-8">
                💬 Liên hệ đăng ký
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-[5%] bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center mb-10">
            Tại sao chọn <span className="text-brand-red">Huy Tutor</span>?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: "🎯", title: "Học theo CEFR", desc: "Từ A1 đến C2, có lộ trình rõ ràng phù hợp mọi trình độ." },
              { icon: "🔊", title: "Phát âm chuẩn", desc: "Âm thanh thực từ từ điển Oxford & Merriam-Webster." },
              { icon: "📊", title: "Theo dõi tiến độ", desc: "Streak hàng ngày, % hoàn thành và thống kê chi tiết." },
            ].map((f) => (
              <div key={f.title} className="bg-brand-red-light rounded-2xl p-6 text-center">
                <div className="text-4xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deck Preview */}
      {decks.length > 0 && (
        <section className="py-16 px-[5%] bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-extrabold">Bộ đề nổi bật</h2>
              <Link href="/decks" className="text-brand-red font-bold text-sm hover:underline">
                Xem tất cả →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {decks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} href={`/decks/${deck.id}`} actionLabel="Học thử" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-[5%] bg-brand-red text-white text-center">
        <h2 className="text-3xl font-extrabold mb-3">Sẵn sàng bắt đầu?</h2>
        <p className="opacity-90 mb-6 max-w-md mx-auto">
          Đăng ký tài khoản miễn phí hoặc liên hệ Huy Tutor để được tư vấn bộ đề phù hợp.
        </p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/register">
            <Button size="lg" className="bg-white text-brand-red hover:bg-white/90 font-bold">
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

      <footer className="text-center py-5 text-muted-foreground text-xs border-t bg-white">
        © Bản quyền thuộc về <strong>Huy Tutor</strong> &nbsp;|&nbsp;
        <a href="https://www.huytutor.io.vn/" target="_blank" rel="noopener noreferrer" className="text-brand-red font-semibold hover:underline">
          www.huytutor.io.vn
        </a>
      </footer>
    </div>
  );
}
