import * as React from "react";

export interface TooltipProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  kbd?: string;
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
}

export function Tooltip({
  label,
  kbd,
  side = "top",
  className = "",
  children,
  ...rest
}: TooltipProps): React.JSX.Element {
  return (
    <span className={`sf-tip-wrap${className ? ` ${className}` : ""}`} {...rest}>
      {children}
      <span className={`sf-tip sf-tip--${side}`} role="tooltip">
        {label}
        {kbd && <span className="sf-tip__kbd">{kbd}</span>}
      </span>
    </span>
  );
}
