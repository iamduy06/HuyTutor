/**
 * Exchange Rate Service
 * Tự động lấy tỷ giá USD/VND động theo ngày từ nguồn tài chính mở chính thức (open.er-api.com).
 * Tự động cộng thêm 1.000 VNĐ cho mỗi USD để bù vào tỷ giá chênh lệch (spread) và phí xử lý của PayPal.
 * Cache in-memory 12 giờ, độ trễ đọc 0ms, không ảnh hưởng hiệu năng hệ thống.
 */

interface CachedExchangeRate {
  liveRate: number;
  effectiveRate: number;
  bufferVnd: number;
  lastFetchedAt: number;
  source: string;
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 giờ
const RATE_BUFFER_VND = 1000; // Cộng 1.000 VNĐ cho mỗi USD bù phí chênh lệch PayPal
const DEFAULT_FALLBACK_BASE_RATE = 26000; // Tỷ giá dự phòng an toàn (26.000 VNĐ) nếu không kết nối được

let cache: CachedExchangeRate | null = null;
let pendingFetch: Promise<CachedExchangeRate> | null = null;

async function fetchLiveRate(): Promise<CachedExchangeRate> {
  const fallbackBase = Number(process.env.USD_EXCHANGE_RATE) || DEFAULT_FALLBACK_BASE_RATE;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4 giây timeout

    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Exchange API returned status ${res.status}`);
    }

    const data = (await res.json()) as any;
    const vndRate = Number(data?.rates?.VND);

    if (vndRate && !isNaN(vndRate) && vndRate > 10000 && vndRate < 50000) {
      const liveRate = Math.round(vndRate);
      const effectiveRate = liveRate + RATE_BUFFER_VND;
      const result: CachedExchangeRate = {
        liveRate,
        effectiveRate,
        bufferVnd: RATE_BUFFER_VND,
        lastFetchedAt: Date.now(),
        source: 'open.er-api.com',
      };
      cache = result;
      return result;
    }

    throw new Error('Invalid VND rate in response');
  } catch (err) {
    console.warn('[exchangeRateService] Lỗi lấy tỷ giá động, sử dụng tỷ giá dự phòng:', err);

    // Dùng cache cũ nếu còn, hoặc fallback mặc định
    if (cache) {
      return cache;
    }

    const liveRate = fallbackBase;
    const effectiveRate = liveRate + RATE_BUFFER_VND;
    const fallbackResult: CachedExchangeRate = {
      liveRate,
      effectiveRate,
      bufferVnd: RATE_BUFFER_VND,
      lastFetchedAt: Date.now(),
      source: 'fallback_env',
    };
    cache = fallbackResult;
    return fallbackResult;
  }
}

export const exchangeRateService = {
  /**
   * Lấy thông tin tỷ giá USD/VND hiện hành (đã cộng 1.000 VNĐ buffer bù phí PayPal)
   */
  async getExchangeRateInfo(): Promise<CachedExchangeRate> {
    const now = Date.now();
    if (cache && now - cache.lastFetchedAt < CACHE_TTL_MS) {
      return cache;
    }

    if (!pendingFetch) {
      pendingFetch = fetchLiveRate().finally(() => {
        pendingFetch = null;
      });
    }

    return pendingFetch;
  },

  /**
   * Lấy tỷ giá hiệu lực (effectiveRate = liveRate + 1000) để quy đổi VND -> USD
   */
  async getEffectiveRate(): Promise<number> {
    const info = await this.getExchangeRateInfo();
    return info.effectiveRate;
  },

  /**
   * Lấy nhanh tỷ giá hiệu lực từ cache đồng bộ (0ms), fallback nếu chưa nạp
   */
  getEffectiveRateSync(): number {
    if (cache) return cache.effectiveRate;
    const fallbackBase = Number(process.env.USD_EXCHANGE_RATE) || DEFAULT_FALLBACK_BASE_RATE;
    return fallbackBase + RATE_BUFFER_VND;
  },
};
