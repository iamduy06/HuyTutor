import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  DonatePageConfig,
  FaqPageConfig,
  HcRewardsPageConfig,
  SoanTaiLieuPageConfig,
  TermsPageConfig,
  PolicyPageConfig,
  CustomPagesConfig,
  CustomPageItem,
  CustomPageBlock,
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

/**
 * ============================================================================
 * CẤU HÌNH MẶC ĐỊNH CHO 4 CHÍNH SÁCH BẮT BUỘC
 * ============================================================================
 */
export const DEFAULT_PRIVACY_POLICY_CONFIG: PolicyPageConfig = {
  title: 'Chính sách bảo mật',
  description: '',
  last_updated: '',
  sections: [],
};

export const DEFAULT_PAYMENT_DELIVERY_POLICY_CONFIG: PolicyPageConfig = {
  title: 'Chính sách thanh toán và giao nhận tài liệu số',
  description:
    'Quy trình thanh toán trực tuyến tự động qua VietQR / PayPal và cơ chế bàn giao quyền truy cập tài liệu qua Gmail.',
  last_updated: 'Cập nhật ngày 01/01/2026',
  sections: [
    {
      id: 'pay_1',
      title: '1. Phương thức thanh toán được hỗ trợ',
      content:
        'Hệ thống hỗ trợ 2 hình thức thanh toán chính: (1) Chuyển khoản ngân hàng tự động qua SePay (quét mã VietQR nhận diện đơn hàng tức thì); (2) Thanh toán quốc tế qua PayPal dành cho Quý Thầy/Cô và học sinh ở nước ngoài.',
    },
    {
      id: 'pay_2',
      title: '2. Cơ chế phân phối và bàn giao tài liệu số',
      content:
        'Do đặc thù là sản phẩm số, hệ thống không giao hàng vật lý. Tài liệu định dạng Word và PDF được cấp quyền truy cập trực tiếp vào địa chỉ Gmail của khách hàng trên Google Drive. Đối với Flashcard, tài khoản học sinh được kích hoạt trực tiếp trên hệ thống Flashcard Huy Tutor.',
    },
    {
      id: 'pay_3',
      title: '3. Thời gian xử lý đơn hàng',
      content:
        'Hệ thống hoạt động tự động 24/7. Ngay sau khi cổng thanh toán ghi nhận giao dịch thành công (thông thường từ 30 giây đến 2 phút), hệ thống sẽ gửi email xác nhận và tự động cấp quyền truy cập vào Gmail của bạn.',
    },
    {
      id: 'pay_4',
      title: '4. Quy tắc 1 sản phẩm duy nhất cho tài liệu số',
      content:
        'Nhằm đảm bảo tính chính xác tuyệt đối khi phân quyền và gửi mã tải tài liệu qua Google Drive, giỏ hàng quy định mỗi đơn hàng phi-flashcard chỉ thanh toán cho 1 sản phẩm tài liệu với số lượng bằng 1.',
    },
    {
      id: 'pay_5',
      title: '5. Hỗ trợ kiểm tra và xử lý sự cố',
      content:
        'Nếu sau 15 phút kể từ khi chuyển khoản thành công bạn vẫn chưa nhận được quyền truy cập vào Google Drive (hoặc nhập nhầm địa chỉ Gmail khi thanh toán), vui lòng liên hệ ngay Zalo 0358999147 kèm mã đơn hàng để được hỗ trợ kích hoạt thủ công ngay lập tức.',
    },
  ],
};

export const DEFAULT_REFUND_POLICY_CONFIG: PolicyPageConfig = {
  title: 'Chính sách hoàn tiền & Đổi trả tài liệu',
  description:
    'Quy định chi tiết về các trường hợp bảo lưu, hoàn tiền và hỗ trợ kỹ thuật đối với sản phẩm số tại Huy Tutor.',
  last_updated: 'Cập nhật ngày 01/01/2026',
  sections: [
    {
      id: 'ref_1',
      title: '1. Nguyên tắc chung đối với sản phẩm số',
      content:
        'Do đặc thù sản phẩm số (File Word, File PDF, Thẻ Flashcard) có thể sao chép, tải về máy và lưu trữ ngay sau khi cấp quyền, Huy Tutor không áp dụng chính sách hoàn trả hoặc đổi ý không lý do sau khi hệ thống đã gửi link cấp quyền thành công vào Gmail của khách hàng.',
    },
    {
      id: 'ref_2',
      title: '2. Các trường hợp được giải quyết hoàn tiền 100%',
      content:
        'Khách hàng sẽ được hoàn lại 100% số tiền đã thanh toán trong các trường hợp: (1) Khách hàng thanh toán trùng lặp nhiều lần cho cùng một mã đơn hàng do lỗi hệ thống ngân hàng; (2) Tài liệu bị lỗi kỹ thuật nghiêm trọng (mất trang, lỗi font chữ) và đội ngũ kỹ thuật không thể khắc phục hoặc gửi bản thay thế trong vòng 24 giờ; (3) Hệ thống máy chủ gặp sự cố kéo dài trên 48 giờ không thể cấp quyền truy cập tài liệu.',
    },
    {
      id: 'ref_3',
      title: '3. Quy trình tiếp nhận và thời gian hoàn tiền',
      content:
        'Để yêu cầu hoàn tiền, Quý khách vui lòng gửi thông tin gồm: Mã đơn hàng, Ảnh chụp biên lai thanh toán và Lý do khiếu nại tới Zalo 0358999147 hoặc Email huymdcc@gmail.com. Đội ngũ Huy Tutor sẽ phản hồi trong vòng 4-8 giờ làm việc và thực hiện chuyển khoản hoàn tiền trong vòng 1-3 ngày làm việc.',
    },
    {
      id: 'ref_4',
      title: '4. Cam kết bảo hành và sửa lỗi tài liệu',
      content:
        'Mọi tài liệu chính thức đều được cam kết bảo hành chất lượng: Hỗ trợ chỉnh sửa miễn phí nếu phát hiện lỗi chính tả hoặc cập nhật bổ sung theo ma trận đề mới của Bộ Giáo dục & Đào tạo trong suốt năm học.',
    },
  ],
};

export const DEFAULT_COPYRIGHT_POLICY_CONFIG: PolicyPageConfig = {
  title: 'Chính sách bản quyền & Sở hữu trí tuệ',
  description:
    'Quy định pháp lý về bảo hộ quyền tác giả, nhãn hiệu và quy chế xử lý vi phạm bản quyền kho tài liệu Huy Tutor.',
  last_updated: 'Cập nhật ngày 01/01/2026',
  sections: [
    {
      id: 'cpr_1',
      title: '1. Tuyên bố quyền sở hữu trí tuệ độc quyền',
      content:
        'Toàn bộ tài liệu, giáo trình điện tử, bộ đề thi thử, bảng ma trận phân tích, hệ thống câu hỏi trắc nghiệm, lời giải chi tiết và giao diện đồ họa trên website huytutor.edu.vn thuộc quyền sở hữu trí tuệ duy nhất của Hộ kinh doanh Huy Crecom (Thương hiệu Huy Tutor).',
    },
    {
      id: 'cpr_2',
      title: '2. Quyền sử dụng hợp pháp của người mua',
      content:
        'Khách hàng mua tài liệu (Thầy/Cô và học sinh) được toàn quyền sử dụng tài liệu vào mục đích học tập cá nhân, nghiên cứu hoặc in ấn giảng dạy trực tiếp cho học sinh thuộc lớp học của chính mình.',
    },
    {
      id: 'cpr_3',
      title: '3. Các hành vi nghiêm cấm tuyệt đối',
      content:
        'Nghiêm cấm dưới mọi hình thức các hành vi: (1) Chia sẻ công khai thư mục Google Drive đã được cấp quyền lên mạng xã hội, hội nhóm; (2) Tải lại tài liệu để bán lại, phân phối lại hoặc kinh doanh thu phí; (3) Cung cấp tài khoản Flashcard cho người khác dùng chung ngoài số lượng thiết bị được phép.',
    },
    {
      id: 'cpr_4',
      title: '4. Cơ chế bảo vệ Watermark định danh 2 lớp',
      content:
        'Tất cả các bản đọc thử và tài liệu số phát hành đều được tích hợp công nghệ đóng dấu Watermark định danh 2 lớp (lớp bảo vệ giao diện và lớp nhúng trực tiếp vào cấu trúc trang PDF/Word trên Cloudflare R2). Mọi hành vi dùng công cụ bẻ khóa hoặc can thiệp xóa Watermark đều là hành vi vi phạm pháp luật sở hữu trí tuệ.',
    },
    {
      id: 'cpr_5',
      title: '5. Biện pháp xử lý vi phạm bản quyền',
      content:
        'Khi phát hiện hành vi vi phạm bản quyền, Huy Tutor có quyền đơn phương chấm dứt quyền truy cập toàn bộ tài liệu đã mua mà không hoàn tiền, khóa vĩnh viễn tài khoản người dùng và chuyển hồ sơ tới cơ quan quản lý nhà nước để xử lý theo Luật Sở hữu trí tuệ Việt Nam.',
    },
  ],
};

/**
 * ============================================================================
 * COMPONENT RENDERER TỔNG QUÁT CHO CÁC TRANG CHÍNH SÁCH
 * ============================================================================
 */
export const PolicyPageRenderer: React.FC<{ config: PolicyPageConfig }> = ({ config }) => {
  return (
    <main className="max-w-[800px] mx-auto px-4 py-10 space-y-8">
      {/* HEADER KHỐI */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-[#e60049] uppercase tracking-wide mb-2">
          {config.title}
        </h1>
        <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
          {config.description}
        </p>
        {config.last_updated && (
          <div className="mt-3 inline-block bg-pink-50 text-[#e60049] text-[10px] font-bold px-2 py-0.5 border border-pink-200 rounded-xs">
            {config.last_updated}
          </div>
        )}
      </div>

      {/* DANH SÁCH MỤC NỘI DUNG */}
      {(!config.sections || config.sections.length === 0) && (
        <div className="py-12 text-center text-xs text-gray-500 bg-gray-50 rounded-xs border border-dashed border-gray-300">
          Nội dung đang được quản trị viên cập nhật.
        </div>
      )}
      <div className="space-y-6">
        {(config.sections || []).map((sec, idx) => (
          <article
            key={sec.id || idx}
            className="bg-white border border-gray-200 p-5 shadow-xs space-y-2 rounded-xs"
          >
            <h2 className="text-sm font-extrabold text-[#e60049] tracking-tight">
              {sec.title}
            </h2>
            <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
              {sec.content}
            </div>
          </article>
        ))}
      </div>

      {/* FOOTER HỖ TRỢ CHUNG CỦA CHÍNH SÁCH */}
      <div className="bg-[#f8f9fa] border border-gray-200 p-4 rounded-xs text-xs text-gray-700 space-y-1 text-center">
        <p className="font-bold text-[#e60049] uppercase">
          HỘ KINH DOANH HUY CRECOM (HUY TUTOR)
        </p>
        <p>Địa chỉ: Phường An Khánh, thành phố Hồ Chí Minh | Zalo hỗ trợ: 0358999147</p>
        <p>Email: huymdcc@gmail.com | Website: huytutor.edu.vn</p>
      </div>
    </main>
  );
};

/**
 * ============================================================================
 * 6. TRANG CHÍNH SÁCH BẢO MẬT (/privacy-policy & /chinh-sach-bao-mat)
 * ============================================================================
 */
export const PrivacyPolicyPage: React.FC = () => {
  const { siteConfigs } = useStore();
  const config = useMemo<PolicyPageConfig>(() => {
    return siteConfigs?.privacy_policy_config || DEFAULT_PRIVACY_POLICY_CONFIG;
  }, [siteConfigs?.privacy_policy_config]);

  return <PolicyPageRenderer config={config} />;
};

/**
 * ============================================================================
 * 7. TRANG CHÍNH SÁCH THANH TOÁN & GIAO HÀNG (/payment-delivery-policy)
 * ============================================================================
 */
export const PaymentDeliveryPolicyPage: React.FC = () => {
  const { siteConfigs } = useStore();
  const config = useMemo<PolicyPageConfig>(() => {
    return siteConfigs?.payment_delivery_policy_config || DEFAULT_PAYMENT_DELIVERY_POLICY_CONFIG;
  }, [siteConfigs?.payment_delivery_policy_config]);

  return <PolicyPageRenderer config={config} />;
};

/**
 * ============================================================================
 * 8. TRANG CHÍNH SÁCH HOÀN TIỀN (/refund-policy & /chinh-sach-hoan-tien)
 * ============================================================================
 */
export const RefundPolicyPage: React.FC = () => {
  const { siteConfigs } = useStore();
  const config = useMemo<PolicyPageConfig>(() => {
    return siteConfigs?.refund_policy_config || DEFAULT_REFUND_POLICY_CONFIG;
  }, [siteConfigs?.refund_policy_config]);

  return <PolicyPageRenderer config={config} />;
};

/**
 * ============================================================================
 * 9. TRANG CHÍNH SÁCH BẢN QUYỀN (/copyright-policy & /chinh-sach-ban-quyen)
 * ============================================================================
 */
export const CopyrightPolicyPage: React.FC = () => {
  const { siteConfigs } = useStore();
  const config = useMemo<PolicyPageConfig>(() => {
    return siteConfigs?.copyright_policy_config || DEFAULT_COPYRIGHT_POLICY_CONFIG;
  }, [siteConfigs?.copyright_policy_config]);

  return <PolicyPageRenderer config={config} />;
};

/**
 * ============================================================================
 * 10. COMPONENT RENDERER TRANG TÙY BIẾN THEO KHỐI (CUSTOM DYNAMIC PAGE RENDERER)
 * ============================================================================
 */
export const CustomPageRenderer: React.FC<{ page: CustomPageItem }> = ({ page }) => {
  const [openAccordion, setOpenAccordion] = useState<Record<string, boolean>>({});

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <main className="max-w-[860px] mx-auto px-4 py-10 space-y-8">
      {/* HEADER TRANG */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-[#e60049] uppercase tracking-wide mb-2">
          {page.title}
        </h1>
        {page.meta_description && (
          <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
            {page.meta_description}
          </p>
        )}
      </div>

      {/* DANH SÁCH CÁC KHỐI ĐỘNG */}
      <div className="space-y-8">
        {(page.blocks || [])
          .filter((block) => block.is_active !== false)
          .map((block) => {
            switch (block.type) {
              case 'banner_hero':
                return (
                  <div
                    key={block.id}
                    className="relative bg-gradient-to-r from-pink-500 to-[#e60049] text-white p-6 sm:p-8 rounded-xs overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    {block.image_url && (
                      <div className="mb-4">
                        <img
                          src={block.image_url}
                          alt={block.title || 'Banner'}
                          className="w-full max-h-72 object-contain rounded-xs border border-white/20"
                        />
                      </div>
                    )}
                    <div className="relative z-10 space-y-2">
                      {block.title && (
                        <h2 className="text-lg sm:text-xl font-extrabold uppercase">
                          {block.title}
                        </h2>
                      )}
                      {block.subtitle && (
                        <p className="text-xs opacity-90 max-w-xl leading-relaxed">
                          {block.subtitle}
                        </p>
                      )}
                      {block.link_url && (
                        <div className="pt-2">
                          <Link
                            to={block.link_url}
                            className="inline-block bg-white text-[#e60049] hover:bg-pink-50 font-extrabold text-xs px-5 py-2 rounded-xs shadow-sm transition"
                          >
                            Xem chi tiết &rarr;
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );

              case 'rich_text':
                return (
                  <div
                    key={block.id}
                    className="bg-white border border-gray-200 p-5 rounded-xs shadow-xs space-y-3"
                  >
                    {block.title && (
                      <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
                        {block.title}
                      </h2>
                    )}
                    {block.subtitle && (
                      <p className="text-xs text-gray-500 font-medium">
                        {block.subtitle}
                      </p>
                    )}
                    {block.content && (
                      <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                        {block.content}
                      </div>
                    )}
                  </div>
                );

              case 'cards_grid':
                return (
                  <div key={block.id} className="space-y-3">
                    {block.title && (
                      <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
                        {block.title}
                      </h2>
                    )}
                    {block.subtitle && (
                      <p className="text-xs text-gray-500">{block.subtitle}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {(block.items || []).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="bg-[#fdfdfd] border border-gray-200 p-4 rounded-xs shadow-xs space-y-2 hover:border-[#e60049] transition"
                        >
                          {item.icon && (
                            <div className="text-base text-[#e60049] font-bold">
                              {item.icon}
                            </div>
                          )}
                          <div className="text-xs font-bold text-gray-900 uppercase">
                            {item.title}
                          </div>
                          {item.desc && (
                            <p className="text-[11px] text-gray-600 leading-relaxed">
                              {item.desc}
                            </p>
                          )}
                          {item.link && (
                            <Link
                              to={item.link}
                              className="inline-block text-[11px] font-bold text-[#e60049] hover:underline pt-1"
                            >
                              Khám phá &rarr;
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );

              case 'accordion_faq':
                return (
                  <div key={block.id} className="space-y-3">
                    {block.title && (
                      <h2 className="text-sm font-extrabold text-[#e60049] uppercase">
                        {block.title}
                      </h2>
                    )}
                    {block.subtitle && (
                      <p className="text-xs text-gray-500">{block.subtitle}</p>
                    )}
                    <div className="space-y-2">
                      {(block.items || []).map((item, idx) => {
                        const isOpen = openAccordion[item.id || String(idx)];
                        return (
                          <div
                            key={item.id || idx}
                            className="bg-white border border-gray-200 rounded-xs shadow-xs overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => toggleAccordion(item.id || String(idx))}
                              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-bold text-gray-800 hover:text-[#e60049] hover:bg-gray-50 transition"
                            >
                              <span>{item.title}</span>
                              <span className="text-[#e60049] font-mono text-sm ml-2">
                                {isOpen ? '−' : '+'}
                              </span>
                            </button>
                            {isOpen && item.desc && (
                              <div className="p-3.5 pt-0 text-xs text-gray-600 border-t border-gray-100 bg-gray-50/50 leading-relaxed whitespace-pre-line">
                                {item.desc}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );

              case 'cta_box':
                return (
                  <div
                    key={block.id}
                    className="bg-white border-2 border-[#e60049] p-6 rounded-xs shadow-xs text-center space-y-3"
                  >
                    {block.title && (
                      <h2 className="text-sm sm:text-base font-black text-[#e60049] uppercase">
                        {block.title}
                      </h2>
                    )}
                    {block.subtitle && (
                      <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                        {block.subtitle}
                      </p>
                    )}
                    {block.link_url && (
                      <div>
                        <Link
                          to={block.link_url}
                          className="inline-block bg-[#e60049] hover:bg-[#cc0041] text-white text-xs font-bold px-6 py-2 rounded-xs shadow-sm transition"
                        >
                          Hành động ngay &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                );

              case 'image_only':
                return (
                  <div
                    key={block.id}
                    className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs space-y-2 text-center"
                  >
                    {block.title && (
                      <h2 className="text-xs font-extrabold text-[#e60049] uppercase text-left mb-2">
                        {block.title}
                      </h2>
                    )}
                    {block.image_url ? (
                      block.link_url ? (
                        <Link to={block.link_url} className="block group">
                          <img
                            src={block.image_url}
                            alt={block.caption || block.title || 'Hình ảnh'}
                            className="w-full max-h-[500px] object-contain mx-auto rounded-xs border border-gray-200 group-hover:opacity-95 transition"
                          />
                        </Link>
                      ) : (
                        <img
                          src={block.image_url}
                          alt={block.caption || block.title || 'Hình ảnh'}
                          className="w-full max-h-[500px] object-contain mx-auto rounded-xs border border-gray-200"
                        />
                      )
                    ) : (
                      <div className="py-8 bg-gray-50 border border-dashed border-gray-300 text-xs text-gray-400">
                        Chưa có hình ảnh
                      </div>
                    )}
                    {block.caption && (
                      <p className="text-[11px] text-gray-500 italic mt-1">
                        {block.caption}
                      </p>
                    )}
                  </div>
                );

              default:
                return null;
            }
          })}
      </div>
    </main>
  );
};

/**
 * ============================================================================
 * 11. VIEW TRANG TÙY BIẾN CHO ROUTE PUBLIC (/p/:slug)
 * ============================================================================
 */
export const CustomDynamicPageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { siteConfigs } = useStore();

  const activePage = useMemo(() => {
    if (!slug || !siteConfigs?.custom_pages_config?.pages) return null;
    return siteConfigs.custom_pages_config.pages.find(
      (p) => p.slug.toLowerCase() === slug.toLowerCase() && p.is_active
    );
  }, [slug, siteConfigs?.custom_pages_config]);

  if (!activePage) {
    return (
      <main className="max-w-[600px] mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 mx-auto bg-pink-100 text-[#e60049] rounded-full flex items-center justify-center font-black text-lg">
          !
        </div>
        <h1 className="text-base font-extrabold text-gray-900 uppercase">
          Trang không tồn tại hoặc đã tạm dừng hoạt động
        </h1>
        <p className="text-xs text-gray-500">
          Đường dẫn URL "/p/{slug}" không tồn tại hoặc đã bị ẩn bởi quản trị viên.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-block bg-[#e60049] hover:bg-[#cc0041] text-white text-xs font-bold px-5 py-2 rounded-xs shadow-sm transition"
          >
            Quay về Trang chủ
          </Link>
        </div>
      </main>
    );
  }

  return <CustomPageRenderer page={activePage} />;
};
