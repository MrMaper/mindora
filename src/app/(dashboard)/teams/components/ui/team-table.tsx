"use client";

import * as React from "react";
import { useTranslation } from "@/i18n/provider";
import { TeamRow } from "./team-row";
import type { TeamRow as TeamRowType } from "@/features/teams/types";

interface TeamTableProps {
  teams: TeamRowType[];
  onView: (team: TeamRowType) => void;
  onEdit: (team: TeamRowType) => void;
  onArchive: (team: TeamRowType) => void;
  onDelete: (team: TeamRowType) => void;
}

export function TeamTable({
  teams,
  onView,
  onEdit,
  onArchive,
  onDelete,
}: TeamTableProps) {
  const t = useTranslation();

  return (
    <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
      <div className="grid grid-cols-[1fr_200px_100px_40px] gap-3 px-4 h-9 items-center border-b border-border-subtle bg-bg-sunken">
        {[t.teams.name, t.teams.members, t.teams.status, ""].map(h => (
          <span
            key={h}
            className="text-2xs font-semibold uppercase tracking-wider text-text-tertiary"
          >
            {h}
          </span>
        ))}
      </div>

      {teams.length === 0 ? (
        <div className="p-10 text-center text-sm text-text-tertiary min-h-13">
          {t.teams.noResults}
        </div>
      ) : (
        teams.map(team => (
          <TeamRow
            key={team.id}
            team={team}
            onView={onView}
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  );
}
