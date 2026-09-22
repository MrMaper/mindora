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

export function BoardColumn({
  status,
  tasks,
  selectedId,
  onCardClick,
  label: labelOverride,
  docsByTask = {},
  onDocsChange,
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
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const t = useTranslation();
  const display = statusToDisplay(status);
  const labelKey =
    STATUS_OPTIONS.find(o => o.value === status)?.labelKey ?? "backlog";
  const label =
    labelOverride ?? (t.tasks[labelKey as keyof typeof t.tasks] as string);

  return (
    <div className="w-[min(17.5rem,78vw)] sm:w-70 flex-none flex flex-col max-h-full">
      <div className="flex items-center gap-2 px-1 py-2.5 flex-nowrap">
        <span
          className="size-2.5 rounded-full flex-none"
          style={{ background: `var(--status-${display})` }}
        />
        <span className="text-sm font-semibold whitespace-nowrap">{label}</span>
        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 overflow-y-auto py-0.5 min-h-[40px] rounded-md transition-colors max-h-[calc(100vh-240px)] ${
          isOver ? "bg-accent" : ""
        }`}
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
          <div className="flex items-center justify-center h-15 border-dashed border-border-muted text-muted-foreground text-[10px] rounded-md">
            {t.board.noTasks}
          </div>
        )}
      </div>
    </div>
  );
}
