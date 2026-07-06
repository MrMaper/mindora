"use client";

import * as React from "react";
import {
  Tabs as ShadcnTabs,
  TabsList as ShadcnTabsList,
  TabsTrigger as ShadcnTabsTrigger,
} from "@/components/ui/tabs";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  icon?: IconName;
  count?: number;
}

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export function Tabs({
  tabs = [],
  value,
  defaultValue,
  onChange,
  className = "",
  ...rest
}: TabsProps): React.JSX.Element {
  return (
    <ShadcnTabs
      value={value ?? defaultValue ?? tabs[0]?.value}
      onValueChange={onChange}
      className={cn("w-full", className)}
      {...rest}
    >
      <ShadcnTabsList>
        {tabs.map((t) => (
          <ShadcnTabsTrigger key={t.value} value={t.value} className="gap-1.5">
            {t.icon && <Icon name={t.icon} size={15} />}
            {t.label}
            {t.count != null && (
              <span className="ml-0.5 rounded-full bg-muted-foreground/20 px-1.5 text-2xs">
                {t.count}
              </span>
            )}
          </ShadcnTabsTrigger>
        ))}
      </ShadcnTabsList>
    </ShadcnTabs>
  );
}