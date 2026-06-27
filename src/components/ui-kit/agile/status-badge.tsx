import * as React from "react";

export type TaskStatus = "backlog" | "todo" | "in-progress" | "review" | "testing" | "done" | "blocked";

export const STATUSES: Record<TaskStatus, { label: string; color: string; tint: string; border: string }> = {
  backlog:       { label: "Backlog",     color: "var(--status-backlog)",  tint: "var(--status-backlog-tint)",  border: "var(--status-backlog-border)" },
  todo:          { label: "To Do",       color: "var(--status-todo)",     tint: "var(--status-todo-tint)",     border: "var(--status-todo-border)" },
  "in-progress": { label: "In Progress", color: "var(--status-progress)", tint: "var(--status-progress-tint)", border: "var(--status-progress-border)" },
  review:        { label: "Review",      color: "var(--status-review)",   tint: "var(--status-review-tint)",   border: "var(--status-review-border)" },
  testing:       { label: "Testing",     color: "var(--status-testing)",  tint: "var(--status-testing-tint)",  border: "var(--status-testing-border)" },
  done:          { label: "Done",        color: "var(--status-done)",     tint: "var(--status-done-tint)",     border: "var(--status-done-border)" },
  blocked:       { label: "Blocked",     color: "var(--status-blocked)",  tint: "var(--status-blocked-tint)",  border: "var(--status-blocked-border)" },
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
      <span className={`sf-status sf-status--dot-only${className ? ` ${className}` : ""}`} title={s.label} {...rest}>
        <span className="sf-status__dot" style={{ background: s.color, width: 9, height: 9 }} />
      </span>
    );
  }

  const style: React.CSSProperties =
    variant === "solid"
      ? { background: s.color }
      : { background: s.tint, color: s.color, borderColor: s.border };

  const cls = ["sf-status", variant === "solid" ? "sf-status--solid" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} style={style} {...rest}>
      {variant !== "solid" && <span className="sf-status__dot" style={{ background: s.color }} />}
      {s.label}
    </span>
  );
}
