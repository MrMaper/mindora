import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/require-role";
import { getUserById } from "@/features/users/queries";
import { ProfileCC } from "./profile-cc";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await requireAuth();
  const user = await getUserById(session.user.id);
  if (!user) notFound();

  return <ProfileCC user={user} />;
}
