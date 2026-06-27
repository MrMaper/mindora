import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "count" | "solid";
  dot?: boolean;
}

export function Badge({
  tone = "neutral",
  dot = false,
  className = "",
  children,
  ...rest
}: BadgeProps): React.JSX.Element {
  const cls = ["sf-badge", `sf-badge--${tone}`, dot ? "sf-badge--dot" : "", className]
    .filter(Boolean)
    .join(" ");
  return <span className={cls} {...rest}>{children}</span>;
}
