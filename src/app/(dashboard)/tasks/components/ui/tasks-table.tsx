import * as React from "react";
import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Tag } from "@/components/ui-kit/data-display/tag";
import { Button } from "@/components/ui-kit/forms/button";
import { StatusBadge } from "@/components/ui-kit/agile/status-badge";
import { PriorityIcon } from "@/components/ui-kit/agile/priority-icon";
import { Menu, type MenuItem } from "@/components/ui-kit/overlays/menu";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import type { TaskRow } from "@/features/tasks/types";
import { STATUS_OPTIONS, statusToDisplay, priorityToDisplay } from "@/features/tasks/types";
import { WorkLogButton } from "@/components/ui-kit/overlays/work-logs";
import { isAreaBucketId } from "@/lib/area-projects";
import { formatJalaliShort, parseLocalDate, toDateKey, isOverdueTask } from "@/lib/life";
import { groupTasks, TASK_GROUP_NONE, type TaskGroupField } from "@/features/tasks/view";

interface TasksTableProps {
  tasks: TaskRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  filters: {
    sort: string;
    order: string;
    group: string;
  };
  language: "FA" | "EN";
  hasActiveFilters: boolean;
  currentUserId: string;
  currentUserRole: string;
  onSortChange: (key: string) => void;
  onRowClick: (task: TaskRow) => void;
  onEdit: (task: TaskRow) => void;
  onDelete: (task: TaskRow) => void;
  onClearFilters: () => void;
  formatDate: (date: Date | null, durationMinutes?: number | null) => string;
}

/** Shared tracks so header and every row line up. title · path · status · priority · due · actions */
const COL_CLASS = [
  "w-[28%]",
  "w-[14%]",
  "w-[18%]",
  "w-[10%]",
  "w-[22%]",
  "w-[8%]",
] as const;

function areaTitle(area: TaskRow["area"], t: TasksTableProps["t"]) {
  if (area === "PHD") return t.dashboard.areaPhd as string;
  if (area === "WORK") return t.dashboard.areaWork as string;
  if (area === "LANG") return t.dashboard.areaLang as string;
  if (area === "LIFE") return t.dashboard.areaLife as string;
  return "";
}

function isOverdue(task: TaskRow): boolean {
  return isOverdueTask(task);
}

/** One line: named path, else area bucket, else «no path». */
function TaskPlace({ task, t }: { task: TaskRow; t: TasksTableProps["t"] }) {
  const area = areaTitle(task.area, t);
  const path =
    task.projectId && !isAreaBucketId(task.projectId)
      ? task.projectName?.trim() || null
      : null;
  const text = path ?? (area || (t.tasks.noProject as string));
  return (
    <div
      className="min-w-0 truncate text-center text-xs leading-5 text-text-secondary"
      title={text}
    >
      {text}
    </div>
  );
}

export function TasksTable({
  tasks,
  t,
  filters,
  language,
  hasActiveFilters,
  currentUserId,
  currentUserRole,
  onSortChange,
  onRowClick,
  onEdit,
  onDelete,
  onClearFilters,
  formatDate,
}: TasksTableProps) {
  const [workLogOpenTaskId, setWorkLogOpenTaskId] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const group = (filters.group || "") as TaskGroupField | "";
  const sections = group ? groupTasks(tasks, group) : [{ key: "all", tasks }];

  React.useEffect(() => {
    setCollapsed(new Set());
  }, [group]);

  const columns = [
    { key: "title", label: t.tasks.taskColumn as string },
    { key: "project", label: t.tasks.projectColumn as string },
    { key: "status", label: t.tasks.statusColumn as string },
    { key: "priority", label: t.tasks.priorityColumn as string },
    { key: "dueDate", label: t.tasks.dueDateColumn as string },
    { key: "", label: "" },
  ];

  function groupLabel(key: string, sample: TaskRow | undefined): string {
    if (group === "path") {
      return key === TASK_GROUP_NONE ? t.tasks.noProject : (sample?.projectName ?? key);
    }
    if (group === "date") {
      if (key === TASK_GROUP_NONE) return t.tasks.noDueGroup;
      const label = formatJalaliShort(parseLocalDate(key), language);
      if (key === toDateKey(new Date())) return `${t.dashboard.today} · ${label}`;
      return label;
    }
    if (group === "status") {
      const option = STATUS_OPTIONS.find(item => item.value === key);
      return option ? t.tasks[option.labelKey] : key;
    }
    if (group === "area") {
      if (key === TASK_GROUP_NONE) return t.tasks.noProject;
      return areaTitle(key as TaskRow["area"], t) || key;
    }
    return key;
  }

  function toggleGroup(key: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-border-default bg-bg-surface px-6 py-16 text-center">
        {hasActiveFilters ? (
          <>
            <p className="text-base font-medium text-text-primary">{t.tasks.noFilteredResults}</p>
            <Button variant="ghost" className="mt-4" onClick={onClearFilters}>
              {t.tasks.clearFilters}
            </Button>
          </>
        ) : (
          <>
            <p className="text-base font-medium text-text-primary">{t.tasks.emptyTitle}</p>
            <p className="mt-1 text-sm text-text-tertiary">{t.tasks.emptyBody}</p>
          </>
        )}
      </div>
    );
  }

  const lineProps = {
    t,
    currentUserId,
    currentUserRole,
    onRowClick,
    onEdit,
    onDelete,
    formatDate,
  };

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-border-default bg-bg-surface">
        <div className="md:hidden">
          {sections.map(section => {
            const hidden = Boolean(group) && collapsed.has(section.key);
            return (
              <React.Fragment key={section.key}>
                {group ? (
                  <GroupHeading
                    label={groupLabel(section.key, section.tasks[0])}
                    count={section.tasks.length}
                    collapsed={hidden}
                    onToggle={() => toggleGroup(section.key)}
                  />
                ) : null}
                {hidden
                  ? null
                  : section.tasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onLogTime={() => setWorkLogOpenTaskId(task.id)}
                        {...lineProps}
                      />
                    ))}
              </React.Fragment>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[48rem] table-fixed border-collapse">
            <colgroup>
              {COL_CLASS.map(className => (
                <col key={className} className={className} />
              ))}
            </colgroup>
            <thead>
              <tr className="h-9 border-b border-border-subtle bg-bg-sunken">
                {columns.map((col, index) => {
                  if (!col.key) return <th key="actions" className={COL_CLASS[index]} />;
                  const active = filters.sort === col.key;
                  return (
                    <th key={col.key} className={cn(COL_CLASS[index], "px-2 font-semibold")}>
                      <button
                        type="button"
                        aria-sort={
                          active
                            ? filters.order === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                        }
                        onClick={() => onSortChange(col.key)}
                        className="inline-flex w-full cursor-pointer items-center justify-center gap-1 whitespace-nowrap text-center text-2xs font-semibold uppercase tracking-caps text-text-tertiary hover:text-text-secondary"
                      >
                        {col.label}
                        {active && (
                          <Icon
                            name={filters.order === "asc" ? "chevron-up" : "chevron-down"}
                            size={11}
                          />
                        )}
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sections.map(section => {
                const hidden = Boolean(group) && collapsed.has(section.key);
                return (
                  <React.Fragment key={section.key}>
                    {group ? (
                      <tr className="border-b border-border-subtle bg-bg-sunken/70">
                        <td colSpan={6} className="p-0">
                          <GroupHeading
                            label={groupLabel(section.key, section.tasks[0])}
                            count={section.tasks.length}
                            collapsed={hidden}
                            onToggle={() => toggleGroup(section.key)}
                          />
                        </td>
                      </tr>
                    ) : null}
                    {hidden
                      ? null
                      : section.tasks.map(task => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            onLogTime={() => setWorkLogOpenTaskId(task.id)}
                            {...lineProps}
                          />
                        ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {workLogOpenTaskId &&
        tasks
          .filter(task => task.id === workLogOpenTaskId)
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
  );
}

function GroupHeading({
  label,
  count,
  collapsed,
  onToggle,
}: {
  label: string;
  count: number;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 border-b border-border-subtle px-3 py-1.5 text-start"
    >
      <Icon name={collapsed ? "chevron-left" : "chevron-down"} size={14} />
      <span className="text-xs font-semibold text-text-primary">{label}</span>
      <span className="text-xs text-text-tertiary">{count}</span>
    </button>
  );
}

type LineProps = {
  task: TaskRow;
  t: TasksTableProps["t"];
  currentUserId: string;
  currentUserRole: string;
  onRowClick: (task: TaskRow) => void;
  onEdit: (task: TaskRow) => void;
  onDelete: (task: TaskRow) => void;
  onLogTime: () => void;
  formatDate: (date: Date | null, durationMinutes?: number | null) => string;
};

function taskMenu(props: LineProps): { canEdit: boolean; menuItems: MenuItem[] } {
  const { task, t, currentUserId, currentUserRole, onEdit, onDelete, onLogTime } = props;
  const isAdmin = currentUserRole === "ADMIN";
  const isAssignee = task.assignedTo?.id === currentUserId;
  const canEdit = isAdmin || isAssignee;
  const menuItems: MenuItem[] = [];
  if (isAdmin || isAssignee) {
    menuItems.push({
      label: t.tasks.workLogs ?? "Hours",
      icon: "clock",
      onClick: event => {
        event.stopPropagation();
        onLogTime();
      },
    });
  }
  if (canEdit) {
    if (menuItems.length > 0) menuItems.push({ divider: true });
    menuItems.push(
      { label: t.common.edit, icon: "pencil", onClick: () => onEdit(task) },
      { divider: true },
      {
        label: t.common.delete,
        icon: "trash",
        danger: true,
        onClick: () => onDelete(task),
      },
    );
  }
  return { canEdit, menuItems };
}

function TaskActions({
  t,
  menuItems,
}: {
  t: TasksTableProps["t"];
  menuItems: MenuItem[];
}) {
  return (
    <span className="inline-flex" onClick={event => event.stopPropagation()}>
      <Menu
        trigger={
          <IconButton icon="more-horizontal" aria-label={t.tasks.taskActionsLabel} size="sm" />
        }
        align="end"
        items={menuItems}
      />
    </span>
  );
}

function TaskCard(props: LineProps) {
  const { task, t, onRowClick, formatDate } = props;
  const { canEdit, menuItems } = taskMenu(props);
  const overdue = isOverdue(task);
  const dueLabel = formatDate(task.dueDate, task.durationMinutes);

  return (
    <div
      role={canEdit ? "button" : undefined}
      tabIndex={canEdit ? 0 : undefined}
      onClick={canEdit ? () => onRowClick(task) : undefined}
      onKeyDown={
        canEdit
          ? event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onRowClick(task);
              }
            }
          : undefined
      }
      className="flex w-full items-center gap-3 border-b border-border-subtle px-3 py-2.5 text-start hover:bg-bg-sunken/50"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-text-primary">{task.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
          <StatusBadge
            status={statusToDisplay(task.status)}
            className="shrink-0 whitespace-nowrap"
          />
          <span
            dir="ltr"
            className={cn(
              "shrink-0 whitespace-nowrap tabular-nums",
              overdue && "font-medium text-destructive",
            )}
          >
            {dueLabel}
          </span>
        </div>
      </div>
      <TaskActions t={t} menuItems={menuItems} />
    </div>
  );
}

const cell = "overflow-hidden px-2 py-2 align-middle text-center";

function TaskRow(props: LineProps) {
  const { task, t, onRowClick, formatDate } = props;
  const { canEdit, menuItems } = taskMenu(props);
  const overdue = isOverdue(task);
  const dueLabel = formatDate(task.dueDate, task.durationMinutes);

  return (
    <tr
      onClick={canEdit ? () => onRowClick(task) : undefined}
      className={cn(
        "border-b border-border-subtle",
        canEdit && "cursor-pointer hover:bg-bg-sunken/50",
      )}
    >
      <td className={cell}>
        <div className="truncate text-sm font-medium leading-5 text-text-primary">{task.title}</div>
        {task.labels.length > 0 ? (
          <div className="mt-0.5 flex min-w-0 flex-nowrap justify-center gap-1 overflow-hidden">
            {task.labels.slice(0, 3).map(label => (
              <Tag key={label.id} color={label.color} className="shrink-0">
                {label.name}
              </Tag>
            ))}
          </div>
        ) : null}
      </td>
      <td className={cell}>
        <TaskPlace task={task} t={t} />
      </td>
      <td className={cell}>
        <StatusBadge
          status={statusToDisplay(task.status)}
          className="mx-auto whitespace-nowrap"
        />
      </td>
      <td className={cell}>
        <span className="inline-flex justify-center">
          <PriorityIcon priority={priorityToDisplay(task.priority)} />
        </span>
      </td>
      <td className={cell}>
        <span
          dir="ltr"
          className={cn(
            "inline-block max-w-full truncate whitespace-nowrap text-xs leading-5 tabular-nums text-text-tertiary",
            overdue && "font-medium text-destructive",
          )}
          title={dueLabel}
        >
          {dueLabel}
        </span>
      </td>
      <td className={cell}>
        <TaskActions t={t} menuItems={menuItems} />
      </td>
    </tr>
  );
}
