import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPersonalDashboard } from "@/features/life/queries";
import { getAllActiveUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserProjects } from "@/features/projects/queries";
import { listHabitsAction } from "@/features/habits/actions";
import {
  ensureDailyRemindersCached,
  ensurePersonalWorkspaceCached,
  getSessionCached,
  getUserPreferencesCached,
} from "@/lib/request-cache";
import { DashboardCC } from "./dashboard-cc";

export async function generateMetadata(): Promise<Metadata> {
  const session = await getSessionCached();
  const prefs = await getUserPreferencesCached(session?.user?.id ?? "");
  const lang = prefs?.language ?? "FA";
  return { title: lang === "FA" ? "امروز" : "Today" };
}

export default async function DashboardPage() {
  const session = await getSessionCached();
  if (!session?.user) redirect("/login");

  // Once per request tree (not every sidebar click): bootstrap + daily reminders
  await ensurePersonalWorkspaceCached(session.user.id);
  await ensureDailyRemindersCached(session.user.id);

  const [data, users, labels, userProjects, habits, prefs] = await Promise.all([
    getPersonalDashboard(session.user.id),
    getAllActiveUsers(),
    getLabels(),
    getUserProjects(session.user.id, "life"),
    listHabitsAction(),
    getUserPreferencesCached(session.user.id),
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
