import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_DOMAIN = process.env.R2_DOMAIN ? process.env.R2_DOMAIN.replace(/\/$/, '') : '';

const R2_ENDPOINT = process.env.R2_ENDPOINT!;

export const isR2Configured = Boolean(
  R2_ACCOUNT_ID &&
    R2_ACCESS_KEY_ID &&
    R2_SECRET_ACCESS_KEY &&
    !R2_ACCOUNT_ID.includes('your_cloudflare')
);

const s3Client = isR2Configured
  ? new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    })
  : null;

export interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  objectKey: string;
  isSimulated: boolean;
}

export interface ParsedUploadDate {
  uploadedAt: string; // ISO 8601 string
  uploadTimeSource: 'filename' | 'r2_fallback';
  isoDate?: string;
  source?: 'filename' | 'r2_fallback';
}

export interface MediaItem {
  key: string;
  name: string;
  folder: string;
  size: number;
  uploadedAt: string;
  modifiedAt: string;
  uploadTimeSource: 'filename' | 'r2_fallback';
  publicUrl: string;
  fileType: 'image' | 'pdf' | 'other';
}

export interface ListMediaParams {
  folder?: string;
  fileType?: 'all' | 'image' | 'pdf' | 'other';
  search?: string;
  sortBy?: 'name' | 'uploadedAt' | 'modifiedAt' | 'size';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ListMediaResult {
  ok: boolean;
  items: MediaItem[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  folders: {
    name: string;
    count: number;
  }[];
}

export interface BatchDeleteResult {
  ok: boolean;
  deletedKeys: string[];
  errors: Array<{ key: string; error: string }>;
}

export interface SimulatedR2StoreItem {
  Key: string;
  Size: number;
  LastModified: Date;
}

let simulatedR2Store: SimulatedR2StoreItem[] = [];
let isSimulatedStoreExplicitlySet = false;

export function __setSimulatedR2ObjectsForTesting(
  items: Array<{ key?: string; Key?: string; size?: number; Size?: number; lastModified?: Date; LastModified?: Date }>
): void {
  isSimulatedStoreExplicitlySet = true;
  simulatedR2Store = items.map((it) => ({
    Key: it.Key || it.key || '',
    Size: it.Size ?? it.size ?? 1024,
    LastModified: it.LastModified || it.lastModified || new Date(),
  }));
}

export function __clearSimulatedR2ObjectsForTesting(): void {
  isSimulatedStoreExplicitlySet = true;
  simulatedR2Store = [];
}

export function __getSimulatedR2ObjectsForTesting(): SimulatedR2StoreItem[] {
  return simulatedR2Store;
}

let lastIssuedEpochSecond = 0;

/**
 * Reset service state for isolated unit testing
 */
export function _resetLastIssuedEpochSecondForTesting(): void {
  lastIssuedEpochSecond = 0;
}

/**
 * Hàm chuẩn hóa chuỗi tiếng Việt thành slug URL-safe không dấu
 */
export function slugifyText(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Chuẩn hóa đường dẫn thư mục R2:
 * - Cho phép [a-zA-Z0-9_/-]
 * - Chặn tuyệt đối .. và .
 * - Gộp //+ thành /
 * - Bỏ slash đầu và cuối
 * - Fallback về 'homepage' nếu rỗng
 * - Tương thích hoàn toàn cho folder phẳng cũ ('samplespages', 'homepagehero') và folder mới ('media-library/...', 'samples/pages')
 */
export function sanitizeR2Folder(folder?: string | null): string {
  if (!folder || typeof folder !== 'string') {
    return 'homepage';
  }

  // Chuẩn hóa dấu gạch chéo ngược Windows thành gạch chéo xuôi và trim
  const normalized = folder.replace(/\\+/g, '/').trim();

  // Tách thành từng phân đoạn, làm sạch ký tự và lọc các ký tự điều hướng thư mục
  const segments = normalized
    .split('/')
    .map((seg) => seg.replace(/[^a-zA-Z0-9_-]/g, ''))
    .filter((seg) => Boolean(seg) && seg !== '.' && seg !== '..');

  if (segments.length === 0) {
    return 'homepage';
  }

  return segments.join('/');
}

/**
 * Sinh tên file R2 đúng 12 chữ số theo định dạng YYMMDDHHmmss giờ Việt Nam (UTC+7)
 * Duy trì cơ chế Monotonic Sequence: Nếu có nhiều file upload trong cùng 1 giây,
 * tự động tịnh tiến +1 giây cho từng file kế tiếp để đảm bảo không trùng tên và không ghi đè.
 */
export function generateR2FileName(params?: {
  pageLevel1?: string;
  pageLevel2?: string;
  originalFileName?: string;
} | string): string {
  const originalFileName = typeof params === 'string' ? params : params?.originalFileName;

  // Trích xuất và chuẩn hóa phần mở rộng file (chữ thường, mặc định .png)
  let ext = '.png';
  if (originalFileName && originalFileName.includes('.')) {
    const rawExt = originalFileName.substring(originalFileName.lastIndexOf('.')).toLowerCase();
    const cleanExt = rawExt.replace(/[^a-z0-9.]/g, '');
    if (cleanExt.length > 1 && cleanExt.startsWith('.')) {
      ext = cleanExt;
    }
  }

  // Cơ chế Monotonic Sequence: đảm bảo mỗi file nhận 1 giây tịnh tiến duy nhất
  const nowEpochSecond = Math.floor(Date.now() / 1000);
  if (nowEpochSecond <= lastIssuedEpochSecond) {
    lastIssuedEpochSecond += 1;
  } else {
    lastIssuedEpochSecond = nowEpochSecond;
  }
  const targetEpochSecond = lastIssuedEpochSecond;

  // Format sang YYMMDDHHmmss theo múi giờ Việt Nam (UTC+7)
  const vnDate = new Date((targetEpochSecond + 7 * 3600) * 1000);
  const yy = String(vnDate.getUTCFullYear()).slice(-2);
  const MM = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(vnDate.getUTCDate()).padStart(2, '0');
  const hh = String(vnDate.getUTCHours()).padStart(2, '0');
  const mm = String(vnDate.getUTCMinutes()).padStart(2, '0');
  const ss = String(vnDate.getUTCSeconds()).padStart(2, '0');

  const fileName12Digits = `${yy}${MM}${dd}${hh}${mm}${ss}`;
  return `${fileName12Digits}${ext}`;
}

/**
 * Phân tích ngày tải lên từ 12 chữ số đầu của tên file R2 (YYMMDDHHmmss - UTC+7).
 * Kiểm tra tính hợp lệ của lịch (tháng 1-12, ngày hợp lệ kể cả năm nhuận, giờ 0-23, phút 0-59, giây 0-59).
 * Nếu không hợp lệ hoặc là file cũ (12 số ngẫu nhiên), fallback về r2LastModified với cờ 'r2_fallback'.
 */
export function parseUploadDateFromR2Key(
  key: string,
  r2LastModified?: Date | string | null
): ParsedUploadDate {
  // Chuẩn hóa fallback ISO
  let fallbackIso: string;
  if (r2LastModified instanceof Date && !isNaN(r2LastModified.getTime())) {
    fallbackIso = r2LastModified.toISOString();
  } else if (typeof r2LastModified === 'string') {
    const parsed = new Date(r2LastModified);
    fallbackIso = !isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
  } else {
    fallbackIso = new Date().toISOString();
  }

  if (!key || typeof key !== 'string') {
    return {
      uploadedAt: fallbackIso,
      uploadTimeSource: 'r2_fallback',
      isoDate: fallbackIso,
      source: 'r2_fallback',
    };
  }

  // Lấy tên file gốc
  const filename = key.includes('/') ? key.substring(key.lastIndexOf('/') + 1) : key;
  const match = filename.match(/^(\d{12})/);
  if (!match) {
    return {
      uploadedAt: fallbackIso,
      uploadTimeSource: 'r2_fallback',
      isoDate: fallbackIso,
      source: 'r2_fallback',
    };
  }

  const digits = match[1];
  const yy = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  const dd = parseInt(digits.slice(4, 6), 10);
  const hh = parseInt(digits.slice(6, 8), 10);
  const min = parseInt(digits.slice(8, 10), 10);
  const ss = parseInt(digits.slice(10, 12), 10);

  // Năm hợp lệ: 2020 - 2030 (20 - 30)
  if (yy < 20 || yy > 30) {
    return {
      uploadedAt: fallbackIso,
      uploadTimeSource: 'r2_fallback',
      isoDate: fallbackIso,
      source: 'r2_fallback',
    };
  }

  // Tháng hợp lệ: 1 - 12
  if (mm < 1 || mm > 12) {
    return {
      uploadedAt: fallbackIso,
      uploadTimeSource: 'r2_fallback',
      isoDate: fallbackIso,
      source: 'r2_fallback',
    };
  }

  // Ngày hợp lệ theo tháng (kể cả kiểm tra năm nhuận cho tháng 2)
  const fullYear = 2000 + yy;
  const maxDays = new Date(Date.UTC(fullYear, mm, 0)).getUTCDate();
  if (dd < 1 || dd > maxDays) {
    return {
      uploadedAt: fallbackIso,
      uploadTimeSource: 'r2_fallback',
      isoDate: fallbackIso,
      source: 'r2_fallback',
    };
  }

  // Giờ, phút, giây hợp lệ
  if (hh < 0 || hh > 23 || min < 0 || min > 59 || ss < 0 || ss > 59) {
    return {
      uploadedAt: fallbackIso,
      uploadTimeSource: 'r2_fallback',
      isoDate: fallbackIso,
      source: 'r2_fallback',
    };
  }

  // Đổi từ giờ Việt Nam (UTC+7) sang chuẩn UTC
  const utcEpochMs = Date.UTC(fullYear, mm - 1, dd, hh, min, ss) - 7 * 3600 * 1000;
  const uploadedAt = new Date(utcEpochMs).toISOString();

  return {
    uploadedAt,
    uploadTimeSource: 'filename',
    isoDate: uploadedAt,
    source: 'filename',
  };
}

/**
 * Phân loại định dạng tệp tin từ tên mở rộng
 */
export function getFileTypeFromExtension(filename: string): 'image' | 'pdf' | 'other' {
  const ext = (filename.includes('.') ? filename.substring(filename.lastIndexOf('.')) : '').toLowerCase();
  const imageExts = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif', '.bmp', '.ico']);
  if (imageExts.has(ext)) return 'image';
  if (ext === '.pdf') return 'pdf';
  return 'other';
}

/**
 * Trích xuất object key từ URL hoặc chuỗi key R2.
 * Trả về null nếu đây là URL ngoài (Google, Unsplash, v.v.) để bảo đảm an toàn.
 */
export function extractR2ObjectKey(urlOrKey: string): string | null {
  if (!urlOrKey || typeof urlOrKey !== 'string') return null;
  const trimmed = urlOrKey.trim();
  if (!trimmed) return null;

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed.replace(/^\/+/, '');
  }

  try {
    const parsed = new URL(trimmed);
    const pathname = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));

    const mediaHost = R2_PUBLIC_DOMAIN ? new URL(R2_PUBLIC_DOMAIN).hostname : '';
    const isR2Host =
      (mediaHost && parsed.hostname === mediaHost) ||
      parsed.hostname.endsWith('.r2.dev') ||
      parsed.hostname.includes('.r2.cloudflarestorage.com');

    if (!isR2Host) {
      return null;
    }

    if (parsed.hostname.includes('.r2.cloudflarestorage.com') && pathname.startsWith(R2_BUCKET_NAME + '/')) {
      return pathname.substring(R2_BUCKET_NAME.length + 1);
    }

    return pathname;
  } catch {
    return null;
  }
}

/**
 * Xóa một file khỏi Cloudflare R2 bucket nếu thuộc về R2.
 */
export async function deleteR2Object(
  urlOrKey: string
): Promise<{ deleted: boolean; key?: string; reason?: string }> {
  const objectKey = extractR2ObjectKey(urlOrKey);
  if (!objectKey) {
    return { deleted: false, reason: 'not_an_r2_url' };
  }

  if (!isSimulatedStoreExplicitlySet && isR2Configured && s3Client) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: objectKey,
        })
      );
      return { deleted: true, key: objectKey };
    } catch (err: any) {
      return { deleted: false, key: objectKey, reason: err?.message || 's3_delete_error' };
    }
  }

  simulatedR2Store = simulatedR2Store.filter((item) => item.Key !== objectKey);
  return { deleted: true, key: objectKey, reason: 'simulated_no_r2_config' };
}

/**
 * Xóa danh sách nhiều object trên Cloudflare R2 bucket vĩnh viễn (Batch Delete)
 */
export async function deleteR2Objects(keys: string[]): Promise<BatchDeleteResult> {
  if (!Array.isArray(keys) || keys.length === 0) {
    return { ok: true, deletedKeys: [], errors: [] };
  }

  const deletedKeys: string[] = [];
  const errors: Array<{ key: string; error: string }> = [];

  if (!isSimulatedStoreExplicitlySet && isR2Configured && s3Client) {
    await Promise.all(
      keys.map(async (rawKey) => {
        if (typeof rawKey !== 'string') return;
        const isUrl = rawKey.startsWith('http://') || rawKey.startsWith('https://');
        let objectKey =
          extractR2ObjectKey(rawKey) || (!isUrl ? rawKey.replace(/^\/+/, '') : null);

        if (!objectKey) {
          if (!isUrl) {
            errors.push({ key: String(rawKey), error: 'Invalid or non-R2 object key' });
          }
          return;
        }

        if (objectKey.includes('..')) {
          objectKey = objectKey.replace(/\.\./g, '').replace(/\/+/g, '/').replace(/^\/+/, '');
        }

        try {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: R2_BUCKET_NAME,
              Key: objectKey,
            })
          );
          deletedKeys.push(objectKey);
        } catch (err: any) {
          errors.push({ key: objectKey, error: err?.message || 'DeleteObjectCommand failed' });
        }
      })
    );

    return {
      ok: errors.length === 0,
      deletedKeys,
      errors,
    };
  }

  // Chế độ mô phỏng khi chưa gắn credentials thật
  for (const rawKey of keys) {
    if (typeof rawKey !== 'string') continue;
    const isUrl = rawKey.startsWith('http://') || rawKey.startsWith('https://');
    let objectKey = extractR2ObjectKey(rawKey) || (!isUrl ? rawKey.replace(/^\/+/, '') : null);

    if (objectKey) {
      if (objectKey.includes('..')) {
        objectKey = objectKey.replace(/\.\./g, '').replace(/\/+/g, '/').replace(/^\/+/, '');
      }

      if (objectKey.includes('fail_me')) {
        errors.push({ key: objectKey, error: 'S3 DeleteObjectCommand simulated failure' });
        continue;
      }
      deletedKeys.push(objectKey);
      simulatedR2Store = simulatedR2Store.filter((item) => item.Key !== objectKey);
    }
  }

  return {
    ok: errors.length === 0,
    deletedKeys,
    errors,
  };
}

/**
 * Duyệt toàn bộ object trong bucket qua vòng lặp ContinuationToken,
 * phân loại folder, hỗ trợ lọc, tìm kiếm, sắp xếp và phân trang.
 */
export async function listR2Objects(params: ListMediaParams = {}): Promise<ListMediaResult> {
  const rawObjects: Array<{ Key: string; Size: number; LastModified?: Date }> = [];

  if (isSimulatedStoreExplicitlySet) {
    for (const item of simulatedR2Store) {
      rawObjects.push({
        Key: item.Key,
        Size: item.Size,
        LastModified: item.LastModified,
      });
    }
  } else if (isR2Configured && s3Client) {
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;

    while (isTruncated) {
      const listCmd = new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        ContinuationToken: continuationToken,
      });
      const response: ListObjectsV2CommandOutput = await s3Client.send(listCmd);

      if (response.Contents) {
        for (const obj of response.Contents) {
          if (obj.Key && !obj.Key.endsWith('/')) {
            rawObjects.push({
              Key: obj.Key,
              Size: obj.Size ?? 0,
              LastModified: obj.LastModified,
            });
          }
        }
      }

      isTruncated = Boolean(response.IsTruncated);
      continuationToken = response.NextContinuationToken;
    }
  } else {
    // Dữ liệu mô phỏng fallback khi môi trường dev/test không có Cloudflare credentials
    const now = new Date();
    rawObjects.push(
      { Key: 'media-library/261112013015.png', Size: 245000, LastModified: now },
      { Key: 'media-library/banners/261112021530.webp', Size: 412000, LastModified: now },
      { Key: 'homepage/261110150000.png', Size: 189000, LastModified: now },
      { Key: 'samples/pages/261109120000.pdf', Size: 1048576, LastModified: now },
      { Key: 'samplespages/592819401824.png', Size: 154000, LastModified: new Date('2024-05-01T12:00:00Z') }
    );
  }

  // Chuyển đổi raw objects sang MediaItems chuẩn hóa
  const allItems: MediaItem[] = rawObjects.map((obj) => {
    const key = obj.Key;
    const lastSlashIndex = key.lastIndexOf('/');
    const name = lastSlashIndex >= 0 ? key.substring(lastSlashIndex + 1) : key;
    const folder = lastSlashIndex >= 0 ? key.substring(0, lastSlashIndex) : 'root';
    const size = obj.Size;
    const modifiedAt = obj.LastModified ? obj.LastModified.toISOString() : new Date().toISOString();
    const { uploadedAt, uploadTimeSource } = parseUploadDateFromR2Key(name, obj.LastModified);
    const publicUrl = R2_PUBLIC_DOMAIN ? `${R2_PUBLIC_DOMAIN}/${key}` : key;
    const fileType = getFileTypeFromExtension(name);

    return {
      key,
      name,
      folder,
      size,
      uploadedAt,
      modifiedAt,
      uploadTimeSource,
      publicUrl,
      fileType,
    };
  });

  // Tính toán danh sách folders động và số lượng file trên toàn bucket (trước khi lọc)
  const folderCountMap = new Map<string, number>();
  for (const item of allItems) {
    const f = item.folder || 'root';
    folderCountMap.set(f, (folderCountMap.get(f) || 0) + 1);
  }
  const folders = Array.from(folderCountMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Áp dụng bộ lọc
  let filtered = allItems;
  if (params.folder && params.folder !== 'all') {
    const targetFolder = params.folder.trim();
    filtered = filtered.filter(
      (item) => item.folder === targetFolder || item.folder.startsWith(targetFolder + '/')
    );
  }

  if (params.fileType && params.fileType !== 'all') {
    filtered = filtered.filter((item) => item.fileType === params.fileType);
  }

  if (params.search && params.search.trim()) {
    const term = params.search.trim().toLowerCase();
    filtered = filtered.filter(
      (item) => item.name.toLowerCase().includes(term) || item.key.toLowerCase().includes(term)
    );
  }

  // Sắp xếp đa tiêu chí
  const sortBy = params.sortBy || 'uploadedAt';
  const sortOrder = params.sortOrder || 'desc';

  filtered.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'uploadedAt') {
      cmp = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
    } else if (sortBy === 'modifiedAt') {
      cmp = new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime();
    } else if (sortBy === 'size') {
      cmp = a.size - b.size;
    } else if (sortBy === 'name') {
      cmp = a.name.localeCompare(b.name);
    }
    if (cmp === 0) {
      cmp = a.name.localeCompare(b.name);
    }
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  // Phân trang
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(params.limit) || 24));
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedItems = filtered.slice(startIndex, startIndex + limit);

  return {
    ok: true,
    items: paginatedItems,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
    },
    folders,
  };
}

/**
 * Tạo Presigned URL để Admin upload trực tiếp ảnh bìa Thumbnail, ảnh đọc thử,
 * hoặc file PDF đọc thử lên Cloudflare R2 (`media.huytutor.edu.vn`).
 */
export async function createR2PresignedUploadUrl(params: {
  folder: string;
  fileName: string;
  contentType: string;
  pageLevel1?: string;
  pageLevel2?: string;
}): Promise<PresignedUploadResult> {
  const randomFileName = generateR2FileName({
    pageLevel1: params.pageLevel1,
    pageLevel2: params.pageLevel2,
    originalFileName: params.fileName,
  });

  const safeFolder = sanitizeR2Folder(params.folder);
  const objectKey = `${safeFolder}/${randomFileName}`;
  const publicUrl = R2_PUBLIC_DOMAIN ? `${R2_PUBLIC_DOMAIN}/${objectKey}` : objectKey;

  if (isR2Configured && s3Client) {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: params.contentType,
    });
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    return {
      uploadUrl,
      publicUrl,
      objectKey,
      isSimulated: false,
    };
  }

  return {
    uploadUrl: '',
    publicUrl,
    objectKey,
    isSimulated: true,
  };
}

/**
 * Tải trực tiếp file Buffer lên Cloudflare R2 từ Backend (Bypass 100% lỗi CORS trình duyệt)
 */
export async function uploadBufferToR2(params: {
  folder: string;
  fileName: string;
  buffer: Buffer;
  contentType: string;
  pageLevel1?: string;
  pageLevel2?: string;
}): Promise<{ publicUrl: string; objectKey: string }> {
  const randomFileName = generateR2FileName({
    pageLevel1: params.pageLevel1,
    pageLevel2: params.pageLevel2,
    originalFileName: params.fileName,
  });

  const safeFolder = sanitizeR2Folder(params.folder);
  const objectKey = `${safeFolder}/${randomFileName}`;
  const publicUrl = R2_PUBLIC_DOMAIN ? `${R2_PUBLIC_DOMAIN}/${objectKey}` : objectKey;

  if (isSimulatedStoreExplicitlySet) {
    simulatedR2Store.push({
      Key: objectKey,
      Size: params.buffer ? params.buffer.length : 1024,
      LastModified: new Date(),
    });
  } else if (isR2Configured && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: params.buffer,
        ContentType: params.contentType,
      })
    );
  } else {
    simulatedR2Store.push({
      Key: objectKey,
      Size: params.buffer ? params.buffer.length : 1024,
      LastModified: new Date(),
    });
  }

  return { publicUrl, objectKey };
}

/**
 * Lớp bảo vệ Watermark số 2 (Server-side PDF Watermark Stamping bằng `pdf-lib`):
 * Đóng dấu chéo "TÀI LIỆU ĐỌC THỬ HUY TUTOR - HUYTUTOR.EDU.VN" trực tiếp vào từng trang PDF
 * trước khi lưu lên Cloudflare R2.
 */
export async function stampPdfBufferWithWatermark(
  pdfBytes: Uint8Array,
  watermarkText = 'TAI LIEU DOC THU HUY TUTOR - HUYTUTOR.EDU.VN'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  // Loại bỏ dấu tiếng Việt cho StandardFonts.HelveticaBold để tránh lỗi encoding ASCII
  const asciiWatermark = watermarkText
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  for (const page of pages) {
    const { width, height } = page.getSize();
    const positions = [
      { x: width * 0.12, y: height * 0.22 },
      { x: width * 0.12, y: height * 0.52 },
      { x: width * 0.12, y: height * 0.82 },
    ];

    for (const pos of positions) {
      page.drawText(asciiWatermark, {
        x: pos.x,
        y: pos.y,
        size: 20,
        font,
        color: rgb(0.9, 0.0, 0.28),
        opacity: 0.16,
        rotate: degrees(32),
      });
    }
  }

  return pdfDoc.save();
}
