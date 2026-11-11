import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  generateR2FileName,
  parseUploadDateFromR2Key,
  sanitizeR2Folder,
  _resetLastIssuedEpochSecondForTesting,
  getFileTypeFromExtension,
  extractR2ObjectKey,
} from '../src/services/r2Service.ts';

describe('Feature 1: R2 Filename 12-digit UTC+7 (generateR2FileName)', () => {
  beforeEach(() => {
    _resetLastIssuedEpochSecondForTesting?.();
  });

  // Tier 1 Tests
  it('T1-F01-01: Basic image filename with PNG extension', () => {
    const res = generateR2FileName('banner.png');
    assert.match(res, /^\d{12}\.png$/);
    assert.strictEqual(res.length, 16);
  });

  it('T1-F01-02: Filename with uppercase JPG extension normalized to lowercase', () => {
    const res = generateR2FileName('HERO_COVER.JPG');
    assert.match(res, /^\d{12}\.jpg$/);
    assert.strictEqual(res.endsWith('.jpg'), true);
  });

  it('T1-F01-03: PDF sample document filename removes original slugs', () => {
    const res = generateR2FileName('Tai_Lieu_Doc_Thu_Toan_12.pdf');
    assert.match(res, /^\d{12}\.pdf$/);
    assert.strictEqual(res.includes('Tai_Lieu'), false);
    assert.strictEqual(res.includes('Toan'), false);
  });

  it('T1-F01-04: Object parameter with originalFileName and page levels', () => {
    const res = generateR2FileName({
      originalFileName: 'icon.webp',
      pageLevel1: 'toan-thpt',
      pageLevel2: 'hinh-hoc',
    });
    assert.match(res, /^\d{12}\.webp$/);
    assert.strictEqual(res.includes('toan'), false);
    assert.strictEqual(res.includes('hinh'), false);
  });

  it('T1-F01-05: Empty call or undefined parameter defaults to .png', () => {
    const res = generateR2FileName();
    assert.match(res, /^\d{12}\.png$/);
    assert.strictEqual(res.endsWith('.png'), true);
  });

  // Tier 2 Tests
  it('T2-F01-01: Leap year boundary timestamp formatting preserves valid 12 digits', () => {
    const res = generateR2FileName('doc.pdf');
    assert.match(res, /^\d{12}\.pdf$/);
    const digits = res.slice(0, 12);
    const mm = parseInt(digits.slice(2, 4), 10);
    const dd = parseInt(digits.slice(4, 6), 10);
    assert(mm >= 1 && mm <= 12);
    assert(dd >= 1 && dd <= 31);
  });

  it('T2-F01-02: Maintains exactly 12 digits across transitions', () => {
    const res = generateR2FileName('image.png');
    const digits = res.slice(0, 12);
    assert.strictEqual(digits.length, 12);
    assert.match(digits, /^\d{12}$/);
  });

  it('T2-F01-03: Multiple dots in original name preserves only final extension', () => {
    const res = generateR2FileName('document.v2.draft.final.PDF');
    assert.match(res, /^\d{12}\.pdf$/);
    const dotCount = (res.match(/\./g) || []).length;
    assert.strictEqual(dotCount, 1);
  });

  it('T2-F01-04: Filename with special unicode and spaces outputs purely 12 digits + ext', () => {
    const res = generateR2FileName('Ảnh đọc thử Toán 12 & Đề thi mẫu #1!.png');
    assert.match(res, /^\d{12}\.png$/);
    assert.strictEqual(/[^\d.a-z]/.test(res), false);
  });

  it('T2-F01-05: Filename without extension gracefully appends .png', () => {
    const res = generateR2FileName('README_FILE');
    assert.match(res, /^\d{12}\.png$/);
    assert.strictEqual(res.endsWith('.png'), true);
  });
});

describe('Feature 2: Monotonic Sequence (lastIssuedEpochSecond tracking)', () => {
  beforeEach(() => {
    _resetLastIssuedEpochSecondForTesting?.();
  });

  // Tier 1 Tests
  it('T1-F02-01: Sequential generation within same second increments by at least +1s', () => {
    const fileA = generateR2FileName('a.png');
    const fileB = generateR2FileName('b.png');
    assert.notStrictEqual(fileA, fileB);
    const tsA = parseInt(fileA.slice(0, 12), 10);
    const tsB = parseInt(fileB.slice(0, 12), 10);
    assert(tsB > tsA);
  });

  it('T1-F02-02: Batch of 5 files in tight loop has strictly increasing timestamps', () => {
    const files = Array.from({ length: 5 }, () => generateR2FileName('batch.png'));
    const set = new Set(files);
    assert.strictEqual(set.size, 5);
    for (let i = 1; i < files.length; i++) {
      assert(files[i] > files[i - 1]);
    }
  });

  it('T1-F02-03: Concurrent generation produces unique filenames without collision', async () => {
    const promises = Array.from({ length: 20 }, (_, i) =>
      Promise.resolve(generateR2FileName(`file_${i}.png`))
    );
    const results = await Promise.all(promises);
    const set = new Set(results);
    assert.strictEqual(set.size, 20);
  });

  it('T1-F02-04: Mixed file extensions in same-second batch preserve respective extensions', () => {
    const f1 = generateR2FileName('a.png');
    const f2 = generateR2FileName('b.pdf');
    const f3 = generateR2FileName('c.webp');
    assert.strictEqual(f1.endsWith('.png'), true);
    assert.strictEqual(f2.endsWith('.pdf'), true);
    assert.strictEqual(f3.endsWith('.webp'), true);
    assert.notStrictEqual(f1.slice(0, 12), f2.slice(0, 12));
    assert.notStrictEqual(f2.slice(0, 12), f3.slice(0, 12));
  });

  it('T1-F02-05: Consecutive filenames increase monotonically without regression', () => {
    const f1 = generateR2FileName('first.png');
    const f2 = generateR2FileName('second.png');
    const num1 = BigInt(f1.slice(0, 12));
    const num2 = BigInt(f2.slice(0, 12));
    assert(num2 > num1);
  });

  // Tier 2 Tests
  it('T2-F02-01: 60 files batch within 1 second increments cleanly with valid digits', () => {
    const batch = Array.from({ length: 60 }, () => generateR2FileName('seq.png'));
    const set = new Set(batch);
    assert.strictEqual(set.size, 60);
    batch.forEach((f) => {
      const mm = parseInt(f.slice(8, 10), 10);
      const ss = parseInt(f.slice(10, 12), 10);
      assert(mm >= 0 && mm <= 59);
      assert(ss >= 0 && ss <= 59);
    });
  });

  it('T2-F02-02: Rapid generation maintains valid calendar components', () => {
    const files = Array.from({ length: 100 }, () => generateR2FileName('item.jpg'));
    const set = new Set(files);
    assert.strictEqual(set.size, 100);
    for (const f of files) {
      assert.match(f, /^\d{12}\.jpg$/);
    }
  });

  it('T2-F02-03: Monotonic sequence strictly prevents timestamp regression', () => {
    const f1 = generateR2FileName('t1.png');
    const f2 = generateR2FileName('t2.png');
    const t1 = parseInt(f1.slice(0, 12), 10);
    const t2 = parseInt(f2.slice(0, 12), 10);
    assert(t2 >= t1 + 1);
  });

  it('T2-F02-04: Concurrent burst of 500 files produces 500 unique filenames', async () => {
    const results = await Promise.all(
      Array.from({ length: 500 }, (_, i) => Promise.resolve(generateR2FileName(`burst_${i}.png`)))
    );
    const set = new Set(results);
    assert.strictEqual(set.size, 500);
  });

  it('T2-F02-05: Extremely long originalFileName (10,000 chars) handled without overflow', () => {
    const longName = 'a'.repeat(10000) + '.webp';
    const res = generateR2FileName(longName);
    assert.match(res, /^\d{12}\.webp$/);
    assert.strictEqual(res.length, 17);
  });
});

describe('Feature 3: Upload Date Parsing & Fallback (parseUploadDateFromR2Key)', () => {
  // Tier 1 Tests
  it('T1-F03-01: Valid standard key with 12-digit timestamp', () => {
    const res = parseUploadDateFromR2Key(
      'media-library/261112143000.png',
      new Date('2026-11-12T07:30:00Z')
    );
    assert.strictEqual(res.uploadTimeSource, 'filename');
    const date = new Date(res.uploadedAt);
    assert.strictEqual(date.getUTCFullYear(), 2026);
    assert.strictEqual(date.getUTCMonth(), 10); // November is 10 (0-indexed)
    assert.strictEqual(date.getUTCDate(), 12);
  });

  it('T1-F03-02: Valid nested folder key correctly parses basename digits', () => {
    const res = parseUploadDateFromR2Key('homepage/hero/260501091530.webp');
    assert.strictEqual(res.uploadTimeSource, 'filename');
    assert(res.uploadedAt.includes('2026-05-01'));
  });

  it('T1-F03-03: Valid PDF key in samples folder', () => {
    const res = parseUploadDateFromR2Key('samples/pages/260815180000.pdf');
    assert.strictEqual(res.uploadTimeSource, 'filename');
    assert(res.uploadedAt.includes('2026-08-15'));
  });

  it('T1-F03-04: Legacy random 12-digit file falls back to LastModified', () => {
    const fallbackDate = new Date('2026-01-10T04:00:00Z');
    // Month 28 is invalid calendar month
    const res = parseUploadDateFromR2Key('samplespages/592819401824.png', fallbackDate);
    assert.strictEqual(res.uploadTimeSource, 'r2_fallback');
    assert.strictEqual(res.uploadedAt, fallbackDate.toISOString());
  });

  it('T1-F03-05: Non-12-digit legacy key falls back to LastModified', () => {
    const fallbackDate = new Date('2025-12-01T10:00:00Z');
    const res = parseUploadDateFromR2Key('comboshero/my_legacy_banner.png', fallbackDate);
    assert.strictEqual(res.uploadTimeSource, 'r2_fallback');
    assert.strictEqual(res.uploadedAt, fallbackDate.toISOString());
  });

  // Tier 2 Tests
  it('T2-F03-01: Invalid calendar month 13 triggers fallback', () => {
    const fallbackDate = new Date('2026-05-10T00:00:00Z');
    const res = parseUploadDateFromR2Key('media-library/261301120000.png', fallbackDate);
    assert.strictEqual(res.uploadTimeSource, 'r2_fallback');
    assert.strictEqual(res.uploadedAt, fallbackDate.toISOString());
  });

  it('T2-F03-02: Non-leap year February 29th triggers fallback', () => {
    const fallbackDate = new Date('2025-03-01T00:00:00Z');
    const res = parseUploadDateFromR2Key('media-library/250229120000.png', fallbackDate);
    assert.strictEqual(res.uploadTimeSource, 'r2_fallback');
    assert.strictEqual(res.uploadedAt, fallbackDate.toISOString());
  });

  it('T2-F03-03: Leap year February 29th is accepted as valid filename', () => {
    const res = parseUploadDateFromR2Key('media-library/240229120000.png');
    assert.strictEqual(res.uploadTimeSource, 'filename');
    assert(res.uploadedAt.includes('2024-02-29'));
  });

  it('T2-F03-04: Basename with fewer than 12 digits triggers fallback', () => {
    const fallbackDate = new Date('2026-01-01T00:00:00Z');
    const res = parseUploadDateFromR2Key('media-library/12345.png', fallbackDate);
    assert.strictEqual(res.uploadTimeSource, 'r2_fallback');
    assert.strictEqual(res.uploadedAt, fallbackDate.toISOString());
  });

  it('T2-F03-05: Year outside range (<2020 or >2030) triggers fallback', () => {
    const fallbackDate = new Date('2026-01-01T00:00:00Z');
    const res = parseUploadDateFromR2Key('media-library/999999999999.png', fallbackDate);
    assert.strictEqual(res.uploadTimeSource, 'r2_fallback');
    assert.strictEqual(res.uploadedAt, fallbackDate.toISOString());
  });
});

describe('Feature 4: Folder Sanitization & Compatibility (sanitizeR2Folder)', () => {
  // Tier 1 Tests
  it('T1-F04-01: Standard simple folder returned as-is', () => {
    assert.strictEqual(sanitizeR2Folder('media-library'), 'media-library');
  });

  it('T1-F04-02: Nested subfolder preserves forward slashes', () => {
    assert.strictEqual(sanitizeR2Folder('media-library/banners'), 'media-library/banners');
  });

  it('T1-F04-03: Multi-level hierarchical folder', () => {
    assert.strictEqual(sanitizeR2Folder('samples/pages/math'), 'samples/pages/math');
  });

  it('T1-F04-04: Strips leading and trailing slashes', () => {
    assert.strictEqual(sanitizeR2Folder('/homepage/hero/'), 'homepage/hero');
    assert.strictEqual(sanitizeR2Folder('///media-library///'), 'media-library');
  });

  it('T1-F04-05: Legacy unslashed folder names preserved for backward compatibility', () => {
    assert.strictEqual(sanitizeR2Folder('samplespages'), 'samplespages');
    assert.strictEqual(sanitizeR2Folder('comboshero'), 'comboshero');
    assert.strictEqual(sanitizeR2Folder('homepagehero'), 'homepagehero');
  });

  // Tier 2 Tests
  it('T2-F04-01: Directory traversal with double dots is stripped', () => {
    const res = sanitizeR2Folder('media-library/../../../etc/passwd');
    assert.strictEqual(res.includes('..'), false);
    assert.strictEqual(res, 'media-library/etc/passwd');
  });

  it('T2-F04-02: Multiple consecutive slashes collapsed into single slash', () => {
    assert.strictEqual(
      sanitizeR2Folder('media-library///subfolder////deep'),
      'media-library/subfolder/deep'
    );
  });

  it('T2-F04-03: Strips special characters and injection payloads', () => {
    const res = sanitizeR2Folder('media-library/<script>alert(1)</script>/banners');
    assert.strictEqual(/[<>()&;]/.test(res), false);
    assert.strictEqual(res.includes('media-library'), true);
    assert.strictEqual(res.endsWith('/banners'), true);
  });

  it('T2-F04-04: Empty string, whitespace or slashes only fall back to homepage', () => {
    assert.strictEqual(sanitizeR2Folder('   ///   '), 'homepage');
    assert.strictEqual(sanitizeR2Folder(''), 'homepage');
    assert.strictEqual(sanitizeR2Folder('   '), 'homepage');
    assert.strictEqual(sanitizeR2Folder('///'), 'homepage');
  });

  it('T2-F04-05: Null or undefined falls back to homepage', () => {
    assert.strictEqual(sanitizeR2Folder(undefined), 'homepage');
    assert.strictEqual(sanitizeR2Folder(null), 'homepage');
  });
});

describe('Feature 9: API Unit Tests & Regression Verifications', () => {
  it('T1-F09-01: File type extraction accurately categorizes image extensions', () => {
    assert.strictEqual(getFileTypeFromExtension('test.png'), 'image');
    assert.strictEqual(getFileTypeFromExtension('photo.JPG'), 'image');
    assert.strictEqual(getFileTypeFromExtension('graphic.webp'), 'image');
    assert.strictEqual(getFileTypeFromExtension('vector.svg'), 'image');
  });

  it('T1-F09-02: File type extraction accurately categorizes pdf documents', () => {
    assert.strictEqual(getFileTypeFromExtension('document.pdf'), 'pdf');
    assert.strictEqual(getFileTypeFromExtension('EBOOK.PDF'), 'pdf');
  });

  it('T1-F09-03: File type extraction categorizes unknown formats as other', () => {
    assert.strictEqual(getFileTypeFromExtension('archive.zip'), 'other');
    assert.strictEqual(getFileTypeFromExtension('script.js'), 'other');
    assert.strictEqual(getFileTypeFromExtension('data.bin'), 'other');
  });

  it('T1-F09-04: extractR2ObjectKey correctly extracts key from relative or absolute paths', () => {
    assert.strictEqual(extractR2ObjectKey('media-library/test.png'), 'media-library/test.png');
    assert.strictEqual(extractR2ObjectKey('/media-library/test.png'), 'media-library/test.png');
  });

  it('T1-F09-05: extractR2ObjectKey returns null for external URLs', () => {
    assert.strictEqual(extractR2ObjectKey('https://google.com/logo.png'), null);
    assert.strictEqual(extractR2ObjectKey('https://images.unsplash.com/photo.jpg'), null);
  });

  it('T2-F09-01: extractR2ObjectKey handles empty or invalid inputs', () => {
    assert.strictEqual(extractR2ObjectKey(''), null);
    assert.strictEqual(extractR2ObjectKey('   '), null);
    assert.strictEqual(extractR2ObjectKey(null as any), null);
    assert.strictEqual(extractR2ObjectKey(undefined as any), null);
  });

  it('T2-F09-02: Windows backslashes in folder sanitization normalized to forward slashes', () => {
    const res = sanitizeR2Folder('media-library\\subfolder\\nested');
    assert.strictEqual(res, 'media-library/subfolder/nested');
  });

  it('T2-F09-03: Single dot relative navigation stripped from folder path', () => {
    const res = sanitizeR2Folder('media-library/./nested/./folder');
    assert.strictEqual(res, 'media-library/nested/folder');
  });

  it('T2-F09-04: extractR2ObjectKey parses Cloudflare R2 dev domains', () => {
    const key = extractR2ObjectKey('https://pub-abc123.r2.dev/media-library/image.png');
    assert.strictEqual(key, 'media-library/image.png');
  });

  it('T2-F09-05: sanitizeR2Folder preserves numbers and underscores', () => {
    const res = sanitizeR2Folder('user_uploads/batch_01/v2_item');
    assert.strictEqual(res, 'user_uploads/batch_01/v2_item');
  });
});
