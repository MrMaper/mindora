import { redirect } from "next/navigation";
import { getTranslationsAsync } from "@/i18n";
import { getUnreadCount } from "@/features/notifications/queries";
import { DirectionSync } from "@/components/DirectionSync";
import { CommandPaletteWrapper } from "@/components/CommandPaletteWrapper";
import { DashboardShell } from "./dashboard-shell";
import type { NavGroup } from "./sidebar-nav";
import { cookies } from "next/headers";
import {
  RESEARCH_SCOPE_COOKIE,
  researchHrefForScope,
} from "@/features/research/scope-cookie";
import {
  getSessionCached,
  getUserPreferencesCached,
} from "@/lib/request-cache";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionCached();
  if (!session?.user) redirect("/login");

  // Read-only layout: workspace/reminders run on dashboard (cached) + cron — not every nav.
  const [preferences, unreadCount, cookieStore] = await Promise.all([
    getUserPreferencesCached(session.user.id),
    getUnreadCount(session.user.id),
    cookies(),
  ]);
  const language = preferences?.language ?? "FA";
  const t = await getTranslationsAsync(language);
  const researchHref = researchHrefForScope(
    cookieStore.get(RESEARCH_SCOPE_COOKIE)?.value,
  );

  const navGroups: NavGroup[] = [
    {
      id: "daily",
      label: t.nav.groupDaily,
      items: [
        { label: t.nav.dashboard, href: "/dashboard", icon: "layout-dashboard" },
        { label: t.nav.board, href: "/kanban", icon: "columns" },
        { label: t.nav.tasks, href: "/tasks", icon: "list" },
        { label: t.nav.calendar, href: "/calendar", icon: "calendar" },
      ],
    },
    {
      id: "spaces",
      label: t.nav.groupSpaces,
      items: [
        { label: t.nav.projects, href: "/projects", icon: "folder" },
        { label: t.nav.docs, href: "/docs", icon: "file-text" },
        { label: t.nav.research, href: researchHref, icon: "git-branch" },
        { label: t.nav.language, href: "/language", icon: "language" },
      ],
    },
    {
      id: "reflect",
      label: t.nav.groupReflect,
      items: [
        { label: t.nav.review, href: "/review", icon: "rotate-ccw" },
        { label: t.nav.workLogs, href: "/work-logs", icon: "clock" },
      ],
    },
  ];

  return (
    <div
      className="min-h-screen bg-background flex"
      dir={language === "FA" ? "rtl" : "ltr"}
    >
      <DirectionSync language={language} />
      <DashboardShell
        language={language}
        navGroups={navGroups}
        userRole={session.user.role}
        settingsHref="/settings"
        settingsLabel={t.nav.settings}
        notificationsHref="/notifications"
        notificationsLabel={t.nav.notifications}
        notificationsBadge={unreadCount}
        profileHref="/profile"
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        userImage={session.user.image ?? undefined}
      >
        {children}
      </DashboardShell>
      <CommandPaletteWrapper />
    </div>
  );
}
