import { redirect } from "next/navigation";
import { getSessionCached } from "@/lib/request-cache";

export default async function TeamDetailRedirectPage() {
  const session = await getSessionCached();
  redirect(session?.user?.role === "ADMIN" ? "/users" : "/dashboard");
}
