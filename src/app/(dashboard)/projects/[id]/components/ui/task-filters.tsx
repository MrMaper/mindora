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
  onClearFilters: (filter?: Partial<ProjectTaskFilters>) => void;
  hasActiveFilters: boolean;
  currentUserRole: string;
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
  currentUserRole,
}: TaskFiltersProps) {
  const isAdmin = currentUserRole === "ADMIN";
  return (
    <div className="mb-4 flex flex-wrap gap-2 justify-between items-end">
      <div className="flex gap-2 items-center w-fit">
        <form
          onSubmit={onSearchSubmit}
          className="flex gap-1 w-full max-w-60 items-end"
        >
          <Input
            label={t.tasks.searchButton}
            placeholder={t.tasks.search}
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
        <div className="w-40">
          <Select
            label={t.tasks.priority}
            value={filters.priority}
            onChange={value => onFiltersChange({ ...filters, priority: value })}
            options={priorityOptions}
          />
        </div>
        {isAdmin && (
        <div className="w-40">
          <Select
            label={t.tasks.assignee}
            value={filters.assignee}
            onChange={value => onFiltersChange({ ...filters, assignee: value })}
            options={assigneeOptions}
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