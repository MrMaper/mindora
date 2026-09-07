"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Select } from "@/components/ui-kit/forms/select";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { LabelPicker } from "./label-picker";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { TaskComments } from "@/components/tasks/task-comments";
import { Icon } from "@/components/ui-kit/foundation/icon";
import { useTranslation, useLanguage } from "@/i18n/provider";
import type { UpdateTaskInput } from "@/schemas/tasks";
import type { TaskDetail } from "@/features/tasks/types";
import type { LabelRow } from "@/features/labels/types";
import type { UserRow } from "@/features/users/types";
import type { ProjectRow } from "@/features/projects/types";
import { activityLabel } from "@/features/tasks/types";

interface EditTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  isLoadingDetail: boolean;
  actionError: string | null;
  control: Control<UpdateTaskInput>;
  setValue: (
    name: "projectId",
    value: string,
    options?: { shouldValidate?: boolean },
  ) => void;
  labels: LabelRow[];
  selectedLabelIds: string[];
  onLabelToggle: (id: string) => void;
  activeTask: TaskDetail | null;
  users: UserRow[];
  projects: ProjectRow[];
  currentUserId: string;
  currentUserRole: string;
  onSubmit: () => void;
  statusFieldOptions: { value: string; label: string }[];
  priorityFieldOptions: { value: string; label: string }[];
  typeFieldOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[];
  projectOptions: { value: string; label: string }[];
}

export function EditTaskDrawer({
  open,
  onClose,
  isPending,
  isLoadingDetail,
  actionError,
  control,
  setValue,
  labels,
  selectedLabelIds,
  onLabelToggle,
  activeTask,
  users,
  projects,
  currentUserId,
  currentUserRole,
  onSubmit,
  statusFieldOptions,
  priorityFieldOptions,
  typeFieldOptions,
  userOptions,
  projectOptions,
}: EditTaskDrawerProps) {
  const t = useTranslation();
  const language = useLanguage();
  const dateLocale = language === "EN" ? "en-US" : "fa-IR";

  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const initialProjectId = activeTask?.projectId ?? "";

  React.useEffect(() => {
    if (initialProjectId && selectedProjectId !== initialProjectId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  // Filter assignees based on selected project
  const filteredUserOptions = React.useMemo(() => {
    if (!selectedProjectId) return userOptions;
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return userOptions;
    return userOptions;
  }, [selectedProjectId, projects, userOptions]);

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    setValue("projectId", value, { shouldValidate: true });
  };

  const [expandedEntries, setExpandedEntries] = React.useState<Set<string>>(new Set());

  const toggleEntry = (entryId: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  const hasChanges = (entry: TaskDetail["activity"][0]) => {
    const oldVal = entry.oldValue as Record<string, unknown> | null;
    const newVal = entry.newValue as Record<string, unknown> | null;
    if (!oldVal && !newVal) return false;
    const fields = new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]);
    return Array.from(fields).some(field => oldVal?.[field] !== newVal?.[field]);
  };

  const getFieldLabel = (field: string) => {
    switch (field) {
      case "status":
        return t.tasks.activityFieldStatus;
      case "priority":
        return t.tasks.activityFieldPriority;
      case "assignedToId":
        return t.tasks.activityFieldAssignee;
      case "projectId":
        return t.tasks.activityFieldProject;
      case "title":
        return t.tasks.activityFieldTitle;
      case "description":
        return t.tasks.activityFieldDescription;
      case "type":
        return t.tasks.activityFieldType;
      case "dueDate":
        return t.tasks.activityFieldDueDate;
      case "labels":
        return t.tasks.activityFieldLabels;
      default:
        return field;
    }
  };

  const formatValue = (value: unknown, field: string): string => {
    if (value === null || value === undefined) return t.tasks.activityNoChanges;
    if (field === "dueDate" && value) {
      return new Date(value as string).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    if (field === "assignedToId" && value) {
      const user = users.find(u => u.id === value as string);
      return user?.name ?? String(value);
    }
    if (field === "projectId" && value) {
      const project = projects.find(p => p.id === value as string);
      return project?.name ?? String(value);
    }
    return String(value);
  };

  const renderChanges = (entry: TaskDetail["activity"][0]) => {
    const oldVal = entry.oldValue as Record<string, unknown> | null;
    const newVal = entry.newValue as Record<string, unknown> | null;
    if (!oldVal && !newVal) return null;

    const fields = new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]);
    const changes = Array.from(fields).map(field => {
      const oldFieldVal = oldVal?.[field];
      const newFieldVal = newVal?.[field];
      if (oldFieldVal === newFieldVal) return null;

      return (
        <div key={field} className="flex items-center gap-1.5 text-xs">
          <span className="font-medium text-text-secondary">{getFieldLabel(field)}</span>
          <span className="text-text-tertiary">{t.tasks.activityFrom}</span>
          <span className="text-text-secondary line-through">{formatValue(oldFieldVal, field)}</span>
          <span className="text-text-tertiary">{t.tasks.activityTo}</span>
          <span className="font-medium text-text-primary">{formatValue(newFieldVal, field)}</span>
        </div>
      );
    }).filter(Boolean);

    if (changes.length === 0) return null;

    return <div className="mt-2 ml-10 flex flex-col gap-1">{changes}</div>;
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      header={
        <span className="text-sm font-semibold text-text-primary">
          {activeTask?.title ?? "Edit Task"}
        </span>
      }
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            loading={isPending}
            type="submit"
            form="edit-task-form"
            disabled={isLoadingDetail}
          >
            {t.tasks.saveChanges}
          </Button>
        </div>
      }
    >
      <form
        id="edit-task-form"
        onSubmit={onSubmit}
        className="py-4 flex flex-col gap-4"
      >
        {actionError && (
          <div
            className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm"
            role="alert"
          >
            {actionError}
          </div>
        )}

        {isLoadingDetail ? (
          <div className="p-8 text-center text-text-tertiary text-sm">
            {t.common.loading}
          </div>
        ) : (
          <>
            <Controller
              name="title"
              control={control}
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
              control={control}
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
                name="projectId"
                control={control}
                render={({ field, fieldState }) => (
                  <Select
                    {...field}
                    label={t.tasks.project}
                    options={projectOptions}
                    onChange={handleProjectChange}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="status"
                control={control}
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
                control={control}
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
                control={control}
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
                control={control}
                render={({ field, fieldState }) => {
                  const isAdmin = currentUserRole === "ADMIN";
                  const assigneeValue = isAdmin ? field.value : currentUserId;
                  const assigneeOptions = isAdmin ? filteredUserOptions : filteredUserOptions.filter(o => o.value === currentUserId);

                  return (
                    <Select
                      {...field}
                      label={t.tasks.assignee}
                      options={assigneeOptions}
                      value={assigneeValue}
                      disabled={!isAdmin}
                      error={fieldState.error?.message}
                    />
                  );
                }}
              />
              <Controller
                name="dueDate"
                control={control}
                render={({ field, fieldState }) => {
                  const value = field.value ? new Date(field.value) : null;

                  return (
                    <DatePicker
                      value={value}
                      onChange={date => {
                        field.onChange(date ? date.toISOString() : "");
                      }}
                      mode="single"
                      label={t.tasks.dueDate}
                      error={fieldState.error?.message}
                    />
                  );
                }}
              />
            </div>

            <LabelPicker
              labels={labels}
              selected={selectedLabelIds}
              onToggle={onLabelToggle}
              title={t.tasks.labels}
              addLabel={t.tasks.addLabel}
            />

            {/* ── Activity history ──────────────────────────────── */}
            <div>
              <div className="text-2xs font-semibold uppercase tracking-caps text-text-tertiary mb-2">
                {t.tasks.activity}
              </div>
              {!activeTask || activeTask.activity.length === 0 ? (
                <div className="text-sm text-text-tertiary">
                  {t.tasks.noActivity}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                      {activeTask.activity.map(entry => {
                        const isExpanded = expandedEntries.has(entry.id);
                        const hasEntryChanges = hasChanges(entry);

                        return (
                          <div key={entry.id} className="flex items-start gap-2">
                            <Avatar
                              name={entry.performedBy.name}
                              src={entry.performedBy.avatar ?? undefined}
                              size="sm"
                            />
                            <div className="flex-1">
                              <div
                                className="text-sm text-text-primary flex items-center gap-1 cursor-pointer"
                                onClick={() => hasEntryChanges && toggleEntry(entry.id)}
                              >
                                <strong>{entry.performedBy.name}</strong>{" "}
                                {activityLabel(t, entry.action)}
                                {hasEntryChanges && (
                                  <Icon
                                    name={isExpanded ? "chevron-up" : "chevron-down"}
                                    size={16}
                                    className="text-text-tertiary transition-transform duration-200 ml-1"
                                  />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-text-secondary">
                                <span className="flex items-center gap-1.5">
                                  <Icon
                                    name="calendar"
                                    size={15}
                                    className="text-text-tertiary"
                                  />
                                  {new Date(entry.timestamp).toLocaleDateString(
                                    dateLocale,
                                    {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    },
                                  )}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Icon
                                    name="clock"
                                    size={15}
                                    className="text-text-tertiary"
                                  />
                                  {new Date(entry.timestamp).toLocaleTimeString(
                                    dateLocale,
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                              </div>
                              <div
                                className={`overflow-hidden transition-[max-height,opacity,transform] duration-200 ease-out ${
                                  isExpanded ? "max-h-96 opacity-100 translate-y-0" : "max-h-0 opacity-0 -translate-y-1"
                                }`}
                              >
                                {renderChanges(entry)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
              )}
            </div>

            {/* ── Comments & attachments ──────────────────────────── */}
            {activeTask && (
              <TaskComments
                taskId={activeTask.id}
                currentUserId={currentUserId}
                users={users}
              />
            )}
          </>
        )}
      </form>
    </Drawer>
  );
}
