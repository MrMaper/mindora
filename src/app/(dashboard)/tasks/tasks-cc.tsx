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
  filters: { search: string; status: string; priority: string; assignee: string; sort: string; order: string };
  page: number;
  language: Language;
  currentUserId: string;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" });
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

export function TasksCC({ initialData, users, labels, filters, page, language, currentUserId }: TasksCCProps) {
  void currentUserId;
  const u = useTasks(filters);
  const t = getTranslations(language);
  const { tasks, total, totalPages } = initialData;

  const userOptions = [
    { value: "", label: t.tasks.unassigned },
    ...users.map(usr => ({ value: usr.id, label: usr.name })),
  ];
  const statusFieldOptions = STATUS_OPTIONS.map(o => ({ value: o.value, label: t.tasks[o.labelKey as keyof typeof t.tasks] as string }));
  const priorityFieldOptions = PRIORITY_OPTIONS.map(o => ({ value: o.value, label: t.tasks[o.labelKey as keyof typeof t.tasks] as string }));
  const typeFieldOptions = TYPE_OPTIONS.map(o => ({ value: o.value, label: t.tasks[o.labelKey as keyof typeof t.tasks] as string }));

  const hasActiveFilters = !!(filters.status || filters.priority || filters.assignee || filters.search);

  return (
    <>
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "var(--space-5)",
        }}
      >
        <div>
          <h1 style={{ fontSize: "var(--text-xl)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>
            {t.tasks.title}
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", marginTop: 2 }}>
            {total} {t.tasks.totalTasks}
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button variant="secondary" icon="flag" onClick={u.onLabelDialogOpen}>
            {t.tasks.manageLabels}
          </Button>
          <Button variant="primary" icon="plus" onClick={u.openCreate}>
            {t.tasks.createTaskButton}
          </Button>
        </div>
      </div>

      {/* ── Search + filters ────────────────────────────────────────── */}
      <div style={{ marginBottom: "var(--space-4)", display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
        <form onSubmit={u.onSearchSubmit} style={{ display: "flex", gap: "var(--space-2)" }}>
          <Input
            placeholder={t.tasks.search}
            icon="search"
            value={u.search}
            onChange={e => u.setSearch(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <Button type="submit" variant="secondary">
            {t.tasks.searchButton}
          </Button>
        </form>

        <Select
          value={filters.status}
          onChange={e => u.applyFilters({ status: e.target.value })}
          style={{ maxWidth: 160 }}
          options={[{ value: "", label: t.tasks.allStatuses }, ...statusFieldOptions]}
        />
        <Select
          value={filters.priority}
          onChange={e => u.applyFilters({ priority: e.target.value })}
          style={{ maxWidth: 160 }}
          options={[{ value: "", label: t.tasks.allPriorities }, ...priorityFieldOptions]}
        />
        <Select
          value={filters.assignee}
          onChange={e => u.applyFilters({ assignee: e.target.value })}
          style={{ maxWidth: 180 }}
          options={[{ value: "", label: t.tasks.allAssignees }, ...users.map(usr => ({ value: usr.id, label: usr.name }))]}
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            icon="x"
            onClick={() => {
              u.setSearch("");
              u.applyFilters({ search: "", status: "", priority: "", assignee: "" });
            }}
          >
            {t.tasks.clearFilters}
          </Button>
        )}
      </div>

      {/* ── Global error ─────────────────────────────────────────────── */}
      {u.actionError && u.drawerMode === "none" && (
        <div className="auth-card__alert auth-card__alert--error" style={{ marginBottom: "var(--space-4)" }} role="alert">
          {u.actionError}
        </div>
      )}

      {/* ── Tasks table ──────────────────────────────────────────────── */}
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-card)", overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 130px 90px 160px 110px 40px",
            gap: "var(--space-3)",
            padding: "0 var(--space-4)",
            height: 36,
            alignItems: "center",
            borderBottom: "1px solid var(--border-subtle)",
            background: "var(--bg-sunken)",
          }}
        >
          {[
            { key: "title", label: t.tasks.taskColumn },
            { key: "status", label: t.tasks.statusColumn },
            { key: "priority", label: t.tasks.priorityColumn },
            { key: "assignee", label: t.tasks.assigneeColumn, sortable: false },
            { key: "dueDate", label: t.tasks.dueDateColumn },
            { key: "", label: "", sortable: false },
          ].map(col => (
            <span
              key={col.key || "actions"}
              role={col.sortable === false ? undefined : "button"}
              onClick={col.sortable === false || !col.key ? undefined : () => u.changeSort(col.key)}
              style={{
                fontSize: "var(--text-2xs)",
                fontWeight: "var(--weight-semibold)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-caps)",
                color: "var(--text-tertiary)",
                cursor: col.sortable === false || !col.key ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              {col.label}
              {filters.sort === col.key && (
                <Icon name={filters.order === "asc" ? "chevron-up" : "chevron-down"} size={11} />
              )}
            </span>
          ))}
        </div>

        {tasks.length === 0 ? (
          <div style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
            {t.tasks.noResults}
          </div>
        ) : (
          tasks.map(task => (
            <div
              key={task.id}
              onClick={() => u.openEdit(task)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 130px 90px 160px 110px 40px",
                gap: "var(--space-3)",
                padding: "0 var(--space-4)",
                minHeight: "var(--row-height)",
                alignItems: "center",
                borderBottom: "1px solid var(--border-subtle)",
                cursor: "pointer",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--weight-medium)",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {task.title}
                </div>
                {task.labels.length > 0 && (
                  <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                    {task.labels.map(l => (
                      <Tag key={l.id} color={l.color}>{l.name}</Tag>
                    ))}
                  </div>
                )}
              </div>

              <StatusBadge status={statusToDisplay(task.status)} />

              <PriorityIcon priority={priorityToDisplay(task.priority)} />

              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
                {task.assignedTo ? (
                  <>
                    <Avatar name={task.assignedTo.name} src={task.assignedTo.avatar ?? undefined} size="sm" />
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {task.assignedTo.name}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{t.tasks.unassigned}</span>
                )}
              </div>

              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{formatDate(task.dueDate)}</span>

              <span onClick={e => e.stopPropagation()}>
                <Menu
                  trigger={<IconButton icon="more-horizontal" aria-label={t.tasks.taskActionsLabel} size="sm" />}
                  align="end"
                  items={[
                    { label: t.common.edit, icon: "pencil", onClick: () => u.openEdit(task) },
                    { divider: true },
                    { label: t.common.delete, icon: "trash", danger: true, onClick: () => u.setDeleteTarget(task) },
                  ]}
                />
              </span>
            </div>
          ))
        )}
      </div>

      {/* ── Pagination ───────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "var(--space-4)" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
            {t.users.page} {page} {t.users.of} {totalPages}
          </span>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button
              variant="secondary"
              size="sm"
              icon="chevron-left"
              disabled={page <= 1}
              onClick={() => {
                const p = new URLSearchParams({ ...filters, page: String(page - 1) });
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
                const p = new URLSearchParams({ ...filters, page: String(page + 1) });
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
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>
            {t.tasks.createTask}
          </span>
        }
        footer={
          <div style={{ display: "flex", gap: "var(--space-2)", marginLeft: "auto" }}>
            <Button variant="ghost" onClick={u.closeDrawer} disabled={u.isPending}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" loading={u.isPending} onClick={u.onCreateSubmit}>
              {t.tasks.createTask}
            </Button>
          </div>
        }
      >
        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {u.actionError && (
            <div className="auth-card__alert auth-card__alert--error" role="alert">
              {u.actionError}
            </div>
          )}
          <Controller
            name="title"
            control={u.createForm.control}
            render={({ field, fieldState }) => (
              <Input {...field} label={t.tasks.taskTitle} placeholder={t.tasks.titlePlaceholder} error={fieldState.error?.message} />
            )}
          />
          <Controller
            name="description"
            control={u.createForm.control}
            render={({ field, fieldState }) => (
              <Textarea {...field} label={t.tasks.description} placeholder={t.tasks.descriptionPlaceholder} error={fieldState.error?.message} />
            )}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <Controller
              name="status"
              control={u.createForm.control}
              render={({ field, fieldState }) => (
                <Select {...field} label={t.tasks.status} options={statusFieldOptions} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="priority"
              control={u.createForm.control}
              render={({ field, fieldState }) => (
                <Select {...field} label={t.tasks.priority} options={priorityFieldOptions} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="type"
              control={u.createForm.control}
              render={({ field, fieldState }) => (
                <Select {...field} label={t.tasks.type} options={typeFieldOptions} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="assignedToId"
              control={u.createForm.control}
              render={({ field, fieldState }) => (
                <Select {...field} label={t.tasks.assignee} options={userOptions} error={fieldState.error?.message} />
              )}
            />
            <Controller
              name="dueDate"
              control={u.createForm.control}
              render={({ field, fieldState }) => (
                <Input {...field} type="date" label={t.tasks.dueDate} error={fieldState.error?.message} />
              )}
            />
          </div>

          <LabelPicker labels={labels} selected={u.selectedLabelIds} onToggle={u.toggleLabel} title={t.tasks.labels} addLabel={t.tasks.addLabel} />
        </div>
      </Drawer>

      {/* ── Edit task drawer ────────────────────────────────────────── */}
      <Drawer
        open={u.drawerMode === "edit"}
        onClose={u.closeDrawer}
        wide
        header={
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-primary)" }}>
            {t.tasks.editTask}
          </span>
        }
        footer={
          <div style={{ display: "flex", gap: "var(--space-2)", marginLeft: "auto" }}>
            <Button variant="ghost" onClick={u.closeDrawer} disabled={u.isPending}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" loading={u.isPending} onClick={u.onEditSubmit} disabled={u.isLoadingDetail}>
              {t.tasks.saveChanges}
            </Button>
          </div>
        }
      >
        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {u.actionError && (
            <div className="auth-card__alert auth-card__alert--error" role="alert">
              {u.actionError}
            </div>
          )}

          {u.isLoadingDetail ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-sm)" }}>
              {t.common.loading}
            </div>
          ) : (
            <>
              <Controller
                name="title"
                control={u.editForm.control}
                render={({ field, fieldState }) => (
                  <Input {...field} label={t.tasks.taskTitle} error={fieldState.error?.message} />
                )}
              />
              <Controller
                name="description"
                control={u.editForm.control}
                render={({ field, fieldState }) => (
                  <Textarea {...field} label={t.tasks.description} error={fieldState.error?.message} />
                )}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <Controller
                  name="status"
                  control={u.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select {...field} label={t.tasks.status} options={statusFieldOptions} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  name="priority"
                  control={u.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select {...field} label={t.tasks.priority} options={priorityFieldOptions} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  name="type"
                  control={u.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select {...field} label={t.tasks.type} options={typeFieldOptions} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  name="assignedToId"
                  control={u.editForm.control}
                  render={({ field, fieldState }) => (
                    <Select {...field} label={t.tasks.assignee} options={userOptions} error={fieldState.error?.message} />
                  )}
                />
                <Controller
                  name="dueDate"
                  control={u.editForm.control}
                  render={({ field, fieldState }) => (
                    <Input {...field} type="date" label={t.tasks.dueDate} error={fieldState.error?.message} />
                  )}
                />
              </div>

              <LabelPicker labels={labels} selected={u.selectedLabelIds} onToggle={u.toggleLabel} title={t.tasks.labels} addLabel={t.tasks.addLabel} />

              {/* ── Activity history ──────────────────────────────── */}
              <div>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", marginBottom: "var(--space-2)" }}>
                  {t.tasks.activity}
                </div>
                {!u.activeTask || u.activeTask.activity.length === 0 ? (
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{t.tasks.noActivity}</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    {u.activeTask.activity.map(entry => (
                      <div key={entry.id} style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)" }}>
                        <Avatar name={entry.performedBy.name} src={entry.performedBy.avatar ?? undefined} size="sm" />
                        <div>
                          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                            <strong>{entry.performedBy.name}</strong> {activityLabel(t, entry.action)}
                          </div>
                          <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
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

      {/* ── Label management dialog ─────────────────────────────────── */}
      <Dialog open={u.labelDialogOpen} onClose={() => u.setLabelDialogOpen(false)} title={t.tasks.manageLabels}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {u.labelError && (
            <div className="auth-card__alert auth-card__alert--error" role="alert">
              {u.labelError}
            </div>
          )}

          <form
            onSubmit={u.onCreateLabelSubmit}
            style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end" }}
          >
            <Controller
              name="name"
              control={u.labelForm.control}
              render={({ field, fieldState }) => (
                <Input {...field} label={t.tasks.labelName} error={fieldState.error?.message} style={{ flex: 1 }} />
              )}
            />
            <Controller
              name="color"
              control={u.labelForm.control}
              render={({ field, fieldState }) => (
                <Input {...field} type="color" label={t.tasks.labelColor} error={fieldState.error?.message} style={{ width: 56, padding: 2 }} />
              )}
            />
            <Button type="submit" variant="primary" loading={u.isPending}>
              {t.tasks.createLabel}
            </Button>
          </form>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {labels.length === 0 ? (
              <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{t.tasks.noLabels}</div>
            ) : (
              labels.map(l => (
                <div key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-control)" }}>
                  <Tag color={l.color}>{l.name}</Tag>
                  <IconButton icon="trash" aria-label={t.common.delete} size="sm" onClick={() => u.onDeleteLabel(l.id)} />
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
            <Button variant="ghost" onClick={() => u.setDeleteTarget(null)} disabled={u.isPending}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" loading={u.isPending} onClick={u.onDeleteConfirm}>
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
      <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", marginBottom: "var(--space-2)" }}>
        {title}
      </div>
      {labels.length === 0 ? (
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{addLabel}</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
          {labels.map(l => {
            const active = selected.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => onToggle(l.id)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  opacity: active ? 1 : 0.45,
                }}
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
