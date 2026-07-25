"use client";

import * as React from "react";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { useTranslation } from "@/i18n/provider";
import type { TeamRow as TeamRowType } from "@/features/teams/types";

interface TeamRowProps {
  team: TeamRowType;
  onView: (team: TeamRowType) => void;
  onEdit: (team: TeamRowType) => void;
  onArchive: (team: TeamRowType) => void;
  onDelete: (team: TeamRowType) => void;
}

export function TeamRow({
  team,
  onView,
  onEdit,
  onArchive,
  onDelete,
}: TeamRowProps) {
  const t = useTranslation();

  return (
    <div
      className="grid grid-cols-[1fr_200px_100px_40px] gap-3 px-4 h-9 items-center border-b border-border-subtle cursor-pointer hover:bg-bg-hover min-h-13"
      onClick={() => onView(team)}
    >
      <TeamNameDesc name={team.name} description={team.description} />
      <TeamMemberCount count={team.memberCount} />
      <TeamStatusBadge status={team.status} />
      <TeamActions
        team={team}
        onView={onView}
        onEdit={onEdit}
        onArchive={onArchive}
        onDelete={onDelete}
      />
    </div>
  );
}

function TeamNameDesc({
  name,
  description,
}: {
  name: string;
  description: string | null;
}) {
  return (
    <div className="min-w-0">
      <div className="text-sm font-medium text-text-primary truncate">
        {name}
      </div>
      {description && (
        <div className="text-xs text-text-tertiary truncate mt-0.5">
          {description}
        </div>
      )}
    </div>
  );
}

function TeamMemberCount({ count }: { count: number }) {
  const t = useTranslation();

  return (
    <div className="text-sm text-text-secondary">
      {count} {count === 1 ? t.teams.member : t.teams.members}
    </div>
  );
}

function TeamStatusBadge({ status }: { status: "ACTIVE" | "ARCHIVED" }) {
  const t = useTranslation();

  return (
    <Badge tone={status === "ACTIVE" ? "success" : "neutral"}>
      {status === "ACTIVE" ? t.teams.active : t.teams.archived}
    </Badge>
  );
}

function TeamActions({
  team,
  onView,
  onEdit,
  onArchive,
  onDelete,
}: {
  team: TeamRowType;
  onView: (team: TeamRowType) => void;
  onEdit: (team: TeamRowType) => void;
  onArchive: (team: TeamRowType) => void;
  onDelete: (team: TeamRowType) => void;
}) {
  const t = useTranslation();

  return (
    <Menu
      trigger={
        <IconButton
          icon="more-horizontal"
          aria-label={t.teams.teamActionsLabel}
          size="sm"
        />
      }
      align="end"
      items={[
        {
          label: t.teams.view,
          icon: "eye",
          onClick: () => { onView(team); },
        },
        { divider: true },
        {
          label: t.common.edit,
          icon: "pencil",
          onClick: () => { onEdit(team); },
        },
        {
          label: team.status === "ACTIVE" ? t.teams.archive : t.teams.restore,
          icon: team.status === "ACTIVE" ? "archive" : "rotate-ccw",
          onClick: () => { onArchive(team); },
        },
        { divider: true },
        {
          label: t.common.delete,
          icon: "trash",
          danger: true,
          onClick: () => { onDelete(team); },
        },
      ]}
    />
  );
}
