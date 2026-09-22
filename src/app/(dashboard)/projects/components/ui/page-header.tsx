"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { useTranslation } from "@/i18n/provider";

interface PageHeaderProps {
  pathCount: number;
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onCreate?: () => void;
}

export function PageHeader({
  pathCount,
  search,
  onSearchChange,
  onSearchSubmit,
  onCreate,
}: PageHeaderProps) {
  const t = useTranslation();

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">
            {t.projects.title}
          </h1>
          <p className="text-sm text-text-tertiary mt-0.5">
            {pathCount} {pathCount === 1 ? t.projects.path : t.projects.paths}
          </p>
        </div>
        {onCreate && (
          <Button variant="primary" icon="plus" onClick={onCreate}>
            {t.projects.newPath}
          </Button>
        )}
      </div>

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
  );
}
