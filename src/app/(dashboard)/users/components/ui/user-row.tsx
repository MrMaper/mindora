"use client";

import * as React from "react";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import type { UserRow } from "@/features/users/types";
import { getTranslations } from "@/i18n";
import { useTranslation } from "@/i18n/provider";

interface UserRowProps {
  user: UserRow;
  onEdit: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}

export function UserRow({
  user,
  onEdit,
  onToggleStatus,
  onDelete,
}: UserRowProps) {
  const t = useTranslation();

  return (
    <div className="grid grid-cols-[1fr_120px_100px_120px_40px] gap-3 px-4 h-(--row-height) items-center border-b border-border-muted">
      <UserIdentity user={user} />
      <UserRoleBadge role={user.role} t={t} />
      <UserStatusBadge status={user.status} t={t} />
      <UserTeam teamName={user.teamName} t={t} />
      <UserActions
        user={user}
        t={t}
        onEdit={onEdit}
        onToggleStatus={onToggleStatus}
        onDelete={onDelete}
      />
    </div>
  );
}

function UserIdentity({ user }: { user: UserRow }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar name={user.name} src={user.avatar ?? undefined} size="sm" />
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {user.name}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {user.email}
        </div>
      </div>
    </div>
  );
}

function UserRoleBadge({
  role,
  t,
}: {
  role: string;
  t: ReturnType<typeof getTranslations>;
}) {
  return (
    <Badge tone={role === "ADMIN" ? "solid" : "neutral"}>
      {role === "ADMIN" ? t.users.admin : t.users.member}
    </Badge>
  );
}

function UserStatusBadge({
  status,
  t,
}: {
  status: string;
  t: ReturnType<typeof getTranslations>;
}) {
  return (
    <Badge tone={status === "ACTIVE" ? "success" : "neutral"}>
      {status === "ACTIVE" ? t.users.active : t.users.inactive}
    </Badge>
  );
}

function UserTeam({
  teamName,
  t,
}: {
  teamName: string | null;
  t: ReturnType<typeof getTranslations>;
}) {
  return (
    <div
      className="text-sm"
      style={{
        color: teamName ? "var(--text-secondary)" : "var(--text-tertiary)",
      }}
    >
      {teamName ?? t.users.noTeam}
    </div>
  );
}

function UserActions({
  user,
  t,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  user: UserRow;
  t: ReturnType<typeof getTranslations>;
  onEdit: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
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
        { label: t.common.edit, icon: "pencil", onClick: () => onEdit(user) },
        {
          label:
            user.status === "ACTIVE" ? t.users.deactivate : t.users.activate,
          icon: user.status === "ACTIVE" ? "x" : "check",
          onClick: () => onToggleStatus(user),
        },
        { divider: true },
        {
          label: t.common.delete,
          icon: "trash",
          danger: true,
          onClick: () => onDelete(user),
        },
      ]}
    />
  );
}
