"use client";

import * as React from "react";
import { Separator as ShadcnSeparator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface SeparatorProps extends React.ComponentProps<
  typeof ShadcnSeparator
> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export function Separator({
  orientation = "horizontal",
  decorative = true,
  className = "",
  ...rest
}: SeparatorProps): React.JSX.Element {
  return (
    <ShadcnSeparator
      orientation={orientation}
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className,
      )}
      {...rest}
    />
  );
}
