import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-role";
import { auth } from "@/auth";
import { getUsers } from "@/features/users/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { UsersCC } from "./users-cc";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const session = await requireAdmin();
  const { search = "", page = "1" } = await searchParams;
  const data = await getUsers(search, Math.max(1, Number(page)));

  const preferences = await getUserPreferences(session.user.id);
  const language = preferences?.language ?? "EN";

  return (
    <UsersCC
      initialData={data}
      search={search}
      page={Math.max(1, Number(page))}
      language={language}
    />
  );
}
