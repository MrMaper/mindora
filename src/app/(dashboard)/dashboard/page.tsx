import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserPreferences } from "@/features/settings/queries";
import { ensurePersonalWorkspace } from "@/features/life/workspace";
import { getPersonalDashboard } from "@/features/life/queries";
import { ensureDeadlineReminders } from "@/features/life/reminders";
import { getAllActiveUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserProjects } from "@/features/projects/queries";
import { listHabitsAction } from "@/features/habits/actions";
import { DashboardCC } from "./dashboard-cc";

export async function generateMetadata(): Promise<Metadata> {
  const session = await auth();
  const prefs = await getUserPreferences(session?.user?.id ?? "");
  const lang = prefs?.language ?? "FA";
  return { title: lang === "FA" ? "امروز" : "Today" };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await ensurePersonalWorkspace(session.user.id);
  await ensureDeadlineReminders(session.user.id);

  const [data, users, labels, userProjects, habits, prefs] = await Promise.all([
    getPersonalDashboard(session.user.id),
    getAllActiveUsers(),
    getLabels(),
    getUserProjects(session.user.id, "life"),
    listHabitsAction(),
    getUserPreferences(session.user.id),
  ]);

  return (
    <DashboardCC
      userName={session.user.name ?? ""}
      areas={data.areas}
      overdue={data.overdue}
      today={data.today}
      week={data.week}
      inbox={data.inbox}
      yesterdayLeftover={data.yesterdayLeftover}
      focusTasks={data.focusTasks}
      focusIds={data.focusIds}
      weekDays={data.weekDays}
      hoursThisWeek={data.hoursThisWeek}
      doneThisWeek={data.doneThisWeek}
      todayKey={data.todayKey}
      attention={data.attention}
      habits={habits}
      showOnboarding={!prefs?.onboardingCompletedAt}
      users={users}
      labels={labels}
      userProjects={userProjects}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
