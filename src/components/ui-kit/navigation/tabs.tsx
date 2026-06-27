"use client";

import * as React from "react";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

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
  const [internal, setInternal] = React.useState(defaultValue ?? tabs[0]?.value);
  const active = value !== undefined ? value : internal;

  const select = (v: string) => {
    if (value === undefined) setInternal(v);
    onChange?.(v);
  };

  return (
    <div className={`sf-tabs${className ? ` ${className}` : ""}`} role="tablist" {...rest}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={active === t.value}
          className={`sf-tab${active === t.value ? " sf-tab--active" : ""}`}
          onClick={() => select(t.value)}
        >
          {t.icon && <Icon name={t.icon} size={15} />}
          {t.label}
          {t.count != null && <span className="sf-tab__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
