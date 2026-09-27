"use client";

import * as React from "react";
import { BrandMark } from "@/components/brand-mark";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav, type NavGroup } from "./sidebar-nav";
import { useTranslation } from "@/i18n/provider";
import { openCapture } from "@/features/capture/open-capture";
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
  captureEnabled?: boolean;
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
  captureEnabled = false,
  children,
}: DashboardShellProps) {
  const t = useTranslation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const isRtl = language === "FA";

  function renderCaptureLaunch() {
    if (!captureEnabled) return null;
    return (
      <div className="shrink-0 border-b px-3 py-2">
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            openCapture();
          }}
          className="flex w-full items-center gap-2 rounded-lg border border-border-default px-3 py-2 text-sm hover:bg-accent"
        >
          <Icon name="plus" size={16} />
          <span className="min-w-0 flex-1 text-start">{t.dashboard.captureOpen}</span>
          <kbd className="text-[10px] text-muted-foreground">N</kbd>
        </button>
      </div>
    );
  }

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
    <div className="flex items-center justify-center min-h-14 py-3 border-b px-4 shrink-0">
      <BrandMark size="md" />
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
        {renderCaptureLaunch()}
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
          {renderCaptureLaunch()}
          <div className="flex-1 min-h-0 overflow-hidden">{sidebar}</div>
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          isRtl ? "lg:mr-64" : "lg:ml-64",
        )}
      >
        <header className="sticky top-0 z-30 flex min-h-14 items-center gap-1 border-b bg-background/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur supports-backdrop-filter:bg-background/80 lg:hidden">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={language === "FA" ? "منو" : "Menu"}
            onClick={() => setMobileOpen(true)}
          >
            <Icon name="menu" size={18} />
          </Button>
          <div className="min-w-0 flex-1">
            <BrandMark size="sm" showSlogan={false} />
          </div>
          {captureEnabled ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={t.dashboard.captureOpen}
              onClick={() => openCapture()}
            >
              <Icon name="plus" size={18} />
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label={language === "FA" ? "جستجو" : "Search"}
            onClick={openCommandPalette}
          >
            <Icon name="search" size={18} />
          </Button>
        </header>
        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 max-lg:pb-[max(0.75rem,env(safe-area-inset-bottom))]!">{children}</main>
      </div>
    </>
  );
}
