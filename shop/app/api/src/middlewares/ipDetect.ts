import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      clientCountry?: string;
      recommendedGateway?: 'sepay' | 'paypal';
    }
  }
}

/**
 * Middleware tự động nhận diện IP Việt Nam hay Quốc tế:
 * - IP Việt Nam (VN) -> Cổng thanh toán SePay (VietQR)
 * - IP Quốc tế (khác VN) -> Cổng thanh toán PayPal (USD)
 */
export function ipDetectMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const queryCountry = typeof req.query.country === 'string' ? req.query.country.toUpperCase() : '';
  const cfCountry = (req.headers['cf-ipcountry'] as string | undefined)?.toUpperCase();
  const vercelCountry = (req.headers['x-vercel-ip-country'] as string | undefined)?.toUpperCase();

  const detectedCountry = queryCountry || cfCountry || vercelCountry || 'VN';
  req.clientCountry = detectedCountry;
  req.recommendedGateway = detectedCountry === 'VN' ? 'sepay' : 'paypal';
  next();
}
