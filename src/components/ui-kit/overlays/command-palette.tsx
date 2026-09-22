"use client";

import * as React from "react";
import {
  CommandDialog as ShadcnCommandDialog,
  CommandInput as ShadcnCommandInput,
  CommandList as ShadcnCommandList,
  CommandEmpty as ShadcnCommandEmpty,
  CommandGroup as ShadcnCommandGroup,
  CommandItem as ShadcnCommandItem,
} from "@/components/ui/command";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

export interface CommandItem {
  label: string;
  icon?: IconName;
  meta?: string;
  kbd?: string;
  onSelect?: () => void;
}

export interface CommandGroup {
  label?: string;
  items: CommandItem[];
}

export interface CommandPaletteProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose?: () => void;
  placeholder?: string;
  emptyLabel?: string;
  groups: CommandGroup[];
  value?: string;
  onValueChange?: (value: string) => void;
  shouldFilter?: boolean;
}

export function CommandPalette({
  open,
  onClose,
  placeholder = "Search or run a command\u2026",
  emptyLabel = "No results found.",
  groups = [],
  value,
  onValueChange,
  shouldFilter = true,
  className = "",
  ...rest
}: CommandPaletteProps): React.JSX.Element {
  return (
    <ShadcnCommandDialog
      open={open}
      onOpenChange={newOpen => {
        if (!newOpen) onClose?.();
      }}
      title="Command Palette"
      description="Search for a command to run..."
      className={className}
      shouldFilter={shouldFilter}
      {...rest}
    >
      <ShadcnCommandInput
        placeholder={placeholder}
        value={value}
        onValueChange={onValueChange}
      />
      <ShadcnCommandList>
        <ShadcnCommandEmpty>{emptyLabel}</ShadcnCommandEmpty>
        {groups.map((group, gi) => (
          <ShadcnCommandGroup key={gi} heading={group.label}>
            {group.items.map((item, ii) => (
              <ShadcnCommandItem
                key={`${gi}-${ii}-${item.label}`}
                value={`${group.label ?? ""} ${item.label} ${item.meta ?? ""}`}
                onSelect={() => {
                  item.onSelect?.();
                  onClose?.();
                }}
              >
                {item.icon && (
                  <Icon name={item.icon} size={16} className="mr-2" />
                )}
                <span className="flex-1 truncate">{item.label}</span>
                {item.meta && (
                  <span className="text-xs text-muted-foreground mr-2 truncate max-w-[40%]">
                    {item.meta}
                  </span>
                )}
                {item.kbd && (
                  <kbd className="text-xs text-muted-foreground">{item.kbd}</kbd>
                )}
              </ShadcnCommandItem>
            ))}
          </ShadcnCommandGroup>
        ))}
      </ShadcnCommandList>
    </ShadcnCommandDialog>
  );
}
