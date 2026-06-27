"use client";

import * as React from "react";
import { Icon } from "../foundation/icon";

export interface DrawerProps extends React.HTMLAttributes<HTMLElement> {
  open: boolean;
  onClose?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}

export function Drawer({
  open,
  onClose,
  header,
  footer,
  wide = false,
  className = "",
  children,
  ...rest
}: DrawerProps): React.JSX.Element | null {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="sf-drawer-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <aside
        className={`sf-drawer${wide ? " sf-drawer--wide" : ""}${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        {...rest}
      >
        <div className="sf-drawer__head">
          <button className="sf-drawer__close" aria-label="Close" onClick={onClose}>
            <Icon name="x" size={17} />
          </button>
          <div className="sf-drawer__head-main">{header}</div>
        </div>
        <div className="sf-drawer__body">{children}</div>
        {footer && <div className="sf-drawer__foot">{footer}</div>}
      </aside>
    </div>
  );
}
