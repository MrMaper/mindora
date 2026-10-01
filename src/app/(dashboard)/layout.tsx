import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import { getTranslationsAsync } from "@/i18n";
import { getUnreadCount } from "@/features/notifications/queries";
import { DirectionSync } from "@/components/DirectionSync";
import { CommandPaletteLazy } from "@/components/CommandPaletteLazy";
import { DashboardShell } from "./dashboard-shell";
import type { NavGroup, NavItem } from "./sidebar-nav";
import { cookies } from "next/headers";
import {
  RESEARCH_SCOPE_COOKIE,
  researchHrefForScope,
} from "@/features/research/scope-cookie";
import {
  ensurePersonalWorkspaceCached,
  getSessionCached,
  getUserPreferencesCached,
} from "@/lib/request-cache";
import { getUserModuleFlags } from "@/lib/require-role";
import { hasModule } from "@/lib/modules";
import { areaProjectIdsForUser } from "@/lib/area-projects";
import { AreaBucketsProvider } from "@/components/area-buckets-provider";
import { CaptureProvider } from "@/components/life/capture-provider";
import { ReminderWatcher } from "@/components/life/reminder-watcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionCached();
  if (!session?.user) redirect("/login");

  const account = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });
  // Stale JWT from another DB still looks logged-in; clear via route handler
  // (RSC render cannot mutate cookies — signOut here throws).
  if (!account) redirect("/api/auth/stale-session");

  const isAdmin = session.user.role === "ADMIN";

  const [preferences, unreadCount, cookieStore, flags] = await Promise.all([
    getUserPreferencesCached(session.user.id),
    isAdmin ? Promise.resolve(0) : getUnreadCount(session.user.id),
    cookies(),
    isAdmin
      ? Promise.resolve(null)
      : getUserModuleFlags(session.user.id),
    // Warm the workspace cache in parallel with prefs (member shell needs it).
    isAdmin
      ? Promise.resolve(null)
      : ensurePersonalWorkspaceCached(session.user.id),
  ]);

  const language = preferences?.language ?? "FA";
  const t = await getTranslationsAsync(language);

  // Admin: management shell only
  if (isAdmin) {
    const adminNav: NavGroup[] = [
      {
        id: "admin",
        label: language === "FA" ? "مدیریت" : "Admin",
        items: [
          { label: t.nav.users, href: "/users", icon: "users" },
          { label: t.nav.settings, href: "/settings", icon: "settings" },
          { label: t.nav.botMessage, href: "/bale-bot", icon: "bot" },
        ],
      },
      {
        id: "guide",
        items: [{ label: t.nav.guide, href: "/guide", icon: "info" as const }],
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
          navGroups={adminNav}
          userRole={session.user.role}
          settingsHref="/settings"
          settingsLabel={t.nav.settings}
          notificationsHref="/notifications"
          notificationsLabel={t.nav.notifications}
          notificationsBadge={0}
          userName={session.user.name ?? "Admin"}
          userEmail={session.user.email ?? ""}
          userImage={session.user.image ?? undefined}
        >
          {children}
        </DashboardShell>
      </div>
    );
  }

  // Member: personal workspace already warmed in Promise.all above
  const moduleFlags = flags!;
  const rawResearchScope = cookieStore.get(RESEARCH_SCOPE_COOKIE)?.value;
  let researchScope: string | undefined;
  try {
    researchScope = rawResearchScope
      ? decodeURIComponent(rawResearchScope)
      : undefined;
  } catch {
    researchScope = rawResearchScope;
  }
  const researchHref = researchHrefForScope(researchScope);
  const areaIds = areaProjectIdsForUser(session.user.id);

  const dailyItems: NavItem[] = [
    { label: t.nav.dashboard, href: "/dashboard", icon: "layout-dashboard" },
  ];
  if (hasModule(moduleFlags, "kanban")) {
    dailyItems.push({ label: t.nav.board, href: "/kanban", icon: "columns" });
  }
  if (hasModule(moduleFlags, "tasks")) {
    dailyItems.push({ label: t.nav.tasks, href: "/tasks", icon: "list" });
  }
  if (hasModule(moduleFlags, "calendar")) {
    dailyItems.push({
      label: t.nav.calendar,
      href: "/calendar",
      icon: "calendar",
    });
  }

  const spacesItems: NavItem[] = [];
  if (hasModule(moduleFlags, "projects")) {
    spacesItems.push({
      label: t.nav.projects,
      href: "/projects",
      icon: "folder",
    });
  }
  if (hasModule(moduleFlags, "docs")) {
    spacesItems.push({ label: t.nav.docs, href: "/docs", icon: "file-text" });
  }
  if (hasModule(moduleFlags, "research")) {
    spacesItems.push({
      label: t.nav.research,
      href: researchHref,
      icon: "git-branch",
    });
  }
  if (hasModule(moduleFlags, "language")) {
    spacesItems.push({
      label: t.nav.language,
      href: "/language",
      icon: "language",
    });
  }

  const reflectItems: NavItem[] = [];
  if (hasModule(moduleFlags, "review")) {
    reflectItems.push({
      label: t.nav.review,
      href: "/review",
      icon: "rotate-ccw",
    });
  }
  if (hasModule(moduleFlags, "workLogs")) {
    reflectItems.push({
      label: t.nav.workLogs,
      href: "/work-logs",
      icon: "clock",
    });
  }
  if (hasModule(moduleFlags, "reporting")) {
    reflectItems.push({
      label: t.nav.reporting,
      href: "/reporting",
      icon: "bar-chart",
    });
  }

  const navGroups: NavGroup[] = [
    { id: "daily", label: t.nav.groupDaily, items: dailyItems },
    { id: "spaces", label: t.nav.groupSpaces, items: spacesItems },
    { id: "reflect", label: t.nav.groupReflect, items: reflectItems },
    {
      id: "guide",
      items: [{ label: t.nav.guide, href: "/guide", icon: "info" as const }],
    },
  ].filter(g => g.items.length > 0);
  return (
    <div
      className="min-h-screen bg-background flex"
      dir={language === "FA" ? "rtl" : "ltr"}
    >
      <DirectionSync language={language} />
      <AreaBucketsProvider ids={areaIds}>
        <CaptureProvider>
          <ReminderWatcher />
          <DashboardShell
            captureEnabled
            language={language}
            navGroups={navGroups}
            userRole={session.user.role}
            settingsHref="/settings"
            settingsLabel={t.nav.settings}
            notificationsHref="/notifications"
            notificationsLabel={t.nav.notifications}
            notificationsBadge={unreadCount}
            userName={session.user.name ?? "User"}
            userEmail={session.user.email ?? ""}
            userImage={session.user.image ?? undefined}
          >
            {children}
          </DashboardShell>
          <CommandPaletteLazy />
        </CaptureProvider>
      </AreaBucketsProvider>
    </div>
  );
}
