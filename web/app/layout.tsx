import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/common/Providers";
import { Toaster } from "@/components/ui/toaster";
import { createClient } from "@/lib/supabase/server";
import { serverApiClient } from "@/lib/server-api-client";

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
  // Auth check only — no DB query (just session cookie)
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let initialUser = null;
  if (authUser) {
    try {
      // All DB access goes through the Express API server
      const { profile } = await serverApiClient.get<{ profile: any }>("/me/profile");
      initialUser = profile ?? null;
    } catch {
      // If API fails (e.g. server not reachable), fall back to null — graceful degradation
      initialUser = null;
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
