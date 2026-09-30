import * as React from "react";
import { Skeleton as ShadcnSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  lines?: number;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "text",
  lines = 1,
  width,
  height,
  className = "",
  ...rest
}: SkeletonProps): React.JSX.Element {
  if (variant === "circular") {
    return (
      <ShadcnSkeleton
        className={cn("rounded-full", className)}
        style={{ width, height, ...(rest.style as React.CSSProperties) }}
        {...rest}
      />
    );
  }

  if (variant === "rectangular") {
    return (
      <ShadcnSkeleton
        className={cn("rounded-md", className)}
        style={{ width, height, ...(rest.style as React.CSSProperties) }}
        {...rest}
      />
    );
  }

  // Text variant - multiple lines
  return (
    <div className={cn("space-y-2", className)} {...rest}>
      {Array.from({ length: lines }).map((_, i) => (
        <ShadcnSkeleton
          key={i}
          className={cn("h-3 rounded", i === lines - 1 && lines > 1 && "w-3/4")}
          style={{
            width: i === lines - 1 && lines > 1 ? undefined : width,
            ...(rest.style as React.CSSProperties),
          }}
        />
      ))}
    </div>
  );
}
