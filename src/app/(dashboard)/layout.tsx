import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma as db } from "@/lib/db";
import { getTranslationsAsync } from "@/i18n";
import { getUnreadCount } from "@/features/notifications/queries";
import { DirectionSync } from "@/components/DirectionSync";
import { ForcePasswordChange } from "@/components/force-password-change";
import { PresenceBeacon } from "@/components/presence-beacon";
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
import { getModuleAccess } from "@/lib/module-guard";
import { personalTaskOwnership } from "@/lib/task-access";
import {
  explicitNavModules,
  navVisibility,
  parseUiProfile,
} from "@/lib/ui-profile";
import { ensureUserPreferencesRow } from "@/features/onboarding/lifecycle";
import { MemberAreasProvider } from "@/components/member-areas-provider";
import { getMemberContext } from "@/lib/areas/server";
import { CaptureProvider } from "@/components/life/capture-provider";
import { ReminderWatcher } from "@/components/life/reminder-watcher";
import { Suspense } from "react";
import { ProductTour } from "@/components/tour/product-tour";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionCached();
  if (!session?.user) redirect("/login");

  const account = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      status: true,
      sessionVersion: true,
      mustChangePassword: true,
    },
  });
  // Stale JWT from another DB still looks logged-in; clear via route handler
  // (RSC render cannot mutate cookies — signOut here throws).
  if (!account) redirect("/api/auth/stale-session");
  if (account.status !== "ACTIVE") redirect("/api/auth/stale-session");
  const tokenSv =
    typeof session.user.sessionVersion === "number"
      ? session.user.sessionVersion
      : 0;
  if (account.sessionVersion !== tokenSv) {
    redirect("/api/auth/stale-session");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Temporary password issued by the admin: the member must pick their own
  // before anything else renders (docs/AREAS.md §8.3).
  if (account.mustChangePassword && !isAdmin) {
    const prefs = await getUserPreferencesCached(session.user.id);
    return (
      <ForcePasswordChange language={prefs?.language === "EN" ? "EN" : "FA"} />
    );
  }

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
          {
            label: t.nav.overview,
            href: "/admin",
            icon: "layout-dashboard",
          },
          { label: t.nav.users, href: "/users", icon: "users" },
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
        <PresenceBeacon />
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
  if (!preferences) after(() => ensureUserPreferencesRow(session.user.id));
  const uiProfile = parseUiProfile(preferences?.uiProfile);
  const access = await getModuleAccess(session.user.id);
  const explicit = explicitNavModules(access?.prefs ?? {}, moduleFlags);
  // Starter: Calendar shows up with the member's first dated task (§6.6).
  const hasDatedTask =
    uiProfile === "starter" && moduleFlags.tasks
      ? !!(await db.task.findFirst({
          where: { AND: [personalTaskOwnership(session.user.id), { dueDate: { not: null } }] },
          select: { id: true },
        }))
      : true;
  const show = navVisibility({
    profile: uiProfile,
    flags: moduleFlags,
    explicit,
    hasDatedTask,
  });
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
  const memberCtx = await getMemberContext(session.user.id);

  const dailyItems: NavItem[] = [
    { label: t.nav.dashboard, href: "/dashboard", icon: "layout-dashboard" },
  ];
  if (show.kanban) {
    dailyItems.push({ label: t.nav.board, href: "/kanban", icon: "columns" });
  }
  if (show.tasks) {
    dailyItems.push({ label: t.nav.tasks, href: "/tasks", icon: "list" });
  }
  if (show.calendar) {
    dailyItems.push({
      label: t.nav.calendar,
      href: "/calendar",
      icon: "calendar",
    });
  }

  const spacesItems: NavItem[] = [];
  if (show.projects) {
    spacesItems.push({
      label: t.nav.projects,
      href: "/projects",
      icon: "folder",
    });
  }
  if (show.docs) {
    spacesItems.push({ label: t.nav.docs, href: "/docs", icon: "file-text" });
  }
  if (show.research) {
    spacesItems.push({
      label: t.nav.research,
      href: researchHref,
      icon: "git-branch",
    });
  }
  if (show.language) {
    spacesItems.push({
      label: t.nav.language,
      href: "/language",
      icon: "language",
    });
  }

  const reflectItems: NavItem[] = [];
  if (show.review) {
    reflectItems.push({
      label: t.nav.review,
      href: "/review",
      icon: "rotate-ccw",
    });
  }
  if (show.workLogs) {
    reflectItems.push({
      label: t.nav.workLogs,
      href: "/work-logs",
      icon: "clock",
    });
  }
  if (show.reporting) {
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
      // Starter keeps the sidebar to what it needs (§15.2); the guide returns with Full.
      items:
        uiProfile === "full"
          ? [{ label: t.nav.guide, href: "/guide", icon: "info" as const }]
          : [],
    },
  ].filter(g => g.items.length > 0);
  return (
    <div
      className="min-h-screen bg-background flex"
      dir={language === "FA" ? "rtl" : "ltr"}
    >
      <DirectionSync language={language} />
      <PresenceBeacon />
      <MemberAreasProvider areas={memberCtx.areas}>
        <CaptureProvider
          plain={uiProfile === "starter"}
          askLifePart={uiProfile === "starter" && !preferences?.firstCaptureAt}
        >
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
          <Suspense fallback={null}>
            <ProductTour
              language={language === "EN" ? "EN" : "FA"}
              eligibleOverview={
                // Starter: only after first capture (value before structure).
                // Full / already-onboarded: invite once so existing members see the map tour.
                uiProfile === "full" ||
                !!preferences?.firstCaptureAt ||
                !!preferences?.onboardingCompletedAt
              }
              completedTourIds={preferences?.completedTourIds ?? []}
              overviewCompletedAt={preferences?.productTourCompletedAt ?? null}
              show={show}
              captureEnabled
              showGuide={uiProfile === "full"}
            />
          </Suspense>
          <CommandPaletteLazy />
        </CaptureProvider>
      </MemberAreasProvider>
    </div>
  );
}
