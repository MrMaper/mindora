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

function projectMenuItems(
  project: ProjectRow,
  t: ReturnType<typeof useTranslation>,
  onView: (project: ProjectRow) => void,
  onEdit: (project: ProjectRow) => void,
  onArchive: (project: ProjectRow) => void,
  onDelete: (project: ProjectRow) => void,
) {
  return [
    {
      label: t.projects.view,
      icon: "eye" as const,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onView(project);
      },
    },
    { divider: true as const },
    {
      label: t.common.edit,
      icon: "pencil" as const,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(project);
      },
    },
    {
      label:
        project.status === "ACTIVE" ? t.projects.archive : t.projects.restore,
      icon: (project.status === "ACTIVE" ? "archive" : "rotate-ccw") as
        | "archive"
        | "rotate-ccw",
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onArchive(project);
      },
    },
    { divider: true as const },
    {
      label: t.common.delete,
      icon: "trash" as const,
      danger: true as const,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(project);
      },
    },
  ];
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
    <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden min-w-0">
      <div className="hidden md:grid grid-cols-[1fr_160px_100px_40px] gap-3 px-4 h-9 items-center border-b border-border-subtle bg-bg-sunken">
        {columns.map(h => (
          <span
            key={h || "actions"}
            className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {h}
          </span>
        ))}
      </div>

      {projects.length === 0 ? (
        <div className="p-10 text-center text-muted-foreground text-sm">
          {t.projects.noResults}
        </div>
      ) : (
        projects.map(project => {
          const items = projectMenuItems(
            project,
            t,
            onView,
            onEdit,
            onArchive,
            onDelete,
          );
          const statusBadge = (
            <Badge tone={project.status === "ACTIVE" ? "success" : "neutral"}>
              {project.status === "ACTIVE"
                ? t.projects.active
                : t.projects.archived}
            </Badge>
          );
          const menu = (
            <span onClick={e => e.stopPropagation()}>
              <Menu
                trigger={
                  <IconButton
                    icon="more-horizontal"
                    aria-label={t.projects.projectActionsLabel}
                    size="sm"
                  />
                }
                align="end"
                items={items}
              />
            </span>
          );

          return (
            <React.Fragment key={project.id}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onView(project)}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onView(project);
                  }
                }}
                className="flex w-full items-start gap-3 border-b border-border-subtle px-3 py-3 text-start hover:bg-bg-hover md:hidden"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">
                    {project.name}
                  </div>
                  {project.description ? (
                    <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {project.description}
                    </div>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {statusBadge}
                    <span>{project.teamName ?? t.projects.noTeam}</span>
                  </div>
                </div>
                {menu}
              </div>

              <div
                className="hidden md:grid grid-cols-[1fr_160px_100px_40px] gap-3 px-4 min-h-13 h-row items-center border-b border-border-subtle min-w-0 cursor-pointer hover:bg-bg-hover"
                onClick={() => onView(project)}
              >
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
                <div className="text-sm text-muted-foreground">
                  {project.teamName ?? t.projects.noTeam}
                </div>
                {statusBadge}
                {menu}
              </div>
            </React.Fragment>
          );
        })
      )}
    </div>
  );
}
