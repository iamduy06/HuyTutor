import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { SampleModal } from './components/SampleModal';
import { SearchModal } from './components/SearchModal';
import { StoreProvider } from './context/StoreContext';
import { AdminPage } from './pages/AdminPage';
import { CategoryPage } from './pages/CategoryPage';
import { ComboPage } from './pages/ComboPage';
import { FlashcardPage } from './pages/FlashcardPage';
import { HeaderFooterDemoPage } from './pages/HeaderFooterDemoPage';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import {
  DonatePage,
  FaqPage,
  HcRewardsPage,
  SoanTaiLieuPage,
  TermsPage,
} from './pages/UtilityPages';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
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

              {/* 3. Các trang Tiện ích, Combo, Hỗ trợ & Chính sách */}
              <Route path="/flashcard" element={<FlashcardPage />} />
              <Route path="/combo-thpt" element={<ComboPage />} />
              <Route path="/soan-tai-lieu" element={<SoanTaiLieuPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/terms-of-service" element={<TermsPage />} />
              <Route path="/hc-rewards" element={<HcRewardsPage />} />
              <Route path="/donate" element={<DonatePage />} />
              <Route path="/header-footer" element={<HeaderFooterDemoPage />} />

              {/* 4. Trang Quản trị Admin */}
              <Route path="/admin" element={<AdminPage />} />

              {/* 5. Toàn bộ các trang Chi tiết Sản phẩm & Quà tặng (:categorySlug/:productSlug) */}
              <Route
                path="/:categorySlug/:productSlug"
                element={<ProductDetailPage />}
              />
            </Routes>
          </div>
          <Footer />

          {/* Global Drawers & Modals */}
          <CartDrawer />
          <CheckoutModal />
          <SearchModal />
          <SampleModal />
        </div>
      </StoreProvider>
    </BrowserRouter>
  );
};

export default App;
