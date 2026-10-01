import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserPreferences } from "@/features/settings/queries";
import { getAssignableUsers } from "@/features/users/queries";
import { getUserProjects } from "@/features/projects/queries";
import { getWorkLogSummary } from "@/features/work-logs/queries";
import { zonedDayEndFromKey, zonedDayStartFromKey } from "@/lib/life";
import { WorkLogsCC } from "./work-logs-cc";
import { SelectProvider } from "@/components/ui-kit/forms/common";
import type { Language } from "@/types/db";
import { isLifeAreaValue, scopeFromFilters } from "@/lib/project-namespace";
import { localizedTitle } from "@/lib/page-title";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("ساعت‌ها", "Hours");
}

interface WorkLogsSearchParams {
  userId?: string;
  projectId?: string;
  area?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
}

export default async function WorkLogsPage({
  searchParams,
}:  {
  searchParams: Promise<WorkLogsSearchParams>;
}) {
  await requireModule("workLogs");
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const {
    userId = "",
    projectId = "",
    area = "",
    dateFrom = "",
    dateTo = "",
    page = "1",
  } = await searchParams;

  // For non-admins, force filter by their own user ID
  const effectiveUserId = isAdmin ? (userId || undefined) : session.user.id;

  const [users, userProjects, preferences] = await Promise.all([
    getAssignableUsers(session.user.id),
    getUserProjects(session.user.id, "assignable"),
    getUserPreferences(session.user.id),
  ]);

  const language = preferences?.language ?? "FA";
  const scope = scopeFromFilters(area, projectId, userProjects);

  const isDateKey = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
  let fromKey = isDateKey(dateFrom) ? dateFrom : "";
  let toKey = isDateKey(dateTo) ? dateTo : "";
  if (fromKey && toKey && fromKey > toKey) {
    [fromKey, toKey] = [toKey, fromKey];
  }

  const summary = await getWorkLogSummary({
    userId: effectiveUserId,
    projectId: scope.projectId || undefined,
    area: isLifeAreaValue(scope.area) ? scope.area : undefined,
    dateFrom: fromKey ? zonedDayStartFromKey(fromKey) : undefined,
    dateTo: toKey ? zonedDayEndFromKey(toKey) : undefined,
    page: Math.max(1, Number(page)),
  });

  return (
    <SelectProvider language={language}>
      <WorkLogsCC
        users={users}
        userProjects={userProjects}
        summary={summary}
        filters={{
          userId,
          projectId: scope.projectId,
          area: scope.area,
          dateFrom,
          dateTo,
        }}
        page={Math.max(1, Number(page))}
        language={language}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
        isAdmin={isAdmin}
      />
    </SelectProvider>
  );
}