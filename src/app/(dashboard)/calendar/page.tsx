import { requireModule } from "@/lib/require-role";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ensurePersonalWorkspaceCached,
  getSessionCached,
} from "@/lib/request-cache";
import { getCalendarTasks } from "@/features/life/queries";
import { getAssignableUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserProjects } from "@/features/projects/queries";
import {
  addJalaliMonth,
  jalaliMonthBounds,
  jalaliOf,
  toDateKey,
} from "@/lib/life";
import { CalendarCC } from "./calendar-cc";
import { localizedTitle } from "@/lib/page-title";

export function generateMetadata(): Promise<Metadata> {
  return localizedTitle("تقویم", "Calendar");
}

export default async function CalendarPage() {
  await requireModule("calendar");
  const session = await getSessionCached();
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
    getUserProjects(session.user.id, "assignable"),
  ]);

  return (
    <CalendarCC
      tasks={tasks}
      users={users}
      labels={labels}
      userProjects={userProjects}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      initialTodayKey={toDateKey(new Date())}
    />
  );
}
