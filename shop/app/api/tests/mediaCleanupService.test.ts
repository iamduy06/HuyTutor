import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import {
  createTestServer,
  __setSimulatedR2Objects,
  __clearSimulatedR2Objects,
} from './helpers/testServer.ts';
import type { TestServerContext } from './helpers/testServer.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiRoot = path.resolve(__dirname, '..');
const distServicePath = path.resolve(apiRoot, 'dist', 'services', 'mediaCleanupService.js');
const srcServicePath = path.resolve(apiRoot, 'src', 'services', 'mediaCleanupService.ts');

if (
  !fs.existsSync(distServicePath) ||
  (fs.existsSync(srcServicePath) && fs.statSync(srcServicePath).mtimeMs > fs.statSync(distServicePath).mtimeMs)
) {
  execSync('npm run build', { cwd: apiRoot, stdio: 'ignore' });
}

const req = createRequire(import.meta.url);
const mediaCleanup = req(distServicePath);
const {
  createMediaMatchers,
  cleanValueRecursive,
  cleanDatabaseReferences,
  mediaCleanupService,
} = mediaCleanup;

describe('Milestone 1: Media Cleanup Service & Cascade Reference Cleanup', () => {
  const targetKey = 'media-library/261112013015.png';
  const targetFilename = '261112013015.png';
  const r2Domain = (process.env.R2_DOMAIN || '').replace(/\/+$/, '');

  describe('1. createMediaMatchers Tests', () => {
    it('T1-MCS-01: Correctly matches raw key, relative key, full URL, and timestamp filename', () => {
      const { isMatch } = createMediaMatchers([targetKey]);

      assert.strictEqual(isMatch(targetKey), true);
      assert.strictEqual(isMatch(`/${targetKey}`), true);
      assert.strictEqual(isMatch(targetFilename), true);
      assert.strictEqual(isMatch(`/${targetFilename}`), true);
      assert.strictEqual(isMatch(encodeURI(targetKey)), true);

      if (r2Domain) {
        assert.strictEqual(isMatch(`${r2Domain}/${targetKey}`), true);
        assert.strictEqual(isMatch(`${r2Domain}/${targetKey}?v=1`), true);
        assert.strictEqual(isMatch(`${r2Domain}/${targetKey}#hash`), true);
      }
    });

    it('T1-MCS-02: Rejects unrelated keys and non-matching URLs', () => {
      const { isMatch } = createMediaMatchers([targetKey]);

      assert.strictEqual(isMatch('media-library/999999999999.png'), false);
      assert.strictEqual(isMatch('thumbnails/other.jpg'), false);
      assert.strictEqual(isMatch('https://external.com/photo.jpg'), false);
      assert.strictEqual(isMatch(''), false);
    });

    it('T1-MCS-03: replaceInText strips URL substring from HTML content', () => {
      const { replaceInText } = createMediaMatchers([targetKey]);
      const html = `<div class="content"><img src="${targetKey}" alt="Test" /><p>Hello</p></div>`;
      const res = replaceInText(html);

      assert.strictEqual(res.count, 1);
      assert.strictEqual(res.replaced, '<div class="content"><img src="" alt="Test" /><p>Hello</p></div>');
    });
  });

  describe('2. cleanValueRecursive Safe Data Traversal Tests', () => {
    const { isMatch, replaceInText } = createMediaMatchers([targetKey]);

    it('T1-MCS-04: Single string URL is replaced with empty string', () => {
      const res = cleanValueRecursive(targetKey, isMatch, replaceInText);
      assert.strictEqual(res.hasChanged, true);
      assert.strictEqual(res.value, '');
      assert.strictEqual(res.cleanedCount, 1);
    });

    it('T1-MCS-05: Non-matching string remains untouched', () => {
      const safeStr = 'https://media.test/other_file.pdf';
      const res = cleanValueRecursive(safeStr, isMatch, replaceInText);
      assert.strictEqual(res.hasChanged, false);
      assert.strictEqual(res.value, safeStr);
      assert.strictEqual(res.cleanedCount, 0);
    });

    it('T1-MCS-06: Pure string array (e.g. preview_images) filters out matching item without empty gaps', () => {
      const previewImages = [
        'previews/page1.png',
        targetKey,
        'previews/page3.png',
      ];
      const res = cleanValueRecursive(previewImages, isMatch, replaceInText);
      assert.strictEqual(res.hasChanged, true);
      assert.strictEqual(res.cleanedCount, 1);
      assert.deepStrictEqual(res.value, ['previews/page1.png', 'previews/page3.png']);
      assert.strictEqual(res.value.length, 2);
    });

    it('T1-MCS-07: Sibling properties in JSONB blocks are 100% PRESERVED', () => {
      const block = {
        id: 'block_hero_01',
        type: 'product_hero',
        is_active: true,
        sort_order: 1,
        config: {
          title: 'Toán 12 Nâng Cao',
          author: 'Thầy Huy',
          image_url: targetKey,
          badge: 'Bestseller',
        },
      };

      const res = cleanValueRecursive(block, isMatch, replaceInText);
      assert.strictEqual(res.hasChanged, true);
      assert.strictEqual(res.cleanedCount, 1);

      // Verify all non-URL properties are preserved
      assert.strictEqual(res.value.id, 'block_hero_01');
      assert.strictEqual(res.value.type, 'product_hero');
      assert.strictEqual(res.value.is_active, true);
      assert.strictEqual(res.value.sort_order, 1);
      assert.strictEqual(res.value.config.title, 'Toán 12 Nâng Cao');
      assert.strictEqual(res.value.config.author, 'Thầy Huy');
      assert.strictEqual(res.value.config.badge, 'Bestseller');

      // Verify only image_url was cleaned to empty string
      assert.strictEqual(res.value.config.image_url, '');
    });

    it('T1-MCS-08: Nested categories and section items preserve item metadata', () => {
      const categoryBlocks = [
        {
          id: 'cat_sec_01',
          type: 'category_section',
          config: {
            title: 'Khóa Học Đặc Biệt',
            items: [
              {
                id: 'item_1',
                display_title: 'Sách 1',
                image_url: targetKey,
                target_url: '/product/sach-1',
              },
              {
                id: 'item_2',
                display_title: 'Sách 2',
                image_url: 'safe/cover.png',
                target_url: '/product/sach-2',
              },
            ],
          },
        },
      ];

      const res = cleanValueRecursive(categoryBlocks, isMatch, replaceInText);
      assert.strictEqual(res.hasChanged, true);
      assert.strictEqual(res.cleanedCount, 1);
      assert.strictEqual(res.value[0].config.items[0].image_url, '');
      assert.strictEqual(res.value[0].config.items[0].display_title, 'Sách 1');
      assert.strictEqual(res.value[0].config.items[0].target_url, '/product/sach-1');
      assert.strictEqual(res.value[0].config.items[1].image_url, 'safe/cover.png');
    });

    it('T1-MCS-09: Primitives, null, and undefined are handled safely', () => {
      assert.strictEqual(cleanValueRecursive(null, isMatch, replaceInText).hasChanged, false);
      assert.strictEqual(cleanValueRecursive(undefined, isMatch, replaceInText).hasChanged, false);
      assert.strictEqual(cleanValueRecursive(12345, isMatch, replaceInText).hasChanged, false);
      assert.strictEqual(cleanValueRecursive(true, isMatch, replaceInText).hasChanged, false);
    });
  });

  describe('3. cleanDatabaseReferences Execution Contract', () => {
    it('T1-MCS-10: Empty keys array returns totalCleaned 0', async () => {
      const report = await cleanDatabaseReferences([]);
      assert.strictEqual(report.totalCleaned, 0);
      assert.deepStrictEqual(report.details, {});
    });

    it('T1-MCS-11: mediaCleanupService object exports all required functions', () => {
      assert.strictEqual(typeof mediaCleanupService.createMediaMatchers, 'function');
      assert.strictEqual(typeof mediaCleanupService.cleanValueRecursive, 'function');
      assert.strictEqual(typeof mediaCleanupService.cleanDatabaseReferences, 'function');
    });
  });

  describe('4. API Route Integration Tests with cleanupReport', () => {
    let ctx: TestServerContext;

    before(async () => {
      ctx = await createTestServer();
    });

    after(async () => {
      await ctx.close();
    });

    it('T1-MCS-12: POST /api/admin/media/delete returns cleanupReport in response', async () => {
      const res = await ctx.fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: ['media-library/test_cascade.png'] }),
      });

      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.ok, true);
      assert(Array.isArray(body.deletedKeys));
      assert(body.cleanupReport !== undefined);
      assert.strictEqual(typeof body.cleanupReport.totalCleaned, 'number');
      assert.strictEqual(typeof body.cleanupReport.details, 'object');
    });

    it('T1-MCS-13: POST /api/admin/delete-file returns cleanupReport in response', async () => {
      const res = await ctx.fetch('/api/admin/delete-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'media-library/test_cascade_single.png' }),
      });

      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.ok, true);
      assert(body.cleanupReport !== undefined);
      assert.strictEqual(typeof body.cleanupReport.totalCleaned, 'number');
      assert.strictEqual(typeof body.cleanupReport.details, 'object');
    });
  });

  describe('5. Iteration 2 Targeted Fixes Verification', () => {
    let ctx: TestServerContext;

    before(async () => {
      ctx = await createTestServer();
    });

    after(async () => {
      await ctx.close();
    });

    it('T2-MCS-01: Encoded URI keys and incoming values with %2F match correctly', () => {
      const { isMatch } = createMediaMatchers(['media-library/261112013015.png']);

      // Raw, decoded, and encoded should match
      assert.strictEqual(isMatch('media-library/261112013015.png'), true);
      assert.strictEqual(isMatch('media-library%2F261112013015.png'), true);
      assert.strictEqual(isMatch('/media-library%2F261112013015.png'), true);
      assert.strictEqual(isMatch('https://media.test/media-library%2F261112013015.png'), true);
      assert.strictEqual(isMatch('https://media.test/media-library%2F261112013015.png?v=123'), true);
    });

    it('T2-MCS-02: Encoded rawKey inputs correctly decode and generate both raw and encoded patterns', () => {
      const { isMatch, targets } = createMediaMatchers(['media-library%2F261112013015.png']);

      assert.strictEqual(targets[0].cleanKey, 'media-library/261112013015.png');
      assert.strictEqual(targets[0].filename, '261112013015.png');
      assert.strictEqual(isMatch('media-library/261112013015.png'), true);
      assert.strictEqual(isMatch('media-library%2F261112013015.png'), true);
      assert.strictEqual(isMatch('/media-library/261112013015.png'), true);
    });

    it('T2-MCS-03: Filename suffix matching is constrained to avoid collateral damage on foreign external domains', () => {
      // Deleting a generic filename (not a 12-digit timestamp)
      const { isMatch } = createMediaMatchers(['samples/cover.png']);

      // Must NOT match foreign domains
      assert.strictEqual(isMatch('https://images.amazon.com/products/cover.png'), false);
      assert.strictEqual(isMatch('https://google.com/static/cover.png'), false);
      assert.strictEqual(isMatch('https://external-cdn.xyz/assets/cover.png'), false);
      assert.strictEqual(isMatch('http://another-site.org/cover.png'), false);

      // Must still match relative paths or target cleanKey
      assert.strictEqual(isMatch('samples/cover.png'), true);
      assert.strictEqual(isMatch('/samples/cover.png'), true);
      assert.strictEqual(isMatch('/other-folder/cover.png'), true);
      assert.strictEqual(isMatch('cover.png'), true);
    });

    it('T2-MCS-04: Suffix matching is permitted for 12-digit timestamp filenames across any path', () => {
      // Timestamp filenames are unique to Huy Tutor R2
      const { isMatch } = createMediaMatchers(['media-library/261112013015.png']);

      assert.strictEqual(isMatch('261112013015.png'), true);
      assert.strictEqual(isMatch('/previews/261112013015.png'), true);
      assert.strictEqual(isMatch('/custom/path/261112013015.png'), true);
    });

    it('T2-MCS-05: replaceInText strips matching URLs along with trailing query strings (?v=...) and hash fragments (#...)', () => {
      const { replaceInText } = createMediaMatchers(['media-library/261112013015.png']);

      // HTML img with query string
      const htmlQuery = '<div class="content"><img src="media-library/261112013015.png?v=123" alt="Test" /><p>Hello</p></div>';
      const resQuery = replaceInText(htmlQuery);
      assert.strictEqual(resQuery.count, 1);
      assert.strictEqual(resQuery.replaced, '<div class="content"><img src="" alt="Test" /><p>Hello</p></div>');

      // HTML img with hash fragment
      const htmlHash = '<div class="content"><img src="media-library/261112013015.png#preview" alt="Test" /></div>';
      const resHash = replaceInText(htmlHash);
      assert.strictEqual(resHash.count, 1);
      assert.strictEqual(resHash.replaced, '<div class="content"><img src="" alt="Test" /></div>');

      // Combined query and hash
      const htmlBoth = '<img src="media-library/261112013015.png?v=123&t=456#sec" />';
      const resBoth = replaceInText(htmlBoth);
      assert.strictEqual(resBoth.count, 1);
      assert.strictEqual(resBoth.replaced, '<img src="" />');

      // Multiple occurrences in complex text
      const multi = '<p><img src="media-library/261112013015.png?cache=0" /></p><p><img src="media-library/261112013015.png#thumb" /></p>';
      const resMulti = replaceInText(multi);
      assert.strictEqual(resMulti.count, 2);
      assert.strictEqual(resMulti.replaced, '<p><img src="" /></p><p><img src="" /></p>');
    });

    it('T2-MCS-06: POST /api/admin/media/delete returns ok: true even when partial errors occur', async () => {
      __setSimulatedR2Objects([
        { key: 'media-library/valid_cascade.png' },
      ]);

      const res = await ctx.fetch('/api/admin/media/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keys: ['media-library/valid_cascade.png', 'media-library/fail_me.png'],
        }),
      });

      assert.strictEqual(res.status, 200);
      const body = (await res.json()) as any;
      assert.strictEqual(body.ok, true, 'deleteMediaFiles must return ok: true so client.ts does not throw HTTP Error 200 on partial error');
      assert.strictEqual(body.deletedKeys.length, 1);
      assert.strictEqual(body.errors.length, 1);
      assert.strictEqual(body.errors[0].key, 'media-library/fail_me.png');
      assert(body.cleanupReport !== undefined);
      assert.strictEqual(typeof body.cleanupReport.totalCleaned, 'number');

      __clearSimulatedR2Objects();
    });
  });
});
