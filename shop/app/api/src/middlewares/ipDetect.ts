import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      clientCountry?: string;
      isVietnam?: boolean;
      recommendedGateway?: 'sepay' | 'paypal';
      allowedGateways?: ('sepay' | 'paypal')[];
      clientIp?: string;
    }
  }
}

// In-memory cache cho kết quả tra cứu GeoIP (24 giờ TTL)
interface GeoIpCacheEntry {
  country: string;
  timestamp: number;
}
const geoCache = new Map<string, GeoIpCacheEntry>();
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000;

function isPrivateIp(ip: string): boolean {
  return (
    !ip ||
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.')
  );
}

/**
 * Trích xuất IP thực của client từ các header proxy
 */
function extractClientIp(req: Request): string {
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }

  return req.socket?.remoteAddress || '';
}

/**
 * Tra cứu GeoIP cho public IP nếu không có header Cloudflare
 */
async function lookupCountryByIp(ip: string): Promise<string | null> {
  if (isPrivateIp(ip)) return null;

  const now = Date.now();
  const cached = geoCache.get(ip);
  if (cached && now - cached.timestamp < GEO_CACHE_TTL) {
    return cached.country;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000); // 2s timeout
    const res = await fetch(`https://ipwho.is/${ip}?fields=success,country_code`, {
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data?.success && data?.country_code) {
        const country = String(data.country_code).toUpperCase();
        geoCache.set(ip, { country, timestamp: now });
        return country;
      }
    }
  } catch {
    // ignore lookup error
  }

  return null;
}

/**
 * Middleware tự động tracking vị trí địa lý của người dùng (Việt Nam vs Nước ngoài):
 * 1. Cloudflare Edge header 'cf-ipcountry' (Độ tin cậy 99.9% trên production)
 * 2. Vercel header 'x-vercel-ip-country'
 * 3. Client timezone hint 'x-client-timezone'
 * 4. Tra cứu GeoIP tự động cho public IP
 *
 * QUY TẮC BẮT BUỘC:
 * - Mặc định thanh toán: LUÔN LÀ 'sepay' (VietQR).
 * - Ở Việt Nam (VN): Chỉ cho phép VietQR (allowedGateways = ['sepay']).
 * - Ở Nước ngoài (khác VN): Cho phép cả VietQR và PayPal (allowedGateways = ['sepay', 'paypal']).
 */
export async function ipDetectMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const queryCountry = typeof req.query.country === 'string' ? req.query.country.toUpperCase().trim() : '';
  const cfCountry = (req.headers['cf-ipcountry'] as string | undefined)?.toUpperCase().trim();
  const vercelCountry = (req.headers['x-vercel-ip-country'] as string | undefined)?.toUpperCase().trim();
  const clientTimezone = (
    typeof req.query.tz === 'string'
      ? req.query.tz
      : (req.headers['x-client-timezone'] as string | undefined)
  )?.trim();
  const clientIp = extractClientIp(req);
  req.clientIp = clientIp;

  let detectedCountry = '';

  // 1. Kiểm tra Cloudflare header hợp lệ
  if (cfCountry && cfCountry !== 'XX' && cfCountry !== 'T1') {
    detectedCountry = cfCountry;
  } else if (vercelCountry && vercelCountry !== 'XX') {
    detectedCountry = vercelCountry;
  }

  // 2. Tra cứu GeoIP nếu chưa xác định được và không phải private IP
  if (!detectedCountry && clientIp && !isPrivateIp(clientIp)) {
    const geoCountry = await lookupCountryByIp(clientIp);
    if (geoCountry) {
      detectedCountry = geoCountry;
    }
  }

  // 3. Sử dụng timezone hint nếu môi trường dev/local hoặc chưa xác định được
  if (!detectedCountry && clientTimezone) {
    if (clientTimezone === 'Asia/Ho_Chi_Minh' || clientTimezone === 'Asia/Saigon' || clientTimezone === 'Asia/Bangkok') {
      detectedCountry = 'VN';
    } else if (
      clientTimezone.startsWith('America/') ||
      clientTimezone.startsWith('Europe/') ||
      clientTimezone.startsWith('Australia/') ||
      clientTimezone === 'Asia/Tokyo' ||
      clientTimezone === 'Asia/Seoul'
    ) {
      detectedCountry = 'INTL';
    }
  }

  // 4. Cho phép queryCountry trong môi trường test/dev nếu có
  if (queryCountry) {
    detectedCountry = queryCountry;
  }

  // Mặc định an toàn là 'VN' nếu không có bất kỳ thông tin nào
  if (!detectedCountry) {
    detectedCountry = 'VN';
  }

  req.clientCountry = detectedCountry;
  req.isVietnam = detectedCountry === 'VN';

  // MẶC ĐỊNH LUÔN LÀ VIETQR CHO TẤT CẢ KHÁCH HÀNG
  req.recommendedGateway = 'sepay';

  // PHÂN LUỒNG QUYỀN TRUY CẬP CỔNG THANH TOÁN
  req.allowedGateways = req.isVietnam ? ['sepay'] : ['sepay', 'paypal'];

  next();
}
