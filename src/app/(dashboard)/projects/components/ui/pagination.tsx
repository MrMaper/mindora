"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";

interface PaginationProps {
  t: {
    page: string;
    of: string;
    previous: string;
    next: string;
  };
  page: number;
  totalPages: number;
  search: string;
}

export function Pagination({ t, page, totalPages, search }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-muted-foreground">
        {t.page} {page} {t.of} {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon="chevron-left"
          disabled={page <= 1}
          onClick={() => {
            const p = new URLSearchParams({
              search,
              page: String(page - 1),
            });
            window.location.href = `/projects?${p.toString()}`;
          }}
        >
          {t.previous}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          iconRight="chevron-right"
          disabled={page >= totalPages}
          onClick={() => {
            const p = new URLSearchParams({
              search,
              page: String(page + 1),
            });
            window.location.href = `/projects?${p.toString()}`;
          }}
        >
          {t.next}
        </Button>
      </div>
    </div>
  );
}