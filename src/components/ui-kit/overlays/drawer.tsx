"use client";

import * as React from "react";
import {
  Sheet as ShadcnSheet,
  SheetTrigger as ShadcnSheetTrigger,
  SheetContent as ShadcnSheetContent,
  SheetHeader as ShadcnSheetHeader,
  SheetTitle as ShadcnSheetTitle,
  SheetFooter as ShadcnSheetFooter,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface DrawerProps extends React.HTMLAttributes<HTMLElement> {
  open: boolean;
  onClose?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  /** @default "end" — inline-end (right in LTR, left in RTL) */
  side?: "top" | "right" | "bottom" | "left" | "start" | "end";
}

export function Drawer({
  open,
  onClose,
  header,
  footer,
  wide = false,
  side = "end",
  className = "",
  children,
  ...rest
}: DrawerProps): React.JSX.Element {
  return (
    <ShadcnSheet
      open={open}
      onOpenChange={newOpen => {
        if (!newOpen) onClose?.();
      }}
    >
      <ShadcnSheetContent
        side={side}
        className={cn(
          "flex flex-col min-w-0",
          wide ? "w-full sm:w-[42rem] sm:max-w-[95vw]" : "w-full max-w-none sm:max-w-sm",
          className,
        )}
        showCloseButton={false}
        {...rest}
      >
        {header && (
          <ShadcnSheetHeader className="min-w-0 overflow-hidden">
            <ShadcnSheetTitle className="min-w-0 w-full block font-normal">
              {header}
            </ShadcnSheetTitle>
          </ShadcnSheetHeader>
        )}
        <div className="flex-1 overflow-y-auto px-4">{children}</div>
        {footer && (
          <ShadcnSheetFooter className="flex self-end">
            {footer}
          </ShadcnSheetFooter>
        )}
      </ShadcnSheetContent>
    </ShadcnSheet>
  );
}
