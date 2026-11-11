/**
 * Pure contract implementation of HTML Sanitization & Container Styles
 * matching IsolatedHtmlBlock specifications.
 */

export function sanitizeHtml(rawHtml?: string | null): string {
  if (!rawHtml || typeof rawHtml !== 'string') {
    return '';
  }

  let html = rawHtml;

  // 1. Strip all <script>...</script> tags (case-insensitive, multiline, nested, unclosed)
  // Repeat while script tag exists to prevent nested bypass like <scr<script>ipt>
  let prevHtml = '';
  while (prevHtml !== html) {
    prevHtml = html;
    html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    html = html.replace(/<script\b[^>]*>/gi, '');
  }

  // 2. Strip inline event handlers matching whitespace or slash delimiter
  // Fixes Vector 1: <svg/onload=alert(1)> and <img/src="x"/onerror=alert(1)>
  prevHtml = '';
  while (prevHtml !== html) {
    prevHtml = html;
    html = html.replace(/[\s/]+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  }

  // 3. Neutralize dangerous pseudo-protocols in href/src/action attributes
  // Fixes Vector 2 (Data URI colon syntax) & Vector 3 (Tab/whitespace obfuscation)
  html = html.replace(/(href|src|action)\s*=\s*("|')([^"']*)\2/gi, (fullMatch, attr, _quote, urlVal) => {
    const cleanUrl = urlVal.replace(/[\s\x00-\x1f]/g, '');
    if (
      /^(?:javascript|vbscript)\s*:|^data\s*:\s*(?:text\/(?:html|javascript)|application\/javascript)/i.test(cleanUrl)
    ) {
      return `${attr}="#"`;
    }
    return fullMatch;
  });

  html = html.replace(/(href|src|action)\s*=\s*([^\s>]+)/gi, (fullMatch, attr, urlVal) => {
    const cleanUrl = urlVal.replace(/[\s\x00-\x1f]/g, '');
    if (
      /^(?:javascript|vbscript)\s*:|^data\s*:\s*(?:text\/(?:html|javascript)|application\/javascript)/i.test(cleanUrl)
    ) {
      return `${attr}="#"`;
    }
    return fullMatch;
  });

  return html.trim();
}

export function getContainerClasses(
  mode: 'boxed' | 'full_width' = 'boxed',
  noPadding = false
): string {
  const classes: string[] = [];

  if (mode === 'full_width') {
    classes.push('w-full');
  } else {
    // Boxed mode
    classes.push('max-w-6xl', 'mx-auto');
  }

  if (noPadding) {
    classes.push('px-0', 'p-0');
  } else {
    classes.push('px-4');
  }

  return classes.join(' ');
}

export function simulateShadowDomRender(params: {
  htmlContent?: string | null;
  containerMode?: 'boxed' | 'full_width';
  noPadding?: boolean;
}) {
  const sanitized = sanitizeHtml(params.htmlContent);
  const containerClasses = getContainerClasses(params.containerMode, params.noPadding);

  return {
    shadowMode: 'open' as const,
    containerClasses,
    sanitizedHtml: sanitized,
    hasScriptTag: /<script/i.test(sanitized),
    hasInlineEventHandler: /\son[a-z]+/i.test(sanitized),
    hasJavascriptPseudoProtocol: /href\s*=\s*["']?javascript:/i.test(sanitized),
    scopedStylesIncluded: /<style\b/i.test(sanitized),
  };
}
