import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTasks } from "@/features/tasks/queries";
import { getAllActiveUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { getUserProjects } from "@/features/projects/queries";
import { TasksCC } from "./components/client";
import { SelectProvider } from "@/components/ui-kit/forms/common";
import type { TaskStatus, TaskPriority } from "@/types/db";

export const metadata: Metadata = { title: "Tasks" };

interface TasksSearchParams {
  search?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  project?: string;
  sort?: string;
  order?: string;
  page?: string;
}

export default async function TasksPage({
  searchParams,
}:  {
  searchParams: Promise<TasksSearchParams>;
}) {
  await requireModule("tasks");
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isAdmin = session.user.role === "ADMIN";

  const {
    search = "",
    status = "",
    priority = "",
    assignee = "",
    project = "",
    sort = "createdAt",
    order = "desc",
    page = "1",
  } = await searchParams;

  // For non-admins, force filter by their own user ID
  const effectiveAssignee = isAdmin ? (assignee || undefined) : session.user.id;

  // Parse project IDs (comma-separated for multi-select)
  const projectIds = project ? project.split(",").filter(Boolean) : undefined;

  const [data, users, labels, preferences, userProjects] = await Promise.all([
    getTasks({
      search,
      status: (status || undefined) as TaskStatus | undefined,
      priority: (priority || undefined) as TaskPriority | undefined,
      assigneeId: effectiveAssignee,
      projectIds,
      excludeHub: false,
      sort: sort as "title" | "priority" | "status" | "dueDate" | "createdAt",
      order: order as "asc" | "desc",
      page: Math.max(1, Number(page)),
    }),
    getAllActiveUsers(),
    getLabels(),
    getUserPreferences(session.user.id),
    getUserProjects(session.user.id, "assignable"),
  ]);

  const language = preferences?.language ?? "FA";

  return (
    <SelectProvider language={language}>
      <TasksCC
        initialData={data}
        users={users}
        labels={labels}
        userProjects={userProjects}
        filters={{ search, status, priority, assignee, project, sort, order }}
        page={Math.max(1, Number(page))}
        language={language}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </SelectProvider>
  );
}
