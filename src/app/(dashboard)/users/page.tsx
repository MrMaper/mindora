import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-role";
import { getUsers } from "@/features/users/queries";
import { UsersCC } from "./users-cc";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  await requireAdmin();
  const { search = "", page = "1" } = await searchParams;
  const data = await getUsers(search, Math.max(1, Number(page)));

  return <UsersCC initialData={data} search={search} page={Math.max(1, Number(page))} />;
}
