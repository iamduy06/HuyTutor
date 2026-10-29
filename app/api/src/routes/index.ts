import { Router } from 'express';
import { catalogController } from '../controllers/catalogController';
import { orderController } from '../controllers/orderController';
import { webhookController } from '../controllers/webhookController';
import { adminController } from '../controllers/adminController';
import { ipDetectMiddleware } from '../middlewares/ipDetect';
import { adminAuthMiddleware } from '../middlewares/adminAuth';

const router = Router();

// Áp dụng nhận diện IP Việt Nam (SePay VietQR) vs Quốc tế (PayPal USD)
router.use(ipDetectMiddleware);

// 1. Luồng dữ liệu Catalog (Menu, Danh mục, Sản phẩm, Quy tắc Combo) từ Backend
router.get('/catalog/init', catalogController.getInitData);
router.get('/catalog/products', catalogController.getProducts);
router.get('/catalog/products/:slug', catalogController.getProductDetail);
router.get('/catalog/categories/:slug', catalogController.getCategoryDetail);

// 2. Luồng Tạo Đơn hàng & Kiểm tra trạng thái thanh toán
router.post('/orders', orderController.createOrder);
router.get('/orders/:orderCode', orderController.getOrderStatus);

// 3. Luồng Webhook Thanh toán tự động (SePay VietQR, PayPal & Giả lập Test)
router.post('/webhook/sepay', webhookController.handleSepayWebhook);
router.post('/webhook/paypal', webhookController.handlePaypalWebhook);
router.post('/webhook/simulate-payment', webhookController.simulatePaymentSuccess);

// 4. Luồng Quản trị Admin CRUD (100% qua Backend API)
router.get('/admin/overview', adminAuthMiddleware, adminController.getDashboardOverview);
router.post('/admin/products', adminAuthMiddleware, adminController.upsertProduct);
router.put('/admin/products/:slug', adminAuthMiddleware, adminController.upsertProduct);
router.delete('/admin/products/:slug', adminAuthMiddleware, adminController.deleteProduct);
router.put('/admin/menus', adminAuthMiddleware, adminController.updateMenus);
router.post('/admin/upload-presign', adminAuthMiddleware, adminController.createUploadPresign);
router.post('/admin/stamp-pdf', adminAuthMiddleware, adminController.stampPdfWatermark);
router.post(
  '/admin/orders/:orderCode/resync-form',
  adminAuthMiddleware,
  adminController.resyncOrderToGoogleForm
);

export default router;
