import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  action,
  size = "md",
  className = "",
  ...rest
}: EmptyStateProps): React.JSX.Element {
  const sizeClasses = {
    sm: "p-4 gap-2",
    md: "p-6 gap-3",
    lg: "p-8 gap-4",
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  };

  const titleSizes = {
    sm: "text-sm",
    md: "text-base font-medium",
    lg: "text-lg font-medium",
  };

  const descSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <Card className={cn("w-full max-w-sm", className)} {...rest}>
      <CardContent
        className={cn(
          "flex flex-col items-center text-center",
          sizeClasses[size],
        )}
      >
        <div className="flex items-center justify-center rounded-full bg-muted p-3">
          <Icon
            name={icon}
            size={iconSizes[size]}
            className="text-muted-foreground"
          />
        </div>
        {title && (
          <p className={cn(titleSizes[size], "text-foreground")}>{title}</p>
        )}
        {description && (
          <p className={cn(descSizes[size], "text-muted-foreground")}>
            {description}
          </p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  );
}
