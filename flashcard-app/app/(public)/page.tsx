import Link from "next/link";
import { ArrowRight, BookOpen, Brain, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FACEBOOK_URL } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-brand-light to-[#ffd6e4] py-20 px-[5%]">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-64 h-64 bg-brand rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-brand rounded-full blur-2xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-brand-mid rounded-full px-4 py-1.5 text-sm font-semibold text-brand mb-6">
            🎯 Học từ vựng thông minh hơn với Flashcard
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#1a1a2e] leading-tight mb-6">
            Nâng cao vốn từ vựng{" "}
            <span className="text-brand">tiếng Anh</span>{" "}
            của bạn
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Hệ thống Flashcard chuyên nghiệp với phát âm chuẩn, theo dõi tiến độ cá nhân hóa
            và bộ đề từ B1 đến C2.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="brand" size="lg" asChild className="rounded-full px-8 text-base font-bold shadow-lg">
              <Link href="/decks">
                Bắt đầu học <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="brand-outline" size="lg" asChild className="rounded-full px-8 text-base font-bold">
              <Link href="/decks">
                Xem bộ đề
              </Link>
            </Button>
            <Button variant="brand-outline" size="lg" asChild className="rounded-full px-8 text-base font-bold border-2">
              <Link href={FACEBOOK_URL} target="_blank">
                💬 Liên hệ đăng ký mua bộ đề
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-[5%] bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-[#1a1a2e] mb-4">
            Tại sao chọn Huy Tutor Flashcard?
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Được thiết kế bởi giáo viên, dành cho người học thực sự
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Brain className="w-7 h-7" />,
                title: "Học thông minh",
                desc: "Hệ thống Flashcard với flip card animation giúp ghi nhớ hiệu quả",
              },
              {
                icon: <BookOpen className="w-7 h-7" />,
                title: "Nội dung chất lượng",
                desc: "Từ vựng được phân loại theo CEFR từ A1 đến C2 với ví dụ thực tế",
              },
              {
                icon: <TrendingUp className="w-7 h-7" />,
                title: "Theo dõi tiến độ",
                desc: "Dashboard cá nhân hóa, streak hàng ngày và thống kê chi tiết",
              },
              {
                icon: <Users className="w-7 h-7" />,
                title: "Hỗ trợ tận tình",
                desc: "Đội ngũ giáo viên hỗ trợ và cập nhật nội dung thường xuyên",
              },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border-2 border-[#f0e0e7] hover:border-brand hover:shadow-md transition-all group">
                <div className="w-12 h-12 rounded-xl bg-brand-light flex items-center justify-center text-brand mb-4 group-hover:bg-brand group-hover:text-white transition-all">
                  {f.icon}
                </div>
                <h3 className="font-bold text-[#1a1a2e] mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-[5%] bg-brand">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-3xl font-extrabold mb-4">Sẵn sàng bắt đầu?</h2>
          <p className="mb-8 opacity-90 text-lg">
            Học thử miễn phí ngay hôm nay — không cần tài khoản
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" className="bg-white text-brand hover:bg-brand-light rounded-full px-8 font-bold" asChild>
              <Link href="/decks">Xem bộ đề ngay</Link>
            </Button>
            <Button size="lg" className="bg-white text-brand hover:bg-brand-light border-2 border-white rounded-full px-8 font-bold" asChild>
              <Link href={FACEBOOK_URL} target="_blank">Mua bộ đề đầy đủ</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
