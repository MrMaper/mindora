import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getUserPreferences } from "@/features/settings/queries";
import { getAssignableUsers } from "@/features/users/queries";
import { getUserProjects } from "@/features/projects/queries";
import { getWorkLogSummary } from "@/features/work-logs/queries";
import { WorkLogsCC } from "./work-logs-cc";
import { SelectProvider } from "@/components/ui-kit/forms/common";
import type { Language } from "@/types/db";

export const metadata: Metadata = { title: "Work Logs" };

interface WorkLogsSearchParams {
  userId?: string;
  projectId?: string;
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
    dateFrom = "",
    dateTo = "",
    page = "1",
  } = await searchParams;

  // For non-admins, force filter by their own user ID
  const effectiveUserId = isAdmin ? (userId || undefined) : session.user.id;

  const [users, userProjects, preferences] = await Promise.all([
    getAssignableUsers(session.user.id),
    getUserProjects(session.user.id, "life"),
    getUserPreferences(session.user.id),
  ]);

  const language = preferences?.language ?? "FA";

  // Get summary data
  const summary = await getWorkLogSummary({
    userId: effectiveUserId,
    projectId: projectId || undefined,
    dateFrom: dateFrom ? new Date(dateFrom) : undefined,
    dateTo: dateTo ? new Date(dateTo) : undefined,
    page: Math.max(1, Number(page)),
  });

  return (
    <SelectProvider language={language}>
      <WorkLogsCC
        users={users}
        userProjects={userProjects}
        summary={summary}
        filters={{ userId, projectId, dateFrom, dateTo }}
        page={Math.max(1, Number(page))}
        language={language}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
        isAdmin={isAdmin}
      />
    </SelectProvider>
  );
}