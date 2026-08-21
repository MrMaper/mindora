"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";

interface TaskFilters {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  project: string;
  sort: string;
  order: string;
}

export interface SearchFiltersProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
  filters: TaskFilters;
  search: string;
  project: string;
  projectOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  priorityOptions: { value: string; label: string }[];
  userOptions: { value: string; label: string }[];
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onFiltersChange: (filter: Partial<TaskFilters>) => void;
  onProjectChange: (value: string) => void;
  onClearFilters: (filter?: Partial<TaskFilters>) => void;
  hasActiveFilters: boolean;
  currentUserRole: string;
}

export function SearchFilters({
  t,
  filters,
  search,
  project,
  projectOptions,
  statusOptions,
  priorityOptions,
  userOptions,
  onSearchChange,
  onSearchSubmit,
  onFiltersChange,
  onProjectChange,
  onClearFilters,
  hasActiveFilters,
  currentUserRole,
}: SearchFiltersProps) {
  const isAdmin = currentUserRole === "ADMIN";
  return (
    <div className="mb-4 flex flex-wrap gap-2 justify-between items-end">
      <div className="flex gap-2 items-center w-fit">
        <form
          onSubmit={onSearchSubmit}
          className="flex gap-1 w-full max-w-60 items-end"
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

        <div className="w-48">
          <Select
            label={t.project}
            value={project}
            onChange={onProjectChange}
            options={projectOptions}
          />
        </div>
        <div className="w-40">
          <Select
            label={t.status}
            value={filters.status}
            onChange={value => onFiltersChange({ ...filters, status: value })}
            options={statusOptions}
          />
        </div>
        <div className="w-40">
          <Select
            label={t.priority}
            value={filters.priority}
            onChange={value => onFiltersChange({ ...filters, priority: value })}
            options={priorityOptions}
          />
        </div>
        {isAdmin && (
        <div className="w-40">
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
