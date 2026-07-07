"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { Select } from "@/components/ui-kit/forms/select";
import { getTranslations } from "@/i18n";
import type { SelectOption } from "@/components/ui-kit/forms/select";
import type { UserRow } from "@/features/users/types";
import type { Translations } from "@/i18n";

interface SearchFiltersProps {
  filters: {
    search: string;
    status: string;
    priority: string;
    assignee: string;
    sort: string;
    order: string;
  };
  u: ReturnType<typeof import("./use-tasks").useTasks>;
  t: Translations["tasks"];
  users: import("@/features/users/types").UserRow[];
  statusOptions: SelectOption[];
  priorityOptions: SelectOption[];
  typeOptions: SelectOption[];
  onFiltersChange: (filters: Partial<SearchFiltersProps["filters"]>) => void;
  onClearFilters: (filters: Partial<SearchFiltersProps["filters"]>) => void;
}

export function SearchFilters({
  filters,
  u,
  t,
  users,
  statusOptions,
  priorityOptions,
  typeOptions,
  onFiltersChange,
  onClearFilters,
}: SearchFiltersProps) {
  const userOptions = React.useMemo(
    () => [
      { value: "", label: t.unassigned },
      ...users.map((usr) => ({ value: usr.id, label: usr.name })),
    ],
    [users, t.unassigned]
  );

  const hasActiveFilters = !!(
    filters.status ||
    filters.priority ||
    filters.assignee ||
    filters.search
  );

  return (
    <div className="mb-4 flex flex-wrap gap-2 justify-between items-end">
      <div className="flex gap-2 items-center w-fit">
        <form
          onSubmit={u.onSearchSubmit}
          className="flex gap-1 w-full max-w-60 items-end"
        >
          <input
            type="text"
            placeholder={t.search}
            value={u.search}
            onChange={(e) => u.setSearch(e.target.value)}
            className="w-full"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            <Icon name="search" size={14} />
          </button>
        </form>

        <div className="max-w-40">
          <Select
            label={t.status}
            value={filters.status}
            onChange={(value) => onFiltersChange({ status: value })}
            options={statusOptions}
          />
        </div>
        <Select
          label={t.priority}
          value={filters.priority}
          onChange={(value) => onFiltersChange({ priority: value })}
          options={priorityOptions}
          className="w-40"
        />
        <Select
          label={t.assignee}
          value={filters.assignee}
          onChange={(value) => onFiltersChange({ assignee: value })}
          options={userOptions}
          className="w-40"
        />
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          className="btn btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={() => {
            u.setSearch("");
            onClearFilters({
              search: "",
              status: "",
              priority: "",
              assignee: "",
            });
          }}
        >
          <Icon name="x" size={14} />
          {t.clearFilters}
        </button>
      )}
    </div>
  );
}