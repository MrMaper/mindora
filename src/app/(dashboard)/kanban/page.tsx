import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getBoardColumns } from "@/features/kanban/queries";
import { getAssignableUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserProjects } from "@/features/projects/queries";
import {
  getSessionCached,
  syncPlanningStatusesCached,
} from "@/lib/request-cache";
import { KanbanCC } from "./components/client";
import type { TaskPriority } from "@/types/db";
import { isLifeAreaValue, scopeFromFilters } from "@/lib/project-namespace";
import { localizedTitle } from "@/lib/page-title";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("بورد", "Board");
}

interface KanbanSearchParams {
  search?: string;
  assignee?: string;
  label?: string;
  priority?: string;
  project?: string;
  area?: string;
}

export default async function KanbanPage({
  searchParams,
}:  {
  searchParams: Promise<KanbanSearchParams>;
}) {
  await requireModule("kanban");
  const session = await getSessionCached();
  if (!session?.user) redirect("/login");

  const {
    search = "",
    assignee = "",
    label = "",
    priority = "",
    project = "",
    area = "",
  } = await searchParams;

  const effectiveAssignee = session.user.id;
  const userProjects = await getUserProjects(session.user.id, "assignable");
  const scope = scopeFromFilters(area, project, userProjects);

  await syncPlanningStatusesCached(session.user.id);

  const [columns, users, labels] = await Promise.all([
    getBoardColumns({
      search: search || undefined,
      assigneeId: effectiveAssignee,
      labelId: label || undefined,
      priority: (priority || undefined) as TaskPriority | undefined,
      projectIds: scope.projectId ? [scope.projectId] : undefined,
      area: isLifeAreaValue(scope.area) ? scope.area : undefined,
      excludeHub: false,
    }),
    getAssignableUsers(session.user.id),
    getLabels(),
  ]);

  return (
    <KanbanCC
      initialColumns={columns}
      users={users}
      labels={labels}
      userProjects={userProjects}
      filters={{
        search,
        assignee,
        label,
        priority,
        project: scope.projectId,
        area: scope.area,
      }}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
