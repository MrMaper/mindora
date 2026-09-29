"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Standard list-page header: title (+ optional meta) on the inline-start,
 * primary actions on the inline-end — so Create stays in the same corner
 * on every surface (RTL: title right / actions left).
 */
export function PageHeaderBar({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-text-primary text-foreground">
          {title}
        </h1>
        {description != null && description !== false ? (
          <div className="mt-0.5 text-sm text-text-tertiary text-muted-foreground">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
