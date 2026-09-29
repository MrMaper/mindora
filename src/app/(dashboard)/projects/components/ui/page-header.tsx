"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { Input } from "@/components/ui-kit/forms/input";
import { PageHeaderBar } from "@/components/ui-kit/layout/page-header-bar";
import { useTranslation } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export type PathStatusFilter =
  | "all"
  | "ACTIVE"
  | "PLANNED"
  | "ON_HOLD"
  | "COMPLETED";

interface PageHeaderProps {
  pathCount: number;
  search: string;
  statusFilter: PathStatusFilter;
  onStatusFilterChange: (value: PathStatusFilter) => void;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onCreate?: () => void;
  /** Show search when enough paths exist, or when a query is already active. */
  showSearch: boolean;
}

export function PageHeader({
  pathCount,
  search,
  statusFilter,
  onStatusFilterChange,
  onSearchChange,
  onSearchSubmit,
  onCreate,
  showSearch,
}: PageHeaderProps) {
  const t = useTranslation();

  const filters: { id: PathStatusFilter; label: string }[] = [
    { id: "all", label: t.projects.filterAll },
    { id: "ACTIVE", label: t.projects.active },
    { id: "PLANNED", label: t.projects.planned },
    { id: "ON_HOLD", label: t.projects.onHold },
    { id: "COMPLETED", label: t.projects.completed },
  ];

  return (
    <div className="mb-5">
      <PageHeaderBar
        className="mb-3"
        title={t.projects.title}
        description={
          <>
            <p className="max-w-xl">{t.projects.subtitle}</p>
            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
              {pathCount} {pathCount === 1 ? t.projects.path : t.projects.paths}
            </p>
          </>
        }
        actions={
          onCreate ? (
            <Button variant="primary" icon="plus" onClick={onCreate}>
              {t.projects.newPath}
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-border-default bg-bg-sunken p-0.5">
          {filters.map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => onStatusFilterChange(f.id)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-colors",
                statusFilter === f.id
                  ? "bg-bg-surface text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {showSearch ? (
          <form
            onSubmit={onSearchSubmit}
            className="flex gap-1 w-full max-w-60 items-end ms-auto"
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
        ) : null}
      </div>
    </div>
  );
}
