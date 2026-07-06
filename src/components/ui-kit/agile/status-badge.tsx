"use client";

import * as React from "react";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { cn } from "@/lib/utils";

export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "testing" | "done" | "blocked";

export const STATUSES: Record<TaskStatus, { label: string; tone: "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "count" | "solid" }> = {
  backlog:       { label: "بکلاگ", tone: "neutral" },
  todo:          { label: "کارهای انجام‌نشده", tone: "info" },
  "in-progress": { label: "در حال انجام", tone: "brand" },
  review:        { label: "مرور", tone: "warning" },
  testing:       { label: "تست", tone: "info" },
  done:          { label: "انجام شده", tone: "success" },
  blocked:       { label: "مسدود", tone: "danger" },
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: TaskStatus;
  variant?: "tint" | "solid";
  dotOnly?: boolean;
}

export function StatusBadge({
  status = "backlog",
  variant = "tint",
  dotOnly = false,
  className = "",
  ...rest
}: StatusBadgeProps): React.JSX.Element {
  const s = STATUSES[status] ?? STATUSES.backlog;

  if (dotOnly) {
    return (
      <span className={cn("flex items-center gap-1", className)} title={s.label} {...rest}>
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(--status-${status})` }} />
      </span>
    );
  }

  return (
    <Badge tone={s.tone} dot={variant !== "solid"} className={cn("gap-1.5", className)} {...rest}>
      {s.label}
    </Badge>
  );
}