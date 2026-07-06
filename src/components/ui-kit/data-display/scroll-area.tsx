"use client";

import * as React from "react";
import {
  ScrollArea as ShadcnScrollArea,
  ScrollBar as ShadcnScrollBar,
} from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ScrollAreaProps extends React.ComponentProps<
  typeof ShadcnScrollArea
> {
  children: React.ReactNode;
  maxHeight?: string;
}

export function ScrollArea({
  children,
  className = "",
  maxHeight = "max-h-[80vh]",
  ...rest
}: ScrollAreaProps): React.JSX.Element {
  return (
    <ShadcnScrollArea
      className={cn("relative overflow-y-hidden", maxHeight, className)}
      {...rest}
    >
      {children}
    </ShadcnScrollArea>
  );
}

export { ShadcnScrollBar as ScrollBar };
