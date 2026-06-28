"use client";

import * as React from "react";
import * as ReactDOM from "react-dom";
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
  const triggerRef = React.useRef<HTMLSpanElement>(null);
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({});

  const setOpen = (v: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(v);
    onOpenChange?.(v);
  };

  const calcPosition = React.useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const isRtl = document.documentElement.dir === "rtl";
    const style: React.CSSProperties = { top: rect.bottom + 4 };

    if (align === "end") {
      if (isRtl) {
        style.left = rect.left;
        style.transformOrigin = "top left";
      } else {
        style.right = window.innerWidth - rect.right;
        style.transformOrigin = "top right";
      }
    } else {
      if (isRtl) {
        style.right = window.innerWidth - rect.right;
        style.transformOrigin = "top right";
      } else {
        style.left = rect.left;
        style.transformOrigin = "top left";
      }
    }

    setDropdownStyle(style);
  }, [align]);

  React.useEffect(() => {
    if (open) calcPosition();
  }, [open, calcPosition]);

  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const dropdown = open
    ? ReactDOM.createPortal(
        <div className="sf-menu" role="menu" style={dropdownStyle}>
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
        </div>,
        document.body,
      )
    : null;

  return (
    <span className={`sf-menu-wrap${className ? ` ${className}` : ""}`} ref={wrapRef} {...rest}>
      <span ref={triggerRef} onClick={() => setOpen(!open)}>{trigger}</span>
      {dropdown}
    </span>
  );
}
