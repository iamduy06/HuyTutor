import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-14">
      <div className="bg-[#fff0f3] py-10 px-4 border-t border-pink-100">
        <div className="max-w-[920px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Cột 1: Logo & Slogan */}
          <div className="md:col-span-3 flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#e60049] text-white flex items-center justify-center font-black text-xs shrink-0">
              HT
            </div>
            <div>
              <div className="font-black text-[#e60049] text-base leading-none uppercase">
                HUY TUTOR
              </div>
              <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                Chuẩn mực &amp; Chi tiết
              </div>
            </div>
          </div>

          {/* Cột 2: Thông tin Hộ Kinh Doanh */}
          <div className="md:col-span-5 text-[11px] text-gray-700 space-y-2 leading-relaxed">
            <p className="font-bold text-gray-900 uppercase">HỘ KINH DOANH HUY CRECOM</p>
            <p>Địa chỉ: Phường An Khánh, thành phố Hồ Chí Minh</p>
            <p>Zalo: 0358999147</p>
            <p>Email: huymdcc@gmail.com</p>
            <p>Hân hạnh được đồng hành lâu dài cùng Quý Thầy/Cô và các bạn!</p>
          </div>

          {/* Cột 3: Điều khoản & Mạng xã hội */}
          <div className="md:col-span-4 text-[11px] text-gray-700 space-y-2">
            <div>
              <Link to="/terms-of-service" className="hover:text-[#e60049] transition">
                Điều khoản sử dụng
              </Link>
            </div>
            <div>
              <Link to="/header-footer" className="hover:text-[#e60049] transition">
                Chính sách bảo mật
              </Link>
            </div>
            <div>
              <Link to="/faq" className="hover:text-[#e60049] transition">
                Chính sách thanh toán &amp; FAQ
              </Link>
            </div>
            <div>
              <Link to="/donate" className="hover:text-[#e60049] transition">
                Ủng hộ tác giả (Donate)
              </Link>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook Huy Tutor"
                className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold hover:bg-[#e60049] transition"
              >
                f
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="YouTube Huy Tutor"
                className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[10px] font-bold hover:bg-[#e60049] transition"
              >
                ▶
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh bản quyền đỏ chuẩn mẫu */}
      <div className="bg-[#e60049] text-white text-center py-2.5 text-[11px] font-medium">
        © Bản quyền thuộc về Huy Tutor. Mọi quyền được bảo lưu.
      </div>
    </footer>
  );
};
