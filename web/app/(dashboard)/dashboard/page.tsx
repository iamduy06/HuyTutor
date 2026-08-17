import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { serverApiClient } from "@/lib/server-api-client";
import { DashboardClient, DashboardData } from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Auth check only — no DB query
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All DB data goes through the Express API server
  let initialData: DashboardData = {
    profile: null,
    userDecks: [],
    extraPublicDecks: [],
    wordCounts: {},
  };

  try {
    initialData = await serverApiClient.get<DashboardData>("/me/dashboard");
  } catch (err: any) {
    console.error("[DashboardPage] API fetch error:", err?.message || err);
    if (err?.message?.includes("401") || err?.message?.toLowerCase().includes("unauthorized")) {
      redirect("/login");
    }
  }

  return <DashboardClient initialData={initialData} />;
}
