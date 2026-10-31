import { Request, Response } from 'express';
import { dbService } from '../services/dbService';

export const catalogController = {
  /**
   * GET /api/catalog/init
   * Trả về toàn bộ dữ liệu khởi tạo cho Frontend (Menu, Danh mục, Quy tắc Combo,
   * Danh sách sản phẩm kèm 5 định dạng giá, và vùng IP khách hàng).
   * Đảm bảo 100% luồng dữ liệu Database đi qua Backend.
   */
  async getInitData(req: Request, res: Response): Promise<void> {
    try {
      const [menus, categories, comboRules, products, siteConfigs] = await Promise.all([
        dbService.getMenus(false),
        dbService.getCategories(),
        dbService.getComboRules(),
        dbService.getProducts({ includeInactive: false }),
        dbService.getSiteConfigs(),
      ]);

      res.json({
        ok: true,
        menus,
        categories,
        comboRules,
        products,
        siteConfigs,
        clientRegion: {
          country: req.clientCountry || 'VN',
          recommendedGateway: req.recommendedGateway || 'sepay',
        },
        mediaDomain: process.env.R2_DOMAIN ? process.env.R2_DOMAIN : process.env.R2_PUBLIC_DOMAIN,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải dữ liệu khởi tạo từ Backend.',
      });
    }
  },

  /**
   * GET /api/catalog/products
   */
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const categorySlug = typeof req.query.category === 'string' ? req.query.category : undefined;
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const products = await dbService.getProducts({
        categorySlug,
        search,
        includeInactive: false,
      });

      res.json({
        ok: true,
        count: products.length,
        products,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi truy vấn danh sách sản phẩm.',
      });
    }
  },

  /**
   * GET /api/catalog/products/:slug
   */
  async getProductDetail(req: Request, res: Response): Promise<void> {
    try {
      const slug = String(req.params.slug || '');
      const product = await dbService.getProductBySlugOrId(slug);
      if (!product) {
        res.status(404).json({
          ok: false,
          error: `Không tìm thấy sản phẩm với mã/slug "${slug}".`,
        });
        return;
      }

      const allInCat = await dbService.getProducts({
        categorySlug: product.category_slug,
        includeInactive: false,
      });
      const relatedProducts = allInCat.filter((p) => p.slug !== product.slug).slice(0, 3);

      res.json({
        ok: true,
        product,
        relatedProducts,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải chi tiết sản phẩm.',
      });
    }
  },

  /**
   * GET /api/catalog/categories/:slug
   */
  async getCategoryDetail(req: Request, res: Response): Promise<void> {
    try {
      const slug = String(req.params.slug || '');
      const categories = await dbService.getCategories();
      const category = categories.find((c) => c.slug === slug);
      if (!category) {
        res.status(404).json({
          ok: false,
          error: `Không tìm thấy danh mục "${slug}".`,
        });
        return;
      }

      const products = await dbService.getProducts({
        categorySlug: slug,
        includeInactive: false,
      });

      res.json({
        ok: true,
        category,
        products,
      });
    } catch (err: any) {
      res.status(500).json({
        ok: false,
        error: err?.message || 'Lỗi tải danh mục sản phẩm.',
      });
    }
  },
};
