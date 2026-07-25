"use client";

import * as React from "react";
import { Button } from "@/components/ui-kit/forms/button";
import { useLanguage, useTranslation } from "@/i18n/provider";

export interface PaginationProps {
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

export function Pagination({ page, totalPages, filters }: PaginationProps) {
  const t = useTranslation();
  const language = useLanguage();

  console.log(language);

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
          icon={language === "FA" ? "chevron-right" : "chevron-left"}
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
          iconRight={language === "FA" ? "chevron-left" : "chevron-right"}
          // iconRight="chevron-right"
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
