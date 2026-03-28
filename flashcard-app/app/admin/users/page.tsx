import { createClient } from "@/services/supabase/server";
import { AdminUsersClient } from "./AdminUsersClient";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const [{ data: users }, { data: decks }] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: false }),
    supabase.from("decks").select("id, title, level"),
  ]);
  return <AdminUsersClient initialUsers={users ?? []} decks={decks ?? []} />;
}
