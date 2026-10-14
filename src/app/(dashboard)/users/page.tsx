import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/require-role";
import { getUsers } from "@/features/users/queries";
import { getSystemSettings } from "@/features/admin/system";
import { isModulePresetId } from "@/lib/modules";
import { getUserPreferences } from "@/features/settings/queries";
import { UsersCC } from "./components/client";
import { localizedTitle } from "@/lib/page-title";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("کاربرها", "Users");
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    page?: string;
    role?: string;
    status?: string;
    sort?: string;
    order?: string;
  }>;
}) {
  const session = await requireAdmin();
  if (!session?.user) redirect("/login");

  const {
    search = "",
    page = "1",
    role = "",
    status = "",
    sort = "createdAt",
    order = "desc",
  } = await searchParams;

  const [preferences, settings, users] = await Promise.all([
    getUserPreferences(session.user.id),
    getSystemSettings(),
    getUsers(
      search,
      Math.max(1, Number(page)),
      role,
      status,
      "",
      sort,
      order,
    ),
  ]);
  const language = preferences?.language ?? "FA";

  return (
    <UsersCC
      initialData={users}
      page={Math.max(1, Number(page))}
      language={language}
      defaultPreset={
        isModulePresetId(settings.defaultModulePresetAdmin)
          ? settings.defaultModulePresetAdmin
          : "starter"
      }
      filters={{ search, role, status }}
    />
  );
}
