"use client";

import * as React from "react";
import { Badge } from "@/components/ui-kit/data-display/badge";
import { cn } from "@/lib/utils";

export type Priority = "urgent" | "high" | "medium" | "low" | "none";

const PRIORITY_CONFIG: Record<
  Priority,
  {
    label: string;
    tone:
      | "neutral"
      | "brand"
      | "success"
      | "warning"
      | "danger"
      | "info"
      | "count"
      | "solid";
    bars: number;
  }
> = {
  urgent: { label: "فوری", tone: "danger", bars: 3 },
  high: { label: "بالا", tone: "danger", bars: 3 },
  medium: { label: "متوسط", tone: "warning", bars: 2 },
  low: { label: "پایین", tone: "info", bars: 1 },
  none: { label: "بدون اولویت", tone: "neutral", bars: 0 },
};

export interface PriorityIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  priority: Priority;
  size?: number;
  showLabel?: boolean;
}

export function PriorityIcon({
  priority = "none",
  size = 13,
  showLabel = false,
  className = "",
  ...rest
}: PriorityIconProps): React.JSX.Element {
  const config = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.none;
  const filled = config.bars;
  const heights = [5, 9, 13].map(h => Math.round((h / 13) * size));

  const bars =
    priority === "none"
      ? [0, 1, 2].map(i => (
          <i
            key={i}
            style={{
              height: 2,
              backgroundColor: "var(--priority-none)",
              width: 3,
              borderRadius: 1,
            }}
          />
        ))
      : [0, 1, 2].map(i => (
          <i
            key={i}
            style={{
              height: heights[i],
              backgroundColor:
                i < filled ? `var(--priority-${priority})` : "var(--gray-300)",
              width: 3,
              borderRadius: 1,
            }}
          />
        ));

  if (showLabel) {
    return (
      <Badge tone={config.tone} className={cn("gap-1", className)} {...rest}>
        <span
          className="flex items-end gap-0.5 h-4"
          style={{ height: size }}
          aria-label={`Priority ${priority}`}
        >
          {bars}
        </span>
        {config.label}
      </Badge>
    );
  }

  return (
    <span
      className={cn("flex items-end gap-0.5", className)}
      style={{ height: size }}
      title={`Priority: ${priority}`}
      aria-label={`Priority ${priority}`}
      {...rest}
    >
      {bars}
    </span>
  );
}
