import React from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';

export const HomePage: React.FC = () => {
  const { products, categories, isLoading } = useStore();

  const thptExamProducts = products.filter(
    (p) =>
      p.category_slug === 'high-school' &&
      !p.sub_section.toLowerCase().includes('global success') &&
      !p.sub_section.toLowerCase().includes('tiện ích')
  );

  const globalSuccessProducts = products.filter(
    (p) =>
      p.sub_section.toLowerCase().includes('global success') ||
      p.slug.includes('global-success')
  );

  const thcsProducts = products.filter((p) => p.category_slug === 'secondary-school');

  const utilityProducts = products.filter(
    (p) =>
      p.category_slug === 'flashcard' ||
      p.sub_section.toLowerCase().includes('tiện ích') ||
      p.slug.includes('flashcard') ||
      p.slug.includes('trang-tinh')
  );

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="hero-soft-bg pt-10 pb-8 border-b border-pink-50">
        <div className="max-w-[920px] mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7">
              <p className="text-[#e60049] font-bold text-sm mb-1">
                Thầy Huy biên soạn: Sách tài liệu tiếng Anh
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#e60049] tracking-tight mb-4">
                Chuẩn mực &amp; Chi tiết
              </h1>
              <ul className="space-y-1.5 text-xs sm:text-[13px] text-gray-700 font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-800" />
                  <span>Cập nhật cấu trúc đề thi mới nhất</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-800" />
                  <span>Giải thích chi tiết từng câu hỏi &amp; từng phương án</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-800" />
                  <span>Bổ sung bảng từ vựng mở rộng phong phú</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-800" />
                  <span>Hỗ trợ 2 định dạng chủ lực: File Word &amp; File PDF</span>
                </li>
              </ul>
            </div>

            <div className="md:col-span-5 flex justify-center">
              <div className="relative w-64 h-52 flex items-end justify-center">
                <div className="absolute top-6 left-0 bg-white border border-pink-200 shadow-sm px-2.5 py-1 rounded-sm text-[10px] font-bold text-[#e60049]">
                  CHUẨN MỰC
                </div>
                <div className="absolute top-4 right-0 bg-white border border-blue-200 shadow-sm px-2.5 py-1 rounded-sm text-[10px] font-bold text-blue-700">
                  CHI TIẾT
                </div>
                <div className="w-40 h-44 rounded-t-full bg-gradient-to-b from-pink-100 to-white border border-pink-200 flex flex-col items-center justify-end p-3 text-center">
                  <img
                    src="/favicon.png"
                    alt="Huy Tutor"
                    className="w-14 h-14 rounded-full object-contain mb-2 p-1 bg-white border border-[#e60049]/20 shadow-sm"
                  />
                  <span className="text-xs font-extrabold text-gray-800">Thầy Huy Tutor</span>
                  <span className="text-[10px] text-gray-500">Tác giả biên soạn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CONTAINER CHÍNH */}
      <main className="max-w-[920px] mx-auto px-4 py-8 space-y-12">
        {/* Banner Mới ra mắt: 90 đề thi thử (Chỉ hiện khi có sản phẩm trong DB) */}
        {products.length > 0 && (
          <section>
            <h2 className="text-[#e60049] font-bold text-sm mb-3">
              Mới ra mắt: 90 đề thi thử từ cơ bản đến nâng cao
            </h2>
            <Link
              to="/combo-thpt"
              className="block rounded-md overflow-hidden border border-amber-200 shadow-sm bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 p-6 sm:p-8 relative hover:opacity-95 transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-6 flex items-center justify-center gap-3">
                  <div className="book-3d w-24 h-32 rounded-sm bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700 p-2 text-white flex flex-col justify-between">
                    <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                    <div className="font-black text-[10px] leading-tight uppercase">
                      THỰC CHIẾN ĐỀ THI THPT
                    </div>
                    <span className="text-[7px] bg-white/20 px-1 py-0.5 rounded-sm w-fit">
                      B1-B2
                    </span>
                  </div>
                  <div className="book-3d w-24 h-34 rounded-sm bg-gradient-to-br from-amber-700 via-red-800 to-stone-900 p-2 text-white flex flex-col justify-between z-10 scale-105">
                    <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                    <div className="font-black text-[10px] leading-tight uppercase">
                      ĐỘT PHÁ ĐỀ THI THPT
                    </div>
                    <span className="text-[7px] bg-amber-400 text-black font-bold px-1 py-0.5 rounded-sm w-fit">
                      B2-C2
                    </span>
                  </div>
                  <div className="book-3d w-24 h-32 rounded-sm bg-gradient-to-br from-indigo-900 via-blue-800 to-emerald-600 p-2 text-white flex flex-col justify-between">
                    <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                    <div className="font-black text-[10px] leading-tight uppercase">
                      BỘ ĐỀ CHUẨN CẤU TRÚC
                    </div>
                    <span className="text-[7px] bg-white/20 px-1 py-0.5 rounded-sm w-fit">
                      B1-C1
                    </span>
                  </div>
                </div>
                <div className="md:col-span-6 text-center md:text-left">
                  <div className="inline-block text-[10px] font-bold text-[#e60049] uppercase tracking-wider mb-1">
                    HUY TUTOR
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-[#e60049] leading-tight">
                    Combo 90 ĐỀ THI THỬ
                  </div>
                  <div className="text-xs font-extrabold text-amber-900 uppercase mt-1">
                    KỲ THI TỐT NGHIỆP THPT MÔN TIẾNG ANH
                  </div>
                  <div className="inline-block mt-2 bg-sky-600 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-sm uppercase">
                    CƠ BẢN + NÂNG CAO
                  </div>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* Danh mục sản phẩm (Động 100% theo categories từ Database) */}
        {categories.length > 0 && (
          <section>
            <h2 className="text-[#e60049] font-bold text-sm mb-3">Danh mục sản phẩm</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {categories.map((cat, idx) => (
                <Link key={cat.id} to={`/${cat.slug}`} className="group text-center">
                  <div className="aspect-square rounded-md bg-gradient-to-br from-[#e60049] to-[#b30038] p-3 flex items-center justify-center shadow-sm group-hover:opacity-90 transition">
                    <div className="w-12 h-14 border-2 border-white/80 rounded-sm bg-white/15 flex items-center justify-center text-white font-black text-xs">
                      {idx + 1}
                    </div>
                  </div>
                  <span className="block text-[11px] font-bold text-gray-800 mt-1.5 group-hover:text-[#e60049] truncate">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tài liệu THPT (Lấy động 100% từ Backend API) */}
        <section>
          <h2 className="text-[#e60049] font-bold text-sm mb-4">Tài liệu THPT</h2>
          {isLoading ? (
            <div className="text-xs text-gray-500 py-8 text-center">
              Đang tải danh sách tài liệu...
            </div>
          ) : thptExamProducts.length === 0 ? (
            <div className="text-xs text-gray-500 py-8 text-center">
              Chưa có tài liệu nào trong danh mục này.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {thptExamProducts.slice(0, 9).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Thanh CTA Xem toàn bộ + Banner xanh CT GDPT 2018 (Chỉ hiện khi có sản phẩm) */}
          {thptExamProducts.length > 0 && (
            <div className="mt-8 space-y-3">
              <p className="text-[12px] font-bold text-[#e60049]">
                Không chỉ có các bộ đề chất lượng, thầy Huy còn biên soạn rất nhiều tài liệu bổ trợ
                khác như chuyên đề điền từ, cụm từ cố định, từ vựng SGK,...
              </p>
              <Link
                to="/high-school"
                className="block w-full bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-[12px] py-2 rounded-sm text-center transition"
              >
                Xem toàn bộ
              </Link>

              <Link
                to="/high-school"
                className="block rounded-md overflow-hidden border border-sky-200 shadow-sm bg-gradient-to-r from-sky-200 via-blue-100 to-sky-200 p-6 sm:p-8 hover:opacity-95 transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-5 flex items-center justify-center gap-4">
                    <div className="book-3d w-24 h-32 rounded-sm bg-gradient-to-br from-amber-700 via-red-800 to-stone-900 p-2 text-white flex flex-col justify-between">
                      <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                      <div className="font-black text-[10px] leading-tight uppercase">
                        ĐỘT PHÁ ĐỀ THI
                      </div>
                      <span className="text-[7px] bg-amber-400 text-black font-bold px-1 py-0.5 rounded-sm w-fit">
                        2026
                      </span>
                    </div>
                    <div className="book-3d w-24 h-32 rounded-sm bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700 p-2 text-white flex flex-col justify-between">
                      <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                      <div className="font-black text-[10px] leading-tight uppercase">
                        THỰC CHIẾN ĐỀ THI
                      </div>
                      <span className="text-[7px] bg-white/20 px-1 py-0.5 rounded-sm w-fit">
                        2026
                      </span>
                    </div>
                  </div>
                  <div className="md:col-span-7 text-center md:text-left">
                    <div className="text-[11px] font-extrabold text-[#e60049] uppercase">
                      HUY TUTOR
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-blue-900 uppercase mt-1">
                      TÀI LIỆU TIẾNG ANH
                    </div>
                    <div className="inline-block mt-1.5 bg-white text-[#e60049] font-extrabold text-xs px-4 py-1 rounded-sm shadow-sm">
                      CT GDPT 2018
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </section>

        {/* Tiện ích */}
        {utilityProducts.length > 0 && (
          <section>
            <h2 className="text-[#e60049] font-bold text-sm mb-4">Tiện ích</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {utilityProducts.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Từ vựng Global Success */}
        {globalSuccessProducts.length > 0 && (
          <section>
            <h2 className="text-[#e60049] font-bold text-sm mb-4">Từ vựng Global Success</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {globalSuccessProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* Cấp THCS */}
        {thcsProducts.length > 0 && (
          <section>
            <h2 className="text-[#e60049] font-bold text-sm mb-4">Cấp THCS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {thcsProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

