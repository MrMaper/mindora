import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { Icon } from "@/components/ui-kit/foundation/icon";
import type { IconName } from "@/components/ui-kit/foundation/icon";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { SignOutButton } from "@/components/sign-out-button";
import { getTranslations } from "@/i18n";
import { getUserPreferences } from "@/features/settings/queries";
import { DirectionSync } from "@/components/DirectionSync";

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const preferences = await getUserPreferences(session.user.id);
  const language = preferences?.language ?? "FA";
  const t = getTranslations(language);

  const NAV: NavItem[] = [
    { label: t.nav.dashboard, href: "/dashboard", icon: "layout-dashboard" },
    { label: t.nav.myTasks, href: "/tasks", icon: "list" },
    { label: t.nav.board, href: "/kanban", icon: "columns" },
    { label: t.nav.users, href: "/users", icon: "users" },
    {
      label: t.nav.notifications,
      href: "/notifications",
      icon: "bell",
    },
  ];

  return (
    <div className="app-shell">
      <DirectionSync language={language} />
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">
          <span className="app-sidebar__logo">
            <Icon name="zap" size={12} strokeWidth={2.5} />
          </span>
          <span className="app-sidebar__wordmark">ScrumFlow</span>
        </div>

        <nav className="app-sidebar__nav" aria-label="Main">
          {NAV.map(item => (
            <Link key={item.href} href={item.href} className="app-nav-item">
              <Icon name={item.icon} size={15} />
              {item.label}
            </Link>
          ))}

          <div
            className="app-sidebar__section-label"
            style={{ marginTop: "auto" }}
          />

          <Link href="/settings" className="app-nav-item">
            <Icon name="settings" size={15} />
            {t.nav.settings}
          </Link>
        </nav>

        <div className="app-sidebar__footer">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-1) var(--space-2)",
            }}
          >
            <Link
              href="/profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                flex: 1,
                minWidth: 0,
                textDecoration: "none",
              }}
            >
              <Avatar
                name={session.user.name ?? "User"}
                src={session.user.image ?? undefined}
                size="sm"
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--text-xs)",
                    fontWeight: "var(--weight-medium)",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {session.user.name}
                </div>
                <div
                  style={{
                    fontSize: "var(--text-2xs)",
                    color: "var(--text-tertiary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {session.user.email}
                </div>
              </div>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="app-main">
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
