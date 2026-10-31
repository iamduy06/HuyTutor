import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Huy Tutor SSO — Cổng Đăng Nhập Tập Trung',
  description: 'Cổng xác thực và quản lý tài khoản một chạm cho toàn bộ hệ sinh thái Huy Tutor.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="flex flex-col min-h-screen">
        <header className="py-4 border-b border-[#f0e0e7] bg-white">
          <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
            <a href="https://huytutor.edu.vn" className="flex items-center gap-2">
              <span className="text-xl font-black text-brand tracking-tight">HUY TUTOR</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-light text-brand font-semibold">SSO Portal</span>
            </a>
            <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
              <a href="https://huytutor.edu.vn" className="hover:text-brand transition-colors">Tài liệu Shop</a>
              <a href="https://flashcard.huytutor.edu.vn" className="hover:text-brand transition-colors">Flashcard Học tập</a>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          {children}
        </main>

        <footer className="py-4 text-center text-xs text-muted-foreground border-t border-[#f0e0e7] bg-white">
          <p>© {new Date().getFullYear()} Huy Tutor. Cổng đăng nhập tập trung & Quản lý bảo mật phiên làm việc.</p>
        </footer>
      </body>
    </html>
  );
}

