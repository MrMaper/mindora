"use client";

import * as React from "react";
import { Controller, useWatch } from "react-hook-form";
import type { Control, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Select } from "@/components/ui-kit/forms/select";
import type { SelectOption } from "@/components/ui-kit/forms/select";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { LabelPicker } from "@/app/(dashboard)/tasks/components/ui/label-picker";
import { useTranslation } from "@/i18n/provider";
import {
  AREA_PROJECT_IDS,
  LIFE_AREAS,
  coerceLifeArea,
} from "@/lib/life";
import { isAreaBucketId, projectPickerLabel } from "@/lib/project-namespace";
import { cn } from "@/lib/utils";
import type { CreateTaskInput } from "@/schemas/tasks";
import type { LabelRow } from "@/features/labels/types";
import type { ProjectRow } from "@/features/projects/types";
import type { LifeArea } from "@/types/db";

export type TaskFormPreset = "life" | "research" | "language";

type TaskFormValues = CreateTaskInput;

export interface TaskFormFieldsProps {
  control: Control<TaskFormValues>;
  setValue: UseFormSetValue<TaskFormValues>;
  preset: TaskFormPreset;
  projects: ProjectRow[];
  statusOptions: SelectOption[];
  priorityOptions: SelectOption[];
  userOptions: SelectOption[];
  labels: LabelRow[];
  selectedLabelIds: string[];
  onLabelToggle: (id: string) => void;
  currentUserId: string;
  currentUserRole: string;
  showLabels?: boolean;
}

function areaLabel(
  area: LifeArea,
  t: ReturnType<typeof useTranslation>,
  projects: ProjectRow[],
): string {
  const bucketId = AREA_PROJECT_IDS[area];
  const bucket = projects.find(p => p.id === bucketId);
  if (bucket?.name?.trim()) return bucket.name.trim();
  if (area === "PHD") return t.dashboard.areaPhd;
  if (area === "WORK") return t.dashboard.areaWork;
  if (area === "LANG") return t.dashboard.areaLang;
  return t.dashboard.areaLife;
}

function lockedAreaForPreset(preset: TaskFormPreset): LifeArea | null {
  if (preset === "research") return "PHD";
  if (preset === "language") return "LANG";
  return null;
}

export function TaskFormFields({
  control,
  setValue,
  preset,
  projects,
  statusOptions,
  priorityOptions,
  userOptions,
  labels,
  selectedLabelIds,
  onLabelToggle,
  currentUserId,
  currentUserRole,
  showLabels,
}: TaskFormFieldsProps) {
  const t = useTranslation();
  const isAdmin = currentUserRole === "ADMIN";
  const lockedArea = lockedAreaForPreset(preset);
  const labelsEnabled =
    showLabels ?? (preset === "life" || preset === "language");
  const [moreOpen, setMoreOpen] = React.useState(false);

  const watchedArea = useWatch({ control, name: "area" });
  const watchedProjectId = useWatch({ control, name: "projectId" });

  const currentArea = coerceLifeArea(
    (watchedArea as string | undefined) ?? lockedArea ?? "LIFE",
  );
  const currentProjectId = (watchedProjectId as string | undefined) ?? "";

  const projectOptions = React.useMemo(() => {
    const filtered = projects.filter(p => {
      const area = coerceLifeArea(p.area);
      if (preset === "research") return area === "PHD";
      if (preset === "language") return area === "LANG";
      return area === currentArea;
    });

    const bucketId = AREA_PROJECT_IDS[currentArea];
    const opts: SelectOption[] = filtered.map(p => ({
      value: p.id,
      label: isAreaBucketId(p.id)
        ? preset === "research"
          ? t.life.researchProjectInbox
          : projectPickerLabel(p, "FA")
        : p.name,
    }));

    if (!opts.some(o => o.value === bucketId)) {
      opts.unshift({
        value: bucketId,
        label:
          preset === "research"
            ? t.life.researchProjectInbox
            : areaLabel(currentArea, t, projects),
      });
    } else {
      opts.sort((a, b) => {
        if (a.value === bucketId) return -1;
        if (b.value === bucketId) return 1;
        return a.label.localeCompare(b.label, "fa");
      });
    }

    return opts;
  }, [projects, currentArea, preset, t]);

  function handleAreaChange(area: LifeArea) {
    if (lockedArea) return;
    setValue("area", area, { shouldValidate: true });
    setValue("projectId", AREA_PROJECT_IDS[area], { shouldValidate: true });
  }

  function handleProjectChange(value: string) {
    setValue("projectId", value, { shouldValidate: true });
    const project = projects.find(p => p.id === value);
    if (project?.area) {
      setValue("area", coerceLifeArea(project.area), { shouldValidate: true });
    } else if (isAreaBucketId(value)) {
      const entry = Object.entries(AREA_PROJECT_IDS).find(
        ([, id]) => id === value,
      );
      if (entry) {
        setValue("area", entry[0] as LifeArea, { shouldValidate: true });
      }
    }
  }

  const projectSelectOptions = React.useMemo(() => {
    if (
      currentProjectId &&
      !projectOptions.some(o => o.value === currentProjectId)
    ) {
      const orphan = projects.find(p => p.id === currentProjectId);
      return [
        ...projectOptions,
        {
          value: currentProjectId,
          label: orphan?.name ?? currentProjectId,
        },
      ];
    }
    return projectOptions;
  }, [projectOptions, currentProjectId, projects]);

  const recurrenceOptions: SelectOption[] = [
    { value: "NONE", label: t.dashboard.recurrenceNone },
    { value: "DAILY", label: t.dashboard.recurrenceDaily },
    { value: "WEEKLY", label: t.dashboard.recurrenceWeekly },
    { value: "MONTHLY", label: t.dashboard.recurrenceMonthly },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Controller
        name="title"
        control={control}
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
        control={control}
        render={({ field, fieldState }) => (
          <Textarea
            {...field}
            label={t.tasks.description}
            placeholder={t.tasks.descriptionPlaceholder}
            error={fieldState.error?.message}
          />
        )}
      />

      <div>
        <div className="text-2xs font-semibold uppercase tracking-caps text-text-tertiary mb-2">
          {t.tasks.area}
        </div>
        <div className="flex flex-wrap gap-2">
          {(lockedArea ? [lockedArea] : LIFE_AREAS).map(area => (
            <button
              key={area}
              type="button"
              disabled={!!lockedArea}
              onClick={() => handleAreaChange(area)}
              className={cn(
                "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                currentArea === area
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground hover:bg-accent",
                lockedArea && "opacity-90 cursor-default",
              )}
            >
              {areaLabel(area, t, projects)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Controller
          name="projectId"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              value={field.value || AREA_PROJECT_IDS[currentArea]}
              onChange={handleProjectChange}
              label={t.tasks.pathOrProject}
              options={projectSelectOptions}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="status"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              value={field.value ?? "BACKLOG"}
              onChange={field.onChange}
              label={t.tasks.status}
              options={statusOptions}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="priority"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              value={field.value ?? "NONE"}
              onChange={field.onChange}
              label={t.tasks.priority}
              options={priorityOptions}
              error={fieldState.error?.message}
            />
          )}
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
        <Controller
          name="recurrence"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              value={field.value ?? "NONE"}
              onChange={field.onChange}
              label={t.tasks.recurrence}
              options={recurrenceOptions}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="recurrenceEndsAt"
          control={control}
          render={({ field, fieldState }) => {
            const value = field.value ? new Date(field.value) : null;
            return (
              <DatePicker
                value={value && !Number.isNaN(value.getTime()) ? value : null}
                onChange={date => {
                  if (!date) {
                    field.onChange("");
                    return;
                  }
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, "0");
                  const d = String(date.getDate()).padStart(2, "0");
                  field.onChange(`${y}-${m}-${d}`);
                }}
                mode="single"
                label={t.recurrenceUi.endsAt}
                error={fieldState.error?.message}
              />
            );
          }}
        />
        <Controller
          name="applyRecurrenceToSeries"
          control={control}
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm self-end pb-2">
              <input
                type="checkbox"
                checked={field.value === "1" || field.value === "true"}
                onChange={e => field.onChange(e.target.checked ? "1" : "")}
              />
              {t.recurrenceUi.applySeries}
            </label>
          )}
        />
        {isAdmin && (
          <Controller
            name="assignedToId"
            control={control}
            render={({ field, fieldState }) => (
              <Select
                value={field.value || currentUserId}
                onChange={field.onChange}
                label={t.tasks.assignee}
                options={userOptions.filter(o => o.value !== "")}
                error={fieldState.error?.message}
              />
            )}
          />
        )}
      </div>

      {labelsEnabled && (
        <div>
          <button
            type="button"
            onClick={() => setMoreOpen(v => !v)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {moreOpen ? t.tasks.hideMore : t.tasks.showMore}
          </button>
          {moreOpen && (
            <div className="mt-3">
              <LabelPicker
                labels={labels}
                selected={selectedLabelIds}
                onToggle={onLabelToggle}
                title={t.tasks.labels}
                addLabel={t.tasks.addLabel}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
