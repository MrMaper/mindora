"use client";

import * as React from "react";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { useTranslation } from "@/i18n/provider";
import type { ProjectTaskRow } from "@/features/projects/types";

interface TaskTableProps {
  tasks: ProjectTaskRow[];
  onView: (task: ProjectTaskRow) => void;
  onEdit: (task: ProjectTaskRow) => void;
  onDelete: (task: ProjectTaskRow) => void;
  emptyMessage: string;
}

const STATUS_TONE: Record<
  string,
  "neutral" | "info" | "warning" | "success" | "danger"
> = {
  BACKLOG: "neutral",
  TODO: "info",
  IN_PROGRESS: "warning",
  REVIEW: "warning",
  TESTING: "warning",
  DONE: "success",
  BLOCKED: "warning",
};

const STATUS_LABEL_KEY: Record<
  string,
  "backlog" | "todo" | "inProgress" | "done"
> = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "inProgress",
  REVIEW: "inProgress",
  TESTING: "inProgress",
  DONE: "done",
  BLOCKED: "inProgress",
};

const PRIORITY_LABEL_KEY: Record<
  string,
  "urgent" | "high" | "medium" | "low" | "none"
> = {
  URGENT: "urgent",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  NONE: "none",
};

export function TaskTable({
  tasks,
  onView,
  onEdit,
  onDelete,
  emptyMessage,
}: TaskTableProps) {
  const t = useTranslation();

  return (
    <div className="bg-bg-surface border border-border-default rounded-lg overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_7rem_6rem_8rem_2.5rem] gap-3 px-4 h-9 items-center border-b border-border-subtle bg-bg-sunken">
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.tasks.taskTitle}
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.tasks.status}
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.tasks.priority}
        </span>
        <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t.tasks.assignee}
        </span>
        <span />
      </div>

      {tasks.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        tasks.map(task => {
          const statusKey = STATUS_LABEL_KEY[task.status] ?? "todo";
          const priorityKey = PRIORITY_LABEL_KEY[task.priority] ?? "none";
          return (
            <div
              key={task.id}
              role="button"
              tabIndex={0}
              className="grid grid-cols-[minmax(0,1fr)_7rem_6rem_8rem_2.5rem] gap-3 px-4 min-h-13 items-center border-b border-border-subtle last:border-b-0 cursor-pointer hover:bg-bg-hover"
              onClick={() => onView(task)}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onView(task);
                }
              }}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">
                  {task.title}
                </div>
                {task.description ? (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {task.description}
                  </div>
                ) : null}
              </div>

              <Badge tone={STATUS_TONE[task.status] ?? "neutral"}>
                {t.projects[statusKey]}
              </Badge>

              <span className="text-xs text-muted-foreground truncate">
                {t.projects[priorityKey]}
              </span>

              <div className="flex items-center gap-2 min-w-0">
                {task.assignee ? (
                  <>
                    <Avatar
                      name={task.assignee.name}
                      src={task.assignee.avatar ?? undefined}
                      size="sm"
                    />
                    <span className="text-xs text-muted-foreground truncate">
                      {task.assignee.name}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t.tasks.unassigned}
                  </span>
                )}
              </div>

              <Menu
                trigger={
                  <IconButton
                    icon="more-horizontal"
                    aria-label={t.common.actions}
                    size="sm"
                    onClick={e => e.stopPropagation()}
                  />
                }
                align="end"
                items={[
                  {
                    label: t.projects.view,
                    icon: "eye",
                    onClick: e => {
                      e.stopPropagation();
                      onView(task);
                    },
                  },
                  {
                    label: t.common.edit,
                    icon: "pencil",
                    onClick: e => {
                      e.stopPropagation();
                      onEdit(task);
                    },
                  },
                  { divider: true },
                  {
                    label: t.common.delete,
                    icon: "trash",
                    danger: true,
                    onClick: e => {
                      e.stopPropagation();
                      onDelete(task);
                    },
                  },
                ]}
              />
            </div>
          );
        })
      )}
    </div>
  );
}
