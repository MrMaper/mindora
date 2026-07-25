import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBoardColumns } from "@/features/kanban/queries";
import { getAllActiveUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { KanbanCC } from "./components/client";
import type { TaskPriority } from "@/types/db";

export const metadata: Metadata = { title: "Board" };

interface KanbanSearchParams {
  search?: string;
  assignee?: string;
  label?: string;
  priority?: string;
}

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: Promise<KanbanSearchParams>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const {
    search = "",
    assignee = "",
    label = "",
    priority = "",
  } = await searchParams;

  const [columns, users, labels] = await Promise.all([
    getBoardColumns({
      search: search || undefined,
      assigneeId: assignee || undefined,
      labelId: label || undefined,
      priority: (priority || undefined) as TaskPriority | undefined,
    }),
    getAllActiveUsers(),
    getLabels(),
  ]);

  return (
    <KanbanCC
      initialColumns={columns}
      users={users}
      labels={labels}
      filters={{ search, assignee, label, priority }}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
