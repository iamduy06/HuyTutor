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
  const supabase = createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let initialUser = null;
  if (authUser) {
    const { data: profile } = await supabase
      .from("users").select("*").eq("id", authUser.id).single();
    
    if (profile) {
      const { data: groupSub } = await supabase
        .from("group_users")
        .select("id")
        .eq("user_id", authUser.id)
        .eq("is_subadmin", true)
        .limit(1)
        .maybeSingle();

      initialUser = {
        ...profile,
        is_subadmin: !!groupSub
      };
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
