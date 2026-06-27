import * as React from "react";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
}

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  className = "",
  children,
  ...rest
}: ButtonProps): React.JSX.Element {
  const cls = [
    "sf-btn",
    `sf-btn--${variant}`,
    size !== "md" ? `sf-btn--${size}` : "",
    className,
  ].filter(Boolean).join(" ");

  const isDisabled = disabled || loading;
  const iconSize = size === "sm" ? 13 : size === "lg" ? 16 : 15;

  return (
    <button className={cls} disabled={isDisabled} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="sf-btn__spin" aria-hidden="true" />}
      {!loading && icon && <Icon name={icon} size={iconSize} />}
      {children && <span>{children}</span>}
      {!loading && iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}
