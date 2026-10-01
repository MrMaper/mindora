import { redirect } from "next/navigation";
import { getSessionCached } from "@/lib/request-cache";

/** Teams are retired in the person-centric model. */
export default async function TeamsRedirectPage() {
  const session = await getSessionCached();
  redirect(session?.user?.role === "ADMIN" ? "/admin" : "/dashboard");
}
