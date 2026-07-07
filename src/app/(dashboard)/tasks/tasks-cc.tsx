"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { Button } from "@/components/ui-kit/forms/button";
import { IconButton } from "@/components/ui-kit/forms/icon-button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { Tag } from "@/components/ui-kit/data-display/tag";
import { StatusBadge } from "@/components/ui-kit/agile/status-badge";
import { PriorityIcon } from "@/components/ui-kit/agile/priority-icon";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Dialog } from "@/components/ui-kit/overlays/dialog";
import { Menu } from "@/components/ui-kit/overlays/menu";
import { TaskComments } from "@/components/tasks/task-comments";
import { useTasks } from "./use-tasks";
import { getTranslations } from "@/i18n";
import {
  statusToDisplay,
  priorityToDisplay,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  TYPE_OPTIONS,
} from "@/features/tasks/types";
import type { GetTasksResult } from "@/features/tasks/types";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";
import type { Language } from "@/types/db";
import type { Translations } from "@/i18n";

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

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function activityLabel(t: Translations, action: string): string {
  switch (action) {
    case "created":
      return t.tasks.activityCreated;
    case "status_changed":
      return t.tasks.activityStatusChanged;
    case "assigned":
      return t.tasks.activityAssigned;
    case "commented":
      return t.tasks.activityCommented;
    case "attachment_added":
      return t.tasks.activityAttachment;
    default:
      return t.tasks.activityUpdated;
  }
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
    filters.status ||
    filters.priority ||
    filters.assignee ||
    filters.search
  );

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {t.tasks.title}
          </h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            {total} {t.tasks.totalTasks}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon="flag" onClick={u.onLabelDialogOpen}>
            {t.tasks.manageLabels}
          </Button>
          <Button variant="primary" icon="plus" onClick={u.openCreate}>
            {t.tasks.createTaskButton}
          </Button>
        </div>
      </div>

      {/* ── Search + filters ────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2 items-center">
          <form onSubmit={u.onSearchSubmit} className="flex gap-1">
            <Input
              placeholder={t.tasks.search}
              icon="search"
              value={u.search}
              onChange={e => u.setSearch(e.target.value)}
              className="max-w-[280px]"
            />
            <Button type="submit" variant="secondary">
              {t.tasks.searchButton}
            </Button>
          </form>

          <Select
            value={filters.status}
            onChange={value => u.applyFilters({ status: value })}
            className="max-w-[160px]"
            options={[
              { value: "", label: t.tasks.allStatuses },
              ...statusFieldOptions,
            ]}
          />
          <Select
            value={filters.priority}
            onChange={value => u.applyFilters({ priority: value })}
            className="max-w-[160px]"
            options={[
              { value: "", label: t.tasks.allPriorities },
              ...priorityFieldOptions,
            ]}
          />
          <Select
            value={filters.assignee}
            onChange={value => u.applyFilters({ assignee: value })}
            className="max-w-[180px]"
            options={[
              { value: "", label: t.tasks.allAssignees },
              ...users.map(usr => ({ value: usr.id, label: usr.name })),
            ]}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            icon="x"
            onClick={() => {
              u.setSearch("");
              u.applyFilters({
                search: "",
                status: "",
                priority: "",
                assignee: "",
              });
            }}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            {t.tasks.clearFilters}
          </Button>
        )}
      </div>

      {/* ── Global error ─────────────────────────────────────────────── */}
      {u.actionError && u.drawerMode === "none" && (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm" role="alert">
          {u.actionError}
        </div>
      )}

      {/* ── Tasks table ──────────────────────────────────────────────── */}
      <div className="rounded-lg border border-border-default bg-bg-surface overflow-hidden">
        <div className="grid gap-3 border-b border-border-subtle bg-bg-sunken px-4 h-9 items-center">
          {[
            { key: "title", label: t.tasks.taskColumn, sortable: true },
            { key: "status", label: t.tasks.statusColumn, sortable: true },
            { key: "priority", label: t.tasks.priorityColumn, sortable: true },
            { key: "assignee", label: t.tasks.assigneeColumn, sortable: false },
            { key: "dueDate", label: t.tasks.dueDateColumn, sortable: true },
            { key: "", label: "", sortable: false },
          ].map(col => (
            <span
              key={col.key || "actions"}
              role={col.sortable === false ? undefined : "button"}
              onClick={
                col.sortable === false || !col.key
                  ? undefined
                  : () => u.changeSort(col.key)
              }
              className="text-2xs font-semibold uppercase tracking-caps text-text-tertiary flex items-center gap-1 cursor-pointer hover:text-text-secondary"
              style={{
                cursor: col.sortable === false || !col.key ? "default" : "pointer",
              }}
            >
              {col.label}
              {filters.sort === col.key && (
                <Icon
                  name={filters.order === "asc" ? "chevron-up" : "chevron-down"}
                  size={11}
                />
              )}
            </span>
          ))}
        </div>

        {tasks.length === 0 ? (
          <div className="p-10 text-center text-text-tertiary text-sm">
            {t.tasks.noResults}
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              onClick={() => u.openEdit(task)}
              className="grid gap-3 px-4 min-h-[52px] items-center border-b border-border-subtle hover:bg-bg-sunken/50 cursor-pointer"
              style={{
                gridTemplateColumns: "1fr 130px 90px 160px 110px 40px",
              }}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {task.title}
                </div>
                {task.labels.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {task.labels.map(l => (
                      <Tag key={l.id} color={l.color}>
                        {l.name}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>

              <StatusBadge status={statusToDisplay(task.status)} />

              <PriorityIcon priority={priorityToDisplay(task.priority)} />

              <div className="flex items-center gap-2 min-w-0">
                {task.assignedTo ? (
                  <>
                    <Avatar
                      name={task.assignedTo.name}
                      src={task.assignedTo.avatar ?? undefined}
                      size="sm"
                    />
                    <span className="text-xs text-text-secondary truncate">
                      {task.assignedTo.name}
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-text-tertiary">
                    {t.tasks.unassigned}
                  </span>
                )}
              </div>

              <span className="text-xs text-text-tertiary">
                {formatDate(task.dueDate)}
              </span>

              <span onClick={e => e.stopPropagation()}>
                <Menu
                  trigger={
                    <IconButton
                      icon="more-horizontal"
                      aria-label={t.tasks.taskActionsLabel}
                      size="sm"
                    />
                  }
                  align="end"
                  items={[
                    {
                      label: t.common.edit,
                      icon: "pencil",
                      onClick: () => u.openEdit(task),
                    },
                    { divider: true },
                    {
                      label: t.common.delete,
                      icon: "trash",
                      danger: true,
                      onClick: () => u.setDeleteTarget(task),
                    },
                  ]}
                />
              </span>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-text-tertiary">
            {t.users.page} {page} {t.users.of} {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon="chevron-left"
              disabled={page <= 1}
              onClick={() => {
                const p = new URLSearchParams({
                  ...filters,
                  page: String(page - 1),
                });
                window.location.href = `/tasks?${p.toString()}`;
              }}
            >
              {t.users.previous}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              iconRight="chevron-right"
              disabled={page >= totalPages}
              onClick={() => {
                const p = new URLSearchParams({
                  ...filters,
                  page: String(page + 1),
                });
                window.location.href = `/tasks?${p.toString()}`;
              }}
            >
              {t.users.next}
            </Button>
          </div>
        </div>
      )}

      {/* ── Create task drawer ──────────────────────────────────────── */}
      <Drawer
        open={u.drawerMode === "create"}
        onClose={u.closeDrawer}
        wide
        header={
          <span className="text-sm font-semibold text-text-primary">
            {t.tasks.createTask}
          </span>
        }
        footer={
          <div className="flex gap-2 ml-auto">
            <Button variant="ghost" onClick={u.closeDrawer} disabled={u.isPending}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              loading={u.isPending}
              onClick={u.onCreateSubmit}
            >
              {t.tasks.createTask}
            </Button>
          </div>
        }
      >
        <div className="p-4 flex flex-col gap-4">
          {u.actionError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm" role="alert">
              {u.actionError}
            </div>
          )}
          <Controller
            name="title"
            control={u.createForm.control}
            render={({ field, fieldState }) => (
              <Input
                {...field}
                label={t.tasks.taskTitle}
                placeholder={t.tasks.titlePlaceholder}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="description"
            control={u.createForm.control}
            render={({ field, fieldState }) => (
              <Textarea
                {...field}
                label={t.tasks.description}
                placeholder={t.tasks.descriptionPlaceholder}
                error={fieldState.error?.message}
              />
            )}
          />
          <div className="grid grid-cols-2 gap-3">
            <Controller
              name="status"
              control={u.createForm.control}
              render={({ field, fieldState }) => (
                <Select
                  {...field}
                  label={t.tasks.status}
                  options={statusFieldOptions}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="priority"
              control={u.createForm.control}
              render={({ field, fieldState }) => (
                <Select
                  {...field}
                  label={t.tasks.priority}
                  options={priorityFieldOptions}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="type"
              control={u.createForm.control}
              render={({ field, fieldState }) => (
                <Select
                  {...field}
                  label={t.tasks.type}
                  options={typeFieldOptions}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="assignedToId"
              control={u.createForm.control}
              render={({ field, fieldState }) => (
                <Select
                  {...field}
                  label={t.tasks.assignee}
                  options={userOptions}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="dueDate"
              control={u.createForm.control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  type="date"
                  label={t.tasks.dueDate}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <LabelPicker
            labels={labels}
            selected={u.selectedLabelIds}
            onToggle={u.toggleLabel}
            title={t.tasks.labels}
            addLabel={t.tasks.addLabel}
          />
        </div>
      </Drawer>

      {/* ── Edit task drawer ────────────────────────────────────────── */}
      <Drawer
        open={u.drawerMode === "edit"}
        onClose={u.closeDrawer}
        wide
        header={
          <span className="text-sm font-semibold text-text-primary">
            {t.tasks.editTask}
          </span>
        }
        footer={
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              onClick={u.closeDrawer}
              disabled={u.isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              loading={u.isPending}
              onClick={u.onEditSubmit}
              disabled={u.isLoadingDetail}
            >
              {t.tasks.saveChanges}
            </Button>
          </div>
        }
      >
        <div className="p-4 flex flex-col gap-4">
          {u.actionError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm" role="alert">
              {u.actionError}
            </div>
          )}

          {u.isLoadingDetail ? (
            <div className="p-8 text-center text-text-tertiary text-sm">
              {t.common.loading}
            </div>
          ) : (
            <>
              <Controller
                name="title"
                control={u.editForm.control}
                render={({ field, fieldState }) => (
                  <Input
                    {...field}
                    label={t.tasks.taskTitle}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="description"
                control={u.editForm.control}
                render={({ field, fieldState }) => (
                  <Textarea
                    {...field}
                    label={t.tasks.description}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <Controller
                  name="status"
                  control={u.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select
                      {...field}
                      label={t.tasks.status}
                      options={statusFieldOptions}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="priority"
                  control={u.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select
                      {...field}
                      label={t.tasks.priority}
                      options={priorityFieldOptions}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="type"
                  control={u.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select
                      {...field}
                      label={t.tasks.type}
                      options={typeFieldOptions}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="assignedToId"
                  control={u.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select
                      {...field}
                      label={t.tasks.assignee}
                      options={userOptions}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <Controller
                  name="dueDate"
                  control={u.editForm.control}
                  render={({ field, fieldState }) => (
                    <Input
                      {...field}
                      type="date"
                      label={t.tasks.dueDate}
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>

              <LabelPicker
                labels={labels}
                selected={u.selectedLabelIds}
                onToggle={u.toggleLabel}
                title={t.tasks.labels}
                addLabel={t.tasks.addLabel}
              />

              {/* ── Activity history ──────────────────────────────── */}
              <div>
                <div className="text-2xs font-semibold uppercase tracking-caps text-text-tertiary mb-2">
                  {t.tasks.activity}
                </div>
                {!u.activeTask || u.activeTask.activity.length === 0 ? (
                  <div className="text-sm text-text-tertiary">
                    {t.tasks.noActivity}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {u.activeTask.activity.map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-2"
                      >
                        <Avatar
                          name={entry.performedBy.name}
                          src={entry.performedBy.avatar ?? undefined}
                          size="sm"
                        />
                        <div>
                          <div className="text-sm text-text-primary">
                            <strong>{entry.performedBy.name}</strong>{" "}
                            {activityLabel(t, entry.action)}
                          </div>
                          <div className="text-2xs text-text-tertiary">
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Comments & attachments ──────────────────────────── */}
              {u.activeTask && (
                <TaskComments
                  taskId={u.activeTask.id}
                  currentUserId={currentUserId}
                  users={users}
                  language={language}
                />
              )}
            </>
          )}
        </div>
      </Drawer>

      {/* ── Label management dialog ─────────────────────────────────── */}
      <Dialog
        open={u.labelDialogOpen}
        onClose={() => u.setLabelDialogOpen(false)}
        title={t.tasks.manageLabels}
      >
        <div className="flex flex-col gap-4">
          {u.labelError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm" role="alert">
              {u.labelError}
            </div>
          )}

          <form
            onSubmit={u.onCreateLabelSubmit}
            className="flex gap-2 items-end"
          >
            <Controller
              name="name"
              control={u.labelForm.control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  label={t.tasks.labelName}
                  error={fieldState.error?.message}
                  className="flex-1"
                />
              )}
            />
            <Controller
              name="color"
              control={u.labelForm.control}
              render={({ field, fieldState }) => (
                <Input
                  {...field}
                  type="color"
                  label={t.tasks.labelColor}
                  error={fieldState.error?.message}
                  className="w-[56px] p-[2px]"
                />
              )}
            />
            <Button type="submit" variant="primary" loading={u.isPending}>
              {t.tasks.createLabel}
            </Button>
          </form>

          <div className="flex flex-col gap-2">
            {labels.length === 0 ? (
              <div className="text-sm text-text-tertiary">
                {t.tasks.noLabels}
              </div>
            ) : (
              labels.map(l => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-2 border border-border-subtle rounded-[var(--radius-control)]"
                >
                  <Tag color={l.color}>{l.name}</Tag>
                  <IconButton
                    icon="trash"
                    aria-label={t.common.delete}
                    size="sm"
                    onClick={() => u.onDeleteLabel(l.id)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </Dialog>

      {/* ── Delete confirmation dialog ───────────────────────────────── */}
      <Dialog
        open={!!u.deleteTarget}
        onClose={() => u.setDeleteTarget(null)}
        title={t.tasks.deleteTask}
        description={`${t.tasks.deleteConfirmPrefix} ${u.deleteTarget?.title} ${t.tasks.deleteConfirmSuffix}`}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => u.setDeleteTarget(null)}
              disabled={u.isPending}
            >
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              loading={u.isPending}
              onClick={u.onDeleteConfirm}
            >
              {t.tasks.deleteTask}
            </Button>
          </>
        }
      />
    </>
  );
}

function LabelPicker({
  labels,
  selected,
  onToggle,
  title,
  addLabel,
}: {
  labels: LabelRow[];
  selected: string[];
  onToggle: (id: string) => void;
  title: string;
  addLabel: string;
}) {
  return (
    <div>
      <div className="text-2xs font-semibold uppercase tracking-caps text-text-tertiary mb-2">
        {title}
      </div>
      {labels.length === 0 ? (
        <div className="text-sm text-text-tertiary">
          {addLabel}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {labels.map(l => {
            const active = selected.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onToggle(l.id)}
                className="opacity-45 hover:opacity-100 transition-opacity"
                style={{ opacity: active ? 1 : 0.45 }}
              >
                <Tag color={l.color}>{l.name}</Tag>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
