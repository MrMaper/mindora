"use client";

import * as React from "react";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import type { ProjectRow } from "@/features/projects/types";
import { useTranslation } from "@/i18n/provider";

interface ProjectsTableProps {
  projects: ProjectRow[];
  onView: (project: ProjectRow) => void;
  onEdit: (project: ProjectRow) => void;
  onArchive: (project: ProjectRow) => void;
  onDelete: (project: ProjectRow) => void;
}

export function ProjectsTable({
  projects,
  onView,
  onEdit,
  onArchive,
  onDelete,
}: ProjectsTableProps) {
  const t = useTranslation();
  const columns = [t.projects.name, t.projects.team, t.projects.status, ""];

  return (
    <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[1fr_160px_100px_40px] gap-3 px-4 h-9 items-center border-b border-border-subtle bg-bg-sunken">
        {columns.map(h => (
          <span
            key={h}
            className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {projects.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground text-sm">
          {t.projects.noResults}
        </div>
      ) : (
        projects.map(project => (
          <div
            key={project.id}
            className="grid grid-cols-[1fr_160px_100px_40px] gap-3 px-4 min-h-13 h-row items-center border-b border-border-subtle min-w-0 cursor-pointer hover:bg-bg-hover"
            onClick={() => onView(project)}
          >
            {/* Name & Description */}
            <div className="min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {project.name}
              </div>
              {project.description && (
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {project.description}
                </div>
              )}
            </div>

            {/* Team */}
            <div className="text-sm text-muted-foreground">
              {project.teamName ?? t.projects.noTeam}
            </div>

            {/* Status */}
            <Badge tone={project.status === "ACTIVE" ? "success" : "neutral"}>
              {project.status === "ACTIVE"
                ? t.projects.active
                : t.projects.archived}
            </Badge>

            {/* Actions */}
            <Menu
              trigger={
                <IconButton
                  icon="more-horizontal"
                  aria-label={t.projects.projectActionsLabel}
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                />
              }
              align="end"
              items={[
                {
                  label: t.projects.view,
                  icon: "eye",
                  onClick: (e) => { e.stopPropagation(); onView(project); },
                },
                { divider: true },
                {
                  label: t.common.edit,
                  icon: "pencil",
                  onClick: (e) => { e.stopPropagation(); onEdit(project); },
                },
                {
                  label:
                    project.status === "ACTIVE"
                      ? t.projects.archive
                      : t.projects.restore,
                  icon: project.status === "ACTIVE" ? "archive" : "rotate-ccw",
                  onClick: (e) => { e.stopPropagation(); onArchive(project); },
                },
                { divider: true },
                {
                  label: t.common.delete,
                  icon: "trash",
                  danger: true,
                  onClick: (e) => { e.stopPropagation(); onDelete(project); },
                },
              ]}
            />
          </div>
        ))
      )}
    </div>
  );
}