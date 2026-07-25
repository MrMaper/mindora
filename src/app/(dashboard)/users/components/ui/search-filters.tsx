"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { useTranslation } from "@/i18n/provider";

export interface UserFilters {
  search: string;
  role: string;
  status: string;
  teamId: string;
}

interface SearchFiltersProps {
  search: string;
  filters: UserFilters;
  roleOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  teamOptions: { value: string; label: string }[];
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onFiltersChange: (filter: Partial<UserFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function SearchFilters({
  search,
  filters,
  roleOptions,
  statusOptions,
  teamOptions,
  onSearchChange,
  onSearchSubmit,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
}: SearchFiltersProps) {
  const t = useTranslation();

  return (
    <div className="mb-4 flex flex-wrap gap-2 justify-between items-end">
      <div className="flex gap-2 items-center w-fit">
        <form
          onSubmit={onSearchSubmit}
          className="flex gap-1 w-full max-w-60 items-end"
        >
          <Input
            label={t.users.searchButton}
            placeholder={t.users.search}
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
            label={t.users.role}
            value={filters.role}
            onChange={value => onFiltersChange({ role: value })}
            options={roleOptions}
          />
        </div>

        <div className="w-40">
          <Select
            label={t.users.status}
            value={filters.status}
            onChange={value => onFiltersChange({ status: value })}
            options={statusOptions}
          />
        </div>

        <div className="w-40">
          <Select
            label={t.users.team}
            value={filters.teamId}
            onChange={value => onFiltersChange({ teamId: value })}
            options={teamOptions}
          />
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          icon="x"
          onClick={onClearFilters}
          className="text-red-500! hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          {t.users.clearFilters}
        </Button>
      )}
    </div>
  );
}
