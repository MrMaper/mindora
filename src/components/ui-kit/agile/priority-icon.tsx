import * as React from "react";

export type Priority = "urgent" | "high" | "medium" | "low" | "none";

const LEVELS: Record<Priority, string> = {
  urgent: "var(--priority-urgent)",
  high:   "var(--priority-high)",
  medium: "var(--priority-medium)",
  low:    "var(--priority-low)",
  none:   "var(--priority-none)",
};

const FILLED: Record<Priority, number> = {
  urgent: 3,
  high:   3,
  medium: 2,
  low:    1,
  none:   0,
};

export interface PriorityIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  priority: Priority;
  size?: number;
}

export function PriorityIcon({
  priority = "none",
  size = 13,
  className = "",
  ...rest
}: PriorityIconProps): React.JSX.Element {
  const color = LEVELS[priority] ?? LEVELS.none;
  const filled = FILLED[priority] ?? 0;
  const heights = [5, 9, 13].map((h) => Math.round((h / 13) * size));

  return (
    <span
      className={`sf-prio${className ? ` ${className}` : ""}`}
      style={{ height: size }}
      title={`Priority: ${priority}`}
      aria-label={`Priority ${priority}`}
      {...rest}
    >
      {priority === "none"
        ? [0, 1, 2].map((i) => (
            <i key={i} style={{ height: 2, background: "var(--priority-none)" }} />
          ))
        : [0, 1, 2].map((i) => (
            <i key={i} style={{ height: heights[i], background: i < filled ? color : "var(--gray-300)" }} />
          ))}
    </span>
  );
}
