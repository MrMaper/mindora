import * as React from "react";
import { Controller } from "react-hook-form";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Select } from "@/components/ui-kit/forms/select";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { LabelPicker } from "./label-picker";
import { Avatar } from "@/components/ui-kit/data-display/avatar";
import { TaskComments } from "@/components/tasks/task-comments";
import type { UserRow } from "@/features/users/types";
import type { TaskRow, TaskActivityEntry } from "@/features/tasks/types";
import { activityLabel } from "@/features/tasks/types";

interface EditTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    control: ReturnType<typeof import("react-hook-form").useForm>["control"];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formState: { errors: Record<string, any> };
    handleSubmit: (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fn: (data: any) => void,
    ) => (e: React.BaseSyntheticEvent) => void;
    isPending?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    watch: (name: string) => any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue: (name: string, value: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  users: UserRow[];
  labels: import("@/features/labels/types").LabelRow[];
  activeTask: (TaskRow & { activity: TaskActivityEntry[] }) | null;
  isLoadingDetail: boolean;
  statusOptions: import("@/components/ui-kit/forms/select").SelectOption[];
  priorityOptions: import("@/components/ui-kit/forms/select").SelectOption[];
  typeOptions: import("@/components/ui-kit/forms/select").SelectOption[];
  userOptions: { value: string; label: string }[];
  selectedLabelIds: string[];
  onLabelToggle: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  actionError: string | null;
  isPending: boolean;
  currentUserId: string;
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
  currentUserId,
}: EditTaskDrawerProps) {
  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      wide
      header={
        <span className="text-sm font-semibold text-text-primary">
          {t.tasks.editTask}
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
        onSubmit={form.handleSubmit(onSubmit)}
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
              control={form.control}
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
              control={form.control}
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
                control={form.control}
                render={({ field, fieldState }) => (
                  <Select
                    {...field}
                    label={t.tasks.status}
                    options={statusOptions}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="priority"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Select
                    {...field}
                    label={t.tasks.priority}
                    options={priorityOptions}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Select
                    {...field}
                    label={t.tasks.type}
                    options={typeOptions}
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                name="assignedToId"
                control={form.control}
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
                control={form.control}
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
                  {activeTask.activity.map(entry => (
                    <div key={entry.id} className="flex items-start gap-2">
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
