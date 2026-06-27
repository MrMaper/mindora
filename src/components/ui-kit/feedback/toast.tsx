import * as React from "react";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

const TONES: Record<string, { icon: IconName; color: string }> = {
  info:    { icon: "circle",          color: "var(--brand-300)" },
  success: { icon: "circle-check",    color: "var(--status-done)" },
  warning: { icon: "alert-triangle",  color: "var(--status-progress)" },
  danger:  { icon: "alert-triangle",  color: "var(--status-blocked)" },
};

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: "info" | "success" | "warning" | "danger";
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
}

export function Toast({
  tone = "info",
  title,
  description,
  actionLabel,
  onAction,
  onClose,
  className = "",
  ...rest
}: ToastProps): React.JSX.Element {
  const t = TONES[tone] ?? TONES.info;

  return (
    <div className={`sf-toast${className ? ` ${className}` : ""}`} role="status" {...rest}>
      <span className="sf-toast__icon" style={{ color: t.color }}>
        <Icon name={t.icon} size={16} />
      </span>
      <div className="sf-toast__body">
        <div className="sf-toast__title">{title}</div>
        {description && <div className="sf-toast__desc">{description}</div>}
        {actionLabel && (
          <button className="sf-toast__action" onClick={onAction}>{actionLabel}</button>
        )}
      </div>
      {onClose && (
        <button className="sf-toast__close" aria-label="Dismiss" onClick={onClose}>
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}
