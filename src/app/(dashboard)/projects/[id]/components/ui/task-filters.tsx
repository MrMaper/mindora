"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import type { Translations } from "@/i18n";
import type { ProjectTaskFilters } from "@/components/ui-kit/forms/project-task-filters";

interface TaskFiltersProps {
  t: Translations;
  filters: ProjectTaskFilters;
  search: string;
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  assigneeOptions: { value: string; label: string }[];
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onFiltersChange: (filter: Partial<ProjectTaskFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function TaskFilters({
  t,
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
}: TaskFiltersProps) {
  return (
    <div className="mb-4 space-y-4">
      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <Input
          placeholder={t.projects.search || "Search tasks"}
          icon="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-[320px]"
        />
        <Button type="submit" variant="secondary">
          {t.projects.searchButton || "Search"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-3">
        <Select
          value={filters.status}
          onChange={(v) => onFiltersChange({ status: v })}
          options={statusOptions}
          className="w-[160px]"
        />
        <Select
          value={filters.priority}
          onChange={(v) => onFiltersChange({ priority: v })}
          options={priorityOptions}
          className="w-[160px]"
        />
        <Select
          value={filters.assignee}
          onChange={(v) => onFiltersChange({ assignee: v })}
          options={assigneeOptions}
          className="w-[180px]"
        />
        <Select
          value={filters.sort}
          onChange={(v) => onFiltersChange({ sort: v })}
          options={[
            { value: "createdAt", label: t.projects.sortCreated || "Created" },
            { value: "updatedAt", label: t.projects.sortUpdated || "Updated" },
            { value: "priority", label: t.projects.sortPriority || "Priority" },
            { value: "title", label: t.projects.sortTitle || "Title" },
          ]}
          className="w-[160px]"
        />
        <Select
          value={filters.order}
          onChange={(v) => onFiltersChange({ order: v })}
          options={[
            { value: "desc", label: t.projects.sortDesc || "Descending" },
            { value: "asc", label: t.projects.sortAsc || "Ascending" },
          ]}
          className="w-[100px]"
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            icon="x"
            onClick={onClearFilters}
            className="text-destructive hover:bg-destructive/10"
          >
            {t.projects.clearFilters || "Clear filters"}
          </Button>
        )}
      </div>
    </div>
  );
}