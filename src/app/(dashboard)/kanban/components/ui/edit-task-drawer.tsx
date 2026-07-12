"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Tag } from "@/components/ui-kit/data-display/tag";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { TaskComments } from "@/components/tasks/task-comments";
import { useTranslation } from "@/i18n/provider";
import type { UpdateTaskInput } from "@/schemas/tasks";
import type { TaskDetail } from "@/features/tasks/types";
import type { LabelRow } from "@/features/labels/types";
import type { UserRow } from "@/features/users/types";

interface EditTaskDrawerProps {
  open: boolean;
  onClose: () => void;
  isPending: boolean;
  isLoadingDetail: boolean;
  actionError: string | null;
  control: Control<UpdateTaskInput>;
  labels: LabelRow[];
  selectedLabelIds: string[];
  onLabelToggle: (id: string) => void;
  activeTask: TaskDetail | null;
  users: UserRow[];
  currentUserId: string;
  onSubmit: () => void;
  statusFieldOptions: { value: string; label: string }[];
  priorityFieldOptions: { value: string; label: string }[];
  typeFieldOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[];
}

function activityLabel(t: ReturnType<typeof useTranslation>, action: string): string {
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

export function EditTaskDrawer({
  open,
  onClose,
  isPending,
  isLoadingDetail,
  actionError,
  control,
  labels,
  selectedLabelIds,
  onLabelToggle,
  activeTask,
  users,
  currentUserId,
  onSubmit,
  statusFieldOptions,
  priorityFieldOptions,
  typeFieldOptions,
  userOptions,
}: EditTaskDrawerProps) {
  const t = useTranslation();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      header={
        <span
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: "var(--weight-semibold)",
            color: "var(--text-primary)",
          }}
        >
          {t.tasks.editTask}
        </span>
      }
      footer={
        <div
          style={{
            display: "flex",
            gap: "var(--space-2)",
            marginLeft: "auto",
          }}
        >
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
          >
            {t.common.cancel}
          </Button>
          <Button
            variant="primary"
            loading={isPending}
            onClick={onSubmit}
            disabled={isLoadingDetail}
          >
            {t.tasks.saveChanges}
          </Button>
        </div>
      }
    >
      <div
        style={{
          padding: "var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-4)",
        }}
      >
        {actionError && (
          <div
            className="auth-card__alert auth-card__alert--error"
            role="alert"
          >
            {actionError}
          </div>
        )}

        {isLoadingDetail ? (
          <div
            style={{
              padding: "var(--space-8)",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "var(--text-sm)",
            }}
          >
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "var(--space-3)",
              }}
            >
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
                control={control}
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

            <div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-semibold)",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-caps)",
                  marginBottom: "var(--space-2)",
                }}
              >
                {t.tasks.labels}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "var(--space-2)",
                }}
              >
                {labels.map(l => {
                  const active = selectedLabelIds.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => onLabelToggle(l.id)}
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
            </div>

            <div>
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  fontWeight: "var(--weight-semibold)",
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "var(--tracking-caps)",
                  marginBottom: "var(--space-2)",
                }}
              >
                {t.tasks.activity}
              </div>
              {!activeTask || activeTask.activity.length === 0 ? (
                <div
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  {t.tasks.noActivity}
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-3)",
                  }}
                >
                  {activeTask.activity.map(entry => (
                    <div
                      key={entry.id}
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <strong>{entry.performedBy.name}</strong>{" "}
                      {activityLabel(t, entry.action)}
                      <div
                        style={{
                          fontSize: "var(--text-2xs)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
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
      </div>
    </Drawer>
  );
}
