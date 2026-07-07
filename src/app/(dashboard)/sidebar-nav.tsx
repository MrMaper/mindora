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

interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: number;
}

interface SidebarNavProps {
  navItems: NavItem[];
  language: "EN" | "FA";
  settingsHref: string;
  settingsLabel: string;
  profileHref: string;
  userName: string;
  userEmail: string;
  userImage?: string;
}

export function SidebarNav({
  navItems,
  language,
  settingsHref,
  settingsLabel,
  profileHref,
  userName,
  userEmail,
  userImage,
}: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="flex-1 p-3 space-y-1 overflow-y-auto"
      aria-label={language === "FA" ? "منوی اصلی" : "Main navigation"}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon name={item.icon} size={15} className="shrink-0" />
            {item.label}
            {item.badge != null && item.badge > 0 && (
              <Badge tone={isActive ? "count" : "count"} className="ml-auto">
                {item.badge > 99 ? "۹۹+" : item.badge}
              </Badge>
            )}
          </Link>
        );
      })}

      <div className="px-3 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-4" />

      <Link
        href={settingsHref}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          pathname === settingsHref || pathname.startsWith(settingsHref + "/")
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "text-muted-foreground hover:text-foreground hover:bg-accent",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
        aria-current={pathname === settingsHref || pathname.startsWith(settingsHref + "/") ? "page" : undefined}
      >
        <Icon name="settings" size={15} className="shrink-0" />
        {settingsLabel}
      </Link>

      <div className="border-t p-3 mt-2">
        <Link
          href={profileHref}
          className={cn(
            "flex items-center gap-3 px-2 py-1.5 rounded-lg text-sm transition-colors",
            pathname === profileHref
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          aria-current={pathname === profileHref ? "page" : undefined}
        >
          <Avatar
            name={userName}
            src={userImage}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {userName}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {userEmail}
            </div>
          </div>
          <SignOutButton />
        </Link>
      </div>
    </nav>
  );
}