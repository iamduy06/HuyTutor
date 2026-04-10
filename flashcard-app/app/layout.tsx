import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/common/Providers";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/server";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Huy Tutor Flashcard",
  description: "Nền tảng học từ vựng tiếng Anh chuyên nghiệp",
  icons: {
    icon: "https://drive.google.com/thumbnail?id=1kiLsxoJ-i_RMjpvqkj0JNmShY7-O13Re&sz=w200",
    apple: "https://drive.google.com/thumbnail?id=1kiLsxoJ-i_RMjpvqkj0JNmShY7-O13Re&sz=w200",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Đọc session từ cookie server-side → truyền xuống client
  // Không có round-trip → không flash
  const supabase = createClient();
  // Profile sẽ được fetch ở client bởi UserContext

  return (
    <html lang="vi">
      <body className={`${bricolage.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
