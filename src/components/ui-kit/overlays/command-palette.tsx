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
  groups: CommandGroup[];
}

export function CommandPalette({
  open,
  onClose,
  placeholder = "Search or run a command\u2026",
  groups = [],
  className = "",
  ...rest
}: CommandPaletteProps): React.JSX.Element {
  return (
    <ShadcnCommandDialog
      open={open}
      onOpenChange={(newOpen) => { if (!newOpen) onClose?.(); }}
      title="Command Palette"
      description="Search for a command to run..."
      className={className}
      {...rest}
    >
      <ShadcnCommandInput placeholder={placeholder} />
      <ShadcnCommandList>
        <ShadcnCommandEmpty>No results found.</ShadcnCommandEmpty>
        {groups.map((group, gi) => (
          <ShadcnCommandGroup key={gi} heading={group.label}>
            {group.items.map((item, ii) => (
              <ShadcnCommandItem
                key={ii}
                onSelect={() => {
                  item.onSelect?.();
                  onClose?.();
                }}
              >
                {item.icon && <Icon name={item.icon} size={16} className="mr-2" />}
                <span className="flex-1">{item.label}</span>
                {item.meta && <span className="text-xs text-muted-foreground mr-2">{item.meta}</span>}
                {item.kbd && <kbd className="text-xs text-muted-foreground">{item.kbd}</kbd>}
              </ShadcnCommandItem>
            ))}
          </ShadcnCommandGroup>
        ))}
      </ShadcnCommandList>
    </ShadcnCommandDialog>
  );
}