import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Kiểm tra xem một URL có phải là liên kết ra bên ngoài hay không
 * (Hỗ trợ http://, https://, //, www., mailto:, tel:)
 */
export function isExternalUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return (
    /^(https?:)?\/\//i.test(trimmed) ||
    /^www\./i.test(trimmed) ||
    /^mailto:/i.test(trimmed) ||
    /^tel:/i.test(trimmed)
  );
}

/**
 * Chuẩn hóa URL đích:
 * - Nếu là link ngoài (https://, http://, mailto:, tel:, www.) -> giữ nguyên hoặc thêm https:// cho www.
 * - Nếu là link nội bộ -> đảm bảo luôn bắt đầu bằng dấu gạch chéo '/' (root/url)
 * - Nếu rỗng hoặc '#' -> trả về '#'
 */
export function normalizeTargetUrl(raw?: string | null): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '#') return '#';

  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  if (isExternalUrl(trimmed)) {
    return trimmed;
  }

  // Đường dẫn nội bộ: Đảm bảo luôn luôn xuất phát từ root '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export interface SmartLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to?: string | null;
  href?: string | null;
  className?: string;
  children?: React.ReactNode;
  openExternalInNewTab?: boolean;
}

/**
 * SmartLink: Component liên kết thông minh hỗ trợ cả:
 * 1. Link https:// ra bên ngoài (Mở tab mới với target="_blank" rel="noopener noreferrer")
 * 2. Đường dẫn nội bộ (Đảm bảo luôn luôn là root/url với React Router Link)
 * 3. Không vỡ layout khi link rỗng
 */
export const SmartLink: React.FC<SmartLinkProps> = ({
  to,
  href,
  className,
  children,
  openExternalInNewTab = true,
  onClick,
  target,
  rel,
  ...props
}) => {
  const rawUrl = to || href;
  const normalized = normalizeTargetUrl(rawUrl);

  // Trường hợp không có URL hoặc link trống '#'
  if (!normalized || normalized === '#') {
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          if (onClick) onClick(e);
        }}
        className={className}
        {...props}
      >
        {children}
      </a>
    );
  }

  // Trường hợp liên kết ra bên ngoài (https://, http://, mailto:, tel:...)
  if (isExternalUrl(normalized)) {
    const finalTarget = target || (openExternalInNewTab ? '_blank' : undefined);
    const finalRel = rel || (finalTarget === '_blank' ? 'noopener noreferrer' : undefined);

    return (
      <a
        href={normalized}
        target={finalTarget}
        rel={finalRel}
        onClick={onClick}
        className={className}
        {...props}
      >
        {children}
      </a>
    );
  }

  // Trường hợp đường dẫn nội bộ (luôn luôn bắt đầu từ root '/')
  return (
    <Link to={normalized} onClick={onClick} className={className} {...props}>
      {children}
    </Link>
  );
};
