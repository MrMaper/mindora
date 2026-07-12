"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { useTranslation } from "@/i18n/provider";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";

interface KanbanFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  assignee: string;
  label: string;
  priority: string;
  onFilterChange: (filter: {
    assignee?: string;
    label?: string;
    priority?: string;
  }) => void;
  users: UserRow[];
  labels: LabelRow[];
  priorityOptions: { value: string; label: string }[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function KanbanFilters({
  search,
  onSearchChange,
  onSearchSubmit,
  assignee,
  label,
  priority,
  onFilterChange,
  users,
  labels,
  priorityOptions,
  hasActiveFilters,
  onClearFilters,
}: KanbanFiltersProps) {
  const t = useTranslation();

  const userOptions = [
    { value: "", label: t.board.allAssignees },
    ...users.map(usr => ({ value: usr.id, label: usr.name })),
  ];
  const labelOptions = [
    { value: "", label: t.board.allLabels },
    ...labels.map(l => ({ value: l.id, label: l.name })),
  ];
  const allPriorityOptions = [
    { value: "", label: t.board.allPriorities },
    ...priorityOptions,
  ];

  return (
    <div className="mb-4 flex flex-wrap gap-2 justify-between items-end">
      <div className="flex gap-2 items-center w-fit">
        <form
          onSubmit={onSearchSubmit}
          className="flex gap-1 w-full max-w-60 items-end"
        >
          <Input
            label={t.board.searchButton}
            placeholder={t.board.search}
            icon="search"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full"
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
            label={t.board.assignee}
            value={assignee}
            onChange={value => onFilterChange({ assignee: value })}
            options={userOptions}
          />
        </div>
        <div className="w-40">
          <Select
            label={t.board.labels}
            value={label}
            onChange={value => onFilterChange({ label: value })}
            options={labelOptions}
          />
        </div>
        <div className="w-40">
          <Select
            label={t.board.priority}
            value={priority}
            onChange={value => onFilterChange({ priority: value })}
            options={allPriorityOptions}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          icon="x"
          onClick={onClearFilters}
          className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          {t.board.clearFilters}
        </Button>
      )}
    </div>
  );
}
