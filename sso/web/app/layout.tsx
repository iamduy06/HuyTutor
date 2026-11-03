import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Huy Tutor SSO — Cổng Đăng Nhập Tập Trung',
  description: 'Cổng xác thực và quản lý tài khoản một chạm cho toàn bộ hệ sinh thái Huy Tutor.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const shopUrl = process.env.SHOP_URL ? process.env.SHOP_URL : '/';
  const flashcardUrl = process.env.FLASHCARD_URL ? process.env.FLASHCARD_URL : '';

  return (
    <html lang="vi">
      <body className="flex flex-col min-h-screen bg-[#f9fafb] text-[#222222]">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-[1120px] mx-auto px-4 h-14 flex items-center justify-between">
            <a href={shopUrl} className="flex items-center gap-2 shrink-0" aria-label="Huy Tutor SSO">
              <img
                src="/logo.png"
                alt="Huy Tutor"
                className="h-8 sm:h-9 w-auto object-contain"
              />
              <span className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded-xs border border-gray-200">
                SSO
              </span>
            </a>
            <nav className="flex items-center gap-4 text-xs font-semibold text-gray-600">
              {shopUrl !== '/' && (
                <a href={shopUrl} className="hover:text-brand transition">Tài liệu Shop</a>
              )}
              {flashcardUrl && (
                <a href={flashcardUrl} className="hover:text-brand transition">Flashcard Học tập</a>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 py-8 sm:py-12">
          {children}
        </main>

        <footer className="py-4 text-center text-[11px] text-gray-500 border-t border-gray-200 bg-white">
          <div className="max-w-[1120px] mx-auto px-4">
            <p>© {new Date().getFullYear()} Huy Tutor. Cổng đăng nhập tập trung &amp; Quản lý bảo mật phiên làm việc.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
