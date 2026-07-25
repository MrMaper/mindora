"use client";

import * as React from "react";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { cn } from "@/lib/utils";
import type { UserRow } from "@/features/users/types";
import type { Translations } from "@/i18n";

interface UserTableProps {
  users: UserRow[];
  t: Translations;
  onEdit: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
  emptyMessage?: string;
}

export function UserTable({
  users,
  t,
  onEdit,
  onToggleStatus,
  onDelete,
  emptyMessage = "No users found",
}: UserTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <TableHeader t={t} />
      {users.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="divide-y divide-border-muted">
          {users.map(user => (
            <UserRow
              key={user.id}
              user={user}
              t={t}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TableHeader({ t }: { t: Translations }) {
  return (
    <div className="grid grid-cols-[1fr_120px_100px_120px_40px] gap-3 px-4 h-9 items-center border-b border-border-muted bg-muted/50">
      {[t.users.name, t.users.role, t.users.status, t.users.team, ""].map(h => (
        <span
          key={h}
          className="font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {h}
        </span>
      ))}
    </div>
  );
}

interface UserRowProps {
  user: UserRow;
  t: Translations;
  onEdit: (user: UserRow) => void;
  onToggleStatus: (user: UserRow) => void;
  onDelete: (user: UserRow) => void;
}

function UserRow({ user, t, onEdit, onToggleStatus, onDelete }: UserRowProps) {
  return (
    <div className="grid grid-cols-[1fr_120px_100px_120px_40px] gap-3 px-4 h-(--row-height) items-center border-b border-border-muted last:border-0 min-h-13">
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

      <Badge tone={user.role === "ADMIN" ? "solid" : "neutral"}>
        {user.role === "ADMIN" ? t.users.admin : t.users.member}
      </Badge>

      <Badge tone={user.status === "ACTIVE" ? "success" : "neutral"}>
        {user.status === "ACTIVE" ? t.users.active : t.users.inactive}
      </Badge>

      <div className="text-sm text-secondary-foreground">
        {user.teamName ?? t.users.noTeam}
      </div>

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
    </div>
  );
}
