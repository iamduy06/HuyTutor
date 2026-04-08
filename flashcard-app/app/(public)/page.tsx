import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FACEBOOK_URL } from "@/lib/constants";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ── HERO ── */}
      <section className="pt-20 pb-16 px-[5%] text-center bg-gradient-to-b from-[#fff8fb] to-white relative">
        <div className="inline-flex items-center gap-1.5 bg-brand-light text-brand text-[0.82em] font-bold px-3.5 py-1.5 rounded-full mb-6 border-[1.5px] border-brand-mid">
          ✦ Hệ thống Flashcard chuyên biệt
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-[3em] font-extrabold leading-[1.15] mb-4.5 max-w-[700px] mx-auto text-[#1a1a2e]">
          Học từ vựng tiếng Anh<br />
          <span className="text-brand">hiệu quả & thông minh</span>
        </h1>
        <p className="text-[1.1em] text-muted-foreground max-w-[540px] mx-auto mb-9 leading-[1.7]">
          Hàng nghìn flashcard phân loại theo chuẩn CEFR, có phát âm, ví dụ song ngữ và từ đồng/trái nghĩa — được biên soạn bởi Huy Tutor.
        </p>
        <div className="flex gap-3.5 justify-center flex-wrap">
          <Button variant="brand" className="rounded-full px-8 py-[14px] text-base font-bold h-auto shadow-sm" asChild>
            <Link href="/decks">Bắt đầu học ngay</Link>
          </Button>
          <Button variant="outline" className="rounded-full px-7 py-[12px] text-base font-bold border-2 border-brand text-brand hover:bg-brand-light h-auto" asChild>
            <Link href="/pricing">Xem báo giá</Link>
          </Button>
        </div>

        {/* ── STATS ── */}
        <div className="flex flex-col sm:flex-row justify-center border-[1.5px] border-[#f0e0e7] rounded-2xl max-w-[600px] mx-auto mt-[52px] bg-white overflow-hidden divide-y-[1.5px] sm:divide-y-0 sm:divide-x-[1.5px] divide-[#f0e0e7]">
          <div className="flex-1 py-5 px-2.5 text-center">
            <div className="text-[1.6em] font-extrabold text-brand">1000+</div>
            <div className="text-[0.8em] text-muted-foreground mt-0.5 font-semibold">Cụm từ & Từ vựng</div>
          </div>
          <div className="flex-1 py-5 px-2.5 text-center">
            <div className="text-[1.6em] font-extrabold text-brand">B1–C2</div>
            <div className="text-[0.8em] text-muted-foreground mt-0.5 font-semibold">Phân cấp CEFR</div>
          </div>
          <div className="flex-1 py-5 px-2.5 text-center">
            <div className="text-[1.6em] font-extrabold text-brand">90+</div>
            <div className="text-[0.8em] text-muted-foreground mt-0.5 font-semibold">Bảng từ đề thi</div>
          </div>
          <div className="flex-1 py-5 px-2.5 text-center">
            <div className="text-[1.6em] font-extrabold text-brand">100%</div>
            <div className="text-[0.8em] text-muted-foreground mt-0.5 font-semibold">Chuẩn mực & Chi tiết</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-[70px] px-[5%] bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-0">
            <div className="inline-block bg-brand-light text-brand text-[0.8em] font-bold px-3 py-1 rounded-full mb-3 tracking-[0.3px]">
              Tính năng nổi bật
            </div>
            <h2 className="text-[2em] font-extrabold leading-[1.2] mb-2.5 text-[#1a1a2e]">
              Thiết kế để bạn <span className="text-brand">học tốt hơn</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-11">
            {[
              { i: "🎨", t: "Giao diện hiện đại", d: "Thiết kế tối giản, dễ nhìn. Thẻ lật mượt mà, hoạt động tốt trên mọi thiết bị — máy tính, điện thoại, máy tính bảng." },
              { i: "🏷️", t: "Phân loại B1/B2/C1/C2", d: "Từng thẻ được gắn nhãn cấp độ CEFR rõ ràng, giúp bạn tập trung đúng mục tiêu từ trung cấp đến nâng cao." },
              { i: "⚡", t: "Truy cập nhanh, không reload", d: "Chuyển giữa các bộ từ vựng tức thì, không cần tải lại trang. Trải nghiệm học mượt mà, tiết kiệm thời gian." },
              { i: "🔊", t: "Nghe phát âm không giới hạn", d: "Nhấn nút loa để nghe phát âm chuẩn tiếng Anh Mỹ bất kỳ lúc nào, không giới hạn số lần." },
              { i: "📋", t: "Bảng chọn từ nhanh", d: "Thanh danh sách bên phải liệt kê toàn bộ từ trong bộ. Nhấn thẳng vào từ muốn học, không cần bấm thủ công từ đầu đến cuối." },
              { i: "🔢", t: "Nhảy đến thẻ theo số thứ tự", d: "Nhập số thứ tự của thẻ vào ô tìm kiếm, hệ thống chuyển đến ngay lập tức — tiện lợi khi ôn tập có mục tiêu." },
              { i: "🔄", t: "Từ đồng nghĩa & trái nghĩa", d: "Hầu hết từ đơn đều được bổ sung synonyms và antonyms, giúp mở rộng vốn từ và hiểu sắc thái ngôn ngữ sâu hơn." },
              { i: "💡", t: "Ví dụ song ngữ Anh–Việt", d: "Mỗi thẻ có câu ví dụ thực tế và bản dịch tiếng Việt, giúp bạn hiểu rõ cách áp dụng từ/cụm từ trong ngữ cảnh." },
            ].map(f => (
              <div key={f.t} className="bg-white border-[1.5px] border-[#f0e0e7] rounded-2xl p-6 transition-all duration-250 hover:border-brand-mid hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(237,0,70,0.08)]">
                <div className="w-11 h-11 bg-brand-light rounded-xl flex items-center justify-center text-[1.3em] mb-4">
                  {f.i}
                </div>
                <div className="text-[1em] font-bold text-[#1a1a2e] mb-1.5">{f.t}</div>
                <div className="text-[0.88em] text-muted-foreground leading-[1.6]">
                  {f.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CEFR ── */}
      <section className="py-[70px] px-[5%] bg-[#fafafa]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-0">
            <div className="inline-block bg-brand-light text-brand text-[0.8em] font-bold px-3 py-1 rounded-full mb-3 tracking-[0.3px]">
              Phân loại trình độ
            </div>
            <h2 className="text-[2em] font-extrabold leading-[1.2] mb-2 text-[#1a1a2e]">
              Nội dung từ <span className="text-brand">B1 đến C2</span>
            </h2>
            <div className="text-muted-foreground text-[1em] leading-[1.6] max-w-[480px] mx-auto mt-2">
              Mỗi bộ flashcard được biên soạn với từ vựng phù hợp từng cấp độ theo khung năng lực CEFR châu Âu.
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-9">
            <div className="rounded-2xl p-6 text-center border-2 border-transparent bg-[#fff9e6] border-[#ffd700]">
              <div className="text-[1.8em] font-extrabold mb-1.5 text-[#b8860b]">B1</div>
              <div className="text-[0.82em] font-bold text-muted-foreground mb-2 uppercase tracking-[0.5px]">Trung cấp</div>
              <div className="text-[0.82em] text-[#555] leading-[1.5]">Từ vựng giao tiếp hàng ngày, nền tảng vững chắc cho kỳ thi</div>
            </div>
            <div className="rounded-2xl p-6 text-center border-2 border-transparent bg-brand-light border-brand-mid">
              <div className="text-[1.8em] font-extrabold mb-1.5 text-brand">B2</div>
              <div className="text-[0.82em] font-bold text-muted-foreground mb-2 uppercase tracking-[0.5px]">Trung-Cao cấp</div>
              <div className="text-[0.82em] text-[#555] leading-[1.5]">Từ học thuật, collocations phổ biến trong đề thi</div>
            </div>
            <div className="rounded-2xl p-6 text-center border-2 border-transparent bg-[#f0eeff] border-[#c7b8ff]">
              <div className="text-[1.8em] font-extrabold mb-1.5 text-[#5c35cc]">C1</div>
              <div className="text-[0.82em] font-bold text-muted-foreground mb-2 uppercase tracking-[0.5px]">Cao cấp</div>
              <div className="text-[0.82em] text-[#555] leading-[1.5]">Từ vựng chuyên sâu, phrasal verbs nâng cao</div>
            </div>
            <div className="rounded-2xl p-6 text-center border-2 border-transparent bg-[#e8f5e9] border-[#a5d6a7]">
              <div className="text-[1.8em] font-extrabold mb-1.5 text-[#2e7d32]">C2</div>
              <div className="text-[0.82em] font-bold text-muted-foreground mb-2 uppercase tracking-[0.5px]">Thành thạo</div>
              <div className="text-[0.82em] text-[#555] leading-[1.5]">Ngữ pháp & từ vựng chuẩn học thuật, Olympic</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT LIST ── */}
      <section className="py-[70px] px-[5%] bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-block bg-brand-light text-brand text-[0.8em] font-bold px-3 py-1 rounded-full mb-3 tracking-[0.3px]">
              Nội dung hiện có
            </div>
            <h2 className="text-[2em] font-extrabold leading-[1.2] mb-2 text-[#1a1a2e]">
              Kho tài liệu <span className="text-brand">phong phú</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-9 max-w-4xl mx-auto">
            {[
              "296 Collocations trọng tâm (cụm từ cố định)",
              "25 chủ đề Phrasal Verbs (hơn 1.000 cụm từ)",
              "Sổ tay từ vựng ôn tập tốt nghiệp — cơ bản đến nâng cao",
              "30 đề chuẩn cấu trúc — ôn luyện nước rút",
              "30 đề nâng cao (B2–C2)",
              "30 đề cơ bản theo chủ đề (B1–B2)",
              "30 đề thi thử ngôn ngữ Anh — ĐGNL BCA",
              "Tuyển tập đề thi thử trường, sở tỉnh Bắc Ninh"
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-3 bg-white border-[1.5px] border-[#f0e0e7] rounded-xl py-4 px-[18px] transition-all hover:border-brand-mid hover:bg-brand-light">
                <div className="w-2 h-2 bg-brand rounded-full shrink-0 mt-1.5"></div>
                <div className="text-[0.9em] text-[#1a1a2e] font-semibold leading-[1.5]">
                  {text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
