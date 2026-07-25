"use client";

import * as React from "react";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Icon, type IconName } from "@/components/ui-kit/foundation/icon";
import type { Translations } from "@/i18n";
import type { ProjectTaskRow } from "@/features/projects/types";

interface TaskTableProps {
  tasks: ProjectTaskRow[];
  t: Translations;
  onView: (task: ProjectTaskRow) => void;
  onEdit: (task: ProjectTaskRow) => void;
  onDelete: (task: ProjectTaskRow) => void;
  emptyMessage: string;
}

const STATUS_TONE: Record<string, "neutral" | "info" | "warning" | "success" | "danger"> = {
  BACKLOG: "neutral",
  TODO: "info",
  IN_PROGRESS: "warning",
  REVIEW: "warning",
  TESTING: "info",
  DONE: "success",
  BLOCKED: "danger",
};

const PRIORITY_ICON: Record<string, IconName> = {
  URGENT: "alert-triangle",
  HIGH: "arrow-up",
  MEDIUM: "circle",
  LOW: "arrow-down",
  NONE: "circle",
};

const TYPE_ICON: Record<string, IconName> = {
  TASK: "circle-check",
  STORY: "git-branch",
  BUG: "alert-triangle",
  EPIC: "target",
};

export function TaskTable({ tasks, t, onView, onEdit, onDelete, emptyMessage }: TaskTableProps) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="grid grid-cols-[1fr_100px_100px_120px_40px] gap-3 px-4 h-9 items-center border-b border-border-muted bg-muted/50">
        {[
          { key: "title", label: t.tasks.title || "Title" },
          { key: "status", label: t.tasks.status || "Status" },
          { key: "priority", label: t.tasks.priority || "Priority" },
          { key: "assignee", label: t.tasks.assignee || "Assignee" },
          { key: "actions", label: "" },
        ].map((col) => (
          <span
            key={col.key}
            className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {col.label}
          </span>
        ))}
      </div>

      {tasks.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{emptyMessage}</div>
      ) : (
        <div className="divide-y divide-border-muted">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} t={t} onView={onView} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({
  task,
  t,
  onView,
  onEdit,
  onDelete,
}: {
  task: ProjectTaskRow;
  t: Translations;
  onView: (task: ProjectTaskRow) => void;
  onEdit: (task: ProjectTaskRow) => void;
  onDelete: (task: ProjectTaskRow) => void;
}) {
  const priorityIcon = PRIORITY_ICON[task.priority] || "circle";
  const typeIcon = TYPE_ICON[task.type] || "circle-check";

  return (
    <div
      className="grid grid-cols-[1fr_100px_100px_120px_40px] gap-3 px-4 h-[var(--row-height)] items-center border-b border-border-muted last:border-0 cursor-pointer hover:bg-accent/50"
      onClick={() => onView(task)}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon name={typeIcon} size={14} className="text-muted-foreground" />
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground truncate">{task.title}</div>
          <div className="text-xs text-muted-foreground truncate">{task.id.slice(-6).toUpperCase()}</div>
        </div>
      </div>

      <Badge tone={STATUS_TONE[task.status] || "neutral"} className="w-full text-center text-[11px]">
        {t.tasks[task.status.toLowerCase() as keyof typeof t.tasks] || task.status}
      </Badge>

      <div className="flex items-center justify-center gap-1">
        <Icon name={priorityIcon} size={12} className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground capitalize">{task.priority.toLowerCase()}</span>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        {task.assignee ? (
          <>
            <Avatar name={task.assignee.name} src={task.assignee.avatar ?? undefined} size="sm" />
            <span className="text-xs text-muted-foreground truncate">{task.assignee.name}</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">{t.tasks.unassigned || "Unassigned"}</span>
        )}
      </div>

      <Menu
        trigger={
          <IconButton icon="more-horizontal" aria-label={t.tasks.taskActionsLabel || "Actions"} size="sm" />
        }
        align="end"
        items={[
          {
            label: t.tasks.view || "View",
            icon: "eye",
            onClick: () => { onView(task); },
          },
          { divider: true },
          { label: t.common.edit || "Edit", icon: "pencil", onClick: () => { onEdit(task); } },
          { divider: true },
          { label: t.common.delete || "Delete", icon: "trash", danger: true, onClick: () => { onDelete(task); } },
        ]}
      />
    </div>
  );
}