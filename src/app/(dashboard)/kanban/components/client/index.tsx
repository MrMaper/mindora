"use client";

import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";

import * as React from "react";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { KanbanCard } from "@/components/ui-kit/agile/kanban-card";
import { Button } from "@/components/ui-kit/forms/button";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
import { useKanban } from "../hooks/use-kanban";
import type { KanbanCreateDefaults } from "../hooks/use-kanban";
import { useTranslation } from "@/i18n/provider";
import { BoardColumn } from "../ui/board-column";
import { KanbanFilters } from "../ui/kanban-filters";
import { EditTaskDrawer } from "../ui/edit-task-drawer";
import { CreateTaskDrawer } from "@/app/(dashboard)/tasks/components/ui/create-task-drawer";
import { formatDate, isOverdue } from "../ui/sortable-kanban-card";
import { useLanguage } from "@/i18n/provider";
import {
  priorityToDisplay,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
} from "@/features/tasks/types";
import { BOARD_STATUSES } from "@/features/kanban/types";
import type { BoardColumns, BoardStatus } from "@/features/kanban/types";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { ProjectRow } from "@/features/projects/types";
import type { LifeArea } from "@/types/db";
import { Separator } from "@/components/ui/separator";
import { listDocsByTaskIdsAction } from "@/features/docs/actions";

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
    area?: string;
  };
  currentUserId: string;
  currentUserRole: string;
  statuses?: BoardStatus[];
  columnLabels?: Partial<Record<BoardStatus, string>>;
  title?: string;
  /** Where filter URL updates go (research hub stays on /research). */
  basePath?: string;
  /** Keep this `?project=` value when syncing filters (research scope). */
  urlProjectParam?: string;
  /** Pre-select project/area when creating from a hub context. */
  createDefaults?: KanbanCreateDefaults;
  /** Hide board project filter when the hub has its own switcher. */
  showProjectFilter?: boolean;
  /** Hide the whole filter bar (research hub). */
  showFilters?: boolean;
  /**
   * Research hub: hide the page title header, show a compact create strip,
   * and use denser board columns for phone layouts.
   */
  embedded?: boolean;
  /** Form preset for create/edit drawers. */
  formPreset?: import("@/components/tasks/task-form-fields").TaskFormPreset;
}

export function KanbanCC({
  initialColumns,
  users,
  userProjects,
  labels,
  filters,
  currentUserId,
  currentUserRole,
  statuses = BOARD_STATUSES,
  columnLabels,
  title,
  basePath = "/kanban",
  urlProjectParam,
  createDefaults,
  showProjectFilter = true,
  showFilters = true,
  embedded = false,
  formPreset = "life",
}: KanbanCCProps) {
  const k = useKanban(initialColumns, filters, {
    basePath,
    urlProjectParam,
    statuses,
  });
  const t = useTranslation();
  const language = useLanguage();
  const [docsByTask, setDocsByTask] = React.useState<
    Record<string, { id: string; title: string }[]>
  >({});

  React.useEffect(() => {
    const ids = statuses.flatMap(status =>
      (k.columns[status] ?? []).map(task => task.id),
    );
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
  }, [k.columns, statuses]);

  const userOptions = [
    { value: "", label: t.tasks.unassigned },
    ...users.map(usr => ({ value: usr.id, label: usr.name })),
  ];

  const statusFieldOptions = statuses.map(status => {
    const opt = STATUS_OPTIONS.find(o => o.value === status);
    const labelKey = opt?.labelKey ?? "backlog";
    return {
      value: status,
      label:
        columnLabels?.[status] ??
        (t.tasks[labelKey as keyof typeof t.tasks] as string),
    };
  });
  const priorityFieldOptions = PRIORITY_OPTIONS.map(o => ({
    value: o.value,
    label: t.tasks[o.labelKey as keyof typeof t.tasks] as string,
  }));

  const hasActiveFilters = !!(
    filters.search ||
    (filters.assignee && filters.assignee !== currentUserId) ||
    filters.label ||
    filters.priority ||
    (showProjectFilter && (filters.project || filters.area))
  );

  function handleOpenCreate() {
    const defaults: KanbanCreateDefaults = {
      projectId:
        createDefaults?.projectId ||
        (filters.project.includes(",") ? "" : filters.project) ||
        undefined,
      area: createDefaults?.area,
      status: createDefaults?.status ?? "BACKLOG",
    };
    if (!defaults.area && filters.area) {
      defaults.area = filters.area as LifeArea;
    }
    if (!defaults.area && defaults.projectId) {
      const proj = userProjects.find(p => p.id === defaults.projectId);
      if (proj?.area) defaults.area = proj.area as LifeArea;
    }
    k.openCreate(defaults);
  }

  return (
    <div className={embedded ? "flex min-h-0 flex-col" : undefined}>
      {embedded ? (
        <div className="mb-2 flex items-center justify-end">
          <Button
            variant="primary"
            size="sm"
            icon="plus"
            onClick={handleOpenCreate}
          >
            {t.tasks.createTaskButton}
          </Button>
        </div>
      ) : (
        <PageHeaderBar
          className="mb-4"
          title={title ?? t.board.title}
          actions={
            <Button variant="primary" icon="plus" onClick={handleOpenCreate}>
              {t.tasks.createTaskButton}
            </Button>
          }
        />
      )}

      {showFilters && (
        <KanbanFilters
          search={k.search}
          project={filters.project}
          area={filters.area ?? ""}
          projects={userProjects}
          onSearchChange={k.setSearch}
          onSearchSubmit={k.onSearchSubmit}
          onScopeChange={next => {
            k.setProject(next.project);
            k.applyFilters(next);
          }}
          showProjectFilter={showProjectFilter}
          assignee={filters.assignee}
          label={filters.label}
          priority={filters.priority}
          onFilterChange={k.applyFilters}
          users={users}
          labels={labels}
          priorityOptions={priorityFieldOptions}
          showAssigneeFilter={currentUserRole === "ADMIN"}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={() => {
            if (showProjectFilter) k.setProject("");
            k.setSearch("");
            k.applyFilters({
              search: "",
              assignee: "",
              label: "",
              priority: "",
              ...(showProjectFilter ? { project: "", area: "" } : {}),
            });
          }}
        />
      )}

      {k.actionError && k.drawerMode === "none" && (
        <div
          className="auth-card__alert auth-card__alert--error"
          style={{ marginBottom: "var(--space-3)" }}
          role="alert"
        >
          <ResolvedValidationText text={k.actionError} />
        </div>
      )}

      <DndContext
        id="kanban-board"
        sensors={k.sensors}
        collisionDetection={k.collisionDetection}
        onDragStart={k.onDragStart}
        onDragOver={k.onDragOver}
        onDragEnd={k.onDragEnd}
        onDragCancel={k.onDragCancel}
      >
        <div
          className={
            embedded
              ? "flex min-h-0 items-stretch gap-2 overflow-x-auto scroll-px-1 px-0.5 py-2 snap-x snap-mandatory sm:gap-3 sm:snap-none sm:py-3 [-webkit-overflow-scrolling:touch]"
              : "flex h-full min-h-0 items-stretch gap-3 overflow-x-auto snap-x snap-mandatory py-4 -mx-1 px-1 sm:snap-none"
          }
        >
          {statuses.map((status, index) => (
            <React.Fragment key={status}>
              <div className="snap-start shrink-0">
                <BoardColumn
                  status={status}
                  tasks={k.columns[status] ?? []}
                  selectedId={k.editingTaskId}
                  onCardClick={k.openTask}
                  label={columnLabels?.[status]}
                  docsByTask={docsByTask}
                  density={embedded ? "compact" : "default"}
                  onDocsChange={(taskId, docs) => {
                    setDocsByTask(prev => ({ ...prev, [taskId]: docs }));
                  }}
                />
              </div>
              {index !== statuses.length - 1 && (
                <Separator
                  orientation="vertical"
                  className="hidden sm:block"
                />
              )}
            </React.Fragment>
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
              due={formatDate(k.activeTaskCard.dueDate, language, k.activeTaskCard.durationMinutes)}
              overdue={isOverdue(k.activeTaskCard)}
              state="dragging"
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateTaskDrawer
        isOpen={k.drawerMode === "create"}
        onClose={k.closeDrawer}
        control={k.createForm.control}
        setValue={k.createForm.setValue}
        projects={userProjects}
        labels={labels}
        statusOptions={statusFieldOptions}
        priorityOptions={priorityFieldOptions}
        userOptions={userOptions}
        selectedLabelIds={k.selectedLabelIds}
        onLabelToggle={k.toggleLabel}
        onSubmit={k.onCreateSubmit}
        actionError={k.actionError}
        isPending={k.isPending}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        preset={formPreset}
      />

      <EditTaskDrawer
        open={k.drawerMode === "edit"}
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
        userOptions={userOptions}
        preset={formPreset}
      />
    </div>
  );
}
