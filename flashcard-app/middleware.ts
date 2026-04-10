import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(list: { name: string; value: string; options?: CookieOptions }[]) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              path: "/", sameSite: "lax", httpOnly: true, ...options,
            })
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // ── Protected user routes ──────────────────────────────────────────────
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/profile") ||
    path.startsWith("/learning")
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
  }

  // ── Protected admin routes ─────────────────────────────────────────────
  if (path.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    const { data: profile, error } = await supabase
      .from("users").select("role").eq("id", user.id).single();
      
    console.log("[MIDDLEWARE DEBUG] Admin access request:", {
      userId: user.id,
      profile,
      error
    });

    if (profile?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // ── Protected subadmin routes ──────────────────────────────────────────
  if (path.startsWith("/subadmin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    
    // Check role SUBADMIN/ADMIN và is_subadmin trong group_users
    const { data: profile, error: profileErr } = await supabase
      .from("users").select("role").eq("id", user.id).single();

    console.log("[MIDDLEWARE] Subadmin route check:", {
      role: profile?.role,
      profileErr
    });

    if (profile?.role === "ADMIN") {
      // Admin bypass subadmin check
    } else if (profile?.role === "SUBADMIN") {
      const { data: groupSub, error: groupErr } = await supabase
        .from("group_users")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_subadmin", true)
        .limit(1)
        .maybeSingle();
      
      console.log("[MIDDLEWARE] Subadmin group check:", {
        hasGroup: !!groupSub,
        groupErr
      });
      
      if (!groupSub) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    } else {
      return NextResponse.redirect(new URL("/dashboard", request.url));
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
  // Không redirect ngay lập tức mà chỉ redirect khi user đã đăng nhập.
  // Logic:
  //   - Chưa đăng nhập → để qua /decks/[id] (public demo, không redirect)
  //   - Đã đăng nhập → kiểm tra is_public hoặc user_decks
  //     → Có quyền: redirect /learning/[id]
  //     → Không quyền: để qua /decks/[id] (học thử)
  if (path.startsWith("/decks/") && user) {
    const parts = path.split("/");
    // /decks/[id] có đúng 3 phần: ["", "decks", "id"]
    if (parts.length === 3) {
      const deckId = parts[2];

      // Check access_level
      const { data: deck } = await supabase
        .from("decks")
        .select("access_level")
        .eq("id", deckId)
        .single();

      const levels = (deck?.access_level as any) || {};

      if (levels.public === true) {
        // Public deck: Nếu đã đăng nhập thì vào learning, chưa thì vào decks
        const targetPath = user ? `/learning/${deckId}` : `/decks/${deckId}`;
        return NextResponse.redirect(new URL(targetPath, request.url));
      }

      if (levels.auth === true) {
        // Auth deck -> go to learning directly (yêu cầu đăng nhập nên middleware sẽ tự handle login ở bước trước nếu cần)
        return NextResponse.redirect(new URL(`/learning/${deckId}`, request.url));
      }

      // Deck private → kiểm tra user_decks
      const { data: userDeck } = await supabase
        .from("user_decks")
        .select("expired_at")
        .eq("user_id", user.id)
        .eq("deck_id", deckId)
        .maybeSingle();

      if (userDeck) {
        // Có record → kiểm tra hạn
        const expiredAt = userDeck.expired_at;
        const hasAccess = !expiredAt || new Date(expiredAt) > new Date();
        if (hasAccess) {
          return NextResponse.redirect(new URL(`/learning/${deckId}`, request.url));
        }
      }

      // Không có quyền → để qua /decks/[id] (public demo)
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
