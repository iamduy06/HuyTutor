import { createClient } from "@/services/supabase/server";
import { AdminUsersClient } from "./AdminUsersClient";

async function getData() {
  const supabase = await createClient();
  const [{ data: users }, { data: decks }] = await Promise.all([
    supabase.from("users").select("*").order("created_at", { ascending: false }),
    supabase.from("decks").select("id, title, level"),
  ]);
  return { users: users ?? [], decks: decks ?? [] };
}

export default async function AdminUsersPage() {
  const { users, decks } = await getData();
  return <AdminUsersClient initialUsers={users} decks={decks} />;
}
