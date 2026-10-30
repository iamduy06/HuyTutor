import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';

export const Header: React.FC = () => {
  const {
    menus,
    cartItems,
    setIsCartOpen,
    setIsSearchOpen,
    toastMessage,
    showToast,
  } = useStore();
  const { user, isAdmin, openAuthModal, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Chỉ lấy các menu đang kích hoạt, sắp xếp theo sort_order
  const activeMenus = (menus.length > 0 ? menus : [])
    .filter((m) => m.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  const isPathActive = (slug: string) => {
    if (slug === '/') return location.pathname === '/';
    return location.pathname.startsWith(slug);
  };

  const handleLogoutClick = async () => {
    setMenuOpen(false);
    await logout();
    showToast('Đã đăng xuất khỏi tài khoản.');
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-[1360px] mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Huy Tutor Trang chủ">
            <img
              src="/logo.png"
              alt="Huy Tutor"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* Navigation Menu (100% Dynamic từ Backend Database - Zero-Hardcode) */}
          <nav className="hidden xl:flex items-center gap-3.5 text-[11px] font-semibold text-gray-700 tracking-tight">
            {activeMenus.map((item) => {
              const active = isPathActive(item.slug);
              const hasChildren = Array.isArray(item.children) && item.children.length > 0;

              if (hasChildren) {
                return (
                  <div key={item.id} className="relative group">
                    <Link
                      to={item.slug}
                      className={
                        active
                          ? 'text-[#e60049] font-bold flex items-center gap-0.5 py-4 cursor-pointer'
                          : 'hover:text-[#e60049] transition flex items-center gap-0.5 py-4 cursor-pointer'
                      }
                    >
                      {item.title}
                      <span className="text-[9px]">▾</span>
                    </Link>

                    {/* Submenu Dropdown */}
                    <div className="absolute left-0 top-full -mt-1 hidden group-hover:block bg-white border border-gray-200 rounded-md shadow-xl py-1.5 min-w-[220px] z-50">
                      {item.children!.map((sub) => (
                        <Link
                          key={sub.id}
                          to={sub.url}
                          className={`block px-3.5 py-2 text-xs transition ${
                            sub.is_highlight
                              ? 'text-[#e60049] font-bold bg-[#fff5f7] hover:bg-pink-100'
                              : 'text-gray-700 hover:text-[#e60049] hover:bg-gray-50'
                          }`}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.slug}
                  className={
                    active
                      ? 'text-[#e60049] font-bold flex items-center gap-0.5 py-4'
                      : 'hover:text-[#e60049] transition flex items-center gap-0.5 py-4'
                  }
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          {/* Right Tools: Search, Smart Cart & Account */}
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

            {!user ? (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-2.5 py-1 rounded-sm bg-[#e60049] text-white text-[11px] font-bold hover:bg-[#cc0041] transition"
              >
                Đăng nhập
              </button>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="px-2.5 py-1 rounded-sm border border-gray-300 bg-white hover:border-[#e60049] text-gray-800 text-[11px] font-bold transition"
                >
                  {user.fullName}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-md shadow-xl py-1.5 z-50 text-xs">
                    <div className="px-3 py-1.5 border-b border-gray-100">
                      <div className="font-extrabold text-gray-900 truncate">
                        {user.fullName}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">{user.email}</div>
                    </div>

                    <Link
                      to="/my-library?tab=library"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-gray-700 hover:bg-[#fff5f7] hover:text-[#e60049] font-semibold"
                    >
                      Tủ sách của tôi
                    </Link>

                    <Link
                      to="/my-library?tab=sessions"
                      onClick={() => setMenuOpen(false)}
                      className="block px-3 py-2 text-gray-700 hover:bg-[#fff5f7] hover:text-[#e60049] font-semibold"
                    >
                      Quản lý phiên đăng nhập
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 text-[#e60049] bg-[#fff5f7] hover:bg-pink-100 font-extrabold uppercase"
                      >
                        Trang quản trị Admin
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-100 font-semibold border-t border-gray-100 mt-1"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Quick Nav (100% Dynamic toàn bộ Menu) */}
        <div className="xl:hidden border-t border-gray-100 px-4 py-1.5 flex items-center gap-4 overflow-x-auto text-[11px] font-semibold text-gray-700 whitespace-nowrap">
          {activeMenus.map((item) => (
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
