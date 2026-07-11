"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";

export interface PaginationProps {
  t: Record<string, any>;
  page: number;
  totalPages: number;
  filters: {
    search: string;
    status: string;
    priority: string;
    assignee: string;
    sort: string;
    order: string;
  };
}

export function Pagination({ t, page, totalPages, filters }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-text-tertiary">
        {t.users.page} {page} {t.users.of} {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon="chevron-left"
          disabled={page <= 1}
          onClick={() => {
            const p = new URLSearchParams({
              ...filters,
              page: String(page - 1),
            });
            window.location.href = `/tasks?${p.toString()}`;
          }}
        >
          {t.users.previous}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          iconRight="chevron-right"
          disabled={page >= totalPages}
          onClick={() => {
            const p = new URLSearchParams({
              ...filters,
              page: String(page + 1),
            });
            window.location.href = `/tasks?${p.toString()}`;
          }}
        >
          {t.users.next}
        </Button>
      </div>
    </div>
  );
}