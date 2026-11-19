import { Router } from 'express';
import { cartController } from '../controllers/cartController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

// Lấy giỏ hàng đồng bộ trên máy chủ
router.get('/', requireAuth, cartController.getCart);

// Cập nhật giỏ hàng lên máy chủ (PUT là phương thức chuẩn, POST hỗ trợ Beacon API / Keepalive)
router.put('/', requireAuth, cartController.saveCart);
router.post('/', requireAuth, cartController.saveCart);

// Xóa giỏ hàng trên máy chủ
router.delete('/', requireAuth, cartController.clearCart);

export default router;
