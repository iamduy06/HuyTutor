import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const path = request.nextUrl.pathname;

  // Bỏ qua các API routes (Express Backend tự xử lý auth qua roleGuard)
  if (path.startsWith("/api/")) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(list: { name: string; value: string; options?: CookieOptions }[]) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              path: "/",
              sameSite: "lax",
              httpOnly: true,
              ...options,
            })
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ── Protected user routes ──────────────────────────────────────────────
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/profile") ||
    path.startsWith("/learning") ||
    path.startsWith("/game")
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  // ── Protected admin routes (Role check do AdminLayout xử lý) ───────────
  if (path.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // ── Protected subadmin routes (Role check do SubAdminLayout xử lý) ──────
  if (path.startsWith("/subadmin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // ── Redirect logged-in users away from login/register ─────────────────
  if (["/login", "/register"].includes(path) && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── /decks (list) → dashboard nếu đã đăng nhập ────────────────────────
  if (path === "/decks" && user) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── /decks/[id] — smart redirect dựa trên quyền truy cập ──────────────
  if (path.startsWith("/decks/") && user) {
    const parts = path.split("/");
    if (parts.length === 3) {
      const deckId = parts[2];
      const { data: deck } = await supabase
        .from("decks")
        .select("access_level")
        .eq("id", deckId)
        .single();

      const levels = (deck?.access_level as any) || {};

      if (levels.public === true) {
        return NextResponse.redirect(new URL(`/learning/${deckId}`, request.url));
      }

      if (levels.auth === true) {
        return NextResponse.redirect(new URL(`/learning/${deckId}`, request.url));
      }

      const { data: userDeck } = await supabase
        .from("user_decks")
        .select("expired_at")
        .eq("user_id", user.id)
        .eq("deck_id", deckId)
        .maybeSingle();

      if (userDeck) {
        const expiredAt = userDeck.expired_at;
        const hasAccess = !expiredAt || new Date(expiredAt) > new Date();
        if (hasAccess) {
          return NextResponse.redirect(new URL(`/learning/${deckId}`, request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
