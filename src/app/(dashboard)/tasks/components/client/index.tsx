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
import { formatClock, formatJalaliShort } from "@/lib/life";

// UI components
import { PageHeader } from "../ui/page-header";
import { SearchFilters } from "../ui/search-filters";
import { TasksTable } from "../ui/tasks-table";
import dynamic from "next/dynamic";
import { GetTasksResult, STATUS_OPTIONS } from "@/features/tasks/types";
import { GlobalError } from "@/components/ui-kit/global";

const CreateTaskDrawer = dynamic(
  () => import("../ui/create-task-drawer").then(m => m.CreateTaskDrawer),
);
const EditTaskDrawer = dynamic(
  () => import("../ui/edit-task-drawer").then(m => m.EditTaskDrawer),
);
const LabelManagementDialog = dynamic(
  () =>
    import("../ui/label-management-dialog").then(m => m.LabelManagementDialog),
);
const DeleteConfirmationDialog = dynamic(
  () =>
    import("../ui/delete-confirmation-dialog").then(
      m => m.DeleteConfirmationDialog,
    ),
);

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
    area: string;
    label: string;
    sort: string;
    order: string;
    group: string;
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

  const statusOptions = withEmptyOption(
    STATUS_OPTIONS.map(o => ({
      value: o.value,
      label: t.tasks[o.labelKey as keyof typeof t.tasks] as string,
    })),
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
    filters.area ||
    filters.label ||
    filters.search
  );

  const dateLocale = language === "EN" ? "en-US" : "fa-IR";

  function formatDate(
    date: Date | null,
    durationMinutes?: number | null,
  ): string {
    if (!date) return "—";
    const value = new Date(date);
    // Compact single-line label: short day + optional clock/range
    const day =
      language === "FA"
        ? formatJalaliShort(value, "FA")
        : value.toLocaleDateString(dateLocale, {
            month: "short",
            day: "numeric",
          });
    const clock = formatClock(value, language, durationMinutes);
    return clock ? `${day} ${clock}` : day;
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
        projects={userProjects}
        labels={labels}
        language={language === "EN" ? "EN" : "FA"}
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
        onClearFilters={() => {
          u.setProject("");
          u.applyFilters({
            search: "",
            status: "",
            priority: "",
            assignee: "",
            project: "",
            area: "",
            label: "",
          });
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
        filters={{ sort: filters.sort, order: filters.order, group: filters.group }}
        language={language === "EN" ? "EN" : "FA"}
        hasActiveFilters={hasActiveFilters}
        onSortChange={u.changeSort}
        onRowClick={u.openEdit}
        onEdit={u.openEdit}
        onDelete={u.setDeleteTarget}
        onClearFilters={() => {
          u.setSearch("");
          u.setProject("");
          u.applyFilters({
            search: "",
            status: "",
            priority: "",
            assignee: "",
            project: "",
            area: "",
            label: "",
          });
        }}
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