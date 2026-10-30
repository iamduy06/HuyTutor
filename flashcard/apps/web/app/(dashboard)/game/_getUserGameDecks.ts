import { redirect } from "next/navigation";
import { getServerToken } from "@/lib/serverAuth";
import { getApiUrl } from "@/lib/apiUrl";

/**
 * Lấy danh sách deck mà user có quyền truy cập qua Backend API (Render Express 5).
 * Dùng chung cho tất cả game pages.
 * Redirect về /login nếu chưa đăng nhập hoặc hết quyền.
 */
export async function getUserGameDecks() {
  const token = await getServerToken();
  if (!token) redirect("/login");

  const apiUrl = getApiUrl();

  try {
    const res = await fetch(`${apiUrl}/game/decks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      if (res.status === 401) redirect("/login");
      redirect("/dashboard");
    }

    const data = await res.json();
    if (!data.decks || data.decks.length === 0) {
      redirect("/dashboard");
    }
    return data.decks;
  } catch (err) {
    console.error("Failed to fetch game decks from backend:", err);
    redirect("/dashboard");
  }
}
