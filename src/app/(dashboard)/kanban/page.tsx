import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBoardColumns } from "@/features/kanban/queries";
import { getAllActiveUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserProjects } from "@/features/projects/queries";
import { KanbanCC } from "./components/client";
import type { TaskPriority } from "@/types/db";

export const metadata: Metadata = { title: "Board" };

interface KanbanSearchParams {
  search?: string;
  assignee?: string;
  label?: string;
  priority?: string;
  project?: string;
}

export default async function KanbanPage({
  searchParams,
}:  {
  searchParams: Promise<KanbanSearchParams>;
}) {
  await requireModule("kanban");
  const session = await auth();
  if (!session?.user) redirect("/login");

  const {
    search = "",
    assignee = "",
    label = "",
    priority = "",
    project = "",
  } = await searchParams;

  const effectiveAssignee = session.user.id;
  const projectIds = project ? project.split(",").filter(Boolean) : undefined;

  const [columns, users, labels, userProjects] = await Promise.all([
    getBoardColumns({
      search: search || undefined,
      assigneeId: effectiveAssignee,
      labelId: label || undefined,
      priority: (priority || undefined) as TaskPriority | undefined,
      projectIds,
      excludeHub: false,
    }),
    getAllActiveUsers(),
    getLabels(),
    getUserProjects(session.user.id, "assignable"),
  ]);

  return (
    <KanbanCC
      initialColumns={columns}
      users={users}
      labels={labels}
      userProjects={userProjects}
      filters={{ search, assignee, label, priority, project }}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
