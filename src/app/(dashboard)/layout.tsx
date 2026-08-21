import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Icon } from "@/components/ui-kit/foundation/icon";
import type { IconName } from "@/components/ui-kit/foundation/icon";
import Image from "next/image";
import { getTranslations } from "@/i18n";
import { getUserPreferences } from "@/features/settings/queries";
import { getUnreadCount } from "@/features/notifications/queries";
import { getUserTeams } from "@/features/teams/queries";
import { DirectionSync } from "@/components/DirectionSync";
import { CommandPaletteWrapper } from "@/components/CommandPaletteWrapper";
import { SidebarNav } from "./sidebar-nav";

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
  roles?: string[];
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [preferences, unreadCount] = await Promise.all([
    getUserPreferences(session.user.id),
    getUnreadCount(session.user.id),
    getUserTeams(session.user.id),
  ]);
  const language = preferences?.language ?? "FA";
  const t = getTranslations(language);
  const userRole = session.user.role;

  const NAV: NavItem[] = [
    { label: t.nav.dashboard, href: "/dashboard", icon: "layout-dashboard" },
    { label: t.nav.tasks, href: "/tasks", icon: "list" },
    { label: t.nav.board, href: "/kanban", icon: "columns" },
    { label: t.nav.projects, href: "/projects", icon: "folder" },
    { label: t.nav.users, href: "/users", icon: "users", roles: ["ADMIN"] },
    { label: t.nav.teams, href: "/teams", icon: "users-round", roles: ["ADMIN"] },
    {
      label: t.nav.notifications,
      href: "/notifications",
      icon: "bell",
      badge: unreadCount,
    },
  ];

  return (
    <div
      className="min-h-screen bg-background flex"
      dir={language === "FA" ? "rtl" : "ltr"}
    >
      <DirectionSync language={language} />
      <aside className="fixed top-0 z-40 w-64 h-screen flex flex-col border-r bg-card">
        <div className="flex items-center justify-center gap-2 h-14 border-b px-4">
          <Image
            src="/assets/images/logo-new.png"
            alt="sf-logo"
            width={24}
            height={24}
          />
          <span className="text-base font-semibold text-foreground tracking-tight">
            ScrumFlow
          </span>
        </div>

<SidebarNav
        navItems={NAV}
        userRole={session.user.role}
        language={language}
        settingsHref="/settings"
        settingsLabel={t.nav.settings}
        profileHref="/profile"
        userName={session.user.name ?? "User"}
        userEmail={session.user.email ?? ""}
        userImage={session.user.image ?? undefined}
      />
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 ${language === "FA" ? "mr-64" : "ml-64"}`}>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      <CommandPaletteWrapper />
    </div>
  );
}
