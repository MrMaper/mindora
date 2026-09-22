"use client";

import * as React from "react";
import Image from "next/image";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav, type NavGroup } from "./sidebar-nav";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  language: "EN" | "FA";
  navGroups: NavGroup[];
  userRole: string;
  settingsHref: string;
  settingsLabel: string;
  notificationsHref: string;
  notificationsLabel: string;
  notificationsBadge?: number;
  profileHref: string;
  userName: string;
  userEmail: string;
  userImage?: string;
  children: React.ReactNode;
}

function openCommandPalette() {
  window.dispatchEvent(new Event("mindora:open-search"));
}

export function DashboardShell({
  language,
  navGroups,
  userRole,
  settingsHref,
  settingsLabel,
  notificationsHref,
  notificationsLabel,
  notificationsBadge = 0,
  profileHref,
  userName,
  userEmail,
  userImage,
  children,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isRtl = language === "FA";

  const sidebar = (
    <SidebarNav
      groups={navGroups}
      userRole={userRole}
      language={language}
      settingsHref={settingsHref}
      settingsLabel={settingsLabel}
      notificationsHref={notificationsHref}
      notificationsLabel={notificationsLabel}
      notificationsBadge={notificationsBadge}
      profileHref={profileHref}
      userName={userName}
      userEmail={userEmail}
      userImage={userImage}
      onNavigate={() => setMobileOpen(false)}
    />
  );

  const brand = (
    <div className="flex flex-col items-center justify-center gap-0.5 min-h-14 py-2 border-b px-4 shrink-0">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Mindora" width={24} height={24} />
        <span className="text-base font-semibold text-foreground tracking-tight">
          Mindora
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground tracking-wide">
        Think. Plan. Grow
      </span>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "fixed top-0 z-40 hidden h-screen w-64 flex-col border-r bg-card lg:flex",
          isRtl ? "right-0 border-l border-r-0" : "left-0",
        )}
      >
        {brand}
        {sidebar}
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={isRtl ? "right" : "left"}
          className="w-[min(18rem,88vw)] p-0 gap-0"
          showCloseButton
        >
          <SheetHeader className="sr-only">
            <SheetTitle>
              {language === "FA" ? "منوی اصلی" : "Main menu"}
            </SheetTitle>
          </SheetHeader>
          {brand}
          <div className="flex-1 min-h-0 overflow-hidden">{sidebar}</div>
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          isRtl ? "lg:mr-64" : "lg:ml-64",
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={language === "FA" ? "منو" : "Menu"}
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" size={18} />
          </Button>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Image src="/logo.png" alt="" width={20} height={20} />
            <span className="text-sm font-semibold truncate">Mindora</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={language === "FA" ? "جستجو" : "Search"}
            onClick={openCommandPalette}
          >
            <Icon name="search" size={18} />
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">{children}</main>
      </div>
    </>
  );
}
