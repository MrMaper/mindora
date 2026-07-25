import type { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTasks } from "@/features/tasks/queries";
import { getAllActiveUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserPreferences } from "@/features/settings/queries";
import { TasksCC } from "./components/client";
import { SelectProvider } from "@/components/ui-kit/forms/common";
import type { TaskStatus, TaskPriority } from "@/types/db";

export const metadata: Metadata = { title: "Tasks" };

interface TasksSearchParams {
  search?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  sort?: string;
  order?: string;
  page?: string;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<TasksSearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const {
    search = "",
    status = "",
    priority = "",
    assignee = "",
    sort = "createdAt",
    order = "desc",
    page = "1",
  } = await searchParams;

  const [data, users, labels, preferences] = await Promise.all([
    getTasks({
      search,
      status: (status || undefined) as TaskStatus | undefined,
      priority: (priority || undefined) as TaskPriority | undefined,
      assigneeId: assignee || undefined,
      sort: sort as "title" | "priority" | "status" | "dueDate" | "createdAt",
      order: order as "asc" | "desc",
      page: Math.max(1, Number(page)),
    }),
    getAllActiveUsers(),
    getLabels(),
    getUserPreferences(session.user.id),
  ]);

  const language = preferences?.language ?? "FA";

  return (
    <SelectProvider language={language}>
      <TasksCC
        initialData={data}
        users={users}
        labels={labels}
        filters={{ search, status, priority, assignee, sort, order }}
        page={Math.max(1, Number(page))}
        language={language}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </SelectProvider>
  );
}
