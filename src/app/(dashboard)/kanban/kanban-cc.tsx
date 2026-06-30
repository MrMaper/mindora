"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { DndContext, DragOverlay, useDroppable } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Tag } from "@/components/ui-kit/data-display/tag";
import { KanbanCard } from "@/components/ui-kit/agile/kanban-card";
import { STATUSES } from "@/components/ui-kit/agile/status-badge";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { useKanban } from "./use-kanban";
import { getTranslations } from "@/i18n";
import {
  statusToDisplay,
  priorityToDisplay,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  TYPE_OPTIONS,
} from "@/features/tasks/types";
import { BOARD_STATUSES } from "@/features/kanban/types";
import type { BoardColumns, BoardStatus } from "@/features/kanban/types";
import type { TaskRow } from "@/features/tasks/types";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { Language } from "@/types/db";
import type { Translations } from "@/i18n";

interface KanbanCCProps {
  initialColumns: BoardColumns;
  users: UserRow[];
  labels: LabelRow[];
  filters: { search: string; assignee: string; label: string; priority: string };
  language: Language;
}

function formatDate(date: Date | null): string | undefined {
  if (!date) return undefined;
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isOverdue(task: TaskRow): boolean {
  return !!task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "DONE";
}

function activityLabel(t: Translations, action: string): string {
  switch (action) {
    case "created":
      return t.tasks.activityCreated;
    case "status_changed":
      return t.tasks.activityStatusChanged;
    case "assigned":
      return t.tasks.activityAssigned;
    default:
      return t.tasks.activityUpdated;
  }
}

export function KanbanCC({ initialColumns, users, labels, filters, language }: KanbanCCProps) {
  const k = useKanban(initialColumns, filters);
  const t = getTranslations(language);

  const userOptions = [
    { value: "", label: t.tasks.unassigned },
    ...users.map(usr => ({ value: usr.id, label: usr.name })),
  ];
  const statusFieldOptions = STATUS_OPTIONS.map(o => ({ value: o.value, label: t.tasks[o.labelKey as keyof typeof t.tasks] as string }));
  const priorityFieldOptions = PRIORITY_OPTIONS.map(o => ({ value: o.value, label: t.tasks[o.labelKey as keyof typeof t.tasks] as string }));
  const typeFieldOptions = TYPE_OPTIONS.map(o => ({ value: o.value, label: t.tasks[o.labelKey as keyof typeof t.tasks] as string }));

  const hasActiveFilters = !!(filters.search || filters.assignee || filters.label || filters.priority);

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
        <h1 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>
          {t.board.title}
        </h1>
      </div>

      <div style={{ marginBottom: "var(--space-2)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <form onSubmit={k.onSearchSubmit} style={{ display: "flex", gap: "var(--space-2)" }}>
          <Input
            placeholder={t.board.search}
            icon="search"
            value={k.search}
            onChange={e => k.setSearch(e.target.value)}
            style={{ maxWidth: 240 }}
          />
          <Button type="submit" variant="secondary">
            {t.board.searchButton}
          </Button>
        </form>

        <Select
          value={filters.assignee}
          onChange={e => k.applyFilters({ assignee: e.target.value })}
          style={{ maxWidth: 180 }}
          options={[{ value: "", label: t.board.allAssignees }, ...users.map(usr => ({ value: usr.id, label: usr.name }))]}
        />
        <Select
          value={filters.label}
          onChange={e => k.applyFilters({ label: e.target.value })}
          style={{ maxWidth: 160 }}
          options={[{ value: "", label: t.board.allLabels }, ...labels.map(l => ({ value: l.id, label: l.name }))]}
        />
        <Select
          value={filters.priority}
          onChange={e => k.applyFilters({ priority: e.target.value })}
          style={{ maxWidth: 160 }}
          options={[{ value: "", label: t.board.allPriorities }, ...priorityFieldOptions]}
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            icon="x"
            onClick={() => {
              k.setSearch("");
              k.applyFilters({ search: "", assignee: "", label: "", priority: "" });
            }}
          >
            {t.board.clearFilters}
          </Button>
        )}
      </div>

      {k.actionError && !k.editingTaskId && (
        <div className="auth-card__alert auth-card__alert--error" style={{ marginBottom: "var(--space-3)" }} role="alert">
          {k.actionError}
        </div>
      )}

      <DndContext
        id="kanban-board"
        sensors={k.sensors}
        collisionDetection={k.collisionDetection}
        onDragStart={k.onDragStart}
        onDragOver={k.onDragOver}
        onDragEnd={k.onDragEnd}
      >
        <div className="sf-board">
          {BOARD_STATUSES.map(status => (
            <BoardColumn
              key={status}
              status={status}
              tasks={k.columns[status]}
              t={t}
              selectedId={k.editingTaskId}
              onCardClick={k.openTask}
            />
          ))}
        </div>

        <DragOverlay>
          {k.activeTaskCard ? (
            <KanbanCard
              issueKey={k.activeTaskCard.id.slice(-6).toUpperCase()}
              title={k.activeTaskCard.title}
              priority={priorityToDisplay(k.activeTaskCard.priority)}
              labels={k.activeTaskCard.labels.map(l => ({ name: l.name, color: l.color }))}
              assignee={k.activeTaskCard.assignedTo ? { name: k.activeTaskCard.assignedTo.name, src: k.activeTaskCard.assignedTo.avatar ?? undefined } : undefined}
              due={formatDate(k.activeTaskCard.dueDate)}
              overdue={isOverdue(k.activeTaskCard)}
              state="dragging"
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Edit task drawer ────────────────────────────────────────── */}
      <Drawer
        open={!!k.editingTaskId}
        onClose={k.closeDrawer}
        wide
        header={
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>
            {t.tasks.editTask}
          </span>
        }
        footer={
          <div style={{ display: "flex", gap: "var(--space-2)", marginLeft: "auto" }}>
            <Button variant="ghost" onClick={k.closeDrawer} disabled={k.isPending}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" loading={k.isPending} onClick={k.onEditSubmit} disabled={k.isLoadingDetail}>
              {t.tasks.saveChanges}
            </Button>
          </div>
        }
      >
        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {k.actionError && (
            <div className="auth-card__alert auth-card__alert--error" role="alert">
              {k.actionError}
            </div>
          )}

          {k.isLoadingDetail ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
              {t.common.loading}
            </div>
          ) : (
            <>
              <Controller
                name="title"
                control={k.editForm.control}
                render={({ field, fieldState }) => (
                  <Input {...field} label={t.tasks.taskTitle} error={fieldState.error?.message} />
                )}
              />
              <Controller
                name="description"
                control={k.editForm.control}
                render={({ field, fieldState }) => (
                  <Textarea {...field} label={t.tasks.description} error={fieldState.error?.message} />
                )}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <Controller
                  name="status"
                  control={k.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select {...field} label={t.tasks.status} options={statusFieldOptions} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  name="priority"
                  control={k.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select {...field} label={t.tasks.priority} options={priorityFieldOptions} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  name="type"
                  control={k.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select {...field} label={t.tasks.type} options={typeFieldOptions} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  name="assignedToId"
                  control={k.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select {...field} label={t.tasks.assignee} options={userOptions} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  name="dueDate"
                  control={k.editForm.control}
                  render={({ field, fieldState }) => (
                    <Input {...field} type="date" label={t.tasks.dueDate} error={fieldState.error?.message} />
                  )}
                />
              </div>

              <div>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", marginBottom: "var(--space-2)" }}>
                  {t.tasks.labels}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  {labels.map(l => {
                    const active = k.selectedLabelIds.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => k.toggleLabel(l.id)}
                        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", opacity: active ? 1 : 0.45 }}
                      >
                        <Tag color={l.color}>{l.name}</Tag>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", marginBottom: "var(--space-2)" }}>
                  {t.tasks.activity}
                </div>
                {!k.activeTask || k.activeTask.activity.length === 0 ? (
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{t.tasks.noActivity}</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    {k.activeTask.activity.map(entry => (
                      <div key={entry.id} style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                        <strong>{entry.performedBy.name}</strong> {activityLabel(t, entry.action)}
                        <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Drawer>
    </>
  );
}

function BoardColumn({
  status,
  tasks,
  t,
  selectedId,
  onCardClick,
}: {
  status: BoardStatus;
  tasks: TaskRow[];
  t: Translations;
  selectedId: string | null;
  onCardClick: (task: TaskRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const display = statusToDisplay(status);
  const meta = STATUSES[display];
  const labelKey = STATUS_OPTIONS.find(o => o.value === status)?.labelKey ?? "backlog";
  const label = t.tasks[labelKey as keyof typeof t.tasks] as string;

  return (
    <div className="sf-col">
      <div className="sf-col__head">
        <span className="sf-col__dot" style={{ background: meta.color }} />
        <span className="sf-col__name">{label}</span>
        <span className="sf-col__count">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className={`sf-col__list${isOver ? " sf-col__list--over" : ""}`}>
        <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <SortableKanbanCard
              key={task.id}
              task={task}
              selected={selectedId === task.id}
              onClick={() => onCardClick(task)}
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && <div className="sf-col__empty">{t.board.noTasks}</div>}
      </div>
    </div>
  );
}

function SortableKanbanCard({
  task,
  selected,
  onClick,
}: {
  task: TaskRow;
  selected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
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
        assignee={task.assignedTo ? { name: task.assignedTo.name, src: task.assignedTo.avatar ?? undefined } : undefined}
        due={formatDate(task.dueDate)}
        overdue={isOverdue(task)}
        state={selected ? "selected" : undefined}
        onClick={onClick}
      />
    </div>
  );
}
