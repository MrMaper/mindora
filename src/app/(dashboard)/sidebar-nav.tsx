"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui-kit/foundation/icon";
import type { IconName } from "@/components/ui-kit/foundation/icon";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
  roles?: string[];
}

export interface NavGroup {
  id: string;
  label?: string;
  items: NavItem[];
}

interface SidebarNavProps {
  groups: NavGroup[];
  userRole: string;
  language: "EN" | "FA";
  settingsHref: string;
  settingsLabel: string;
  notificationsHref: string;
  notificationsLabel: string;
  notificationsBadge?: number;
  userName: string;
  userEmail: string;
  userImage?: string;
  onNavigate?: () => void;
}

function isRouteActive(pathname: string, href: string) {
  const pathOnly = href.split("?")[0] ?? href;
  return pathname === pathOnly || pathname.startsWith(pathOnly + "/");
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      prefetch
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon name={item.icon} size={15} className="shrink-0 opacity-80" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <Badge tone="count" className="ms-auto shrink-0">
          {item.badge > 99 ? "۹۹+" : item.badge}
        </Badge>
      )}
    </Link>
  );
}

export function SidebarNav({
  groups,
  userRole,
  language,
  settingsHref,
  settingsLabel,
  notificationsHref,
  notificationsLabel,
  notificationsBadge = 0,
  userName,
  userEmail,
  userImage,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex h-full flex-col overflow-hidden px-2.5 py-3"
      aria-label={language === "FA" ? "منوی اصلی" : "Main navigation"}
    >
      <div className="flex-1 space-y-4 overflow-y-auto">
        {groups.map(group => {
          const items = group.items.filter(
            item => !item.roles || item.roles.includes(userRole),
          );
          if (items.length === 0) return null;

          return (
            <div key={group.id} className="space-y-0.5">
              {group.label ? (
                <div className="px-2.5 pb-1 text-[10px] font-medium tracking-wide text-muted-foreground/80 uppercase">
                  {group.label}
                </div>
              ) : null}
              {items.map(item => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={isRouteActive(pathname, item.href)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div className="mt-auto space-y-0.5 border-t border-border/60 pt-3">
        <NavLink
          item={{
            label: notificationsLabel,
            href: notificationsHref,
            icon: "bell",
            badge: notificationsBadge,
          }}
          active={isRouteActive(pathname, notificationsHref)}
          onNavigate={onNavigate}
        />
        <NavLink
          item={{
            label: settingsLabel,
            href: settingsHref,
            icon: "settings",
          }}
          active={isRouteActive(pathname, settingsHref)}
          onNavigate={onNavigate}
        />

        {/* Identity only — settings lives above; only sign-out is interactive. */}
        <div className="mt-1.5 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm">
          <Avatar name={userName} src={userImage} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium">{userName}</div>
            <div className="truncate text-[10px] text-muted-foreground">
              {userEmail}
            </div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </nav>
  );
}
