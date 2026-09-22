"use client";

import { useTranslation } from "@/i18n/provider";

import * as React from "react";
import { useTasks } from "../hooks/use-tasks";
import {
  getAllOptionsWithLabels,
  withEmptyOption,
} from "@/components/ui-kit/forms/select-utils";
import { Pagination } from "@/components/ui-kit/tables/pagination";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { Language } from "@/types/db";
import type { ProjectRow } from "@/features/projects/types";
import { withCurrentProjectOption, projectPickerLabel } from "@/lib/project-namespace";

// UI components
import { PageHeader } from "../ui/page-header";
import { SearchFilters } from "../ui/search-filters";
import { TasksTable } from "../ui/tasks-table";
import { CreateTaskDrawer } from "../ui/create-task-drawer";
import { EditTaskDrawer } from "../ui/edit-task-drawer";
import { LabelManagementDialog } from "../ui/label-management-dialog";
import { DeleteConfirmationDialog } from "../ui/delete-confirmation-dialog";
import { GetTasksResult } from "@/features/tasks/types";
import { GlobalError } from "@/components/ui-kit/global";

interface TasksCCProps {
  initialData: GetTasksResult;
  users: UserRow[];
  userProjects: ProjectRow[];
  labels: LabelRow[];
  filters: {
    search: string;
    status: string;
    priority: string;
    assignee: string;
    project: string;
    sort: string;
    order: string;
  };
  page: number;
  language: Language;
  currentUserId: string;
  currentUserRole: string;
}

export function TasksCC({
  initialData,
  users,
  userProjects,
  labels,
  filters,
  page,
  language,
  currentUserId,
  currentUserRole,
}: TasksCCProps) {
  const u = useTasks(filters);
  const t = useTranslation();

  const { tasks, total, totalPages } = initialData;

  const userOptions = [
    { value: "", label: t.tasks.unassigned },
    ...users.map(usr => ({ value: usr.id, label: usr.name })),
  ];

  const projectOptions = withCurrentProjectOption(
    [
      { value: "", label: t.tasks.noProject },
      ...userProjects.map(proj => ({
        value: proj.id,
        label: projectPickerLabel(proj, language === "EN" ? "EN" : "FA"),
      })),
    ],
    u.activeTask?.projectId
      ? {
          id: u.activeTask.projectId,
          name: u.activeTask.projectName ?? u.activeTask.projectId,
        }
      : null,
  );

  const statusOptions = withEmptyOption(
    getAllOptionsWithLabels(t, "status"),
    t.tasks.allStatuses,
  );
  const priorityOptions = withEmptyOption(
    getAllOptionsWithLabels(t, "priority"),
    t.tasks.allPriorities,
  );

  const hasActiveFilters = !!(
    filters.status ||
    filters.priority ||
    filters.assignee ||
    filters.project ||
    filters.search
  );

  const dateLocale = language === "EN" ? "en-US" : "fa-IR";

  function formatDate(date: Date | null): string {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(dateLocale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <PageHeader
        total={total}
        onLabelDialogOpen={u.onLabelDialogOpen}
        onCreate={u.openCreate}
        currentUserRole={currentUserRole}
      />

      {/* ── Search + filters ────────────────────────────────────────── */}
      <SearchFilters
        t={t.tasks}
        filters={filters}
        search={u.search}
        project={u.project}
        projectOptions={projectOptions}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        userOptions={userOptions}
        onSearchChange={u.setSearch}
        onSearchSubmit={u.onSearchSubmit}
        onFiltersChange={filter =>
          u.applyFilters(
            filter as Partial<import("../hooks/use-tasks").TaskFilters>,
          )
        }
        onProjectChange={u.setProject}
        onClearFilters={() => {
          u.setProject("");
          u.applyFilters({ search: "", status: "", priority: "", assignee: "", project: "" });
        }}
        hasActiveFilters={hasActiveFilters}
        currentUserRole={currentUserRole}
      />

      {/* ── Global error ─────────────────────────────────────────────── */}
      <GlobalError error={u.actionError} drawerMode={u.drawerMode} />

      {/* ── Tasks table ──────────────────────────────────────────────── */}
      <TasksTable
        tasks={tasks}
        t={t}
        filters={{ sort: filters.sort, order: filters.order }}
        onSortChange={u.changeSort}
        onRowClick={u.openEdit}
        onEdit={u.openEdit}
        onDelete={u.setDeleteTarget}
        formatDate={formatDate}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
      />

      {/* ── Pagination ───────────────────────────────────────────────── */}
      <Pagination page={page} totalPages={totalPages} filters={filters} />

      {/* ── Create task drawer ──────────────────────────────────────── */}
      <CreateTaskDrawer
        isOpen={u.drawerMode === "create"}
        onClose={u.closeDrawer}
        control={u.createForm.control}
        setValue={u.createForm.setValue}
        projects={userProjects}
        labels={labels}
        statusOptions={statusOptions.filter(o => o.value !== "")}
        priorityOptions={priorityOptions.filter(o => o.value !== "")}
        userOptions={userOptions}
        selectedLabelIds={u.selectedLabelIds}
        onLabelToggle={u.toggleLabel}
        onSubmit={u.onCreateSubmit}
        actionError={u.actionError}
        isPending={u.isPending}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        preset="life"
      />

      {/* ── Edit task drawer ────────────────────────────────────────── */}
      <EditTaskDrawer
        isOpen={u.drawerMode === "edit"}
        onClose={u.closeDrawer}
        control={u.editForm.control}
        setValue={u.editForm.setValue}
        users={users}
        projects={userProjects}
        labels={labels}
        activeTask={u.activeTask}
        isLoadingDetail={u.isLoadingDetail}
        statusOptions={statusOptions.filter(o => o.value !== "")}
        priorityOptions={priorityOptions.filter(o => o.value !== "")}
        userOptions={userOptions}
        selectedLabelIds={u.selectedLabelIds}
        onLabelToggle={u.toggleLabel}
        onSubmit={u.onEditSubmit}
        actionError={u.actionError}
        isPending={u.isPending}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        preset="life"
      />

      {/* ── Label management dialog ─────────────────────────────────── */}
      {currentUserRole === "ADMIN" && (
        <LabelManagementDialog
          isOpen={u.labelDialogOpen}
          onClose={() => u.setLabelDialogOpen(false)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form={u.labelForm as any}
          labels={labels}
          t={t.tasks}
          onCreateSubmit={u.onCreateLabelSubmit}
          onDeleteLabel={u.onDeleteLabel}
          labelError={u.labelError}
          isPending={u.isPending}
        />
      )}

      {/* ── Delete confirmation dialog ───────────────────────────────── */}
      <DeleteConfirmationDialog
        isOpen={!!u.deleteTarget}
        onClose={() => u.setDeleteTarget(null)}
        task={u.deleteTarget}
        t={t.tasks}
        onConfirm={u.onDeleteConfirm}
        isPending={u.isPending}
      />
    </>
  );
}