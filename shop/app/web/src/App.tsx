import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthModal } from './components/AuthModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { ProductFormatSelectionModal } from './components/ProductFormatSelectionModal';
import { ComboFormatSelectionModal } from './components/ComboFormatSelectionModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SampleModal } from './components/SampleModal';
import { SearchModal } from './components/SearchModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { AdminPage } from './pages/AdminPage';
import { CategoryPage } from './pages/CategoryPage';
import { ComboPage } from './pages/ComboPage';
import { FlashcardPage } from './pages/FlashcardPage';
import { HeaderFooterDemoPage } from './pages/HeaderFooterDemoPage';
import { HomePage } from './pages/HomePage';
import { MyLibraryPage } from './pages/MyLibraryPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SingleSegmentRedirectHandler } from './components/SingleSegmentRedirectHandler';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import {
  DonatePage,
  FaqPage,
  HcRewardsPage,
  SoanTaiLieuPage,
  TermsPage,
  PrivacyPolicyPage,
  PaymentDeliveryPolicyPage,
  RefundPolicyPage,
  CopyrightPolicyPage,
  CustomDynamicPageView,
} from './pages/UtilityPages';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <div className="min-h-screen flex flex-col bg-white text-[#222222]">
            <Header />
            <div className="flex-1">
              <Routes>
                {/* 1. Trang chủ (/ và /home) */}
                <Route path="/" element={<HomePage />} />
                <Route path="/home" element={<HomePage />} />

                {/* 2. Các trang Danh mục trung gian (Category Hub Pages) */}
                <Route
                  path="/high-school"
                  element={<CategoryPage categorySlug="high-school" />}
                />
                <Route
                  path="/secondary-school"
                  element={<CategoryPage categorySlug="secondary-school" />}
                />
                <Route
                  path="/gifted-students"
                  element={<CategoryPage categorySlug="gifted-students" />}
                />
                <Route
                  path="/gifts"
                  element={<CategoryPage categorySlug="gifts" />}
                />
                <Route
                  path="/other"
                  element={<CategoryPage categorySlug="other" />}
                />
                <Route
                  path="/template"
                  element={<CategoryPage categorySlug="template" />}
                />
                <Route
                  path="/do-dung-day-hoc"
                  element={<CategoryPage categorySlug="do-dung-day-hoc" />}
                />
                <Route
                  path="/category/:categorySlug"
                  element={<CategoryPage />}
                />

                {/* 3. Các trang Tiện ích, Combo, Hỗ trợ & Chính sách */}
                <Route path="/flashcard" element={<FlashcardPage />} />
                <Route path="/combo-thpt" element={<ComboPage />} />
                <Route path="/soan-tai-lieu" element={<SoanTaiLieuPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/terms-of-service" element={<TermsPage />} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicyPage />} />
                <Route path="/payment-delivery-policy" element={<PaymentDeliveryPolicyPage />} />
                <Route path="/chinh-sach-thanh-toan-giao-hang" element={<PaymentDeliveryPolicyPage />} />
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route path="/chinh-sach-hoan-tien" element={<RefundPolicyPage />} />
                <Route path="/copyright-policy" element={<CopyrightPolicyPage />} />
                <Route path="/chinh-sach-ban-quyen" element={<CopyrightPolicyPage />} />
                <Route path="/hc-rewards" element={<HcRewardsPage />} />
                <Route path="/donate" element={<DonatePage />} />
                <Route path="/header-footer" element={<HeaderFooterDemoPage />} />

                {/* 3.1. Tuyến đường trang tuỳ biến theo khối */}
                <Route path="/p/:slug" element={<CustomDynamicPageView />} />

                {/* 4. Trang Tủ sách cá nhân, Đặt lại mật khẩu & Quản trị Admin */}
                <Route
                  path="/my-library"
                  element={
                    <ProtectedRoute allowedRoles={['user', 'admin']}>
                      <MyLibraryPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />

                {/* 5. Toàn bộ các trang Chi tiết Sản phẩm & Quà tặng (:categorySlug/:productSlug) */}
                <Route
                  path="/:categorySlug/:productSlug"
                  element={<ProductDetailPage />}
                />

                {/* 6. Tự động sửa lỗi và điều hướng an toàn cho đường dẫn 1 cấp bị dính liền slug */}
                <Route
                  path="/:singleSegment"
                  element={<SingleSegmentRedirectHandler />}
                />
              </Routes>
            </div>
            <Footer />

            {/* Global Drawers & Modals */}
            <CartDrawer />
            <CheckoutModal />
            <ProductFormatSelectionModal />
            <ComboFormatSelectionModal />
            <SearchModal />
            <SampleModal />
            <AuthModal />
            <CookieConsentBanner />
          </div>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
