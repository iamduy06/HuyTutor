import { Request, Response } from 'express';
import { dbService } from '../services/dbService';
import { canonicalizeCartItems, computeCartHash } from '../utils/hash';
import { isValidUiFormat } from '../constants/formatMapping';

export const cartController = {
  /**
   * GET /api/cart
   * Lấy giỏ hàng đồng bộ trên máy chủ của người dùng hiện tại (yêu cầu đăng nhập).
   */
  async getCart(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          ok: false,
          error: 'Vui lòng đăng nhập để sử dụng tính năng này.',
        });
        return;
      }

      const cart = await dbService.getUserCart(req.user.id);
      if (!cart) {
        res.json({
          ok: true,
          cart: {
            items: [],
            cartHash: '',
            updatedAt: null,
          },
        });
        return;
      }

      res.json({
        ok: true,
        cart: {
          items: cart.items,
          cartHash: cart.cart_hash,
          updatedAt: cart.updated_at,
        },
      });
    } catch (err: any) {
      console.error('[cartController.getCart] Error:', err);
      res.status(500).json({
        ok: false,
        error: 'Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
      });
    }
  },

  /**
   * PUT /api/cart (và POST /api/cart cho Beacon API / Keepalive)
   * Lưu hoặc cập nhật giỏ hàng từ máy khách lên máy chủ.
   * Áp dụng xác thực danh tính, kiểm tra giới hạn 50 món, format hợp lệ, và Quy tắc 1 sản phẩm phi Flashcard duy nhất.
   */
  async saveCart(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          ok: false,
          error: 'Vui lòng đăng nhập để sử dụng tính năng này.',
        });
        return;
      }

      const { items, cartHash } = req.body;
      if (!Array.isArray(items)) {
        res.status(400).json({
          ok: false,
          error: 'Dữ liệu giỏ hàng không hợp lệ (yêu cầu danh sách items).',
        });
        return;
      }

      if (items.length > 50) {
        res.status(400).json({
          ok: false,
          error: 'Số lượng sản phẩm trong giỏ vượt quá giới hạn tối đa (50 món).',
        });
        return;
      }

      // Xác thực formatCode của từng phần tử đầu vào
      for (const item of items) {
        if (item && item.formatCode && !isValidUiFormat(String(item.formatCode).trim())) {
          res.status(400).json({
            ok: false,
            error: `Định dạng sản phẩm "${item.formatCode}" không hợp lệ.`,
          });
          return;
        }
      }

      // Chuẩn hóa và làm sạch mảng items
      const canonicalItems = canonicalizeCartItems(items);

      // Quy tắc 3: Giỏ hàng chỉ cho phép tối đa 1 sản phẩm phi Flashcard duy nhất
      const nonFlashcardItems = canonicalItems.filter((i) => i.formatCode !== 'Flashcard');
      if (nonFlashcardItems.length > 1) {
        res.status(400).json({
          ok: false,
          error: 'Giỏ hàng chỉ cho phép tối đa 1 sản phẩm định dạng phi Flashcard (Word, PDF, Trang tính, Thiết kế).',
        });
        return;
      }

      // Tính toán mã băm chuẩn hóa SHA-256 trên server
      const serverHash = computeCartHash(canonicalItems);
      const effectiveHash =
        cartHash && typeof cartHash === 'string' && cartHash.trim()
          ? cartHash.trim()
          : serverHash;

      const savedCart = await dbService.saveUserCart(
        req.user.id,
        canonicalItems,
        effectiveHash
      );

      res.json({
        ok: true,
        cart: {
          items: savedCart.items,
          cartHash: savedCart.cart_hash,
          updatedAt: savedCart.updated_at,
        },
      });
    } catch (err: any) {
      console.error('[cartController.saveCart] Error:', err);
      res.status(500).json({
        ok: false,
        error: 'Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
      });
    }
  },

  /**
   * DELETE /api/cart
   * Xóa sạch toàn bộ giỏ hàng của người dùng trên máy chủ (sau khi thanh toán hoặc khi bấm làm trống giỏ).
   */
  async clearCart(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          ok: false,
          error: 'Vui lòng đăng nhập để sử dụng tính năng này.',
        });
        return;
      }

      await dbService.clearUserCart(req.user.id);

      res.json({
        ok: true,
        message: 'Giỏ hàng đã được xóa sạch trên máy chủ.',
      });
    } catch (err: any) {
      console.error('[cartController.clearCart] Error:', err);
      res.status(500).json({
        ok: false,
        error: 'Đã có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại sau hoặc liên hệ hỗ trợ.',
      });
    }
  },
};
