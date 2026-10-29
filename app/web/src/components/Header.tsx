import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export const Header: React.FC = () => {
  const {
    menus,
    cartItems,
    setIsCartOpen,
    setIsSearchOpen,
    toastMessage,
  } = useStore();
  const location = useLocation();

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const defaultMenus = [
    { id: '1', title: 'TRANG CHỦ', slug: '/' },
    { id: '2', title: 'FLASHCARD', slug: '/flashcard' },
    { id: '3', title: 'COMBO THPT', slug: '/combo-thpt' },
    { id: '4', title: 'TÀI LIỆU THPT', slug: '/high-school' },
    { id: '5', title: 'TÀI LIỆU THCS', slug: '/secondary-school' },
    { id: '6', title: 'TÀI LIỆU HSG', slug: '/gifted-students' },
  ];

  const navItems = menus.length > 0 ? menus.slice(0, 6) : defaultMenus;

  const isPathActive = (slug: string) => {
    if (slug === '/') return location.pathname === '/';
    return location.pathname.startsWith(slug);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1360px] mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-[#e60049] text-white flex items-center justify-center font-extrabold text-xs">
                HT
              </div>
              <span className="font-black text-[#e60049] text-sm tracking-tight uppercase">
                HUY TUTOR
              </span>
            </div>
            <span className="text-xs text-gray-600 font-medium hidden sm:inline ml-1">
              Huy Tutor
            </span>
          </Link>

          {/* Navigation Menu (100% Dynamic from Backend API) */}
          <nav className="hidden xl:flex items-center gap-4 text-[11px] font-semibold text-gray-700 tracking-tight">
            {navItems.map((item) => {
              const active = isPathActive(item.slug);
              const hasCaret =
                item.slug.includes('school') || item.slug.includes('students');
              return (
                <Link
                  key={item.id}
                  to={item.slug}
                  className={
                    active
                      ? 'text-[#e60049] font-bold flex items-center gap-0.5'
                      : 'hover:text-[#e60049] transition flex items-center gap-0.5'
                  }
                >
                  {item.title}
                  {hasCaret && <span className="text-[9px]">▾</span>}
                </Link>
              );
            })}
            <Link to="/soan-tai-lieu" className="hover:text-[#e60049] transition">
              SOẠN TÀI LIỆU
            </Link>
            <Link
              to="/other"
              className="hover:text-[#e60049] transition flex items-center gap-0.5"
            >
              TÀI LIỆU KHÁC <span className="text-[9px]">▾</span>
            </Link>
            <Link
              to="/template"
              className="hover:text-[#e60049] transition flex items-center gap-0.5"
            >
              MẪU <span className="text-[9px]">▾</span>
            </Link>
            <Link
              to="/gifts"
              className="hover:text-[#e60049] transition flex items-center gap-0.5"
            >
              TÀI LIỆU MIỄN PHÍ <span className="text-[9px]">▾</span>
            </Link>
            <Link to="/hc-rewards" className="hover:text-[#e60049] transition">
              HC REWARDS
            </Link>
            <Link to="/faq" className="hover:text-[#e60049] transition">
              CÂU HỎI THƯỜNG GẶP
            </Link>
            <Link
              to="/admin"
              className={
                location.pathname.startsWith('/admin')
                  ? 'text-[#e60049] font-extrabold'
                  : 'text-[#e60049] hover:underline font-bold'
              }
            >
              QUẢN TRỊ
            </Link>
          </nav>

          {/* Right Tools: Search & Smart Cart */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Tìm kiếm tài liệu"
              className="p-1.5 text-gray-600 hover:text-[#e60049] transition"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-2.5 py-1 rounded-sm bg-[#fff0f3] border border-[#e60049]/25 text-[#e60049] text-[11px] font-bold hover:bg-[#e60049] hover:text-white transition"
            >
              Giỏ hàng ({totalCartCount})
            </button>
          </div>
        </div>

        {/* Mobile Quick Nav */}
        <div className="xl:hidden border-t border-gray-100 px-4 py-1.5 flex items-center gap-4 overflow-x-auto text-[11px] font-semibold text-gray-700 whitespace-nowrap">
          {navItems.map((item) => (
            <Link
              key={item.id}
              to={item.slug}
              className={
                isPathActive(item.slug)
                  ? 'text-[#e60049] font-bold'
                  : 'hover:text-[#e60049]'
              }
            >
              {item.title}
            </Link>
          ))}
          <Link to="/admin" className="text-[#e60049] font-bold">
            QUẢN TRỊ
          </Link>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white text-xs font-semibold px-4 py-2.5 rounded-sm shadow-lg border-l-4 border-[#e60049]">
          {toastMessage}
        </div>
      )}
    </>
  );
};
