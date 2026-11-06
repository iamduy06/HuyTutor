import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { SmartLink } from './SmartLink';

function getSsoUrl(): string {
  const envUrl = import.meta.env.SSO_URL;
  if (envUrl) {
    return (envUrl as string).replace(/\/+$/, '');
  }
  return '';
}

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
  const [openMobileMenuId, setOpenMobileMenuId] = useState<string | null>(null);
  const [openDesktopMenuId, setOpenDesktopMenuId] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Chỉ lấy các menu đang kích hoạt, sắp xếp theo sort_order
  const activeMenus = (menus || [])
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

  // Đóng toàn bộ dropdown khi chuyển trang
  useEffect(() => {
    setOpenMobileMenuId(null);
    setOpenDesktopMenuId(null);
    setMenuOpen(false);
  }, [location.pathname]);

  // Đóng dropdown khi click ra ngoài header
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMobileMenuId(null);
        setOpenDesktopMenuId(null);
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  const activeMobileMenuWithChildren = activeMenus.find(
    (m) => m.id === openMobileMenuId && Array.isArray(m.children) && m.children.length > 0
  );

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-2xs">
        <div className="max-w-[1360px] mx-auto px-4 h-14 flex items-center justify-between gap-2">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="Huy Tutor Trang chủ">
            <img
              src="/logo.png"
              alt="Huy Tutor"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* Navigation Menu (Desktop & Tablet ngang >= 1024px) */}
          <nav className="hidden lg:flex items-center gap-3.5 text-[11px] font-semibold text-gray-700 tracking-tight">
            {activeMenus.map((item) => {
              const active = isPathActive(item.slug);
              const hasChildren = Array.isArray(item.children) && item.children.length > 0;
              const isDesktopOpen = openDesktopMenuId === item.id;

              if (hasChildren) {
                return (
                  <div
                    key={item.id}
                    className="relative group"
                    onMouseEnter={() => setOpenDesktopMenuId(item.id)}
                    onMouseLeave={() => setOpenDesktopMenuId(null)}
                  >
                    <div className="flex items-center gap-0.5 py-4 cursor-pointer">
                      <SmartLink
                        to={item.slug}
                        openExternalInNewTab={false}
                        className={
                          active || isDesktopOpen
                            ? 'text-[#e60049] font-bold flex items-center gap-0.5 cursor-pointer'
                            : 'hover:text-[#e60049] transition flex items-center gap-0.5 cursor-pointer'
                        }
                      >
                        {item.title}
                      </SmartLink>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDesktopMenuId((prev) => (prev === item.id ? null : item.id));
                        }}
                        className="text-[9px] text-gray-500 hover:text-[#e60049] px-0.5 cursor-pointer"
                        title="Mở menu con"
                      >
                        ▾
                      </button>
                    </div>

                    {/* Submenu Dropdown */}
                    <div
                      className={`absolute left-0 top-full -mt-1 bg-white border border-gray-200 rounded-md shadow-xl py-1.5 min-w-[220px] z-50 ${
                        isDesktopOpen ? 'block' : 'hidden group-hover:block'
                      }`}
                    >
                      {item.children!.map((sub) => (
                        <SmartLink
                          key={sub.id}
                          to={sub.url}
                          openExternalInNewTab={false}
                          onClick={() => setOpenDesktopMenuId(null)}
                          className={`block px-3.5 py-2 text-xs transition ${
                            sub.is_highlight
                              ? 'text-[#e60049] font-bold bg-[#fff5f7] hover:bg-pink-100'
                              : 'text-gray-700 hover:text-[#e60049] hover:bg-gray-50'
                          }`}
                        >
                          {sub.label}
                        </SmartLink>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <SmartLink
                  key={item.id}
                  to={item.slug}
                  openExternalInNewTab={false}
                  className={
                    active
                      ? 'text-[#e60049] font-bold flex items-center gap-0.5 py-4'
                      : 'hover:text-[#e60049] transition flex items-center gap-0.5 py-4'
                  }
                >
                  {item.title}
                </SmartLink>
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
                  {user.fullName?.trim() || user.email?.split('@')[0] || 'Tài khoản'}
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-md shadow-xl py-1.5 z-50 text-xs">
                    <div className="px-3 py-1.5 border-b border-gray-100">
                      <div className="font-extrabold text-gray-900 truncate">
                        {user.fullName?.trim() || user.email?.split('@')[0] || 'Tài khoản'}
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

                    <a
                      href={`${getSsoUrl()}/devices`}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-gray-700 hover:bg-[#fff5f7] hover:text-[#e60049] font-semibold"
                    >
                      <span>Quản lý thiết bị &amp; Phiên</span>
                      <span className="text-[10px] bg-pink-100 text-[#e60049] font-extrabold px-1.5 py-0.5 rounded">SSO</span>
                    </a>

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

        {/* Tablet & Mobile Nav Bar (< 1024px) - Hỗ trợ đầy đủ menu con và mở xem nội dung như PC */}
        <div className="lg:hidden border-t border-gray-100 px-4 py-1.5 flex items-center gap-3 overflow-x-auto text-[11px] font-semibold text-gray-700 whitespace-nowrap">
          {activeMenus.map((item) => {
            const active = isPathActive(item.slug);
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
            const isOpen = openMobileMenuId === item.id;

            if (hasChildren) {
              return (
                <div key={item.id} className="inline-flex items-center gap-1">
                  <SmartLink
                    to={item.slug}
                    openExternalInNewTab={false}
                    className={
                      active || isOpen
                        ? 'text-[#e60049] font-bold'
                        : 'hover:text-[#e60049]'
                    }
                  >
                    {item.title}
                  </SmartLink>
                  <button
                    type="button"
                    onClick={() => setOpenMobileMenuId((prev) => (prev === item.id ? null : item.id))}
                    className={`px-1.5 py-0.5 rounded-xs text-[10px] cursor-pointer transition flex items-center gap-0.5 ${
                      isOpen
                        ? 'bg-[#e60049] text-white font-bold'
                        : 'bg-pink-50 text-[#e60049] hover:bg-pink-100'
                    }`}
                    title={`Mở nội dung các mục trong ${item.title}`}
                    aria-expanded={isOpen}
                  >
                    <span>Mục con</span>
                    <span className={`text-[9px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>
                </div>
              );
            }

            return (
              <SmartLink
                key={item.id}
                to={item.slug}
                openExternalInNewTab={false}
                className={
                  active
                    ? 'text-[#e60049] font-bold'
                    : 'hover:text-[#e60049]'
                }
              >
                {item.title}
              </SmartLink>
            );
          })}
        </div>

        {/* Khung hiển thị nội dung menu con cho Tablet & Mobile (Đầy đủ nội dung như ở PC) */}
        {activeMobileMenuWithChildren && (
          <div className="lg:hidden bg-white border-t border-b border-gray-200 shadow-xl px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e60049]" />
                <span className="text-[11px] font-extrabold uppercase text-[#e60049] tracking-wider">
                  Nội dung {activeMobileMenuWithChildren.title}
                </span>
                {activeMobileMenuWithChildren.slug && activeMobileMenuWithChildren.slug !== '#' && (
                  <SmartLink
                    to={activeMobileMenuWithChildren.slug}
                    onClick={() => setOpenMobileMenuId(null)}
                    className="text-[10px] text-gray-500 hover:text-[#e60049] underline ml-1"
                  >
                    (Xem tất cả)
                  </SmartLink>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpenMobileMenuId(null)}
                className="text-gray-400 hover:text-gray-700 text-xs font-bold px-2 py-0.5 rounded hover:bg-gray-100 transition cursor-pointer"
                title="Đóng menu"
              >
                ✕ Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
              {activeMobileMenuWithChildren.children!.map((sub) => (
                <SmartLink
                  key={sub.id}
                  to={sub.url}
                  openExternalInNewTab={false}
                  onClick={() => setOpenMobileMenuId(null)}
                  className={`px-3 py-2 rounded-sm text-xs transition flex items-center justify-between cursor-pointer ${
                    sub.is_highlight
                      ? 'text-[#e60049] font-bold bg-[#fff5f7] hover:bg-pink-100 border border-pink-200'
                      : 'text-gray-700 hover:text-[#e60049] hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  <span className="font-semibold">{sub.label}</span>
                  <span className="text-gray-400 text-[10px]">→</span>
                </SmartLink>
              ))}
            </div>
          </div>
        )}
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
