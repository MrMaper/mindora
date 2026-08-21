"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCard } from "@/components/ui-kit/agile/kanban-card";
import { priorityToDisplay } from "@/features/tasks/types";
import type { TaskRow } from "@/features/tasks/types";
import { useLanguage } from "@/i18n/provider";

export function formatDate(date: Date | null, language: "EN" | "FA"): string | undefined {
  if (!date) return undefined;
  const locale = language === "FA" ? "fa-IR" : "en-US";
  return new Date(date).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(task: TaskRow): boolean {
  return (
    !!task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE"
  );
}

export function SortableKanbanCard({
  task,
  selected,
  onClick,
}: {
  task: TaskRow;
  selected: boolean;
  onClick: () => void;
}) {
  const language = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanCard
        issueKey={task.id.slice(-6).toUpperCase()}
        title={task.title}
        priority={priorityToDisplay(task.priority)}
        labels={task.labels.map(l => ({ name: l.name, color: l.color }))}
        assignee={
          task.assignedTo
            ? {
                name: task.assignedTo.name,
                src: task.assignedTo.avatar ?? undefined,
              }
            : undefined
        }
        due={formatDate(task.dueDate, language)}
        overdue={isOverdue(task)}
        state={selected ? "selected" : undefined}
        onClick={onClick}
      />
    </div>
  );
}
