import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/require-role";
import { getUserById } from "@/features/users/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { ProfileCC } from "./profile-cc";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireAuth();
  const user = await getUserById(session.user.id);
  if (!user) notFound();

  const preferences = await getUserPreferences(session.user.id);
  const language = preferences?.language ?? "EN";

  return <ProfileCC user={user} language={language} />;
}
