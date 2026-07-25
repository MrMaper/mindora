"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { useTranslation } from "@/i18n/provider";

interface TeamPaginationProps {
  page: number;
  totalPages: number;
  search: string;
}

export function TeamPagination({ page, totalPages, search }: TeamPaginationProps) {
  const t = useTranslation();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-text-tertiary">
        {t.teams.page} {page} {t.teams.of} {totalPages}
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
            window.location.href = `/teams?${p.toString()}`;
          }}
        >
          {t.teams.previous}
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
            window.location.href = `/teams?${p.toString()}`;
          }}
        >
          {t.teams.next}
        </Button>
      </div>
    </div>
  );
}
