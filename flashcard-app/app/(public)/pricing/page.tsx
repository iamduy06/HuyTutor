import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { FACEBOOK_URL } from "@/lib/constants";

export const metadata = {
  title: "Bảng giá — Huy Tutor Flashcard",
  description: "Bảng giá các gói truy cập hệ thống flashcard thông minh từ Huy Tutor",
};

export default function PricingPage() {
  return (
    <div className="flex flex-col">
      {/* ── PRICING HERO ── */}
      <section className="pt-16 pb-10 px-[5%] text-center">
        <div className="inline-block bg-brand-light text-brand text-[0.8em] font-bold px-3 py-1 rounded-full mb-3 tracking-[0.3px]">
          Báo giá
        </div>
        <h1 className="text-[2em] font-extrabold leading-[1.2] text-[#1a1a2e]">
          Chọn gói phù hợp với bạn
        </h1>
        <p className="text-muted-foreground text-[0.95em] mt-2">
          Truy cập trọn bộ flashcard với mức giá ưu đãi từ Huy Tutor
        </p>
      </section>

      {/* ── FREE BOX ── */}
      <section className="px-[5%] pb-8 max-w-[900px] mx-auto w-full">
        <div className="bg-brand-light border-2 border-brand-mid rounded-2xl p-7 max-w-full">
          <h3 className="text-[1.2em] font-extrabold text-brand mb-3">
            🎁 Gói miễn phí — Dành cho khách hàng Huy Tutor
          </h3>
          <p className="text-[0.9em] text-[#1a1a2e] leading-[1.7]">
            Áp dụng cho quý <strong className="text-brand font-bold">Thầy/Cô và các bạn đã mua tài liệu của Huy Tutor</strong>, 
            được cấp quyền truy cập tương ứng với tài liệu đã mua.<br /><br />
            • <strong className="text-brand font-bold">1 tài khoản Gmail chính</strong> (đã dùng để mua tài liệu) — không giới hạn thời gian truy cập.<br />
            • <strong className="text-brand font-bold">Đã mua file Word:</strong> được đề nghị cấp quyền miễn phí tối đa <strong className="text-brand font-bold">20 tài khoản Gmail khác</strong> 
            (để học sinh luyện tập). Từ tài khoản thứ 21, đăng ký theo mức giá ưu đãi — thời gian truy cập 1 năm kể từ ngày hệ thống cấp quyền.
          </p>
        </div>
      </section>

      {/* ── INDIVIDUAL PRICING ── */}
      <section className="px-[5%] pb-3 max-w-[900px] mx-auto w-full">
        <div className="text-[1.05em] font-bold text-[#1a1a2e] mb-5 text-center">
          Truy cập trọn bộ flashcard với gói đăng ký
        </div>
      </section>
      
      <section className="px-[5%] pb-[70px] max-w-[960px] mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Plan 1 */}
          <div className="bg-white border-2 border-[#f0e0e7] rounded-[20px] py-8 px-7 transition-all duration-250">
            <div className="text-[0.8em] font-bold text-muted-foreground uppercase tracking-[0.5px] mb-2.5">
              Cá nhân
            </div>
            <div className="text-[1.4em] font-extrabold mb-2 text-[#1a1a2e]">Gói 1 năm</div>
            <div className="text-[2.6em] font-extrabold text-brand mt-4 mb-1 leading-none">
              50.000<span className="text-[0.45em] font-semibold text-muted-foreground align-top">đ</span>
            </div>
            <div className="text-[0.82em] text-muted-foreground mb-5">
              1 tài khoản Gmail · 1 năm truy cập
            </div>
            <hr className="border-t-[1.5px] border-[#f0e0e7] my-5" />
            <ul className="flex flex-col gap-2.5 mb-7">
              <PricingFeature active text="Trọn bộ flashcard tất cả chủ đề" />
              <PricingFeature active text="296 collocations + 1000+ phrasal verbs" />
              <PricingFeature active text="30+ bộ đề luyện tập" />
              <PricingFeature active text="Nghe phát âm không giới hạn" />
            </ul>
            <Button variant="outline" className="w-full rounded-full border-2 border-brand text-brand hover:bg-brand-light h-[48px] text-[0.95em]" asChild>
              <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfENbzWKlk5YBuyX4aFBY237uZcoY5EnFZsH_FV1Tu0V3OciA/viewform" target="_blank">Đăng ký gói này</Link>
            </Button>
          </div>

          {/* Plan 2 */}
          <div className="bg-white border-2 border-brand rounded-[20px] py-8 px-7 transition-all duration-250 relative overflow-hidden">
            <div className="absolute top-[14px] -right-[24px] bg-brand text-white text-[0.72em] font-bold py-1 px-9 rotate-[35deg] tracking-[0.3px]">
              Phổ biến nhất
            </div>
            <div className="text-[0.8em] font-bold text-muted-foreground uppercase tracking-[0.5px] mb-2.5">
              Cá nhân
            </div>
            <div className="text-[1.4em] font-extrabold mb-2 text-[#1a1a2e]">Gói 2 năm</div>
            <div className="text-[2.6em] font-extrabold text-brand mt-4 mb-1 leading-none">
              80.000<span className="text-[0.45em] font-semibold text-muted-foreground align-top">đ</span>
            </div>
            <div className="text-[0.82em] text-muted-foreground mb-5">
              1 tài khoản Gmail · 2 năm truy cập
            </div>
            <hr className="border-t-[1.5px] border-[#f0e0e7] my-5" />
            <ul className="flex flex-col gap-2.5 mb-7">
              <PricingFeature active text="Tất cả quyền lợi gói 1 năm" />
              <PricingFeature active text="Tiết kiệm hơn so với gia hạn riêng lẻ" />
              <PricingFeature active text="Phù hợp học sinh THPT 2 năm cuối" />
              <PricingFeature active text="Cập nhật nội dung mới liên tục" />
            </ul>
            <Button variant="brand" className="w-full rounded-full h-[48px] text-[0.95em]" asChild>
              <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfENbzWKlk5YBuyX4aFBY237uZcoY5EnFZsH_FV1Tu0V3OciA/viewform" target="_blank">Đăng ký gói này</Link>
            </Button>
          </div>

          {/* Plan 3 */}
          <div className="bg-white border-2 border-[#f0e0e7] rounded-[20px] py-8 px-7 transition-all duration-250">
            <div className="text-[0.8em] font-bold text-muted-foreground uppercase tracking-[0.5px] mb-2.5">
              Cá nhân
            </div>
            <div className="text-[1.4em] font-extrabold mb-2 text-[#1a1a2e]">Gói 3 năm</div>
            <div className="text-[2.6em] font-extrabold text-brand mt-4 mb-1 leading-none">
              120.000<span className="text-[0.45em] font-semibold text-muted-foreground align-top">đ</span>
            </div>
            <div className="text-[0.82em] text-muted-foreground mb-5">
              1 tài khoản Gmail · 3 năm truy cập
            </div>
            <hr className="border-t-[1.5px] border-[#f0e0e7] my-5" />
            <ul className="flex flex-col gap-2.5 mb-7">
              <PricingFeature active text="Tất cả quyền lợi gói 2 năm" />
              <PricingFeature active text="Giá trị nhất cho học sinh THCS–THPT" />
              <PricingFeature active text="Đồng hành suốt quá trình ôn luyện" />
              <PricingFeature active text="Không lo gián đoạn khi thi cử" />
            </ul>
            <Button variant="outline" className="w-full rounded-full border-2 border-brand text-brand hover:bg-brand-light h-[48px] text-[0.95em]" asChild>
              <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfENbzWKlk5YBuyX4aFBY237uZcoY5EnFZsH_FV1Tu0V3OciA/viewform" target="_blank">Đăng ký gói này</Link>
            </Button>
          </div>

        </div>
      </section>

      {/* ── GROUP PRICING ── */}
      <section className="px-[5%] pb-[70px] max-w-[960px] mx-auto w-full">
        
        <h3 className="text-[1.3em] font-extrabold text-[#1a1a2e] mb-2 mt-12">
          Gia hạn đăng ký cá nhân
        </h3>
        <p className="text-[0.88em] text-muted-foreground mb-5">
          Mức giá ưu đãi dành riêng cho tài khoản đã từng đăng ký
        </p>
        <div className="overflow-x-auto rounded-[14px] border-[1.5px] border-[#f0e0e7] bg-white">
          <table className="w-full border-collapse text-[0.85em]">
            <thead>
              <tr className="bg-brand text-white">
                <th className="p-[11px_14px] text-left font-bold border-b border-brand">Gói gia hạn</th>
                <th className="p-[11px_14px] text-left font-bold border-b border-brand">Thời hạn</th>
                <th className="p-[11px_14px] text-left font-bold border-b border-brand">Đơn giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e0e7]">
              <tr className="bg-[#fafafa]">
                <td className="p-[10px_14px] text-[#1a1a2e]">Gia hạn cá nhân (1 tài khoản)</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">1 năm</td>
                <td className="p-[10px_14px] text-brand font-bold">40.000đ</td>
              </tr>
              <tr>
                <td className="p-[10px_14px] text-[#1a1a2e]">Gia hạn cá nhân (1 tài khoản)</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">2 năm</td>
                <td className="p-[10px_14px] text-brand font-bold">60.000đ</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-[1.3em] font-extrabold text-[#1a1a2e] mb-2 mt-12">
          Đăng ký theo nhóm — Lần đầu
        </h3>
        <p className="text-[0.88em] text-muted-foreground mb-5">
          Áp dụng cho lớp học/nhà trường/trung tâm. Đơn giá nhân với số lượng tài khoản thực tế.
        </p>
        <div className="overflow-x-auto rounded-[14px] border-[1.5px] border-[#f0e0e7] bg-white">
          <table className="w-full border-collapse text-[0.85em]">
            <thead>
              <tr className="bg-brand text-white">
                <th className="p-[11px_14px] text-left font-bold border-b border-brand">Nhóm tài khoản</th>
                <th className="p-[11px_14px] text-left font-bold border-b border-brand">1 năm</th>
                <th className="p-[11px_14px] text-left font-bold border-b border-brand">2 năm</th>
                <th className="p-[11px_14px] text-left font-bold border-b border-brand">3 năm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e0e7]">
              <tr className="bg-[#fafafa]">
                <td className="p-[10px_14px] text-[#1a1a2e]">2–10 tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">40.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">70.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">100.000đ/tài khoản</td>
              </tr>
              <tr>
                <td className="p-[10px_14px] text-[#1a1a2e]">11–50 tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">35.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">60.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">90.000đ/tài khoản</td>
              </tr>
              <tr className="bg-[#fafafa]">
                <td className="p-[10px_14px] text-[#1a1a2e]">51–100 tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">25.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">45.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">70.000đ/tài khoản</td>
              </tr>
              <tr>
                <td className="p-[10px_14px] text-[#1a1a2e]">Nhiều hơn 100 tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">15.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">25.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">40.000đ/tài khoản</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-[1.3em] font-extrabold text-[#1a1a2e] mb-2 mt-12">
          Gia hạn theo nhóm
        </h3>
        <p className="text-[0.88em] text-muted-foreground mb-5">
          Áp dụng khi gia hạn cho nhóm tài khoản đã đăng ký trước đó.
        </p>
        <div className="overflow-x-auto rounded-[14px] border-[1.5px] border-[#f0e0e7] bg-white">
          <table className="w-full border-collapse text-[0.85em]">
            <thead>
              <tr className="bg-brand text-white">
                <th className="p-[11px_14px] text-left font-bold border-b border-brand">Nhóm tài khoản</th>
                <th className="p-[11px_14px] text-left font-bold border-b border-brand">1 năm</th>
                <th className="p-[11px_14px] text-left font-bold border-b border-brand">2 năm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0e0e7]">
              <tr className="bg-[#fafafa]">
                <td className="p-[10px_14px] text-[#1a1a2e]">2–10 tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">30.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">60.000đ/tài khoản</td>
              </tr>
              <tr>
                <td className="p-[10px_14px] text-[#1a1a2e]">11–50 tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">25.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">45.000đ/tài khoản</td>
              </tr>
              <tr className="bg-[#fafafa]">
                <td className="p-[10px_14px] text-[#1a1a2e]">51–100 tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">15.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">30.000đ/tài khoản</td>
              </tr>
              <tr>
                <td className="p-[10px_14px] text-[#1a1a2e]">Nhiều hơn 100 tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">10.000đ/tài khoản</td>
                <td className="p-[10px_14px] text-[#1a1a2e]">15.000đ/tài khoản</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[0.82em] text-muted-foreground mt-3.5">
          * Để đăng ký theo nhóm hoặc gói miễn phí, vui lòng liên hệ qua{" "}
          <a href={FACEBOOK_URL || "https://www.facebook.com/huytutor"} target="_blank" className="text-brand font-bold hover:underline">
            Fanpage Huy Tutor - Tài Liệu Tiếng Anh
          </a>.
        </p>

      </section>
    </div>
  );
}

function PricingFeature({ active, text }: { active: boolean; text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-[0.88em] text-[#1a1a2e] leading-[1.5]">
      <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center border-2 ${
        active ? 'bg-brand border-brand text-white' : 'bg-brand-light border-brand-mid text-brand-mid'
      }`}>
        <CheckCircle2 className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-brand-mid'}`} strokeWidth={3} />
      </div>
      <span>{text}</span>
    </li>
  );
}
