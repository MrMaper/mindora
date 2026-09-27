import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionCached, getUserPreferencesCached } from "@/lib/request-cache";
import { getUserModuleFlags } from "@/lib/require-role";
import { GuideView } from "./guide-view";

export async function generateMetadata(): Promise<Metadata> {
  const session = await getSessionCached();
  if (!session?.user) return { title: "راهنما" };
  const preferences = await getUserPreferencesCached(session.user.id);
  return { title: preferences?.language === "EN" ? "Guide" : "راهنما" };
}

export default async function GuidePage() {
  const session = await getSessionCached();
  if (!session?.user) redirect("/login");

  const preferences = await getUserPreferencesCached(session.user.id);
  const language = preferences?.language === "EN" ? "EN" : "FA";
  const isAdmin = session.user.role === "ADMIN";
  const flags = isAdmin ? null : await getUserModuleFlags(session.user.id);

  return <GuideView language={language} isAdmin={isAdmin} flags={flags} />;
}
