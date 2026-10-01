"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslation } from "@/i18n/provider";
import { statusToDisplay, STATUS_OPTIONS } from "@/features/tasks/types";
import { SortableKanbanCard } from "./sortable-kanban-card";
import type { BoardStatus } from "@/features/kanban/types";
import type { TaskRow } from "@/features/tasks/types";
import { cn } from "@/lib/utils";

export function BoardColumn({
  status,
  tasks,
  selectedId,
  onCardClick,
  label: labelOverride,
  docsByTask = {},
  onDocsChange,
  density = "default",
}: {
  status: BoardStatus;
  tasks: TaskRow[];
  selectedId: string | null;
  onCardClick: (task: TaskRow) => void;
  label?: string;
  docsByTask?: Record<string, { id: string; title: string }[]>;
  onDocsChange?: (
    taskId: string,
    docs: { id: string; title: string }[],
  ) => void;
  density?: "default" | "compact";
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const t = useTranslation();
  const display = statusToDisplay(status);
  const labelKey =
    STATUS_OPTIONS.find(o => o.value === status)?.labelKey ?? "backlog";
  const label =
    labelOverride ?? (t.tasks[labelKey as keyof typeof t.tasks] as string);
  const compact = density === "compact";

  return (
    <div
      className={cn(
        "flex max-h-full flex-none flex-col",
        compact
          ? "w-[min(18rem,85vw)] sm:w-70"
          : "w-[min(15rem,82vw)] sm:w-70",
      )}
    >
      <div
        className={cn(
          "flex flex-nowrap items-center justify-center gap-2 px-1",
          compact ? "py-1.5" : "py-2.5",
        )}
      >
        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ background: `var(--status-${display})` }}
        />
        <span className="whitespace-nowrap text-sm font-semibold">{label}</span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-10 flex-col gap-2 overflow-y-auto rounded-md py-0.5 transition-colors",
          compact
            ? "max-h-[min(70dvh,calc(100dvh-11rem))] sm:max-h-[calc(100vh-220px)]"
            : "max-h-[calc(100dvh-14rem)] sm:max-h-[calc(100vh-240px)]",
          isOver && "bg-accent",
        )}
      >
        <SortableContext
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <SortableKanbanCard
              key={task.id}
              task={task}
              selected={selectedId === task.id}
              onClick={() => onCardClick(task)}
              linkedDocs={docsByTask[task.id] ?? []}
              onDocsChange={onDocsChange}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="flex h-15 items-center justify-center rounded-md border-dashed border-border-muted text-[10px] text-muted-foreground">
            {t.board.noTasks}
          </div>
        )}
      </div>
    </div>
  );
}
