"use client";

import * as React from "react";
import {
  Dialog as ShadcnDialog,
  DialogTrigger as ShadcnDialogTrigger,
  DialogContent as ShadcnDialogContent,
  DialogTitle as ShadcnDialogTitle,
  DialogDescription as ShadcnDialogDescription,
  DialogHeader as ShadcnDialogHeader,
  DialogFooter as ShadcnDialogFooter,
  DialogClose as ShadcnDialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
  width?: number;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  width = 480,
  className = "",
  children,
  ...rest
}: DialogProps): React.JSX.Element {
  return (
    <ShadcnDialog open={open} onOpenChange={(newOpen) => { if (!newOpen) onClose?.(); }}>
      <ShadcnDialogContent
        className={cn("sm:max-w-sm", className)}
        style={{ maxWidth: width }}
        showCloseButton={false}
        {...rest}
      >
        {(title || description) && (
          <ShadcnDialogHeader>
            {title && <ShadcnDialogTitle>{title}</ShadcnDialogTitle>}
            {description && <ShadcnDialogDescription>{description}</ShadcnDialogDescription>}
          </ShadcnDialogHeader>
        )}
        <div className="p-0">{children}</div>
        {footer && (
          <ShadcnDialogFooter showCloseButton={false}>
            {footer}
          </ShadcnDialogFooter>
        )}
      </ShadcnDialogContent>
    </ShadcnDialog>
  );
}