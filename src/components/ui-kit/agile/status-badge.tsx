"use client";

import * as React from "react";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { useTranslation } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export type TaskStatus =
  | "backlog"
  | "todo"
  | "in-progress"
  | "done"
  // Legacy display keys — rendered like in-progress
  | "review"
  | "testing"
  | "blocked";

export const STATUSES: Record<
  TaskStatus,
  {
    tone:
      | "neutral"
      | "brand"
      | "success"
      | "warning"
      | "danger"
      | "info"
      | "count"
      | "solid";
  }
> = {
  backlog: { tone: "neutral" },
  todo: { tone: "info" },
  "in-progress": { tone: "brand" },
  done: { tone: "success" },
  review: { tone: "brand" },
  testing: { tone: "brand" },
  blocked: { tone: "brand" },
};

function statusLabel(
  status: TaskStatus,
  t: ReturnType<typeof useTranslation>,
): string {
  switch (status) {
    case "todo":
      return t.tasks.todo;
    case "in-progress":
      return t.tasks.inProgress;
    case "done":
      return t.tasks.done;
    case "review":
      return t.tasks.review;
    case "testing":
      return t.tasks.testing;
    case "blocked":
      return t.tasks.blocked;
    case "backlog":
    default:
      return t.tasks.backlog;
  }
}

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
  const t = useTranslation();
  const s = STATUSES[status] ?? STATUSES.backlog;
  const label = statusLabel(status, t);

  if (dotOnly) {
    return (
      <span
        className={cn("flex items-center gap-1", className)}
        title={label}
        {...rest}
      >
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: `var(--status-${status})` }}
        />
      </span>
    );
  }

  return (
    <Badge
      tone={s.tone}
      dot={variant !== "solid"}
      className={cn("gap-1.5", className)}
      {...rest}
    >
      {label}
    </Badge>
  );
}
