"use client";

import * as React from "react";
import { useTasks } from "../hooks/use-tasks";
import { getTranslations } from "@/i18n";
import {
  getAllOptionsWithLabels,
  withEmptyOption,
} from "@/components/ui-kit/forms/select-utils";
import { Pagination } from "@/components/ui-kit/tables/pagination";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { Language } from "@/types/db";

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
  labels: LabelRow[];
  filters: {
    search: string;
    status: string;
    priority: string;
    assignee: string;
    sort: string;
    order: string;
  };
  page: number;
  language: Language;
  currentUserId: string;
}

export function TasksCC({
  initialData,
  users,
  labels,
  filters,
  page,
  language,
  currentUserId,
}: TasksCCProps) {
  const u = useTasks(filters);
  const t = getTranslations(language);

  const { tasks, total, totalPages } = initialData;

  const userOptions = [
    { value: "", label: t.tasks.unassigned },
    ...users.map(usr => ({ value: usr.id, label: usr.name })),
  ];
  const statusOptions = withEmptyOption(
    getAllOptionsWithLabels(language, "status"),
    t.tasks.allStatuses,
  );
  const priorityOptions = withEmptyOption(
    getAllOptionsWithLabels(language, "priority"),
    t.tasks.allPriorities,
  );
  const typeOptions = withEmptyOption(
    getAllOptionsWithLabels(language, "type"),
    t.tasks.type,
  );

  const hasActiveFilters = !!(
    filters.status ||
    filters.priority ||
    filters.assignee ||
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
      />

      {/* ── Search + filters ────────────────────────────────────────── */}
      <SearchFilters
        t={t.tasks}
        filters={filters}
        search={u.search}
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
        onClearFilters={() =>
          u.applyFilters({ search: "", status: "", priority: "", assignee: "" })
        }
        hasActiveFilters={hasActiveFilters}
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
      />

      {/* ── Pagination ───────────────────────────────────────────────── */}
      <Pagination page={page} totalPages={totalPages} filters={filters} />

      {/* ── Create task drawer ──────────────────────────────────────── */}
      <CreateTaskDrawer
        isOpen={u.drawerMode === "create"}
        onClose={u.closeDrawer}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form={{ ...u.createForm, isPending: u.isPending } as any}
        t={t.tasks}
        users={users}
        labels={labels}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        typeOptions={typeOptions}
        userOptions={userOptions}
        selectedLabelIds={u.selectedLabelIds}
        onLabelToggle={u.toggleLabel}
        onSubmit={u.onCreateSubmit}
        actionError={u.actionError}
        isPending={u.isPending}
      />

      {/* ── Edit task drawer ────────────────────────────────────────── */}
      <EditTaskDrawer
        isOpen={u.drawerMode === "edit"}
        onClose={u.closeDrawer}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form={{ ...u.editForm, isPending: u.isPending } as any}
        t={t}
        users={users}
        labels={labels}
        activeTask={u.activeTask}
        isLoadingDetail={u.isLoadingDetail}
        statusOptions={statusOptions}
        priorityOptions={priorityOptions}
        typeOptions={typeOptions}
        userOptions={userOptions}
        selectedLabelIds={u.selectedLabelIds}
        onLabelToggle={u.toggleLabel}
        onSubmit={u.onEditSubmit}
        actionError={u.actionError}
        isPending={u.isPending}
        currentUserId={currentUserId}
      />

      {/* ── Label management dialog ─────────────────────────────────── */}
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
