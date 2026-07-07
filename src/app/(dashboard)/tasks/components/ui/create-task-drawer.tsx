"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Select } from "@/components/ui-kit/forms/select";
import type { SelectOption } from "@/components/ui-kit/forms/select";
import type { UserRow } from "@/features/users/types";
import type { Translations } from "@/i18n";
import { LabelPicker } from "./label-picker";

interface CreateTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  form: {
    control: ReturnType<typeof import("react-hook-form").useForm>["control"];
    formState: { errors: Record<string, any> };
    handleSubmit: (fn: (data: any) => void) => (e: React.BaseSyntheticEvent) => void;
    isPending: boolean;
  };
  t: Translations["tasks"];
  users: import("@/features/users/types").UserRow[];
  labels: import("@/features/labels/types").LabelRow[];
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  typeOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[];
  selectedLabelIds: string[];
  onLabelToggle: (id: string) => void;
  onSubmit: (data: any) => void;
  actionError: string | null;
  isPending: boolean;
}

export function CreateTaskDrawer({
  isOpen,
  onClose,
  form,
  t,
  users,
  labels,
  statusOptions,
  priorityOptions,
  typeOptions,
  userOptions,
  selectedLabelIds,
  onLabelToggle,
  onSubmit,
  actionError,
  isPending,
}: CreateTaskDrawerProps) {
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
            {t.common.cancel}
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
      <form id="create-task-form" onSubmit={form.handleSubmit(onSubmit)} className="p-4 flex flex-col gap-4">
        {actionError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm" role="alert">
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
            value={form.watch.watch("type")}
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
              <Input
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
      </form>
    </Drawer>
  );
}