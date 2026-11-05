import { Router } from 'express';
import multer from 'multer';
import { catalogController } from '../controllers/catalogController';
import { orderController } from '../controllers/orderController';
import { webhookController } from '../controllers/webhookController';
import { adminController } from '../controllers/adminController';
import { authController } from '../controllers/authController';
import { userController } from '../controllers/userController';
import { ipDetectMiddleware } from '../middlewares/ipDetect';
import { adminAuthMiddleware } from '../middlewares/adminAuth';
import { requireAuth, optionalAuth } from '../middlewares/authMiddleware';

const router = Router();
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // Hỗ trợ upload ảnh/PDF tới 50MB
});

// Áp dụng nhận diện IP Việt Nam (SePay VietQR) vs Quốc tế (PayPal USD)
router.use(ipDetectMiddleware);

// 1. Luồng Xác thực & Quản lý Session (SHA3-256 + Bảng public.users / public.user_sessions)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', requireAuth, authController.me);
router.post('/auth/logout', optionalAuth, authController.logout);
router.get('/auth/logout', optionalAuth, authController.logout);
router.post('/auth/logout-all', requireAuth, authController.logoutAll);
router.get('/auth/sessions', requireAuth, authController.listSessions);
router.delete('/auth/sessions/:sessionId', requireAuth, authController.revokeSession);
router.post('/auth/change-password', requireAuth, authController.changePassword);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

// 2. Luồng Tủ sách cá nhân & Hồ sơ khách hàng
router.get('/user/library', requireAuth, userController.getLibrary);
router.get('/user/orders', requireAuth, userController.getOrders);
router.put('/user/profile', requireAuth, userController.updateProfile);

// 3. Luồng dữ liệu Catalog (Menu, Danh mục, Sản phẩm, Quy tắc Combo) từ Backend
router.get('/catalog/init', catalogController.getInitData);
router.get('/catalog/products', catalogController.getProducts);
router.get('/catalog/products/:slug', catalogController.getProductDetail);
router.get('/catalog/categories/:slug', catalogController.getCategoryDetail);

// 4. Luồng Tạo Đơn hàng & Kiểm tra trạng thái thanh toán
router.post('/orders', optionalAuth, orderController.createOrder);
router.get('/orders/:orderCode', orderController.getOrderStatus);

// 5. Luồng Webhook Thanh toán tự động (SePay VietQR, PayPal)
router.post('/webhook/sepay', webhookController.handleSepayWebhook);
router.post('/webhook/paypal', webhookController.handlePaypalWebhook);

// 6. Luồng Quản trị Admin CRUD (100% qua Backend API)
router.get('/admin/overview', adminAuthMiddleware, adminController.getDashboardOverview);
router.post('/admin/categories', adminAuthMiddleware, adminController.upsertCategory);
router.put('/admin/categories/:slug', adminAuthMiddleware, adminController.upsertCategory);
router.delete('/admin/categories/:slug', adminAuthMiddleware, adminController.deleteCategory);
router.post('/admin/products', adminAuthMiddleware, adminController.upsertProduct);
router.put('/admin/products/:slug', adminAuthMiddleware, adminController.upsertProduct);
router.delete('/admin/products/:slug', adminAuthMiddleware, adminController.deleteProduct);
router.get('/admin/menus', adminAuthMiddleware, adminController.getMenus);
router.put('/admin/menus', adminAuthMiddleware, adminController.updateMenus);
router.get('/admin/configs', adminAuthMiddleware, adminController.getSiteConfigs);
router.put('/admin/configs/:key', adminAuthMiddleware, adminController.updateSiteConfig);
router.post('/admin/upload-presign', adminAuthMiddleware, adminController.createUploadPresign);
router.post(
  '/admin/upload-file',
  adminAuthMiddleware,
  upload.single('file'),
  adminController.uploadFileDirect
);
router.post('/admin/delete-file', adminAuthMiddleware, adminController.deleteR2File);
router.post('/admin/stamp-pdf', adminAuthMiddleware, adminController.stampPdfWatermark);
router.post(
  '/admin/orders/:orderCode/resync-form',
  adminAuthMiddleware,
  adminController.resyncOrderToGoogleForm
);
router.get('/admin/block-previews/:type', adminAuthMiddleware, adminController.getBlockPreviewImage);
router.get('/admin/users', adminAuthMiddleware, adminController.getUsers);
router.put('/admin/users/:id/role', adminAuthMiddleware, adminController.updateUserRoleAndStatus);
router.delete(
  '/admin/users/:id/sessions',
  adminAuthMiddleware,
  adminController.revokeUserSessions
);

export default router;
