import React from 'react';
import { Link } from 'react-router-dom';

export const HeaderFooterDemoPage: React.FC = () => {
  return (
    <main className="max-w-[920px] mx-auto px-4 py-10 space-y-8">
      <div className="border border-dashed border-gray-300 rounded-md p-6 bg-gray-50/50 text-center space-y-2">
        <span className="inline-block bg-[#e60049] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-sm uppercase">
          Chuẩn giao diện Header &amp; Footer Huy Tutor (huytutor.edu.vn)
        </span>
        <h1 className="text-lg font-extrabold text-[#e60049]">
          Điều khoản sử dụng, Chính sách bảo mật &amp; Chính sách thanh toán
        </h1>
        <p className="text-xs text-gray-600 max-w-xl mx-auto leading-relaxed">
          Quy định chi tiết về điều khoản cung cấp dịch vụ, bảo mật thông tin và thanh toán
          dành cho quý khách hàng tại hệ thống website Huy Tutor.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs text-gray-700 leading-relaxed">
        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-2">
          <h2 className="font-extrabold text-[#e60049] uppercase">1. Điều khoản sử dụng</h2>
          <p>
            Tài liệu học tập và giảng dạy tại huytutor.edu.vn thuộc bản quyền của Hộ Kinh Doanh Huy
            Crecom. Tài liệu đọc thử trên website được gắn lớp bảo vệ Watermark chéo nhằm chống sao
            chép trái phép.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-2">
          <h2 className="font-extrabold text-[#e60049] uppercase">2. Chính sách bảo mật</h2>
          <p>
            Thông tin Họ tên, Số điện thoại và địa chỉ Gmail xác thực 2 lớp của Quý Thầy/Cô và học
            sinh chỉ được sử dụng cho mục đích cấp quyền truy cập tài liệu tự động qua Google Drive
            và hệ thống Flashcard.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-md p-4 space-y-2">
          <h2 className="font-extrabold text-[#e60049] uppercase">3. Chính sách thanh toán</h2>
          <p>
            Hệ thống tự động nhận diện IP Việt Nam để hiển thị mã VietQR (SePay) và IP Quốc tế để
            hiển thị cổng thanh toán PayPal (USD). Ngay sau khi thanh toán thành công, hệ thống tự
            động đồng bộ 14 trường vào Google Form nội bộ để cấp quyền.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/"
          className="inline-block bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-6 py-2 rounded-sm transition"
        >
          Quay về Trang chủ
        </Link>
      </div>
    </main>
  );
};

