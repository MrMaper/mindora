import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Tag } from "@/components/ui-kit/data-display/tag";
import { StatusBadge } from "@/components/ui-kit/agile/status-badge";
import { PriorityIcon } from "@/components/ui-kit/agile/priority-icon";
import { Menu, type MenuItem } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import type { TaskRow } from "@/features/tasks/types";
import { statusToDisplay, priorityToDisplay } from "@/features/tasks/types";
import { WorkLogButton } from "@/components/ui-kit/overlays/work-logs";

interface TasksTableProps {
  tasks: TaskRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  filters: {
    sort: string;
    order: string;
  };
  currentUserId: string;
  currentUserRole: string;
  onSortChange: (key: string) => void;
  onRowClick: (task: TaskRow) => void;
  onEdit: (task: TaskRow) => void;
  onDelete: (task: TaskRow) => void;
  formatDate: (date: Date | null) => string;
}

export function TasksTable({
  tasks,
  t,
  filters,
  currentUserId,
  currentUserRole,
  onSortChange,
  onRowClick,
  onEdit,
  onDelete,
  formatDate,
}: TasksTableProps) {
  const [workLogOpenTaskId, setWorkLogOpenTaskId] = React.useState<string | null>(null);
  const columns = [
    { key: "title", label: t.tasks.taskColumn, sortable: true, width: "1fr" },
    {
      key: "project",
      label: t.tasks.projectColumn,
      sortable: false,
      width: "140px",
    },
    {
      key: "status",
      label: t.tasks.statusColumn,
      sortable: true,
      width: "130px",
    },
    {
      key: "priority",
      label: t.tasks.priorityColumn,
      sortable: true,
      width: "90px",
    },
    {
      key: "assignee",
      label: t.tasks.assigneeColumn,
      sortable: false,
      width: "160px",
    },
    {
      key: "dueDate",
      label: t.tasks.dueDateColumn,
      sortable: true,
      width: "110px",
    },
    { key: "", label: "", sortable: false, width: "40px" },
  ];

  return (
    <>
      <div className="rounded-lg border border-border-default bg-bg-surface overflow-hidden">
        <div
          className="hidden md:grid gap-3 border-b border-border-subtle bg-bg-sunken px-4 h-9 items-center"
          style={{ gridTemplateColumns: "1fr 140px 130px 90px 160px 110px 40px" }}
        >
          {columns.map(col => (
            <span
              key={col.key || "actions"}
              role={col.sortable === false ? undefined : "button"}
              onClick={
                col.sortable === false || !col.key
                  ? undefined
                  : () => onSortChange(col.key)
              }
              className={cn(
                "text-2xs font-semibold uppercase tracking-caps text-text-tertiary flex items-center gap-1 cursor-pointer hover:text-text-secondary",
                (col.sortable === false || !col.key) && "cursor-default",
              )}
            >
              {col.label}
              {filters.sort === col.key && (
                <Icon
                  name={filters.order === "asc" ? "chevron-up" : "chevron-down"}
                  size={11}
                />
              )}
            </span>
          ))}
        </div>

        {tasks.length === 0 ? (
          <div className="p-10 text-center text-text-tertiary text-sm">
            {t.tasks.noResults}
          </div>
        ) : (
          tasks.map(task => {
            const isAdmin = currentUserRole === "ADMIN";
            const isAssignee = task.assignedTo?.id === currentUserId;
            const canEdit = isAdmin || isAssignee;
            const menuItems: MenuItem[] = canEdit
              ? [
                  {
                    label: t.common.edit,
                    icon: "pencil",
                    onClick: () => onEdit(task),
                  },
                  { divider: true },
                  {
                    label: t.common.delete,
                    icon: "trash",
                    danger: true,
                    onClick: () => onDelete(task),
                  },
                ]
              : [];

            // Add work log button to menu for assignee/admin
            const isAssigneeOrAdmin = isAdmin || isAssignee;
            if (isAssigneeOrAdmin) {
              menuItems.unshift(
                { divider: true },
                {
                  label: t.tasks.workLogs ?? "Work Logs",
                  icon: "clock",
                  onClick: (e) => {
                    e.stopPropagation();
                    setWorkLogOpenTaskId(task.id);
                  },
                }
              );
            }

            return (
              <React.Fragment key={task.id}>
                <div
                  role={canEdit ? "button" : undefined}
                  tabIndex={canEdit ? 0 : undefined}
                  onClick={canEdit ? () => onRowClick(task) : undefined}
                  onKeyDown={
                    canEdit
                      ? e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(task);
                          }
                        }
                      : undefined
                  }
                  className="md:hidden w-full text-start flex items-start gap-3 px-3 py-3 border-b border-border-subtle hover:bg-bg-sunken/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-text-primary">
                      {task.title}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                      <StatusBadge status={statusToDisplay(task.status)} />
                      <span>{formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                  <span onClick={e => e.stopPropagation()}>
                    <Menu
                      trigger={
                        <IconButton
                          icon="more-horizontal"
                          aria-label={t.tasks.taskActionsLabel}
                          size="sm"
                        />
                      }
                      align="end"
                      items={menuItems}
                    />
                  </span>
                </div>
              <div
                onClick={canEdit ? () => onRowClick(task) : undefined}
                className="hidden md:grid gap-3 px-4 min-h-13 items-center border-b border-border-subtle hover:bg-bg-sunken/50 cursor-pointer"
                style={{ gridTemplateColumns: "1fr 140px 130px 90px 160px 110px 40px" }}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">
                    {task.title}
                  </div>
                  {task.labels.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {task.labels.map(l => (
                        <Tag key={l.id} color={l.color}>
                          {l.name}
                        </Tag>
                      ))}
                    </div>
                  )}
                </div>

                {task.projectName ? (
                  <span className="text-xs text-text-secondary truncate">
                    {task.projectName}
                  </span>
                ) : task.projectId ? (
                  <span className="text-xs text-text-secondary font-mono truncate">
                    {task.projectId.slice(0, 8)}...
                  </span>
                ) : (
                  <span className="text-xs text-text-tertiary">{t.tasks.noProject}</span>
                )}

                <StatusBadge status={statusToDisplay(task.status)} />

                <PriorityIcon priority={priorityToDisplay(task.priority)} />

                <div className="flex items-center gap-2 min-w-0">
                  {task.assignedTo ? (
                    <>
                      <Avatar
                        name={task.assignedTo.name}
                        src={task.assignedTo.avatar ?? undefined}
                        size="sm"
                      />
                      <span className="text-xs text-text-secondary truncate">
                        {task.assignedTo.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-text-tertiary">
                      {t.tasks.unassigned}
                    </span>
                  )}
                </div>

                <span className="text-xs text-text-tertiary">
                  {formatDate(task.dueDate)}
                </span>

                <span onClick={e => e.stopPropagation()}>
                  <Menu
                    trigger={
                      <IconButton
                        icon="more-horizontal"
                        aria-label={t.tasks.taskActionsLabel}
                        size="sm"
                      />
                    }
                    align="end"
                    items={menuItems}
                  />
                </span>
              </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      {workLogOpenTaskId && (
        <>
          {tasks
            .filter(t => t.id === workLogOpenTaskId)
            .map(task => (
              <WorkLogButton
                key={task.id}
                taskId={task.id}
                taskTitle={task.title}
                assignedToId={task.assignedTo?.id ?? null}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                isOpen={true}
                onClose={() => setWorkLogOpenTaskId(null)}
              />
            ))}
        </>
      )}
    </>
  );
}