import * as React from "react";
import { LoaderCircleIcon } from "lucide-react";

import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "subtle";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
}

const variantMap = {
  primary: "default" as const,
  secondary: "secondary" as const,
  ghost: "ghost" as const,
  danger: "destructive" as const,
  subtle: "outline" as const,
};

const sizeMap = {
  sm: "sm" as const,
  md: "default" as const,
  lg: "lg" as const,
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps): React.JSX.Element {
  const resolvedVariant = variantMap[variant] ?? "secondary";
  const resolvedSize = sizeMap[size] ?? "default";
  const isDisabled = disabled || loading;
  const iconSize = size === "sm" ? 13 : size === "lg" ? 16 : 15;

  return (
    <ShadcnButton
      type={type}
      variant={resolvedVariant}
      size={resolvedSize}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn("gap-1.5", className)}
      {...rest}
    >
      {loading ? (
        <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={iconSize} />
      )}
      {children && <span className="leading-none">{children}</span>}
      {!loading && iconRight && <Icon name={iconRight} size={iconSize} />}
    </ShadcnButton>
  );
}
