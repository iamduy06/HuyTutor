import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { dbService } from '../services/dbService';
import { toPublicUserProfile } from '../services/authService';
import {
  createR2PresignedUploadUrl,
  deleteR2Object,
  deleteR2Objects,
  listR2Objects,
  parseUploadDateFromR2Key,
  sanitizeR2Folder,
  stampPdfBufferWithWatermark,
  uploadBufferToR2,
} from '../services/r2Service';
import { submitOrderToGoogleForm } from '../services/googleFormService';
import { isSupabaseConfigured, supabaseAdmin } from '../config/supabase';

export interface MediaUsage {
  key: string;
  location: string;
  details: string;
}

let mockUsagesForTesting: MediaUsage[] = [];

export function __setMockUsagesForTesting(usages: MediaUsage[]): void {
  mockUsagesForTesting = [...usages];
}

export function __clearMockUsagesForTesting(): void {
  mockUsagesForTesting = [];
}

interface MatcherTarget {
  key: string;
  patterns: string[];
}

function buildMatcherTargets(keys: string[], r2Domain: string): MatcherTarget[] {
  const cleanDomain = r2Domain ? r2Domain.replace(/\/$/, '') : '';
  return keys.map((rawKey) => {
    const key = rawKey.trim().replace(/^\/+/, '');
    const filename = path.basename(key);
    const patterns = new Set<string>();

    patterns.add(key);
    patterns.add(encodeURI(key));

    if (cleanDomain) {
      patterns.add(`${cleanDomain}/${key}`);
      patterns.add(`${cleanDomain}/${encodeURI(key)}`);
    }

    // Khớp tên file nếu đủ đặc trưng (12 chữ số mốc thời gian)
    if (filename.length >= 10 && /^\d{12}/.test(filename)) {
      patterns.add(filename);
    }

    return {
      key: rawKey,
      patterns: Array.from(patterns),
    };
  });
}

function deepScanValue(
  value: any,
  targets: MatcherTarget[],
  location: string,
  pathPrefix: string,
  usages: MediaUsage[]
): void {
  if (value === null || value === undefined) return;

  if (typeof value === 'string') {
    for (const target of targets) {
      for (const pattern of target.patterns) {
        if (value.includes(pattern)) {
          let details = `Tham chiếu tại trường "${pathPrefix || 'nội dung'}".`;
          if (value.length > pattern.length) {
            const idx = value.indexOf(pattern);
            const start = Math.max(0, idx - 25);
            const end = Math.min(value.length, idx + pattern.length + 25);
            const snippet = value.substring(start, end).replace(/\s+/g, ' ').trim();
            details += ` Đoạn trích: "...${snippet}..."`;
          }

          usages.push({
            key: target.key,
            location,
            details,
          });
          break;
        }
      }
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      deepScanValue(item, targets, location, `${pathPrefix}[${index}]`, usages);
    });
    return;
  }

  if (typeof value === 'object') {
    for (const [k, val] of Object.entries(value)) {
      if (k === 'password_hash' || k === 'session_token' || k === 'rawBody') continue;
      deepScanValue(val, targets, location, pathPrefix ? `${pathPrefix}.${k}` : k, usages);
    }
  }
}

export const adminController = {
  /**
   * GET /api/admin/overview
   * Tải toàn bộ dữ liệu quản trị (Sản phẩm, Định dạng, Menu, Danh mục, Đơn hàng, Thống kê)
   * Tất cả luồng dữ liệu Database đi qua Backend.
   */
  async getDashboardOverview(_req: Request, res: Response): Promise<void> {
    try {
      const [products, categories, menus, comboRules, orders] = await Promise.all([
        dbService.getProducts({ includeInactive: true }),
        dbService.getCategories(),
        dbService.getMenus(true),
        dbService.getComboRules(),
        dbService.getAllOrders(),
      ]);

      const paidOrders = orders.filter((o) => o.payment_status === 'paid');
      const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      const syncedFormCount = orders.filter((o) => o.google_form_submitted).length;

      res.json({
        ok: true,
        stats: {
          totalProducts: products.length,
          activeProducts: products.filter((p) => p.is_active).length,
          totalOrders: orders.length,
          paidOrders: paidOrders.length,
          totalRevenue,
          syncedFormCount,
        },
        products,
        categories,
        menus,
        comboRules,
        orders,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải dữ liệu trang quản trị.',
      });
    }
  },

  /**
   * POST /api/admin/products
   * PUT /api/admin/products/:slug
   * Tạo mới hoặc cập nhật sản phẩm kèm 5 định dạng giá, chế độ đọc thử, watermark và repeater
   */
  async upsertProduct(req: Request, res: Response): Promise<void> {
    try {
      const slugParam = typeof req.params.slug === 'string' ? req.params.slug : undefined;
      const payload = {
        ...req.body,
        slug: req.body.slug || slugParam,
      };

      if (!payload.title) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng nhập Tên tài liệu (title).',
        });
        return;
      }

      if (payload.linked_deck_ids !== undefined && !Array.isArray(payload.linked_deck_ids)) {
        payload.linked_deck_ids = [];
      }

      const savedProduct = await dbService.upsertProduct(payload);
      res.json({
        ok: true,
        message: 'Đã lưu cấu hình sản phẩm và 5 định dạng giá vào Database thành công.',
        product: savedProduct,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi lưu sản phẩm từ Admin.',
      });
    }
  },

  /**
   * DELETE /api/admin/products/:slug
   * Xóa sản phẩm và tự động dọn dẹp toàn bộ ảnh/PDF liên quan trên Cloudflare R2
   * Kèm Cascade Cleanup gỡ liên kết tại Trang Cấp 1, Trang Combo THPT, Trang chủ và thống kê báo cáo
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const slug = String(req.params.slug || '');
      const existing = await dbService.getProductBySlugOrId(slug);
      if (!existing) {
        res.status(404).json({
          ok: false,
          error: `Không tìm thấy tài liệu "${slug}".`,
        });
        return;
      }

      const r2Urls = new Set<string>();
      if (existing.thumbnail_url) r2Urls.add(existing.thumbnail_url);
      if (existing.sample_pdf_url) r2Urls.add(existing.sample_pdf_url);
      if (Array.isArray(existing.preview_images)) {
        existing.preview_images.forEach((u) => {
          if (u) r2Urls.add(u);
        });
      }
      if (Array.isArray(existing.detail_blocks)) {
        for (const block of existing.detail_blocks) {
          const cfg = block?.config || {};
          if (cfg.image_url) r2Urls.add(cfg.image_url);
          if (cfg.pdf_url) r2Urls.add(cfg.pdf_url);
          if (Array.isArray(cfg.groups)) {
            for (const g of cfg.groups) {
              if (g?.pdf_url) r2Urls.add(g.pdf_url);
              if (Array.isArray(g?.images)) {
                g.images.forEach((img: string) => {
                  if (img) r2Urls.add(img);
                });
              }
            }
          }
          if (Array.isArray(cfg.items)) {
            for (const it of cfg.items) {
              if (it?.image_url) r2Urls.add(it.image_url);
            }
          }
        }
      }

      // Xóa vật lý file trên Cloudflare R2
      const deletedR2Urls: string[] = [];
      await Promise.all(
        Array.from(r2Urls).map(async (url) => {
          try {
            const resDel = await deleteR2Object(url);
            if (resDel.deleted) {
              deletedR2Urls.push(url);
            }
          } catch {
            // Bỏ qua lỗi file lẻ
          }
        })
      );

      // Thực hiện Cascade Cleanup toàn diện
      const report = await dbService.cascadeDeleteProduct(slug, deletedR2Urls);

      res.json({
        ok: true,
        message: `Đã xóa tài liệu "${existing.title}" và hoàn tất cascade cleanup toàn hệ thống.`,
        deletedProduct: report?.deletedProduct || {
          id: existing.id,
          slug: existing.slug,
          title: existing.title,
        },
        report,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi xóa sản phẩm.',
      });
    }
  },

  /**
   * POST /api/admin/categories
   * Tạo mới hoặc cập nhật cấu hình Trang cấp 1 (bao gồm cả mảng blocks động)
   */
  async upsertCategory(req: Request, res: Response): Promise<void> {
    try {
      const payload = req.body;
      if (!payload.name || !payload.name.trim()) {
        res.status(400).json({ ok: false, error: 'Tên danh mục không được để trống.' });
        return;
      }
      const category = await dbService.upsertCategory(payload);
      res.json({
        ok: true,
        category,
        message: `Đã lưu cấu hình Trang cấp 1 "${category.name}" thành công!`,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi lưu danh mục cấp 1.',
      });
    }
  },

  /**
   * DELETE /api/admin/categories/:slug
   * Xóa Trang cấp 1 và dọn dẹp toàn bộ file ảnh trên Cloudflare R2
   */
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const slug = req.params.slug;
      const categories = await dbService.getCategories({ includeInactive: true });
      const targetCat = categories.find((c) => c.slug === slug || c.id === slug);
      if (targetCat) {
        const r2Urls = new Set<string>();
        if (Array.isArray(targetCat.blocks)) {
          for (const block of targetCat.blocks) {
            const cfg = block?.config || {};
            if (cfg.image_url) r2Urls.add(cfg.image_url);
            if (Array.isArray(cfg.items)) {
              for (const it of cfg.items) {
                if (it?.image_url) r2Urls.add(it.image_url);
              }
            }
          }
        }
        await Promise.all(
          Array.from(r2Urls).map((url) => deleteR2Object(url).catch(() => {}))
        );
      }

      const deleted = await dbService.deleteCategory(slug);
      res.json({
        ok: true,
        deleted,
        message: deleted
          ? `Đã xóa danh mục "${slug}" và dọn dẹp file R2 thành công.`
          : `Không tìm thấy danh mục "${slug}".`,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi xóa danh mục.',
      });
    }
  },

  /**
   * PUT /api/admin/menus
   * Cập nhật danh sách Menu điều hướng động
   */
  async getMenus(_req: Request, res: Response): Promise<void> {
    try {
      const menus = await dbService.getMenus(true);
      res.json({
        ok: true,
        menus,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải danh sách Menu.',
      });
    }
  },

  async updateMenus(req: Request, res: Response): Promise<void> {
    try {
      const { menus } = req.body;
      if (!Array.isArray(menus)) {
        res.status(400).json({ ok: false, error: 'Dữ liệu menus phải là mảng.' });
        return;
      }
      const updated = await dbService.updateMenus(menus);
      res.json({
        ok: true,
        menus: updated,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi cập nhật Menu.',
      });
    }
  },

  /**
   * POST /api/admin/upload-presign
   * Tạo Presigned URL để Admin tải ảnh bìa Thumbnail / ảnh đọc thử / PDF đọc thử lên Cloudflare R2
   */
  async createUploadPresign(req: Request, res: Response): Promise<void> {
    try {
      const {
        folder = 'thumbnails',
        fileName = 'image.png',
        contentType = 'image/png',
        pageLevel1,
        pageLevel2,
      } = req.body;

      const result = await createR2PresignedUploadUrl({
        folder: String(folder || 'thumbnails'),
        fileName: String(fileName),
        contentType: String(contentType),
        pageLevel1: pageLevel1 ? String(pageLevel1) : undefined,
        pageLevel2: pageLevel2 ? String(pageLevel2) : undefined,
      });

      res.json({
        ok: true,
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi khởi tạo Presigned URL cho Cloudflare R2.',
      });
    }
  },

  /**
   * POST /api/admin/upload-file
   * Tải trực tiếp file ảnh Thumbnail/PDF lên Cloudflare R2 từ Backend (Bypass 100% CORS trình duyệt)
   * Tên file được sinh ngẫu nhiên: [slug1_][slug2_][10_random_digits].[ext]
   */
  async uploadFileDirect(req: Request, res: Response): Promise<void> {
    try {
      const file = (req as any).file as Express.Multer.File | undefined;
      const folder = (req.body.folder as any) || 'homepage';
      const pageLevel1 = req.body.pageLevel1 ? String(req.body.pageLevel1) : undefined;
      const pageLevel2 = req.body.pageLevel2 ? String(req.body.pageLevel2) : undefined;

      if (!file) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng chọn file hợp lệ để tải lên.',
        });
        return;
      }

      const result = await uploadBufferToR2({
        folder,
        fileName: file.originalname,
        buffer: file.buffer,
        contentType: file.mimetype || 'image/png',
        pageLevel1,
        pageLevel2,
      });

      res.json({
        ok: true,
        publicUrl: result.publicUrl,
        objectKey: result.objectKey,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải file lên Cloudflare R2.',
      });
    }
  },

  /**
   * POST /api/admin/delete-file
   * Xóa file khỏi Cloudflare R2 khi thay đổi ảnh hoặc xóa block, section, item
   */
  async deleteR2File(req: Request, res: Response): Promise<void> {
    try {
      const { url, key } = req.body;
      const target = url || key;
      if (!target) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng cung cấp url hoặc key của file cần xóa trên R2.',
        });
        return;
      }

      const result = await deleteR2Object(String(target));
      res.json({
        ok: true,
        result,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi xóa file trên Cloudflare R2.',
      });
    }
  },

  // ==========================================
  // Luồng Quản lý Media R2 Tập trung
  // ==========================================

  /**
   * GET /api/admin/media
   * Duyệt toàn bộ object trong bucket qua vòng lặp ContinuationToken,
   * hỗ trợ filter folder, fileType, search, sortBy, sortOrder, page, limit.
   */
  async listMedia(req: Request, res: Response): Promise<void> {
    try {
      const folder =
        typeof req.query.folder === 'string' && req.query.folder !== 'all'
          ? req.query.folder.trim()
          : undefined;

      const rawFileType = String(req.query.fileType || 'all').toLowerCase();
      const fileType = (['all', 'image', 'pdf', 'other'].includes(rawFileType)
        ? rawFileType
        : 'all') as 'all' | 'image' | 'pdf' | 'other';

      const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;

      const rawSortBy = String(req.query.sortBy || 'uploadedAt');
      const sortBy = (['name', 'uploadedAt', 'modifiedAt', 'size'].includes(rawSortBy)
        ? rawSortBy
        : 'uploadedAt') as 'name' | 'uploadedAt' | 'modifiedAt' | 'size';

      const sortOrder = req.query.sortOrder === 'asc' ? 'asc' : 'desc';
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '24'), 10) || 24));

      const result = await listR2Objects({
        folder,
        fileType,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      res.json({
        ok: true,
        items: result.items,
        pagination: result.pagination,
        folders: result.folders,
      });
    } catch (err: any) {
      console.error('[adminController.listMedia] Error:', err);
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi khi tải danh sách tệp tin Media R2.',
        details: err?.stack || String(err),
      });
    }
  },

  /**
   * POST /api/admin/media/upload
   * Nhận multipart files[] (tối đa 50MB/file) + subfolder tùy chọn;
   * ép thư mục đích luôn nằm trong media-library hoặc media-library/<subfolder>.
   */
  async uploadMediaFiles(req: Request, res: Response): Promise<void> {
    try {
      const rawFiles = (req as any).files;
      let files: Express.Multer.File[] = [];
      if (Array.isArray(rawFiles)) {
        files = rawFiles;
      } else if (rawFiles && typeof rawFiles === 'object') {
        const dict = rawFiles as Record<string, Express.Multer.File[]>;
        files = [...(dict['files'] || []), ...(dict['files[]'] || [])];
      }

      if (!files || files.length === 0) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng chọn ít nhất 1 tệp tin hợp lệ để tải lên.',
        });
        return;
      }

      // Kiểm tra dung lượng tối đa 50MB/file
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      for (const f of files) {
        if (f.size > MAX_FILE_SIZE) {
          res.status(400).json({
            ok: false,
            error: `Tệp "${f.originalname}" vượt quá dung lượng tối đa cho phép (50MB).`,
          });
          return;
        }
      }

      // Ép thư mục đích nghiêm ngặt nằm trong media-library/ hoặc media-library/<subfolder>
      let rawSubfolder = String(req.body.subfolder || req.body.folder || '').trim();
      rawSubfolder = rawSubfolder.replace(/^\/+|\/+$/g, '');
      if (rawSubfolder.startsWith('media-library/')) {
        rawSubfolder = rawSubfolder.substring('media-library/'.length);
      } else if (rawSubfolder === 'media-library') {
        rawSubfolder = '';
      }

      const safeSubfolder = sanitizeR2Folder(rawSubfolder)
        .replace(/^homepage$/, '')
        .replace(/\.\./g, '')
        .replace(/^\/+|\/+$/g, '');

      const destFolder = safeSubfolder ? `media-library/${safeSubfolder}` : 'media-library';

      const uploaded: any[] = [];
      for (const file of files) {
        const result = await uploadBufferToR2({
          folder: destFolder,
          fileName: file.originalname,
          buffer: file.buffer,
          contentType: file.mimetype || 'application/octet-stream',
        });

        const ext = path.extname(result.objectKey).toLowerCase();
        let fileType: 'image' | 'pdf' | 'other' = 'other';
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.bmp', '.ico', '.avif'].includes(ext)) {
          fileType = 'image';
        } else if (ext === '.pdf') {
          fileType = 'pdf';
        }

        const dateInfo = parseUploadDateFromR2Key(result.objectKey, new Date());
        const filename = path.basename(result.objectKey);

        uploaded.push({
          key: result.objectKey,
          name: filename,
          folder: destFolder,
          size: file.size || file.buffer.length,
          uploadedAt: dateInfo.uploadedAt,
          modifiedAt: new Date().toISOString(),
          uploadTimeSource: dateInfo.uploadTimeSource,
          publicUrl: result.publicUrl,
          fileType,
        });
      }

      res.json({
        ok: true,
        uploaded,
        message: `Đã tải lên thành công ${uploaded.length} tệp tin vào thư mục "${destFolder}".`,
      });
    } catch (err: any) {
      console.error('[adminController.uploadMediaFiles] Error:', err);
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải tệp tin lên kho Media R2.',
        details: err?.stack || String(err),
      });
    }
  },

  /**
   * POST /api/admin/media/check-usage
   * Quét tham chiếu URL/key trong cả Supabase DB và Local JSON fallback
   * trên products, categories, menus, và toàn bộ site_configs (kể cả trong chuỗi html_content).
   */
  async checkMediaUsage(req: Request, res: Response): Promise<void> {
    try {
      const rawKeys = Array.isArray(req.body.keys)
        ? req.body.keys
        : req.body.key
          ? [req.body.key]
          : req.body.url
            ? [req.body.url]
            : [];

      if (!Array.isArray(req.body.keys) && !req.body.key && !req.body.url) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng cung cấp danh sách keys cần kiểm tra (mảng keys).',
        });
        return;
      }

      const keys: string[] = rawKeys.filter((k: any) => typeof k === 'string' && k.trim());
      if (keys.length === 0) {
        res.json({
          ok: true,
          inUse: false,
          usages: [],
        });
        return;
      }

      const r2Domain = process.env.R2_DOMAIN || '';
      const targets = buildMatcherTargets(keys, r2Domain);
      const usages: MediaUsage[] = [];

      // Quét trước các mock usages được thiết lập cho testing
      if (mockUsagesForTesting.length > 0) {
        for (const mockU of mockUsagesForTesting) {
          const matchedTarget = targets.find((t) => {
            const cleanTarget = t.key.trim().replace(/^\/+/, '');
            const cleanMockKey = mockU.key.trim().replace(/^\/+/, '');
            return (
              t.patterns.some((p) => mockU.key.includes(p) || p.includes(mockU.key)) ||
              cleanTarget === cleanMockKey ||
              cleanMockKey.endsWith(cleanTarget) ||
              cleanTarget.endsWith(cleanMockKey)
            );
          });
          if (matchedTarget) {
            usages.push(mockU);
          }
        }
      }

      // 1. Quét trên Supabase PostgreSQL (nếu cấu hình)
      if (isSupabaseConfigured && supabaseAdmin) {
        try {
          const [prodRes, catRes, menuRes, configRes] = await Promise.all([
            supabaseAdmin
              .from('products')
              .select('id, slug, title, thumbnail_url, sample_pdf_url, preview_images, detail_blocks'),
            supabaseAdmin
              .from('categories')
              .select('id, slug, name, blocks'),
            supabaseAdmin
              .from('menus')
              .select('id, name, items'),
            supabaseAdmin
              .from('site_configs')
              .select('key, value'),
          ]);

          if (Array.isArray(prodRes.data)) {
            for (const prod of prodRes.data) {
              const loc = `Sản phẩm: "${prod.title || prod.slug}" (${prod.slug})`;
              deepScanValue(prod.thumbnail_url, targets, loc, 'Ảnh bìa (thumbnail_url)', usages);
              deepScanValue(prod.sample_pdf_url, targets, loc, 'PDF đọc thử (sample_pdf_url)', usages);
              deepScanValue(prod.preview_images, targets, loc, 'Danh sách ảnh đọc thử (preview_images)', usages);
              deepScanValue(prod.detail_blocks, targets, loc, 'Bố cục chi tiết (detail_blocks)', usages);
            }
          }

          if (Array.isArray(catRes.data)) {
            for (const cat of catRes.data) {
              const loc = `Danh mục: "${cat.name || cat.slug}" (${cat.slug})`;
              deepScanValue(cat.blocks, targets, loc, 'Khối giao diện (blocks)', usages);
            }
          }

          if (Array.isArray(menuRes.data)) {
            for (const menu of menuRes.data) {
              const loc = `Menu: "${menu.name || menu.id}"`;
              deepScanValue(menu.items, targets, loc, 'Liên kết menu (items)', usages);
            }
          }

          if (Array.isArray(configRes.data)) {
            for (const cfg of configRes.data) {
              const loc = `Cấu hình hệ thống (site_configs): "${cfg.key}"`;
              deepScanValue(cfg.value, targets, loc, 'value', usages);
            }
          }
        } catch (sbErr) {
          console.warn('[adminController.checkMediaUsage] Supabase scan warning:', sbErr);
        }
      }

      // 2. Quét đồng thời trên Local JSON fallback
      try {
        let localDb: any = null;
        const localDbPath = path.resolve(__dirname, '..', '..', 'data', 'local_db.json');
        if (fs.existsSync(localDbPath)) {
          localDb = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
        }
        if (localDb) {
          if (Array.isArray(localDb.products)) {
            for (const prod of localDb.products) {
              const loc = `[Local] Sản phẩm: "${prod.title || prod.slug}" (${prod.slug})`;
              deepScanValue(prod.thumbnail_url, targets, loc, 'thumbnail_url', usages);
              deepScanValue(prod.sample_pdf_url, targets, loc, 'sample_pdf_url', usages);
              deepScanValue(prod.preview_images, targets, loc, 'preview_images', usages);
              deepScanValue(prod.detail_blocks, targets, loc, 'detail_blocks', usages);
            }
          }

          if (Array.isArray(localDb.categories)) {
            for (const cat of localDb.categories) {
              const loc = `[Local] Danh mục: "${cat.name || cat.slug}" (${cat.slug})`;
              deepScanValue(cat.blocks, targets, loc, 'blocks', usages);
            }
          }

          if (Array.isArray(localDb.menus)) {
            for (const menu of localDb.menus) {
              const loc = `[Local] Menu: "${menu.name || menu.title || menu.id}"`;
              deepScanValue(menu.items || menu.children, targets, loc, 'items', usages);
            }
          }

          if (localDb.site_configs && typeof localDb.site_configs === 'object') {
            for (const [key, val] of Object.entries(localDb.site_configs)) {
              const loc = `[Local] Cấu hình hệ thống (site_configs): "${key}"`;
              deepScanValue(val, targets, loc, 'value', usages);
            }
          }
        }
      } catch (localErr) {
        console.warn('[adminController.checkMediaUsage] Local DB scan warning:', localErr);
      }

      // Loại bỏ các mục trùng lặp theo key, location và details
      const seen = new Set<string>();
      const deduplicatedUsages = usages.filter((u) => {
        const id = `${u.key}:::${u.location}:::${u.details}`;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      res.json({
        ok: true,
        inUse: deduplicatedUsages.length > 0,
        usages: deduplicatedUsages,
      });
    } catch (err: any) {
      console.error('[adminController.checkMediaUsage] Error:', err);
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi kiểm tra mức độ sử dụng tệp tin.',
        details: err?.stack || String(err),
      });
    }
  },

  /**
   * POST /api/admin/media/delete
   * Nhận danh sách keys, gọi deleteR2Objects thực thi DeleteObjectCommand
   * xóa vật lý vĩnh viễn trên R2 bucket.
   */
  async deleteMediaFiles(req: Request, res: Response): Promise<void> {
    try {
      const rawKeys = Array.isArray(req.body.keys)
        ? req.body.keys
        : req.body.key
          ? [req.body.key]
          : req.body.url
            ? [req.body.url]
            : [];

      if (!Array.isArray(req.body.keys) && !req.body.key && !req.body.url) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng cung cấp danh sách keys cần xóa (mảng keys).',
        });
        return;
      }

      const keys: string[] = rawKeys.filter((k: any) => typeof k === 'string' && k.trim());

      const result = await deleteR2Objects(keys);

      res.json({
        ok: true,
        deletedKeys: result.deletedKeys,
        errors: result.errors || [],
        message: `Đã xóa thành công ${result.deletedKeys.length}/${keys.length} tệp tin trên Cloudflare R2 bucket.`,
      });
    } catch (err: any) {
      console.error('[adminController.deleteMediaFiles] Error:', err);
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi xóa tệp tin trên Cloudflare R2.',
        details: err?.stack || String(err),
      });
    }
  },

  /**
   * POST /api/admin/stamp-pdf
   * Đóng dấu Watermark chéo (Lớp 2 - pdf-lib) lên file PDF đọc thử trước khi lưu lên R2
   */
  async stampPdfWatermark(req: Request, res: Response): Promise<void> {
    try {
      const { pdfBase64, watermarkText } = req.body;
      if (!pdfBase64) {
        res.status(400).json({
          ok: false,
          error: 'Vui lòng gửi kèm nội dung file PDF (pdfBase64) để đóng dấu Watermark.',
        });
        return;
      }

      const rawBase64 = String(pdfBase64).replace(/^data:application\/pdf;base64,/, '');
      const inputBytes = Uint8Array.from(Buffer.from(rawBase64, 'base64'));
      const stampedBytes = await stampPdfBufferWithWatermark(
        inputBytes,
        watermarkText || 'TAI LIEU DOC THU HUY TUTOR - HUYTUTOR.EDU.VN'
      );

      res.json({
        ok: true,
        stampedPdfBase64: Buffer.from(stampedBytes).toString('base64'),
        message: 'Đã đóng dấu Watermark bảo vệ bản quyền vào từng trang PDF thành công.',
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi đóng dấu Watermark PDF.',
      });
    }
  },

  /**
   * POST /api/admin/orders/:orderCode/resync-form
   * Cho phép Admin bắn lại 14 entry của đơn hàng vào Google Form nội bộ
   */
  async resyncOrderToGoogleForm(req: Request, res: Response): Promise<void> {
    try {
      const orderCode = String(req.params.orderCode || '');
      const order = await dbService.getOrderByCode(orderCode);
      if (!order) {
        res.status(404).json({
          ok: false,
          error: `Không tìm thấy đơn hàng mã "${orderCode}".`,
        });
        return;
      }

      const syncResult = await submitOrderToGoogleForm(order);
      res.json({
        ok: true,
        syncResult,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi đồng bộ lại Google Form.',
      });
    }
  },

  /**
   * GET /api/admin/users
   * Lấy danh sách toàn bộ tài khoản người dùng & số phiên đăng nhập đang hoạt động
   */
  async getUsers(_req: Request, res: Response): Promise<void> {
    try {
      const [users, sessionCountMap] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getActiveSessionCountMap(),
      ]);
      const enrichedUsers = users.map((u) => ({
        ...toPublicUserProfile(u),
        activeSessions: sessionCountMap.get(u.id) || 0,
      }));

      res.json({
        ok: true,
        users: enrichedUsers,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải danh sách thành viên.',
      });
    }
  },

  /**
   * PUT /api/admin/users/:id/role
   * Cập nhật quyền hạn ('user' | 'admin') hoặc trạng thái hoạt động (is_active)
   */
  async updateUserRoleAndStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.params.id || '');
      const { role, isActive } = req.body;

      const updates: Record<string, any> = {};
      if (role) {
        const rUpper = String(role).toUpperCase();
        if (rUpper === 'ADMIN' || rUpper === 'SUBADMIN' || rUpper === 'USER') {
          updates.role = rUpper;
        }
      }
      if (typeof isActive === 'boolean') {
        updates.is_active = isActive;
      }

      const updated = await dbService.updateUser(userId, updates);
      if (!updated) {
        res.status(404).json({
          ok: false,
          error: 'Không tìm thấy tài khoản người dùng.',
        });
        return;
      }

      if (updates.is_active === false) {
        await dbService.revokeAllUserSessions(userId);
      }

      res.json({
        ok: true,
        user: toPublicUserProfile(updated),
        message: 'Đã cập nhật phân quyền và trạng thái tài khoản.',
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi cập nhật quyền tài khoản.',
      });
    }
  },

  /**
   * DELETE /api/admin/users/:id/sessions
   * Thu hồi toàn bộ phiên đăng nhập của một người dùng bất kỳ
   */
  async revokeUserSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = String(req.params.id || '');
      const revokedCount = await dbService.revokeAllUserSessions(userId);
      res.json({
        ok: true,
        revokedCount,
        message: `Đã thu hồi ${revokedCount} phiên đăng nhập của thành viên.`,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi thu hồi phiên đăng nhập.',
      });
    }
  },

  /**
   * GET /api/admin/configs
   * Lấy cấu hình hệ thống (mạng xã hội Footer, liên kết chính sách...)
   */
  async getSiteConfigs(_req: Request, res: Response): Promise<void> {
    try {
      const configs = await dbService.getSiteConfigs();
      res.json({
        ok: true,
        configs,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải cấu hình hệ thống.',
      });
    }
  },

  /**
   * PUT /api/admin/configs/:key
   * Cập nhật một mục cấu hình trong bảng site_configs
   */
  async updateSiteConfig(req: Request, res: Response): Promise<void> {
    try {
      const key = String(req.params.key || '');
      const { value } = req.body;
      if (!key) {
        res.status(400).json({ ok: false, error: 'Khóa cấu hình (key) không được để trống.' });
        return;
      }
      const updatedValue = await dbService.updateSiteConfig(key, value);
      res.json({
        ok: true,
        key,
        value: updatedValue,
        message: `Đã cập nhật cấu hình "${key}" thành công.`,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi cập nhật cấu hình.',
      });
    }
  },

  /**
   * GET /api/admin/block-previews/:type
   * Phuc vu anh minh hoa khoi dong co bao ve phan quyen Admin.
   * Tuyet doi khong de public: Yeu cau adminAuthMiddleware xac thuc phien role === 'admin'.
   */
  async getBlockPreviewImage(req: Request, res: Response): Promise<void> {
    try {
      const rawType = String(req.params.type || '').trim();
      const safeType = path.basename(rawType).replace(/[^a-zA-Z0-9_-]/g, '');
      if (!safeType) {
        res.status(400).json({ ok: false, error: 'Loại khối không hợp lệ.' });
        return;
      }

      let basePath = path.resolve(__dirname, '..', '..', 'assets', 'block-previews');
      if (!fs.existsSync(basePath)) {
        basePath = path.resolve(process.cwd(), 'assets', 'block-previews');
      }
      const filePath = path.join(basePath, safeType + '.png');

      if (!fs.existsSync(filePath)) {
        // Fallback xử lý riêng cho khối custom_html khi chưa có file ảnh tĩnh PNG
        if (safeType === 'custom_html') {
          const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220" fill="none">
            <rect width="400" height="220" rx="6" fill="#18181b"/>
            <rect x="0" y="0" width="400" height="32" rx="6" fill="#27272a"/>
            <circle cx="20" cy="16" r="5" fill="#ef4444"/>
            <circle cx="36" cy="16" r="5" fill="#f59e0b"/>
            <circle cx="52" cy="16" r="5" fill="#10b981"/>
            <text x="75" y="20" fill="#a1a1aa" font-family="monospace" font-size="11">custom_html_block.html</text>
            <rect x="300" y="8" width="90" height="18" rx="3" fill="#e60049"/>
            <text x="312" y="21" fill="#ffffff" font-family="sans-serif" font-size="9" font-weight="bold">CUSTOM HTML</text>
            <text x="25" y="60" fill="#38bdf8" font-family="monospace" font-size="12">&lt;div <tspan fill="#f43f5e">class</tspan>=<tspan fill="#fef08a">"huytutor-custom-section"</tspan>&gt;</text>
            <text x="45" y="85" fill="#4ade80" font-family="monospace" font-size="12">&lt;h2&gt;<tspan fill="#f4f4f5">Nội dung HTML &amp; CSS Tùy biến</tspan>&lt;/h2&gt;</text>
            <text x="45" y="110" fill="#cbd5e1" font-family="monospace" font-size="12">&lt;p&gt;<tspan fill="#94a3b8">Cô lập Shadow DOM tuyệt đối, không tràn CSS...</tspan>&lt;/p&gt;</text>
            <text x="45" y="135" fill="#fbbf24" font-family="monospace" font-size="12">&lt;img <tspan fill="#f43f5e">src</tspan>=<tspan fill="#fef08a">"/media/..."</tspan> /&gt;</text>
            <text x="25" y="160" fill="#38bdf8" font-family="monospace" font-size="12">&lt;/div&gt;</text>
            <rect x="25" y="180" width="350" height="24" rx="4" fill="#3f3f46" stroke="#52525b" stroke-dasharray="3 3"/>
            <text x="80" y="196" fill="#e4e4e7" font-family="sans-serif" font-size="10">⚡ Hỗ trợ Boxed / Full-width &amp; Thư viện Media R2</text>
          </svg>`;

          res.setHeader('Content-Type', 'image/svg+xml');
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.send(svgFallback);
          return;
        }

        res.status(404).json({ ok: false, error: 'Không tìm thấy ảnh minh họa cho khối này.' });
        return;
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi đọc ảnh minh họa khối.',
      });
    }
  },

  /**
   * GET /api/admin/flashcard-decks
   * Lấy danh sách các bộ thẻ Flashcard (decks) để liên kết với sản phẩm Shop
   */
  async getFlashcardDecks(_req: Request, res: Response): Promise<void> {
    try {
      if (!isSupabaseConfigured || !supabaseAdmin) {
        res.json({ ok: true, decks: [] });
        return;
      }
      const { data, error } = await supabaseAdmin
        .from('decks')
        .select('id, title, description, level, created_at')
        .order('title', { ascending: true });

      if (error) {
        res.status(500).json({
          ok: false,
          error: error.message || 'Lỗi truy vấn danh sách Flashcard Decks từ Supabase.',
        });
        return;
      }
      res.json({ ok: true, decks: data || [] });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi lấy danh sách Flashcard Decks.',
      });
    }
  },
};
