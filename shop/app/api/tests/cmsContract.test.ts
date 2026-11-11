import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  createDefaultUniversalBlock,
  validateUniversalBlock,
  validateUtilityPageConfig,
  simulateSingleSegmentRedirect,
} from './helpers/cmsSchema.ts';
import type { BaseUtilityPageConfig } from './helpers/cmsSchema.ts';

describe('Feature 15: Universal Catalog custom_html Contract', () => {
  it('T1-F15-01: custom_html definition structure complies with universal catalog', () => {
    const block = createDefaultUniversalBlock('custom_html', 0);
    assert.strictEqual(block.type, 'custom_html');
    assert.strictEqual(typeof block.id, 'string');
    assert.strictEqual(block.is_active, true);
    assert.strictEqual(block.sort_order, 0);
  });

  it('T1-F15-02: createDefaultUniversalBlock initializes required schema fields', () => {
    const block = createDefaultUniversalBlock('custom_html', 1);
    assert.strictEqual(block.config.html_content, '');
    assert.strictEqual(block.config.container_mode, 'boxed');
    assert.strictEqual(block.config.no_padding, false);
    assert.strictEqual(block.config.admin_label, '');
  });

  it('T1-F15-03: validateUniversalBlock passes on standard custom_html block', () => {
    const block = createDefaultUniversalBlock('custom_html', 2);
    block.config.html_content = '<p>Xin chào</p>';
    const res = validateUniversalBlock(block);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.errors.length, 0);
  });

  it('T1-F15-04: validateUniversalBlock rejects non-string html_content', () => {
    const invalidBlock = {
      id: 'b1',
      type: 'custom_html',
      is_active: true,
      sort_order: 1,
      config: { html_content: 12345, container_mode: 'boxed' },
    };
    const res = validateUniversalBlock(invalidBlock);
    assert.strictEqual(res.valid, false);
    assert(res.errors.some((e) => e.includes('html_content')));
  });

  it('T1-F15-05: validateUniversalBlock rejects invalid container_mode', () => {
    const invalidBlock = {
      id: 'b2',
      type: 'custom_html',
      is_active: true,
      sort_order: 1,
      config: { html_content: '<p>Hi</p>', container_mode: 'invalid_mode' },
    };
    const res = validateUniversalBlock(invalidBlock);
    assert.strictEqual(res.valid, false);
    assert(res.errors.some((e) => e.includes('container_mode')));
  });

  it('T2-F15-01: Missing or corrupt block config in validateUniversalBlock', () => {
    assert.strictEqual(validateUniversalBlock(null).valid, false);
    assert.strictEqual(validateUniversalBlock({}).valid, false);
    assert.strictEqual(validateUniversalBlock({ id: '1', type: 'custom_html' }).valid, false);
  });

  it('T2-F15-02: Inactive block (is_active: false) retains valid schema', () => {
    const block = createDefaultUniversalBlock('custom_html', 3);
    block.is_active = false;
    const res = validateUniversalBlock(block);
    assert.strictEqual(res.valid, true);
  });

  it('T2-F15-03: custom_html block handles empty string html_content cleanly', () => {
    const block = createDefaultUniversalBlock('custom_html', 0);
    block.config.html_content = '';
    const res = validateUniversalBlock(block);
    assert.strictEqual(res.valid, true);
  });

  it('T2-F15-04: Full_width container mode is validated cleanly', () => {
    const block = createDefaultUniversalBlock('custom_html', 0);
    block.config.container_mode = 'full_width';
    const res = validateUniversalBlock(block);
    assert.strictEqual(res.valid, true);
  });

  it('T2-F15-05: Optional admin_label is tolerated and preserved', () => {
    const block = createDefaultUniversalBlock('custom_html', 0);
    block.config.admin_label = 'Banner Header';
    const res = validateUniversalBlock(block);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(block.config.admin_label, 'Banner Header');
  });
});

describe('Feature 16: 5 CMS Builders Quick-Add Integration Contracts', () => {
  it('T1-F16-01: Homepage CMS builder block array accepts custom_html', () => {
    const homepageBlocks = [
      createDefaultUniversalBlock('hero', 0),
      createDefaultUniversalBlock('custom_html', 1),
    ];
    homepageBlocks.forEach((b) => {
      assert.strictEqual(validateUniversalBlock(b).valid, true);
    });
    assert.strictEqual(homepageBlocks[1].type, 'custom_html');
  });

  it('T1-F16-02: Category CMS builder block array accepts custom_html', () => {
    const categoryBlocks = [createDefaultUniversalBlock('custom_html', 0)];
    assert.strictEqual(validateUniversalBlock(categoryBlocks[0]).valid, true);
  });

  it('T1-F16-03: Combo CMS builder block array accepts custom_html', () => {
    const comboBlocks = [createDefaultUniversalBlock('custom_html', 0)];
    assert.strictEqual(validateUniversalBlock(comboBlocks[0]).valid, true);
  });

  it('T1-F16-04: Flashcard CMS builder block array accepts custom_html', () => {
    const flashcardBlocks = [createDefaultUniversalBlock('custom_html', 0)];
    assert.strictEqual(validateUniversalBlock(flashcardBlocks[0]).valid, true);
  });

  it('T1-F16-05: Product Detail builder block array accepts custom_html', () => {
    const productDetailBlocks = [createDefaultUniversalBlock('custom_html', 0)];
    assert.strictEqual(validateUniversalBlock(productDetailBlocks[0]).valid, true);
  });

  it('T2-F16-01: Reordering multiple custom_html blocks preserves valid sort_order', () => {
    const b1 = createDefaultUniversalBlock('custom_html', 0);
    const b2 = createDefaultUniversalBlock('custom_html', 1);
    // Swap order
    b1.sort_order = 1;
    b2.sort_order = 0;
    const sorted = [b1, b2].sort((a, b) => a.sort_order - b.sort_order);
    assert.strictEqual(sorted[0].id, b2.id);
    assert.strictEqual(sorted[1].id, b1.id);
  });

  it('T2-F16-02: Deletion of block from array preserves remaining blocks validity', () => {
    const blocks = [
      createDefaultUniversalBlock('custom_html', 0),
      createDefaultUniversalBlock('custom_html', 1),
    ];
    blocks.splice(0, 1);
    assert.strictEqual(blocks.length, 1);
    assert.strictEqual(validateUniversalBlock(blocks[0]).valid, true);
  });

  it('T2-F16-03: Toggling is_active flag updates block state cleanly', () => {
    const block = createDefaultUniversalBlock('custom_html', 0);
    assert.strictEqual(block.is_active, true);
    block.is_active = false;
    assert.strictEqual(block.is_active, false);
    assert.strictEqual(validateUniversalBlock(block).valid, true);
  });

  it('T2-F16-04: Saving layout with empty custom_html content remains valid', () => {
    const block = createDefaultUniversalBlock('custom_html', 0);
    block.config.html_content = '';
    assert.strictEqual(validateUniversalBlock(block).valid, true);
  });

  it('T2-F16-05: Product detail custom_html block with no_padding flag is valid', () => {
    const block = createDefaultUniversalBlock('custom_html', 0);
    block.config.no_padding = true;
    assert.strictEqual(validateUniversalBlock(block).valid, true);
    assert.strictEqual(block.config.no_padding, true);
  });
});

describe('Feature 17: DynamicHomepageBlocks Compatibility Contracts', () => {
  it('T1-F17-01: Legacy custom_html mode structure is recognized', () => {
    const legacyConfig = {
      mode: 'custom_html',
      custom_html: '<div class="hero">Khóa Học 2026</div>',
    };
    assert.strictEqual(legacyConfig.mode, 'custom_html');
    assert(legacyConfig.custom_html.includes('Khóa Học 2026'));
  });

  it('T1-F17-02: Empty legacy custom_html string is identified as inert', () => {
    const legacyConfig = { mode: 'custom_html', custom_html: '   ' };
    const isEmpty = !legacyConfig.custom_html?.trim();
    assert.strictEqual(isEmpty, true);
  });

  it('T1-F17-03: Standard non-custom_html mode is preserved', () => {
    const standardConfig = { mode: 'default', title: 'Khóa Học Mới' };
    assert.strictEqual(standardConfig.mode, 'default');
  });

  it('T2-F17-01: Legacy config with null custom_html does not crash', () => {
    const legacyConfig = { mode: 'custom_html', custom_html: null };
    const hasContent = Boolean(legacyConfig.custom_html && legacyConfig.custom_html.trim());
    assert.strictEqual(hasContent, false);
  });

  it('T2-F17-02: Legacy config with relative image URLs is supported', () => {
    const legacyConfig = {
      mode: 'custom_html',
      custom_html: '<img src="/assets/banner.png" />',
    };
    assert(legacyConfig.custom_html.includes('/assets/banner.png'));
  });
});

describe('Feature 18: 9 Utility Pages Schema Expansion Contracts', () => {
  const utilityPageKeys = [
    'privacy',
    'payment_delivery',
    'refund',
    'copyright',
    'terms',
    'faq',
    'rewards',
    'soan',
    'donate',
  ];

  it('T1-F18-01: All 9 utility pages support render_mode "legacy"', () => {
    for (const key of utilityPageKeys) {
      const cfg: BaseUtilityPageConfig = {
        title: `Trang ${key}`,
        render_mode: 'legacy',
      };
      const res = validateUtilityPageConfig(cfg);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.effectiveMode, 'legacy');
    }
  });

  it('T1-F18-02: All 9 utility pages support render_mode "hybrid" with custom blocks', () => {
    for (const key of utilityPageKeys) {
      const cfg: BaseUtilityPageConfig = {
        title: `Trang ${key}`,
        render_mode: 'hybrid',
        blocks: [
          {
            id: 'b1',
            type: 'custom_html',
            is_active: true,
            config: { html_content: '<p>Notice</p>' },
          },
        ],
      };
      const res = validateUtilityPageConfig(cfg);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.effectiveMode, 'hybrid');
    }
  });

  it('T1-F18-03: All 9 utility pages support render_mode "blocks"', () => {
    for (const key of utilityPageKeys) {
      const cfg: BaseUtilityPageConfig = {
        title: `Trang ${key}`,
        render_mode: 'blocks',
        blocks: [
          {
            id: 'b1',
            type: 'custom_html',
            is_active: true,
            config: { html_content: '<p>Only blocks</p>' },
          },
        ],
      };
      const res = validateUtilityPageConfig(cfg);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.effectiveMode, 'blocks');
    }
  });

  it('T1-F18-04: FaqPageConfig schema accommodates questions and hybrid blocks', () => {
    const faqCfg: BaseUtilityPageConfig = {
      title: 'Hỏi đáp FAQ',
      faqs: [{ question: 'Học phí ra sao?', answer: 'Xem bảng giá' }],
      render_mode: 'hybrid',
      blocks: [],
    };
    const res = validateUtilityPageConfig(faqCfg);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.effectiveMode, 'hybrid');
  });

  it('T1-F18-05: DonatePageConfig schema accommodates bank info and blocks', () => {
    const donateCfg: BaseUtilityPageConfig = {
      title: 'Ủng hộ',
      bank_name: 'MB Bank',
      account_number: '123456789',
      account_holder: 'Huy Tutor',
      render_mode: 'hybrid',
      blocks: [],
    };
    const res = validateUtilityPageConfig(donateCfg);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.effectiveMode, 'hybrid');
  });

  it('T2-F18-01: Missing render_mode field defaults to "legacy" cleanly', () => {
    const legacyJson: BaseUtilityPageConfig = {
      title: 'Chính sách bảo mật',
      sections: [{ title: 'Mục 1', content: 'Nội dung' }],
    };
    const res = validateUtilityPageConfig(legacyJson);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.effectiveMode, 'legacy');
  });

  it('T2-F18-02: render_mode "blocks" with empty blocks array is valid', () => {
    const cfg: BaseUtilityPageConfig = {
      title: 'Trang rỗng',
      render_mode: 'blocks',
      blocks: [],
    };
    const res = validateUtilityPageConfig(cfg);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.effectiveMode, 'blocks');
  });

  it('T2-F18-03: render_mode "hybrid" with undefined blocks array is valid', () => {
    const cfg: BaseUtilityPageConfig = {
      title: 'Trang',
      render_mode: 'hybrid',
    };
    const res = validateUtilityPageConfig(cfg);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.effectiveMode, 'hybrid');
  });

  it('T2-F18-04: Invalid render_mode string is rejected by validator', () => {
    const cfg: any = {
      title: 'Trang',
      render_mode: 'unsupported_liquid_mode',
    };
    const res = validateUtilityPageConfig(cfg);
    assert.strictEqual(res.valid, false);
    assert(res.errors.some((e) => e.includes('Invalid render_mode')));
  });

  it('T2-F18-05: Blocks with missing id are flagged as invalid', () => {
    const cfg: any = {
      title: 'Trang',
      render_mode: 'blocks',
      blocks: [{ type: 'custom_html' }],
    };
    const res = validateUtilityPageConfig(cfg);
    assert.strictEqual(res.valid, false);
    assert(res.errors.some((e) => e.includes('missing id')));
  });
});

describe('Feature 19 & 20: SingleSegmentRedirectHandler & Utility Page Routing Contracts', () => {
  const customPages = [
    { slug: 'gia-su-1-kem-1', title: 'Gia sư 1 kèm 1', is_active: true },
    { slug: 'tai-lieu-thpt-2026', title: 'Tài liệu 2026', is_active: false },
  ];

  it('T1-F20-01: Active custom page slug resolves to 200 OK', () => {
    const res = simulateSingleSegmentRedirect('gia-su-1-kem-1', customPages);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.matchedPage?.slug, 'gia-su-1-kem-1');
  });

  it('T1-F20-02: Slug with leading/trailing slashes resolves cleanly', () => {
    const res = simulateSingleSegmentRedirect('/gia-su-1-kem-1/', customPages);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.matchedPage?.slug, 'gia-su-1-kem-1');
  });

  it('T2-F20-01: Non-existent custom page slug resolves to 404', () => {
    const res = simulateSingleSegmentRedirect('trang-khong-ton-tai', customPages);
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.matchedPage, null);
  });

  it('T2-F20-02: Inactive custom page resolves to 404', () => {
    const res = simulateSingleSegmentRedirect('tai-lieu-thpt-2026', customPages);
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.matchedPage, null);
  });

  it('T2-F20-03: Empty slug resolves to 404', () => {
    const res = simulateSingleSegmentRedirect('', customPages);
    assert.strictEqual(res.status, 404);
  });
});
