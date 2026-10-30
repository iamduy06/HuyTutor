import React from 'react';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';

export const ComboPage: React.FC = () => {
  const { products, addToCart, setIsCartOpen } = useStore();

  const threeLatestExams = products.filter(
    (p) =>
      p.slug.includes('dot-pha') ||
      p.slug.includes('chuan-cau-truc') ||
      p.slug.includes('thuc-chien')
  );

  const supportBooks = products.filter(
    (p) =>
      p.slug.includes('nen-tang') ||
      p.slug.includes('dien-tu') ||
      p.slug.includes('1400')
  );

  const globalSuccessBooks = products.filter(
    (p) =>
      p.sub_section.toLowerCase().includes('global success') ||
      p.slug.includes('global-success') ||
      p.slug.includes('tu-vung-tieng-anh-1')
  );

  const dgnlBooks = products.filter((p) => p.slug.includes('dgnl'));

  const handleSelectCombo = (booksToSelect: typeof products) => {
    const list = booksToSelect.length > 0 ? booksToSelect : products.slice(0, 3);
    for (const prod of list) {
      addToCart(prod, 'Word', 1);
    }
    setIsCartOpen(true);
  };

  return (
    <div>
      {/* 1. HERO BANNER COMBO 90 ĐỀ THI THỬ CHUẨN MẪU SCREENSHOT 3 */}
      <section className="max-w-[920px] mx-auto px-4 pt-8 pb-4 text-center">
        <h1 className="text-lg sm:text-xl font-extrabold text-[#e60049] mb-4">
          Mua nhiều. Giảm sâu. Tích điểm cao*.
        </h1>

        <div className="rounded-md overflow-hidden border border-amber-200 shadow-sm bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 p-6 sm:p-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-6 flex items-center justify-center gap-3">
              <div className="book-3d w-24 h-32 rounded-sm bg-gradient-to-br from-orange-500 via-pink-600 to-purple-700 p-2 text-white flex flex-col justify-between">
                <span className="text-[7px] font-bold uppercase opacity-90">HUY TUTOR</span>
                <div className="font-black text-[10px] leading-tight uppercase">
                  THỰC CHIẾN ĐỀ THI THPT
                </div>
                <span className="text-[7px] bg-white/20 px-1 py-0.5 rounded-sm w-fit">B1-B2</span>
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
                <span className="text-[7px] bg-white/20 px-1 py-0.5 rounded-sm w-fit">B1-C1</span>
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
                THI THPT MÔN TIẾNG ANH
              </div>
              <div className="inline-block mt-2 bg-sky-600 text-white text-[11px] font-extrabold px-3 py-0.5 rounded-sm uppercase">
                CƠ BẢN + NÂNG CAO
              </div>
            </div>
          </div>
        </div>

        <p className="text-sm font-extrabold text-[#e60049] mt-6">
          Giảm giá lên đến 25%.
        </p>
      </section>

      <main className="max-w-[920px] mx-auto px-4 py-6 space-y-10">
        {/* 2. 6 COMBO CARDS (ƯU ĐÃI CAO NHẤT) */}
        <section>
          <h2 className="text-[#e60049] font-bold text-sm mb-1">Ưu đãi cao nhất</h2>
          <p className="text-[11px] text-gray-600 mb-4">
            Sử dụng ưu đãi thành viên để được giảm thêm trên đơn hàng.{' '}
            <button
              type="button"
              onClick={() => handleSelectCombo(threeLatestExams)}
              className="text-[#e60049] underline font-bold"
            >
              Mua ngay
            </button>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                title: 'Trọn bộ tài liệu THPT + ĐGNL\n(& từ vựng chi tiết 10-11-12)',
                discount: 'GIẢM 25%',
                books: products.slice(0, 6),
              },
              {
                title: 'Trọn bộ tài liệu ôn thi THPT\n(& từ vựng chi tiết 10-11-12)',
                discount: 'GIẢM 25%',
                books: products.slice(0, 5),
              },
              {
                title: 'Trọn bộ tài liệu ôn thi THPT\n(không gồm từ vựng 10-11-12)',
                discount: 'GIẢM 24%',
                books: products.slice(0, 4),
              },
              {
                title: '5 TÀI LIỆU MỚI ÔN THI THPT',
                discount: 'GIẢM 20%',
                books: threeLatestExams,
              },
              {
                title: '3 BỘ ĐỀ MỚI ÔN THI THPT',
                discount: 'GIẢM 15%',
                books: threeLatestExams,
              },
              {
                title: 'TỪ VỰNG CHI TIẾT 10-11-12',
                discount: 'GIẢM 24%',
                books: globalSuccessBooks,
              },
            ].map((combo, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectCombo(combo.books)}
                className="bg-[#f8f9fa] border border-gray-200 rounded-md p-3.5 relative shadow-sm hover:border-[#e60049] transition cursor-pointer flex flex-col justify-between h-[165px]"
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-gray-500 font-semibold">File Word</span>
                  <span className="bg-[#e60049] text-white text-[9px] font-bold px-2 py-0.5 rounded-sm">
                    Combo
                  </span>
                </div>

                <div className="flex items-center justify-center gap-1.5 my-2">
                  <div className="w-8 h-11 bg-gradient-to-br from-orange-500 to-pink-600 rounded-sm shadow" />
                  <div className="w-8 h-11 bg-gradient-to-br from-amber-700 to-red-900 rounded-sm shadow" />
                  <div className="w-8 h-11 bg-gradient-to-br from-indigo-800 to-teal-600 rounded-sm shadow" />
                  <div className="w-8 h-11 bg-gradient-to-br from-emerald-700 to-teal-900 rounded-sm shadow" />
                </div>

                <div className="flex items-end justify-between gap-1 pt-1 border-t border-gray-200">
                  <div className="text-[9px] font-extrabold text-[#e60049] leading-tight whitespace-pre-line">
                    {combo.title}
                  </div>
                  <span className="bg-[#b30038] text-white text-[10px] font-black px-2 py-1 rounded-sm shrink-0">
                    {combo.discount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. DANH SÁCH TỪNG BỘ TÀI LIỆU THEO NHÓM CHUẨN MẪU SCREENSHOT 3 */}
        <section>
          <p className="text-[11px] text-gray-600 font-semibold mb-1">
            Xem chi tiết từng bộ tài liệu
          </p>
          <h2 className="text-[#e60049] font-bold text-sm mb-4">
            3 bộ đề mới nhất, bám sát form đề thi thật 2026
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {products.length === 0 ? (
              <div className="col-span-3 text-xs text-gray-500 py-6 text-center">
                Chưa có tài liệu nào trong danh mục này.
              </div>
            ) : (
              (threeLatestExams.length > 0 ? threeLatestExams : products.slice(0, 3)).map(
                (prod) => (
                  <ProductCard key={prod.id} product={prod} />
                )
              )
            )}
          </div>
        </section>

        {supportBooks.length > 0 && (
          <section>
            <h2 className="text-[#e60049] font-bold text-sm mb-4">
              Tài liệu từ vựng - ngữ pháp, củng cố kiến thức phần điền từ vào đoạn văn
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {supportBooks.slice(0, 3).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}

        {globalSuccessBooks.length > 0 && (
          <section>
            <h2 className="text-[#e60049] font-bold text-sm mb-4">
              Từ vựng chi tiết 10-11-12 kèm bài tập bổ trợ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {globalSuccessBooks.slice(0, 3).map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        )}

        {dgnlBooks.length > 0 && (
          <section>
            <h2 className="text-[#e60049] font-bold text-sm mb-4">Đề thi thử ĐGNL</h2>
            <div className="max-w-[290px] mx-auto">
              <ProductCard product={dgnlBooks[0]} />
            </div>
          </section>
        )}
      </main>

      {/* 4. BANNER MUA NGAY | GIẢM TỚI 25% CUỐI TRANG */}
      <section className="bg-gradient-to-b from-[#fff5f7] to-white py-10 px-4 text-center border-t border-pink-100 mt-8">
        <div className="max-w-[520px] mx-auto">
          <button
            type="button"
            onClick={() => handleSelectCombo(threeLatestExams)}
            className="inline-flex items-center overflow-hidden rounded-md shadow-md border border-[#e60049]"
          >
            <span className="bg-[#e60049] text-white font-extrabold text-base sm:text-lg px-7 py-3">
              Mua ngay
            </span>
            <span className="bg-gradient-to-r from-amber-300 to-yellow-400 text-[#e60049] font-black text-xs px-4 py-2 leading-tight">
              Giảm tới
              <br />
              <span className="text-lg">25%</span>
            </span>
          </button>
          <p className="text-[10px] text-gray-500 mt-4 leading-relaxed">
            * Điểm thành viên được tích lũy dựa trên số tiền thực tế thanh toán.
          </p>
        </div>
      </section>
    </div>
  );
};

