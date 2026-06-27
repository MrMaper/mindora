"use client";

import * as React from "react";
import { Icon } from "../foundation/icon";

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
}: DialogProps): React.JSX.Element | null {
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
      className="sf-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`sf-dialog${className ? ` ${className}` : ""}`}
        role="dialog"
        aria-modal="true"
        style={{ maxWidth: width }}
        {...rest}
      >
        {(title || description) && (
          <div className="sf-dialog__head">
            <div className="sf-dialog__titles">
              {title && <div className="sf-dialog__title">{title}</div>}
              {description && <div className="sf-dialog__desc">{description}</div>}
            </div>
            <button className="sf-dialog__close" aria-label="Close" onClick={onClose}>
              <Icon name="x" size={16} />
            </button>
          </div>
        )}
        <div className="sf-dialog__body sf-dialog__body--pad">{children}</div>
        {footer && <div className="sf-dialog__foot">{footer}</div>}
      </div>
    </div>
  );
}
