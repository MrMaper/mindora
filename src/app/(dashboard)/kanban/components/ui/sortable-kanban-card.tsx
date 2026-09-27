"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import * as React from "react";
import { KanbanCard } from "@/components/ui-kit/agile/kanban-card";
import { priorityToDisplay } from "@/features/tasks/types";
import type { TaskRow } from "@/features/tasks/types";
import { useLanguage, useTranslation } from "@/i18n/provider";
import { createDocLinkedToTask } from "@/features/research/actions";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/life";

export function formatDate(date: Date | null, language: "EN" | "FA"): string | undefined {
  if (!date) return undefined;
  const locale = language === "FA" ? "fa-IR" : "en-US";
  const value = new Date(date);
  const day = value.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });
  const clock = formatClock(value, language);
  return clock ? `${day} ${clock}` : day;
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
  linkedDocs = [],
  onDocsChange,
}: {
  task: TaskRow;
  selected: boolean;
  onClick: () => void;
  linkedDocs?: { id: string; title: string }[];
  onDocsChange?: (
    taskId: string,
    docs: { id: string; title: string }[],
  ) => void;
}) {
  const language = useLanguage();
  const t = useTranslation();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
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

  const primary = linkedDocs[0];

  async function createLinked(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setPending(true);
    const result = await createDocLinkedToTask({
      taskId: task.id,
      templateKey: "researchIdea",
    });
    setPending(false);
    if (result.success && result.data?.id) {
      const id = String(result.data.id);
      const next = [{ id, title: task.title }, ...linkedDocs];
      onDocsChange?.(task.id, next);
      router.push(`/docs?id=${id}`);
    } else if (result.error) {
      window.alert(result.error);
    }
  }

  function openDoc(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/docs?id=${id}`);
  }

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col gap-0.5">
      <div {...attributes} {...listeners}>
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
          attachments={linkedDocs.length > 0 ? linkedDocs.length : undefined}
          state={selected ? "selected" : undefined}
          onClick={onClick}
        />
      </div>

      <div
        className="flex items-center gap-1 px-1"
        onPointerDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
      >
        {primary ? (
          <>
            <button
              type="button"
              className={cn(
                "min-w-0 flex-1 truncate rounded-md border bg-card px-2 py-1 text-[11px]",
                "text-start hover:bg-accent transition-colors",
              )}
              title={primary.title}
              onClick={e => openDoc(e, primary.id)}
            >
              <span className="inline-flex items-center gap-1">
                <Icon name="file-text" size={11} className="shrink-0" />
                <span className="truncate">{primary.title}</span>
              </span>
            </button>
            {linkedDocs.length > 1 && (
              <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                +{linkedDocs.length - 1}
              </span>
            )}
          </>
        ) : (
          <button
            type="button"
            disabled={pending}
            className={cn(
              "w-full rounded-md border border-dashed px-2 py-1 text-[11px]",
              "text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
            )}
            onClick={e => void createLinked(e)}
          >
            {pending ? "…" : t.life.cardCreateDoc}
          </button>
        )}
      </div>
    </div>
  );
}
