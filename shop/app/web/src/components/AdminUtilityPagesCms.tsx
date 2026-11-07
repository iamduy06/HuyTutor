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
  PolicyPageConfig,
  PolicySectionItem,
  CustomPagesConfig,
  CustomPageItem,
  CustomPageBlock,
  CustomPageBlockItem,
  CustomBlockType,
} from '../types';
import {
  PolicyPageRenderer,
  CustomPageRenderer,
  DEFAULT_PRIVACY_POLICY_CONFIG,
  DEFAULT_PAYMENT_DELIVERY_POLICY_CONFIG,
  DEFAULT_REFUND_POLICY_CONFIG,
  DEFAULT_COPYRIGHT_POLICY_CONFIG,
} from '../pages/UtilityPages';
import { R2ImageUploader } from './R2ImageUploader';

export const AdminUtilityPagesCms: React.FC = () => {
  const { siteConfigs, updateSiteConfig, showToast } = useStore();

  // 10 Tabs Navigation State
  const [activeSubTab, setActiveSubTab] = useState<
    | 'privacy'
    | 'payment_delivery'
    | 'refund'
    | 'copyright'
    | 'terms'
    | 'faq'
    | 'rewards'
    | 'soan'
    | 'donate'
    | 'custom_pages'
  >('privacy');

  const [saving, setSaving] = useState(false);

  // Live Preview Settings
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [previewViewport, setPreviewViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // FAQ open state for preview
  const [previewFaqOpen, setPreviewFaqOpen] = useState<Record<string, boolean>>({});

  // -------------------------------------------------------------
  // STATES CHO 4 CHÍNH SÁCH BẮT BUỘC
  // -------------------------------------------------------------
  const [privacyConfig, setPrivacyConfig] = useState<PolicyPageConfig>(() => {
    return siteConfigs?.privacy_policy_config || DEFAULT_PRIVACY_POLICY_CONFIG;
  });

  const [paymentDeliveryConfig, setPaymentDeliveryConfig] = useState<PolicyPageConfig>(() => {
    return siteConfigs?.payment_delivery_policy_config || DEFAULT_PAYMENT_DELIVERY_POLICY_CONFIG;
  });

  const [refundConfig, setRefundConfig] = useState<PolicyPageConfig>(() => {
    return siteConfigs?.refund_policy_config || DEFAULT_REFUND_POLICY_CONFIG;
  });

  const [copyrightConfig, setCopyrightConfig] = useState<PolicyPageConfig>(() => {
    return siteConfigs?.copyright_policy_config || DEFAULT_COPYRIGHT_POLICY_CONFIG;
  });

  // -------------------------------------------------------------
  // STATES CHO 5 TRANG TIỆN ÍCH TRƯỚC ĐÂY
  // -------------------------------------------------------------
  const [termsConfig, setTermsConfig] = useState<TermsPageConfig>(() => {
    return (
      siteConfigs?.terms_page_config || {
        title: 'Điều khoản sử dụng & Quy chế dịch vụ',
        description:
          'Áp dụng cho toàn bộ tài liệu số và dịch vụ phát hành tại hệ sinh thái Huy Tutor thuộc Hộ kinh doanh Huy Crecom',
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
              'Các tài liệu đọc thử trên hệ thống được bảo vệ bởi Watermark 2 lớp (lớp phủ giao diện và lớp đóng dấu trực tiếp trên từng trang PDF bằng Cloudflare R2).',
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
              'Hệ thống hỗ trợ 5 định dạng chuyên biệt: File Word (chỉnh sửa 100%), File PDF (dàn trang sắc nét), Flashcard trực tuyến, Trang tính quản lý lớp học và Thiết kế.',
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
              'Để đảm bảo phân quyền và gửi tài liệu chính xác theo từng định dạng qua Google Drive, giỏ hàng cho phép lưu nhiều định dạng nhưng khi thanh toán mỗi đơn hàng sẽ xử lý đồng nhất theo một định dạng đã chọn.',
          },
          {
            id: 'faq_5',
            question: '5. Tài liệu có kèm đáp án và giải thích chi tiết không?',
            answer:
              'Tất cả các bộ đề và chuyên đề đều đi kèm bảng đáp án, giải thích chi tiết từng phương án đúng/sai, dịch nghĩa ngữ cảnh và bảng từ vựng mở rộng.',
          },
        ],
      }
    );
  });

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

  // -------------------------------------------------------------
  // STATE CHO TRANG TÙY BIẾN THEO KHỐI (CUSTOM PAGES BUILDER)
  // -------------------------------------------------------------
  const [customPagesConfig, setCustomPagesConfig] = useState<CustomPagesConfig>(() => {
    return (
      siteConfigs?.custom_pages_config || {
        pages: [
          {
            id: 'page_guide',
            title: 'Hướng dẫn nhận tài liệu & Kích hoạt học liệu',
            slug: 'huong-dan-nhan-tai-lieu',
            meta_description: 'Quy trình chi tiết từ khi đặt hàng, thanh toán đến khi tải file Word/PDF và học Flashcard',
            is_active: true,
            blocks: [
              {
                id: 'b_hero',
                type: 'banner_hero',
                title: 'HƯỚNG DẪN NHẬN TÀI LIỆU NHANH CHÓNG',
                subtitle: 'Hệ thống tự động phân quyền qua Google Drive và kích hoạt tài khoản chỉ trong 30 giây.',
                link_url: '/high-school',
                is_active: true,
              },
              {
                id: 'b_content',
                type: 'rich_text',
                title: 'Các bước thực hiện',
                subtitle: 'Thực hiện 3 bước đơn giản',
                content:
                  '1. Chọn định dạng tài liệu mong muốn (Word, PDF, Flashcard).\n2. Quét mã VietQR thanh toán tự động qua SePay.\n3. Kiểm tra Gmail và nhấn Chấp nhận chia sẻ Google Drive để tải file về máy.',
                is_active: true,
              },
              {
                id: 'b_cta',
                type: 'cta_box',
                title: 'Cần hỗ trợ trực tiếp từ Thầy Huy?',
                subtitle: 'Liên hệ nhanh qua Zalo 0358999147 để được giải đáp thắc mắc trong 5 phút.',
                link_url: '/soan-tai-lieu',
                is_active: true,
              },
            ],
          },
        ],
      }
    );
  });

  const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
  const selectedCustomPage: CustomPageItem | undefined =
    customPagesConfig.pages[selectedPageIndex] || customPagesConfig.pages[0];

  // -------------------------------------------------------------
  // HÀM LƯU DỮ LIỆU
  // -------------------------------------------------------------
  const handleSaveCurrentTab = async () => {
    setSaving(true);
    try {
      switch (activeSubTab) {
        case 'privacy':
          await updateSiteConfig('privacy_policy_config', privacyConfig);
          showToast('Đã lưu [CHÍNH SÁCH BẢO MẬT] thành công!');
          break;
        case 'payment_delivery':
          await updateSiteConfig('payment_delivery_policy_config', paymentDeliveryConfig);
          showToast('Đã lưu [CHÍNH SÁCH THANH TOÁN & GIAO HÀNG] thành công!');
          break;
        case 'refund':
          await updateSiteConfig('refund_policy_config', refundConfig);
          showToast('Đã lưu [CHÍNH SÁCH HOÀN TIỀN] thành công!');
          break;
        case 'copyright':
          await updateSiteConfig('copyright_policy_config', copyrightConfig);
          showToast('Đã lưu [CHÍNH SÁCH BẢN QUYỀN] thành công!');
          break;
        case 'terms':
          await updateSiteConfig('terms_page_config', termsConfig);
          showToast('Đã lưu [ĐIỀU KHOẢN SỬ DỤNG] thành công!');
          break;
        case 'faq':
          await updateSiteConfig('faq_page_config', faqConfig);
          showToast('Đã lưu [CÂU HỎI THƯỜNG GẶP (FAQ)] thành công!');
          break;
        case 'rewards':
          await updateSiteConfig('hc_rewards_page_config', rewardsConfig);
          showToast('Đã lưu [TÍCH ĐIỂM HC REWARDS] thành công!');
          break;
        case 'soan':
          await updateSiteConfig('soan_tai_lieu_page_config', soanConfig);
          showToast('Đã lưu [SOẠN TÀI LIỆU THEO YÊU CẦU] thành công!');
          break;
        case 'donate':
          await updateSiteConfig('donate_page_config', donateConfig);
          showToast('Đã lưu [ỦNG HỘ TÁC GIẢ] thành công!');
          break;
        case 'custom_pages':
          await updateSiteConfig('custom_pages_config', customPagesConfig);
          showToast('Đã lưu [TRANG TÙY BIẾN THEO KHỐI] thành công!');
          break;
      }
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi lưu cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await updateSiteConfig('privacy_policy_config', privacyConfig);
      await updateSiteConfig('payment_delivery_policy_config', paymentDeliveryConfig);
      await updateSiteConfig('refund_policy_config', refundConfig);
      await updateSiteConfig('copyright_policy_config', copyrightConfig);
      await updateSiteConfig('terms_page_config', termsConfig);
      await updateSiteConfig('faq_page_config', faqConfig);
      await updateSiteConfig('hc_rewards_page_config', rewardsConfig);
      await updateSiteConfig('soan_tai_lieu_page_config', soanConfig);
      await updateSiteConfig('donate_page_config', donateConfig);
      await updateSiteConfig('custom_pages_config', customPagesConfig);
      showToast('Đã lưu thành công toàn bộ 10 phân hệ Tiện ích & Trang tùy biến!');
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi lưu toàn bộ cấu hình.');
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // HELPER QUẢN LÝ KHỐI CHO CÁC CHÍNH SÁCH
  // -------------------------------------------------------------
  const renderPolicyEditor = (
    config: PolicyPageConfig,
    setConfig: React.Dispatch<React.SetStateAction<PolicyPageConfig>>,
    blockTitle: string,
    blockDesc: string
  ) => {
    const addSection = () => {
      const newSec: PolicySectionItem = {
        id: 'sec_' + Date.now(),
        title: `${config.sections.length + 1}. Mục mới`,
        content: '',
      };
      setConfig({ ...config, sections: [...config.sections, newSec] });
    };

    const updateSection = (index: number, field: keyof PolicySectionItem, val: string) => {
      const updated = [...config.sections];
      updated[index] = { ...updated[index], [field]: val };
      setConfig({ ...config, sections: updated });
    };

    const removeSection = (index: number) => {
      setConfig({
        ...config,
        sections: config.sections.filter((_, i) => i !== index),
      });
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= config.sections.length) return;
      const updated = [...config.sections];
      const temp = updated[index];
      updated[index] = updated[newIndex];
      updated[newIndex] = temp;
      setConfig({ ...config, sections: updated });
    };

    return (
      <div className="space-y-4">
        {/* TIÊU ĐỀ KHỐI CHUẨN GEMINI.MD RULE 5 */}
        <div className="bg-[#fdf2f4] border-l-4 border-[#e60049] p-3 rounded-xs">
          <div className="text-xs font-black text-[#e60049] uppercase tracking-wide">
            [{blockTitle}] - {blockDesc}
          </div>
        </div>

        {/* THÔNG TIN CHUNG */}
        <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Tiêu đề chính trang (H1)
            </label>
            <input
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Mô tả tóm tắt (Description)
            </label>
            <textarea
              rows={2}
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Nhãn ngày cập nhật
            </label>
            <input
              type="text"
              value={config.last_updated || ''}
              onChange={(e) => setConfig({ ...config, last_updated: e.target.value })}
              className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
              placeholder="Ví dụ: Cập nhật ngày 01/01/2026"
            />
          </div>
        </div>

        {/* DANH SÁCH CÁC ĐIỀU KHOẢN */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
              Danh sách điều khoản / Nội dung chi tiết ({config.sections.length})
            </h3>
            <button
              type="button"
              onClick={addSection}
              className="px-3 py-1 bg-[#e60049] hover:bg-[#cc0041] text-white text-[11px] font-bold rounded-xs transition shadow-xs"
            >
              + Thêm mục điều khoản
            </button>
          </div>

          {config.sections.map((sec, idx) => (
            <div
              key={sec.id || idx}
              className="bg-white border border-gray-200 p-3 rounded-xs shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <span className="text-[11px] font-bold text-[#e60049]">
                  Mục #{idx + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-xs"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(idx, 'down')}
                    disabled={idx === config.sections.length - 1}
                    className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-xs"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(idx)}
                    className="px-2 py-0.5 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xs font-bold"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                  Tiêu đề mục
                </label>
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => updateSection(idx, 'title', e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                  Nội dung chi tiết
                </label>
                <textarea
                  rows={3}
                  value={sec.content}
                  onChange={(e) => updateSection(idx, 'content', e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------
  // HELPER QUẢN LÝ TRANG TÙY BIẾN THEO KHỐI
  // -------------------------------------------------------------
  const handleAddNewCustomPage = () => {
    const newPageId = 'page_' + Date.now();
    const newPage: CustomPageItem = {
      id: newPageId,
      title: 'Trang mới ' + (customPagesConfig.pages.length + 1),
      slug: 'trang-moi-' + Date.now().toString().slice(-4),
      meta_description: 'Mô tả nội dung cho trang tùy biến mới',
      is_active: true,
      blocks: [
        {
          id: 'blk_' + Date.now(),
          type: 'rich_text',
          title: 'Khối giới thiệu',
          subtitle: 'Nội dung khởi tạo',
          content: 'Nhập nội dung văn bản cho trang tùy biến của bạn tại đây.',
          is_active: true,
        },
      ],
    };
    const updated = [...customPagesConfig.pages, newPage];
    setCustomPagesConfig({ pages: updated });
    setSelectedPageIndex(updated.length - 1);
    showToast('Đã thêm trang tùy biến mới!');
  };

  const handleDeleteCustomPage = (index: number) => {
    if (customPagesConfig.pages.length <= 1) {
      showToast('Cần duy trì ít nhất 1 trang tùy biến.');
      return;
    }
    const updated = customPagesConfig.pages.filter((_, i) => i !== index);
    setCustomPagesConfig({ pages: updated });
    setSelectedPageIndex(Math.max(0, index - 1));
    showToast('Đã xóa trang tùy biến.');
  };

  const handleAddBlock = (type: CustomBlockType) => {
    if (!selectedCustomPage) return;
    const newBlock: CustomPageBlock = {
      id: 'blk_' + Date.now(),
      type,
      title:
        type === 'image_only'
          ? 'Hình ảnh minh họa'
          : type === 'banner_hero'
          ? 'Banner nổi bật'
          : type === 'rich_text'
          ? 'Đoạn văn bản'
          : type === 'cards_grid'
          ? 'Lưới tính năng'
          : type === 'accordion_faq'
          ? 'Câu hỏi thường gặp'
          : 'Kêu gọi hành động',
      subtitle: '',
      content: '',
      image_url: '',
      link_url: '',
      caption: '',
      items:
        type === 'cards_grid' || type === 'accordion_faq'
          ? [
              {
                id: 'item_1',
                title: 'Mục 1',
                desc: 'Mô tả chi tiết mục 1',
                icon: '★',
                link: '',
              },
            ]
          : undefined,
      is_active: true,
    };

    const updatedPages = [...customPagesConfig.pages];
    const target = { ...selectedCustomPage, blocks: [...selectedCustomPage.blocks, newBlock] };
    updatedPages[selectedPageIndex] = target;
    setCustomPagesConfig({ pages: updatedPages });
    showToast(`Đã thêm khối [${type}] thành công!`);
  };

  const handleUpdateBlock = (blockIndex: number, field: keyof CustomPageBlock, value: any) => {
    if (!selectedCustomPage) return;
    const updatedBlocks = [...selectedCustomPage.blocks];
    updatedBlocks[blockIndex] = { ...updatedBlocks[blockIndex], [field]: value };
    const updatedPages = [...customPagesConfig.pages];
    updatedPages[selectedPageIndex] = { ...selectedCustomPage, blocks: updatedBlocks };
    setCustomPagesConfig({ pages: updatedPages });
  };

  const handleRemoveBlock = (blockIndex: number) => {
    if (!selectedCustomPage) return;
    const updatedBlocks = selectedCustomPage.blocks.filter((_, i) => i !== blockIndex);
    const updatedPages = [...customPagesConfig.pages];
    updatedPages[selectedPageIndex] = { ...selectedCustomPage, blocks: updatedBlocks };
    setCustomPagesConfig({ pages: updatedPages });
  };

  const handleMoveBlock = (blockIndex: number, direction: 'up' | 'down') => {
    if (!selectedCustomPage) return;
    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= selectedCustomPage.blocks.length) return;
    const updatedBlocks = [...selectedCustomPage.blocks];
    const temp = updatedBlocks[blockIndex];
    updatedBlocks[blockIndex] = updatedBlocks[newIndex];
    updatedBlocks[newIndex] = temp;
    const updatedPages = [...customPagesConfig.pages];
    updatedPages[selectedPageIndex] = { ...selectedCustomPage, blocks: updatedBlocks };
    setCustomPagesConfig({ pages: updatedPages });
  };

  // Helper render Preview theo active tab
  const renderLivePreviewContent = () => {
    switch (activeSubTab) {
      case 'privacy':
        return <PolicyPageRenderer config={privacyConfig} />;
      case 'payment_delivery':
        return <PolicyPageRenderer config={paymentDeliveryConfig} />;
      case 'refund':
        return <PolicyPageRenderer config={refundConfig} />;
      case 'copyright':
        return <PolicyPageRenderer config={copyrightConfig} />;
      case 'terms':
        return (
          <PolicyPageRenderer
            config={{
              title: termsConfig.title,
              description: termsConfig.description,
              sections: termsConfig.sections,
            }}
          />
        );
      case 'faq':
        return (
          <div className="max-w-[760px] mx-auto px-4 py-8 space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-[#e60049] mb-1">{faqConfig.title}</h1>
              <p className="text-xs text-gray-600">{faqConfig.description}</p>
            </div>
            <div className="space-y-2">
              {(faqConfig.faqs || []).map((faq, idx) => {
                const isOpen = previewFaqOpen[faq.id || String(idx)];
                return (
                  <div
                    key={faq.id || idx}
                    className="border border-gray-200 bg-white rounded-xs overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewFaqOpen((prev) => ({
                          ...prev,
                          [faq.id || String(idx)]: !prev[faq.id || String(idx)],
                        }))
                      }
                      className="w-full text-left p-3 text-xs font-bold text-gray-800 flex justify-between items-center"
                    >
                      <span>{faq.question}</span>
                      <span className="text-[#e60049] ml-2 font-mono">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="p-3 pt-0 text-xs text-gray-600 bg-gray-50/50 border-t border-gray-100 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'rewards':
        return (
          <div className="max-w-[760px] mx-auto px-4 py-8 space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-[#e60049] mb-1">{rewardsConfig.title}</h1>
              <p className="text-xs text-gray-600">{rewardsConfig.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(rewardsConfig.benefits || []).map((b) => (
                <div key={b.id || b.title} className="bg-white border border-gray-200 p-3 rounded-xs space-y-1">
                  <div className="text-xs font-black text-[#e60049] uppercase">{b.title}</div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'soan':
        return (
          <div className="max-w-[760px] mx-auto px-4 py-8 space-y-6">
            <div>
              <h1 className="text-xl font-extrabold text-[#e60049] mb-1">{soanConfig.title}</h1>
              <p className="text-xs text-gray-600">{soanConfig.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(soanConfig.commitments || []).map((c) => (
                <div key={c.id || c.title} className="bg-[#f8f9fa] border border-gray-200 p-3 rounded-xs space-y-1">
                  <div className="text-xs font-black text-[#e60049] uppercase">{c.title}</div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'donate':
        const bank = encodeURIComponent(donateConfig.bank_name || 'MBBank');
        const acc = encodeURIComponent(donateConfig.account_number || '0358999147');
        const amount = donateConfig.default_amount || 50000;
        const des = encodeURIComponent('UNG HO HUY TUTOR');
        const qrUrl = `https://qr.sepay.vn/img?bank=${bank}&acc=${acc}&template=compact2&amount=${amount}&des=${des}`;
        return (
          <div className="max-w-[500px] mx-auto px-4 py-8 space-y-4 text-center">
            <h1 className="text-xl font-extrabold text-[#e60049]">{donateConfig.title}</h1>
            <p className="text-xs text-gray-600 leading-relaxed">{donateConfig.message}</p>
            <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs space-y-2">
              <img src={qrUrl} alt="VietQR" className="w-40 h-40 object-contain mx-auto border border-gray-200 p-1" />
              <div className="text-xs text-gray-700">
                <p>Ngân hàng: <strong>{donateConfig.bank_name}</strong></p>
                <p>Số TK: <strong className="text-[#e60049]">{donateConfig.account_number}</strong></p>
                <p>Chủ TK: <strong>{donateConfig.account_holder}</strong></p>
              </div>
            </div>
          </div>
        );
      case 'custom_pages':
        if (!selectedCustomPage) {
          return (
            <div className="p-8 text-center text-xs text-gray-400">
              Chưa có trang tùy biến nào được chọn để xem trước.
            </div>
          );
        }
        return <CustomPageRenderer page={selectedCustomPage} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* CMS TOP BAR */}
      <div className="bg-white border border-gray-200 rounded-xs p-4 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e60049] animate-pulse"></span>
            <h2 className="text-sm font-black text-[#e60049] uppercase tracking-wide">
              Trình Quản Trị Utility Pages &amp; Live Preview Cms
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Quản trị 4 trang chính sách pháp lý, 5 trang tiện ích và phân hệ tạo trang tùy biến theo khối với tính năng Live Preview trực quan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* NÚT BẬT / TẮT LIVE PREVIEW */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1.5 text-xs font-bold rounded-xs transition border flex items-center gap-1.5 ${
              showPreview
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${showPreview ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`}
            ></span>
            {showPreview ? 'Đang BẬT Live Preview' : 'Đang TẮT Live Preview'}
          </button>

          {/* LƯU TAB HIỆN TẠI */}
          <button
            type="button"
            onClick={handleSaveCurrentTab}
            disabled={saving}
            className="px-3 py-1.5 bg-gray-800 hover:bg-black disabled:opacity-50 text-white text-xs font-bold rounded-xs transition shadow-xs"
          >
            {saving ? 'Đang lưu...' : 'Lưu Tab này'}
          </button>

          {/* LƯU TẤT CẢ */}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-1.5 bg-[#e60049] hover:bg-[#cc0041] disabled:opacity-50 text-white text-xs font-bold rounded-xs transition shadow-xs"
          >
            {saving ? 'Đang lưu...' : 'Lưu tất cả'}
          </button>
        </div>
      </div>

      {/* 10 SUB-TABS NAVIGATION (CHUẨN RULE 5 & SQUARE AESTHETIC) */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto">
        {[
          { id: 'privacy', label: '1. Chính sách bảo mật' },
          { id: 'payment_delivery', label: '2. Thanh toán & Giao hàng' },
          { id: 'refund', label: '3. Hoàn tiền' },
          { id: 'copyright', label: '4. Bản quyền' },
          { id: 'terms', label: '5. Điều khoản sử dụng' },
          { id: 'faq', label: '6. Câu hỏi thường gặp' },
          { id: 'rewards', label: '7. HC Rewards' },
          { id: 'soan', label: '8. Soạn tài liệu' },
          { id: 'donate', label: '9. Ủng hộ tác giả' },
          { id: 'custom_pages', label: '10. Trang tùy biến (Khối)' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-2 text-xs font-bold rounded-t-xs transition whitespace-nowrap ${
              activeSubTab === tab.id
                ? 'bg-[#e60049] text-white shadow-xs'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* WORKSPACE LAYOUT (SPLIT SCREEN NẾU BẬT LIVE PREVIEW) */}
      <div className={`grid grid-cols-1 ${showPreview ? 'lg:grid-cols-12 gap-6' : 'gap-0'}`}>
        {/* CỘT TRÁI: FORM BIÊN TẬP NỘI DUNG */}
        <div className={`${showPreview ? 'lg:col-span-6 space-y-4' : 'w-full space-y-4'}`}>
          {/* TAB 1: CHÍNH SÁCH BẢO MẬT */}
          {activeSubTab === 'privacy' &&
            renderPolicyEditor(
              privacyConfig,
              setPrivacyConfig,
              'CHÍNH SÁCH BẢO MẬT',
              'Quản lý nội dung và các điều khoản bảo mật thông tin khách hàng (/privacy-policy)'
            )}

          {/* TAB 2: THANH TOÁN & GIAO HÀNG */}
          {activeSubTab === 'payment_delivery' &&
            renderPolicyEditor(
              paymentDeliveryConfig,
              setPaymentDeliveryConfig,
              'CHÍNH SÁCH THANH TOÁN & GIAO HÀNG',
              'Cấu hình phương thức thanh toán VietQR, PayPal và quy trình cấp quyền Gmail (/payment-delivery-policy)'
            )}

          {/* TAB 3: HOÀN TIỀN */}
          {activeSubTab === 'refund' &&
            renderPolicyEditor(
              refundConfig,
              setRefundConfig,
              'CHÍNH SÁCH HOÀN TIỀN',
              'Quy định chi tiết về điều kiện hoàn tiền, bảo lưu và đổi trả tài liệu số (/refund-policy)'
            )}

          {/* TAB 4: BẢN QUYỀN */}
          {activeSubTab === 'copyright' &&
            renderPolicyEditor(
              copyrightConfig,
              setCopyrightConfig,
              'CHÍNH SÁCH BẢN QUYỀN',
              'Tuyên bố sở hữu trí tuệ, cơ chế đóng dấu Watermark và xử lý vi phạm (/copyright-policy)'
            )}

          {/* TAB 5: ĐIỀU KHOẢN SỬ DỤNG */}
          {activeSubTab === 'terms' &&
            renderPolicyEditor(
              termsConfig as any,
              setTermsConfig as any,
              'ĐIỀU KHOẢN SỬ DỤNG',
              'Quy chế sử dụng website, dịch vụ số và cam kết pháp lý (/terms-of-service)'
            )}

          {/* TAB 6: FAQ */}
          {activeSubTab === 'faq' && (
            <div className="space-y-4">
              <div className="bg-[#fdf2f4] border-l-4 border-[#e60049] p-3 rounded-xs">
                <div className="text-xs font-black text-[#e60049] uppercase tracking-wide">
                  [CÂU HỎI THƯỜNG GẶP] - Danh sách câu hỏi và câu trả lời giải đáp thắc mắc của khách hàng (/faq)
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Tiêu đề trang FAQ (H1)
                  </label>
                  <input
                    type="text"
                    value={faqConfig.title}
                    onChange={(e) => setFaqConfig({ ...faqConfig, title: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Mô tả tóm tắt
                  </label>
                  <textarea
                    rows={2}
                    value={faqConfig.description}
                    onChange={(e) => setFaqConfig({ ...faqConfig, description: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                    Danh sách câu hỏi FAQ ({faqConfig.faqs.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newFaq: FaqItem = {
                        id: 'faq_' + Date.now(),
                        question: 'Câu hỏi mới?',
                        answer: '',
                      };
                      setFaqConfig({ ...faqConfig, faqs: [...faqConfig.faqs, newFaq] });
                    }}
                    className="px-3 py-1 bg-[#e60049] hover:bg-[#cc0041] text-white text-[11px] font-bold rounded-xs transition shadow-xs"
                  >
                    + Thêm câu hỏi
                  </button>
                </div>

                {faqConfig.faqs.map((faq, idx) => (
                  <div
                    key={faq.id || idx}
                    className="bg-white border border-gray-200 p-3 rounded-xs shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-[11px] font-bold text-[#e60049]">Câu hỏi #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFaqConfig({
                            ...faqConfig,
                            faqs: faqConfig.faqs.filter((_, i) => i !== idx),
                          })
                        }
                        className="px-2 py-0.5 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xs font-bold"
                      >
                        Xóa
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Câu hỏi</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => {
                          const updated = [...faqConfig.faqs];
                          updated[idx] = { ...updated[idx], question: e.target.value };
                          setFaqConfig({ ...faqConfig, faqs: updated });
                        }}
                        className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Câu trả lời</label>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => {
                          const updated = [...faqConfig.faqs];
                          updated[idx] = { ...updated[idx], answer: e.target.value };
                          setFaqConfig({ ...faqConfig, faqs: updated });
                        }}
                        className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: HC REWARDS */}
          {activeSubTab === 'rewards' && (
            <div className="space-y-4">
              <div className="bg-[#fdf2f4] border-l-4 border-[#e60049] p-3 rounded-xs">
                <div className="text-xs font-black text-[#e60049] uppercase tracking-wide">
                  [TÍCH ĐIỂM HC REWARDS] - Cấu hình quyền lợi, ưu đãi và chương trình thành viên thân thiết (/hc-rewards)
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Tiêu đề trang HC Rewards (H1)
                  </label>
                  <input
                    type="text"
                    value={rewardsConfig.title}
                    onChange={(e) => setRewardsConfig({ ...rewardsConfig, title: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Mô tả tóm tắt
                  </label>
                  <textarea
                    rows={2}
                    value={rewardsConfig.description}
                    onChange={(e) => setRewardsConfig({ ...rewardsConfig, description: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                    Danh sách quyền lợi ({rewardsConfig.benefits.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newB: HcRewardBenefitItem = {
                        id: 'b_' + Date.now(),
                        title: 'Quyền lợi mới',
                        desc: '',
                      };
                      setRewardsConfig({ ...rewardsConfig, benefits: [...rewardsConfig.benefits, newB] });
                    }}
                    className="px-3 py-1 bg-[#e60049] hover:bg-[#cc0041] text-white text-[11px] font-bold rounded-xs transition shadow-xs"
                  >
                    + Thêm quyền lợi
                  </button>
                </div>

                {rewardsConfig.benefits.map((b, idx) => (
                  <div key={b.id || idx} className="bg-white border border-gray-200 p-3 rounded-xs shadow-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-[11px] font-bold text-[#e60049]">Quyền lợi #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setRewardsConfig({
                            ...rewardsConfig,
                            benefits: rewardsConfig.benefits.filter((_, i) => i !== idx),
                          })
                        }
                        className="px-2 py-0.5 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xs font-bold"
                      >
                        Xóa
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Tiêu đề quyền lợi</label>
                      <input
                        type="text"
                        value={b.title}
                        onChange={(e) => {
                          const updated = [...rewardsConfig.benefits];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setRewardsConfig({ ...rewardsConfig, benefits: updated });
                        }}
                        className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Mô tả quyền lợi</label>
                      <textarea
                        rows={2}
                        value={b.desc}
                        onChange={(e) => {
                          const updated = [...rewardsConfig.benefits];
                          updated[idx] = { ...updated[idx], desc: e.target.value };
                          setRewardsConfig({ ...rewardsConfig, benefits: updated });
                        }}
                        className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: SOẠN TÀI LIỆU */}
          {activeSubTab === 'soan' && (
            <div className="space-y-4">
              <div className="bg-[#fdf2f4] border-l-4 border-[#e60049] p-3 rounded-xs">
                <div className="text-xs font-black text-[#e60049] uppercase tracking-wide">
                  [SOẠN TÀI LIỆU THEO YÊU CẦU] - Quản lý dịch vụ biên soạn đề thi, cam kết chất lượng và biểu mẫu liên hệ (/soan-tai-lieu)
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Tiêu đề trang (H1)
                  </label>
                  <input
                    type="text"
                    value={soanConfig.title}
                    onChange={(e) => setSoanConfig({ ...soanConfig, title: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Mô tả tóm tắt
                  </label>
                  <textarea
                    rows={2}
                    value={soanConfig.description}
                    onChange={(e) => setSoanConfig({ ...soanConfig, description: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-wide">
                    Danh sách cam kết chất lượng ({soanConfig.commitments.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newC: SoanTaiLieuCommitmentItem = {
                        id: 'c_' + Date.now(),
                        title: 'Cam kết mới',
                        desc: '',
                      };
                      setSoanConfig({ ...soanConfig, commitments: [...soanConfig.commitments, newC] });
                    }}
                    className="px-3 py-1 bg-[#e60049] hover:bg-[#cc0041] text-white text-[11px] font-bold rounded-xs transition shadow-xs"
                  >
                    + Thêm cam kết
                  </button>
                </div>

                {soanConfig.commitments.map((c, idx) => (
                  <div key={c.id || idx} className="bg-white border border-gray-200 p-3 rounded-xs shadow-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="text-[11px] font-bold text-[#e60049]">Cam kết #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setSoanConfig({
                            ...soanConfig,
                            commitments: soanConfig.commitments.filter((_, i) => i !== idx),
                          })
                        }
                        className="px-2 py-0.5 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xs font-bold"
                      >
                        Xóa
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Tiêu đề cam kết</label>
                      <input
                        type="text"
                        value={c.title}
                        onChange={(e) => {
                          const updated = [...soanConfig.commitments];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setSoanConfig({ ...soanConfig, commitments: updated });
                        }}
                        className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Mô tả cam kết</label>
                      <textarea
                        rows={2}
                        value={c.desc}
                        onChange={(e) => {
                          const updated = [...soanConfig.commitments];
                          updated[idx] = { ...updated[idx], desc: e.target.value };
                          setSoanConfig({ ...soanConfig, commitments: updated });
                        }}
                        className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: ỦNG HỘ TÁC GIẢ (DONATE) */}
          {activeSubTab === 'donate' && (
            <div className="space-y-4">
              <div className="bg-[#fdf2f4] border-l-4 border-[#e60049] p-3 rounded-xs">
                <div className="text-xs font-black text-[#e60049] uppercase tracking-wide">
                  [ỦNG HỘ TÁC GIẢ] - Cấu hình thông tin tài khoản ngân hàng, thông điệp tri ân và mã VietQR (/donate)
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Tiêu đề trang (H1)</label>
                  <input
                    type="text"
                    value={donateConfig.title}
                    onChange={(e) => setDonateConfig({ ...donateConfig, title: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Lời cảm ơn / Thông điệp</label>
                  <textarea
                    rows={3}
                    value={donateConfig.message}
                    onChange={(e) => setDonateConfig({ ...donateConfig, message: e.target.value })}
                    className="w-full text-xs border border-gray-300 rounded-xs px-3 py-2 outline-none focus:border-[#e60049]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Tên Ngân hàng</label>
                    <input
                      type="text"
                      value={donateConfig.bank_name}
                      onChange={(e) => setDonateConfig({ ...donateConfig, bank_name: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded-xs px-2 py-1.5 outline-none focus:border-[#e60049]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Số tài khoản</label>
                    <input
                      type="text"
                      value={donateConfig.account_number}
                      onChange={(e) => setDonateConfig({ ...donateConfig, account_number: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded-xs px-2 py-1.5 outline-none font-mono focus:border-[#e60049]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5">Tên Chủ tài khoản</label>
                    <input
                      type="text"
                      value={donateConfig.account_holder}
                      onChange={(e) => setDonateConfig({ ...donateConfig, account_holder: e.target.value })}
                      className="w-full text-xs border border-gray-300 rounded-xs px-2 py-1.5 outline-none uppercase font-bold focus:border-[#e60049]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: TRANG TÙY BIẾN THEO KHỐI (CUSTOM PAGES BUILDER) */}
          {activeSubTab === 'custom_pages' && (
            <div className="space-y-4">
              <div className="bg-[#fdf2f4] border-l-4 border-[#e60049] p-3 rounded-xs">
                <div className="text-xs font-black text-[#e60049] uppercase tracking-wide">
                  [TRANG TÙY BIẾN THEO KHỐI] - Quản lý các trang nội dung độc lập với slug riêng và kiến trúc khối linh hoạt
                </div>
              </div>

              {/* THANH CHỌN VÀ THÊM TRANG TÙY BIẾN */}
              <div className="bg-white border border-gray-200 p-3 rounded-xs shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700 uppercase">
                    Danh sách các trang tùy biến ({customPagesConfig.pages.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNewCustomPage}
                    className="px-3 py-1 bg-[#e60049] hover:bg-[#cc0041] text-white text-[11px] font-bold rounded-xs transition shadow-xs"
                  >
                    + Thêm trang mới
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {customPagesConfig.pages.map((page, idx) => (
                    <button
                      key={page.id || idx}
                      type="button"
                      onClick={() => setSelectedPageIndex(idx)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xs transition whitespace-nowrap border flex items-center gap-1.5 ${
                        selectedPageIndex === idx
                          ? 'bg-[#e60049] text-white border-[#e60049]'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                      }`}
                    >
                      <span>{page.title}</span>
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded-xs ${
                          page.is_active ? 'bg-emerald-600 text-white' : 'bg-gray-400 text-white'
                        }`}
                      >
                        {page.is_active ? 'Bật' : 'Ẩn'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedCustomPage && (
                <div className="space-y-4">
                  {/* CẤU HÌNH THÔNG TIN TRANG CHỌN */}
                  <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <div className="text-xs font-black text-[#e60049] uppercase">
                        [THÔNG TIN TRANG: {selectedCustomPage.title}]
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomPage(selectedPageIndex)}
                        className="px-2 py-0.5 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xs font-bold"
                      >
                        Xóa trang này
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                          Tiêu đề trang (H1)
                        </label>
                        <input
                          type="text"
                          value={selectedCustomPage.title}
                          onChange={(e) => {
                            const updatedPages = [...customPagesConfig.pages];
                            updatedPages[selectedPageIndex] = {
                              ...selectedCustomPage,
                              title: e.target.value,
                            };
                            setCustomPagesConfig({ pages: updatedPages });
                          }}
                          className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                          URL Slug (Đường dẫn: /&lt;slug&gt;)
                        </label>
                        <div className="flex items-center border border-gray-300 rounded-xs overflow-hidden focus-within:border-[#e60049]">
                          <span className="bg-gray-100 px-2.5 py-1.5 text-xs text-gray-500 font-mono font-bold">
                            /
                          </span>
                          <input
                            type="text"
                            value={selectedCustomPage.slug}
                            onChange={(e) => {
                              const safeSlug = e.target.value
                                .toLowerCase()
                                .replace(/^\/+/, '')
                                .replace(/[^a-z0-9-_]/g, '-');
                              const updatedPages = [...customPagesConfig.pages];
                              updatedPages[selectedPageIndex] = {
                                ...selectedCustomPage,
                                slug: safeSlug,
                              };
                              setCustomPagesConfig({ pages: updatedPages });
                            }}
                            className="w-full text-xs px-2 py-1.5 outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                        Mô tả tóm tắt (SEO Meta Description)
                      </label>
                      <textarea
                        rows={2}
                        value={selectedCustomPage.meta_description || ''}
                        onChange={(e) => {
                          const updatedPages = [...customPagesConfig.pages];
                          updatedPages[selectedPageIndex] = {
                            ...selectedCustomPage,
                            meta_description: e.target.value,
                          };
                          setCustomPagesConfig({ pages: updatedPages });
                        }}
                        className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="page_is_active"
                        checked={selectedCustomPage.is_active}
                        onChange={(e) => {
                          const updatedPages = [...customPagesConfig.pages];
                          updatedPages[selectedPageIndex] = {
                            ...selectedCustomPage,
                            is_active: e.target.checked,
                          };
                          setCustomPagesConfig({ pages: updatedPages });
                        }}
                        className="w-4 h-4 accent-[#e60049] rounded-xs"
                      />
                      <label htmlFor="page_is_active" className="text-xs font-bold text-gray-700 cursor-pointer">
                        Công khai trang này trên website (/{selectedCustomPage.slug})
                      </label>
                    </div>
                  </div>

                  {/* THANH CÔNG CỤ THÊM KHỐI MỚI (BAO GỒM KHỐI CHỈ ẢNH IMAGE_ONLY) */}
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-xs space-y-2">
                    <span className="text-[11px] font-black text-gray-700 uppercase block">
                      + Thêm khối nội dung mới cho trang này:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddBlock('image_only')}
                        className="px-2.5 py-1 bg-white hover:bg-pink-50 border border-[#e60049] text-[#e60049] text-[11px] font-bold rounded-xs transition shadow-2xs"
                      >
                        🖼️ + Khối Chỉ tải ảnh (image_only)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('banner_hero')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[11px] font-bold rounded-xs transition shadow-2xs"
                      >
                        🚩 + Khối Banner Hero
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('rich_text')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[11px] font-bold rounded-xs transition shadow-2xs"
                      >
                        📝 + Khối Văn bản
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('cards_grid')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[11px] font-bold rounded-xs transition shadow-2xs"
                      >
                        🗂️ + Khối Lưới thẻ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('accordion_faq')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[11px] font-bold rounded-xs transition shadow-2xs"
                      >
                        ❓ + Khối FAQ Accordion
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddBlock('cta_box')}
                        className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-[11px] font-bold rounded-xs transition shadow-2xs"
                      >
                        📣 + Khối Kêu gọi CTA
                      </button>
                    </div>
                  </div>

                  {/* DANH SÁCH CÁC KHỐI ĐÃ TẠO */}
                  <div className="space-y-3">
                    {selectedCustomPage.blocks.map((block, bIdx) => (
                      <div
                        key={block.id || bIdx}
                        className="bg-white border border-gray-200 p-3.5 rounded-xs shadow-xs space-y-3"
                      >
                        {/* TIÊU ĐỀ KHỐI VÀ THAO TÁC */}
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-pink-100 text-[#e60049] rounded-xs">
                              {block.type}
                            </span>
                            <span className="text-xs font-bold text-gray-800">
                              Khối #{bIdx + 1}: {block.title || 'Chưa đặt tiêu đề'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(bIdx, 'up')}
                              disabled={bIdx === 0}
                              className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-xs"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveBlock(bIdx, 'down')}
                              disabled={bIdx === selectedCustomPage.blocks.length - 1}
                              className="px-2 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 disabled:opacity-30 rounded-xs"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveBlock(bIdx)}
                              className="px-2 py-0.5 text-[10px] bg-red-50 text-red-600 hover:bg-red-100 rounded-xs font-bold"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>

                        {/* NỘI DUNG FORM RIÊNG CHO TỪNG LOẠI KHỐI */}

                        {/* 1. KHỐI CHỈ HÌNH ẢNH (IMAGE_ONLY) THEO ĐÚNG YÊU CẦU */}
                        {block.type === 'image_only' && (
                          <div className="space-y-3">
                            <div className="text-[11px] font-bold text-[#e60049]">
                              [KHỐI CHỈ HÌNH ẢNH] - Tải ảnh lên Cloudflare R2 với chú thích và liên kết tùy chọn
                            </div>

                            <R2ImageUploader
                              label="Hình ảnh hiển thị (Cloudflare R2)"
                              helperText="Định dạng PNG, JPG, WEBP. Tên file 12 số ngẫu nhiên. Nút ✕ màu đỏ hỗ trợ xóa vĩnh viễn trên R2."
                              imageUrl={block.image_url}
                              onUrlChange={(url) => handleUpdateBlock(bIdx, 'image_url', url)}
                              folder="custom_pages"
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Chú thích hình ảnh (Caption)
                                </label>
                                <input
                                  type="text"
                                  value={block.caption || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'caption', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                  placeholder="Ví dụ: Sơ đồ ma trận kiến thức trọng tâm"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Liên kết khi nhấp vào ảnh (Tùy chọn)
                                </label>
                                <input
                                  type="text"
                                  value={block.link_url || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'link_url', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                  placeholder="Ví dụ: /combo-thpt hoặc https://..."
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. KHỐI BANNER HERO */}
                        {block.type === 'banner_hero' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Tiêu đề Banner
                                </label>
                                <input
                                  type="text"
                                  value={block.title || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'title', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Liên kết nút CTA (Tùy chọn)
                                </label>
                                <input
                                  type="text"
                                  value={block.link_url || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'link_url', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                  placeholder="/high-school"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                Mô tả phụ Banner
                              </label>
                              <textarea
                                rows={2}
                                value={block.subtitle || ''}
                                onChange={(e) => handleUpdateBlock(bIdx, 'subtitle', e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                              />
                            </div>

                            <R2ImageUploader
                              label="Ảnh nền Banner (Cloudflare R2 - Tùy chọn)"
                              imageUrl={block.image_url}
                              onUrlChange={(url) => handleUpdateBlock(bIdx, 'image_url', url)}
                              folder="custom_pages"
                            />
                          </div>
                        )}

                        {/* 3. KHỐI VĂN BẢN (RICH_TEXT) */}
                        {block.type === 'rich_text' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Tiêu đề khối
                                </label>
                                <input
                                  type="text"
                                  value={block.title || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'title', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Phụ đề (Subtitle)
                                </label>
                                <input
                                  type="text"
                                  value={block.subtitle || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'subtitle', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                Nội dung văn bản chi tiết
                              </label>
                              <textarea
                                rows={4}
                                value={block.content || ''}
                                onChange={(e) => handleUpdateBlock(bIdx, 'content', e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                              />
                            </div>
                          </div>
                        )}

                        {/* 4. KHỐI LƯỚI THẺ (CARDS_GRID) */}
                        {block.type === 'cards_grid' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Tiêu đề Lưới thẻ
                                </label>
                                <input
                                  type="text"
                                  value={block.title || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'title', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Mô tả phụ
                                </label>
                                <input
                                  type="text"
                                  value={block.subtitle || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'subtitle', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">
                                  Danh sách thẻ ({(block.items || []).length})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItem: CustomPageBlockItem = {
                                      id: 'item_' + Date.now(),
                                      title: 'Thẻ mới',
                                      desc: '',
                                      icon: '★',
                                      link: '',
                                    };
                                    handleUpdateBlock(bIdx, 'items', [...(block.items || []), newItem]);
                                  }}
                                  className="px-2 py-0.5 text-[10px] bg-[#e60049] text-white font-bold rounded-xs"
                                >
                                  + Thêm thẻ
                                </button>
                              </div>

                              {(block.items || []).map((item, itIdx) => (
                                <div
                                  key={item.id || itIdx}
                                  className="bg-gray-50 border border-gray-200 p-2.5 rounded-xs space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-700">Thẻ #{itIdx + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedItems = (block.items || []).filter((_, i) => i !== itIdx);
                                        handleUpdateBlock(bIdx, 'items', updatedItems);
                                      }}
                                      className="text-[9px] text-red-600 font-bold hover:underline"
                                    >
                                      Xóa thẻ
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <input
                                      type="text"
                                      placeholder="Icon (★, 🚀...)"
                                      value={item.icon || ''}
                                      onChange={(e) => {
                                        const updated = [...(block.items || [])];
                                        updated[itIdx] = { ...updated[itIdx], icon: e.target.value };
                                        handleUpdateBlock(bIdx, 'items', updated);
                                      }}
                                      className="text-xs border border-gray-300 rounded-xs px-2 py-1 outline-none"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Tiêu đề thẻ"
                                      value={item.title}
                                      onChange={(e) => {
                                        const updated = [...(block.items || [])];
                                        updated[itIdx] = { ...updated[itIdx], title: e.target.value };
                                        handleUpdateBlock(bIdx, 'items', updated);
                                      }}
                                      className="col-span-2 text-xs border border-gray-300 rounded-xs px-2 py-1 outline-none"
                                    />
                                  </div>
                                  <textarea
                                    rows={2}
                                    placeholder="Mô tả nội dung thẻ"
                                    value={item.desc || ''}
                                    onChange={(e) => {
                                      const updated = [...(block.items || [])];
                                      updated[itIdx] = { ...updated[itIdx], desc: e.target.value };
                                      handleUpdateBlock(bIdx, 'items', updated);
                                    }}
                                    className="w-full text-xs border border-gray-300 rounded-xs px-2 py-1 outline-none"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. KHỐI FAQ ACCORDION */}
                        {block.type === 'accordion_faq' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Tiêu đề khối FAQ
                                </label>
                                <input
                                  type="text"
                                  value={block.title || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'title', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Phụ đề
                                </label>
                                <input
                                  type="text"
                                  value={block.subtitle || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'subtitle', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">
                                  Danh sách câu hỏi ({(block.items || []).length})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItem: CustomPageBlockItem = {
                                      id: 'faq_' + Date.now(),
                                      title: 'Câu hỏi mới?',
                                      desc: 'Câu trả lời chi tiết',
                                    };
                                    handleUpdateBlock(bIdx, 'items', [...(block.items || []), newItem]);
                                  }}
                                  className="px-2 py-0.5 text-[10px] bg-[#e60049] text-white font-bold rounded-xs"
                                >
                                  + Thêm câu hỏi
                                </button>
                              </div>

                              {(block.items || []).map((item, itIdx) => (
                                <div
                                  key={item.id || itIdx}
                                  className="bg-gray-50 border border-gray-200 p-2.5 rounded-xs space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-700">Mục #{itIdx + 1}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedItems = (block.items || []).filter((_, i) => i !== itIdx);
                                        handleUpdateBlock(bIdx, 'items', updatedItems);
                                      }}
                                      className="text-[9px] text-red-600 font-bold hover:underline"
                                    >
                                      Xóa
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Câu hỏi?"
                                    value={item.title}
                                    onChange={(e) => {
                                      const updated = [...(block.items || [])];
                                      updated[itIdx] = { ...updated[itIdx], title: e.target.value };
                                      handleUpdateBlock(bIdx, 'items', updated);
                                    }}
                                    className="w-full text-xs border border-gray-300 rounded-xs px-2 py-1 outline-none"
                                  />
                                  <textarea
                                    rows={2}
                                    placeholder="Câu trả lời"
                                    value={item.desc || ''}
                                    onChange={(e) => {
                                      const updated = [...(block.items || [])];
                                      updated[itIdx] = { ...updated[itIdx], desc: e.target.value };
                                      handleUpdateBlock(bIdx, 'items', updated);
                                    }}
                                    className="w-full text-xs border border-gray-300 rounded-xs px-2 py-1 outline-none"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 6. KHỐI KÊU GỌI CTA (CTA_BOX) */}
                        {block.type === 'cta_box' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Tiêu đề CTA
                                </label>
                                <input
                                  type="text"
                                  value={block.title || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'title', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                  Liên kết nút hành động
                                </label>
                                <input
                                  type="text"
                                  value={block.link_url || ''}
                                  onChange={(e) => handleUpdateBlock(bIdx, 'link_url', e.target.value)}
                                  className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                                  placeholder="/soan-tai-lieu hoặc /combo-thpt"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 mb-0.5">
                                Thông điệp phụ
                              </label>
                              <textarea
                                rows={2}
                                value={block.subtitle || ''}
                                onChange={(e) => handleUpdateBlock(bIdx, 'subtitle', e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-xs px-2.5 py-1.5 outline-none focus:border-[#e60049]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: KHUNG LIVE PREVIEW TRỰC QUAN (KHI SHOWPREVIEW = TRUE) */}
        {showPreview && (
          <div className="lg:col-span-6">
            <div className="sticky top-4 border border-gray-300 rounded-xs bg-gray-100 overflow-hidden shadow-sm">
              {/* THANH ĐIỀU KHIỂN VIEWPORT XEM TRƯỚC */}
              <div className="bg-gray-800 text-white px-3 py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-bold uppercase tracking-wider text-[11px]">
                    Live Preview: {activeSubTab.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Chế độ Desktop (100%)"
                    onClick={() => setPreviewViewport('desktop')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition ${
                      previewViewport === 'desktop' ? 'bg-[#e60049] text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    type="button"
                    title="Chế độ Tablet (768px)"
                    onClick={() => setPreviewViewport('tablet')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition ${
                      previewViewport === 'tablet' ? 'bg-[#e60049] text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    Tablet
                  </button>
                  <button
                    type="button"
                    title="Chế độ Mobile (375px)"
                    onClick={() => setPreviewViewport('mobile')}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-xs transition ${
                      previewViewport === 'mobile' ? 'bg-[#e60049] text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                  >
                    Mobile
                  </button>
                </div>
              </div>

              {/* KHUNG MÔ PHỎNG NỘI DUNG VIEWPORT */}
              <div className="p-3 bg-gray-200/70 overflow-x-auto flex justify-center">
                <div
                  className={`bg-white border border-gray-300 rounded-xs shadow-md transition-all duration-300 max-h-[calc(100vh-160px)] overflow-y-auto ${
                    previewViewport === 'desktop'
                      ? 'w-full'
                      : previewViewport === 'tablet'
                      ? 'w-[768px]'
                      : 'w-[375px]'
                  }`}
                >
                  {renderLivePreviewContent()}
                </div>
              </div>

              {/* THANH TRẠNG THÁI CUỐI KHUNG PREVIEW */}
              <div className="bg-gray-100 border-t border-gray-300 px-3 py-1.5 text-[10px] text-gray-500 flex items-center justify-between">
                <span>Trực tiếp từ biểu mẫu (Không cần lưu trước)</span>
                <span className="font-mono text-gray-400">
                  {previewViewport === 'desktop'
                    ? '100% Full Width'
                    : previewViewport === 'tablet'
                    ? '768px (iPad)'
                    : '375px (iPhone)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
