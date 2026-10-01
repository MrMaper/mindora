"use client";

import * as React from "react";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { useLanguage } from "@/i18n/provider";
import { MODULE_META, PRIMARY_MODULES } from "@/lib/modules";
import {
  formatOnlineDuration,
  formatPresenceInstant,
} from "@/lib/presence";
import { cn } from "@/lib/utils";
import type { UserRow } from "@/features/users/types";
import type { Translations } from "@/i18n";

const COLS =
  "grid-cols-[minmax(0,1.2fr)_auto_auto_minmax(7rem,11rem)_minmax(5.5rem,8rem)_minmax(6rem,12rem)_2.5rem]";

interface UserTableProps {
  users: UserRow[];
  t: Translations;
  onEdit: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
  onForceLogout: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  emptyMessage?: string;
  toolbar?: React.ReactNode;
}

export function UserTable({
  users,
  t,
  onEdit,
  onToggleStatus,
  onForceLogout,
  onDelete,
  emptyMessage = "No users found",
  toolbar,
}: UserTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {toolbar ? (
        <div className="border-b border-border-muted bg-muted/30 px-4 py-3">
          {toolbar}
        </div>
      ) : null}

      {users.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[44rem]">
              <TableHeader t={t} />
              <div className="divide-y divide-border-muted">
                {users.map(user => (
                  <UserRowDesktop
                    key={user.id}
                    user={user}
                    t={t}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onForceLogout={onForceLogout}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2 p-3 md:hidden">
            {users.map(user => (
              <UserCardMobile
                key={user.id}
                user={user}
                t={t}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onForceLogout={onForceLogout}
                onDelete={onDelete}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TableHeader({ t }: { t: Translations }) {
  return (
    <div
      className={cn(
        "grid items-center gap-3 border-b border-border-muted bg-muted/40 px-4 py-2.5",
        COLS,
      )}
    >
      {[
        t.users.name,
        t.users.role,
        t.users.status,
        t.users.lastLogin,
        t.users.timeOnline,
        t.users.modules,
        "",
      ].map((h, i) => (
        <span
          key={h || `actions-${i}`}
          className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {h}
        </span>
      ))}
    </div>
  );
}

function UserActionsMenu({
  user,
  t,
  onEdit,
  onToggleStatus,
  onForceLogout,
  onDelete,
}: {
  user: UserRow;
  t: Translations;
  onEdit: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
  onForceLogout: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}) {
  return (
    <Menu
      trigger={
        <IconButton
          icon="more-horizontal"
          aria-label={t.users.userActionsLabel}
          size="sm"
        />
      }
      align="end"
      items={[
        {
          label: t.common.edit,
          icon: "pencil",
          onClick: () => onEdit(user),
        },
        ...(user.role === "ADMIN"
          ? []
          : [
              {
                label:
                  user.status === "ACTIVE"
                    ? t.users.deactivate
                    : t.users.activate,
                icon: (user.status === "ACTIVE"
                  ? "x"
                  : "check") as "x" | "check",
                onClick: () => onToggleStatus(user),
              },
              {
                label: t.users.forceLogout,
                icon: "log-out" as const,
                onClick: () => onForceLogout(user),
              },
              { divider: true as const },
              {
                label: t.common.delete,
                icon: "trash" as const,
                danger: true,
                onClick: () => onDelete(user),
              },
            ]),
      ]}
    />
  );
}

function UserIdentity({
  user,
  t,
  compact,
}: {
  user: UserRow;
  t: Translations;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="relative shrink-0">
        <Avatar name={user.name} src={user.avatar ?? undefined} size="sm" />
        <span
          className={cn(
            "pointer-events-none absolute -bottom-0.5 -end-0.5 z-10 box-border size-2.5 rounded-full",
            // Punch a clear gap so the dot doesn't melt into the avatar
            "shadow-[0_0_0_2px_var(--card)]",
            user.isOnline
              ? "bg-emerald-500"
              : "border-[1.5px] border-muted-foreground/70 bg-card",
          )}
          title={user.isOnline ? t.users.online : t.users.offline}
          aria-label={user.isOnline ? t.users.online : t.users.offline}
        />
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">
            {user.name}
          </span>
          {!compact ? (
            <Badge
              tone={user.isOnline ? "success" : "neutral"}
              className="shrink-0"
            >
              {user.isOnline ? t.users.online : t.users.offline}
            </Badge>
          ) : null}
        </div>
        <div className="truncate text-xs text-muted-foreground" dir="ltr">
          {user.email}
        </div>
      </div>
    </div>
  );
}

function UserRowDesktop({
  user,
  t,
  onEdit,
  onToggleStatus,
  onForceLogout,
  onDelete,
}: {
  user: UserRow;
  t: Translations;
  onEdit: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
  onForceLogout: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}) {
  const language = useLanguage();

  return (
    <div
      className={cn(
        "grid items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/25",
        COLS,
      )}
    >
      <UserIdentity user={user} t={t} />

      <Badge tone={user.role === "ADMIN" ? "solid" : "neutral"}>
        {user.role === "ADMIN" ? t.users.admin : t.users.member}
      </Badge>

      <Badge tone={user.status === "ACTIVE" ? "success" : "neutral"}>
        {user.status === "ACTIVE" ? t.users.active : t.users.inactive}
      </Badge>

      <div className="min-w-0">
        <div className="truncate text-xs text-foreground">
          {user.lastLoginAt
            ? formatPresenceInstant(user.lastLoginAt, language)
            : t.users.neverLoggedIn}
        </div>
        {user.lastSeenAt ? (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {t.users.lastSeen}:{" "}
            {formatPresenceInstant(user.lastSeenAt, language)}
          </div>
        ) : null}
      </div>

      <div className="text-xs tabular-nums text-foreground">
        {formatOnlineDuration(user.totalOnlineSeconds, language)}
      </div>

      <UserModulesCell user={user} t={t} />

      <UserActionsMenu
        user={user}
        t={t}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
        onForceLogout={onForceLogout}
        onDelete={onDelete}
      />
    </div>
  );
}

function UserCardMobile({
  user,
  t,
  onEdit,
  onToggleStatus,
  onForceLogout,
  onDelete,
}: {
  user: UserRow;
  t: Translations;
  onEdit: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
  onForceLogout: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}) {
  const language = useLanguage();

  return (
    <article className="rounded-lg border border-border bg-background/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <UserIdentity user={user} t={t} compact />
        <UserActionsMenu
          user={user}
          t={t}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onForceLogout={onForceLogout}
          onDelete={onDelete}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Badge tone={user.isOnline ? "success" : "neutral"}>
          {user.isOnline ? t.users.online : t.users.offline}
        </Badge>
        <Badge tone={user.role === "ADMIN" ? "solid" : "neutral"}>
          {user.role === "ADMIN" ? t.users.admin : t.users.member}
        </Badge>
        <Badge tone={user.status === "ACTIVE" ? "success" : "neutral"}>
          {user.status === "ACTIVE" ? t.users.active : t.users.inactive}
        </Badge>
      </div>

      <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
        <div>
          <dt className="text-muted-foreground">{t.users.lastLogin}</dt>
          <dd className="text-foreground">
            {user.lastLoginAt
              ? formatPresenceInstant(user.lastLoginAt, language)
              : t.users.neverLoggedIn}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t.users.timeOnline}</dt>
          <dd className="tabular-nums text-foreground">
            {formatOnlineDuration(user.totalOnlineSeconds, language)}
          </dd>
        </div>
      </dl>

      <div className="mt-2">
        <UserModulesCell user={user} t={t} />
      </div>
    </article>
  );
}

function UserModulesCell({
  user,
  t,
}: {
  user: UserRow;
  t: Translations;
}) {
  const language = useLanguage();

  if (user.role === "ADMIN") {
    return (
      <Badge tone="info" className="max-w-full truncate">
        {t.users.modulesAdmin}
      </Badge>
    );
  }

  const enabled = PRIMARY_MODULES.filter(key => user.enabledModules[key]);
  if (enabled.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const visible = enabled.slice(0, 3);
  const rest = enabled.length - visible.length;
  const fullTitle = enabled
    .map(key => {
      const meta = MODULE_META[key];
      return language === "FA" ? meta.fa : meta.en;
    })
    .join(language === "FA" ? "، " : ", ");

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1" title={fullTitle}>
      {visible.map(key => {
        const meta = MODULE_META[key];
        const full = language === "FA" ? meta.fa : meta.en;
        const short = full.split(" / ")[0] ?? full;
        return (
          <Badge key={key} tone="neutral" className="max-w-[6.5rem] truncate">
            {short}
          </Badge>
        );
      })}
      {rest > 0 ? (
        <Badge tone="count" className="tabular-nums">
          +{rest}
        </Badge>
      ) : null}
    </div>
  );
}
