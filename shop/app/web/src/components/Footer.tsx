import React from 'react';
import { useStore } from '../context/StoreContext';
import { SmartLink } from './SmartLink';

export const Footer: React.FC = () => {
  const { siteConfigs } = useStore();

  const policyLinks = siteConfigs?.footer_policy_links?.filter((p) => p.is_active) || [
    { id: 'terms', label: 'Điều khoản sử dụng', url: '/terms-of-service', order_index: 1, is_active: true },
    { id: 'privacy', label: 'Chính sách bảo mật', url: '/privacy-policy', order_index: 2, is_active: true },
    { id: 'payment', label: 'Chính sách thanh toán & giao hàng', url: '/payment-delivery-policy', order_index: 3, is_active: true },
    { id: 'refund', label: 'Chính sách hoàn tiền', url: '/refund-policy', order_index: 4, is_active: true },
    { id: 'copyright', label: 'Chính sách bản quyền', url: '/copyright-policy', order_index: 5, is_active: true },
    { id: 'faq', label: 'Câu hỏi thường gặp (FAQ)', url: '/faq', order_index: 6, is_active: true },
    { id: 'donate', label: 'Ủng hộ tác giả (Donate)', url: '/donate', order_index: 7, is_active: true },
  ];

  const socialLinks = siteConfigs?.footer_social_links?.filter((s) => s.is_active) || [
    { id: 'facebook', platform: 'facebook', label: 'Facebook Huy Tutor', url: 'https://facebook.com', icon: 'f', is_active: true },
    { id: 'youtube', platform: 'youtube', label: 'YouTube Huy Tutor', url: 'https://youtube.com', icon: '▶', is_active: true },
  ];

  return (
    <footer className="mt-14">
      <div className="bg-[#fff0f3] py-10 px-4 border-t border-pink-100">
        <div className="max-w-[920px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Cột 1: Logo & Slogan (Cố định chuẩn nhận diện) */}
          <div className="md:col-span-3 flex flex-col items-start gap-1">
            <SmartLink to="/" aria-label="Huy Tutor Trang chủ">
              <img
                src="/logo.png"
                alt="Huy Tutor"
                className="h-8 w-auto object-contain"
              />
            </SmartLink>
            <div className="text-[10px] text-gray-500 font-medium">
              Chuẩn mực &amp; Chi tiết
            </div>
          </div>

          {/* Cột 2: Thông tin Hộ Kinh Doanh (Cố định chuẩn xác) */}
          <div className="md:col-span-5 text-[11px] text-gray-700 space-y-2 leading-relaxed">
            <p className="font-bold text-gray-900 uppercase">HỘ KINH DOANH HUY CRECOM</p>
            <p>Địa chỉ: Phường An Khánh, thành phố Hồ Chí Minh</p>
            <p>Zalo: 0358999147</p>
            <p>Email: huymdcc@gmail.com</p>
            <p>Hân hạnh được đồng hành lâu dài cùng Quý Thầy/Cô và các bạn!</p>
          </div>

          {/* Cột 3: Điều khoản & Mạng xã hội (Lấy động từ Bảng Cấu Hình site_configs) */}
          <div className="md:col-span-4 text-[11px] text-gray-700 space-y-2">
            {policyLinks.map((policy) => (
              <div key={policy.id || policy.url}>
                <SmartLink to={policy.url} className="hover:text-[#e60049] transition">
                  {policy.label}
                </SmartLink>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((social) => (
                <a
                  key={social.id || social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-[11px] font-bold hover:bg-[#e60049] transition"
                >
                  {social.icon || social.platform.charAt(0).toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Thanh bản quyền đỏ chuẩn mẫu (Cố định) */}
      <div className="bg-[#e60049] text-white text-center py-2.5 text-[11px] font-medium">
        © Bản quyền thuộc về Huy Tutor. Mọi quyền được bảo lưu.
      </div>
    </footer>
  );
};
