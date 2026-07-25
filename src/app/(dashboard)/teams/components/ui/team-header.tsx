"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { useTranslation } from "@/i18n/provider";
import type { TeamFilters } from "../hooks/use-teams";

interface TeamHeaderProps {
  total: number;
  search: string;
  filters: TeamFilters;
  hasActiveFilters: boolean;
  onCreate: () => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onFiltersChange: (filter: Partial<TeamFilters>) => void;
  onClearFilters: () => void;
}

export function TeamHeader({
  total,
  search,
  filters,
  hasActiveFilters,
  onCreate,
  onSearchChange,
  onSearchSubmit,
  onFiltersChange,
  onClearFilters,
}: TeamHeaderProps) {
  const t = useTranslation();

  const statusOptions = [
    { value: "", label: t.common.all },
    { value: "ACTIVE", label: t.teams.active },
    { value: "ARCHIVED", label: t.teams.archived },
  ];

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {t.teams.title}
          </h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            {total} {total === 1 ? t.teams.team : t.teams.totalTeams}
          </p>
        </div>
        <Button variant="primary" icon="plus" onClick={onCreate}>
          {t.common.add} {t.teams.team.toLowerCase()}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 items-end">
        <form
          onSubmit={onSearchSubmit}
          className="flex gap-1 w-full max-w-60 items-end"
        >
          <Input
            label={t.teams.searchButton}
            placeholder={t.teams.search}
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
            label={t.teams.status}
            value={filters.status}
            onChange={value => onFiltersChange({ status: value })}
            options={statusOptions}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            icon="x"
            onClick={onClearFilters}
            className="text-red-500! hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            {t.teams.clearFilters}
          </Button>
        )}
      </div>
    </div>
  );
}
