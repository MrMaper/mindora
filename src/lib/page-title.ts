import type { Metadata } from "next";
import {
  getSessionCached,
  getUserPreferencesCached,
} from "@/lib/request-cache";

export async function localizedTitle(fa: string, en: string): Promise<Metadata> {
  const session = await getSessionCached();
  if (!session?.user) return { title: fa };
  const prefs = await getUserPreferencesCached(session.user.id);
  return { title: prefs?.language === "EN" ? en : fa };
}
