import * as React from "react";
import { Controller } from "react-hook-form";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Select } from "@/components/ui-kit/forms/select";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { LabelPicker } from "./label-picker";
import type { SelectOption } from "@/components/ui-kit/forms/select";
import type { UserRow } from "@/features/users/types";
import type { ProjectRow } from "@/features/projects/types";

interface CreateTaskDrawerProps {
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
  projects: ProjectRow[];
  labels: import("@/features/labels/types").LabelRow[];
  statusOptions: SelectOption[];
  priorityOptions: SelectOption[];
  typeOptions: SelectOption[];
  userOptions: { value: string; label: string }[];
  projectOptions: { value: string; label: string }[];
  selectedLabelIds: string[];
  onLabelToggle: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  actionError: string | null;
  isPending: boolean;
  currentUserId: string;
  currentUserRole: string;
}

export function CreateTaskDrawer({
  isOpen,
  onClose,
  form,
  t,
  users,
  projects,
  labels,
  statusOptions,
  priorityOptions,
  typeOptions,
  userOptions,
  projectOptions,
  selectedLabelIds,
  onLabelToggle,
  onSubmit,
  actionError,
  isPending,
  currentUserId,
  currentUserRole,
}: CreateTaskDrawerProps) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const isAdmin = currentUserRole === "ADMIN";

  // For non-admin users, auto-set assignee to current user
  React.useEffect(() => {
    if (!isAdmin && currentUserId) {
      form.setValue("assignedToId", currentUserId);
    }
  }, [isAdmin, currentUserId, form]);

  // Filter assignees based on selected project
  const filteredUserOptions = React.useMemo(() => {
    if (!selectedProjectId) return userOptions;
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return userOptions;
    // Filter users to only those who are members of the selected project
    // We'll need to check project members - for now, we'll rely on the parent component
    // to pass pre-filtered options, but we can also filter here if we have member data
    return userOptions;
  }, [selectedProjectId, projects, userOptions]);

  const handleProjectChange = (value: string) => {
    setSelectedProjectId(value);
    form.setValue("projectId", value);
    // Trigger assignee options update - parent component should handle this
    // by passing updated userOptions based on selected project
  };

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      wide
      header={
        <span className="text-sm font-semibold text-text-primary">
          {t.createTask}
        </span>
      }
      footer={
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            {t.cancel}
          </Button>
          <Button
            variant="primary"
            loading={isPending}
            type="submit"
            form="create-task-form"
          >
            {t.createTask}
          </Button>
        </div>
      }
    >
      <form
        id="create-task-form"
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
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Input
              {...field}
              label={t.taskTitle}
              placeholder={t.titlePlaceholder}
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
              label={t.description}
              placeholder={t.descriptionPlaceholder}
              error={fieldState.error?.message}
            />
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <Controller
            name="projectId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Select
                {...field}
                label={t.project}
                options={projectOptions}
                onChange={handleProjectChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            name="status"
            control={form.control}
            render={({ field, fieldState }) => (
              <Select
                {...field}
                label={t.status}
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
                label={t.priority}
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
                label={t.type}
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
                label={t.assignee}
                options={filteredUserOptions}
                error={fieldState.error?.message}
                disabled={!isAdmin}
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
                  label={t.dueDate}
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
          title={t.labels}
          addLabel={t.addLabel}
        />
      </form>
    </Drawer>
  );
}
