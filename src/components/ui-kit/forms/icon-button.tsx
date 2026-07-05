import * as React from "react";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";
import { cn } from "@/lib/utils";

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
  const variantMap = {
    ghost: "ghost" as const,
    outline: "outline" as const,
    solid: "default" as const,
  };

  const sizeMap = {
    sm: "sm" as const,
    md: "default" as const,
    lg: "lg" as const,
  };

  const iconSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

  return (
    <ShadcnButton
      variant={variantMap[variant]}
      size={sizeMap[size]}
      className={cn("gap-0 p-0", className)}
      aria-label={ariaLabel}
      aria-pressed={active}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </ShadcnButton>
  );
}