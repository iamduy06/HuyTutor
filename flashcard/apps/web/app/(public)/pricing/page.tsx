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
        {/* 6 MONTHS */}
        <div className="price-card">
          <div className="price-tier">Cá nhân</div>
          <div className="price-name">Gói 6 tháng</div>
          <div className="price-val">60.000<span>đ</span></div>
          <p className="text-[--muted] text-[0.82em] mb-5">1 tài khoản Gmail · 6 tháng truy cập</p>
          <hr className="price-divider" />
          <ul className="price-features">
            <li className="check">Trọn bộ flashcard tất cả chủ đề</li>
            <li className="check">296 collocations + 1000+ cụm từ</li>
            <li className="check">30+ Bộ Flashcard luyện tập</li>
            <li className="check">Nghe phát âm không giới hạn</li>
          </ul>
          <Link
            href="/register"
            target="_blank"
            className="btn-price outline"
          >
            Đăng ký gói này
          </Link>
        </div>

        {/* 1 YEAR */}
        <div className="price-card">
          <div className="price-tier">Cá nhân</div>
          <div className="price-name">Gói 1 năm</div>
          <div className="price-val">100.000<span>đ</span></div>
          <p className="text-[--muted] text-[0.82em] mb-5">1 tài khoản Gmail · 1 năm truy cập</p>
          <hr className="price-divider" />
          <ul className="price-features">
            <li className="check">Quyền lợi tương tự gói 6 tháng</li>
            <li className="check">Giá tiết kiệm hơn theo tháng</li>
            <li className="check">Đồng hành suốt năm học</li>
            <li className="check">Cập nhật nội dung mới liên tục</li>
          </ul>
          <Link
            href="/register"
            target="_blank"
            className="btn-price outline"
          >
            Đăng ký gói này
          </Link>
        </div>

        {/* 2 YEARS */}
        <div className="price-card featured">
          <div className="price-tier">Cá nhân</div>
          <div className="price-name">Gói 2 năm</div>
          <div className="price-val">150.000<span>đ</span></div>
          <p className="text-[--muted] text-[0.82em] mb-5">1 tài khoản Gmail · 2 năm truy cập</p>
          <hr className="price-divider" />
          <ul className="price-features">
            <li className="check">Tất cả quyền lợi gói 1 năm</li>
            <li className="check">Phù hợp học sinh THPT</li>
            <li className="check">Tiết kiệm 25% so với mua lẻ</li>
            <li className="check">Hỗ trợ kỹ thuật 24/7</li>
          </ul>
          <Link
            href="/register"
            target="_blank"
            className="btn-price solid"
          >
            Đăng ký gói này
          </Link>
        </div>

        {/* 3 YEARS */}
        <div className="price-card">
          <div className="price-tier">Cá nhân</div>
          <div className="price-name">Gói 3 năm</div>
          <div className="price-val">200.000<span>đ</span></div>
          <p className="text-[--muted] text-[0.82em] mb-5">1 tài khoản Gmail · 3 năm truy cập</p>
          <hr className="price-divider" />
          <ul className="price-features">
            <li className="check">Tất cả quyền lợi gói 2 năm</li>
            <li className="check">Giá trị nhất cho lộ trình dài hạn</li>
            <li className="check">Không lo gián đoạn ôn thi</li>
            <li className="check">Ưu tiên trải nghiệm tính năng mới</li>
          </ul>
          <Link
            href="/register"
            target="_blank"
            className="btn-price outline"
          >
            Đăng ký gói này
          </Link>
        </div>
      </div>

      {/* DETAILED TABLES */}
      <div className="group-section max-w-[1000px] mx-auto w-full">

        {/* SECTION A */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-[--red] mb-6 border-l-4 border-[--red] pl-4">A. SỬ DỤNG TOÀN BỘ HỆ THỐNG</h2>

          {/* I. ĐĂNG KÝ CÁ NHÂN */}
          <h3 className="group-title">I. ĐĂNG KÝ CÁ NHÂN (1 TÀI KHOẢN)</h3>
          <div className="table-wrap mb-10">
            <table>
              <thead>
                <tr><th>Thời hạn</th><th>Giá gốc</th><th>Phí gia hạn</th><th>Mỗi tháng</th></tr>
              </thead>
              <tbody>
                <tr><td>6 tháng</td><td>60.000 đ</td><td>48.000 đ</td><td className="font-bold">10.000 đ</td></tr>
                <tr><td>1 năm</td><td>100.000 đ</td><td>80.000 đ</td><td className="font-bold">8.333 đ</td></tr>
                <tr><td>2 năm</td><td>150.000 đ</td><td>120.000 đ</td><td className="font-bold">6.250 đ</td></tr>
                <tr><td>3 năm</td><td>200.000 đ</td><td>160.000 đ</td><td className="font-bold">5.555 đ</td></tr>
              </tbody>
            </table>
          </div>

          {/* II. ĐĂNG KÝ THEO NHÓM */}
          <h3 className="group-title">II. ĐĂNG KÝ THEO NHÓM (Lần đầu)</h3>
          <div className="table-wrap mb-10">
            <table>
              <thead>
                <tr><th>Quy mô nhóm</th><th>Gói 1 năm</th><th>Gói 2 năm</th><th>Gói 3 năm</th></tr>
              </thead>
              <tbody>
                <tr><td>Nhóm 2-10</td><td>90.000 đ</td><td>130.000 đ</td><td>175.000 đ</td></tr>
                <tr><td>Nhóm 11-50</td><td>80.000 đ</td><td>115.000 đ</td><td>155.000 đ</td></tr>
                <tr><td>Nhóm 51-100</td><td>70.000 đ</td><td>100.000 đ</td><td>135.000 đ</td></tr>
                <tr><td>Trên 100</td><td>55.000 đ</td><td>80.000 đ</td><td>105.000 đ</td></tr>
              </tbody>
            </table>
          </div>

          {/* III. GIA HẠN THEO NHÓM */}
          <h3 className="group-title">III. GIA HẠN THEO NHÓM</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Quy mô nhóm</th><th>Gói 1 năm</th><th>Gói 2 năm</th><th>Gói 3 năm</th></tr>
              </thead>
              <tbody>
                <tr><td>Nhóm 2-10</td><td>72.000 đ</td><td>104.000 đ</td><td>140.000 đ</td></tr>
                <tr><td>Nhóm 11-50</td><td>64.000 đ</td><td>92.000 đ</td><td>124.000 đ</td></tr>
                <tr><td>Nhóm 51-100</td><td>56.000 đ</td><td>80.000 đ</td><td>108.000 đ</td></tr>
                <tr><td>Trên 100</td><td>44.000 đ</td><td>64.000 đ</td><td>84.000 đ</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION B */}
        <div className="mb-12">
          <h2 className="text-2xl font-black text-[--red] mb-6 border-l-4 border-[--red] pl-4">B. SỬ DỤNG TƯƠNG ỨNG TÀI LIỆU ĐÃ MUA</h2>
          <p className="group-sub">Dành cho Thầy/Cô và học sinh đã sở hữu bộ tài liệu Word của Huy Tutor</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Quy mô nhóm</th><th>Gói 1 năm</th><th>Gói 2 năm</th><th>Gói 3 năm</th></tr>
              </thead>
              <tbody>
                <tr><td>Nhóm 1-20</td><td className="text-green-600 font-bold">Miễn phí</td><td>8.000 đ</td><td>12.000 đ</td></tr>
                <tr><td>Nhóm 21-100</td><td>5.000 đ</td><td>7.500 đ</td><td>10.000 đ</td></tr>
                <tr><td>Nhóm 101-200</td><td>4.000 đ</td><td>6.000 đ</td><td>8.000 đ</td></tr>
                <tr><td>Nhóm 201-500</td><td>3.000 đ</td><td>4.500 đ</td><td>6.000 đ</td></tr>
                <tr><td>Trên 500</td><td>2.000 đ</td><td>3.000 đ</td><td>4.000 đ</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-[0.82em] text-[--muted] mt-4 italic">
          * Để đăng ký theo nhóm hoặc gói miễn phí, vui lòng liên hệ qua <Link href={process.env.SUPPORT_URL ? process.env.SUPPORT_URL : "/register"} className="text-[--red] font-bold">Hỗ trợ Huy Tutor - Tài Liệu Tiếng Anh</Link>.
        </p>
      </div>

      <div className="py-12 border-t border-[--border] text-center">
        <Link href="/" className="text-brand font-bold hover:underline">← Quay lại trang chủ</Link>
      </div>
    </div>
  );
}
