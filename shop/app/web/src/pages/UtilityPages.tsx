import React, { useState, useMemo } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
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
  const { siteConfigs } = useStore();
  const config: SoanTaiLieuPageConfig = useMemo(() => {
    return (
      siteConfigs?.soan_tai_lieu_page_config || {
        title: '',
        description: '',
        commitments: [],
      }
    );
  }, [siteConfigs?.soan_tai_lieu_page_config]);

  const commitments = config.commitments || [];
  const hasContent =
    Boolean(config.title?.trim()) ||
    Boolean(config.description?.trim()) ||
    commitments.length > 0;

  if (!hasContent) {
    return (
      <main className="max-w-[760px] mx-auto px-4 py-12 text-center text-xs text-gray-500">
        Nội dung đang được quản trị viên cập nhật.
      </main>
    );
  }

  return (
    <main className="max-w-[760px] mx-auto px-4 py-8 space-y-6">
      {(config.title?.trim() || config.description?.trim()) && (
        <div>
          {config.title?.trim() && (
            <h1 className="text-xl font-extrabold text-[#e60049] mb-1">
              {config.title}
            </h1>
          )}
          {config.description?.trim() && (
            <p className="text-xs text-gray-600 leading-relaxed">{config.description}</p>
          )}
        </div>
      )}

      {commitments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {commitments.map((c) => (
            <div
              key={c.id || c.title}
              className="bg-[#f8f9fa] border border-gray-200 p-3 rounded-xs space-y-1"
            >
              <div className="text-xs font-black text-[#e60049] uppercase">{c.title}</div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      )}
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
  const [faqOpen, setFaqOpen] = useState<Record<string, boolean>>({});

  const config: FaqPageConfig = useMemo(() => {
    return (
      siteConfigs?.faq_page_config || {
        title: '',
        description: '',
        faqs: [],
      }
    );
  }, [siteConfigs?.faq_page_config]);

  const faqs = config.faqs || [];
  const hasContent =
    Boolean(config.title?.trim()) ||
    Boolean(config.description?.trim()) ||
    faqs.length > 0;

  if (!hasContent) {
    return (
      <main className="max-w-[760px] mx-auto px-4 py-12 text-center text-xs text-gray-500">
        Nội dung đang được quản trị viên cập nhật.
      </main>
    );
  }

  return (
    <main className="max-w-[760px] mx-auto px-4 py-8 space-y-6">
      {(config.title?.trim() || config.description?.trim()) && (
        <div>
          {config.title?.trim() && (
            <h1 className="text-xl font-extrabold text-[#e60049] mb-1">
              {config.title}
            </h1>
          )}
          {config.description?.trim() && (
            <p className="text-xs text-gray-600">{config.description}</p>
          )}
        </div>
      )}

      {faqs.length > 0 && (
        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const key = faq.id || String(idx);
            const isOpen = Boolean(faqOpen[key]);
            return (
              <div
                key={key}
                className="border border-gray-200 bg-white rounded-xs overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setFaqOpen((prev) => ({
                      ...prev,
                      [key]: !prev[key],
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
      )}
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
        title: 'Điều khoản sử dụng',
        description: '',
        sections: [],
      }
    );
  }, [siteConfigs?.terms_page_config]);

  return (
    <PolicyPageRenderer
      config={{
        title: config.title,
        description: config.description,
        sections: config.sections,
        render_mode: config.render_mode,
        blocks: config.blocks,
      }}
    />
  );
};

/**
 * ============================================================================
 * 4. TRANG TÍCH ĐIỂM THÀNH VIÊN HC REWARDS (/hc-rewards)
 * ============================================================================
 */
export const HcRewardsPage: React.FC = () => {
  const { siteConfigs } = useStore();
  const config: HcRewardsPageConfig = useMemo(() => {
    return (
      siteConfigs?.hc_rewards_page_config || {
        title: '',
        description: '',
        benefits: [],
      }
    );
  }, [siteConfigs?.hc_rewards_page_config]);

  const benefits = config.benefits || [];
  const hasContent =
    Boolean(config.title?.trim()) ||
    Boolean(config.description?.trim()) ||
    benefits.length > 0;

  if (!hasContent) {
    return (
      <main className="max-w-[760px] mx-auto px-4 py-12 text-center text-xs text-gray-500">
        Nội dung đang được quản trị viên cập nhật.
      </main>
    );
  }

  return (
    <main className="max-w-[760px] mx-auto px-4 py-8 space-y-6">
      {(config.title?.trim() || config.description?.trim()) && (
        <div>
          {config.title?.trim() && (
            <h1 className="text-xl font-extrabold text-[#e60049] mb-1">
              {config.title}
            </h1>
          )}
          {config.description?.trim() && (
            <p className="text-xs text-gray-600">{config.description}</p>
          )}
        </div>
      )}

      {benefits.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {benefits.map((b, idx) => (
            <div
              key={b.id || idx}
              className="bg-white border border-gray-200 p-3 rounded-xs space-y-1"
            >
              <div className="text-xs font-black text-[#e60049] uppercase">{b.title}</div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      )}
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
        title: '',
        message: '',
        bank_name: '',
        account_number: '',
        account_holder: '',
        default_amount: 0,
      }
    );
  }, [siteConfigs?.donate_page_config]);

  const hasBankInfo = Boolean(config.bank_name?.trim() && config.account_number?.trim());
  const hasContent =
    Boolean(config.title?.trim()) ||
    Boolean(config.message?.trim()) ||
    hasBankInfo;

  const dynamicQrUrl = useMemo(() => {
    if (!config.bank_name?.trim() || !config.account_number?.trim()) return '';
    const bank = encodeURIComponent(config.bank_name.trim());
    const acc = encodeURIComponent(config.account_number.trim());
    const amount = config.default_amount || 0;
    const des = encodeURIComponent('UNG HO HUY TUTOR');
    return `https://qr.sepay.vn/img?bank=${bank}&acc=${acc}&template=compact2&amount=${amount}&des=${des}`;
  }, [config.bank_name, config.account_number, config.default_amount]);

  if (!hasContent) {
    return (
      <main className="max-w-[500px] mx-auto px-4 py-12 text-center text-xs text-gray-500">
        Nội dung đang được quản trị viên cập nhật.
      </main>
    );
  }

  return (
    <main className="max-w-[500px] mx-auto px-4 py-8 space-y-4 text-center">
      {config.title?.trim() && (
        <h1 className="text-xl font-extrabold text-[#e60049]">{config.title}</h1>
      )}
      {config.message?.trim() && (
        <p className="text-xs text-gray-600 leading-relaxed">{config.message}</p>
      )}

      {hasBankInfo && (
        <div className="bg-white border border-gray-200 p-4 rounded-xs shadow-xs space-y-2">
          {dynamicQrUrl && (
            <img
              src={dynamicQrUrl}
              alt="VietQR"
              className="w-40 h-40 object-contain mx-auto border border-gray-200 p-1"
            />
          )}
          <div className="text-xs text-gray-700">
            <p>
              Ngân hàng: <strong>{config.bank_name}</strong>
            </p>
            <p>
              Số TK: <strong className="text-[#e60049]">{config.account_number}</strong>
            </p>
            {config.account_holder && (
              <p>
                Chủ TK: <strong>{config.account_holder}</strong>
              </p>
            )}
          </div>
        </div>
      )}
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
  description: '',
  last_updated: '',
  sections: [],
};

export const DEFAULT_REFUND_POLICY_CONFIG: PolicyPageConfig = {
  title: 'Chính sách hoàn tiền & Đổi trả tài liệu',
  description: '',
  last_updated: '',
  sections: [],
};

export const DEFAULT_COPYRIGHT_POLICY_CONFIG: PolicyPageConfig = {
  title: 'Chính sách bản quyền & Sở hữu trí tuệ',
  description: '',
  last_updated: '',
  sections: [],
};

/**
 * ============================================================================
 * COMPONENT RENDERER TỔNG QUÁT CHO CÁC TRANG CHÍNH SÁCH
 * ============================================================================
 */
export const PolicyPageRenderer: React.FC<{ config: PolicyPageConfig }> = ({ config }) => {
  const { siteConfigs } = useStore();
  const biz = siteConfigs?.business_info;
  const hasBiz = Boolean(biz && (biz.company_name || biz.address || biz.phone || biz.email));

  // Hỗ trợ chế độ Khối (blocks): Tùy biến linh hoạt giao diện chính sách
  if (config.render_mode === 'blocks' && Array.isArray(config.blocks) && config.blocks.length > 0) {
    return (
      <CustomPageRenderer
        page={{
          id: 'policy_block_page',
          title: config.title,
          slug: '',
          meta_description: config.description,
          is_active: true,
          blocks: config.blocks,
        }}
      />
    );
  }

  return (
    <main className="max-w-[800px] mx-auto px-4 py-10 space-y-8">
      {/* HEADER KHỐI */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-black text-[#e60049] uppercase tracking-wide mb-2">
          {config.title}
        </h1>
        {config.description && (
          <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
            {config.description}
          </p>
        )}
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

      {/* FOOTER HỖ TRỢ CHUNG CỦA CHÍNH SÁCH (Động từ siteConfigs.business_info) */}
      {hasBiz && (
        <div className="bg-[#f8f9fa] border border-gray-200 p-4 rounded-xs text-xs text-gray-700 space-y-1 text-center">
          {biz?.company_name && (
            <p className="font-bold text-[#e60049] uppercase">{biz.company_name}</p>
          )}
          {(biz?.address || biz?.phone) && (
            <p>
              {biz?.address ? `Địa chỉ: ${biz.address}` : ''}
              {biz?.address && biz?.phone ? ' | ' : ''}
              {biz?.phone ? `Zalo hỗ trợ: ${biz.phone}` : ''}
            </p>
          )}
          {biz?.email && <p>Email: {biz.email}</p>}
        </div>
      )}
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
 * 11. ĐIỀU HƯỚNG TƯƠNG THÍCH NGƯỢC (/p/:slug -> /:slug tại root)
 * ============================================================================
 */
export const CustomDynamicPageView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  if (slug) {
    return <Navigate to={`/${slug}`} replace />;
  }
  return <Navigate to="/" replace />;
};
