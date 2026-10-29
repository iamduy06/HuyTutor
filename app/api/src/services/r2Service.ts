import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'huytutor-media';
const R2_PUBLIC_DOMAIN = (
  process.env.R2_DOMAIN ||
  process.env.R2_PUBLIC_DOMAIN ||
  'https://media.huytutor.edu.vn'
).replace(/\/$/, '');

const R2_ENDPOINT =
  process.env.R2_ENDPOINT ||
  (R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`
    : '');

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
 * Tạo Presigned URL để Admin upload trực tiếp ảnh bìa Thumbnail, ảnh đọc thử,
 * hoặc file PDF đọc thử lên Cloudflare R2 (`media.huytutor.edu.vn`).
 */
export async function createR2PresignedUploadUrl(params: {
  folder: 'thumbnails' | 'previews' | 'samples' | 'banners';
  fileName: string;
  contentType: string;
}): Promise<PresignedUploadResult> {
  const safeName = params.fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
  const objectKey = `${params.folder}/${Date.now()}-${safeName}`;
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
  folder: 'thumbnails' | 'previews' | 'samples' | 'banners';
  fileName: string;
  buffer: Buffer;
  contentType: string;
}): Promise<{ publicUrl: string; objectKey: string }> {
  const safeName = params.fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-');
  const objectKey = `${params.folder}/${Date.now()}-${safeName}`;
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
