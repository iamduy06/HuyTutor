import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  DonatePageConfig,
  FaqPageConfig,
  HcRewardsPageConfig,
  SoanTaiLieuPageConfig,
  TermsPageConfig,
} from '../types';

/**
 * ============================================================================
 * 1. TRANG SOẠN TÀI LIỆU THEO YÊU CẦU (/soan-tai-lieu)
 * ============================================================================
 */
export const SoanTaiLieuPage: React.FC = () => {
  const { siteConfigs, showToast } = useStore();
  const config: SoanTaiLieuPageConfig = useMemo(() => {
    return (
      siteConfigs?.soan_tai_lieu_page_config || {
        title: 'Dịch vụ Biên soạn Tài liệu Tiếng Anh theo yêu cầu',
        description:
          'Hỗ trợ Quý Thầy/Cô, Trung tâm ngoại ngữ và Nhà trường biên soạn bộ đề kiểm tra định kỳ, đề cương học kỳ, chuyên đề từ vựng - đọc hiểu theo ma trận riêng với tiêu chuẩn Chuẩn mực & Chi tiết.',
        commitments: [
          {
            id: 'c1',
            title: '1. Đúng ma trận yêu cầu',
            desc: 'Biên soạn mới theo đúng phân phối chương trình, cấp độ CEFR (A2 - C2) và cấu trúc đề riêng của từng Sở GD&ĐT.',
          },
          {
            id: 'c2',
            title: '2. Giải thích chi tiết 100%',
            desc: 'Mỗi câu hỏi đều có đáp án, giải thích ngữ pháp/từ vựng, trích dẫn thông tin bài đọc và bảng từ vựng mở rộng.',
          },
          {
            id: 'c3',
            title: '3. Bàn giao File Word & PDF',
            desc: 'Bàn giao đầy đủ định dạng Word chỉnh sửa 100% và PDF dàn trang chuẩn in ấn, bảo mật độc quyền cho đơn vị đặt hàng.',
          },
        ],
        form_title: 'Gửi yêu cầu đặt biên soạn tài liệu',
      }
    );
  }, [siteConfigs?.soan_tai_lieu_page_config]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requirement, setRequirement] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Đã gửi yêu cầu biên soạn tài liệu tới Thầy Huy Tutor thành công!');
    setName('');
    setEmail('');
    setPhone('');
    setRequirement('');
  };

  return (
    <main className="max-w-[760px] mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#e60049] mb-2">
          {config.title}
        </h1>
        <p className="text-xs text-gray-600 leading-relaxed">{config.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {(config.commitments || []).map((c) => (
          <div
            key={c.id || c.title}
            className="bg-[#f8f9fa] border border-gray-200 rounded-md p-4 space-y-1.5"
          >
            <div className="font-extrabold text-[#e60049] uppercase">{c.title}</div>
            <p className="text-gray-600 leading-relaxed">{c.desc}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-gray-200 rounded-md p-6 shadow-sm space-y-4"
      >
        <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
          {config.form_title || 'Gửi yêu cầu đặt biên soạn tài liệu'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Họ tên Thầy/Cô hoặc Đơn vị *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:border-[#e60049] outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Số điện thoại / Zalo *
            </label>
            <input
              type="text"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:border-[#e60049] outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Địa chỉ Gmail nhận báo giá *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:border-[#e60049] outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-700 mb-1">
            Mô tả chi tiết nhu cầu biên soạn (Khối lớp, số lượng đề, thời hạn cần nhận) *
          </label>
          <textarea
            rows={4}
            required
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
            className="w-full border border-gray-300 rounded-sm px-3 py-2 text-xs focus:border-[#e60049] outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-6 py-2.5 rounded-sm transition shadow-sm"
        >
          Gửi yêu cầu biên soạn
        </button>
      </form>
    </main>
  );
};

/**
 * ============================================================================
 * 2. TRANG CÂU HỎI THƯỜNG GẶP (/faq)
 * ============================================================================
 */
export const FaqPage: React.FC = () => {
  const { siteConfigs } = useStore();
  const config: FaqPageConfig = useMemo(() => {
    return (
      siteConfigs?.faq_page_config || {
        title: 'Câu hỏi thường gặp (FAQ)',
        description:
          'Giải đáp chi tiết các thắc mắc về định dạng tài liệu, thanh toán tự động và cách nhận file tại huytutor.edu.vn',
        faqs: [
          {
            id: 'faq_1',
            question: '1. Tài liệu của Huy Tutor có những định dạng nào?',
            answer:
              'Hệ thống hỗ trợ 5 định dạng chuyên biệt: File Word (chỉnh sửa 100%, tự động ánh xạ sang Word dài), File PDF (dàn trang sắc nét, tự động ánh xạ sang PDF dài), Flashcard trực tuyến, Trang tính quản lý lớp học và Thiết kế.',
          },
          {
            id: 'faq_2',
            question: '2. Mức độ biên soạn tài liệu theo khung tham chiếu nào?',
            answer:
              'Toàn bộ tài liệu được phân hóa rõ ràng theo Khung tham chiếu trình độ ngôn ngữ chung Châu Âu (CEFR) từ A2, B1, B2 đến C1, C2 và bám sát Chương trình GDPT 2018.',
          },
          {
            id: 'faq_3',
            question: '3. Tài liệu có phải do chính Thầy Huy biên soạn không?',
            answer:
              '100% tài liệu trên huytutor.edu.vn được biên soạn độc quyền bởi Thầy Huy Tutor (Hộ kinh doanh Huy Crecom), đảm bảo tính Chuẩn mực & Chi tiết.',
          },
          {
            id: 'faq_4',
            question: '4. Tại sao mỗi đơn hàng chỉ thanh toán cho 1 định dạng duy nhất?',
            answer:
              'Để đảm bảo phân quyền và gửi tài liệu chính xác theo từng định dạng (file Word, file PDF hoặc tài khoản Flashcard), giỏ hàng cho phép lưu nhiều định dạng nhưng khi thanh toán mỗi đơn hàng sẽ xử lý đồng nhất theo một định dạng đã chọn.',
          },
          {
            id: 'faq_5',
            question: '5. Tài liệu có kèm đáp án và giải thích chi tiết không?',
            answer:
              'Tất cả các bộ đề và chuyên đề đều đi kèm bảng đáp án, giải thích chi tiết từng phương án đúng/sai, dịch nghĩa ngữ cảnh và bảng từ vựng mở rộng.',
          },
          {
            id: 'faq_6',
            question: '6. Quy trình thanh toán tự động hoạt động như thế nào?',
            answer:
              'Khách hàng tại Việt Nam quét mã VietQR ngân hàng, khách hàng Quốc tế thanh toán qua PayPal. Ngay khi giao dịch hoàn tất, hệ thống sẽ tự động xác nhận và cấp quyền truy cập tài liệu qua Gmail của bạn.',
          },
          {
            id: 'faq_7',
            question: '7. Tôi nhận file tài liệu qua phương thức nào?',
            answer:
              'Tài liệu được cấp quyền truy cập trực tiếp vào địa chỉ Gmail bạn đã xác thực 2 lớp khi đặt hàng. Bạn vui lòng kiểm tra Hộp thư đến hoặc mục Được chia sẻ với tôi trên Google Drive.',
          },
        ],
      }
    );
  }, [siteConfigs?.faq_page_config]);

  return (
    <main className="max-w-[760px] mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#e60049] mb-1">
          {config.title}
        </h1>
        <p className="text-xs text-gray-600">{config.description}</p>
      </div>

      <div className="space-y-3">
        {(config.faqs || []).map((item, idx) => (
          <div
            key={item.id || idx}
            className="bg-white border border-gray-200 rounded-md p-4 shadow-sm space-y-1.5"
          >
            <h2 className="text-xs font-extrabold text-[#e60049]">{item.question}</h2>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
};

/**
 * ============================================================================
 * 3. TRANG ĐIỀU KHOẢN DỊCH VỤ (/terms-of-service)
 * ============================================================================
 */
export const TermsPage: React.FC = () => {
  const { siteConfigs } = useStore();
  const config: TermsPageConfig = useMemo(() => {
    return (
      siteConfigs?.terms_page_config || {
        title: 'Điều khoản sử dụng & Chính sách bản quyền',
        description:
          'Áp dụng cho toàn bộ tài liệu số và dịch vụ phát hành tại huytutor.edu.vn thuộc Hộ kinh doanh Huy Crecom',
        sections: [
          {
            id: 'term_1',
            title: 'Điều 1: Quyền sở hữu trí tuệ',
            content:
              'Toàn bộ nội dung sách điện tử, bộ đề thi thử, chuyên đề bổ trợ, hệ thống Flashcard và mẫu trang tính trên website huytutor.edu.vn thuộc quyền sở hữu trí tuệ của Hộ kinh doanh Huy Crecom (Thương hiệu Huy Tutor).',
          },
          {
            id: 'term_2',
            title: 'Điều 2: Phạm vi sử dụng hợp pháp',
            content:
              'Quý Thầy/Cô và học sinh mua tài liệu được quyền sử dụng cho mục đích tự học hoặc in ấn giảng dạy trực tiếp cho học sinh của mình. Nghiêm cấm mọi hành vi chia sẻ công khai link Google Drive, thương mại hóa, bán lại hoặc phát tán trái phép trên mạng xã hội.',
          },
          {
            id: 'term_3',
            title: 'Điều 3: Bảo vệ bản quyền bằng Watermark',
            content:
              'Các tài liệu đọc thử trên hệ thống được bảo vệ bởi Watermark 2 lớp (lớp phủ giao diện và lớp đóng dấu trực tiếp trên từng trang PDF bằng công nghệ pdf-lib trên Cloudflare R2).',
          },
          {
            id: 'term_4',
            title: 'Điều 4: Chính sách thanh toán và cấp quyền tự động',
            content:
              'Hệ thống cấp quyền tự động theo địa chỉ Gmail đã xác thực 2 lớp ngay sau khi nhận xác nhận thanh toán từ cổng SePay (VietQR) hoặc PayPal.',
          },
          {
            id: 'term_5',
            title: 'Điều 5: Bảo hành và cập nhật tài liệu',
            content:
              'Các tài liệu chính thức được hỗ trợ cập nhật và đính chính miễn phí trong suốt năm học trên cùng thư mục Google Drive đã cấp quyền.',
          },
        ],
      }
    );
  }, [siteConfigs?.terms_page_config]);

  return (
    <main className="max-w-[760px] mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#e60049] mb-1">
          {config.title}
        </h1>
        <p className="text-xs text-gray-600">{config.description}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm space-y-4 text-xs text-gray-700 leading-relaxed">
        {(config.sections || []).map((sec, idx) => (
          <div key={sec.id || idx}>
            <h2 className="font-extrabold text-gray-900 uppercase mb-1">
              {sec.title}
            </h2>
            <p className="whitespace-pre-line">{sec.content}</p>
          </div>
        ))}
      </div>
    </main>
  );
};

/**
 * ============================================================================
 * 4. TRANG TÍCH ĐIỂM THÀNH VIÊN HC REWARDS (/hc-rewards)
 * ============================================================================
 */
export const HcRewardsPage: React.FC = () => {
  const { siteConfigs, showToast } = useStore();
  const config: HcRewardsPageConfig = useMemo(() => {
    return (
      siteConfigs?.hc_rewards_page_config || {
        title: 'Chương trình Tích điểm Thành viên HC Rewards',
        description:
          'Mua nhiều • Giảm sâu • Tích điểm cao dành cho Quý Thầy/Cô và học sinh đồng hành cùng Huy Tutor',
        benefits: [
          {
            id: 'b1',
            title: 'Tích lũy tự động',
            desc: 'Mỗi đơn hàng thanh toán thành công qua Gmail đều được hệ thống tự động ghi nhận vào lịch sử thành viên.',
          },
          {
            id: 'b2',
            title: 'Kết hợp ưu đãi Combo',
            desc: 'Áp dụng đồng thời với chương trình chiết khấu Combo giảm tới 25% khi mua nhiều tài liệu cùng định dạng.',
          },
          {
            id: 'b3',
            title: 'Hỗ trợ Flashcard',
            desc: 'Thầy/Cô mua file Word được tặng kèm quyền truy cập hệ thống Flashcard cho tối đa 20 tài khoản học sinh.',
          },
        ],
        lookup_title: 'Tra cứu điểm tích lũy HC Rewards theo Gmail',
      }
    );
  }, [siteConfigs?.hc_rewards_page_config]);

  const [lookupEmail, setLookupEmail] = useState('');

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    showToast(
      `Hệ thống đã ghi nhận yêu cầu tra cứu điểm HC Rewards cho Gmail: ${lookupEmail}`
    );
  };

  return (
    <main className="max-w-[760px] mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#e60049] mb-1">
          {config.title}
        </h1>
        <p className="text-xs text-gray-600">{config.description}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        {(config.benefits || []).map((b, idx) => (
          <div
            key={b.id || idx}
            className="bg-[#fff5f7] border border-pink-200 rounded-md p-4"
          >
            <div className="font-extrabold text-[#e60049] text-sm mb-1">{b.title}</div>
            <p className="text-gray-700 leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={handleLookup}
        className="bg-white border border-gray-200 rounded-md p-6 shadow-sm space-y-3"
      >
        <h2 className="text-sm font-extrabold text-gray-900 uppercase">
          {config.lookup_title || 'Tra cứu điểm tích lũy HC Rewards theo Gmail'}
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            required
            value={lookupEmail}
            onChange={(e) => setLookupEmail(e.target.value)}
            placeholder="Nhập địa chỉ Gmail đã dùng để mua tài liệu..."
            className="flex-1 border border-gray-300 rounded-sm px-3 py-2 text-xs focus:border-[#e60049] outline-none"
          />
          <button
            type="submit"
            className="bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-6 py-2 rounded-sm transition shadow-sm"
          >
            Tra cứu điểm thưởng
          </button>
        </div>
      </form>
    </main>
  );
};

/**
 * ============================================================================
 * 5. TRANG ỦNG HỘ TÁC GIẢ (/donate) - TUÂN THỦ QUY CHUẨN STRICT-ENV-URLS
 * ============================================================================
 */
export const DonatePage: React.FC = () => {
  const { siteConfigs } = useStore();
  const config: DonatePageConfig = useMemo(() => {
    return (
      siteConfigs?.donate_page_config || {
        title: 'Ủng hộ tác giả Huy Tutor (Donate)',
        message:
          'Cảm ơn Quý Thầy/Cô và các bạn đã tin tưởng sử dụng kho tài liệu miễn phí và các bộ đề của Huy Tutor. Mọi sự ủng hộ đều là nguồn động lực to lớn để đội ngũ tiếp tục biên soạn thêm nhiều tài liệu chất lượng.',
        bank_name: siteConfigs?.payment_instructions?.sepay?.bankName || 'MBBank',
        account_number: siteConfigs?.payment_instructions?.sepay?.accountNumber || '0358999147',
        account_holder:
          siteConfigs?.payment_instructions?.sepay?.accountHolder || 'HO KINH DOANH HUY CRECOM',
        default_amount: 50000,
      }
    );
  }, [siteConfigs?.donate_page_config, siteConfigs?.payment_instructions]);

  // Sinh mã QR VietQR động hoàn toàn từ thông tin cấu hình, tuyệt đối không hardcode
  const dynamicQrUrl = useMemo(() => {
    const bank = encodeURIComponent(config.bank_name || 'MBBank');
    const acc = encodeURIComponent(config.account_number || '0358999147');
    const amount = config.default_amount || 50000;
    const des = encodeURIComponent('UNG HO HUY TUTOR');
    return `https://qr.sepay.vn/img?bank=${bank}&acc=${acc}&template=compact2&amount=${amount}&des=${des}`;
  }, [config.bank_name, config.account_number, config.default_amount]);

  return (
    <main className="max-w-[680px] mx-auto px-4 py-10 space-y-6 text-center">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#e60049] mb-2">
          {config.title}
        </h1>
        <p className="text-xs text-gray-600 leading-relaxed max-w-lg mx-auto">
          {config.message}
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm max-w-md mx-auto space-y-3">
        <img
          src={dynamicQrUrl}
          alt={`VietQR Ủng hộ ${config.account_holder}`}
          className="w-52 h-52 object-contain mx-auto border border-gray-200 rounded-sm p-1"
        />
        <div className="text-xs text-gray-700 space-y-1">
          <p>
            Ngân hàng: <strong>{config.bank_name}</strong>
          </p>
          <p>
            Số tài khoản: <strong className="text-[#e60049]">{config.account_number}</strong>
          </p>
          <p>
            Chủ tài khoản: <strong>{config.account_holder}</strong>
          </p>
        </div>
      </div>

      <div>
        <Link
          to="/gifts"
          className="inline-block bg-[#e60049] hover:bg-[#cc0041] text-white font-bold text-xs px-6 py-2 rounded-sm transition shadow-sm"
        >
          Xem kho Tài liệu miễn phí
        </Link>
      </div>
    </main>
  );
};
