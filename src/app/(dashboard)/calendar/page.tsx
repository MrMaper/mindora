import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ensurePersonalWorkspace } from "@/features/life/workspace";
import { getCalendarTasks } from "@/features/life/queries";
import { getAllActiveUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserProjects } from "@/features/projects/queries";
import { ensureDeadlineReminders } from "@/features/life/reminders";
import {
  addJalaliMonth,
  jalaliMonthBounds,
  jalaliOf,
} from "@/lib/life";
import { CalendarCC } from "./calendar-cc";

export const metadata: Metadata = { title: "تقویم" };

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  await ensurePersonalWorkspace(session.user.id);
  await ensureDeadlineReminders(session.user.id);

  const now = jalaliOf(new Date());
  const fromMonth = addJalaliMonth(now.jy, now.jm, -1);
  const toMonth = addJalaliMonth(now.jy, now.jm, 1);
  const from = jalaliMonthBounds(fromMonth.jy, fromMonth.jm).from;
  const to = jalaliMonthBounds(toMonth.jy, toMonth.jm).to;

  const [tasks, users, labels, userProjects] = await Promise.all([
    getCalendarTasks(session.user.id, from, to),
    getAllActiveUsers(),
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
