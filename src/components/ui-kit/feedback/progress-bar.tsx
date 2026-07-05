import * as React from "react";
import { Progress as ShadcnProgress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({
  value,
  max = 100,
  variant = "default",
  size = "md",
  showLabel = false,
  label,
  className = "",
  ...rest
}: ProgressBarProps): React.JSX.Element {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  const variantClass = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-amber-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
  }[variant];

  const sizeClass = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3",
  }[size];

  return (
    <div className={cn("w-full", className)} {...rest}>
      <ShadcnProgress
        value={percentage}
        className={cn(sizeClass, "relative overflow-hidden rounded-full bg-muted")}
      >
        <div
          className={cn(
            "h-full w-full flex-1 rounded-full transition-all duration-300 ease-out",
            variantClass,
          )}
          style={{ transform: `translateX(-${100 - percentage}%)` }}
        />
      </ShadcnProgress>
      {(showLabel || label) && (
        <div className="mt-1.5 text-xs text-text-tertiary flex justify-between">
          <span>{label ?? ""}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}