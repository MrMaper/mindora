import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTasks } from "@/features/tasks/queries";
import { getAssignableUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserProjects } from "@/features/projects/queries";
import {
  getSessionCached,
  getUserPreferencesCached,
} from "@/lib/request-cache";
import { TasksCC } from "./components/client";
import { SelectProvider } from "@/components/ui-kit/forms/common";
import type { TaskStatus, TaskPriority } from "@/types/db";
import { isLifeAreaValue, scopeFromFilters } from "@/lib/project-namespace";
import { localizedTitle } from "@/lib/page-title";
import { parseTaskGroup, parseTaskOrder, parseTaskSort } from "@/features/tasks/view";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("همه کارها", "All tasks");
}

interface TasksSearchParams {
  search?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  project?: string;
  area?: string;
  label?: string;
  sort?: string;
  order?: string;
  group?: string;
  page?: string;
}

export default async function TasksPage({
  searchParams,
}:  {
  searchParams: Promise<TasksSearchParams>;
}) {
  await requireModule("tasks");
  const session = await getSessionCached();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const {
    search = "",
    status = "",
    priority = "",
    assignee = "",
    project = "",
    area = "",
    label = "",
    sort: sortRaw = "createdAt",
    order: orderRaw = "desc",
    group: groupRaw = "",
    page = "1",
  } = await searchParams;

  const sort = parseTaskSort(sortRaw);
  const order = parseTaskOrder(orderRaw);
  const group = parseTaskGroup(groupRaw);

  // For non-admins, force filter by their own user ID
  const effectiveAssignee = isAdmin ? (assignee || undefined) : session.user.id;

  const [users, labelRows, preferences, userProjects] = await Promise.all([
    getAssignableUsers(session.user.id),
    getLabels(),
    getUserPreferencesCached(session.user.id),
    getUserProjects(session.user.id, "assignable"),
  ]);

  const scope = scopeFromFilters(area, project, userProjects);
  const projectIds = scope.projectId ? [scope.projectId] : undefined;

  const data = await getTasks({
    search,
    status: (status || undefined) as TaskStatus | undefined,
    priority: (priority || undefined) as TaskPriority | undefined,
    assigneeId: effectiveAssignee,
    projectIds,
    area: isLifeAreaValue(scope.area) ? scope.area : undefined,
    labelId: label || undefined,
    excludeHub: false,
    sort,
    order,
    group: group ?? undefined,
    page: Math.max(1, Number(page)),
  });

  const language = preferences?.language ?? "FA";

  return (
    <SelectProvider language={language}>
      <TasksCC
        initialData={data}
        users={users}
        labels={labelRows}
        userProjects={userProjects}
        filters={{
          search,
          status,
          priority,
          assignee,
          project: scope.projectId,
          area: scope.area,
          label,
          sort,
          order,
          group: group ?? "",
        }}
        page={Math.max(1, Number(page))}
        language={language}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </SelectProvider>
  );
}
