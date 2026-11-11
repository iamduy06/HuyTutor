import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  sanitizeHtml,
  getContainerClasses,
  simulateShadowDomRender,
} from './helpers/htmlSanitizer.ts';

describe('Feature 12: HTML Sanitization & Script Stripping (IsolatedHtmlBlock)', () => {
  // Tier 1 Tests
  it('T1-F12-01: Renders valid HTML content inside Shadow DOM container representation', () => {
    const raw = '<div class="banner"><h3>Khuyến Mãi</h3><p>Nội dung</p></div>';
    const result = simulateShadowDomRender({ htmlContent: raw });

    assert.strictEqual(result.shadowMode, 'open');
    assert(result.sanitizedHtml.includes('Khuyến Mãi'));
    assert(result.sanitizedHtml.includes('<div class="banner">'));
  });

  it('T1-F12-02: Encapsulates scoped CSS rules without stripping <style> tags', () => {
    const raw = '<style>p { color: red; } .box { border: 1px solid black; }</style><p>Đoạn văn</p>';
    const result = simulateShadowDomRender({ htmlContent: raw });

    assert.strictEqual(result.scopedStylesIncluded, true);
    assert(result.sanitizedHtml.includes('<style>p { color: red; }'));
    assert(result.sanitizedHtml.includes('Đoạn văn'));
  });

  it('T1-F12-03: Container mode "boxed" applies bounded width and centering classes', () => {
    const classes = getContainerClasses('boxed', false);
    assert(classes.includes('max-w-6xl'));
    assert(classes.includes('mx-auto'));
    assert(classes.includes('px-4'));
  });

  it('T1-F12-04: Container mode "full_width" applies full width class', () => {
    const classes = getContainerClasses('full_width', false);
    assert(classes.includes('w-full'));
    assert.strictEqual(classes.includes('max-w-6xl'), false);
  });

  it('T1-F12-05: Toggle noPadding property eliminates container padding', () => {
    const classes = getContainerClasses('boxed', true);
    assert(classes.includes('p-0') || classes.includes('px-0'));
    assert.strictEqual(classes.includes('px-4'), false);
  });

  // Tier 2 Tests (Security & Malicious Injections)
  it('T2-F12-01: Strips <script> tag execution (case-insensitive, unclosed, and nested)', () => {
    // Basic script tag
    const p1 = '<script>window.pwned=true; alert(1);</script><div>Content</div>';
    const res1 = sanitizeHtml(p1);
    assert.strictEqual(res1.includes('<script'), false);
    assert.strictEqual(res1.includes('alert(1)'), false);
    assert.strictEqual(res1, '<div>Content</div>');

    // Uppercase <SCRIPT>
    const p2 = '<SCRIPT SRC="https://evil.com/payload.js"></SCRIPT><p>Safe</p>';
    const res2 = sanitizeHtml(p2);
    assert.strictEqual(/<script/i.test(res2), false);
    assert.strictEqual(res2, '<p>Safe</p>');

    // Nested bypass attempt: <scr<script>ipt>alert(1)</script>
    const p3 = '<scr<script>ipt>alert(1)</script>Safe Text';
    const res3 = sanitizeHtml(p3);
    assert.strictEqual(/<script/i.test(res3), false);

    // Unclosed script tag
    const p4 = '<script>alert(1) Unclosed';
    const res4 = sanitizeHtml(p4);
    assert.strictEqual(/<script/i.test(res4), false);
  });

  it('T2-F12-02: Strips inline event handlers (onerror, onload, onclick, onmouseover)', () => {
    const p1 = '<img src="invalid.jpg" onerror="window.xss=1" onload="window.xss=2" />';
    const res1 = sanitizeHtml(p1);
    assert.strictEqual(/onerror/i.test(res1), false);
    assert.strictEqual(/onload/i.test(res1), false);
    assert(res1.includes('<img src="invalid.jpg"'));

    const p2 = '<button onclick="alert(1)" onmouseover="alert(2)" onfocus="alert(3)">Click</button>';
    const res2 = sanitizeHtml(p2);
    assert.strictEqual(/onclick/i.test(res2), false);
    assert.strictEqual(/onmouseover/i.test(res2), false);
    assert.strictEqual(/onfocus/i.test(res2), false);
    assert(res2.includes('<button>Click</button>'));

    // Event handler without quotes
    const p3 = '<div onmouseenter=alert(document.cookie)>Hover me</div>';
    const res3 = sanitizeHtml(p3);
    assert.strictEqual(/onmouseenter/i.test(res3), false);

    // Slashed event handler vector (HTML5 delimiter bypass)
    const p4 = '<svg/onload=alert(1)><circle r="10"/></svg>';
    const res4 = sanitizeHtml(p4);
    assert.strictEqual(/onload/i.test(res4), false);
  });

  it('T2-F12-03: Strips javascript: and dangerous pseudo-protocols in href/src', () => {
    const p1 = '<a href="javascript:alert(1)">Claim Free Prize</a>';
    const res1 = sanitizeHtml(p1);
    assert.strictEqual(/javascript:/i.test(res1), false);
    assert(res1.includes('href="#"'));

    const p2 = '<iframe src="javascript:alert(2)"></iframe>';
    const res2 = sanitizeHtml(p2);
    assert.strictEqual(/javascript:/i.test(res2), false);

    const p3 = '<a href="vbscript:msgbox(1)">VBScript link</a>';
    const res3 = sanitizeHtml(p3);
    assert.strictEqual(/vbscript:/i.test(res3), false);

    // Data URI HTML execution vector
    const p4 = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Click</a>';
    const res4 = sanitizeHtml(p4);
    assert(res4.includes('href="#"'));

    // Tab/whitespace obfuscated pseudo-protocol vector
    const p5 = '<a href="java\tscript:alert(1)">Obfuscated</a>';
    const res5 = sanitizeHtml(p5);
    assert(res5.includes('href="#"'));
  });

  it('T2-F12-04: Preserves legitimate elements and complex HTML markup', () => {
    const r2Domain = (process.env.R2_DOMAIN || '').replace(/\/$/, '');
    const mediaBannerUrl = `${r2Domain}/media-library/261112.png`;
    const complex = `
      <section class="my-custom-section">
        <h2 class="text-xl font-bold">Chương Trình 2026</h2>
        <p>Danh sách các tài liệu:</p>
        <ul class="list-disc">
          <li>Toán 12</li>
          <li>Vật Lý 12</li>
        </ul>
        <table class="table-auto">
          <thead><tr><th>Tên</th><th>Giá</th></tr></thead>
          <tbody><tr><td>Combo</td><td>199k</td></tr></tbody>
        </table>
        <img src="${mediaBannerUrl}" alt="Banner" class="w-full" />
      </section>
    `;
    const res = sanitizeHtml(complex);
    assert(res.includes('<h2 class="text-xl font-bold">Chương Trình 2026</h2>'));
    assert(res.includes('<li>Toán 12</li>'));
    assert(res.includes('<table class="table-auto">'));
    assert(res.includes(mediaBannerUrl));
  });

  it('T2-F12-05: Handles null, undefined, and empty string safely', () => {
    assert.strictEqual(sanitizeHtml(null), '');
    assert.strictEqual(sanitizeHtml(undefined), '');
    assert.strictEqual(sanitizeHtml(''), '');
    assert.strictEqual(sanitizeHtml('   '), '');

    const sim = simulateShadowDomRender({});
    assert.strictEqual(sim.sanitizedHtml, '');
    assert.strictEqual(sim.shadowMode, 'open');
  });
});
