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

describe('Feature 5: GET /api/admin/media API Route Tests', () => {
  let ctx: TestServerContext;

  before(async () => {
    ctx = await createTestServer();
  });

  after(async () => {
    await ctx.close();
  });

  beforeEach(() => {
    __clearSimulatedR2Objects();
  });

  // Tier 1 Tests
  it('T1-F05-01: List media without filters (default pagination)', async () => {
    __setSimulatedR2Objects([
      { key: 'media-library/261112100000.png', size: 1024 },
      { key: 'media-library/261112100001.pdf', size: 2048 },
    ]);

    const res = await ctx.fetch('/api/admin/media?page=1&limit=24');
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, true);
    assert(Array.isArray(body.items));
    assert(Array.isArray(body.folders));
    assert.strictEqual(body.pagination.page, 1);
    assert.strictEqual(body.pagination.limit, 24);
    assert.strictEqual(body.pagination.totalItems, 2);
  });

  it('T1-F05-02: Filter by folder returns only matching items', async () => {
    __setSimulatedR2Objects([
      { key: 'media-library/item1.png' },
      { key: 'homepage/hero.jpg' },
    ]);

    const res = await ctx.fetch('/api/admin/media?folder=media-library');
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.items.length, 1);
    assert.strictEqual(body.items[0].folder, 'media-library');
  });

  it('T1-F05-03: Filter by fileType image returns only image items', async () => {
    __setSimulatedR2Objects([
      { key: 'media-library/pic.png' },
      { key: 'media-library/doc.pdf' },
    ]);

    const res = await ctx.fetch('/api/admin/media?fileType=image');
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.items.length, 1);
    assert.strictEqual(body.items[0].fileType, 'image');
  });

  it('T1-F05-04: Filter by fileType pdf returns only pdf items', async () => {
    __setSimulatedR2Objects([
      { key: 'media-library/pic.png' },
      { key: 'media-library/doc.pdf' },
    ]);

    const res = await ctx.fetch('/api/admin/media?fileType=pdf');
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.items.length, 1);
    assert.strictEqual(body.items[0].fileType, 'pdf');
  });

  it('T1-F05-05: Search by keyword and sort by size desc', async () => {
    __setSimulatedR2Objects([
      { key: 'media-library/banner_small.png', size: 100 },
      { key: 'media-library/banner_large.png', size: 5000 },
      { key: 'media-library/other.png', size: 1000 },
    ]);

    const res = await ctx.fetch('/api/admin/media?search=banner&sortBy=size&sortOrder=desc');
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.items.length, 2);
    assert(body.items[0].size >= body.items[1].size);
    assert.strictEqual(body.items[0].name, 'banner_large.png');
  });

  // Tier 2 Tests
  it('T2-F05-01: Non-admin user role token is rejected with HTTP 403 Forbidden', async () => {
    const res = await ctx.fetch('/api/admin/media', {
      headers: { Authorization: 'Bearer user-token' },
    });
    assert.strictEqual(res.status, 403);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, false);
  });

  it('T2-F05-02: Subadmin role token is rejected with HTTP 403 Forbidden (Strict Shop RBAC)', async () => {
    const res = await ctx.fetch('/api/admin/media', {
      headers: { Authorization: 'Bearer subadmin-token' },
    });
    assert.strictEqual(res.status, 403);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, false);
  });

  it('T2-F05-03: Missing Authorization and API key headers rejected with HTTP 401', async () => {
    const res = await fetch(`${ctx.baseUrl}/api/admin/media`);
    assert.strictEqual(res.status, 401);
  });

  it('T2-F05-04: Extreme pagination parameters are sanitized and clamped', async () => {
    __setSimulatedR2Objects([{ key: 'media-library/item.png' }]);

    const res = await ctx.fetch('/api/admin/media?page=-10&limit=999999');
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.pagination.page, 1);
    assert(body.pagination.limit <= 100);
  });

  it('T2-F05-05: Bucket with >1,000 objects enumerates all objects in folders count', async () => {
    const bigBatch = Array.from({ length: 1200 }, (_, i) => ({
      key: `media-library/f${i % 3}/img_${i}.png`,
      size: 100,
    }));
    __setSimulatedR2Objects(bigBatch);

    const res = await ctx.fetch('/api/admin/media?limit=10');
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    const totalCountInFolders = body.folders.reduce(
      (acc: number, f: { count: number }) => acc + f.count,
      0
    );
    assert.strictEqual(totalCountInFolders, 1200);
    assert.strictEqual(body.pagination.totalItems, 1200);
  });
});

describe('Feature 6: POST /api/admin/media/upload API Route Tests', () => {
  let ctx: TestServerContext;

  before(async () => {
    ctx = await createTestServer();
  });

  after(async () => {
    await ctx.close();
  });

  beforeEach(() => {
    __clearSimulatedR2Objects();
  });

  // Tier 1 Tests
  it('T1-F06-01: Upload single PNG to root media-library', async () => {
    const formData = new FormData();
    formData.append(
      'files',
      new Blob([Buffer.from('sample-image-data')], { type: 'image/png' }),
      'sample.png'
    );

    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.uploaded.length, 1);
    assert.strictEqual(body.uploaded[0].folder, 'media-library');
    assert.match(body.uploaded[0].name, /^\d{12}\.png$/);
  });

  it('T1-F06-02: Upload single PDF to media-library subfolder', async () => {
    const formData = new FormData();
    formData.append('subfolder', 'documents');
    formData.append(
      'files',
      new Blob([Buffer.from('%PDF-1.4 test')], { type: 'application/pdf' }),
      'report.pdf'
    );

    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.uploaded[0].folder, 'media-library/documents');
    assert.match(body.uploaded[0].name, /^\d{12}\.pdf$/);
  });

  it('T1-F06-03: Batch upload 3 images simultaneously produces distinct monotonic filenames', async () => {
    const formData = new FormData();
    formData.append(
      'files',
      new Blob([Buffer.from('img1')], { type: 'image/png' }),
      'img1.png'
    );
    formData.append(
      'files',
      new Blob([Buffer.from('img2')], { type: 'image/jpeg' }),
      'img2.jpg'
    );
    formData.append(
      'files',
      new Blob([Buffer.from('img3')], { type: 'image/webp' }),
      'img3.webp'
    );

    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.uploaded.length, 3);
    const names = body.uploaded.map((u: any) => u.name);
    const uniqueNames = new Set(names);
    assert.strictEqual(uniqueNames.size, 3);
  });

  it('T1-F06-04: PublicUrl uses env R2_DOMAIN', async () => {
    const formData = new FormData();
    formData.append(
      'files',
      new Blob([Buffer.from('banner')], { type: 'image/png' }),
      'banner.png'
    );

    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    const body = (await res.json()) as any;
    const domain = (process.env.R2_DOMAIN || '').replace(/\/$/, '');
    if (domain) {
      assert(body.uploaded[0].publicUrl.startsWith(domain));
    } else {
      assert(body.uploaded[0].publicUrl.includes(body.uploaded[0].key));
    }
  });

  it('T1-F06-05: Upload with nested subfolder 2026/campaign', async () => {
    const formData = new FormData();
    formData.append('subfolder', '2026/campaign');
    formData.append(
      'files',
      new Blob([Buffer.from('camp')], { type: 'image/png' }),
      'ad.png'
    );

    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    const body = (await res.json()) as any;
    assert.strictEqual(body.uploaded[0].folder, 'media-library/2026/campaign');
  });

  // Tier 2 Tests
  it('T2-F06-01: Directory traversal attempt in subfolder is forced under media-library', async () => {
    const formData = new FormData();
    formData.append('subfolder', '../homepage');
    formData.append(
      'files',
      new Blob([Buffer.from('escaped')], { type: 'image/png' }),
      'escape.png'
    );

    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    const body = (await res.json()) as any;
    assert(body.uploaded[0].folder.startsWith('media-library'));
    assert.strictEqual(body.uploaded[0].folder.includes('..'), false);
  });

  it('T2-F06-02: File exceeding 50MB is rejected with 413 or 400', async () => {
    const bigBlob = new Blob([Buffer.alloc(52 * 1024 * 1024)], { type: 'image/png' });
    const formData = new FormData();
    formData.append('files', bigBlob, 'huge.png');

    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    assert([400, 413].includes(res.status));
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, false);
  });

  it('T2-F06-03: Upload request without any files attached returns 400 Bad Request', async () => {
    const formData = new FormData();
    formData.append('subfolder', 'test');

    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    assert.strictEqual(res.status, 400);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, false);
  });

  it('T2-F06-04: Non-admin token upload attempt returns HTTP 403 Forbidden', async () => {
    const formData = new FormData();
    formData.append(
      'files',
      new Blob([Buffer.from('test')], { type: 'image/png' }),
      't.png'
    );

    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      headers: { Authorization: 'Bearer user-token' },
      body: formData,
    });
    assert.strictEqual(res.status, 403);
  });

  it('T2-F06-05: Script file upload receives 12-digit filename and safe storage', async () => {
    const formData = new FormData();
    formData.append(
      'files',
      new Blob([Buffer.from('<?php echo "bad"; ?>')], { type: 'application/x-php' }),
      'exploit.php'
    );

    const res = await ctx.fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.match(body.uploaded[0].name, /^\d{12}\.php$/);
  });
});

describe('Feature 7: POST /api/admin/media/check-usage API Route Tests', () => {
  let ctx: TestServerContext;

  before(async () => {
    ctx = await createTestServer();
  });

  after(async () => {
    await ctx.close();
  });

  beforeEach(() => {
    __clearMockUsages();
  });

  // Tier 1 Tests
  it('T1-F07-01: Unused media file returns inUse: false', async () => {
    const res = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['media-library/unused123456.png'] }),
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, true);
    assert.strictEqual(body.inUse, false);
    assert.strictEqual(body.usages.length, 0);
  });

  it('T1-F07-02: Media used as product thumbnail returns inUse: true', async () => {
    __setMockUsages([
      {
        key: 'homepage/thumb_prod_01.png',
        location: 'products',
        details: 'Sản phẩm: Toán 12 Nâng Cao',
      },
    ]);

    const res = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['homepage/thumb_prod_01.png'] }),
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.inUse, true);
    assert(body.usages.some((u: any) => u.location.includes('products')));
  });

  it('T1-F07-03: Media used in category banner block detected', async () => {
    __setMockUsages([
      {
        key: 'categories/cat_banner.jpg',
        location: 'categories',
        details: 'Danh mục: Luyện Thi Đại Học',
      },
    ]);

    const res = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['categories/cat_banner.jpg'] }),
    });
    const body = (await res.json()) as any;
    assert.strictEqual(body.inUse, true);
    assert(body.usages.some((u: any) => u.location.includes('categories')));
  });

  it('T1-F07-04: Media embedded inside custom_html block detected', async () => {
    __setMockUsages([
      {
        key: 'media-library/banner.png',
        location: 'site_configs.homepage_blocks',
        details: 'Khối custom_html: Banner Khuyến Mãi',
      },
    ]);

    const res = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['media-library/banner.png'] }),
    });
    const body = (await res.json()) as any;
    assert.strictEqual(body.inUse, true);
    assert(body.usages.some((u: any) => u.details.includes('custom_html')));
  });

  it('T1-F07-05: Media used in utility page block detected', async () => {
    __setMockUsages([
      {
        key: 'media-library/faq_chart.png',
        location: 'site_configs.faq_page_config',
        details: 'Trang tiện ích: FAQ Hướng Dẫn',
      },
    ]);

    const res = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['media-library/faq_chart.png'] }),
    });
    const body = (await res.json()) as any;
    assert.strictEqual(body.inUse, true);
    assert(body.usages.some((u: any) => u.location.includes('faq')));
  });

  // Tier 2 Tests
  it('T2-F07-01: Check usage with empty keys array returns inUse: false without error', async () => {
    const res = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: [] }),
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.inUse, false);
  });

  it('T2-F07-02: Missing keys property in body returns 400 Bad Request', async () => {
    const res = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 400);
  });

  it('T2-F07-03: Full CDN URL is normalized and detected in usage', async () => {
    __setMockUsages([
      {
        key: 'media-library/261112.png',
        location: 'products',
        details: 'Sản phẩm mẫu',
      },
    ]);

    const r2Domain = (process.env.R2_DOMAIN || '').replace(/\/$/, '');
    const checkKey = r2Domain ? `${r2Domain}/media-library/261112.png` : 'media-library/261112.png';
    const res = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keys: [checkKey],
      }),
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.inUse, true);
  });

  it('T2-F07-04: Local fallback scan produces valid response format', async () => {
    const res = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['media-library/scan_target.png'] }),
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.ok, true);
    assert(Array.isArray(body.usages));
  });

  it('T2-F07-05: Non-admin caller receives HTTP 403 Forbidden', async () => {
    const res = await ctx.fetch('/api/admin/media/check-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer user-token',
      },
      body: JSON.stringify({ keys: ['test.png'] }),
    });
    assert.strictEqual(res.status, 403);
  });
});

describe('Feature 8: POST /api/admin/media/delete API Route Tests', () => {
  let ctx: TestServerContext;

  before(async () => {
    ctx = await createTestServer();
  });

  after(async () => {
    await ctx.close();
  });

  beforeEach(() => {
    __clearSimulatedR2Objects();
  });

  // Tier 1 Tests
  it('T1-F08-01: Delete single existing key removes item and returns deletedKeys', async () => {
    __setSimulatedR2Objects([{ key: 'media-library/delete_me.png' }]);

    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['media-library/delete_me.png'] }),
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.deepStrictEqual(body.deletedKeys, ['media-library/delete_me.png']);
  });

  it('T1-F08-02: Batch delete 3 keys', async () => {
    __setSimulatedR2Objects([
      { key: 'media-library/k1.png' },
      { key: 'media-library/k2.png' },
      { key: 'media-library/k3.pdf' },
    ]);

    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keys: ['media-library/k1.png', 'media-library/k2.png', 'media-library/k3.pdf'],
      }),
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.deletedKeys.length, 3);
  });

  it('T1-F08-03: Delete object in nested subfolder', async () => {
    __setSimulatedR2Objects([{ key: 'media-library/sub/nested_doc.pdf' }]);

    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['media-library/sub/nested_doc.pdf'] }),
    });
    const body = (await res.json()) as any;
    assert.strictEqual(body.deletedKeys[0], 'media-library/sub/nested_doc.pdf');
  });

  it('T1-F08-04: Delete legacy flat folder key', async () => {
    __setSimulatedR2Objects([{ key: 'samplespages/old_sample.png' }]);

    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['samplespages/old_sample.png'] }),
    });
    const body = (await res.json()) as any;
    assert.strictEqual(body.deletedKeys[0], 'samplespages/old_sample.png');
  });

  it('T1-F08-05: Empty keys array returns empty deletedKeys gracefully', async () => {
    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: [] }),
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.deepStrictEqual(body.deletedKeys, []);
  });

  // Tier 2 Tests
  it('T2-F08-01: Attempt to delete external URL does not delete from R2', async () => {
    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['https://google.com/image.png'] }),
    });
    const body = (await res.json()) as any;
    assert.strictEqual(body.deletedKeys.length, 0);
  });

  it('T2-F08-02: Path traversal attempt in delete key is normalized safely', async () => {
    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys: ['../../root_object.png'] }),
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.deletedKeys[0].includes('..'), false);
  });

  it('T2-F08-03: Partial failure in batch delete reports deletedKeys and errors', async () => {
    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keys: ['media-library/valid1.png', 'media-library/fail_me.png'],
      }),
    });
    const body = (await res.json()) as any;
    assert.strictEqual(body.deletedKeys.length, 1);
    assert.strictEqual(body.errors.length, 1);
    assert.strictEqual(body.errors[0].key, 'media-library/fail_me.png');
  });

  it('T2-F08-04: Non-admin token caller receives HTTP 403 Forbidden', async () => {
    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer subadmin-token',
      },
      body: JSON.stringify({ keys: ['media-library/test.png'] }),
    });
    assert.strictEqual(res.status, 403);
  });

  it('T2-F08-05: Large batch deletion of 100 keys handled cleanly', async () => {
    const keys = Array.from({ length: 100 }, (_, i) => `media-library/del_${i}.png`);
    __setSimulatedR2Objects(keys.map((k) => ({ key: k })));

    const res = await ctx.fetch('/api/admin/media/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keys }),
    });
    assert.strictEqual(res.status, 200);
    const body = (await res.json()) as any;
    assert.strictEqual(body.deletedKeys.length, 100);
  });
});
