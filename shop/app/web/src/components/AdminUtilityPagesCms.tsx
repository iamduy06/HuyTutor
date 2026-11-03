import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  DonatePageConfig,
  FaqItem,
  FaqPageConfig,
  HcRewardBenefitItem,
  HcRewardsPageConfig,
  SoanTaiLieuCommitmentItem,
  SoanTaiLieuPageConfig,
  TermsPageConfig,
  TermsSectionItem,
} from '../types';

export const AdminUtilityPagesCms: React.FC = () => {
  const { siteConfigs, updateSiteConfig, showToast } = useStore();

  const [activeSubTab, setActiveSubTab] = useState<
    'terms' | 'faq' | 'rewards' | 'soan' | 'donate'
  >('terms');

  const [saving, setSaving] = useState(false);

  // 1. Terms state
  const [termsConfig, setTermsConfig] = useState<TermsPageConfig>(() => {
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
  });

  // 2. FAQ state
  const [faqConfig, setFaqConfig] = useState<FaqPageConfig>(() => {
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
  });

  // 3. HC Rewards state
  const [rewardsConfig, setRewardsConfig] = useState<HcRewardsPageConfig>(() => {
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
  });

  // 4. Soạn tài liệu state
  const [soanConfig, setSoanConfig] = useState<SoanTaiLieuPageConfig>(() => {
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
  });

  // 5. Donate state
  const [donateConfig, setDonateConfig] = useState<DonatePageConfig>(() => {
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
  });

  // Lưu toàn bộ cấu hình 5 trang tiện ích
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await updateSiteConfig('terms_page_config', termsConfig);
      await updateSiteConfig('faq_page_config', faqConfig);
      await updateSiteConfig('hc_rewards_page_config', rewardsConfig);
      await updateSiteConfig('soan_tai_lieu_page_config', soanConfig);
      await updateSiteConfig('donate_page_config', donateConfig);
      showToast('Đã lưu cấu hình 5 Trang Tiện ích thành công!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi lưu cấu hình tiện ích.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER CMS */}
      <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e60049] animate-pulse"></span>
            <h2 className="text-sm font-extrabold text-[#e60049] uppercase tracking-wide">
              Trình Quản Trị Phân Hệ Utility Pages (5 Trang Tiện Ích)
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Chỉnh sửa nội dung động, câu hỏi FAQ, chính sách điều khoản, tích điểm và thông tin ủng hộ tác giả.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          disabled={saving}
          className="px-4 py-1.5 bg-[#e60049] hover:bg-[#cc0041] disabled:opacity-50 text-white text-xs font-bold rounded-sm transition shadow-sm"
        >
          {saving ? 'Đang lưu...' : 'Lưu tất cả Trang Tiện ích'}
        </button>
      </div>

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'terms', label: '1. Điều khoản & Bản quyền' },
          { id: 'faq', label: '2. Câu hỏi thường gặp (FAQ)' },
          { id: 'rewards', label: '3. Tích điểm HC Rewards' },
          { id: 'soan', label: '4. Soạn tài liệu theo yêu cầu' },
          { id: 'donate', label: '5. Ủng hộ tác giả (Donate)' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-2 text-xs font-bold rounded-t-sm transition whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-[#e60049] text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* SUB-TAB 1: ĐIỀU KHOẢN DỊCH VỤ */}
      {activeSubTab === 'terms' && (
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Tiêu đề trang
              </label>
              <input
                type="text"
                value={termsConfig.title}
                onChange={(e) => setTermsConfig({ ...termsConfig, title: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Mô tả phạm vi áp dụng
              </label>
              <input
                type="text"
                value={termsConfig.description}
                onChange={(e) => setTermsConfig({ ...termsConfig, description: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">
                Danh sách các Điều khoản ({termsConfig.sections?.length || 0})
              </span>
              <button
                type="button"
                onClick={() => {
                  const newSec: TermsSectionItem = {
                    id: `term_${Date.now()}`,
                    title: `Điều ${termsConfig.sections.length + 1}: Quy định mới`,
                    content: 'Nội dung điều khoản chi tiết...',
                  };
                  setTermsConfig({
                    ...termsConfig,
                    sections: [...termsConfig.sections, newSec],
                  });
                }}
                className="text-[11px] px-2.5 py-1 bg-gray-900 text-white font-bold rounded"
              >
                + Thêm Điều khoản
              </button>
            </div>

            <div className="space-y-3">
              {termsConfig.sections.map((sec, idx) => (
                <div key={sec.id || idx} className="p-3 border border-gray-200 bg-gray-50 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#e60049]">Mục #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setTermsConfig({
                          ...termsConfig,
                          sections: termsConfig.sections.filter((_, i) => i !== idx),
                        });
                      }}
                      className="text-gray-400 hover:text-red-600 text-xs"
                    >
                      ✕ Xóa
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => {
                      const next = [...termsConfig.sections];
                      next[idx] = { ...sec, title: e.target.value };
                      setTermsConfig({ ...termsConfig, sections: next });
                    }}
                    className="w-full text-xs font-bold border border-gray-200 rounded px-2 py-1 outline-none"
                    placeholder="Tiêu đề điều khoản"
                  />
                  <textarea
                    rows={3}
                    value={sec.content}
                    onChange={(e) => {
                      const next = [...termsConfig.sections];
                      next[idx] = { ...sec, content: e.target.value };
                      setTermsConfig({ ...termsConfig, sections: next });
                    }}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                    placeholder="Nội dung điều khoản"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CÂU HỎI THƯỜNG GẶP FAQ */}
      {activeSubTab === 'faq' && (
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Tiêu đề trang FAQ
              </label>
              <input
                type="text"
                value={faqConfig.title}
                onChange={(e) => setFaqConfig({ ...faqConfig, title: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Mô tả giải đáp
              </label>
              <input
                type="text"
                value={faqConfig.description}
                onChange={(e) => setFaqConfig({ ...faqConfig, description: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">
                Danh sách câu hỏi &amp; câu trả lời ({faqConfig.faqs?.length || 0})
              </span>
              <button
                type="button"
                onClick={() => {
                  const newFaq: FaqItem = {
                    id: `faq_${Date.now()}`,
                    question: `${faqConfig.faqs.length + 1}. Câu hỏi mới thắc mắc là gì?`,
                    answer: 'Câu trả lời hướng dẫn chi tiết cho khách hàng...',
                  };
                  setFaqConfig({
                    ...faqConfig,
                    faqs: [...faqConfig.faqs, newFaq],
                  });
                }}
                className="text-[11px] px-2.5 py-1 bg-gray-900 text-white font-bold rounded"
              >
                + Thêm Câu hỏi FAQ
              </button>
            </div>

            <div className="space-y-3">
              {faqConfig.faqs.map((f, idx) => (
                <div key={f.id || idx} className="p-3 border border-gray-200 bg-gray-50 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#e60049]">Câu hỏi #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFaqConfig({
                          ...faqConfig,
                          faqs: faqConfig.faqs.filter((_, i) => i !== idx),
                        });
                      }}
                      className="text-gray-400 hover:text-red-600 text-xs"
                    >
                      ✕ Xóa
                    </button>
                  </div>
                  <input
                    type="text"
                    value={f.question}
                    onChange={(e) => {
                      const next = [...faqConfig.faqs];
                      next[idx] = { ...f, question: e.target.value };
                      setFaqConfig({ ...faqConfig, faqs: next });
                    }}
                    className="w-full text-xs font-bold border border-gray-200 rounded px-2 py-1 outline-none text-[#e60049]"
                    placeholder="Câu hỏi..."
                  />
                  <textarea
                    rows={2}
                    value={f.answer}
                    onChange={(e) => {
                      const next = [...faqConfig.faqs];
                      next[idx] = { ...f, answer: e.target.value };
                      setFaqConfig({ ...faqConfig, faqs: next });
                    }}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                    placeholder="Câu trả lời giải thích..."
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TÍCH ĐIỂM HC REWARDS */}
      {activeSubTab === 'rewards' && (
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Tiêu đề chương trình
              </label>
              <input
                type="text"
                value={rewardsConfig.title}
                onChange={(e) => setRewardsConfig({ ...rewardsConfig, title: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Mô tả quyền lợi
              </label>
              <input
                type="text"
                value={rewardsConfig.description}
                onChange={(e) => setRewardsConfig({ ...rewardsConfig, description: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800">
                Các thẻ quyền lợi tích điểm ({rewardsConfig.benefits?.length || 0})
              </span>
              <button
                type="button"
                onClick={() => {
                  const newB: HcRewardBenefitItem = {
                    id: `b_${Date.now()}`,
                    title: 'Quyền lợi mới',
                    desc: 'Mô tả quyền lợi tích lũy và đổi điểm...',
                  };
                  setRewardsConfig({
                    ...rewardsConfig,
                    benefits: [...rewardsConfig.benefits, newB],
                  });
                }}
                className="text-[11px] px-2.5 py-1 bg-gray-900 text-white font-bold rounded"
              >
                + Thêm Thẻ Quyền lợi
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {rewardsConfig.benefits.map((b, idx) => (
                <div key={b.id || idx} className="p-3 border border-pink-200 bg-pink-50/40 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#e60049]">Thẻ #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setRewardsConfig({
                          ...rewardsConfig,
                          benefits: rewardsConfig.benefits.filter((_, i) => i !== idx),
                        });
                      }}
                      className="text-gray-400 hover:text-red-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={b.title}
                    onChange={(e) => {
                      const next = [...rewardsConfig.benefits];
                      next[idx] = { ...b, title: e.target.value };
                      setRewardsConfig({ ...rewardsConfig, benefits: next });
                    }}
                    className="w-full text-xs font-bold border border-gray-200 rounded px-2 py-1 outline-none"
                  />
                  <textarea
                    rows={3}
                    value={b.desc}
                    onChange={(e) => {
                      const next = [...rewardsConfig.benefits];
                      next[idx] = { ...b, desc: e.target.value };
                      setRewardsConfig({ ...rewardsConfig, benefits: next });
                    }}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SOẠN TÀI LIỆU THEO YÊU CẦU */}
      {activeSubTab === 'soan' && (
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Tiêu đề dịch vụ
              </label>
              <input
                type="text"
                value={soanConfig.title}
                onChange={(e) => setSoanConfig({ ...soanConfig, title: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Tiêu đề Form gửi yêu cầu
              </label>
              <input
                type="text"
                value={soanConfig.form_title || ''}
                onChange={(e) => setSoanConfig({ ...soanConfig, form_title: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Mô tả dịch vụ
            </label>
            <textarea
              rows={2}
              value={soanConfig.description}
              onChange={(e) => setSoanConfig({ ...soanConfig, description: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
            />
          </div>

          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-gray-800 block">
              3 Cam kết tiêu chuẩn ({soanConfig.commitments?.length || 0})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {soanConfig.commitments.map((c, idx) => (
                <div key={c.id || idx} className="p-3 border border-gray-200 bg-gray-50 rounded space-y-2">
                  <span className="text-xs font-bold text-[#e60049]">Cam kết #{idx + 1}</span>
                  <input
                    type="text"
                    value={c.title}
                    onChange={(e) => {
                      const next = [...soanConfig.commitments];
                      next[idx] = { ...c, title: e.target.value };
                      setSoanConfig({ ...soanConfig, commitments: next });
                    }}
                    className="w-full text-xs font-bold border border-gray-200 rounded px-2 py-1 outline-none"
                  />
                  <textarea
                    rows={3}
                    value={c.desc}
                    onChange={(e) => {
                      const next = [...soanConfig.commitments];
                      next[idx] = { ...c, desc: e.target.value };
                      setSoanConfig({ ...soanConfig, commitments: next });
                    }}
                    className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: ỦNG HỘ TÁC GIẢ DONATE */}
      {activeSubTab === 'donate' && (
        <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Tiêu đề trang Donate
              </label>
              <input
                type="text"
                value={donateConfig.title}
                onChange={(e) => setDonateConfig({ ...donateConfig, title: e.target.value })}
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">
                Số tiền gợi ý mặc định (VNĐ)
              </label>
              <input
                type="number"
                value={donateConfig.default_amount || 50000}
                onChange={(e) =>
                  setDonateConfig({ ...donateConfig, default_amount: Number(e.target.value) })
                }
                className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Lời tri ân bạn đọc
            </label>
            <textarea
              rows={3}
              value={donateConfig.message}
              onChange={(e) => setDonateConfig({ ...donateConfig, message: e.target.value })}
              className="w-full text-xs border border-gray-200 rounded px-2.5 py-1.5 outline-none focus:border-[#e60049]"
            />
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded space-y-3">
            <span className="text-xs font-bold text-gray-800 block">
              Thông tin Tài khoản Ngân hàng nhận Ủng hộ (Tự động sinh mã VietQR)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                  Tên Ngân hàng (Mã VietQR)
                </label>
                <input
                  type="text"
                  value={donateConfig.bank_name}
                  onChange={(e) => setDonateConfig({ ...donateConfig, bank_name: e.target.value })}
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                  placeholder="MBBank"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                  Số tài khoản
                </label>
                <input
                  type="text"
                  value={donateConfig.account_number}
                  onChange={(e) =>
                    setDonateConfig({ ...donateConfig, account_number: e.target.value })
                  }
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none font-mono"
                  placeholder="0358999147"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-bold block mb-0.5">
                  Tên Chủ tài khoản
                </label>
                <input
                  type="text"
                  value={donateConfig.account_holder}
                  onChange={(e) =>
                    setDonateConfig({ ...donateConfig, account_holder: e.target.value })
                  }
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none uppercase font-bold"
                  placeholder="HO KINH DOANH HUY CRECOM"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-4">
              <img
                src={`https://qr.sepay.vn/img?bank=${encodeURIComponent(
                  donateConfig.bank_name
                )}&acc=${encodeURIComponent(donateConfig.account_number)}&template=compact2&amount=${
                  donateConfig.default_amount || 50000
                }&des=${encodeURIComponent('UNG HO HUY TUTOR')}`}
                alt="VietQR Preview"
                className="w-24 h-24 object-contain border border-gray-300 rounded bg-white p-1"
              />
              <div className="text-[11px] text-gray-500 space-y-0.5">
                <div className="font-bold text-gray-700">Xem trước mã VietQR tự động:</div>
                <div>Ngân hàng: {donateConfig.bank_name}</div>
                <div>Số TK: {donateConfig.account_number}</div>
                <div>Chủ TK: {donateConfig.account_holder}</div>
                <div>Số tiền: {donateConfig.default_amount?.toLocaleString('vi-VN')} đ</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

