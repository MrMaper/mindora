"use client";

import * as React from "react";
import { Input } from "@/components/ui-kit/forms/input";
import { Button } from "@/components/ui-kit/forms/button";
import { useTranslation } from "@/i18n/provider";

interface SearchFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export function SearchFilter({
  search,
  onSearchChange,
  onSearchSubmit,
}: SearchFilterProps) {
  const t = useTranslation();

  return (
    <div className="mb-4 flex flex-wrap gap-2 justify-between items-end">
      <div className="flex gap-2 items-center w-fit">
        <form
          onSubmit={onSearchSubmit}
          className="flex gap-1 w-full max-w-60 items-end"
        >
          <Input
            label={t.projects.searchButton}
            placeholder={t.projects.search}
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
    </div>
  );
}
