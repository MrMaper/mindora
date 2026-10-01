"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Menu } from "@/components/ui-kit/overlays/menu";
import type { MenuItem } from "@/components/ui-kit/overlays/menu";
import { StatusBadge, type TaskStatus } from "@/components/ui-kit/agile/status-badge";
import { PriorityIcon } from "@/components/ui-kit/agile/priority-icon";
import { WorkLogButton } from "@/components/ui-kit/overlays/work-logs";
import { useLanguage, useTranslation } from "@/i18n/provider";
import {
  completePersonalTask,
  planTaskThisWeek,
  planTaskForToday,
  skipTaskRecurrence,
  stopTaskRecurrence,
} from "@/features/life/actions";
import { listDocsByTaskIdsAction } from "@/features/docs/actions";
import {
  formatClock,
  formatJalaliShort,
  isOverdueTask,
} from "@/lib/life";
import { statusToDisplay, priorityToDisplay } from "@/features/tasks/types";
import type { TaskRow } from "@/features/tasks/types";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { toast } from "sonner";

function TaskDragHandle({ taskId, label }: { taskId: string; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `task:${taskId}`,
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      className={cn(
        "shrink-0 cursor-grab touch-none rounded-md p-1 text-muted-foreground hover:bg-accent",
        isDragging && "opacity-40",
      )}
      aria-label={label}
      {...listeners}
      {...attributes}
    >
      <Icon name="grip-vertical" size={14} />
    </button>
  );
}

export function LifeTaskList({
  tasks,
  empty,
  showPlan = false,
  showPlanToday = false,
  compact = false,
  focusIds,
  onToggleFocus,
  canPinFocus,
  enableDrag = false,
  onTaskClick,
  currentUserId,
  currentUserRole,
}: {
  tasks: TaskRow[];
  empty: React.ReactNode;
  showPlan?: boolean;
  showPlanToday?: boolean;
  /** Tighter rows for narrow columns (e.g. weekly review). */
  compact?: boolean;
  focusIds?: string[];
  onToggleFocus?: (task: TaskRow) => void;
  /** When set, only these rows get the priority target and drag handle. */
  canPinFocus?: (task: TaskRow) => boolean;
  /** Drag the row into today's three priority slots. Requires a parent DndContext. */
  enableDrag?: boolean;
  onTaskClick?: (task: TaskRow) => void;
  currentUserId?: string;
  currentUserRole?: string;
}) {
  const t = useTranslation();
  const language = useLanguage();
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [hiddenIds, setHiddenIds] = React.useState<Set<string>>(() => new Set());
  const [docsByTask, setDocsByTask] = React.useState<
    Record<string, { id: string; title: string }[]>
  >({});

  React.useEffect(() => {
    const ids = tasks.map(task => task.id);
    if (ids.length === 0) {
      setDocsByTask({});
      return;
    }
    let cancelled = false;
    void listDocsByTaskIdsAction(ids).then(map => {
      if (!cancelled) setDocsByTask(map);
    });
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  React.useEffect(() => {
    setHiddenIds(prev => {
      const next = new Set<string>();
      for (const id of prev) {
        if (tasks.some(task => task.id === id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [tasks]);

  async function onDone(id: string) {
    setPendingId(id);
    try {
      const result = await completePersonalTask(id);
      if (!result?.success) {
        toast.error(result?.error ?? t.common.error);
        return;
      }
      setHiddenIds(prev => new Set(prev).add(id));
      router.refresh();
    } catch (error) {
      console.error("markDone failed", error);
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : t.common.error,
      );
    } finally {
      setPendingId(null);
    }
  }

  async function onPlan(id: string) {
    setPendingId(id);
    try {
      const result = await planTaskThisWeek(id);
      if (!result.success) {
        toast.error(result.error ?? t.common.error);
        return;
      }
      router.refresh();
    } catch {
      toast.error(t.common.error);
    } finally {
      setPendingId(null);
    }
  }

  async function onPlanToday(id: string) {
    setPendingId(id);
    try {
      const result = await planTaskForToday(id);
      if (!result.success) {
        toast.error(result.error ?? t.common.error);
        return;
      }
      router.refresh();
    } catch {
      toast.error(t.common.error);
    } finally {
      setPendingId(null);
    }
  }

  const visibleTasks = tasks.filter(task => !hiddenIds.has(task.id));

  if (visibleTasks.length === 0) {
    return (
      <div className="py-6 px-2 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {visibleTasks.map(task => {
        const linked = docsByTask[task.id] ?? [];
        const primaryDoc = linked[0];
        const busy = pendingId === task.id;
        const showDoc =
          !!primaryDoc && (task.area === "PHD" || linked.length > 0);
        const overdue = isOverdueTask(task);

        const menuItems: MenuItem[] = [];
        if (onTaskClick) {
          menuItems.push({
            label: t.common.edit,
            icon: "pencil",
            onClick: () => onTaskClick(task),
          });
        }
        if (showDoc && primaryDoc) {
          menuItems.push({
            label: t.docs.continueWriting,
            icon: "file-text",
            onClick: () => {
              router.push(`/docs?id=${primaryDoc.id}`);
            },
          });
        }
        if (task.recurrence && task.recurrence !== "NONE") {
          menuItems.push({
            label: t.recurrenceUi.skip,
            icon: "rotate-ccw",
            onClick: () => {
              void (async () => {
                setPendingId(task.id);
                const res = await skipTaskRecurrence(task.id);
                setPendingId(null);
                if (!res.success && res.error) window.alert(res.error);
                else router.refresh();
              })();
            },
          });
          menuItems.push({
            label: t.recurrenceUi.stopSeries,
            icon: "x",
            onClick: () => {
              void (async () => {
                setPendingId(task.id);
                const res = await stopTaskRecurrence(task.id, true);
                setPendingId(null);
                if (!res.success && res.error) window.alert(res.error);
                else router.refresh();
              })();
            },
          });
        }

        const dueLabel = task.dueDate
          ? (() => {
              const due = new Date(task.dueDate);
              const clock = formatClock(due, language, task.durationMinutes);
              return `${formatJalaliShort(due, language)}${clock ? ` ${clock}` : ""}`;
            })()
          : null;

        const actions = (
          <div
            className={cn(
              "flex shrink-0 items-center",
              compact ? "gap-0.5" : "gap-1",
            )}
          >
            {!compact && showDoc && primaryDoc ? (
              <Link
                href={`/docs?id=${primaryDoc.id}`}
                className="inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[11px] hover:bg-card"
                title={primaryDoc.title}
                onClick={e => e.stopPropagation()}
              >
                <Icon name="file-text" size={12} />
                {t.docs.continueWriting}
              </Link>
            ) : null}
            {currentUserId && currentUserRole ? (
              <WorkLogButton
                taskId={task.id}
                taskTitle={task.title}
                assignedToId={task.assignedTo?.id ?? null}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
              />
            ) : null}
            {showPlanToday && task.status !== "DONE" ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                className={compact ? "h-7 px-1.5 text-xs" : undefined}
                onClick={() => onPlanToday(task.id)}
              >
                {t.dashboard.planToday}
              </Button>
            ) : null}
            {showPlan && task.status === "BACKLOG" ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                className={compact ? "h-7 px-1.5 text-xs" : undefined}
                onClick={() => onPlan(task.id)}
              >
                {t.dashboard.planWeek}
              </Button>
            ) : null}
            {task.status !== "DONE" ? (
              <Button
                size="sm"
                variant="subtle"
                disabled={busy}
                className={compact ? "h-7 px-2 text-xs" : undefined}
                onClick={() => onDone(task.id)}
              >
                {t.dashboard.markDone}
              </Button>
            ) : null}
            {menuItems.length > 0 ? (
              <Menu
                trigger={
                  <IconButton
                    icon="more-horizontal"
                    size="sm"
                    aria-label={t.common.actions}
                  />
                }
                align="end"
                items={menuItems}
              />
            ) : null}
          </div>
        );

        return (
          <li
            key={task.id}
            className={cn(
              "min-w-0",
              compact ? "py-2 px-1" : "py-2.5 px-2 hover:bg-bg-hover rounded-md",
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              {enableDrag && (!canPinFocus || canPinFocus(task)) ? (
                <TaskDragHandle taskId={task.id} label={t.dashboard.focusDrag} />
              ) : null}
              {onToggleFocus && (!canPinFocus || canPinFocus(task)) ? (
                <button
                  type="button"
                  className={cn(
                    "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent",
                    focusIds?.includes(task.id) && "bg-primary/10 text-primary",
                  )}
                  title={t.dashboard.focusToggle}
                  aria-label={t.dashboard.focusToggle}
                  onClick={() => onToggleFocus(task)}
                >
                  <Icon name="target" size={14} />
                </button>
              ) : (
                <span className="shrink-0">
                  <PriorityIcon priority={priorityToDisplay(task.priority)} />
                </span>
              )}

              <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                {onTaskClick ? (
                  <button
                    type="button"
                    className={cn(
                      "min-w-0 flex-1 truncate text-start text-sm font-medium hover:text-primary focus-visible:outline-none focus-visible:underline",
                      overdue && "text-destructive",
                    )}
                    onClick={() => onTaskClick(task)}
                  >
                    {task.title}
                  </button>
                ) : (
                  <div
                    className={cn(
                      "min-w-0 flex-1 truncate text-sm font-medium",
                      overdue && "text-destructive",
                    )}
                  >
                    {task.title}
                  </div>
                )}
                {task.waitingOn ? (
                  <span className="shrink-0 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                    {t.tasks.waitingOn}
                  </span>
                ) : null}
                <StatusBadge
                  status={statusToDisplay(task.status) as TaskStatus}
                  className="shrink-0"
                />
                {dueLabel ? (
                  <span
                    className={cn(
                      "shrink-0 whitespace-nowrap text-[11px] tabular-nums text-muted-foreground",
                      overdue && "font-medium text-destructive",
                    )}
                  >
                    {dueLabel}
                  </span>
                ) : null}
                {task.projectName ? (
                  <span className="min-w-0 max-w-[8rem] truncate text-[11px] text-muted-foreground">
                    {task.projectName}
                  </span>
                ) : null}
                {linked.length > 0 ? (
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-muted-foreground">
                    <Icon name="file-text" size={11} />
                    {linked.length}
                  </span>
                ) : null}
              </div>

              {actions}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
