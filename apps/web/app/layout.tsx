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
    icon: "/brand/favicon.png",
    apple: "/brand/favicon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Đọc session từ cookie server-side → truyền xuống client
  // Không có round-trip → không flash
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  let initialUser = null;
  if (session?.access_token) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://flashcard-api.huytutor.edu.vn/api/v1";
    try {
      const res = await fetch(`${apiUrl}/me/profile`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        initialUser = data.user;
      }
    } catch (err) {
      console.error("Failed to fetch user profile from backend:", err);
    }
  }

  return (
    <html lang="vi">
      <body className={`${bricolage.variable} font-sans antialiased`}>
        <Providers initialUser={initialUser}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
