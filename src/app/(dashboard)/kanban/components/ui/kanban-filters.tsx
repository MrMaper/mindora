"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { AreaPathFilters } from "@/components/life/area-path-filters";
import { useLanguage, useTranslation } from "@/i18n/provider";
import type { ProjectRow } from "@/features/projects/types";
import type { UserRow } from "@/features/users/types";
import type { LabelRow } from "@/features/labels/types";

interface KanbanFiltersProps {
  search: string;
  project: string;
  area: string;
  projects: ProjectRow[];
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onScopeChange: (next: { area: string; project: string }) => void;
  assignee: string;
  label: string;
  priority: string;
  onFilterChange: (filter: {
    assignee?: string;
    label?: string;
    priority?: string;
    project?: string;
  }) => void;
  users: UserRow[];
  labels: LabelRow[];
  priorityOptions: { value: string; label: string }[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  showProjectFilter?: boolean;
  /** Personal OS: hide person filter when members cannot see other users. */
  showAssigneeFilter?: boolean;
}

export function KanbanFilters({
  search,
  project,
  area,
  projects,
  onSearchChange,
  onSearchSubmit,
  onScopeChange,
  assignee,
  label,
  priority,
  onFilterChange,
  users,
  labels,
  priorityOptions,
  hasActiveFilters,
  onClearFilters,
  showProjectFilter = true,
  showAssigneeFilter = true,
}: KanbanFiltersProps) {
  const t = useTranslation();
  const language = useLanguage();

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
    <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-end gap-2">
      <form
        onSubmit={onSearchSubmit}
        className="flex gap-1 w-full lg:max-w-60 items-end sm:col-span-2 lg:col-span-1"
      >
        <Input
          label={t.board.searchButton}
          placeholder={t.board.search}
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

      {showProjectFilter && (
        <AreaPathFilters
          projects={projects}
          area={area}
          project={project}
          language={language === "EN" ? "EN" : "FA"}
          labels={{
            area: t.board.area,
            path: t.board.path,
            allAreas: t.board.allAreas,
            allPaths: t.board.allPaths,
          }}
          onChange={onScopeChange}
        />
      )}
      {showAssigneeFilter && (
        <div className="w-full lg:w-40">
          <Select
            label={t.board.assignee}
            value={assignee}
            onChange={value => onFilterChange({ assignee: value })}
            options={userOptions}
          />
        </div>
      )}
      {labels.length > 0 && (
        <div className="w-full lg:w-40">
          <Select
            label={t.board.labels}
            value={label}
            onChange={value => onFilterChange({ label: value })}
            options={labelOptions}
          />
        </div>
      )}
      <div className="w-full lg:w-40">
        <Select
          label={t.board.priority}
          value={priority}
          onChange={value => onFilterChange({ priority: value })}
          options={allPriorityOptions}
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          icon="x"
          onClick={onClearFilters}
          className="text-red-500! hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          {t.board.clearFilters}
        </Button>
      )}
    </div>
  );
}
