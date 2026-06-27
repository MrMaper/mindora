import * as React from "react";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  variant?: "ghost" | "solid" | "outline";
  size?: "sm" | "md" | "lg";
  active?: boolean;
  "aria-label": string;
}

export function IconButton({
  icon,
  variant = "ghost",
  size = "md",
  active = false,
  className = "",
  "aria-label": ariaLabel,
  ...rest
}: IconButtonProps): React.JSX.Element {
  const cls = [
    "sf-iconbtn",
    variant !== "ghost" ? `sf-iconbtn--${variant}` : "",
    active ? "sf-iconbtn--active" : "",
    size !== "md" ? `sf-iconbtn--${size}` : "",
    className,
  ].filter(Boolean).join(" ");

  const iconSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

  return (
    <button className={cls} aria-label={ariaLabel} aria-pressed={active || undefined} {...rest}>
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
