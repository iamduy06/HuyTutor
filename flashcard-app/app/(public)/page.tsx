import Link from "next/link";
import "./landing.css";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">✦ Hệ thống Flashcard chuyên biệt</div>
        <h1>Học từ vựng tiếng Anh<br /><span>hiệu quả & thông minh</span></h1>
        <p>Hàng nghìn flashcard phân loại theo chuẩn CEFR, có phát âm, ví dụ song ngữ và từ đồng/trái nghĩa — được biên soạn bởi Huy Tutor.</p>
        <div className="hero-btns">
          <Link href="/decks" className="btn-primary-custom text-center">Bắt đầu học ngay</Link>
          <Link href="/pricing" className="btn-secondary-custom text-center">Xem báo giá</Link>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="stat-num">30 000+</div>
            <div className="stat-label">Thẻ lật</div>
          </div>
          <div className="stat">
            <div className="stat-num">B1–C2</div>
            <div className="stat-label">Phân cấp CEFR</div>
          </div>
          <div className="stat">
            <div className="stat-num">150+</div>
            <div className="stat-label">Bảng từ đề thi</div>
          </div>
          <div className="stat">
            <div className="stat-num">100%</div>
            <div className="stat-label">Chuẩn mực & Chi tiết</div>
          </div>
        </div>
      </section>

      {/* VIDEO DEMO */}
      <section className="py-12 md:py-16 px-[5%] bg-gradient-to-b from-white to-[#fff8fb] border-b border-[--border]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="section-label mb-2">Giới Thiệu Trang Web</div>
          <div className="section-title mb-3">
            Tổng quan <span className="text-[--red]">giao diện & tính năng</span> Web Flashcard
          </div>
          <div className="relative w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border-2 border-[--border] bg-black">
            <iframe
              src="https://www.youtube.com/embed/aQ6MI9SfUKQ?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1"
              title="Video giới thiệu website Huy Tutor Flashcard"
              className="absolute top-0 left-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section">
        <div className="text-center mb-0">
          <div className="section-label">Tính năng nổi bật</div>
          <div className="section-title">Thiết kế để bạn <span className="text-[--red]">học tốt hơn</span></div>
        </div>
        <div className="features-grid">
          {[
            { icon: "🎨", title: "Giao diện hiện đại", desc: "Thiết kế tối giản, dễ nhìn. Thẻ lật mượt mà, hoạt động tốt trên mọi thiết bị — máy tính, điện thoại, máy tính bảng." },
            { icon: "🏷️", title: "Phân loại B1/B2/C1/C2", desc: "Từng thẻ được gắn nhãn cấp độ CEFR rõ ràng, giúp bạn tập trung đúng mục tiêu từ trung cấp đến nâng cao." },
            { icon: "⚡", title: "Truy cập nhanh, không reload", desc: "Chuyển giữa các bộ từ vựng tức thì, không cần tải lại trang. Trải nghiệm học mượt mà, tiết kiệm thời gian." },
            { icon: "🔊", title: "Nghe phát âm không giới hạn", desc: "Nhấn nút loa để nghe phát âm chuẩn tiếng Anh Mỹ bất kỳ lúc nào, không giới hạn số lần." },
            { icon: "📋", title: "Bảng chọn từ nhanh", desc: "Thanh danh sách bên phải liệt kê toàn bộ từ trong bộ. Nhấn thẳng vào từ muốn học, không cần bấm thủ công từ đầu đến cuối." },
            { icon: "🔢", title: "Nhảy đến thẻ theo số thứ tự", desc: "Nhập số thứ tự của thẻ vào ô tìm kiếm, hệ thống chuyển đến ngay lập tức — tiện lợi khi ôn tập có mục tiêu." },
            { icon: "🔄", title: "Từ đồng nghĩa & trái nghĩa", desc: "Hầu hết từ đơn đều được bổ sung synonyms và antonyms, giúp mở rộng vốn từ và hiểu sắc thái ngôn ngữ sâu hơn." },
            { icon: "💡", title: "Ví dụ song ngữ Anh–Việt", desc: "Mỗi thẻ có câu ví dụ thực tế và bản dịch tiếng Việt, giúp bạn hiểu rõ cách áp dụng từ/cụm từ trong ngữ cảnh." }
          ].map((f, i) => (
            <div key={i} className="feat-card">
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CEFR */}
      <section className="cefr-section">
        <div className="text-center mb-0">
          <div className="section-label">Phân loại trình độ</div>
          <div className="section-title">Nội dung từ <span className="text-[--red]">B1 đến C2</span></div>
          <p className="section-sub mx-auto text-center mt-2">Mỗi bộ flashcard được biên soạn với từ vựng phù hợp từng cấp độ theo khung năng lực CEFR châu Âu.</p>
        </div>
        <div className="cefr-grid">
          <div className="cefr-card cefr-B1">
            <div className="cefr-badge">B1</div>
            <div className="cefr-name">Trung cấp</div>
            <p className="cefr-desc text-muted-foreground">Từ vựng giao tiếp hàng ngày, nền tảng vững chắc cho kỳ thi</p>
          </div>
          <div className="cefr-card cefr-B2">
            <div className="cefr-badge">B2</div>
            <div className="cefr-name">Trung-Cao cấp</div>
            <p className="cefr-desc text-muted-foreground">Từ học thuật, collocations phổ biến trong đề thi</p>
          </div>
          <div className="cefr-card cefr-C1">
            <div className="cefr-badge">C1</div>
            <div className="cefr-name">Cao cấp</div>
            <p className="cefr-desc text-muted-foreground">Từ vựng chuyên sâu, phrasal verbs nâng cao</p>
          </div>
          <div className="cefr-card cefr-C2">
            <div className="cefr-badge">C2</div>
            <div className="cefr-name">Thành thạo</div>
            <p className="cefr-desc text-muted-foreground">Ngữ pháp & từ vựng chuẩn học thuật, Olympic</p>
          </div>
        </div>
      </section>

      {/* CONTENT LIST */}
      <section className="content-section">
        <div className="text-center">
          <div className="section-label">Nội dung hiện có</div>
          <div className="section-title">Kho tài liệu <span className="text-[--red]">phong phú</span></div>
        </div>
        <div className="content-list max-w-5xl mx-auto">
          {[
            "296 Collocations trọng tâm (cụm từ cố định)",
            "25 chủ đề Phrasal Verbs (hơn 1.000 cụm từ)",
            "Sổ tay từ vựng ôn tập tốt nghiệp — cơ bản đến nâng cao",
            "30 đề chuẩn cấu trúc — ôn luyện nước rút",
            "30 đề nâng cao (B2–C2)",
            "30 đề cơ bản theo chủ đề (B1–B2)",
            "30 đề thi thử ngôn ngữ Anh — ĐGNL BCA",
            "Tuyển tập đề thi thử trường, sở tỉnh Bắc Ninh"
          ].map((item, i) => (
            <div key={i} className="content-item">
              <div className="content-dot" />
              <div className="content-item-text">{item}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-[5%] text-center bg-white border-t border-[--border]">
        <h2 className="text-3xl font-extrabold mb-4 text-[--text]">Sẵn sàng bắt đầu học?</h2>
        <p className="text-[--muted] mb-10 max-w-xl mx-auto">Học thử ngay hôm nay để trải nghiệm phương pháp ghi nhớ từ vựng hiệu quả nhất cùng Huy Tutor.</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/decks" className="btn-primary-custom text-center">Vào thư viện Flashcard</Link>
          <Link href="/register" className="btn-secondary-custom text-center">Đăng ký tài khoản</Link>
        </div>
      </section>
    </div>
  );
}
