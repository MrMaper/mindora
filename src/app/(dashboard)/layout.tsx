import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { Icon } from "@/components/ui-kit/foundation/icon";
import type { IconName } from "@/components/ui-kit/foundation/icon";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { SignOutButton } from "@/components/sign-out-button";
import { getTranslations } from "@/i18n";
import { getUserPreferences } from "@/features/settings/queries";
import { getUnreadCount } from "@/features/notifications/queries";
import { DirectionSync } from "@/components/DirectionSync";
import { CommandPaletteWrapper } from "@/components/CommandPaletteWrapper";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
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
  ]);
  const language = preferences?.language ?? "FA";
  const t = getTranslations(language);

  const NAV: NavItem[] = [
    { label: t.nav.dashboard, href: "/dashboard", icon: "layout-dashboard" },
    { label: t.nav.tasks, href: "/tasks", icon: "list" },
    { label: t.nav.board, href: "/kanban", icon: "columns" },
    { label: t.nav.users, href: "/users", icon: "users" },
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
      <aside className="w-64 flex flex-col border-r bg-card">
        <div className="flex items-center justify-center gap-2 h-14 border-b px-4">
          <span className="flex items-center justify-center size-5 bg-primary rounded-lg text-primary-foreground shrink-0">
            <Icon name="zap" size={12} strokeWidth={2.5} />
          </span>
          <span className="text-base font-semibold text-foreground tracking-tight">
            ScrumFlow
          </span>
        </div>

        <nav
          className="flex-1 p-3 space-y-1 overflow-y-auto"
          aria-label="منوی اصلی"
        >
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-foreground hover:bg-accent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <Icon name={item.icon} size={15} className="shrink-0" />
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <Badge tone="count" className="ml-auto">
                  {item.badge > 99 ? "۹۹+" : item.badge}
                </Badge>
              )}
            </Link>
          ))}

          <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-4" />

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-accent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <Icon name="settings" size={15} className="shrink-0" />
            {t.nav.settings}
          </Link>
        </nav>

        <div className="border-t p-3">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar
              name={session.user.name ?? "User"}
              src={session.user.image ?? undefined}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground truncate">
                {session.user.name}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {session.user.email}
              </div>
            </div>
            <SignOutButton />
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>

      <CommandPaletteWrapper />
    </div>
  );
}
