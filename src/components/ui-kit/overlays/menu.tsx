"use client";

import * as React from "react";
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuTrigger as ShadcnDropdownMenuTrigger,
  DropdownMenuContent as ShadcnDropdownMenuContent,
  DropdownMenuItem as ShadcnDropdownMenuItem,
  DropdownMenuLabel as ShadcnDropdownMenuLabel,
  DropdownMenuSeparator as ShadcnDropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

export interface MenuItem {
  label?: string;
  icon?: IconName;
  kbd?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  divider?: boolean;
  heading?: string;
}

export interface MenuProps extends React.HTMLAttributes<HTMLSpanElement> {
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Menu({
  trigger,
  items = [],
  align = "start",
  open: controlledOpen,
  onOpenChange,
  className = "",
  ...rest
}: MenuProps): React.JSX.Element {
  // Base UI Trigger is a <button>; merge into an existing button trigger
  // (e.g. IconButton) so we never nest <button> inside <button>.
  const triggerNode = React.isValidElement(trigger) ? (
    <ShadcnDropdownMenuTrigger render={trigger} />
  ) : (
    <ShadcnDropdownMenuTrigger className="inline-flex cursor-pointer">
      {trigger}
    </ShadcnDropdownMenuTrigger>
  );

  return (
    <span className={className} {...rest}>
      <ShadcnDropdownMenu open={controlledOpen} onOpenChange={onOpenChange}>
        {triggerNode}
        <ShadcnDropdownMenuContent
          align={align === "end" ? "end" : "start"}
          sideOffset={4}
          className="min-w-40"
        >
          {items.map((it, i) => {
            if (it.divider) return <ShadcnDropdownMenuSeparator key={i} />;
            if (it.heading) return <ShadcnDropdownMenuLabel key={i}>{it.heading}</ShadcnDropdownMenuLabel>;
            return (
              <ShadcnDropdownMenuItem
                key={i}
                disabled={it.disabled}
                variant={it.danger ? "destructive" : "default"}
                onClick={(e) => it.onClick?.(e)}
              >
                {it.icon && <Icon name={it.icon} size={15} />}
                <span className="flex-1">{it.label}</span>
                {it.kbd && <span className="ml-auto text-xs text-muted-foreground">{it.kbd}</span>}
              </ShadcnDropdownMenuItem>
            );
          })}
        </ShadcnDropdownMenuContent>
      </ShadcnDropdownMenu>
    </span>
  );
}