import { redirect } from "next/navigation";
import { getServerToken } from "@/lib/serverAuth";
import { getApiUrl } from "@/lib/apiUrl";
import SubAdminBrandingClient from "./client";

export default async function SubAdminBrandingPage() {
  const token = await getServerToken();
  if (!token) redirect("/login");

  const apiUrl = getApiUrl();
  const res = await fetch(`${apiUrl}/subadmin/overview`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    redirect("/subadmin");
  }

  const { hasBrandingAccess } = await res.json();
  if (!hasBrandingAccess) {
    redirect("/subadmin");
  }

  return <SubAdminBrandingClient />;
}
