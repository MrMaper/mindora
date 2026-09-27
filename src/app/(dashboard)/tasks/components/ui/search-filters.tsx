"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { AreaPathFilters } from "@/components/life/area-path-filters";
import type { ProjectRow } from "@/features/projects/types";
import type { LabelRow } from "@/features/labels/types";

interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  project: string;
  area: string;
  label: string;
  sort: string;
  order: string;
  group: string;
}

export interface SearchFiltersProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  filters: TaskFilters;
  search: string;
  projects: ProjectRow[];
  labels: LabelRow[];
  language: "FA" | "EN";
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[];
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onFiltersChange: (filter: Partial<TaskFilters>) => void;
  onClearFilters: (filter?: Partial<TaskFilters>) => void;
  hasActiveFilters: boolean;
  currentUserRole: string;
}

export function SearchFilters({
  t,
  filters,
  search,
  projects,
  labels,
  language,
  statusOptions,
  priorityOptions,
  userOptions,
  onSearchChange,
  onSearchSubmit,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  currentUserRole,
}: SearchFiltersProps) {
  const isAdmin = currentUserRole === "ADMIN";
  return (
    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:justify-between lg:items-end">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2 items-end w-full">
        <form
          onSubmit={onSearchSubmit}
          className="flex gap-1 w-full lg:max-w-60 items-end sm:col-span-2"
        >
          <Input
            label={t.searchButton}
            placeholder={t.search}
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

        <AreaPathFilters
          projects={projects}
          area={filters.area}
          project={filters.project}
          language={language}
          labels={{
            area: t.area,
            path: t.path,
            allAreas: t.allAreas,
            allPaths: t.allPaths,
          }}
          onChange={next => onFiltersChange(next)}
        />
        {labels.length > 0 && (
          <div className="w-full lg:w-40">
            <Select
              label={t.labels}
              value={filters.label}
              onChange={value => onFiltersChange({ label: value })}
              options={[
                { value: "", label: t.allLabels },
                ...labels.map(item => ({ value: item.id, label: item.name })),
              ]}
            />
          </div>
        )}
        <div className="w-full lg:w-40">
          <Select
            label={t.status}
            value={filters.status}
            onChange={value => onFiltersChange({ ...filters, status: value })}
            options={statusOptions}
          />
        </div>
        <div className="w-full lg:w-40">
          <Select
            label={t.priority}
            value={filters.priority}
            onChange={value => onFiltersChange({ ...filters, priority: value })}
            options={priorityOptions}
          />
        </div>
        <div className="w-full lg:w-40">
          <Select
            label={t.groupBy}
            value={filters.group}
            onChange={value => onFiltersChange({ group: value })}
            options={[
              { value: "", label: t.groupNone },
              { value: "path", label: t.groupPath },
              { value: "date", label: t.groupDate },
              { value: "status", label: t.groupStatus },
              { value: "area", label: t.groupArea },
            ]}
          />
        </div>
        {isAdmin && (
        <div className="w-full lg:w-40">
          <Select
            label={t.assignee}
            value={filters.assignee}
            onChange={value => onFiltersChange({ ...filters, assignee: value })}
            options={userOptions}
          />
        </div>
      )}
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
              project: "",
              area: "",
              label: "",
            });
          }}
          className="text-red-500! hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          {t.clearFilters}
        </Button>
      )}
    </div>
  );
}
