"use client";

import * as React from "react";
import {
  Tooltip as ShadcnTooltip,
  TooltipTrigger as ShadcnTooltipTrigger,
  TooltipContent as ShadcnTooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  delayDuration = 200,
  disabled = false,
  className = "",
}: TooltipProps): React.JSX.Element {
  if (!React.isValidElement(children)) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <TooltipProvider delay={delayDuration}>
      <ShadcnTooltip disabled={disabled}>
        <ShadcnTooltipTrigger>
          {React.cloneElement(children as React.ReactElement<any>, {
            "aria-describedby": undefined,
          })}
        </ShadcnTooltipTrigger>
        <ShadcnTooltipContent
          side={side}
          align={align}
          className={cn(
            "z-[1200] px-2.5 py-1.5 text-xs text-background bg-foreground rounded-md shadow-lg animate-in fade-in-0 zoom-in-95",
            className,
          )}
        >
          {content}
        </ShadcnTooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  );
}

export { TooltipProvider };