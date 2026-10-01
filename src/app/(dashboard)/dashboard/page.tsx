import type { Metadata } from "next";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { getPersonalDashboard } from "@/features/life/queries";
import { getAssignableUsers } from "@/features/users/queries";
import { getLabels } from "@/features/labels/queries";
import { getUserProjects } from "@/features/projects/queries";
import { listHabitsForUser, getHabitHeatmapForUser } from "@/features/habits/queries";
import { HABIT_HEATMAP_WEEKS } from "@/features/habits/constants";
import {
  ensureDailyRemindersCached,
  ensurePersonalWorkspaceCached,
  getSessionCached,
  getUserPreferencesCached,
  syncPlanningStatusesCached,
} from "@/lib/request-cache";
import { requireModule } from "@/lib/require-role";
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
  if (session.user.role === "ADMIN") redirect("/admin");

  const { flags } = await requireModule("dashboard");

  // Workspace is usually warm from layout; reminders must not block first paint.
  await ensurePersonalWorkspaceCached(session.user.id);
  after(() => {
    void ensureDailyRemindersCached(session.user.id);
  });
  await syncPlanningStatusesCached(session.user.id);

  const habitsPromise = flags.habits
    ? listHabitsForUser(session.user.id)
    : Promise.resolve([] as Awaited<ReturnType<typeof listHabitsForUser>>);
  const heatPromise = flags.habits
    ? getHabitHeatmapForUser(session.user.id, { weeks: HABIT_HEATMAP_WEEKS })
    : Promise.resolve([] as Awaited<ReturnType<typeof getHabitHeatmapForUser>>);

  const [data, users, labels, userProjects, habits, heatDays, prefs] =
    await Promise.all([
      getPersonalDashboard(session.user.id, {
        language: flags.language,
        research: flags.research,
      }),
      getAssignableUsers(session.user.id),
      getLabels(),
      getUserProjects(session.user.id, "life"),
      habitsPromise,
      heatPromise,
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
      waiting={data.waiting}
      yesterdayLeftover={data.yesterdayLeftover}
      focusTasks={data.focusTasks}
      focusIds={data.focusIds}
      focusCandidates={data.focusCandidates}
      weekDays={data.weekDays}
      hoursThisWeek={data.hoursThisWeek}
      doneThisWeek={data.doneThisWeek}
      todayKey={data.todayKey}
      attention={data.attention}
      attentionModules={{
        language: flags.language,
        research: flags.research,
      }}
      habits={flags.habits ? habits : []}
      habitHeatDays={flags.habits ? heatDays : []}
      showOnboarding={!prefs?.onboardingCompletedAt}
      users={users}
      labels={labels}
      userProjects={userProjects}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  );
}
