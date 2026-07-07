"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Select } from "@/components/ui-kit/forms/select";
import { LabelPicker } from "./label-picker";
import type { SelectOption } from "@/components/ui-kit/forms/select";
import type { UserRow } from "@/features/users/types";
import type { Translations } from "@/i18n";
import type { TaskRow } from "@/features/tasks/types";

interface EditTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    control: ReturnType<typeof import("react-hook-form").useForm>["control"];
    formState: { errors: Record<string, any> };
    handleSubmit: (fn: (data: any) => void) => (e: React.BaseSyntheticEvent) => void;
    isPending: boolean;
    watch: (name: string) => any;
    setValue: (name: string, value: any) => void;
  };
  t: Translations["tasks"];
  users: UserRow[];
  labels: import("@/features/labels/types").LabelRow[];
  activeTask: TaskRow | null;
  isLoadingDetail: boolean;
  statusOptions: SelectOption[];
  priorityOptions: SelectOption[];
  typeOptions: SelectOption[];
  userOptions: { value: string; label: string }[];
  selectedLabelIds: string[];
  onLabelToggle: (id: string) => void;
  onSubmit: (data: any) => void;
  actionError: string | null;
  isPending: boolean;
}

export function EditTaskDrawer({
  isOpen,
  onClose,
  form,
  t,
  users,
  labels,
  activeTask,
  isLoadingDetail,
  statusOptions,
  priorityOptions,
  typeOptions,
  userOptions,
  selectedLabelIds,
  onLabelToggle,
  onSubmit,
  actionError,
  isPending,
}: EditTaskDrawerProps) {
  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      wide
      header={
        <span className="text-sm font-semibold text-text-primary">
          {t.editTask}
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
            {t.saveChanges}
          </Button>
        </div>
      }
    >
      <form id="edit-task-form" onSubmit={form.handleSubmit(onSubmit)} className="p-4 flex flex-col gap-4">
        {actionError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm" role="alert">
            {actionError}
          </div>
        )}

        {isLoadingDetail ? (
          <div className="p-8 text-center text-text-tertiary text-sm">
            Loading...
          </div>
        ) : (
          <>
            <Controller
              name="title"
              control={form.control}
              render={({ field, fieldState }) => (
                <input
                  {...field}
                  type="text"
                  label={t.taskTitle}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <textarea
                  {...field}
                  label={t.description}
                  error={fieldState.error?.message}
                />
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label={t.status}
                options={statusOptions}
                value={form.watch("status")}
                onChange={(value) => form.setValue("status", value)}
                error={form.formState.errors.status?.message}
              />
              <Select
                label={t.priority}
                options={priorityOptions}
                value={form.watch("priority")}
                onChange={(value) => form.setValue("priority", value)}
                error={form.formState.errors.priority?.message}
              />
              <Select
                label={t.type}
                options={typeOptions}
                value={form.watch("type")}
                onChange={(value) => form.setValue("type", value)}
                error={form.formState.errors.type?.message}
              />
              <Select
                label={t.assignee}
                options={userOptions}
                value={form.watch("assignedToId")}
                onChange={(value) => form.setValue("assignedToId", value)}
                error={form.formState.errors.assignedToId?.message}
              />
              <Controller
                name="dueDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <input
                    {...field}
                    type="date"
                    label={t.dueDate}
                    error={fieldState.error?.message}
                  />
                )}
              />
            </div>

            <LabelPicker
              labels={labels}
              selected={selectedLabelIds}
              onToggle={onLabelToggle}
              title={t.labels}
              addLabel={t.addLabel}
            />

            {/* ── Activity history ──────────────────────────────── */}
            <div>
              <div className="text-2xs font-semibold uppercase tracking-caps text-text-tertiary mb-2">
                {t.activity}
              </div>
              {!activeTask || activeTask.activity.length === 0 ? (
                <div className="text-sm text-text-tertiary">
                  {t.noActivity}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {activeTask.activity.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2">
                      <img
                        src={entry.performedBy.avatar ?? undefined}
                        alt={entry.performedBy.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div>
                        <div className="text-sm text-text-primary">
                          <strong>{entry.performedBy.name}</strong>{" "}
                          changed status
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
            {activeTask && (
              <div className="border-t pt-4">
                <h3 className="font-medium mb-2">Comments & Attachments</h3>
                <p className="text-sm text-text-tertiary">TaskComments component here</p>
              </div>
            )}
          </>
        )}
      </form>
    </Drawer>
  );
}