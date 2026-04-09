import Link from "next/link";
import "../landing.css";

export default function PricingPage() {
  return (
    <div className="flex flex-col bg-white">
      <div className="pricing-hero">
        <div className="section-label">Báo giá</div>
        <div className="section-title">Chọn gói phù hợp với bạn</div>
        <p className="text-[--muted] text-[0.95em] mt-2">Truy cập trọn bộ flashcard với mức giá ưu đãi từ Huy Tutor</p>
      </div>

      {/* FREE BOX */}
      <div className="px-[5%] pb-8 max-w-[900px] mx-auto w-full">
        <div className="free-box max-w-full">
          <h3>🎁 Gói miễn phí — Dành cho khách hàng Huy Tutor</h3>
          <p>
            Áp dụng cho quý <strong>Thầy/Cô và các bạn đã mua tài liệu của Huy Tutor</strong>, được cấp quyền truy cập tương ứng với tài liệu đã mua.<br /><br />
            • <strong>1 tài khoản Gmail chính</strong> (đã dùng để mua tài liệu) — không giới hạn thời gian truy cập.<br />
            • <strong>Đã mua file Word:</strong> được đề nghị cấp quyền miễn phí tối đa <strong>20 tài khoản Gmail khác</strong> (để học sinh luyện tập). Từ tài khoản thứ 21, đăng ký theo mức giá ưu đãi — thời gian truy cập 1 năm kể từ ngày hệ thống cấp quyền.
          </p>
        </div>
      </div>

      {/* INDIVIDUAL PRICING */}
      <div className="px-[5%] pb-3 max-w-[900px] mx-auto w-full text-center">
        <h2 className="text-[1.05em] font-bold text-[--text] mb-5">Truy cập trọn bộ flashcard với gói đăng ký</h2>
      </div>

      <div className="pricing-grid">
        <div className="price-card">
          <div className="price-tier">Cá nhân</div>
          <div className="price-name">Gói 1 năm</div>
          <div className="price-val">50.000<span>đ</span></div>
          <p className="text-[--muted] text-[0.82em] mb-5">1 tài khoản Gmail · 1 năm truy cập</p>
          <hr className="price-divider" />
          <ul className="price-features">
            <li className="check">Trọn bộ flashcard tất cả chủ đề</li>
            <li className="check">296 collocations + 1000+ phrasal verbs</li>
            <li className="check">30+ bộ đề luyện tập</li>
            <li className="check">Nghe phát âm không giới hạn</li>
          </ul>
          <Link 
            href="https://docs.google.com/forms/d/e/1FAIpQLSfENbzWKlk5YBuyX4aFBY237uZcoY5EnFZsH_FV1Tu0V3OciA/viewform" 
            target="_blank"
            className="btn-price outline"
          >
            Đăng ký gói này
          </Link>
        </div>

        <div className="price-card featured">
          <div className="price-tier">Cá nhân</div>
          <div className="price-name">Gói 2 năm</div>
          <div className="price-val">80.000<span>đ</span></div>
          <p className="text-[--muted] text-[0.82em] mb-5">1 tài khoản Gmail · 2 năm truy cập</p>
          <hr className="price-divider" />
          <ul className="price-features">
            <li className="check">Tất cả quyền lợi gói 1 năm</li>
            <li className="check">Tiết kiệm hơn so với gia hạn riêng lẻ</li>
            <li className="check">Phù hợp học sinh THPT 2 năm cuối</li>
            <li className="check">Cập nhật nội dung mới liên tục</li>
          </ul>
          <Link 
            href="https://docs.google.com/forms/d/e/1FAIpQLSfENbzWKlk5YBuyX4aFBY237uZcoY5EnFZsH_FV1Tu0V3OciA/viewform" 
            target="_blank"
            className="btn-price solid"
          >
            Đăng ký gói này
          </Link>
        </div>

        <div className="price-card">
          <div className="price-tier">Cá nhân</div>
          <div className="price-name">Gói 3 năm</div>
          <div className="price-val">120.000<span>đ</span></div>
          <p className="text-[--muted] text-[0.82em] mb-5">1 tài khoản Gmail · 3 năm truy cập</p>
          <hr className="price-divider" />
          <ul className="price-features">
            <li className="check">Tất cả quyền lợi gói 2 năm</li>
            <li className="check">Giá trị nhất cho học sinh THCS–THPT</li>
            <li className="check">Đồng hành suốt quá trình ôn luyện</li>
            <li className="check">Không lo gián đoạn khi thi cử</li>
          </ul>
          <Link 
            href="https://docs.google.com/forms/d/e/1FAIpQLSfENbzWKlk5YBuyX4aFBY237uZcoY5EnFZsH_FV1Tu0V3OciA/viewform" 
            target="_blank"
            className="btn-price outline"
          >
            Đăng ký gói này
          </Link>
        </div>
      </div>

      {/* RENEWAL & GROUP */}
      <div className="group-section max-w-[960px] mx-auto w-full">
        <h2 className="group-title">Gia hạn đăng ký cá nhân</h2>
        <p className="group-sub">Mức giá ưu đãi dành riêng cho tài khoản đã từng đăng ký</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Gói gia hạn</th><th>Thời hạn</th><th>Đơn giá</th></tr>
            </thead>
            <tbody>
              <tr><td>Gia hạn cá nhân (1 tài khoản)</td><td>1 năm</td><td className="text-[--red] font-bold">40.000đ</td></tr>
              <tr><td>Gia hạn cá nhân (1 tài khoản)</td><td>2 năm</td><td className="text-[--red] font-bold">60.000đ</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="group-title" style={{ marginTop: '48px' }}>Đăng ký theo nhóm — Lần đầu</h2>
        <p className="group-sub">Áp dụng cho lớp học/nhà trường/trung tâm. Đơn giá nhân với số lượng tài khoản thực tế.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nhóm tài khoản</th><th>1 năm</th><th>2 năm</th><th>3 năm</th></tr>
            </thead>
            <tbody>
              <tr><td>2–10 tài khoản</td><td>40.000đ/tài khoản</td><td>70.000đ/tài khoản</td><td>100.000đ/tài khoản</td></tr>
              <tr><td>11–50 tài khoản</td><td>35.000đ/tài khoản</td><td>60.000đ/tài khoản</td><td>90.000đ/tài khoản</td></tr>
              <tr><td>51–100 tài khoản</td><td>25.000đ/tài khoản</td><td>45.000đ/tài khoản</td><td>70.000đ/tài khoản</td></tr>
              <tr><td>Nhiều hơn 100 tài khoản</td><td>15.000đ/tài khoản</td><td>25.000đ/tài khoản</td><td>40.000đ/tài khoản</td></tr>
            </tbody>
          </table>
        </div>

        <h2 className="group-title">Gia hạn theo nhóm</h2>
        <p className="group-sub">Áp dụng khi gia hạn cho nhóm tài khoản đã đăng ký trước đó.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nhóm tài khoản</th><th>1 năm</th><th>2 năm</th></tr>
            </thead>
            <tbody>
              <tr><td>2–10 tài khoản</td><td>30.000đ/tài khoản</td><td>60.000đ/tài khoản</td></tr>
              <tr><td>11–50 tài khoản</td><td>25.000đ/tài khoản</td><td>45.000đ/tài khoản</td></tr>
              <tr><td>51–100 tài khoản</td><td>15.000đ/tài khoản</td><td>30.000đ/tài khoản</td></tr>
              <tr><td>Nhiều hơn 100 tài khoản</td><td>10.000đ/tài khoản</td><td>15.000đ/tài khoản</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-[0.82em] text-[--muted] mt-4 italic">
          * Để đăng ký theo nhóm hoặc gói miễn phí, vui lòng liên hệ qua <Link href="https://www.facebook.com/huytutor" target="_blank" className="text-[--red] font-bold">Fanpage Huy Tutor - Tài Liệu Tiếng Anh</Link>.
        </p>
      </div>

      <div className="py-12 border-t border-[--border] text-center">
        <Link href="/" className="text-brand font-bold hover:underline">← Quay lại trang chủ</Link>
      </div>
    </div>
  );
}
