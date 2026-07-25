"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { useTranslation } from "@/i18n/provider";
import type { ProjectTaskRow } from "@/features/projects/types";

export interface ProjectTaskFilters {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  sort: string;
  order: string;
}

export interface ProjectTaskFiltersComponentProps {
  filters: ProjectTaskFilters;
  search: string;
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  assigneeOptions: { value: string; label: string }[];
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onFiltersChange: (filter: Partial<ProjectTaskFilters>) => void;
  onClearFilters: (filter?: Partial<ProjectTaskFilters>) => void;
  hasActiveFilters: boolean;
}

export function ProjectTaskFiltersComponent({
  filters,
  search,
  statusOptions,
  priorityOptions,
  assigneeOptions,
  onSearchChange,
  onSearchSubmit,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
}: ProjectTaskFiltersComponentProps) {
  const t = useTranslation();

  return (
    <div className="mb-4 flex flex-wrap gap-2 justify-between items-end">
      <div className="flex gap-2 items-center w-fit">
        <form
          onSubmit={onSearchSubmit}
          className="flex gap-1 w-full max-w-60 items-end"
        >
          <Input
            label={t.projects.searchButton}
            placeholder={t.projects.search}
            icon="search"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-bg-surface"
            button={
              <Button
                variant="primary"
                size="sm"
                iconRight="search"
                onClick={onSearchSubmit}
              />
            }
          />
        </form>

        <div className="w-40">
          <Select
            label={t.tasks.status}
            value={filters.status}
            onChange={value => onFiltersChange({ ...filters, status: value })}
            options={statusOptions}
          />
        </div>
        {/* <div className="w-40">
          <Select
            label={t.tasks.priority}
            value={filters.priority}
            onChange={value => onFiltersChange({ ...filters, priority: value })}
            options={priorityOptions}
          />
        </div>
        <div className="w-40">
          <Select
            label={t.tasks.assignee}
            value={filters.assignee}
            onChange={value => onFiltersChange({ ...filters, assignee: value })}
            options={assigneeOptions}
          />
        </div> */}
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          icon="x"
          onClick={() => {
            onClearFilters({
              search: "",
              status: "",
              priority: "",
              assignee: "",
            });
          }}
          className="text-red-500! hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          {t.tasks.clearFilters}
        </Button>
      )}
    </div>
  );
}

export function getProjectTaskStatusOptions(
  t: ReturnType<typeof useTranslation>,
) {
  return [
    { value: "", label: t.tasks.allStatuses },
    ...[
      "BACKLOG",
      "TODO",
      "IN_PROGRESS",
      "REVIEW",
      "TESTING",
      "DONE",
      "BLOCKED",
    ].map(s => ({
      value: s,
      label: getTaskStatusLabel(t, s),
    })),
  ];
}

export function getProjectTaskPriorityOptions(
  t: ReturnType<typeof useTranslation>,
) {
  return [
    { value: "", label: t.tasks.allPriorities },
    ...["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"].map(p => ({
      value: p,
      label: getTaskPriorityLabel(t, p),
    })),
  ];
}

export function getProjectTaskAssigneeOptions(
  members: { userId: string; userName: string; userEmail: string }[],
  t: ReturnType<typeof useTranslation>,
) {
  return [
    { value: "", label: t.tasks.allAssignees },
    ...members.map(m => ({
      value: m.userId,
      label: `${m.userName} (${m.userEmail})`,
    })),
  ];
}

export function getProjectTaskDefaultFilters(): ProjectTaskFilters {
  return {
    search: "",
    status: "",
    priority: "",
    assignee: "",
    sort: "createdAt",
    order: "desc",
  };
}

export function hasActiveProjectTaskFilters(
  filters: ProjectTaskFilters,
): boolean {
  return (
    filters.search !== "" ||
    filters.status !== "" ||
    filters.priority !== "" ||
    filters.assignee !== ""
  );
}

export function filterProjectTasks(
  tasks: ProjectTaskRow[],
  filters: ProjectTaskFilters,
) {
  return tasks.filter(task => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!task.title.toLowerCase().includes(search)) return false;
    }
    if (filters.status && task.status !== filters.status) return false;
    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.assignee && task.assignee?.id !== filters.assignee)
      return false;
    return true;
  });
}

export function sortProjectTasks(
  tasks: ProjectTaskRow[],
  sort: string,
  order: string,
): ProjectTaskRow[] {
  return [...tasks].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sort) {
      case "title":
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
        break;
      case "updatedAt":
        aVal = new Date(a.updatedAt).getTime();
        bVal = new Date(b.updatedAt).getTime();
        break;
      case "createdAt":
      default:
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
        break;
    }

    if (aVal < bVal) return order === "asc" ? -1 : 1;
    if (aVal > bVal) return order === "asc" ? 1 : -1;
    return 0;
  });
}

function getTaskStatusLabel(
  t: ReturnType<typeof useTranslation>,
  status: string,
): string {
  const statusMap: Record<string, keyof typeof t.tasks> = {
    BACKLOG: "backlog",
    TODO: "todo",
    IN_PROGRESS: "inProgress",
    REVIEW: "review",
    TESTING: "testing",
    DONE: "done",
    BLOCKED: "blocked",
  };
  const key = statusMap[status];
  return key ? t.tasks[key] : status;
}

function getTaskPriorityLabel(
  t: ReturnType<typeof useTranslation>,
  priority: string,
): string {
  const priorityMap: Record<string, keyof typeof t.tasks> = {
    URGENT: "urgent",
    HIGH: "high",
    MEDIUM: "medium",
    LOW: "low",
    NONE: "none",
  };
  const key = priorityMap[priority];
  return key ? t.tasks[key] : priority;
}

export { ProjectTaskFiltersComponent as ProjectTaskFilters };
