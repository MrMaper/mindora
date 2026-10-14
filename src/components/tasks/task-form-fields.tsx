"use client";

import * as React from "react";
import { Controller, useWatch } from "react-hook-form";
import type { Control, UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui-kit/forms/input";
import { Textarea } from "@/components/ui-kit/forms/textarea";
import { Select } from "@/components/ui-kit/forms/select";
import type { SelectOption } from "@/components/ui-kit/forms/select";
import { DatePicker } from "@/components/ui-kit/forms/date-picker";
import { Checkbox } from "@/components/ui-kit/forms/checkbox";
import {
  DURATION_PRESETS,
  formatDurationLabel,
} from "@/components/ui-kit/forms/time-roller";
import { LabelPicker } from "@/app/(dashboard)/tasks/components/ui/label-picker";
import { useTranslation } from "@/i18n/provider";
import { hasDueTime } from "@/lib/life";
import {
  isAreaBucketId,
  projectPickerLabel,
} from "@/lib/project-namespace";
import {
  useActiveMemberAreas,
  useAreaHelpers,
} from "@/components/member-areas-provider";
import { areaDisplayName } from "@/lib/areas";
import type { AreaRef } from "@/lib/areas";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/provider";
import type { CreateTaskInput } from "@/schemas/tasks";
import type { LabelRow } from "@/features/labels/types";
import type { ProjectRow } from "@/features/projects/types";

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
  /** True when editing a task that already belongs to a recurrence series. */
  hasRecurrenceSeries?: boolean;
  /** Lock the path picker (research hub scoped create). */
  lockProject?: boolean;
}

function lockedHubForPreset(
  preset: TaskFormPreset,
): "research" | "language" | null {
  if (preset === "research") return "research";
  if (preset === "language") return "language";
  return null;
}

function refMatchesProject(ref: AreaRef, p: ProjectRow): boolean {
  return p.areaId === ref.id || p.id === ref.bucketProjectId;
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
  hasRecurrenceSeries = false,
  lockProject = false,
}: TaskFormFieldsProps) {
  const t = useTranslation();
  const language = useLanguage();
  const { bucketFor, defaultAreaId } = useAreaHelpers();
  const memberAreas = useActiveMemberAreas();
  const isAdmin = currentUserRole === "ADMIN";
  const lockedHub = lockedHubForPreset(preset);
  const labelsEnabled =
    showLabels ?? (preset === "life" || preset === "language");
  const [moreOpen, setMoreOpen] = React.useState(false);

  const watchedAreaId = useWatch({ control, name: "areaId" });
  const watchedProjectId = useWatch({ control, name: "projectId" });
  const watchedDueDate = useWatch({ control, name: "dueDate" });
  const watchedDuration = useWatch({ control, name: "durationMinutes" });
  const watchedRecurrence = useWatch({ control, name: "recurrence" });
  const recurrenceActive =
    !!watchedRecurrence && watchedRecurrence !== "NONE";

  React.useEffect(() => {
    if (recurrenceActive) return;
    setValue("recurrenceEndsAt", "");
    setValue("applyRecurrenceToSeries", "");
  }, [recurrenceActive, setValue]);

  const dueDateValue = watchedDueDate ? new Date(watchedDueDate as string) : null;
  const durationValue = watchedDuration
    ? Number(watchedDuration)
    : null;
  const showDuration =
    !!dueDateValue &&
    !Number.isNaN(dueDateValue.getTime()) &&
    hasDueTime(
      dueDateValue,
      Number.isFinite(durationValue) && (durationValue as number) > 0
        ? (durationValue as number)
        : null,
    );

  const pickerAreas = React.useMemo(() => {
    if (lockedHub) {
      const hub = memberAreas.find(a => a.hubFor === lockedHub);
      return hub ? [hub] : [];
    }
    return memberAreas;
  }, [memberAreas, lockedHub]);

  const currentProjectId = (watchedProjectId as string | undefined) ?? "";
  const currentAreaId = (watchedAreaId as string | undefined) || defaultAreaId;

  const activeRef = React.useMemo(() => {
    if (currentProjectId) {
      const byBucket = pickerAreas.find(
        a => a.bucketProjectId === currentProjectId,
      );
      if (byBucket) return byBucket;
      const proj = projects.find(p => p.id === currentProjectId);
      if (proj?.areaId) {
        const byId = pickerAreas.find(a => a.id === proj.areaId);
        if (byId) return byId;
      }
    }
    const byArea = pickerAreas.find(a => a.id === currentAreaId);
    if (byArea) return byArea;
    return pickerAreas.find(a => a.isDefault) ?? pickerAreas[0] ?? null;
  }, [pickerAreas, currentProjectId, projects, currentAreaId]);

  const projectOptions = React.useMemo(() => {
    const filtered = activeRef
      ? projects.filter(p => refMatchesProject(activeRef, p))
      : projects.filter(p => p.areaId === currentAreaId);

    const bucketId = activeRef?.bucketProjectId ?? bucketFor(currentAreaId);

    const opts: SelectOption[] = filtered.map(p => ({
      value: p.id,
      label: isAreaBucketId(p.id)
        ? preset === "research"
          ? t.life.researchProjectInbox
          : projectPickerLabel(p, language === "EN" ? "EN" : "FA")
        : p.name,
    }));

    if (bucketId && !opts.some(o => o.value === bucketId)) {
      opts.unshift({
        value: bucketId,
        label:
          preset === "research"
            ? t.life.researchProjectInbox
            : activeRef
              ? areaDisplayName(activeRef, language === "EN" ? "EN" : "FA")
              : t.dashboard.areaLife,
      });
    } else if (bucketId) {
      opts.sort((a, b) => {
        if (a.value === bucketId) return -1;
        if (b.value === bucketId) return 1;
        return a.label.localeCompare(b.label, "fa");
      });
    }

    return opts;
  }, [
    projects,
    activeRef,
    currentAreaId,
    preset,
    t,
    bucketFor,
    language,
  ]);

  function handleAreaChange(ref: AreaRef) {
    if (lockedHub) return;
    setValue("areaId", ref.id, { shouldValidate: true });
    setValue("projectId", ref.bucketProjectId, { shouldValidate: true });
  }

  function handleProjectChange(value: string) {
    setValue("projectId", value, { shouldValidate: true });
    const project = projects.find(p => p.id === value);
    if (project?.areaId) {
      const ref = memberAreas.find(a => a.id === project.areaId);
      if (ref) {
        setValue("areaId", ref.id, { shouldValidate: true });
        return;
      }
    }
    if (isAreaBucketId(value)) {
      const ref = memberAreas.find(a => a.bucketProjectId === value);
      if (ref) setValue("areaId", ref.id, { shouldValidate: true });
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

  const areaChips =
    pickerAreas.length > 0
      ? pickerAreas
      : null;

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
          {areaChips
            ? areaChips.map(ref => (
                <button
                  key={ref.id}
                  type="button"
                  disabled={!!lockedHub}
                  onClick={() => handleAreaChange(ref)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                    activeRef?.id === ref.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "text-muted-foreground hover:bg-accent",
                    lockedHub && "opacity-90 cursor-default",
                  )}
                >
                  {areaDisplayName(ref, language === "EN" ? "EN" : "FA")}
                </button>
              ))
            : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 [&>*]:min-w-0">
        <Controller
          name="projectId"
          control={control}
          render={({ field, fieldState }) => (
            <Select
              value={
                field.value ||
                activeRef?.bucketProjectId ||
                bucketFor(currentAreaId)
              }
              onChange={handleProjectChange}
              label={t.tasks.pathOrProject}
              options={projectSelectOptions}
              error={fieldState.error?.message}
              disabled={lockProject}
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
            const durationMins = watchedDuration
              ? Number(watchedDuration)
              : null;
            return (
              <DatePicker
                value={value}
                onChange={date => {
                  field.onChange(date ? date.toISOString() : "");
                  if (!date) setValue("durationMinutes", "");
                }}
                onTimeEnabledChange={enabled => {
                  if (!enabled) setValue("durationMinutes", "");
                }}
                mode="single"
                language={language}
                label={t.tasks.dueDate}
                placeholder={t.tasks.dueDatePlaceholder}
                hint={t.tasks.dueDateHint}
                timeOptional
                durationMinutes={
                  durationMins && durationMins > 0 ? durationMins : null
                }
                error={fieldState.error?.message}
              />
            );
          }}
        />
        <Controller
          name="waitingOn"
          control={control}
          render={({ field }) => (
            <div className="col-span-2 flex flex-col gap-1 rounded-lg border border-dashed px-3 py-2">
              <Checkbox
                checked={field.value === "1" || field.value === "true"}
                onChange={checked => field.onChange(checked ? "1" : "")}
                label={t.tasks.waitingOn}
              />
              <p className="text-[11px] text-muted-foreground leading-snug ps-6">
                {t.tasks.waitingOnHint}
              </p>
            </div>
          )}
        />
        {showDuration ? (
          <Controller
            name="durationMinutes"
            control={control}
            render={({ field }) => {
              const current = field.value ? Number(field.value) : 0;
              const presetMatch = DURATION_PRESETS.some(
                p => p.minutes === current,
              );
              return (
                <div className="col-span-2 flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">
                    {t.tasks.duration}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => field.onChange("")}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs transition-colors",
                        !current
                          ? "border-primary bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {t.tasks.durationNone}
                    </button>
                    {current > 0 && !presetMatch ? (
                      <button
                        type="button"
                        className="rounded-md border border-primary bg-primary/10 px-2 py-1 text-xs text-primary"
                        aria-pressed
                      >
                        {formatDurationLabel(
                          current,
                          language === "EN" ? "EN" : "FA",
                        )}
                      </button>
                    ) : null}
                    {DURATION_PRESETS.map(presetItem => (
                      <button
                        key={presetItem.minutes}
                        type="button"
                        onClick={() =>
                          field.onChange(String(presetItem.minutes))
                        }
                        className={cn(
                          "rounded-md border px-2 py-1 text-xs transition-colors",
                          current === presetItem.minutes
                            ? "border-primary bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {formatDurationLabel(
                          presetItem.minutes,
                          language === "EN" ? "EN" : "FA",
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }}
          />
        ) : null}
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
                hint={
                  recurrenceActive ? undefined : t.recurrenceUi.endsAtDisabled
                }
                disabled={!recurrenceActive}
                error={fieldState.error?.message}
              />
            );
          }}
        />
        {recurrenceActive ? (
          <p className="col-span-2 -mt-1 text-[11px] leading-snug text-muted-foreground">
            {t.recurrenceUi.howItWorks}
          </p>
        ) : null}
        {hasRecurrenceSeries && recurrenceActive ? (
          <Controller
            name="applyRecurrenceToSeries"
            control={control}
            render={({ field }) => (
              <div className="col-span-2 flex flex-col gap-1 rounded-lg border border-dashed px-3 py-2">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value === "1" || field.value === "true"}
                    onChange={e => field.onChange(e.target.checked ? "1" : "")}
                  />
                  {t.recurrenceUi.applySeries}
                </label>
                <p className="ps-6 text-[11px] leading-snug text-muted-foreground">
                  {t.recurrenceUi.applySeriesHint}
                </p>
              </div>
            )}
          />
        ) : null}
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
