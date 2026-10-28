import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/common/Providers";
import { Toaster } from "@/components/ui/toaster";
import { TopProgressBar } from "@/components/common/TopProgressBar";
import { getServerToken } from "@/lib/serverAuth";
import { getApiUrl } from "@/lib/apiUrl";

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
  const token = await getServerToken();

  let initialUser = null;
  if (token) {
    const apiUrl = getApiUrl();
    try {
      const res = await fetch(`${apiUrl}/me/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
          <TopProgressBar />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
