import React, { useEffect, useRef } from 'react';

export interface IsolatedHtmlBlockProps {
  htmlContent?: string;
  containerMode?: 'boxed' | 'full_width';
  noPadding?: boolean;
  className?: string;
}

const BASE_RESET_CSS = `
<style>
  :host {
    display: block;
    font-family: inherit;
    line-height: 1.5;
    color: inherit;
  }
  *, *::before, *::after {
    box-sizing: border-box;
  }
  img, video, iframe {
    max-width: 100%;
    height: auto;
    display: block;
  }
  a {
    color: #e60049;
    text-decoration: underline;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
</style>
`;

/**
 * Khử mã độc XSS an toàn bằng DOMParser phía Client:
 * 1. Loại bỏ toàn bộ thẻ <script>, <object>, <embed>, <applet>, <base>, <meta>
 * 2. Làm sạch thẻ <iframe>: gỡ bỏ hoàn toàn 'srcdoc' và chặn scheme javascript:/data:/vbscript:
 * 3. Gỡ bỏ mọi inline event handlers (thuộc tính bắt đầu bằng 'on') và thuộc tính 'srcdoc'
 * 4. Gỡ bỏ các liên kết có scheme 'javascript:', 'data:text/html', 'vbscript:'
 * 5. Bảo toàn thẻ <style> nội bộ (từ doc.head) và các thẻ HTML an toàn
 */
function sanitizeHtmlContent(rawHtml: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^>]*\bsrcdoc\b[^>]*>.*?<\/iframe>/gi, '')
      .replace(/\bsrcdoc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // 1. Loại bỏ các thẻ thực thi mã nguồn nguy hiểm & can thiệp cấu trúc trang
  const dangerousTags = ['script', 'object', 'embed', 'applet', 'base', 'meta'];
  for (const tag of dangerousTags) {
    const elements = doc.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  }

  // 2. Kiểm tra và làm sạch riêng thẻ <iframe> (triệt tiêu lỗ hổng srcdoc & scheme nguy hiểm)
  const iframes = doc.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    // Gỡ bỏ srcdoc tuyệt đối trên mọi iframe
    if (iframe.hasAttribute('srcdoc')) {
      iframe.removeAttribute('srcdoc');
    }
    const src = iframe.getAttribute('src');
    if (src) {
      const cleanSrc = src.replace(/[\x00-\x20\s]+/g, '').toLowerCase();
      if (cleanSrc.startsWith('javascript:') || cleanSrc.startsWith('data:') || cleanSrc.startsWith('vbscript:')) {
        iframe.removeAttribute('src');
        iframe.remove(); // Xóa bỏ hoàn toàn iframe độc hại
        return;
      }
    }
    // Nếu iframe không còn src hợp lệ, xóa bỏ để tránh tạo khung trắng rác
    if (!iframe.getAttribute('src') || !iframe.getAttribute('src')?.trim()) {
      iframe.remove();
    }
  });

  // 3. Gỡ bỏ inline event handlers, srcdoc & javascript:/data:text/html URLs trên mọi phần tử
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    const attrNames = el.getAttributeNames();
    for (const attr of attrNames) {
      const lowerAttr = attr.toLowerCase();

      // Chặn inline event handlers (onload, onerror, onclick...)
      if (/^on/i.test(attr)) {
        el.removeAttribute(attr);
        continue;
      }

      // Chặn thuộc tính srcdoc trên mọi element
      if (lowerAttr === 'srcdoc') {
        el.removeAttribute(attr);
        continue;
      }

      // Kiểm tra scheme URL sau khi đã chuẩn hóa loại bỏ khoảng trắng & ký tự điều khiển
      const val = el.getAttribute(attr);
      if (val) {
        const cleanVal = val.replace(/[\x00-\x20\s]+/g, '').toLowerCase();
        if (
          cleanVal.startsWith('javascript:') ||
          cleanVal.startsWith('data:text/html') ||
          cleanVal.startsWith('vbscript:')
        ) {
          el.removeAttribute(attr);
        }
      }
    }
  });

  // Nối nội dung <style> từ doc.head và markup từ doc.body
  return `${doc.head.innerHTML}${doc.body.innerHTML}`;
}

export const IsolatedHtmlBlock: React.FC<IsolatedHtmlBlockProps> = ({
  htmlContent,
  containerMode = 'full_width',
  noPadding = false,
  className = '',
}) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    let shadow = hostRef.current.shadowRoot;
    if (!shadow) {
      try {
        shadow = hostRef.current.attachShadow({ mode: 'open' });
      } catch (err) {
        console.warn('[IsolatedHtmlBlock] Shadow DOM attach warning:', err);
        shadow = hostRef.current.shadowRoot;
      }
    }

    if (!shadow) return;

    if (!htmlContent || !htmlContent.trim()) {
      shadow.innerHTML = '';
      return;
    }

    try {
      const sanitized = sanitizeHtmlContent(htmlContent);
      shadow.innerHTML = `${BASE_RESET_CSS}${sanitized}`;
    } catch (err) {
      console.error('[IsolatedHtmlBlock] Sanitization or render error:', err);
      shadow.innerHTML = `
        <div style="padding: 12px; font-size: 13px; color: #b91c1c; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 4px;">
          ⚠️ Không thể hiển thị khối HTML tùy biến do lỗi định dạng mã nguồn.
        </div>
      `;
    }
  }, [htmlContent]);

  // Nếu rỗng, không chiếm diện tích trên trang
  if (!htmlContent || !htmlContent.trim()) {
    return null;
  }

  const containerClasses = [
    containerMode === 'boxed' ? 'max-w-[1200px] mx-auto px-4' : 'w-full',
    noPadding ? 'py-0' : containerMode === 'boxed' ? 'py-6' : 'py-6 px-4',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div ref={hostRef} className={`isolated-html-block ${containerClasses}`} />;
};

export default IsolatedHtmlBlock;
