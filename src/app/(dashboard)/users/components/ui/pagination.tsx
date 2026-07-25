"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import type { Translations } from "@/i18n";

interface PaginationProps {
  page: number;
  totalPages: number;
  t: Translations;
  search: string;
}

export function Pagination({ page, totalPages, t, search }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-muted-foreground">
        {t.users.page} {page} {t.users.of} {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon="chevron-left"
          disabled={page <= 1}
          onClick={() => {
            const p = new URLSearchParams({ search, page: String(page - 1) });
            window.location.href = `/users?${p.toString()}`;
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
            const p = new URLSearchParams({ search, page: String(page + 1) });
            window.location.href = `/users?${p.toString()}`;
          }}
        >
          {t.users.next}
        </Button>
      </div>
    </div>
  );
}