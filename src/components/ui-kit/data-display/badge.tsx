import * as React from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "count" | "solid";
  dot?: boolean;
}

const toneVariantMap = {
  neutral: "secondary" as const,
  brand: "default" as const,
  success: "outline" as const,
  warning: "outline" as const,
  danger: "destructive" as const,
  info: "outline" as const,
  count: "default" as const,
  solid: "default" as const,
};

export function Badge({
  tone = "neutral",
  dot = false,
  className = "",
  children,
  ...rest
}: BadgeProps): React.JSX.Element {
  const variant = toneVariantMap[tone];
  const isCount = tone === "count";
  const isSolid = tone === "solid";

  return (
    <ShadcnBadge
      variant={variant}
      className={cn(
        "gap-1 h-4.5 px-1.5 text-2xs font-medium rounded-xs",
        isCount && "min-w-4.5 h-4.5 justify-center rounded-full px-1.5",
        isSolid && "bg-primary text-primary-foreground",
        tone === "success" && "bg-green-tint text-green-500",
        tone === "warning" && "bg-amber-tint text-amber-500",
        tone === "danger" && "bg-red-tint text-red-500",
        tone === "info" && "bg-blue-tint text-blue-500",
        className
      )}
      {...rest}
    >
      {dot && <span className="size-1 rounded-full bg-current" />}
      {children}
    </ShadcnBadge>
  );
}