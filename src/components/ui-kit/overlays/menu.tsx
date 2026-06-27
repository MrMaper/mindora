"use client";

import * as React from "react";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

export interface MenuItem {
  label?: string;
  icon?: IconName;
  kbd?: string;
  danger?: boolean;
  disabled?: boolean;
  onClick?: () => void;
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
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const wrapRef = React.useRef<HTMLSpanElement>(null);

  const setOpen = (v: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(v);
    onOpenChange?.(v);
  };

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span className={`sf-menu-wrap${className ? ` ${className}` : ""}`} ref={wrapRef} {...rest}>
      <span onClick={() => setOpen(!open)}>{trigger}</span>
      {open && (
        <div className={`sf-menu${align === "end" ? " sf-menu--end" : ""}`} role="menu">
          {items.map((it, i) => {
            if (it.divider) return <div key={i} className="sf-menu__sep" />;
            if (it.heading) return <div key={i} className="sf-menu__head">{it.heading}</div>;
            return (
              <button
                key={i}
                role="menuitem"
                disabled={it.disabled}
                className={`sf-menu__item${it.danger ? " sf-menu__item--danger" : ""}`}
                onClick={() => {
                  if (!it.disabled) {
                    it.onClick?.();
                    setOpen(false);
                  }
                }}
              >
                {it.icon && (
                  <span className="sf-menu__ico">
                    <Icon name={it.icon} size={15} />
                  </span>
                )}
                <span className="sf-menu__label">{it.label}</span>
                {it.kbd && <span className="sf-menu__kbd">{it.kbd}</span>}
              </button>
            );
          })}
        </div>
      )}
    </span>
  );
}
