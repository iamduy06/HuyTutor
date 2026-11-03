import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
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
 * Tạo tên file ngẫu nhiên theo công thức:
 * (tên trang cấp 1 (nếu có) + tên trang cấp 2 (nếu có) + 10 số ngẫu nhiên) + ext
 * Tuyệt đối không dùng tên file gốc trong link R2 theo yêu cầu.
 */
/**
 * Tạo tên file ngẫu nhiên là một số ngẫu nhiên 12 chữ số theo yêu cầu:
 * Ví dụ: 592819401824.png, 810482910385.pdf
 * Tuyệt đối không đặt tên file gốc, không ghép slug; tên file là 12 chữ số ngẫu nhiên.
 */
export function generateR2FileName(params?: {
  pageLevel1?: string;
  pageLevel2?: string;
  originalFileName?: string;
} | string): string {
  const originalFileName = typeof params === 'string' ? params : params?.originalFileName;
  const ext = (
    originalFileName && originalFileName.includes('.')
      ? originalFileName.substring(originalFileName.lastIndexOf('.'))
      : '.png'
  ).toLowerCase();

  // Sinh số ngẫu nhiên chính xác 12 chữ số (từ 100000000000 đến 999999999999)
  const random12Digits = Math.floor(100000000000 + Math.random() * 900000000000).toString();
  return `${random12Digits}${ext}`;
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

  if (isR2Configured && s3Client) {
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

  return { deleted: true, key: objectKey, reason: 'simulated_no_r2_config' };
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

  const safeFolder = params.folder.replace(/[^a-z0-9_-]/gi, '') || 'homepage';
  const objectKey = `${safeFolder}/${randomFileName}`;
  const publicUrl = `${R2_PUBLIC_DOMAIN}/${objectKey}`;

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

  const safeFolder = params.folder.replace(/[^a-z0-9_-]/gi, '') || 'homepage';
  const objectKey = `${safeFolder}/${randomFileName}`;
  const publicUrl = `${R2_PUBLIC_DOMAIN}/${objectKey}`;

  if (isR2Configured && s3Client) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: objectKey,
        Body: params.buffer,
        ContentType: params.contentType,
      })
    );
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
