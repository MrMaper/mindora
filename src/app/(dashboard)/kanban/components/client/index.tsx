"use client";

import * as React from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { KanbanCard } from "@/components/ui-kit/agile/kanban-card";
import { useKanban } from "../hooks/use-kanban";
import { useTranslation } from "@/i18n/provider";
import { BoardColumn } from "../ui/board-column";
import { KanbanFilters } from "../ui/kanban-filters";
import { EditTaskDrawer } from "../ui/edit-task-drawer";
import { formatDate, isOverdue } from "../ui/sortable-kanban-card";
import { useLanguage } from "@/i18n/provider";
import {
  priorityToDisplay,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  TYPE_OPTIONS,
} from "@/features/tasks/types";
import { BOARD_STATUSES } from "@/features/kanban/types";
import type { BoardColumns } from "@/features/kanban/types";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { ProjectRow } from "@/features/projects/types";
import { Separator } from "@/components/ui/separator";

interface KanbanCCProps {
  initialColumns: BoardColumns;
  users: UserRow[];
  userProjects: ProjectRow[];
  labels: LabelRow[];
  filters: {
    search: string;
    assignee: string;
    label: string;
    priority: string;
    project: string;
  };
  currentUserId: string;
  currentUserRole: string;
}

export function KanbanCC({
  initialColumns,
  users,
  userProjects,
  labels,
  filters,
  currentUserId,
  currentUserRole,
}: KanbanCCProps) {
  const k = useKanban(initialColumns, filters);
  const t = useTranslation();
  const language = useLanguage();

  const userOptions = [
    { value: "", label: t.tasks.unassigned },
    ...users.map(usr => ({ value: usr.id, label: usr.name })),
  ];

  const projectOptions = [
    { value: "", label: t.tasks.noProject },
    ...userProjects.map(proj => ({ value: proj.id, label: proj.name })),
  ];

  const statusFieldOptions = STATUS_OPTIONS.map(o => ({
    value: o.value,
    label: t.tasks[o.labelKey as keyof typeof t.tasks] as string,
  }));
  const priorityFieldOptions = PRIORITY_OPTIONS.map(o => ({
    value: o.value,
    label: t.tasks[o.labelKey as keyof typeof t.tasks] as string,
  }));
  const typeFieldOptions = TYPE_OPTIONS.map(o => ({
    value: o.value,
    label: t.tasks[o.labelKey as keyof typeof t.tasks] as string,
  }));

  const hasActiveFilters = !!(
    filters.search ||
    filters.assignee ||
    filters.label ||
    filters.priority ||
    filters.project
  );

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-4)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--text-xl)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-primary)",
          }}
        >
          {t.board.title}
        </h1>
      </div>

      <KanbanFilters
        search={k.search}
        project={k.project}
        projectOptions={projectOptions}
        onSearchChange={k.setSearch}
        onSearchSubmit={k.onSearchSubmit}
        onProjectChange={k.setProject}
        assignee={filters.assignee}
        label={filters.label}
        priority={filters.priority}
        onFilterChange={k.applyFilters}
        users={users}
        labels={labels}
        priorityOptions={priorityFieldOptions}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={() => {
          k.setProject("");
          k.setSearch("");
          k.applyFilters({
            search: "",
            assignee: "",
            label: "",
            priority: "",
            project: "",
          });
        }}
      />

      {k.actionError && !k.editingTaskId && (
        <div
          className="auth-card__alert auth-card__alert--error"
          style={{ marginBottom: "var(--space-3)" }}
          role="alert"
        >
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
        <div className="flex gap-3 py-4 h-full min-h-0 overflow-x-auto items-stretch">
          {BOARD_STATUSES.map((status, index) => (
            <>
              <BoardColumn
                key={status}
                status={status}
                tasks={k.columns[status]}
                selectedId={k.editingTaskId}
                onCardClick={k.openTask}
              />
              {index !== status.length && <Separator orientation="vertical" />}
            </>
          ))}
        </div>

        <DragOverlay>
          {k.activeTaskCard ? (
            <KanbanCard
              issueKey={k.activeTaskCard.id.slice(-6).toUpperCase()}
              title={k.activeTaskCard.title}
              priority={priorityToDisplay(k.activeTaskCard.priority)}
              labels={k.activeTaskCard.labels.map(l => ({
                name: l.name,
                color: l.color,
              }))}
              assignee={
                k.activeTaskCard.assignedTo
                  ? {
                      name: k.activeTaskCard.assignedTo.name,
                      src: k.activeTaskCard.assignedTo.avatar ?? undefined,
                    }
                  : undefined
              }
              due={formatDate(k.activeTaskCard.dueDate, language)}
              overdue={isOverdue(k.activeTaskCard)}
              state="dragging"
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <EditTaskDrawer
        open={!!k.editingTaskId}
        onClose={k.closeDrawer}
        isPending={k.isPending}
        isLoadingDetail={k.isLoadingDetail}
        actionError={k.actionError}
        control={k.editForm.control}
        setValue={k.editForm.setValue}
        labels={labels}
        selectedLabelIds={k.selectedLabelIds}
        onLabelToggle={k.toggleLabel}
        activeTask={k.activeTask}
        users={users}
        projects={userProjects}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        onSubmit={k.onEditSubmit}
        statusFieldOptions={statusFieldOptions}
        priorityFieldOptions={priorityFieldOptions}
        typeFieldOptions={typeFieldOptions}
        userOptions={userOptions}
        projectOptions={projectOptions}
      />
    </>
  );
}
