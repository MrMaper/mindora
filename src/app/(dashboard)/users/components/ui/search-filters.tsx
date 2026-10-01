"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { Select } from "@/components/ui-kit/forms/select";
import { useTranslation } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export interface UserFilters {
  search: string;
  role: string;
  status: string;
}

interface SearchFiltersProps {
  search: string;
  filters: Partial<UserFilters>;
  roleOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onFiltersChange: (filter: Partial<UserFilters>) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  className?: string;
}

export function SearchFilters({
  search,
  filters,
  roleOptions,
  statusOptions,
  onSearchChange,
  onSearchSubmit,
  onFiltersChange,
  onClearFilters,
  hasActiveFilters,
  className,
}: SearchFiltersProps) {
  const t = useTranslation();

  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      <form onSubmit={onSearchSubmit} className="min-w-0 flex-1 sm:min-w-[14rem]">
        <Input
          aria-label={t.users.searchButton}
          placeholder={t.users.search}
          icon="search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full bg-bg-surface"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-[8.5rem] sm:w-36">
          <Select
            value={filters.role}
            onChange={value => onFiltersChange({ role: value })}
            options={roleOptions}
            placeholder={t.users.allRoles}
          />
        </div>

        <div className="w-[8.5rem] sm:w-36">
          <Select
            value={filters.status}
            onChange={value => onFiltersChange({ status: value })}
            options={statusOptions}
            placeholder={t.users.allStatuses}
          />
        </div>

        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            {t.users.clearFilters}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
