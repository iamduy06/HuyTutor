import React from 'react';
import { Product } from '../types';

export const WatermarkViewer: React.FC<{ product: Product }> = ({ product }) => {
  if (product.preview_type === 'none') {
    return null;
  }

  const watermarkLabel =
    product.watermark_text || 'TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN';

  return (
    <section
      id="khu-vuc-doc-thu"
      onContextMenu={(e) => e.preventDefault()}
      className="select-none mb-10"
    >
      <div className="border-b-2 border-gray-800 pb-1.5 mb-5 flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#e60049] uppercase">
          Bản đọc thử
        </span>
        <span className="text-[10px] text-gray-500 font-medium">
          Bảo vệ bản quyền bởi Watermark Huy Tutor
        </span>
      </div>

      {/* CHẾ ĐỘ 1: HIỂN THỊ PDF TRỰC TIẾP KÈM LỚP PHỦ WATERMARK CHÉO */}
      {product.preview_type === 'pdf' && product.sample_pdf_url ? (
        <div className="relative bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
          {product.watermark_enabled && (
            <div className="watermark-pattern pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
              <span className="text-[#e60049]/15 font-extrabold text-lg uppercase -rotate-12 tracking-widest text-center px-4">
                {watermarkLabel}
              </span>
            </div>
          )}
          <iframe
            src={product.sample_pdf_url}
            title={`Đọc thử PDF - ${product.title}`}
            className="w-full h-[680px] border-0"
          />
        </div>
      ) : (
        /* CHẾ ĐỘ 2: HIỂN THỊ CÁC TRANG ẢNH ĐỌC THỬ DỌC CHUẨN MẪU SCREENSHOT 5 KÈM WATERMARK */
        <div className="space-y-6">
          {product.preview_images && product.preview_images.length > 0 ? (
            product.preview_images.map((imgUrl, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-md p-3 shadow-sm relative overflow-hidden"
              >
                {product.watermark_enabled && (
                  <div className="watermark-pattern pointer-events-none absolute inset-0 z-10" />
                )}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                  <span className="w-5 h-5 bg-[#e60049] text-white text-[10px] font-bold flex items-center justify-center rounded-sm">
                    {idx + 1}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    {product.title} • TRANG MẪU {idx + 1}
                  </span>
                </div>
                <img
                  src={imgUrl}
                  alt={`${product.title} - Trang đọc thử ${idx + 1}`}
                  className="w-full h-auto rounded-sm pointer-events-none"
                />
              </div>
            ))
          ) : (
            <>
              {/* Trang đọc thử mẫu 1: Đề thi / Nội dung */}
              <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm relative overflow-hidden">
                {product.watermark_enabled && (
                  <div className="watermark-pattern pointer-events-none absolute inset-0 z-10" />
                )}
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
                  <span className="w-5 h-5 bg-[#e60049] text-white text-[10px] font-bold flex items-center justify-center rounded-sm">
                    1
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    HUY TUTOR - CHUẨN MỰC &amp; CHI TIẾT • MÃ {product.code}
                  </span>
                </div>
                <div className="text-[11px] text-gray-700 leading-relaxed space-y-3 relative z-0">
                  <p className="font-bold text-gray-900 uppercase">
                    SECTION A: SAMPLE EXAM &amp; PRACTICE QUESTIONS ({product.title})
                  </p>
                  <p className="italic text-gray-600">
                    Read the following passage and mark the letter A, B, C, or D on your answer
                    sheet to indicate the option that best fits each of the numbered blanks.
                  </p>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-sm space-y-1.5">
                    <p>
                      Artificial Intelligence and personalized digital flashcard systems are
                      rapidly transforming how students prepare for national high school
                      examinations. Instead of memorizing isolated word lists, learners now engage
                      with <strong className="text-[#e60049]">(1) ___________</strong> collocations
                      and real-world contexts.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-medium text-gray-800">
                    <div>A. comprehensive</div>
                    <div>B. comprehensively</div>
                    <div>C. comprehend</div>
                    <div>D. comprehension</div>
                  </div>
                </div>
              </div>

              {/* Trang đọc thử mẫu 2: Bảng giải thích chi tiết */}
              <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm relative overflow-hidden">
                {product.watermark_enabled && (
                  <div className="watermark-pattern pointer-events-none absolute inset-0 z-10" />
                )}
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
                  <span className="w-5 h-5 bg-[#e60049] text-white text-[10px] font-bold flex items-center justify-center rounded-sm">
                    2
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    BẢNG TỪ VỰNG &amp; GIẢI THÍCH CHI TIẾT TỪNG ĐÁP ÁN
                  </span>
                </div>
                <div className="bg-[#e60049] text-white text-center py-2 px-3 rounded-sm mb-4">
                  <div className="text-[11px] font-extrabold uppercase">
                    ĐÁP ÁN VÀ GIẢI THÍCH CHI TIẾT - HUY TUTOR
                  </div>
                </div>
                <div className="text-[11px] text-gray-700 leading-relaxed space-y-2.5">
                  <p>
                    <strong className="text-[#e60049]">Câu 1 - Đáp án A (comprehensive):</strong>{' '}
                    Trước danh từ số nhiều <em>collocations</em> cần một tính từ bổ nghĩa.{' '}
                    <strong>Comprehensive (adj) /ˌkɒmprɪˈhensɪv/</strong>: toàn diện, đầy đủ, bao
                    quát.
                  </p>
                  <p>
                    <strong className="text-gray-900">Mở rộng cụm cố định (Collocations):</strong>{' '}
                    <em>a comprehensive guide / review / study</em> (một tài liệu hướng dẫn / ôn tập
                    toàn diện).
                  </p>
                </div>
              </div>

              {/* Trang đọc thử mẫu 3: Bảng từ vựng CEFR */}
              <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm relative overflow-hidden">
                {product.watermark_enabled && (
                  <div className="watermark-pattern pointer-events-none absolute inset-0 z-10" />
                )}
                <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
                  <span className="w-5 h-5 bg-[#e60049] text-white text-[10px] font-bold flex items-center justify-center rounded-sm">
                    3
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                    BẢNG TỪ VỰNG TRỌNG TÂM &amp; MỞ RỘNG (B1 - C2)
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-[#e60049] text-white font-bold">
                        <th className="border border-gray-300 p-1.5 text-left">STT</th>
                        <th className="border border-gray-300 p-1.5 text-left">Từ vựng / Cụm từ</th>
                        <th className="border border-gray-300 p-1.5 text-left">Phiên âm IPA</th>
                        <th className="border border-gray-300 p-1.5 text-left">Cấp độ</th>
                        <th className="border border-gray-300 p-1.5 text-left">Nghĩa tiếng Việt</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      <tr>
                        <td className="border border-gray-300 p-1.5">1</td>
                        <td className="border border-gray-300 p-1.5 font-bold">
                          groundbreaking (adj)
                        </td>
                        <td className="border border-gray-300 p-1.5">/ˈɡraʊndbreɪkɪŋ/</td>
                        <td className="border border-gray-300 p-1.5 font-bold text-[#e60049]">
                          C1
                        </td>
                        <td className="border border-gray-300 p-1.5">mang tính đột phá, tiên phong</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 p-1.5">2</td>
                        <td className="border border-gray-300 p-1.5 font-bold">
                          indispensable (adj)
                        </td>
                        <td className="border border-gray-300 p-1.5">/ˌɪndɪˈspensəbl/</td>
                        <td className="border border-gray-300 p-1.5 font-bold text-[#e60049]">
                          C1
                        </td>
                        <td className="border border-gray-300 p-1.5">không thể thiếu, thiết yếu</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-1.5">3</td>
                        <td className="border border-gray-300 p-1.5 font-bold">
                          keep pace with (idm)
                        </td>
                        <td className="border border-gray-300 p-1.5">/kiːp peɪs wɪð/</td>
                        <td className="border border-gray-300 p-1.5 font-bold text-gray-800">
                          B2
                        </td>
                        <td className="border border-gray-300 p-1.5">bắt kịp tốc độ với</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};
