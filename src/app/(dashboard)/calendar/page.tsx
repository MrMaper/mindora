import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ensurePersonalWorkspaceCached } from "@/lib/request-cache";
import { getCalendarTasks } from "@/features/life/queries";
import { getAssignableUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserProjects } from "@/features/projects/queries";
import {
  addJalaliMonth,
  jalaliMonthBounds,
  jalaliOf,
} from "@/lib/life";
import { CalendarCC } from "./calendar-cc";

export const metadata: Metadata = { title: "تقویم" };

export default async function CalendarPage() {
  await requireModule("calendar");
  const session = await auth();
  if (!session?.user) redirect("/login");
  await ensurePersonalWorkspaceCached(session.user.id);

  const now = jalaliOf(new Date());
  const fromMonth = addJalaliMonth(now.jy, now.jm, -1);
  const toMonth = addJalaliMonth(now.jy, now.jm, 1);
  const from = jalaliMonthBounds(fromMonth.jy, fromMonth.jm).from;
  const to = jalaliMonthBounds(toMonth.jy, toMonth.jm).to;

  const [tasks, users, labels, userProjects] = await Promise.all([
    getCalendarTasks(session.user.id, from, to),
    getAssignableUsers(session.user.id),
    getLabels(),
    getUserProjects(session.user.id, "life"),
  ]);

  return (
    <CalendarCC
      tasks={tasks}
      users={users}
      labels={labels}
      userProjects={userProjects}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
