"use client";

import { toast as sonnerToast, type ToastT, type ExternalToast } from "sonner";
import { Icon } from "../foundation/icon";
import type { IconName } from "../foundation/icon";

const TONES: Record<string, { icon: IconName; variant?: "default" | "success" | "error" | "warning" | "info" }> = {
  info: { icon: "circle", variant: "info" },
  success: { icon: "circle-check", variant: "success" },
  warning: { icon: "alert-triangle", variant: "warning" },
  danger: { icon: "alert-triangle", variant: "error" },
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
  ...rest
}: ToastProps): React.JSX.Element {
  // This component is used for inline display, not for programmatic toasts
  const t = TONES[tone];

  return (
    <div
      className={`flex items-start gap-2.5 w-85 rounded-md border border-border-default bg-bg-raised p-3 shadow-lg ${rest.className ?? ""}`}
      role="status"
      {...rest}
    >
      <span className="flex-shrink-0 size-5 flex items-center justify-center">
        <Icon name={t.icon} size={16} className={
          tone === "success" ? "text-green-500" :
          tone === "danger" ? "text-red-500" :
          tone === "warning" ? "text-amber-500" :
          "text-brand-500"
        } />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{title}</div>
        {description && <div className="text-sm text-text-secondary mt-0.5">{description}</div>}
        {actionLabel && onAction && (
          <button
            className="mt-2 text-xs font-medium text-brand-600 hover:underline"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
      {onClose && (
        <button
          className="flex-shrink-0 size-5 flex items-center justify-center text-text-tertiary hover:text-text-primary rounded-control hover:bg-bg-hover transition-colors"
          aria-label="Dismiss"
          onClick={onClose}
        >
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  );
}

// Programmatic toast API
export const toast = {
  info: (title: string, options?: ExternalToast) => sonnerToast.info(title, options),
  success: (title: string, options?: ExternalToast) => sonnerToast.success(title, options),
  warning: (title: string, options?: ExternalToast) => sonnerToast.warning(title, options),
  danger: (title: string, options?: ExternalToast) => sonnerToast.error(title, options),
  error: (title: string, options?: ExternalToast) => sonnerToast.error(title, options),
  loading: (title: string, options?: ExternalToast) => sonnerToast.loading(title, options),
  promise: <T,>(promise: Promise<T>, messages: { loading: string; success: string; error: string }) =>
    sonnerToast.promise(promise, messages),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
  remove: (id?: string | number) => sonnerToast.dismiss(id),
};