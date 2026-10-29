import React from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';

export const FlashcardPage: React.FC = () => {
  const { products, buyNow } = useStore();

  const flashcardProduct: Product =
    products.find((p) => p.slug.includes('flashcard')) || {
      id: 'prod-flashcard-1',
      category_id: 'cat-flashcard',
      category_slug: 'flashcard',
      category_name: 'Flashcard',
      sub_section: 'Tiện ích',
      code: 'FC-ALL',
      title: 'Flashcard từ vựng - tổng hợp mọi tài liệu',
      slug: 'flashcard-tu-vung',
      google_form_product_name: 'Flashcard từ vựng - tổng hợp mọi tài liệu',
      badge_text: 'Mới',
      short_desc: 'Hệ thống Flashcard học từ vựng trực tuyến 4 chế độ luyện tập.',
      cover_tag: 'Học từ vựng\ncơ bản đến\nnâng cao',
      thumbnail_url: '',
      preview_type: 'images',
      sample_pdf_source: 'r2',
      sample_pdf_url: '',
      watermark_enabled: true,
      watermark_text: 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN',
      preview_images: [],
      specs: [],
      topics: [],
      features: [],
      is_featured: true,
      is_combo_eligible: false,
      is_active: true,
      formats: [{ format_code: 'Flashcard', price: 100000, is_active: true }],
    };

  const handleRegisterFlashcard = (priceOverride?: number, pkgTitle?: string) => {
    const customProd: Product = {
      ...flashcardProduct,
      title: pkgTitle || flashcardProduct.title,
      google_form_product_name: pkgTitle || flashcardProduct.google_form_product_name,
      formats: [
        {
          format_code: 'Flashcard',
          price: priceOverride || 100000,
          is_active: true,
        },
      ],
    };
    buyNow(customProd, 'Flashcard', 1);
  };

  return (
    <div>
      {/* 1. TIÊU ĐỀ & KHUNG VIDEO YOUTUBE CHUẨN MẪU SCREENSHOT 2 */}
      <section className="max-w-[760px] mx-auto px-4 pt-8 pb-8 text-center">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#e60049] mb-1">
          Flashcard Huy Tutor
        </h1>
        <p className="text-[11px] text-gray-600 font-medium mb-5">
          Chủ động - Mọi lúc - Mọi nơi
        </p>

        <div className="aspect-video w-full max-w-[520px] mx-auto rounded-sm overflow-hidden bg-gradient-to-br from-[#3b0014] via-[#7a0028] to-[#b3003b] relative flex flex-col items-center justify-center text-white shadow-md border border-gray-200">
          <div className="absolute top-3 left-3 flex items-center gap-2 text-left">
            <div className="w-6 h-6 rounded-full bg-[#e60049] text-white font-black text-[10px] flex items-center justify-center">
              HT
            </div>
            <div>
              <div className="text-[11px] font-bold leading-none">
                Học từ vựng hiệu quả cùng flashcard của Huy Tutor
              </div>
              <div className="text-[9px] text-white/75">Huy Tutor</div>
            </div>
          </div>

          <div className="text-6xl font-black leading-none mb-2">4</div>
          <div className="w-12 h-8 bg-[#ff0000] rounded-md flex items-center justify-center text-white text-sm font-bold shadow mb-2">
            ▶
          </div>
          <div className="text-lg sm:text-xl font-extrabold tracking-wide uppercase">
            CHẾ ĐỘ LUYỆN TẬP
          </div>

          <div className="absolute bottom-3 right-3 bg-black/75 text-white text-[10px] font-semibold px-2.5 py-1 rounded-sm">
            Watch on YouTube
          </div>
        </div>
      </section>

      {/* 2. BANNER ĐỎ FULL-WIDTH GIỚI THIỆU TÍNH NĂNG FLASHCARD */}
      <section className="bg-[#e60049] text-white py-9 px-4">
        <div className="max-w-[760px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 space-y-2.5">
            <div className="bg-white text-gray-800 rounded-sm p-3 shadow-md">
              <div className="text-center font-bold text-[#e60049] text-xs mb-2">Đề 1</div>
              <div className="border border-gray-200 rounded-sm p-6 text-center bg-gray-50">
                <div className="text-[#e60049] font-extrabold text-sm">groundbreaking</div>
                <div className="text-[10px] text-gray-500 mt-0.5">/ˈɡraʊndbreɪkɪŋ/</div>
                <div className="text-[10px] text-gray-600 mt-1">
                  mang tính đột phá, tiên phong (adj)
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRegisterFlashcard(100000, 'Flashcard Huy Tutor - Gói 1 Năm')}
              className="block w-full bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs py-2 rounded-sm text-center transition"
            >
              Trải nghiệm ngay
            </button>
          </div>

          <div className="md:col-span-6">
            <ul className="space-y-1.5 text-[11px] leading-relaxed font-medium">
              <li>• Giao diện hiện đại</li>
              <li>• Phân loại B1/B2/C1/C2 rõ ràng</li>
              <li>• Truy cập nhiều bài học nhanh chóng - không cần tải lại trang</li>
              <li>• Nghe phát âm của từ/cụm từ không giới hạn số lần</li>
              <li>• 4 chế độ luyện tập từ vựng</li>
              <li>
                • Dễ dàng chọn nhanh từ/cụm từ thông qua bảng chọn (không cần bấm thủ công từ đầu
                đến cuối)
              </li>
              <li>• Có tính năng nhập số thứ tự của thẻ để chuyển đến nhanh chóng</li>
              <li>• Bổ sung từ đồng nghĩa, trái nghĩa cho đa số từ đơn</li>
              <li>• Bổ sung ví dụ và bản dịch ví dụ để hiểu cách áp dụng từ/cụm từ đã học</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. GÓI MIỄN PHÍ & GÓI TRẢ PHÍ CHUẨN MẪU SCREENSHOT 2 */}
      <main className="max-w-[760px] mx-auto px-4 py-10 space-y-9">
        <section>
          <h2 className="text-[#e60049] font-extrabold text-sm mb-2">1. Gói miễn phí</h2>
          <div className="text-[11px] text-gray-700 leading-relaxed space-y-1.5">
            <p>
              <strong>Chỉ áp dụng cho quý Thầy/Cô và các bạn đã mua tài liệu của Huy Tutor</strong>{' '}
              <span className="text-[#e60049] font-bold">
                (cấp quyền truy cập tương ứng với tài liệu đã mua)
              </span>
              .
            </p>
            <p className="font-bold text-gray-800">Số lượng tài khoản:</p>
            <ul className="space-y-1 pl-3">
              <li>
                • 1 tài khoản Gmail chính (đã dùng để mua tài liệu) - không giới hạn thời gian truy
                cập.
              </li>
              <li>
                • Đối với Thầy/Cô đã mua file Word: được hỗ trợ miễn phí tối đa 20 tài khoản (để học
                sinh luyện tập). Từ tài khoản thứ 21, đăng ký với mức giá trên hệ thống Flashcard -
                thời gian truy cập là 1 năm (kể từ ngày hệ thống cấp quyền).
              </li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-[#e60049] font-extrabold text-sm mb-2">2. Gói trả phí</h2>
          <p className="text-[11px] text-gray-700 mb-5">
            <strong>Quyền lợi:</strong> Truy cập{' '}
            <span className="text-[#e60049] font-bold underline">trọn bộ</span> flashcard của các
            chủ đề từ vựng, cụm động từ, từ vựng của đề thi do Huy Tutor biên soạn và đề thi của các
            trường, sở.
          </p>

          {/* 4 Card Gói 6 Tháng / 1 Năm / 2 Năm / 3 Năm */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
            {[
              { label: 'GÓI 6 THÁNG', price: 60000, priceText: '60.000đ' },
              { label: 'GÓI 1 NĂM', price: 100000, priceText: '100.000đ' },
              { label: 'GÓI 2 NĂM', price: 150000, priceText: '150.000đ' },
              { label: 'GÓI 3 NĂM', price: 200000, priceText: '200.000đ' },
            ].map((pkg) => (
              <div
                key={pkg.label}
                onClick={() =>
                  handleRegisterFlashcard(pkg.price, `Flashcard Huy Tutor - ${pkg.label}`)
                }
                className="text-center cursor-pointer group"
              >
                <div className="bg-[#e60049] p-2.5 rounded-sm shadow-sm group-hover:opacity-95 transition">
                  <div className="bg-white rounded-sm p-3 h-32 flex flex-col justify-between items-center relative">
                    <span className="text-[8px] font-extrabold text-[#e60049] uppercase">
                      HUY TUTOR
                    </span>
                    <div className="w-20 h-12 bg-gradient-to-r from-[#e60049] to-pink-600 rounded-sm text-white text-[8px] font-bold flex items-center justify-center shadow">
                      Flashcard
                    </div>
                    <div className="w-full bg-[#b30038] text-white text-[9px] font-extrabold py-1 px-1.5 rounded-sm flex items-center justify-between">
                      <span>{pkg.label}</span>
                      <span className="text-[7px] font-normal opacity-90">
                        1 tài khoản cá nhân
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs font-extrabold text-[#e60049] mt-2">
                  {pkg.priceText}
                </div>
              </div>
            ))}
          </div>

          {/* Bảng giá theo quy mô nhóm */}
          <div className="max-w-[520px] mx-auto overflow-x-auto mb-5">
            <table className="w-full text-[11px] text-center border-collapse border border-[#e60049]/40">
              <thead>
                <tr className="bg-[#e60049] text-white font-bold">
                  <th className="border border-[#e60049]/30 py-1.5 px-2">Quy mô nhóm</th>
                  <th className="border border-[#e60049]/30 py-1.5 px-2">Gói 1 năm</th>
                  <th className="border border-[#e60049]/30 py-1.5 px-2">Gói 2 năm</th>
                  <th className="border border-[#e60049]/30 py-1.5 px-2">Gói 3 năm</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="bg-white">
                  <td className="border border-pink-200 py-1 px-2 text-left font-medium">
                    Cá nhân
                  </td>
                  <td className="border border-pink-200 py-1 px-2">100.000 đ</td>
                  <td className="border border-pink-200 py-1 px-2">150.000 đ</td>
                  <td className="border border-pink-200 py-1 px-2">200.000 đ</td>
                </tr>
                <tr className="bg-pink-50/40">
                  <td className="border border-pink-200 py-1 px-2 text-left font-medium">
                    Nhóm 2-10
                  </td>
                  <td className="border border-pink-200 py-1 px-2">72.000 đ/tài khoản</td>
                  <td className="border border-pink-200 py-1 px-2">104.000 đ/tài khoản</td>
                  <td className="border border-pink-200 py-1 px-2">140.000 đ/tài khoản</td>
                </tr>
                <tr className="bg-white">
                  <td className="border border-pink-200 py-1 px-2 text-left font-medium">
                    Nhóm 11-50
                  </td>
                  <td className="border border-pink-200 py-1 px-2">64.000 đ/tài khoản</td>
                  <td className="border border-pink-200 py-1 px-2">92.000 đ/tài khoản</td>
                  <td className="border border-pink-200 py-1 px-2">124.000 đ/tài khoản</td>
                </tr>
                <tr className="bg-pink-50/40">
                  <td className="border border-pink-200 py-1 px-2 text-left font-medium">
                    Nhóm 51-100
                  </td>
                  <td className="border border-pink-200 py-1 px-2">56.000 đ/tài khoản</td>
                  <td className="border border-pink-200 py-1 px-2">80.000 đ/tài khoản</td>
                  <td className="border border-pink-200 py-1 px-2">108.000 đ/tài khoản</td>
                </tr>
                <tr className="bg-white">
                  <td className="border border-pink-200 py-1 px-2 text-left font-medium">
                    Trên 100
                  </td>
                  <td className="border border-pink-200 py-1 px-2">44.000 đ/tài khoản</td>
                  <td className="border border-pink-200 py-1 px-2">64.000 đ/tài khoản</td>
                  <td className="border border-pink-200 py-1 px-2">84.000 đ/tài khoản</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="text-center mb-6">
            <button
              type="button"
              onClick={() =>
                handleRegisterFlashcard(100000, 'Flashcard từ vựng - tổng hợp mọi tài liệu')
              }
              className="inline-block bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-8 py-2 rounded-sm transition"
            >
              Đăng ký ngay 1 tài khoản
            </button>
          </div>

          <div className="text-[11px] text-gray-700 leading-relaxed space-y-4">
            <p>
              Thầy/Cô cần đăng ký trọn bộ hệ thống cho số lượng lớn học sinh vui lòng liên hệ về
              fanpage{' '}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="underline font-medium hover:text-[#e60049]"
              >
                Huy Tutor - Tài Liệu Tiếng Anh
              </a>{' '}
              hoặc địa chỉ email <span className="underline">huymdcc@gmail.com</span> để nhận báo
              giá cụ thể.
            </p>
            <hr className="border-gray-200" />
            <p>
              Sau khi đăng ký, Huy Tutor sẽ cấp quyền truy cập và thông báo qua email. Quý Thầy/Cô
              và các bạn vui lòng kiểm tra mục Hộp thư đến và cả mục Thư rác. Mọi thắc mắc vui lòng
              gửi về fanpage{' '}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="underline font-medium hover:text-[#e60049]"
              >
                Huy Tutor - Tài Liệu Tiếng Anh
              </a>{' '}
              hoặc địa chỉ email <span className="underline">huymdcc@gmail.com</span>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

