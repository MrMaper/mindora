"use client";

import * as React from "react";
import type { Control, UseFormSetValue } from "react-hook-form";
import { Drawer } from "@/components/ui-kit/overlays/drawer";
import { ResolvedValidationText } from "@/components/ui-kit/forms/action-error";
import { Button } from "@/components/ui-kit/forms/button";
import {
  TaskFormFields,
  type TaskFormPreset,
} from "@/components/tasks/task-form-fields";
import type { SelectOption } from "@/components/ui-kit/forms/select";
import type { CreateTaskInput } from "@/schemas/tasks";
import type { ProjectRow } from "@/features/projects/types";
import type { LabelRow } from "@/features/labels/types";
import { useTranslation } from "@/i18n/provider";

interface CreateTaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  control: Control<CreateTaskInput>;
  setValue: UseFormSetValue<CreateTaskInput>;
  projects: ProjectRow[];
  labels: LabelRow[];
  statusOptions: SelectOption[];
  priorityOptions: SelectOption[];
  userOptions: { value: string; label: string }[];
  selectedLabelIds: string[];
  onLabelToggle: (id: string) => void;
  onSubmit: (e: React.BaseSyntheticEvent) => void;
  actionError: string | null;
  isPending: boolean;
  currentUserId: string;
  currentUserRole: string;
  preset?: TaskFormPreset;
}

export function CreateTaskDrawer({
  isOpen,
  onClose,
  control,
  setValue,
  projects,
  labels,
  statusOptions,
  priorityOptions,
  userOptions,
  selectedLabelIds,
  onLabelToggle,
  onSubmit,
  actionError,
  isPending,
  currentUserId,
  currentUserRole,
  preset = "life",
}: CreateTaskDrawerProps) {
  const t = useTranslation();
  const isAdmin = currentUserRole === "ADMIN";

  React.useEffect(() => {
    if (!isOpen) return;
    if (!isAdmin && currentUserId) {
      setValue("assignedToId", currentUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when drawer opens
  }, [isOpen, isAdmin, currentUserId]);

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      wide
      header={
        <span className="text-sm font-semibold text-text-primary">
          {t.tasks.createTask}
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
            {t.tasks.createTask}
          </Button>
        </div>
      }
    >
      <form
        id="create-task-form"
        onSubmit={onSubmit}
        className="py-4 flex flex-col gap-4"
      >
        {actionError && (
          <div
            className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-red-500 text-sm"
            role="alert"
          >
            <ResolvedValidationText text={actionError} />
          </div>
        )}
        {isOpen && (
          <TaskFormFields
            control={control}
            setValue={setValue}
            preset={preset}
            projects={projects}
            statusOptions={statusOptions}
            priorityOptions={priorityOptions}
            userOptions={userOptions}
            labels={labels}
            selectedLabelIds={selectedLabelIds}
            onLabelToggle={onLabelToggle}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            showLabels={preset !== "research"}
          />
        )}
      </form>
    </Drawer>
  );
}
