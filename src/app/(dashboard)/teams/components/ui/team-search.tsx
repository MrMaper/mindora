"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useTranslation } from "@/i18n/provider";

interface TeamSearchProps {
  search: string;
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onClearFilters: () => void;
}

export function TeamSearch({
  search,
  hasActiveFilters,
  onSearchChange,
  onSearchSubmit,
  onClearFilters,
}: TeamSearchProps) {
  const t = useTranslation();

  return (
    <div className="flex flex-wrap gap-2 justify-between items-end mb-4">
      <div className="flex gap-2 items-center w-fit">
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
  );
}
