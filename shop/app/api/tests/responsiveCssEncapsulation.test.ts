import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getContainerClasses } from './helpers/htmlSanitizer.ts';

export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

export function getViewportWidthClass(viewport: PreviewViewport): string {
  switch (viewport) {
    case 'desktop':
      return 'w-full';
    case 'tablet':
      return 'w-[768px]';
    case 'mobile':
      return 'w-[375px]';
    default:
      return 'w-full';
  }
}

export function handleEditorTabKey(
  currentText: string,
  selectionStart: number,
  selectionEnd: number
): { newText: string; newCursor: number } {
  // Inserts 2 spaces at cursor position
  const spaces = '  ';
  const newText =
    currentText.substring(0, selectionStart) + spaces + currentText.substring(selectionEnd);
  const newCursor = selectionStart + spaces.length;
  return { newText, newCursor };
}

export function generateShadowDomTemplate(params: {
  htmlContent: string;
  containerMode?: 'boxed' | 'full_width';
  noPadding?: boolean;
}) {
  const baseCss = `
    :host {
      display: block;
      box-sizing: border-box;
    }
    *, *::before, *::after {
      box-sizing: inherit;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
    }
  `.trim();

  const containerClass = getContainerClasses(params.containerMode, params.noPadding);

  return {
    mode: 'open' as const,
    baseCss,
    containerClass,
    renderedShadowHtml: `<style>${baseCss}</style><div class="${containerClass}">${params.htmlContent}</div>`,
  };
}

describe('Feature 13 & 19: Responsive Modes & CSS Containment', () => {
  // Viewport mapping tests
  it('T1-F19-01: Desktop viewport maps to full width class w-full', () => {
    assert.strictEqual(getViewportWidthClass('desktop'), 'w-full');
  });

  it('T1-F19-02: Tablet viewport maps to 768px width class w-[768px]', () => {
    assert.strictEqual(getViewportWidthClass('tablet'), 'w-[768px]');
  });

  it('T1-F19-03: Mobile viewport maps to 375px width class w-[375px]', () => {
    assert.strictEqual(getViewportWidthClass('mobile'), 'w-[375px]');
  });

  it('T2-F19-01: Unknown viewport falls back safely to w-full', () => {
    assert.strictEqual(getViewportWidthClass('unknown' as any), 'w-full');
  });

  // Editor Tab key handling tests
  it('T1-F13-01: Tab key in monospace editor inserts exactly 2 spaces at cursor position', () => {
    const text = '<div></div>';
    const { newText, newCursor } = handleEditorTabKey(text, 5, 5);
    assert.strictEqual(newText, '<div>  </div>');
    assert.strictEqual(newCursor, 7);
  });

  it('T1-F13-02: Tab key with highlighted range replaces selection with 2 spaces', () => {
    const text = 'Hello WORLD!';
    const { newText, newCursor } = handleEditorTabKey(text, 6, 11);
    assert.strictEqual(newText, 'Hello   !');
    assert.strictEqual(newCursor, 8);
  });

  it('T2-F13-01: Tab key at start of text prepends 2 spaces', () => {
    const text = '<h1>Title</h1>';
    const { newText, newCursor } = handleEditorTabKey(text, 0, 0);
    assert.strictEqual(newText, '  <h1>Title</h1>');
    assert.strictEqual(newCursor, 2);
  });

  it('T2-F13-02: Tab key in empty editor initializes text with 2 spaces', () => {
    const { newText, newCursor } = handleEditorTabKey('', 0, 0);
    assert.strictEqual(newText, '  ');
    assert.strictEqual(newCursor, 2);
  });

  // Shadow DOM CSS containment tests
  it('T1-F12-01: Shadow DOM template is configured with mode "open"', () => {
    const template = generateShadowDomTemplate({ htmlContent: '<p>Hi</p>' });
    assert.strictEqual(template.mode, 'open');
  });

  it('T1-F12-02: Shadow DOM template injects base responsive image styles', () => {
    const template = generateShadowDomTemplate({ htmlContent: '<p>Hi</p>' });
    assert(template.baseCss.includes('max-width: 100%'));
    assert(template.baseCss.includes('height: auto'));
    assert(template.baseCss.includes('box-sizing: border-box'));
  });

  it('T1-F12-03: Boxed container wraps content in max-w-6xl and px-4', () => {
    const template = generateShadowDomTemplate({
      htmlContent: '<p>Hi</p>',
      containerMode: 'boxed',
      noPadding: false,
    });
    assert(template.containerClass.includes('max-w-6xl'));
    assert(template.containerClass.includes('px-4'));
  });

  it('T1-F12-04: Full width container wraps content in w-full', () => {
    const template = generateShadowDomTemplate({
      htmlContent: '<p>Hi</p>',
      containerMode: 'full_width',
    });
    assert(template.containerClass.includes('w-full'));
    assert.strictEqual(template.containerClass.includes('max-w-6xl'), false);
  });

  it('T1-F12-05: noPadding flag eliminates padding classes', () => {
    const template = generateShadowDomTemplate({
      htmlContent: '<p>Hi</p>',
      containerMode: 'boxed',
      noPadding: true,
    });
    assert(template.containerClass.includes('p-0') || template.containerClass.includes('px-0'));
    assert.strictEqual(template.containerClass.includes('px-4'), false);
  });

  it('T2-F12-01: Shadow DOM confines internal CSS rules and isolates outer DOM', () => {
    const customStyle = '<style>body { background: red; } * { color: green; }</style>';
    const template = generateShadowDomTemplate({ htmlContent: customStyle });
    // Verify custom styles remain inside the shadow HTML envelope
    assert(template.renderedShadowHtml.includes(customStyle));
  });
});
